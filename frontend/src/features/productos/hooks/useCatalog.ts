import { useCallback, useEffect, useState } from 'react';
import { CatalogError, getCatalog } from '../api/catalogApi';
import type { CatalogFilters, CatalogOrder, CatalogResponse } from '../catalog.types';

const INITIAL_FILTERS: CatalogFilters = {
  search: '',
  types: [],
  minPrice: null,
  maxPrice: null,
  order: 'recientes',
  page: 1,
};

const toPrice = (value: string): number | null => {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export const useCatalog = () => {
  // Filtros ya aplicados (los que se mandan al backend)
  const [filters, setFilters] = useState<CatalogFilters>(INITIAL_FILTERS);

  // Lo que el usuario está escribiendo (se aplica con un pequeño retraso)
  const [searchInput, setSearchInput] = useState('');
  const [minInput, setMinInput] = useState('');
  const [maxInput, setMaxInput] = useState('');

  const [data, setData] = useState<CatalogResponse | null>(null);
  // Resultado de la última consulta terminada (con los filtros a los que respondió)
  const [outcome, setOutcome] = useState<{
    filters: CatalogFilters;
    error: string | null;
    errorCode: string | null;
  } | null>(null);

  // Espera 400 ms desde la última tecla para no llamar al backend en cada letra
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        const search = searchInput.trim();
        const minPrice = toPrice(minInput);
        const maxPrice = toPrice(maxInput);
        if (prev.search === search && prev.minPrice === minPrice && prev.maxPrice === maxPrice) {
          return prev;
        }
        return { ...prev, search, minPrice, maxPrice, page: 1 };
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, minInput, maxInput]);

  // Consulta el backend cada vez que cambian los filtros aplicados
  useEffect(() => {
    const controller = new AbortController();

    getCatalog(filters, controller.signal)
      .then((response) => {
        setData(response);
        setOutcome({ filters, error: null, errorCode: null });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setOutcome({
          filters,
          error: err instanceof Error ? err.message : 'No se pudo cargar el catálogo.',
          errorCode: err instanceof CatalogError ? (err.code ?? null) : null,
        });
      });

    return () => controller.abort();
  }, [filters]);

  // Se deriva (no se guarda): hay una consulta en curso si aún no respondió a estos filtros
  const answered = outcome?.filters === filters;
  const loading = !answered;
  const error = answered ? outcome.error : null;
  const errorCode = answered ? outcome.errorCode : null;

  const toggleType = useCallback((name: string) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(name) ? prev.types.filter((t) => t !== name) : [...prev.types, name],
      page: 1,
    }));
  }, []);

  const setOrder = useCallback((order: CatalogOrder) => {
    setFilters((prev) => ({ ...prev, order, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearSearch = useCallback(() => setSearchInput(''), []);

  const clearPrice = useCallback(() => {
    setMinInput('');
    setMaxInput('');
  }, []);

  const clearAll = useCallback(() => {
    setSearchInput('');
    setMinInput('');
    setMaxInput('');
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    data, loading, error, errorCode, filters,
    searchInput, setSearchInput,
    minInput, setMinInput,
    maxInput, setMaxInput,
    toggleType, setOrder, setPage,
    clearSearch, clearPrice, clearAll,
  };
};