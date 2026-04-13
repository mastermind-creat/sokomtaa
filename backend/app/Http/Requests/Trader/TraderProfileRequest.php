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
            'market_id' => 'required|exists:markets,id',
            'business_name' => 'required|string|max:255',
            'business_name_sw' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'stall_number' => 'required|string|exists:stalls,stall_number',
            'mpesa_number' => 'nullable|string|max:20',
            'permit_number' => 'nullable|string|max:255',
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
