<?php

return [
    'consumer_key'    => env('MPESA_CONSUMER_KEY'),
    'consumer_secret' => env('MPESA_CONSUMER_SECRET'),
    'passkey'         => env('MPESA_PASSKEY'),
    'shortcode'       => env('MPESA_SHORTCODE'),
    'callback_url'    => env('MPESA_CALLBACK_URL'),
    'env'             => env('MPESA_ENV', 'sandbox'),
    'base_url'        => env('MPESA_ENV') === 'production'
                         ? 'https://api.safaricom.co.ke'
                         : 'https://sandbox.safaricom.co.ke',

    /*
    |--------------------------------------------------------------------------
    | Callback Source Verification
    |--------------------------------------------------------------------------
    |
    | Safaricom does not sign callback payloads, so anyone who learns a
    | CheckoutRequestID could POST a forged "payment successful" callback.
    | Two independent controls are supported; both are optional for backward
    | compatibility but SHOULD be enabled in production.
    |
    | callback_secret — when set, it is appended to the CallBackURL registered
    |   with Daraja as a `token` query parameter and must match on every inbound
    |   callback. Rotating the secret only requires updating this env value.
    |
    | callback_allowed_ips — comma separated allowlist. Safaricom's published
    |   callback ranges are listed in .env.example.
    |
    */

    'callback_secret'      => env('MPESA_CALLBACK_SECRET'),

    'callback_allowed_ips' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('MPESA_CALLBACK_ALLOWED_IPS', ''))
    ))),
];
