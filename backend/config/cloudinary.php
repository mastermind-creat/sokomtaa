<?php

return [
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key'    => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),
    'secure'     => true,
    'url'        => [
        'secure' => true,
    ],
    // Max upload size: 5MB images only
    'upload_preset' => 'sokomtaa_uploads',
];
