<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Fruits',
                'name_sw' => 'Matunda',
                'icon' => 'Apple',
                'color' => '#EF4444',
            ],
            [
                'name' => 'Vegetables',
                'name_sw' => 'Mboga',
                'icon' => 'LeafyGreen',
                'color' => '#10B981',
            ],
            [
                'name' => 'Cereals',
                'name_sw' => 'Nafaka',
                'icon' => 'Wheat',
                'color' => '#F59E0B',
            ],
            [
                'name' => 'Meat & Fish',
                'name_sw' => 'Nyama na Samaki',
                'icon' => 'Fish',
                'color' => '#B91C1C',
            ],
            [
                'name' => 'Dairy',
                'name_sw' => 'Maziwa',
                'icon' => 'Milk',
                'color' => '#3B82F6',
            ],
            [
                'name' => 'Clothing',
                'name_sw' => 'Mavazi',
                'icon' => 'Shirt',
                'color' => '#8B5CF6',
            ],
            [
                'name' => 'Household',
                'name_sw' => 'Vifaa vya Nyumbani',
                'icon' => 'Home',
                'color' => '#6B7280',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
