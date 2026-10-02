<?php

namespace App\Http\Requests\Trader;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only traders can manage products
        return $this->user()->role === 'trader';
    }

    public function rules(): array
    {
        $isPost = $this->isMethod('post');

        return [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'name_sw' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0|lt:price',
            'discount_start_date' => 'nullable|date',
            'discount_end_date' => 'nullable|date|after_or_equal:discount_start_date',
            'unit' => 'required|string|max:50', // e.g., kg, piece, bunch
            'stock_quantity' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:5120', // 5MB limit
            'is_active' => 'nullable|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'A product image is required.',
            'price.numeric' => 'Price must be a valid number.',
        ];
    }
}
