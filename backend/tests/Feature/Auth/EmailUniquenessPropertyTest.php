<?php

// Feature: email-phone-registration-ai-search, Property 2: email uniqueness

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Property 2: Email uniqueness is enforced across all registrations.
 *
 * For any two registration attempts using the same email address, the second
 * attempt SHALL fail with HTTP 422 and code ALREADY_EXISTS, regardless of the
 * order in which they arrive.
 *
 * Validates: Requirements 1.3
 */
class EmailUniquenessPropertyTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function strongPassword(): string
    {
        return 'Test@1234Abc';
    }

    private function emailPayload(string $email, string $role = 'resident'): array
    {
        $password = $this->strongPassword();

        return [
            'name'                  => 'Test User',
            'email'                 => $email,
            'password'              => $password,
            'password_confirmation' => $password,
            'role'                  => $role,
        ];
    }

    /**
     * Generate a unique, realistic-looking email for each iteration.
     */
    private function randomEmail(int $seed): string
    {
        $domains = ['example.com', 'test.org', 'mail.co.ke', 'gmail.com', 'yahoo.com'];
        $domain  = $domains[$seed % count($domains)];

        return 'user_' . $seed . '_' . substr(md5((string) $seed), 0, 6) . '@' . $domain;
    }

    // -------------------------------------------------------------------------
    // Property 2 — 100 iterations
    // -------------------------------------------------------------------------

    /**
     * @test
     * Property 2 — 100 iterations: for any valid email, a second registration
     * with the same address returns 422 ALREADY_EXISTS.
     */
    public function test_duplicate_email_registration_returns_422_already_exists_across_100_iterations(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $email = $this->randomEmail($i);

            // First registration — must succeed
            $first = $this->postJson('/api/auth/register', $this->emailPayload($email));

            $first->assertStatus(200)
                ->assertJsonPath('success', true);

            // Second registration with the same email — must fail with ALREADY_EXISTS
            $second = $this->postJson('/api/auth/register', $this->emailPayload($email));

            $second->assertStatus(422)
                ->assertJsonPath('success', false)
                ->assertJsonPath('code', 'ALREADY_EXISTS');

            // Clean up so the next iteration starts fresh
            User::where('email', $email)->forceDelete();
        }
    }

    // -------------------------------------------------------------------------
    // Supplementary: case-insensitive uniqueness
    // -------------------------------------------------------------------------

    /**
     * @test
     * A registration with an email that differs only by case from an existing
     * account is treated as a duplicate (MySQL unique index is case-insensitive
     * for utf8mb4 collation by default).
     *
     * Skipped on SQLite (test database) because SQLite's default collation is
     * case-sensitive for `=` comparisons — this behaviour is MySQL-specific and
     * is verified by the integration environment.
     *
     * Runs 20 iterations.
     */
    public function test_email_uniqueness_is_case_insensitive(): void
    {
        if (config('database.default') === 'sqlite') {
            $this->markTestSkipped('Case-insensitive uniqueness relies on MySQL utf8mb4 collation; skipped on SQLite test driver.');
        }

        for ($i = 0; $i < 20; $i++) {
            $lower = 'user_ci_' . $i . '@example.com';
            $upper = strtoupper('user_ci_' . $i . '@example.com');

            // Register with lowercase
            $this->postJson('/api/auth/register', $this->emailPayload($lower))
                ->assertStatus(200);

            // Re-register with UPPERCASE variant — should fail
            $response = $this->postJson('/api/auth/register', $this->emailPayload($upper));

            $response->assertStatus(422)
                ->assertJsonPath('success', false);

            User::where('email', $lower)->forceDelete();
        }
    }

    // -------------------------------------------------------------------------
    // Supplementary: uniqueness is independent of role
    // -------------------------------------------------------------------------

    /**
     * @test
     * Email uniqueness applies across different roles — you cannot register the
     * same email as both a resident and a trader.
     */
    public function test_email_uniqueness_enforced_across_different_roles(): void
    {
        $email = 'crossrole@example.com';

        $this->postJson('/api/auth/register', $this->emailPayload($email, 'resident'))
            ->assertStatus(200);

        $this->postJson('/api/auth/register', $this->emailPayload($email, 'trader'))
            ->assertStatus(422)
            ->assertJsonPath('code', 'ALREADY_EXISTS');
    }

    // -------------------------------------------------------------------------
    // Baseline: first registration always succeeds
    // -------------------------------------------------------------------------

    /**
     * @test
     * First-time registration with a fresh email always succeeds (sanity baseline).
     */
    public function test_first_registration_with_fresh_email_always_succeeds(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $email = 'fresh_' . $i . '_' . uniqid() . '@example.com';

            $this->postJson('/api/auth/register', $this->emailPayload($email))
                ->assertStatus(200)
                ->assertJsonPath('success', true)
                ->assertJsonPath('data.user.email_verified', false);

            User::where('email', $email)->forceDelete();
        }
    }
}
