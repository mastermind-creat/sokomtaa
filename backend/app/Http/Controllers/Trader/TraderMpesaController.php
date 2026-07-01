<?php

namespace App\Http\Controllers\Trader;

use App\Http\Controllers\Controller;
use App\Models\Trader;
use App\Services\MpesaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TraderMpesaController extends Controller
{
    use ApiResponse;

    /**
     * GET /trader/mpesa-integration
     *
     * Returns the trader's current custom M-Pesa integration state.
     * Raw credentials are NEVER returned — only masked confirmation & status.
     */
    public function show(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user   = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Trader profile not found.', 'NOT_FOUND', 404);
        }

        return $this->success([
            'enabled'          => (bool) $trader->custom_mpesa_enabled,
            'shortcode'        => $trader->custom_mpesa_shortcode,
            'transaction_type' => $trader->custom_mpesa_transaction_type,
            'environment'      => $trader->custom_mpesa_environment,
            'verified_at'      => $trader->custom_mpesa_verified_at?->toIso8601String(),
            'has_credentials'  => $trader->hasValidCustomMpesa(),
            // masked hints — show only last 4 chars so the UI can confirm keys are saved
            'consumer_key_hint' => $this->maskCredential($trader->getDecryptedConsumerKey()),
        ]);
    }

    /**
     * POST /trader/mpesa-integration
     *
     * Save or update custom Daraja credentials.
     * Validates by attempting a live token call to Safaricom.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'enabled'          => 'required|boolean',
            'consumer_key'     => 'required_if:enabled,true|nullable|string|max:200',
            'consumer_secret'  => 'required_if:enabled,true|nullable|string|max:200',
            'passkey'          => 'required_if:enabled,true|nullable|string|max:500',
            'shortcode'        => 'required_if:enabled,true|nullable|string|max:20',
            'transaction_type' => 'required_if:enabled,true|nullable|in:CustomerPayBillOnline,CustomerBuyGoodsOnline',
            'environment'      => 'required_if:enabled,true|nullable|in:sandbox,production',
        ]);

        /** @var \App\Models\User $user */
        $user   = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Trader profile not found.', 'NOT_FOUND', 404);
        }

        // Disabling — just clear the flag without touching credentials
        if (!$request->boolean('enabled')) {
            $trader->update(['custom_mpesa_enabled' => false]);
            return $this->success(null, 'Custom M-Pesa integration disabled. Payments will use Soko Mtaa default routing.');
        }

        // Validate credentials with a live Safaricom token call
        $testService = new MpesaService(
            consumerKey:     $request->consumer_key,
            consumerSecret:  $request->consumer_secret,
            passkey:         $request->passkey,
            shortcode:       $request->shortcode,
            environment:     $request->environment,
            transactionType: $request->transaction_type,
            cachePrefix:     'mpesa_test_' . $trader->id,
        );

        if (!$testService->testCredentials()) {
            Log::warning('Trader M-Pesa credential validation failed', ['trader_id' => $trader->id]);
            return $this->error(
                'Could not connect to Safaricom with the provided credentials. Please check your Consumer Key and Consumer Secret.',
                'INVALID_CREDENTIALS',
                422
            );
        }

        // Persist — the model's mutators automatically encrypt the values
        $trader->update([
            'custom_mpesa_enabled'      => true,
            'custom_mpesa_consumer_key' => $request->consumer_key,
            'custom_mpesa_consumer_secret' => $request->consumer_secret,
            'custom_mpesa_passkey'      => $request->passkey,
            'custom_mpesa_shortcode'    => $request->shortcode,
            'custom_mpesa_transaction_type' => $request->transaction_type ?? 'CustomerPayBillOnline',
            'custom_mpesa_environment'  => $request->environment ?? 'sandbox',
            'custom_mpesa_verified_at'  => now(),
        ]);

        Log::info('Trader custom M-Pesa integration saved', [
            'trader_id'  => $trader->id,
            'shortcode'  => $request->shortcode,
            'env'        => $request->environment,
        ]);

        return $this->success([
            'enabled'          => true,
            'shortcode'        => $trader->custom_mpesa_shortcode,
            'transaction_type' => $trader->custom_mpesa_transaction_type,
            'environment'      => $trader->custom_mpesa_environment,
            'verified_at'      => $trader->custom_mpesa_verified_at->toIso8601String(),
            'consumer_key_hint' => $this->maskCredential($request->consumer_key),
        ], 'Custom M-Pesa integration verified and saved successfully!');
    }

    /**
     * DELETE /trader/mpesa-integration
     *
     * Completely removes stored credentials and disables the integration.
     */
    public function destroy(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user   = Auth::user();
        $trader = $user->trader;

        if (!$trader) {
            return $this->error('Trader profile not found.', 'NOT_FOUND', 404);
        }

        $trader->update([
            'custom_mpesa_enabled'         => false,
            'custom_mpesa_consumer_key'    => null,
            'custom_mpesa_consumer_secret' => null,
            'custom_mpesa_passkey'         => null,
            'custom_mpesa_shortcode'       => null,
            'custom_mpesa_transaction_type' => 'CustomerPayBillOnline',
            'custom_mpesa_environment'     => 'sandbox',
            'custom_mpesa_verified_at'     => null,
        ]);

        return $this->success(null, 'Custom M-Pesa integration has been removed. Payments will now use Soko Mtaa default routing.');
    }

    /**
     * Mask a credential string — show only the last 4 characters.
     */
    private function maskCredential(?string $value): ?string
    {
        if (!$value || strlen($value) < 8) return null;
        return str_repeat('•', strlen($value) - 4) . substr($value, -4);
    }
}
