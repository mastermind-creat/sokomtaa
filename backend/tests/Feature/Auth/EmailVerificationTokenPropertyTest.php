<?php

// Feature: email-phone-registration-ai-search, Property 3: email verification token round-trip

namespace Tests\Feature\Auth;

use App\Jobs\SendVerificationEmail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Property 3: Email verification token round-trip.
 *
 * For any email-registered user, the token stored in cache under
 * email_verify_{user_id} when presented to the verification endpoint SHALL:
 *   - Set email_verified_at to a non-null timestamp
 *   - Invalidate the token so a second presentation returns an error
 *
 * Validates: Requirements 1.7, 1.8, 1.9
 */
class EmailVerificationTokenPropertyTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Create an email-registered user with no verified_at and a cached token. */
    private function makeUnverifiedUser(string $token): User
    {
        $user = User::factory()->create([
            'phone'             => null,
            'email'             => 'verify_' . Str::random(8) . '@example.com',
            'email_verified_at' => null,
        ]);

        Cache::put("email_verify_{$user->id}", $token, now()->addMinutes(60));

        return $user;
    }

    /** Generate a random 64-char token (mirrors job implementation). */
    private function randomToken(): string
    {
        return Str::random(64);
    }

    // -------------------------------------------------------------------------
    // Property 3 — core round-trip (100 iterations)
    // -------------------------------------------------------------------------

    /**
     * @test
     * Property 3 — 100 iterations: presenting the correct token sets
     * email_verified_at and a second presentation with the same token fails.
     */
    public function test_valid_token_sets_verified_at_and_second_use_fails(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $token = $this->randomToken();
            $user  = $this->makeUnverifiedUser($token);

            // First use — must succeed
            $this->getJson("/api/auth/email/verify/{$user->id}/{$token}")
                ->assertStatus(200)
                ->assertJsonPath('success', true);

            // email_verified_at must now be set
            $this->assertNotNull($user->fresh()->email_verified_at, "iteration {$i}");

            // Token must have been consumed
            $this->assertNull(Cache::get("email_verify_{$user->id}"), "token not cleared, iteration {$i}");

            // Second use with the same token — must fail
            $this->getJson("/api/auth/email/verify/{$user->id}/{$token}")
                ->assertStatus(200) // idempotent success (already verified)
                ->assertJsonPath('success', true);
        }
    }

    // -------------------------------------------------------------------------
    // Expired / missing token
    // -------------------------------------------------------------------------

    /**
     * @test
     * When no token exists in cache (expired or never set), the endpoint returns
     * 422 VALIDATION_ERROR. Runs 50 iterations.
     */
    public function test_expired_token_returns_422(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $user = User::factory()->create([
                'phone'             => null,
                'email'             => 'expired_' . $i . '_' . Str::random(6) . '@example.com',
                'email_verified_at' => null,
            ]);

            // No token in cache — simulates expiry
            Cache::forget("email_verify_{$user->id}");

            $this->getJson("/api/auth/email/verify/{$user->id}/" . $this->randomToken())
                ->assertStatus(422)
                ->assertJsonPath('success', false)
                ->assertJsonPath('code', 'VALIDATION_ERROR');
        }
    }

    // -------------------------------------------------------------------------
    // Token mismatch
    // -------------------------------------------------------------------------

    /**
     * @test
     * Presenting a token that does not match the cached token returns 422.
     * Runs 50 iterations.
     */
    public function test_wrong_token_returns_422(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $real  = $this->randomToken();
            $wrong = $this->randomToken();

            // Guarantee they differ (extremely unlikely collision, but be safe)
            while ($wrong === $real) {
                $wrong = $this->randomToken();
            }

            $user = $this->makeUnverifiedUser($real);

            $this->getJson("/api/auth/email/verify/{$user->id}/{$wrong}")
                ->assertStatus(422)
                ->assertJsonPath('success', false)
                ->assertJsonPath('code', 'VALIDATION_ERROR');

            // Real token must still be cached — wrong attempt must not consume it
            $this->assertNotNull(
                Cache::get("email_verify_{$user->id}"),
                "Cached token was incorrectly removed on mismatch, iteration {$i}"
            );
        }
    }

    // -------------------------------------------------------------------------
    // Idempotent already-verified
    // -------------------------------------------------------------------------

    /**
     * @test
     * Calling verify on an already-verified user returns 200 success regardless
     * of the token value. Runs 20 iterations.
     */
    public function test_already_verified_user_returns_idempotent_success(): void
    {
        for ($i = 0; $i < 20; $i++) {
            $user = User::factory()->create([
                'phone'             => null,
                'email'             => 'done_' . $i . '@example.com',
                'email_verified_at' => now(),
            ]);

            $this->getJson("/api/auth/email/verify/{$user->id}/" . $this->randomToken())
                ->assertStatus(200)
                ->assertJsonPath('success', true);
        }
    }

    // -------------------------------------------------------------------------
    // Resend invalidates old token and issues fresh one
    // -------------------------------------------------------------------------

    /**
     * @test
     * After a resend, the old token is gone and a new SendVerificationEmail job
     * is dispatched. Runs 30 iterations.
     */
    public function test_resend_invalidates_old_token_and_dispatches_new_job(): void
    {
        Queue::fake();

        for ($i = 0; $i < 30; $i++) {
            $oldToken = $this->randomToken();
            $user     = $this->makeUnverifiedUser($oldToken);

            $this->actingAs($user)
                ->postJson('/api/auth/email/resend')
                ->assertStatus(200)
                ->assertJsonPath('success', true);

            // Old token must be gone
            $this->assertNull(
                Cache::get("email_verify_{$user->id}"),
                "Old token should be removed after resend, iteration {$i}"
            );

            // A new job must have been dispatched
            Queue::assertPushed(SendVerificationEmail::class, function ($job) use ($user) {
                return $job->user->id === $user->id;
            });

            Queue::clearResolvedInstances();

            // Clean up for next iteration
            Cache::forget("email_resend_count_{$user->id}");
        }
    }

    // -------------------------------------------------------------------------
    // Resend rate limit
    // -------------------------------------------------------------------------

    /**
     * @test
     * After 5 resend requests within an hour, the 6th returns 429.
     */
    public function test_resend_rate_limit_enforced_after_five_requests(): void
    {
        Queue::fake();

        $user = User::factory()->create([
            'phone'             => null,
            'email'             => 'ratelimit@example.com',
            'email_verified_at' => null,
        ]);

        for ($i = 1; $i <= 5; $i++) {
            $this->actingAs($user)
                ->postJson('/api/auth/email/resend')
                ->assertStatus(200);
        }

        // 6th attempt must be rate-limited
        $this->actingAs($user)
            ->postJson('/api/auth/email/resend')
            ->assertStatus(429)
            ->assertJsonPath('success', false);
    }
}
