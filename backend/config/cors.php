<?php

return [
    'paths'                    => ['api/*'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://sokomtaa.vercel.app',
        'https://sokomtaa.co.ke',
        'https://www.sokomtaa.co.ke',
    ],
    'allowed_origins_patterns' => [
        '#^https://sokomtaa.*\.vercel\.app$#',
    ],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => true,
];
