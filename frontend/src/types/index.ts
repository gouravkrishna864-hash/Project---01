export type UserRole = 'buyer' | 'broker' | 'builder' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  city?: string;
  preferences?: UserPreferences;
  is_verified: boolean;
  profile_image?: string;
  rera_number?: string;
  created_at: string;
}

export interface UserPreferences {
  budget_min?: number;
  budget_max?: number;
  bedrooms?: number[];
  preferred_cities?: string[];
  preferred_localities?: string[];
  property_types?: PropertyType[];
}

export type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial' | 'pg' | 'house';
export type ListingType = 'sale' | 'rent';
export type PropertyStatus = 'active' | 'sold' | 'rented' | 'inactive' | 'pending_review';
export type FurnishingType = 'unfurnished' | 'semi-furnished' | 'fully-furnished';

export interface Property {
  id: string;
  title: string;
  description?: string;
  type: PropertyType;
  listing_type: ListingType;
  price: number;
  price_per_sqft?: number;
  area_sqft: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  total_floors?: number;
  furnishing?: FurnishingType;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  video_url?: string;
  status: PropertyStatus;
  is_verified: boolean;
  is_featured: boolean;
  amenities: string[];
  nearby_facilities: Record<string, number>;
  price_history: PriceHistoryEntry[];
  views_count: number;
  leads_count: number;
  broker_id: string;
  rera_number?: string;
  possession_date?: string;
  created_at: string;
}

export interface PriceHistoryEntry {
  price: number;
  date: string;
}

export type LeadStatus =
  | 'new' | 'contacted' | 'site_visit_scheduled'
  | 'site_visit_done' | 'negotiating' | 'deal_closed' | 'lost';
export type LeadPriority = 'hot' | 'warm' | 'cold';

export interface Lead {
  id: string;
  user_id: string;
  property_id: string;
  broker_id: string;
  status: LeadStatus;
  ai_score: number;
  priority: LeadPriority;
  source: string;
  budget?: number;
  notes?: string;
  follow_up_date?: string;
  visit_scheduled_at?: string;
  buyer?: Pick<User, 'id' | 'name' | 'phone' | 'email'>;
  property?: Pick<Property, 'id' | 'title' | 'locality' | 'city' | 'price' | 'images'>;
  created_at: string;
}

export interface Transaction {
  id: string;
  property_id: string;
  buyer_id: string;
  broker_id?: string;
  offer_price: number;
  final_price?: number;
  status: string;
  timeline: TimelineEntry[];
  loan_details?: LoanDetails;
  created_at: string;
  property?: Pick<Property, 'id' | 'title' | 'locality' | 'city' | 'images'>;
  buyer?: Pick<User, 'id' | 'name' | 'phone'>;
}

export interface TimelineEntry {
  status: string;
  timestamp: string;
  note: string;
}

export interface LoanDetails {
  bank_name: string;
  loan_amount: number;
  interest_rate: number;
  tenure_years: number;
  emi: number;
}

export interface SearchFilters {
  city?: string;
  locality?: string;
  type?: PropertyType;
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  furnishing?: FurnishingType;
  is_verified?: boolean;
  page?: number;
  sort?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
