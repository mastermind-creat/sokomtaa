export interface User {
    id: number;
    name: string;
    phone: string;
    role: 'trader' | 'resident' | 'admin';
    preferred_language: string;
    phone_verified: boolean;
    avatar_url?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}
