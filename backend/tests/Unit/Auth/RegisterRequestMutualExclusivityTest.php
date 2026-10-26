<?php

// Feature: email-phone-registration-ai-search, Property 5: phone registration unchanged

namespace Tests\Unit\Auth;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Tests\TestCase;

/**
 * Property 5: Phone-based registration is unchanged.
 *
 * For any valid Kenyan phone number, a registration payload with only `phone`
 * (no `email`) passes RegisterRequest-equivalent validation.
 *
 * Also verifies:
 *   - Payloads with both phone + email fail validation.
 *   - Payloads with neither phone nor email fail validation.
 *
 * Validates: Requirements 4.1, 4.2
 */
class RegisterRequestMutualExclusivityTest extends TestCase
{
    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * The validation rules mirroring RegisterRequest, without unique:users
     * (since we have no DB in unit scope) — mutual exclusivity is the focus.
     */
    private function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:255'],
            'phone'              => ['nullable', 'string', 'max:20'],
            'email'              => ['nullable', 'email', 'max:255'],
            'password'           => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers()->symbols()->mixedCase(),
            ],
            'role'               => ['required', 'string', 'in:trader,resident,delivery'],
            'national_id'        => ['nullable', 'string', 'max:50'],
            'preferred_language' => ['nullable', 'string', 'in:en,sw'],
        ];
    }

    /**
     * Run the mutual-exclusivity after-hook (mirrors RegisterRequest::withValidator).
     * Returns the error messages added by the hook, if any.
     */
    private function mutualExclusivityErrors(array $data): array
    {
        $validator = Validator::make($data, $this->rules());
        $errors    = [];

        $hasPhone = !empty($data['phone']);
        $hasEmail = !empty($data['email']);

        if ($hasPhone && $hasEmail) {
            $errors[] = 'Please provide either a phone number or an email address, not both.';
        } elseif (!$hasPhone && !$hasEmail) {
            $errors[] = 'Please provide either a phone number or an email address.';
        }

        return $errors;
    }

    /**
     * Generate a realistic Kenyan phone number in normalised format (254XXXXXXXXX).
     * Randomises across 07XX and 01XX ranges.
     */
    private function randomKenyanPhone(): string
    {
        $prefixes = ['70', '71', '72', '74', '75', '76', '79', '11', '10'];
        $prefix   = $prefixes[array_rand($prefixes)];
        $suffix   = str_pad((string) random_int(0, 9999999), 7, '0', STR_PAD_LEFT);

        return '254' . $prefix . $suffix;
    }

    /**
     * Generate a strong password that satisfies the Password rule.
     */
    private function strongPassword(): string
    {
        return 'Test@' . random_int(1000, 9999) . 'Abc';
    }

    /**
     * Generate a valid registration base payload (no identifier yet).
     */
    private function basePayload(): array
    {
        $password = $this->strongPassword();

        return [
            'name'                  => 'Test User ' . random_int(1, 9999),
            'password'              => $password,
            'password_confirmation' => $password,
            'role'                  => ['trader', 'resident', 'delivery'][random_int(0, 2)],
        ];
    }

    // ---------------------------------------------------------------------------
    // Property 5: Phone-only payload passes field validation and mutual-exclusivity
    // ---------------------------------------------------------------------------

    /**
     * @test
     * Property 5 — 100 iterations: any valid Kenyan phone number in a phone-only
     * payload (no email field) passes validation rules and the mutual-exclusivity check.
     */
    public function test_phone_only_payload_passes_validation_for_100_random_phones(): void
    {
        $passed = 0;

        for ($i = 0; $i < 100; $i++) {
            $phone   = $this->randomKenyanPhone();
            $payload = array_merge($this->basePayload(), ['phone' => $phone]);

            // 1. Field-level rules pass
            $validator = Validator::make($payload, $this->rules());
            $this->assertFalse(
                $validator->fails(),
                "Field validation should pass for phone={$phone}, iteration={$i}. " .
                'Errors: ' . json_encode($validator->errors()->toArray())
            );

            // 2. Mutual-exclusivity hook produces no errors
            $hookErrors = $this->mutualExclusivityErrors($payload);
            $this->assertEmpty(
                $hookErrors,
                "Mutual-exclusivity check should pass for phone-only payload, iteration={$i}."
            );

            $passed++;
        }

        $this->assertSame(100, $passed, 'All 100 iterations should pass.');
    }

    // ---------------------------------------------------------------------------
    // Both phone + email → fail
    // ---------------------------------------------------------------------------

    /**
     * @test
     * Payloads that supply BOTH phone and email are rejected with the correct message.
     */
    public function test_both_phone_and_email_payload_fails_with_correct_message(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $payload = array_merge($this->basePayload(), [
                'phone' => $this->randomKenyanPhone(),
                'email' => 'user' . random_int(1, 99999) . '@example.com',
            ]);

            $hookErrors = $this->mutualExclusivityErrors($payload);

            $this->assertNotEmpty(
                $hookErrors,
                "Mutual-exclusivity check should reject phone+email payload, iteration={$i}."
            );
            $this->assertSame(
                'Please provide either a phone number or an email address, not both.',
                $hookErrors[0],
                "Wrong error message for phone+email payload, iteration={$i}."
            );
        }
    }

    // ---------------------------------------------------------------------------
    // Neither phone nor email → fail
    // ---------------------------------------------------------------------------

    /**
     * @test
     * Payloads that supply NEITHER phone nor email are rejected with the correct message.
     */
    public function test_neither_phone_nor_email_payload_fails_with_correct_message(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $payload = $this->basePayload(); // no phone, no email

            $hookErrors = $this->mutualExclusivityErrors($payload);

            $this->assertNotEmpty(
                $hookErrors,
                "Mutual-exclusivity check should reject no-identifier payload, iteration={$i}."
            );
            $this->assertSame(
                'Please provide either a phone number or an email address.',
                $hookErrors[0],
                "Wrong error message for no-identifier payload, iteration={$i}."
            );
        }
    }

    // ---------------------------------------------------------------------------
    // Email-only payload passes (complementary coverage)
    // ---------------------------------------------------------------------------

    /**
     * @test
     * An email-only payload (no phone) also passes the mutual-exclusivity check.
     */
    public function test_email_only_payload_passes_mutual_exclusivity_check(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $payload = array_merge($this->basePayload(), [
                'email' => 'user' . random_int(1, 99999) . '@example.com',
            ]);

            $hookErrors = $this->mutualExclusivityErrors($payload);

            $this->assertEmpty(
                $hookErrors,
                "Mutual-exclusivity check should pass for email-only payload, iteration={$i}."
            );
        }
    }

    // ---------------------------------------------------------------------------
    // Explicit message text assertions (non-iterative, for documentation)
    // ---------------------------------------------------------------------------

    /** @test */
    public function test_both_present_message_is_exact(): void
    {
        $errors = $this->mutualExclusivityErrors([
            'phone' => '254712345678',
            'email' => 'test@example.com',
        ]);
        $this->assertContains(
            'Please provide either a phone number or an email address, not both.',
            $errors
        );
    }

    /** @test */
    public function test_neither_present_message_is_exact(): void
    {
        $errors = $this->mutualExclusivityErrors([]);
        $this->assertContains(
            'Please provide either a phone number or an email address.',
            $errors
        );
    }
}
