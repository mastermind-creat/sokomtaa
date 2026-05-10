<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected $cloudinary;
    protected $useLocalFallback = false;

    public function __construct()
    {
        try {
            // Check if individual config values are present
            $config = config('cloudinary');
            
            if ($config['cloud_name'] && $config['api_key'] && $config['api_secret']) {
                $this->cloudinary = new Cloudinary([
                    'cloud' => [
                        'cloud_name' => $config['cloud_name'],
                        'api_key'    => $config['api_key'],
                        'api_secret' => $config['api_secret'],
                    ],
                ]);
            } else {
                // Fallback to local if config is missing
                $this->useLocalFallback = true;
                Log::warning('Cloudinary credentials missing. Falling back to local public storage.');
            }
        } catch (\Exception $e) {
            $this->useLocalFallback = true;
            Log::error('Cloudinary Initialization Error: ' . $e->getMessage() . '. Falling back to local storage.');
        }
    }

    /**
     * Upload an image to Cloudinary (or local fallback).
     *
     * @param UploadedFile $file
     * @param string $folder
     * @return string|null The secure URL of the uploaded image
     */
    public function uploadImage(UploadedFile $file, string $folder = 'products'): ?string
    {
        Log::info('CloudinaryService: Starting upload.', [
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime' => $file->getMimeType(),
            'folder' => $folder,
            'fallback_mode' => $this->useLocalFallback
        ]);

        if ($this->useLocalFallback) {
            try {
                // Store in public/uploads/{folder}
                $path = $file->store('uploads/' . $folder, 'public');
                Log::info('CloudinaryService: Local storage successful.', ['path' => $path]);
                // Return URL relative to base (e.g. /storage/uploads/products/xyz.jpg)
                return '/storage/' . $path;
            } catch (\Exception $e) {
                Log::error('Local Storage Fallback Error: ' . $e->getMessage());
                return null;
            }
        }

        try {
            Log::info('CloudinaryService: Attempting Cloudinary API upload.');
            $uploadedFile = $this->cloudinary->uploadApi()->upload($file->getRealPath(), [
                'folder' => 'sokomtaa/' . $folder,
                // Removed inline transformations to speed up upload processing
            ]);

            Log::info('CloudinaryService: Cloudinary upload successful.', ['url' => $uploadedFile['secure_url']]);
            return $uploadedFile['secure_url'];
        } catch (\Exception $e) {
            Log::error('Cloudinary Upload Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            // Attempt local fallback if Cloudinary fails during runtime
            Log::info('CloudinaryService: Attempting local fallback due to API failure.');
            return $this->uploadImageLocalFallback($file, $folder);
        }
    }

    /**
     * Internal helper for local fallback.
     */
    protected function uploadImageLocalFallback(UploadedFile $file, string $folder): ?string
    {
        try {
            $path = $file->store('uploads/' . $folder, 'public');
            Log::info('CloudinaryService: Secondary local fallback successful.', ['path' => $path]);
            return '/storage/' . $path;
        } catch (\Exception $e) {
            Log::error('Secondary Local Fallback Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate a signature for direct client-side upload.
     *
     * @param array $params
     * @return array
     */
    public function generateSignature(array $params = []): array
    {
        if ($this->useLocalFallback) {
            return ['error' => 'Local fallback active. Direct upload not supported.'];
        }

        $timestamp = time();
        $params['timestamp'] = $timestamp;
        
        // Add default folder if not provided
        if (!isset($params['folder'])) {
            $params['folder'] = 'sokomtaa/general';
        }

        // Generate signature
        $signature = \Cloudinary\Api\ApiUtils::signParameters(
            $params,
            config('cloudinary.api_secret')
        );

        return [
            'signature' => $signature,
            'timestamp' => $timestamp,
            'api_key'   => config('cloudinary.api_key'),
            'cloud_name'=> config('cloudinary.cloud_name'),
            'folder'    => $params['folder'],
        ];
    }

    /**
     * Delete an image from Cloudinary using its URL.
     *
     * @param string|null $url
     * @return void
     */
    public function deleteImage(?string $url): void
    {
        if (!$url) return;

        try {
            // Extract public ID from URL
            // Format: https://res.cloudinary.com/cloud_name/image/upload/v1/folder/public_id.jpg
            $path = parse_url($url, PHP_URL_PATH);
            $pathParts = explode('/', $path);
            
            // Public ID includes folders between 'upload/' and the extension
            $uploadIndex = array_search('upload', $pathParts);
            if ($uploadIndex !== false) {
                $afterUpload = array_slice($pathParts, $uploadIndex + 2); // Skip 'upload' and version (e.g. v1)
                $fullName = implode('/', $afterUpload);
                $publicId = pathinfo($fullName, PATHINFO_DIRNAME) . '/' . pathinfo($fullName, PATHINFO_FILENAME);
                $publicId = ltrim($publicId, './');
                
                $this->cloudinary->uploadApi()->destroy($publicId);
            }
        } catch (\Exception $e) {
            Log::error('Cloudinary Delete Error: ' . $e->getMessage());
        }
    }
}
