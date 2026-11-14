import { API_URL } from '@/app/api';
import { authFetch } from '@/shared/lib/authFetch';
import type { CatalogFilters, CatalogProduct, CatalogResponse } from '../catalog.types';

export const CATALOG_PER_PAGE = 12;

export class CatalogError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'CatalogError';
    this.status = status;
    this.code = code;
  }
}

const parse = async <T>(res: Response, fallback: string): Promise<T> => {
  if (res.ok) return res.json();
  const body = await res.json().catch(() => ({}));
  throw new CatalogError(body.error || fallback, res.status, body.code);
};

export const getCatalog = async (
  filters: CatalogFilters,
  signal?: AbortSignal
): Promise<CatalogResponse> => {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.types.length) params.set('types', filters.types.join(','));
  if (filters.minPrice !== null) params.set('min_price', String(filters.minPrice));
  if (filters.maxPrice !== null) params.set('max_price', String(filters.maxPrice));
  params.set('order', filters.order);
  params.set('page', String(filters.page));
  params.set('per_page', String(CATALOG_PER_PAGE));

  const res = await authFetch(`${API_URL}/catalog/?${params.toString()}`, { signal });
  return parse<CatalogResponse>(res, 'No se pudo cargar el catálogo.');
};

export const getCatalogProduct = async (
  id: number,
  signal?: AbortSignal
): Promise<CatalogProduct> => {
  const res = await authFetch(`${API_URL}/catalog/${id}`, { signal });
  return parse<CatalogProduct>(res, 'No se pudo cargar el producto.');
};