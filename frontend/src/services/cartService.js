import { API_URL } from "@/app/api";
import { authFetch } from "@/shared/lib/authFetch";

/**
 * Valida el carrito contra el backend (RF-019 / RN-012 / RN-018).
 * El backend es la fuente de verdad: recalcula precios y stock.
 * No existe "fail open": si no se puede validar, la compra se bloquea.
 */
export async function validateCartWithBackend(cartItems) {
  const items = cartItems.map((item) => ({
    product_id: Number(item.id),
    quantity: Number(item.quantity),
  }));

  const response = await authFetch(`${API_URL}/sales/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || data.message || "No se pudo validar el carrito."
    );
  }

  return {
    success: Boolean(data.ok),
    items: data.items || [],
    issues: data.issues || [],
    total: data.total,
  };
}
