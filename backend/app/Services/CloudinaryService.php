<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected $cloudinary;

    public function __construct()
    {
        // Initializes using CLOUDINARY_URL from .env
        $this->cloudinary = new Cloudinary();
    }

    /**
     * Upload an image to Cloudinary with Soko Mtaa optimizations.
     *
     * @param UploadedFile $file
     * @param string $folder
     * @return string|null The secure URL of the uploaded image
     */
    public function uploadImage(UploadedFile $file, string $folder = 'products'): ?string
    {
        try {
            $uploadedFile = $this->cloudinary->uploadApi()->upload($file->getRealPath(), [
                'folder' => 'sokomtaa/' . $folder,
                'transformation' => [
                    'width' => 800,
                    'crop' => 'limit',
                    'quality' => 'auto',
                    'fetch_format' => 'auto'
                ]
            ]);

            return $uploadedFile['secure_url'];
        } catch (\Exception $e) {
            Log::error('Cloudinary Upload Error: ' . $e->getMessage());
            return null;
        }
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
