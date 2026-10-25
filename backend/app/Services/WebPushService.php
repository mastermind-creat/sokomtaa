<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebPushService
{
    /**
     * Send a push notification to all subscriptions for a user.
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        foreach ($subscriptions as $subscription) {
            $this->send($subscription, $title, $body, $data);
        }
    }

    /**
     * Send a push notification to a single subscription.
     * Uses the Web Push Protocol with VAPID authentication.
     */
    public function send(PushSubscription $subscription, string $title, string $body, array $data = []): bool
    {
        $vapidPublicKey  = config('webpush.vapid.public_key');
        $vapidPrivateKey = config('webpush.vapid.private_key');
        $vapidSubject    = config('webpush.vapid.subject', 'mailto:hello@sokomtaa.co.ke');

        if (!$vapidPublicKey || !$vapidPrivateKey) {
            Log::warning('WebPush: VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
            return false;
        }

        $payload = json_encode([
            'title' => $title,
            'body'  => $body,
            'icon'  => '/favicon/web-app-manifest-192x192.png',
            'badge' => '/favicon/favicon-96x96.png',
            'data'  => $data,
            'tag'   => $data['type'] ?? 'general',
        ]);

        try {
            // Build VAPID JWT header for authentication
            $endpoint   = $subscription->endpoint;
            $parsedUrl  = parse_url($endpoint);
            $audience   = $parsedUrl['scheme'] . '://' . $parsedUrl['host'];

            $jwtHeader  = $this->base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
            $jwtPayload = $this->base64UrlEncode(json_encode([
                'aud' => $audience,
                'exp' => time() + 43200, // 12 hours
                'sub' => $vapidSubject,
            ]));

            $signingInput = $jwtHeader . '.' . $jwtPayload;
            $signature    = $this->signWithPrivateKey($signingInput, $vapidPrivateKey);
            $jwt          = $signingInput . '.' . $signature;

            $vapidHeader = 'vapid t=' . $jwt . ', k=' . $vapidPublicKey;

            $response = Http::withHeaders([
                'Authorization'   => $vapidHeader,
                'Content-Type'    => 'application/octet-stream',
                'TTL'             => '86400',
            ])->withBody($payload, 'application/octet-stream')
              ->timeout(10)
              ->post($endpoint);

            if ($response->status() === 410 || $response->status() === 404) {
                // Subscription is expired — delete it
                $subscription->delete();
                return false;
            }

            return $response->successful() || $response->status() === 201;

        } catch (\Exception $e) {
            Log::error('WebPush send failed: ' . $e->getMessage(), [
                'user_id'  => $subscription->user_id,
                'endpoint' => substr($subscription->endpoint, 0, 50),
            ]);
            return false;
        }
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function signWithPrivateKey(string $data, string $privateKeyBase64): string
    {
        // Decode the base64url private key
        $privateKeyDer = base64_decode(strtr($privateKeyBase64, '-_', '+/'));

        // Create PEM from raw EC private key bytes
        // For P-256, the raw private key is 32 bytes
        $pem = $this->ecPrivateKeyToPem($privateKeyDer);

        $pkey = openssl_pkey_get_private($pem);
        if (!$pkey) {
            throw new \RuntimeException('Could not load VAPID private key. Ensure it is a valid P-256 base64url key.');
        }

        openssl_sign($data, $signature, $pkey, OPENSSL_ALGO_SHA256);

        // Convert DER signature to raw R||S (64 bytes)
        return $this->base64UrlEncode($this->derToRaw($signature));
    }

    /**
     * Convert a raw 32-byte P-256 private key to PEM format.
     */
    private function ecPrivateKeyToPem(string $rawKey): string
    {
        // P-256 OID: 1.2.840.10045.3.1.7
        $oidP256 = "\x2a\x86\x48\xce\x3d\x03\x01\x07";

        // Build ECPrivateKey DER (RFC 5915)
        $ecPrivKey  = "\x30" . $this->derLength(
            "\x02\x01\x01" .                               // version = 1
            "\x04" . $this->derLength($rawKey) . $rawKey . // privateKey
            "\xa0" . $this->derLength(                     // parameters
                "\x06" . $this->derLength($oidP256) . $oidP256
            )
        );

        return "-----BEGIN EC PRIVATE KEY-----\n" .
               chunk_split(base64_encode($ecPrivKey), 64, "\n") .
               "-----END EC PRIVATE KEY-----\n";
    }

    private function derLength(string $data): string
    {
        $len = strlen($data);
        if ($len < 128) {
            return chr($len) . $data;
        }
        $lenBytes = '';
        $tmp = $len;
        while ($tmp > 0) {
            $lenBytes = chr($tmp & 0xff) . $lenBytes;
            $tmp >>= 8;
        }
        return chr(0x80 | strlen($lenBytes)) . $lenBytes . $data;
    }

    /**
     * Convert an ASN.1 DER ECDSA signature to raw R||S format.
     */
    private function derToRaw(string $der): string
    {
        // DER SEQUENCE: 0x30 <len> 0x02 <rLen> <r> 0x02 <sLen> <s>
        $offset = 2; // skip 0x30 and total length
        $rLen = ord($der[$offset + 1]);
        $r = substr($der, $offset + 2, $rLen);
        $offset = $offset + 2 + $rLen;
        $sLen = ord($der[$offset + 1]);
        $s = substr($der, $offset + 2, $sLen);

        // Pad or trim to 32 bytes each
        $r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
        $s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);

        return $r . $s;
    }
}
