<?php

return [
    'api_key' => env('TALKSASA_API_KEY'),
    'sender_id' => env('TALKSASA_SENDER_ID', 'TALK-SASA'),
    'base_url' => env('TALKSASA_BASE_URL', 'https://bulksms.talksasa.com/api/v3/'),
];
