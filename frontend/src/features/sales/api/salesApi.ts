import type { PurchaseHistoryResponse } from "../types/sales.types";

export const getPurchaseHistory =
  async (): Promise<PurchaseHistoryResponse> => {
    const token = localStorage.getItem("bh_token");

    if (!token) {
      throw new Error(
        "No se encontró la sesión. Inicia sesión nuevamente."
      );
    }

    const response = await fetch("/api/purchases/history/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message ||
        "No se pudo cargar el historial de compras."
      );
    }

    return data as PurchaseHistoryResponse;
  };