<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

/**
 * Read-only product detail for residents.
 *
 * Trader\ProductController@show is scoped to the product's owner (it calls
 * authorizeProduct), so a resident has no way to read a product by id. The
 * Soko AI needs exactly that to drop an item into the resident's cart, which
 * lives in the browser (Zustand) and therefore needs the full product payload.
 */
class ProductCatalogController extends Controller
{
    use ApiResponse;

    /**
     * Show a single live product with the fields the cart renders.
     */
    public function show(Product $product): JsonResponse
    {
        // Delisted products are hidden everywhere else in the resident app.
        if (!$product->is_active) {
            return $this->error('This product is no longer available.', 'PRODUCT_NOT_FOUND', 404);
        }

        $product->load([
            'category:id,name,name_sw',
            'trader:id,user_id,business_name,avatar_url,is_open,verification_status',
        ]);

        return $this->success($product);
    }
}
