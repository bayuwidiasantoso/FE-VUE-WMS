export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface Barang {
  id: number;
  nama_barang: string;
  sku: string;
  stok: number;
  stok_minimum: number;
  lokasi_rak: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransaksiBarang {
  id: number;
  barang_id: number;
  jenis: 'MASUK' | 'KELUAR';
  qty: number;
  tanggal: string;
  keterangan: string | null;
  created_at: string;
  updated_at: string;
  barang?: {
    id: number;
    nama_barang: string;
    sku: string;
    lokasi_rak: string | null;
  };
}

export interface LowStockMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  mode: 'stok_minimum' | 'threshold' | null;
  threshold: number | null;
}

export interface LowStockResponse {
  success: boolean;
  message: string;
  data: Barang[];
  meta: LowStockMeta;
  mode?: 'stok_minimum' | 'threshold' | null;     // mirror dari backend (opsional)
  threshold?: number | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    summary?: any; 
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  [key: string]: unknown;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  module: string;
  action: string;
  description?: string | null;
  data?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
}
