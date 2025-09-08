// TypeScript type definitions

export interface User {
  id: number;
  name: string;
  order_number: string;
  email: string;
  password_hash?: string; // フロントエンドには送信しない
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: number;
  user_id: number;
  image_number: number; // 1-5
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface RegisterRequest {
  name: string;
  order_number: string;
  email: string;
  password: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'password_hash'>;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Cloudflare Bindings
export interface CloudflareBindings {
  DB: D1Database;
  R2: R2Bucket;
}