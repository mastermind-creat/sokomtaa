<?php

namespace App\Http\Controllers;

use App\Services\CloudinaryService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CloudinaryController extends Controller
{
    use ApiResponse;

    protected $cloudinary;

    public function __construct(CloudinaryService $cloudinary)
    {
        $this->cloudinary = $cloudinary;
    }

    /**
     * Get a signed upload signature for direct Cloudinary upload.
     */
    public function getSignature(Request $request): JsonResponse
    {
        $folder = $request->query('folder', 'general');
        
        // Sanitize folder path
        $folder = 'sokomtaa/' . ltrim($folder, '/');

        $signatureData = $this->cloudinary->generateSignature([
            'folder' => $folder
        ]);

        if (isset($signatureData['error'])) {
            return $this->error($signatureData['error'], 'CONFIG_ERROR', 400);
        }

        return $this->success($signatureData);
    }
}
