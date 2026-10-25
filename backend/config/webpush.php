<?php

return [
    'vapid' => [
        'subject'     => env('VAPID_SUBJECT', 'mailto:hello@sokomtaa.co.ke'),
        'public_key'  => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],
];
