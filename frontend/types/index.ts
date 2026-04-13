export interface User {
    id: number;
    name: string;
    phone: string;
    email?: string;
    role: 'trader' | 'resident' | 'admin';
    preferred_language: string;
    phone_verified: boolean;
    avatar_url?: string;
    national_id?: string;
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

export interface Category {
    id: number;
    name: string;
    name_sw: string;
    icon?: string;
    color?: string;
}

export interface TraderDashboardStats {
    total_revenue: number;
    pending_reservations: number;
    completed_reservations: number;
    low_stock_items: number;
    out_of_stock_items: number;
}

export interface RevenueTrend {
    date: string;
    total: number;
}

export interface AnalyticsProduct {
    id: number;
    name: string;
    image_url: string | null;
    price: string;
    total_reservations: number;
    category?: Category;
}

export interface ResidentDashboardStats {
    active_reservations: number;
    total_reservations: number;
    unread_notifications: number;
    points: number;
}

export interface Market {
    id: number;
    name: string;
    location: string;
    county: string;
    estate: string;
    latitude: string | null;
    longitude: string | null;
    is_active: boolean;
}

export interface Notice {
    id: number;
    market_id: number;
    title: string;
    title_sw: string | null;
    content: string;
    content_sw: string | null;
    type: 'general' | 'event' | 'maintenance' | 'promotion' | 'urgent';
    audience: 'all' | 'traders' | 'residents';
    is_pinned: boolean;
    expires_at: string | null;
    created_at: string;
}
