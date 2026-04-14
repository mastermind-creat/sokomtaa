<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data'    => Category::all(),
        ]);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name',
            'name_sw' => 'required|string|max:255|unique:categories,name_sw',
            'icon' => 'nullable|string|max:100',
            'color' => 'nullable|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors'  => $validator->errors()
            ], 422);
        }

        $category = Category::create([
            'name' => $request->name,
            'name_sw' => $request->name_sw,
            'icon' => $request->icon ?? 'Package',
            'color' => $request->color ?? '#1B6B3A',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data'    => $category
        ], 201);
    }
}
