<?php

namespace App\Http\Controllers\Resident;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Product;
use App\Services\NotificationService;
use App\Traits\ApiResponse;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class ReservationController extends Controller
{
    use ApiResponse;

    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Update reservation status (Trader only).
     */
    public function updateStatus($id, Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:ready,completed,cancelled',
        ]);

        $reservation = Reservation::findOrFail($id);
        $user = Auth::user();

        // Security check: Only the trader who owns the product can update status
        if ($reservation->trader_id !== $user->trader?->id) {
            return $this->error('Unauthorized. (Huruhusiwi kubadilisha hali ya uhifadhi huu.)', 'UNAUTHORIZED', 403);
        }

        $reservation->update(['status' => $request->status]);

        // Trigger Notification
        $this->notificationService->notifyReservationUpdate(
            $reservation->resident, 
            $reservation, 
            $request->status
        );

        return $this->success($reservation, 'Status updated. (Hali ya uhifadhi imesasishwa.)');
    }

    /**
     * List reservations for the authenticated resident, with optional status filter.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $query = Reservation::where('resident_id', $user->id)
            ->with(['trader', 'product'])
            ->latest();

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $reservations = $query->paginate(15);

        return $this->success($reservations);
    }

    /**
     * Create multiple reservations at once (Global Cart checkout).
     * Now supports items from different traders.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($request) {
            $user = Auth::user();
            $totalCartAmount = 0;
            $createdReservations = [];

            // Preliminary check and total calculation
            foreach ($request->items as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $totalCartAmount += $product->price * $itemData['quantity'];
            }

            $serviceFeeAmount = SystemSetting::get('resident_service_fee', 10.00);
            $serviceFeeThreshold = SystemSetting::get('service_fee_threshold', 200.00);
            $applyFee = $totalCartAmount > $serviceFeeThreshold;
            
            foreach ($request->items as $index => $itemData) {
                $product = Product::with('trader')->findOrFail($itemData['product_id']);

                // Availability check
                if (!$product->is_active || $product->stock_status === 'out_of_stock') {
                    throw new \Exception("Product {$product->name} is not available.");
                }

                if ($product->stock_quantity !== null && $product->stock_quantity < $itemData['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}.");
                }

                // Generate Unique Reservation Code
                $code = 'SM-' . strtoupper(Str::random(6));
                while (Reservation::where('reservation_code', $code)->exists()) {
                    $code = 'SM-' . strtoupper(Str::random(6));
                }

                // Apply service fee only once to the first item in the whole cart if total > threshold
                $currentServiceFee = ($index === 0 && $applyFee) ? $serviceFeeAmount : 0.00;
                $subtotal = $product->price * $itemData['quantity'];
                $totalAmount = $subtotal + $currentServiceFee;

                $reservation = Reservation::create([
                    'reservation_code' => $code,
                    'resident_id' => $user->id,
                    'trader_id' => $product->trader_id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $product->price,
                    'service_fee' => $currentServiceFee,
                    'total_amount' => $totalAmount,
                    'status' => 'pending',
                    'pickup_deadline' => now()->addHours(24),
                ]);

                // Update Stock
                if ($product->stock_quantity !== null) {
                    $product->stock_quantity -= $itemData['quantity'];
                    if ($product->stock_quantity <= 0) {
                        $product->stock_status = 'out_of_stock';
                        $product->stock_quantity = 0;
                    } elseif ($product->stock_quantity <= 5) {
                        $product->stock_status = 'low';
                    }
                    $product->save();
                }

                $product->increment('total_reservations');
                
                // Notify Trader
                if ($product->trader && $product->trader->user) {
                    $this->notificationService->send(
                        $product->trader->user,
                        'New Reservation',
                        "New reservation for {$product->name} (Qty: {$itemData['quantity']})",
                        'reservation',
                        ['reservation_id' => $reservation->id]
                    );
                }

                $createdReservations[] = $reservation->load('product', 'trader');
            }

            return $this->success($createdReservations, 'Global cart reservations created successfully.', 201);
        });
    }

    /**
     * Create a new reservation.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        $product = Product::findOrFail($request->product_id);

        // 1. Check Product availability
        if (!$product->is_active || $product->stock_status === 'out_of_stock') {
            return $this->error('Product not currently available. (Bidhaa hii haipatikani kwa sasa.)', 'NOT_AVAILABLE', 422);
        }

        if ($product->stock_quantity !== null && $product->stock_quantity < $request->quantity) {
            return $this->error('Insufficient stock available. (Bidhaa haitoshi.)', 'INSUFFICIENT_STOCK', 422);
        }

        return DB::transaction(function () use ($request, $product) {
            $user = Auth::user();
            
            // 2. Generate Unique Reservation Code
            $code = 'SM-' . strtoupper(Str::random(6));
            while (Reservation::where('reservation_code', $code)->exists()) {
                $code = 'SM-' . strtoupper(Str::random(6));
            }

            $serviceFeeAmount = SystemSetting::get('resident_service_fee', 10.00);
            $serviceFeeThreshold = SystemSetting::get('service_fee_threshold', 200.00);
            $subtotal = $product->price * $request->quantity;
            
            $serviceFee = ($subtotal > $serviceFeeThreshold) ? $serviceFeeAmount : 0.00;
            $totalAmount = $subtotal + $serviceFee;

            // 3. Create Reservation
            $reservation = Reservation::create([
                'reservation_code' => $code,
                'resident_id' => $user->id,
                'trader_id' => $product->trader_id,
                'product_id' => $product->id,
                'quantity' => $request->quantity,
                'unit_price' => $product->price,
                'service_fee' => $serviceFee,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'notes' => $request->notes,
                'pickup_deadline' => now()->addHours(24), // Default 24h pickup window
            ]);

            // 4. Update Product Stock
            if ($product->stock_quantity !== null) {
                $product->stock_quantity -= $request->quantity;
                
                if ($product->stock_quantity <= 0) {
                    $product->stock_status = 'out_of_stock';
                    $product->stock_quantity = 0;
                } elseif ($product->stock_quantity <= 5) {
                    $product->stock_status = 'low';
                }
                
                $product->save();
            }

            // 5. Update Product Lifetime Reservations
            $product->increment('total_reservations');

            return $this->success($reservation, 'Reservation created successfully. (Bidhaa imehifadhiwa.)', 201);
        });
    }

    /**
     * View details of a single reservation.
     */
    public function show(Reservation $reservation): JsonResponse
    {
        $user = Auth::user();
        
        if ($reservation->resident_id !== $user->id && $reservation->trader_id !== $user->trader?->id) {
            return $this->error('Unauthorized access. (Huruhusiwi kuona hii.)', 'UNAUTHORIZED', 403);
        }

        $reservation->load(['trader', 'product', 'resident', 'review']);

        return $this->success($reservation);
    }

    /**
     * Return the pickup code for a reservation (resident-facing QR page).
     */
    public function pickupCode(Reservation $reservation): JsonResponse
    {
        $user = Auth::user();

        if ($reservation->resident_id !== $user->id) {
            return $this->error('Unauthorized.', 'UNAUTHORIZED', 403);
        }

        return $this->success([
            'reservation_code' => $reservation->reservation_code,
            'status'           => $reservation->status,
            'product'          => $reservation->product?->name,
            'trader'           => $reservation->trader?->business_name,
            'stall'            => $reservation->trader?->stall?->stall_number,
            'pickup_deadline'  => $reservation->pickup_deadline,
        ]);
    }

    /**
     * Resident cancels their own pending/paid reservation.
     */
    public function cancel(Reservation $reservation): JsonResponse
    {
        $user = Auth::user();

        if ($reservation->resident_id !== $user->id) {
            return $this->error('Unauthorized.', 'UNAUTHORIZED', 403);
        }

        if (!in_array($reservation->status, ['pending', 'paid'])) {
            return $this->error('Only pending or paid reservations can be cancelled.', 'CANNOT_CANCEL', 422);
        }

        $reservation->update(['status' => 'cancelled']);

        // Restore stock if quantity was tracked
        if ($reservation->product && $reservation->product->stock_quantity !== null) {
            $reservation->product->increment('stock_quantity', $reservation->quantity);
            if ($reservation->product->stock_status === 'out_of_stock') {
                $reservation->product->update(['stock_status' => 'low']);
            }
        }

        return $this->success($reservation, 'Reservation cancelled successfully.');
    }
}
