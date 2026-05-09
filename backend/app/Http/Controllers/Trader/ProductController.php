<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Http\Requests\Trader\ProductRequest;
use App\Models\Product;
use App\Services\CloudinaryService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    use ApiResponse;

    protected $cloudinary;

    public function __construct(CloudinaryService $cloudinary)
    {
        $this->cloudinary = $cloudinary;
    }

    /**
     * List all products for the authenticated trader.
     */
    public function index(Request $request): JsonResponse
    {
        $trader = $request->user()->trader;

        if (!$trader) {
            return $this->error('Trader profile not found.', 'NOT_FOUND', 404);
        }

        $products = Product::where('trader_id', $trader->id)
            ->with('category')
            ->latest()
            ->paginate(15);

        return $this->success($products);
    }

    /**
     * Display a single product.
     */
    public function show(Product $product): JsonResponse
    {
        $this->authorizeProduct($product);
        $product->load('category');
        return $this->success($product);
    }

    /**
     * Store a new product.
     */
    public function store(ProductRequest $request): JsonResponse
    {
        $trader = $request->user()->trader;

        if (!$trader) {
            return $this->error('Please complete your trader profile setup first.', 'PROFILE_INCOMPLETE', 403);
        }

        if (!$trader->stall_id) {
            return $this->error('Your stall has not been allocated by the admin yet.', 'STALL_PENDING', 403);
        }

        $data = $request->validated();
        $data['trader_id'] = $trader->id;
        $data['stock_status'] = 'available';

        // Handle Image Upload
        if ($request->hasFile('image')) {
            $imageUrl = $this->cloudinary->uploadImage($request->file('image'), 'products');
            if (!$imageUrl) {
                return $this->error('Image upload failed.', 'UPLOAD_FAILED', 500);
            }
            $data['image_url'] = $imageUrl;
        }

        $product = Product::create($data);

        return $this->success($product, 'Product added successfully.', 201);
    }

    /**
     * Update an existing product.
     */
    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        $trader = $request->user()->trader;
        
        if (!$trader || $product->trader_id !== $trader->id) {
            return $this->error('Unauthorized to modify this product.', 'UNAUTHORIZED', 403);
        }

        $data = $request->validated();

        // Handle Image Update
        if ($request->hasFile('image')) {
            // Delete old image if it exists
            if ($product->image_url) {
                $this->cloudinary->deleteImage($product->image_url);
            }

            $imageUrl = $this->cloudinary->uploadImage($request->file('image'), 'products');
            $data['image_url'] = $imageUrl;
        }

        $product->update($data);

        return $this->success($product, 'Product updated successfully.');
    }

    /**
     * Remove a product.
     */
    public function destroy(Product $product): JsonResponse
    {
        $this->authorizeProduct($product);

        if ($product->image_url) {
            $this->cloudinary->deleteImage($product->image_url);
        }

        $product->delete();

        return $this->success(null, 'Product deleted successfully.');
    }

    /**
     * Toggle stock status quickly.
     */
    public function toggleStatus(Request $request, Product $product): JsonResponse
    {
        $this->authorizeProduct($product);

        $request->validate([
            'stock_status' => 'required|in:available,low,out_of_stock'
        ]);

        $product->update(['stock_status' => $request->stock_status]);

        return $this->success($product, 'Stock status updated.');
    }

    /**
     * Helper to ensure the trader owns the product.
     */
    protected function authorizeProduct(Product $product): void
    {
        $user = Auth::user();

        if (!$user || !$user->trader || $product->trader_id !== $user->trader->id) {
            abort(403, 'Unauthorized to modify this product.');
        }
    }
}
