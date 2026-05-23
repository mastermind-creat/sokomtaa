<?php

namespace App\Http\Controllers\Delivery;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\DeliveryProfile;
use App\Models\DeliveryTransaction;
use App\Services\DeliveryService;
use App\Services\NotificationService;
use App\Services\TalkSasaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;

class DeliveryController extends Controller
{
    use ApiResponse;

    protected $deliveryService;
    protected $notificationService;
    protected $smsService;

    public function __construct(
        DeliveryService $deliveryService,
        NotificationService $notificationService,
        TalkSasaService $smsService
    ) {
        $this->deliveryService = $deliveryService;
        $this->notificationService = $notificationService;
        $this->smsService = $smsService;
    }

    /**
     * View orders awaiting delivery within a 50 km radius.
     */
    public function ordersPool(Request $request): JsonResponse
    {
        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
        ]);

        $lat = (float) $request->lat;
        $lng = (float) $request->lng;

        // Boda Boda default active search radius of 50 km
        $radius = 50.0;

        $orders = Reservation::where('reservations.delivery_option', true)
            ->where('reservations.delivery_status', 'pending_assignment')
            ->where('reservations.status', 'ready')
            ->with(['trader.market', 'product', 'resident'])
            ->get()
            ->map(function ($reservation) use ($lat, $lng) {
                $pickupLat = $reservation->trader->market?->latitude ?? $reservation->trader->latitude;
                $pickupLng = $reservation->trader->market?->longitude ?? $reservation->trader->longitude;

                if ($pickupLat && $pickupLng) {
                    $reservation->distance_to_pickup_km = round($this->deliveryService->calculateDistance(
                        $lat, $lng, (float)$pickupLat, (float)$pickupLng
                    ), 2);
                } else {
                    $reservation->distance_to_pickup_km = 999.0;
                }
                return $reservation;
            })
            ->filter(function ($reservation) use ($radius) {
                return $reservation->distance_to_pickup_km <= $radius;
            })
            ->sortBy('distance_to_pickup_km')
            ->values();

        return $this->success($orders, 'Awaiting deliveries retrieved successfully.');
    }

    /**
     * Accept a pending delivery order.
     */
    public function acceptOrder($id): JsonResponse
    {
        $reservation = Reservation::findOrFail($id);
        $user = Auth::user();

        if ($reservation->delivery_status !== 'pending_assignment') {
            return $this->error('This order has already been assigned to another rider.', 'ALREADY_ASSIGNED', 422);
        }

        $reservation->update([
            'delivery_rider_id' => $user->id,
            'delivery_status' => 'assigned',
        ]);

        // Send Notification to Resident
        $this->notificationService->send(
            $reservation->resident,
            'Delivery Assigned',
            "Your order is assigned to rider {$user->name} ({$user->phone}). They will pick it up shortly.",
            'delivery',
            ['reservation_id' => $reservation->id]
        );

        return $this->success($reservation, 'Order accepted successfully.');
    }

    /**
     * Mark delivery as picked up and package in transit.
     */
    public function pickupOrder($id): JsonResponse
    {
        $reservation = Reservation::findOrFail($id);
        $user = Auth::user();

        if ($reservation->delivery_rider_id !== $user->id) {
            return $this->error('You are not the assigned rider for this delivery.', 'UNAUTHORIZED', 403);
        }

        if ($reservation->delivery_status !== 'assigned') {
            return $this->error('Order must be assigned to pick it up.', 'INVALID_STATUS', 422);
        }

        $reservation->update([
            'delivery_status' => 'picked_up',
            'status' => 'ready', // Ensures the state is synchronized in the system
        ]);

        // Send Alert to Resident
        $this->notificationService->send(
            $reservation->resident,
            'Package in Transit',
            "Rider {$user->name} has picked up your order and is now in transit to your location.",
            'delivery',
            ['reservation_id' => $reservation->id]
        );

        return $this->success($reservation, 'Order marked as picked up.');
    }

    /**
     * Alert resident via in-app notification and SMS that the rider has arrived.
     */
    public function notifyArrival($id): JsonResponse
    {
        $reservation = Reservation::findOrFail($id);
        $user = Auth::user();

        if ($reservation->delivery_rider_id !== $user->id) {
            return $this->error('You are not the assigned rider for this delivery.', 'UNAUTHORIZED', 403);
        }

        // Send In-app Alert
        $this->notificationService->send(
            $reservation->resident,
            'Rider Arrived!',
            "Rider {$user->name} has arrived at your address with your package! Please meet them to pick up.",
            'delivery',
            ['reservation_id' => $reservation->id]
        );

        // Send TalkSasa SMS Alert
        $smsMessage = "Soko Mtaa: Your delivery rider {$user->name} has arrived at your location with your order! Please meet them to collect it. Code: {$reservation->reservation_code}";
        $this->smsService->sendSms($reservation->resident->phone, $smsMessage);

        return $this->success(null, 'Arrival alerts sent successfully.');
    }

    /**
     * Enter resident's code to complete the delivery and release the 50/50 payout.
     */
    public function completeDelivery(Request $request, $id): JsonResponse
    {
        $request->validate([
            'pickup_code' => 'required|string',
        ]);

        $reservation = Reservation::findOrFail($id);
        $user = Auth::user();

        if ($reservation->delivery_rider_id !== $user->id) {
            return $this->error('You are not the assigned rider for this delivery.', 'UNAUTHORIZED', 403);
        }

        // Verify pickup code matches reservation code
        if (strtoupper(trim($request->pickup_code)) !== strtoupper($reservation->reservation_code)) {
            return $this->error('The verification code is incorrect. Please check with the customer.', 'INVALID_CODE', 422);
        }

        try {
            // Mark as 'in_transit' temporarily if it was 'picked_up' so the service transitions correctly
            if ($reservation->delivery_status === 'picked_up') {
                $reservation->update(['delivery_status' => 'in_transit']);
            }

            // Execute payout distribution
            $this->deliveryService->executeDeliveryPayout($reservation);

            // Notify Resident
            $this->notificationService->send(
                $reservation->resident,
                'Delivery Successful',
                "Your order has been successfully delivered! Thank you for shopping with Soko Mtaa.",
                'delivery',
                ['reservation_id' => $reservation->id]
            );

            // Notify Trader
            if ($reservation->trader && $reservation->trader->user) {
                $this->notificationService->send(
                    $reservation->trader->user,
                    'Order Delivered',
                    "Rider {$user->name} has completed the delivery for order {$reservation->reservation_code}.",
                    'delivery',
                    ['reservation_id' => $reservation->id]
                );
            }

            return $this->success($reservation->fresh(), 'Delivery completed successfully and earnings released.');

        } catch (Exception $e) {
            return $this->error('Failed to complete delivery: ' . $e->getMessage(), 'PAYOUT_FAILED', 500);
        }
    }

    /**
     * Get stats, wallet balance, and recent transaction log for rider.
     */
    public function stats(): JsonResponse
    {
        $user = Auth::user();
        $profile = DeliveryProfile::where('user_id', $user->id)->firstOrFail();

        $completedCount = Reservation::where('delivery_rider_id', $user->id)
            ->where('delivery_status', 'delivered')
            ->count();

        $activeCount = Reservation::where('delivery_rider_id', $user->id)
            ->whereIn('delivery_status', ['assigned', 'picked_up', 'in_transit'])
            ->count();

        $transactions = DeliveryTransaction::where('user_id', $user->id)
            ->with('reservation.product')
            ->latest()
            ->limit(10)
            ->get();

        $activeOrders = Reservation::where('delivery_rider_id', $user->id)
            ->whereIn('delivery_status', ['assigned', 'picked_up', 'in_transit'])
            ->with(['trader.market', 'product', 'resident'])
            ->latest()
            ->get();

        $todayEarnings = DeliveryTransaction::where('user_id', $user->id)
            ->whereDate('created_at', today())
            ->sum('amount');

        return $this->success([
            'profile'              => $profile,
            'completed_deliveries' => $completedCount,
            'active_deliveries'    => $activeCount,
            'recent_transactions'  => $transactions,
            'active_orders'        => $activeOrders,
            'today_earnings'       => (float) $todayEarnings,
        ], 'Rider stats retrieved successfully.');
    }

    /**
     * Toggle rider availability online/offline.
     */
    public function toggleAvailability(): JsonResponse
    {
        $user = Auth::user();
        $profile = DeliveryProfile::where('user_id', $user->id)->firstOrFail();

        $profile->update([
            'is_available' => !$profile->is_available
        ]);

        return $this->success($profile, 'Availability toggled successfully.');
    }

    /**
     * Update current rider coordinates.
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $request->validate([
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $user = Auth::user();
        $profile = DeliveryProfile::where('user_id', $user->id)->firstOrFail();

        $profile->update([
            'latitude'  => $request->latitude,
            'longitude' => $request->longitude,
        ]);

        return $this->success($profile, 'Location updated successfully.');
    }

    /**
     * Browse ALL pending-assignment deliveries (no geo filter).
     * Allows riders to see what's available even when offline.
     */
    public function pendingShipments(): JsonResponse
    {
        $orders = Reservation::where('delivery_option', true)
            ->where('delivery_status', 'pending_assignment')
            ->where('status', 'ready')
            ->with(['trader.market', 'product', 'resident'])
            ->latest()
            ->get()
            ->map(function ($r) {
                return [
                    'id'                   => $r->id,
                    'reservation_code'     => $r->reservation_code,
                    'delivery_address'     => $r->delivery_address,
                    'delivery_fee'         => $r->delivery_fee,
                    'rider_fee'            => $r->rider_fee,
                    'status'               => $r->status,
                    'delivery_status'      => $r->delivery_status,
                    'quantity'             => $r->quantity,
                    'total_amount'         => $r->total_amount,
                    'created_at'           => $r->created_at,
                    'product'              => $r->product ? [
                        'id'        => $r->product->id,
                        'name'      => $r->product->name,
                        'image_url' => $r->product->image_url,
                        'unit'      => $r->product->unit,
                    ] : null,
                    'trader'               => $r->trader ? [
                        'id'            => $r->trader->id,
                        'business_name' => $r->trader->business_name,
                        'stall_id'      => $r->trader->stall_id,
                        'market'        => $r->trader->market ? [
                            'name'     => $r->trader->market->name,
                            'location' => $r->trader->market->location,
                        ] : null,
                    ] : null,
                ];
            });

        return $this->success($orders, 'Pending shipments retrieved.');
    }

    /**
     * Submit KYC documents for rider verification.
     * Transitions status from 'not_submitted' → 'pending' (under admin review).
     */
    public function submitKyc(Request $request): JsonResponse
    {
        $request->validate([
            'id_front_url'           => 'required|string|url',
            'id_back_url'            => 'required|string|url',
            'face_verification_url'  => 'required|string|url',
            'id_document_url'        => 'sometimes|nullable|string|url',
            'license_image_url'      => 'sometimes|nullable|string|url',
            'vehicle_type'           => 'sometimes|string|max:50',
            'license_plate'          => 'sometimes|nullable|string|max:20',
            'license_number'         => 'sometimes|nullable|string|max:50',
        ]);

        $user = Auth::user();
        $profile = DeliveryProfile::where('user_id', $user->id)->firstOrFail();

        if ($profile->verification_status === 'verified') {
            return $this->error('Your account is already verified.', 'ALREADY_VERIFIED', 422);
        }

        $profile->update([
            'id_document_url'    => $request->id_document_url ?? $request->id_front_url,
            'id_front_url'       => $request->id_front_url,
            'id_back_url'        => $request->id_back_url,
            'face_verification_url' => $request->face_verification_url,
            'license_image_url'  => $request->license_image_url,
            'vehicle_type'       => $request->vehicle_type ?? $profile->vehicle_type,
            'license_plate'      => $request->license_plate ?? $profile->license_plate,
            'license_number'     => $request->license_number ?? $profile->license_number,
            'verification_status' => 'pending', // Now under admin review
            'kyc_submitted_at'   => now(),
        ]);

        // Notify admin (best-effort — don't fail if notification fails)
        try {
            $admins = \App\Models\User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $this->notificationService->send(
                    $admin,
                    'New Rider KYC Submission',
                    "Rider {$user->name} ({$user->phone}) has submitted KYC documents for review.",
                    'kyc',
                    ['rider_user_id' => $user->id]
                );
            }
        } catch (Exception $e) {
            // Non-fatal — log and continue
        }

        return $this->success($profile->fresh(), 'KYC documents submitted successfully. An administrator will review them shortly.');
    }

    /**
     * Get the current rider's KYC / profile details.
     */
    public function profile(): JsonResponse
    {
        $user = Auth::user();
        $profile = DeliveryProfile::where('user_id', $user->id)->firstOrFail();
        return $this->success($profile, 'Rider profile retrieved.');
    }
}
