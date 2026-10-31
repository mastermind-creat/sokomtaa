<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class RegisterRequest extends FormRequest
{
    use \App\Traits\PhoneNormalization;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $this->merge(['phone' => $this->normalizePhone($this->phone)]);
        }
    }

    public function rules(): array
    {
        return [
            'name'                => ['required', 'string', 'max:255'],
            'phone'               => ['required', 'string', 'max:20', 'unique:users'],
            'email'               => ['nullable', 'email', 'max:255', 'unique:users'],
            // email is required when verification_method is 'email'
            'verification_method' => ['required', 'string', 'in:sms,email'],
            'password'            => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers()->symbols()->mixedCase(),
            ],
            'role'               => ['required', 'string', 'in:trader,resident,delivery'],
            'national_id'        => ['nullable', 'string', 'max:50'],
            'preferred_language' => ['nullable', 'string', 'in:en,sw'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            // If user chose email verification, email must be present
            if ($this->input('verification_method') === 'email' && !filled($this->input('email'))) {
                $v->errors()->add('email', 'An email address is required when using email verification.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'A phone number is required.',
            'phone.unique'   => 'This phone number is already registered.',
            'email.unique'   => 'This email address is already registered.',
        ];
    }
}
