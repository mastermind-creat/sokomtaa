<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateVapidKeys extends Command
{
    protected $signature   = 'webpush:vapid';
    protected $description = 'Generate VAPID keys for Web Push notifications';

    public function handle(): void
    {
        $key = openssl_pkey_new([
            'curve_name'       => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ]);

        $details    = openssl_pkey_get_details($key);
        $privateKey = $details['ec']['d'];
        $publicKey  = "\x04" . $details['ec']['x'] . $details['ec']['y'];

        $privateB64 = rtrim(strtr(base64_encode($privateKey), '+/', '-_'), '=');
        $publicB64  = rtrim(strtr(base64_encode($publicKey), '+/', '-_'), '=');

        $this->info('VAPID keys generated. Add these to your .env:');
        $this->line('');
        $this->line("VAPID_PUBLIC_KEY={$publicB64}");
        $this->line("VAPID_PRIVATE_KEY={$privateB64}");
        $this->line('');
        $this->comment('Also add VAPID_PUBLIC_KEY to your Vercel environment variables (NEXT_PUBLIC_VAPID_PUBLIC_KEY).');
    }
}
