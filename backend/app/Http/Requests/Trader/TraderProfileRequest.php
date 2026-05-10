<?php

namespace App\Http\Requests\Trader;

use Illuminate\Foundation\Http\FormRequest;

class TraderProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stall_type' => 'required|in:managed,independent',
            'market_id' => 'nullable|exists:markets,id',
            'business_name' => 'required|string|max:255',
            'business_name_sw' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'stall_number' => 'nullable|string|exists:stalls,stall_number',
            'latitude' => 'nullable|required_if:stall_type,independent|numeric|between:-90,90',
            'longitude' => 'nullable|required_if:stall_type,independent|numeric|between:-180,180',
            'mpesa_number' => 'nullable|string|max:20',
            'permit_number' => 'nullable|string|max:255',
            'avatar_url' => 'nullable|string',
            'banner_url' => 'nullable|string',
            'opening_time' => 'nullable|string|regex:/^[0-2][0-9]:[0-5][0-9]$/',
            'closing_time' => 'nullable|string|regex:/^[0-2][0-9]:[0-5][0-9]$/',
        ];
    }

    public function messages(): array
    {
        return [
            'stall_number.exists' => 'Nambari ya kibanda haitambuliki katika soko hili. (Stall number not recognized in this market.)',
            'market_id.exists' => 'Soko lililochaguliwa halipo. (Selected market does not exist.)',
        ];
    }
}
