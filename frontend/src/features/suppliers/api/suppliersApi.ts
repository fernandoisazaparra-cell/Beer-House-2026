import { authFetch } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";

export const getSuppliers = async (includeInactive = false) => {
  const res = await authFetch(`${API_URL}/suppliers?include_inactive=${includeInactive}`);
  if (!res.ok) throw new Error("Error al obtener proveedores.");
  return res.json();
};

export const createSupplier = async (data: any) => {
  const res = await authFetch(`${API_URL}/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al crear proveedor.");
  }
  return res.json();
};

export const updateSupplier = async (id: number, data: any) => {
  const res = await authFetch(`${API_URL}/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al actualizar proveedor.");
  }
  return res.json();
};

export const toggleSupplierStatus = async (id: number, isActive: boolean) => {
  const res = await authFetch(`${API_URL}/suppliers/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Error al cambiar estado del proveedor.");
  }
  return res.json();
};
