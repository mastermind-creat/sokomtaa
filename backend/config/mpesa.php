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
];
