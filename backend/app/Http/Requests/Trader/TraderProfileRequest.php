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
        // On setup (POST /trader/setup) stall_type is required.
        // On update (PUT /trader/update) every field is optional – only
        // the fields that are actually sent will be validated.
        $isSetup = $this->isMethod('POST') && str_contains($this->url(), '/setup');

        return [
            // ── Core Business Info ──────────────────────────────────────────
            'business_name'    => $isSetup ? 'required|string|max:255' : 'sometimes|string|max:255',
            'business_name_sw' => 'sometimes|nullable|string|max:255',
            'description'      => 'sometimes|nullable|string',

            // ── Stall / Market ──────────────────────────────────────────────
            'stall_type'   => 'sometimes|in:managed,independent',
            'market_id'    => 'sometimes|nullable|exists:markets,id',
            'stall_number' => 'sometimes|nullable|string',

            // ── Location (only required when stall_type === 'independent') ──
            'latitude'  => 'sometimes|nullable|numeric|between:-90,90',
            'longitude' => 'sometimes|nullable|numeric|between:-180,180',

            // ── Contact / Payment ───────────────────────────────────────────
            'mpesa_number'  => 'sometimes|nullable|string|max:20',
            'permit_number' => 'sometimes|nullable|string|max:255',

            // ── Trading Hours ───────────────────────────────────────────────
            'opening_time' => 'sometimes|nullable|string',
            'closing_time' => 'sometimes|nullable|string',
            'is_open'      => 'sometimes|boolean',

            // ── Image / Document file uploads (multipart) ───────────────────
            'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,webp|max:5120',
            'banner' => 'sometimes|image|mimes:jpeg,png,jpg,webp|max:5120',
            'permit' => 'sometimes|image|mimes:jpeg,png,jpg,webp|max:5120',

            // ── Cloudinary URL fields (client-side upload result) ────────────
            // These are sent as plain strings after the frontend uploads to
            // Cloudinary directly and then PUTs the resulting URL to update.
            'avatar_url'       => 'sometimes|nullable|string|max:2048',
            'banner_url'       => 'sometimes|nullable|string|max:2048',
            'permit_image_url' => 'sometimes|nullable|string|max:2048',
            'id_front_url'     => 'sometimes|nullable|string|max:2048',
            'id_back_url'      => 'sometimes|nullable|string|max:2048',
            'selfie_url'       => 'sometimes|nullable|string|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'stall_number.exists' => 'Nambari ya kibanda haitambuliki. (Stall number not recognized in this market.)',
            'market_id.exists'    => 'Soko lililochaguliwa halipo. (Selected market does not exist.)',
            'business_name.required' => 'Business name is required to set up your profile.',
        ];
    }
}
