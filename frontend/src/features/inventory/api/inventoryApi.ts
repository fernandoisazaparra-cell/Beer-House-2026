import { authFetch } from '@/shared/lib/authFetch';

const API_URL = 'http://localhost:5000/api';

// =====================================================================
// INTERFACES
// =====================================================================

export interface InventoryMovement {
  id: number;
  product_id?: number;
  product_name: string;
  supplier_id?: number;
  supplier_name?: string;
  user_name?: string;
  movement_type: string;
  quantity: number;
  invoice_number?: string;
  reason?: string;
  created_at: string;
}

export interface DetailedStockAlert {
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  alert_level: 'CRITICO' | 'ADVERTENCIA';
  suggested_quantity: number;
  supplier_id: number | null;
  supplier_name: string;
  unit_cost: number;
}

export interface ReorderItem {
  product_id: number;
  product_name: string;
  current_stock: number;
  min_stock: number;
  suggested_quantity: number;
  unit_cost: number;
  total_estimated: number;
}

export interface ReorderSupplierGroup {
  supplier_id: number;
  supplier_name: string;
  items: ReorderItem[];
  total_order_cost: number;
}

export interface EntryData {
  product_id: number;
  supplier_id: number;
  quantity: number;
  invoice_number: string;
  reason?: string;
}

export interface AdjustmentData {
  product_id: number;
  quantity: number;
  movement_type: 'ADJUSTMENT_OUT' | 'ADJUSTMENT_IN';
  reason: string;
}

export interface SimpleEntity {
  id: number;
  name: string;
}

export interface PhysicalCount {
  id: number;
  product_id: number;
  product_name: string;
  system_stock: number;
  physical_stock: number;
  difference: number;
  difference_percentage: number;
  signed_act_url?: string;
  user_id: number;
  count_date: string;
}

export interface LossRecord {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  reason: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  user_id: number;
  approved_by: number | null;
  created_at: string;
}

// =====================================================================
// 1. MOVIMIENTOS E HISTORIAL
// =====================================================================

export const getInventoryHistory = async (): Promise<InventoryMovement[]> => {
  const res = await authFetch(`${API_URL}/inventory/history`);
  if (!res.ok) throw new Error('Error al obtener historial de inventario.');
  return res.json();
};

export const registerEntry = async (data: EntryData) => {
  const res = await authFetch(`${API_URL}/inventory/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al registrar entrada de inventario.');
  return body;
};

export const registerAdjustment = async (data: AdjustmentData) => {
  const res = await authFetch(`${API_URL}/inventory/adjustments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Error al registrar el ajuste de inventario.');
  return body;
};

// =====================================================================
// 2. CATÁLOGOS AUXILIARES
// =====================================================================

export const getProducts = async (): Promise<SimpleEntity[]> => {
  const res = await authFetch(`${API_URL}/products/`);
  if (!res.ok) throw new Error('Error al obtener catálogo de productos.');
  return res.json();
};

export const getSuppliers = async (): Promise<SimpleEntity[]> => {
  const res = await authFetch(`${API_URL}/suppliers`);
  if (!res.ok) throw new Error('Error al obtener catálogo de proveedores.');
  return res.json();
};

// =====================================================================
// 3. CONTEOS FÍSICOS Y AUDITORÍAS (RF-024 / RF-027)
// =====================================================================

export const getPhysicalCounts = async (): Promise<PhysicalCount[]> => {
  const res = await authFetch(`${API_URL}/inventory/physical-counts`);
  if (!res.ok) throw new Error('Error al consultar historial de conteos físicos.');
  return res.json();
};

export const createPhysicalCount = async (data: {
  product_id: number;
  physical_stock: number;
  user_id?: number;
  signed_act_url?: string;
}) => {
  const res = await authFetch(`${API_URL}/inventory/physical-counts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al registrar el conteo físico.');
  }
  return res.json();
};

export const applyStockAdjustment = async (
  countId: number,
  userRole: string = 'Supervisor',
  userName: string = 'Usuario Sistema',
  userId: number = 1
) => {
  const res = await authFetch(`${API_URL}/inventory/physical-counts/${countId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_role: userRole, user_name: userName, user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al aplicar el ajuste de stock.');
  }
  return res.json();
};

// =====================================================================
// 4. ALERTAS Y REABASTECIMIENTO AUTOMÁTICO (RF-028 / RN-026)
// =====================================================================

export const getStockAlerts = async (): Promise<DetailedStockAlert[]> => {
  const res = await authFetch(`${API_URL}/inventory/alerts`);
  if (!res.ok) throw new Error('Error al obtener alertas de stock mínimo.');
  return res.json();
};

export const generateReorderSuggestions = async (
  productIds: number[]
): Promise<{ message: string; suggestions: ReorderSupplierGroup[] }> => {
  const res = await authFetch(`${API_URL}/inventory/reorder-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_ids: productIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al generar propuesta de reabastecimiento.');
  }
  return res.json();
};

// =====================================================================
// 5. MERMAS Y PÉRDIDAS
// =====================================================================

export const getLossRecords = async (): Promise<LossRecord[]> => {
  const res = await authFetch(`${API_URL}/inventory/losses`);
  if (!res.ok) throw new Error('Error al consultar historial de mermas.');
  return res.json();
};

export const createLossRecord = async (data: {
  product_id: number;
  quantity: number;
  reason: string;
  user_id?: number;
}) => {
  const res = await authFetch(`${API_URL}/inventory/losses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al registrar la merma.');
  }
  return res.json();
};

export const processLossApproval = async (
  lossId: number,
  action: 'APROBAR' | 'RECHAZAR',
  userRole: string = 'Supervisor'
) => {
  const res = await authFetch(`${API_URL}/inventory/losses/${lossId}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, user_role: userRole }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al procesar la merma.');
  }
  return res.json();
};