export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            customers: {
                Row: {
                    id: string
                    name: string
                    phone: string
                    email: string | null
                    profile_image_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    name: string
                    phone: string
                    email?: string | null
                    profile_image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    phone?: string
                    email?: string | null
                    profile_image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            customer_locations: {
                Row: {
                    id: string
                    customer_id: string
                    label: string
                    address_line1: string
                    address_line2: string | null
                    city: string
                    state: string
                    pincode: string
                    latitude: number
                    longitude: number
                    is_default: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    customer_id: string
                    label: string
                    address_line1: string
                    address_line2?: string | null
                    city: string
                    state: string
                    pincode: string
                    latitude: number
                    longitude: number
                    is_default?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    customer_id?: string
                    label?: string
                    address_line1?: string
                    address_line2?: string | null
                    city?: string
                    state?: string
                    pincode?: string
                    latitude?: number
                    longitude?: number
                    is_default?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            restaurants: {
                Row: {
                    id: string
                    name: string
                    owner_name: string
                    email: string
                    phone: string
                    address_line1: string
                    address_line2: string | null
                    city: string
                    state: string
                    pincode: string
                    latitude: number
                    longitude: number
                    cuisine_types: string[] | null
                    profile_image_url: string | null
                    cover_image_url: string | null
                    description: string | null
                    verified: boolean
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    owner_name: string
                    email: string
                    phone: string
                    address_line1: string
                    address_line2?: string | null
                    city: string
                    state: string
                    pincode: string
                    latitude: number
                    longitude: number
                    cuisine_types?: string[] | null
                    profile_image_url?: string | null
                    cover_image_url?: string | null
                    description?: string | null
                    verified?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    owner_name?: string
                    email?: string
                    phone?: string
                    address_line1?: string
                    address_line2?: string | null
                    city?: string
                    state?: string
                    pincode?: string
                    latitude?: number
                    longitude?: number
                    cuisine_types?: string[] | null
                    profile_image_url?: string | null
                    cover_image_url?: string | null
                    description?: string | null
                    verified?: boolean
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            rescue_bags: {
                Row: {
                    id: string
                    restaurant_id: string
                    title: string
                    description: string | null
                    size: 'small' | 'medium' | 'large'
                    original_price: number
                    discounted_price: number
                    quantity_available: number
                    pickup_start_time: string
                    pickup_end_time: string
                    available_date: string
                    image_url: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    restaurant_id: string
                    title: string
                    description?: string | null
                    size: 'small' | 'medium' | 'large'
                    original_price: number
                    discounted_price: number
                    quantity_available?: number
                    pickup_start_time: string
                    pickup_end_time: string
                    available_date?: string
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    restaurant_id?: string
                    title?: string
                    description?: string | null
                    size?: 'small' | 'medium' | 'large'
                    original_price?: number
                    discounted_price?: number
                    quantity_available?: number
                    pickup_start_time?: string
                    pickup_end_time?: string
                    available_date?: string
                    image_url?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    customer_id: string
                    rescue_bag_id: string
                    restaurant_id: string
                    quantity: number
                    total_price: number
                    status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
                    pickup_time: string
                    payment_method: 'pay_at_pickup' | 'online'
                    payment_status: 'pending' | 'paid' | 'refunded'
                    qr_code: string | null
                    cancellation_reason: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    customer_id: string
                    rescue_bag_id: string
                    restaurant_id: string
                    quantity?: number
                    total_price: number
                    status?: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
                    pickup_time: string
                    payment_method?: 'pay_at_pickup' | 'online'
                    payment_status?: 'pending' | 'paid' | 'refunded'
                    qr_code?: string | null
                    cancellation_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    customer_id?: string
                    rescue_bag_id?: string
                    restaurant_id?: string
                    quantity?: number
                    total_price?: number
                    status?: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'
                    pickup_time?: string
                    payment_method?: 'pay_at_pickup' | 'online'
                    payment_status?: 'pending' | 'paid' | 'refunded'
                    qr_code?: string | null
                    cancellation_reason?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            favorites: {
                Row: {
                    id: string
                    customer_id: string
                    restaurant_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    customer_id: string
                    restaurant_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    customer_id?: string
                    restaurant_id?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            calculate_distance: {
                Args: {
                    lat1: number
                    lon1: number
                    lat2: number
                    lon2: number
                }
                Returns: number
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
