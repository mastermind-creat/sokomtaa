<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class LoginRequest extends FormRequest
{
    use \App\Traits\PhoneNormalization;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalise the phone number before validation runs (phone path only).
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('phone') && filled($this->input('phone'))) {
            $this->merge([
                'phone' => $this->normalizePhone($this->phone),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'phone'    => ['nullable', 'string'],
            'email'    => ['nullable', 'email:rfc'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Enforce mutual exclusivity: exactly one of phone or email must be present.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $hasPhone = filled($this->input('phone'));
            $hasEmail = filled($this->input('email'));

            if (!$hasPhone && !$hasEmail) {
                $validator->errors()->add(
                    'identifier',
                    'Please provide either a phone number or an email address.'
                );
            }

            if ($hasPhone && $hasEmail) {
                $validator->errors()->add(
                    'identifier',
                    'Please provide either a phone number or an email address, not both.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'email.email' => 'The email address format is invalid.',
            'password.required' => 'A password is required.',
        ];
    }
}
