<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Single smart field — accepts phone number or email address
            'identifier' => ['required', 'string', 'max:255'],
            'password'   => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'identifier.required' => 'Please enter your phone number or email address.',
            'password.required'   => 'A password is required.',
        ];
    }
}
