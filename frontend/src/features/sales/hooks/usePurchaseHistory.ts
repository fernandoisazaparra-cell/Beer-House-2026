
import { useCallback, useEffect, useState } from "react";
import { getPurchaseHistory } from "../api/salesApi";
import type { Sale } from "../types/sales.types";

export const usePurchaseHistory = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPurchaseHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getPurchaseHistory();

      if (!response || !Array.isArray(response.sales)) {
        throw new Error(
          "El servidor devolvió una respuesta inválida."
        );
      }

      setSales(response.sales);
    } catch (err) {
      setSales([]);

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar el historial."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchaseHistory();
  }, [loadPurchaseHistory]);

  return {
    sales,
    loading,
    error,
    reload: loadPurchaseHistory,
  };
};
