export interface User {
    id: number;
    name: string;
    phone: string | null;
    email?: string | null;
    email_verified?: boolean | null;
    role: 'trader' | 'resident' | 'admin' | 'delivery';
    preferred_language: string;
    phone_verified: boolean;
    avatar_url?: string;
    national_id?: string;
    default_delivery_address?: string;
    default_delivery_mtaa?: string;
    default_delivery_image_url?: string;
    default_delivery_latitude?: number | string;
    default_delivery_longitude?: number | string;
    trader?: Trader;
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
    profile_views: number;
    growth: string;
}

export interface RevenueTrend {
    date: string;
    total: number;
}

export interface RevenueSummary {
    peak_revenue: number;
    average_daily: number;
    total_period: number;
    forecasted_growth: number;
}

export interface RevenueTrendsResponse {
    trends: RevenueTrend[];
    summary: RevenueSummary;
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
    default_monthly_fee: number;
    default_daily_fee: number;
    default_weekly_fee: number;
    is_fee_enabled: boolean;
    banner_url?: string | null;
    icon_url?: string | null;
    stalls_count?: number;
    occupied_stalls_count?: number;
    active_stalls_count?: number;
    traders_count?: number;
    center_id?: number | null;
    center?: Center;
    region?: Region;
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

export interface Stall {
    id: number;
    market_id: number;
    stall_number: string;
    block: string;
    zone: 'A' | 'B' | 'C';
    size_sqm: number | null;
    map_x: number | null;
    map_y: number | null;
    status: 'available' | 'occupied' | 'maintenance';
    monthly_fee: number;
    daily_fee: number;
    weekly_fee: number;
    market?: Market;
    current_trader?: Trader;
}

export interface Trader {
    id: number;
    user_id: number;
    stall_id: number | null;
    market_id: number;
    business_name: string;
    business_name_sw?: string | null;
    description?: string | null;
    mpesa_number?: string | null;
    permit_number?: string | null;
    permit_image_url?: string | null;
    verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
    rejection_reason?: string | null;
    stall_type: 'managed' | 'independent';
    latitude: number | null;
    longitude: number | null;
    id_front_url?: string | null;
    id_back_url?: string | null;
    selfie_url?: string | null;
    avatar_url?: string | null;
    banner_url?: string | null;
    is_open: boolean;
    opening_time?: string | null;
    closing_time?: string | null;
    average_rating: number;
    total_reviews: number;
    profile_views: number;
    is_currently_open?: boolean;
    products_count?: number;
    user?: User;
    stall?: Stall;
    market?: Market;
    products?: Product[];
}

export interface Product {
    id: number;
    trader_id: number;
    category_id: number;
    name: string;
    name_sw?: string | null;
    description?: string | null;
    price: number;
    discount_price?: number | null;
    discount_start_date?: string | null;
    discount_end_date?: string | null;
    active_price?: number | null;     // server-computed, always prefer this
    unit: string;
    stock_status: 'available' | 'low' | 'out_of_stock';
    stock_quantity: number | null;
    image_url?: string | null;
    is_active: boolean;
    is_boosted?: boolean;
    total_reservations: number;
    ai_insight?: string | null;
    category?: Category;
    trader?: Trader;
}

export interface Review {
    id: number;
    resident_id: number;
    trader_id: number;
    reservation_id: number | null;
    rating: number;
    comment?: string | null;
    is_visible: boolean;
    created_at: string;
    resident?: User;
}

export interface Reservation {
    id: number;
    reservation_code: string;
    resident_id: number;
    trader_id: number;
    product_id: number;
    quantity: number;
    unit_price: string | number;
    service_fee: string | number;
    total_amount: string | number;
    status: 'pending' | 'paid' | 'ready' | 'completed' | 'cancelled' | 'expired';
    delivery_option?: boolean;
    delivery_status?: string | null;
    delivery_mtaa?: string | null;
    delivery_address?: string | null;
    delivery_latitude?: number | string | null;
    delivery_longitude?: number | string | null;
    delivery_fee?: string | number | null;
    rider_fee?: string | number | null;
    delivery_rider_id?: number | null;
    notes?: string | null;
    pickup_deadline?: string | null;
    picked_up_at?: string | null;
    created_at: string;
    product?: Product;
    resident?: User;
    trader?: Trader;
}

export interface Complaint {
    id: number;
    user_id: number;
    trader_id?: number | null;
    reservation_id?: number | null;
    market_id: number;
    category: string;
    subject: string;
    description: string;
    status: 'open' | 'in_review' | 'resolved' | 'closed';
    priority: number | string;
    created_at: string;
    trader?: Trader;
    user?: User;
}

export interface MarketFee {
    id: number;
    trader_id: number;
    market_id: number;
    amount: number | string;
    period: string;
    status: 'unpaid' | 'paid' | 'waived';
    payment_id?: number | null;
    due_date: string;
    paid_at?: string | null;
    notes?: string | null;
    created_at: string;
    trader?: Trader;
    market?: Market;
}

export interface Allocation {
    id: number;
    stall_id: number;
    trader_id: number;
    allocated_by: number;
    start_date: string;
    end_date?: string | null;
    status: 'active' | 'expired' | 'revoked';
    notes?: string | null;
    revocation_reason?: string | null;
    created_at: string;
    stall?: Stall;
    trader?: Trader;
}



export interface SystemSetting {
    id: number;
    key: string;
    value: string;
    group: string;
    type: 'string' | 'integer' | 'decimal' | 'boolean';
    label: string;
    description: string;
}
export interface Region {
    id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    counties_count?: number;
    centers_count?: number;
    created_at: string;
    updated_at: string;
}

export interface County {
    id: number;
    region_id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    region?: Region;
    centers_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Center {
    id: number;
    county_id: number;
    region_id: number;
    name: string;
    description?: string | null;
    is_active: boolean;
    county?: County;
    region?: Region;
    markets_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Report {
    id: number;
    user_id: number;
    title: string;
    type: 'sales' | 'revenue' | 'receipt' | 'audit' | 'activity';
    format: 'pdf' | 'xlsx' | 'csv';
    file_path: string | null;
    parameters: any;
    status: 'pending' | 'completed' | 'failed';
    metadata: any;
    generated_at: string | null;
    created_at: string;
}
