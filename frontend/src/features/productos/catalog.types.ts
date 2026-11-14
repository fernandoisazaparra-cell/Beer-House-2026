// Tipos del catálogo del cliente (lo que responde /api/catalog)
export type CatalogOrder = 'recientes' | 'menor' | 'mayor' | 'nombre';

export interface CatalogProduct {
  id: number;
  name: string;
  liquor_type: string;
  price: number;
  stock: number;
  image_url: string | null;
  description: string;
  legal_warning: string;
}

export interface CatalogTypeFacet {
  name: string;
  count: number;
}

export interface CatalogResponse {
  items: CatalogProduct[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
  filters: {
    types: CatalogTypeFacet[];
    price_min: number;
    price_max: number;
  };
}

export interface CatalogFilters {
  search: string;
  types: string[];
  minPrice: number | null;
  maxPrice: number | null;
  order: CatalogOrder;
  page: number;
}