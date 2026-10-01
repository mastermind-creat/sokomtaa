<?php

return [

    /*
    |--------------------------------------------------------------------------
    | PayPal API Credentials
    |--------------------------------------------------------------------------
    |
    | These credentials are used to authenticate with the PayPal REST API.
    | Never hardcode these values — always source from environment variables.
    |
    */

    'client_id'      => env('PAYPAL_CLIENT_ID'),
    'client_secret'  => env('PAYPAL_CLIENT_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | PayPal Environment
    |--------------------------------------------------------------------------
    |
    | Set PAYPAL_ENV to 'production' when going live. Defaults to 'sandbox'
    | for safe development and testing.
    |
    */

    'env'      => env('PAYPAL_ENV', 'sandbox'),
    'base_url' => env('PAYPAL_ENV') === 'production'
                  ? 'https://api-m.paypal.com'
                  : 'https://api-m.sandbox.paypal.com',

    /*
    |--------------------------------------------------------------------------
    | Currency Conversion
    |--------------------------------------------------------------------------
    |
    | PayPal does not natively support KES. This rate is used to convert
    | KES amounts to USD before creating a PayPal order.
    |
    */

    'kes_to_usd_rate' => env('PAYPAL_KES_TO_USD_RATE'),

    /*
    |--------------------------------------------------------------------------
    | Webhook
    |--------------------------------------------------------------------------
    |
    | The Webhook ID from your PayPal developer dashboard, used to verify
    | the authenticity of incoming webhook events.
    |
    */

    'webhook_id' => env('PAYPAL_WEBHOOK_ID'),

];
