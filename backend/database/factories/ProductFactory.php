<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Trader;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $category = Category::first() ?? Category::create([
            'name'    => 'General',
            'name_sw' => 'Jumla',
        ]);

        return [
            'trader_id'    => Trader::factory(),
            'category_id'  => $category->id,
            'name'         => fake()->words(2, true),
            'price'        => fake()->randomFloat(2, 50, 1000),
            'unit'         => 'piece',
            'stock_status' => 'available',
            'is_active'    => true,
        ];
    }
}
