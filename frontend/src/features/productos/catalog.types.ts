// Tipos del catálogo del cliente (lo que responde /api/catalog)
export type CatalogOrder = 'recientes' | 'menor' | 'mayor' | 'nombre';

// RF-015 / RN-014: texto legal exacto y único.
export const DEFAULT_LEGAL_WARNING = 'Prohibida su venta a menores de 18 años';

const LEGACY_LEGAL_WARNINGS = [
  'Prohibida la venta de bebidas embriagantes a menores de edad.',
  'Prohibida la venta de bebidas embriagantes a menores de edad',
  'Prohibida la venta de alcohol a menores de 18 años.',
];

/** Normaliza textos heredados; conserva una advertencia editada por admin. */
export const resolveLegalWarning = (value?: string | null): string => {
  const text = (value ?? '').trim();
  if (!text || LEGACY_LEGAL_WARNINGS.includes(text)) return DEFAULT_LEGAL_WARNING;
  return text;
};

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