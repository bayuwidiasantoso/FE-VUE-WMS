import type { ApiResponse, PaginatedResponse, Barang, TransaksiBarang, LowStockResponse } from '../types';
import type { ActivityLog, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';


// Default Request
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  // Pakai Record<string, string> supaya bisa pakai ['Content-Type']
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  // Gabungkan headers dari options (kalau ada)
  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  // Kalau bukan FormData, set Content-Type JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Tambah Authorization kalau ada token
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers, // <-- Record<string, string> kompatibel dengan HeadersInit
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw json || new Error('Request error');
  }

  return json as T;
}

// ===== AUTH =======
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export interface MeResponse {
  success: boolean;
  user: User;
}

export async function fetchMe(): Promise<MeResponse> {
  return request<MeResponse>('/auth/me');
}

export async function logoutApi(): Promise<void> {
  await request('/auth/logout', {
    method: 'POST',
  });
}


// === BARANG ===
export async function getBarangs(): Promise<ApiResponse<Barang[]>> {
  return request<ApiResponse<Barang[]>>('/barang');
}

export async function createBarang(payload: {
  nama_barang: string;
  sku: string;
  stok: number;
  stok_minimum?: number;
  lokasi_rak?: string | null;
}): Promise<ApiResponse<Barang>> {
  return request<ApiResponse<Barang>>('/barang', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBarang(
  id: number,
  payload: {
    nama_barang: string;
    sku: string;
    stok: number;
    stok_minimum?: number;
    lokasi_rak?: string | null;
  }
): Promise<ApiResponse<Barang>> {
  return request<ApiResponse<Barang>>(`/barang/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteBarang(id: number): Promise<ApiResponse<null>> {
  return request<ApiResponse<null>>(`/barang/${id}`, {
    method: 'DELETE',
  });
}

// Detail barang + riwayat
export async function getBarangDetailWithHistory(id: number) {
  return request<ApiResponse<{ barang: Barang; history: TransaksiBarang[] }>>(
    `/barang/${id}/detail`
  );
}

// Autocomplete Barang
// export async function autocompleteBarangs(q: string): Promise<Barang[]> {
//   if (!q.trim()) return [];
//   const params = new URLSearchParams({ q });
//   const res = await fetch(`${API_BASE_URL}/barang/autocomplete?${params.toString()}`);
//   if (!res.ok) throw new Error('Gagal autocomplete barang');
//   const json = await res.json();
//   return json.data || [];
// }

// kalau belum ada type ini, boleh sederhana saja:
interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
}

export async function autocompleteBarangs(q: string): Promise<Barang[]> {
  if (!q.trim()) return [];

  const params = new URLSearchParams({ q });
  const url = `/barang/autocomplete?${params.toString()}`;

  const res = await request<ListResponse<Barang>>(url);
  return res.data || [];
}


// === TRANSAKSI ===
export interface TransaksiFilter {
  jenis?: 'MASUK' | 'KELUAR' | '';
  tanggal_from?: string;
  tanggal_to?: string;
  barang_id?: number | '';
  page?: number;
  per_page?: number;
  sort_by?: 'tanggal' | 'qty' | 'jenis';
  sort_dir?: 'asc' | 'desc';
}

export async function getTransaksi(params: TransaksiFilter = {}): Promise<PaginatedResponse<TransaksiBarang>> {
  const query = new URLSearchParams();

  if (params.jenis) query.set('jenis', params.jenis);
  if (params.tanggal_from) query.set('tanggal_from', params.tanggal_from);
  if (params.tanggal_to) query.set('tanggal_to', params.tanggal_to);
  if (params.barang_id) query.set('barang_id', String(params.barang_id));
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  if (params.sort_by)      query.set('sort_by', params.sort_by);
  if (params.sort_dir)     query.set('sort_dir', params.sort_dir);

  const qs = query.toString();
  const url = qs ? `/transaksi?${qs}` : '/transaksi';

  return request<PaginatedResponse<TransaksiBarang>>(url);
}

export async function createTransaksi(payload: {
  barang_id: number;
  jenis: 'MASUK' | 'KELUAR';
  qty: number;
  tanggal?: string;
  keterangan?: string;
}) {
  return request<ApiResponse<TransaksiBarang>>('/transaksi', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// === DASHBOARD ===
export interface DashboardSummary {
  total_barang: number;
  total_stok: number;
  total_masuk_hari_ini: number;
  total_keluar_hari_ini: number;
  top_barang: {
    barang_id: number;
    nama_barang: string;
    sku: string;
    total_qty: number;
  }[];
}

export async function getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  return request<ApiResponse<DashboardSummary>>('/dashboard/summary');
}

export interface DashboardTimeSeries {
  labels: string[];
  masuk: number[];
  keluar: number[];
}

export async function getDashboardTimeSeries(days = 7): Promise<ApiResponse<DashboardTimeSeries>> {
  return request<ApiResponse<DashboardTimeSeries>>(`/dashboard/time-series?days=${days}`);
}

// === LAPORAN STOK RENDAH ===
export interface LowStockParams {
  threshold?: number;
  page?: number;
  per_page?: number;
}

export async function getLowStock(
  params: LowStockParams = {}
): Promise<LowStockResponse> {
  const query = new URLSearchParams();

  if (params.threshold !== undefined) {
    query.set('threshold', String(params.threshold));
  }
  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }
  if (params.per_page !== undefined) {
    query.set('per_page', String(params.per_page));
  }

  const qs = query.toString();
  const url = qs ? `/laporan/stok-rendah?${qs}` : '/laporan/stok-rendah';

  return request<LowStockResponse>(url);
}

// Import Barang
export async function importBarangs(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/imports/barang`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err || new Error('Gagal import barang');
  }
  return res.json();
}

// Import Transaksi
export async function importTransaksi(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/imports/transaksi`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw err || new Error('Gagal import transaksi');
  }
  return res.json();
}

// Activity Logs
export interface ActivityLogFilter {
  module?: string;
  action?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export async function getActivityLogs(
  params: ActivityLogFilter = {}
): Promise<PaginatedResponse<ActivityLog>> {
  const query = new URLSearchParams();

  if (params.module) query.set('module', params.module);
  if (params.action) query.set('action', params.action);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));

  const url = query.toString()
    ? `/activity-logs?${query.toString()}`
    : '/activity-logs';

  return request<PaginatedResponse<ActivityLog>>(url);
}