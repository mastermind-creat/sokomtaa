import api from './api';
import { ApiResponse } from '@/types';

interface SignatureResponse {
    signature: string;
    timestamp: number;
    api_key: string;
    cloud_name: string;
    folder: string;
}

/**
 * Uploads a file directly to Cloudinary using a signed request.
 * @param file The file to upload
 * @param folder The folder name (e.g. 'profiles', 'kyc')
 * @returns The secure URL of the uploaded file
 */
export async function uploadToCloudinary(file: File, folder: string): Promise<string> {
    // 1. Get signature from our backend
    const signRes = await api.get<never, ApiResponse<SignatureResponse>>(`/profile/cloudinary/sign?folder=${folder}`);
    const { signature, timestamp, api_key, cloud_name, folder: fullFolder } = signRes.data;

    // 2. Prepare Form Data for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signature);
    formData.append('timestamp', timestamp.toString());
    formData.append('api_key', api_key);
    formData.append('folder', fullFolder);

    // 3. Upload to Cloudinary API
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
    
    try {
        const response = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Cloudinary upload failed');
        }

        const result = await response.json();
        return result.secure_url;
    } catch (error) {
        console.error('Direct Upload Error:', error);
        throw error;
    }
}
