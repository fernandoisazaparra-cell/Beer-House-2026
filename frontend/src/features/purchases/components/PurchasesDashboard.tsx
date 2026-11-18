import React, { useEffect, useState } from "react";
import { CreateOrderModal } from "./CreateOrderModal";
import { CreateInvoiceModal } from "./CreateInvoiceModal";
import { PayInvoiceModal } from "./PayInvoiceModal";
import { receivePurchaseOrder, getPurchaseInvoices } from "../api/purchasesApi";
import { authFetch, downloadWithAuth } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";
import { styles } from "./purchases.styles";

// ==========================================
// TIPOS
// ==========================================

type PurchaseOrderItem = {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  quantity_received?: number;
};

type PurchaseOrder = {
  id?: number | string;
  order_number?: string | number;
  supplier_name?: string;
  created_at?: string;
  expected_date?: string;
  payment_method?: string;
  total_amount?: number | string;
  status?: string;
  items?: PurchaseOrderItem[];
};

type PurchaseInvoice = {
  id?: number | string;
  invoice_number?: string;
  purchase_order_id?: number;
  supplier_name?: string;
  amount?: number | string;
  invoice_date?: string;
  due_date?: string;
  payment_status?: string;
  file_url?: string;
};

type SummaryData = {
  total_orders: number;
  pending_orders: number;
  received_orders: number;
  total_spent: number;
};

type Tab = "orders" | "invoices";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const orderStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "recibida":
      return "#2e7d32";
    case "parcial":
      return "#0288d1";
    case "cancelada":
      return "#d32f2f";
    default:
      return "#f57c00"; // pendiente
  }
};

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatOptionalDate = (value?: string) => (value ? formatDate(value) : "—");

const formatMoney = (value?: number | string) => {
  const numericValue = Number(value ?? 0);
  return `$${numericValue.toLocaleString("es-ES")}`;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export const PurchasesDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    total_orders: 0,
    pending_orders: 0,
    received_orders: 0,
    total_spent: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Modales
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);

  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<PurchaseOrder | null>(null);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<PurchaseInvoice | null>(null);

  // ---------- Carga de datos ----------

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Órdenes
      const resOrders = await authFetch(`${API_URL}/purchases/orders`);
      if (resOrders.ok) {
        const dataOrders = await resOrders.json();
        setOrders(
          Array.isArray(dataOrders)
            ? dataOrders.map((order: any) => ({
                id: order?.id ?? order?.order_id,
                order_number: order?.order_number ?? "N/A",
                supplier_name: order?.supplier_name ?? "Sin proveedor",
                created_at: order?.created_at ?? "",
                expected_date: order?.expected_date ?? "",
                payment_method: order?.payment_method ?? "",
                total_amount: order?.total_amount ?? 0,
                status: order?.status ?? "Pendiente",
                items: order?.items ?? [],
              }))
            : []
        );
      }

      // 2. Facturas
      try {
        const dataInvoices = await getPurchaseInvoices();
        setInvoices(Array.isArray(dataInvoices) ? dataInvoices : []);
      } catch (e) {
        console.error("Error facturas:", e);
      }

      // 3. Métricas KPI
      try {
        const resSummary = await authFetch(`${API_URL}/purchases/summary`);
        if (resSummary.ok) {
          const dataSummary = await resSummary.json();
          setSummary({
            total_orders: Number(dataSummary.total_orders ?? 0),
            pending_orders: Number(dataSummary.pending_orders ?? 0),
            received_orders: Number(dataSummary.received_orders ?? 0),
            total_spent: Number(dataSummary.total_spent ?? 0),
          });
        }
      } catch (e) {
        console.error("Error resumen:", e);
      }
    } catch (err) {
      console.error("Error al cargar compras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------- Acciones ----------

  const handleReceiveOrder = async (order: PurchaseOrder) => {
    try {
      let itemsToReceive = order.items;

      // Si los ítems no vienen en la tabla, los consultamos al backend
      if (!itemsToReceive || itemsToReceive.length === 0) {
        const res = await authFetch(`${API_URL}/purchases/orders/${order.id}`);
        if (res.ok) {
          const orderDetail = await res.json();
          itemsToReceive = orderDetail.items || [];
        }
      }

      if (!itemsToReceive || itemsToReceive.length === 0) {
        throw new Error("Esta orden no contiene productos asociados para recibir.");
      }

      // Mapea los ítems enviando la cantidad pendiente por recibir
      const receivedItemsPayload = itemsToReceive.map((item: any) => ({
        item_id: item.id ?? item.item_id,
        quantity_received: item.quantity - (item.quantity_received || 0),
      }));

      await receivePurchaseOrder(Number(order.id), receivedItemsPayload);
      alert("Orden recibida correctamente e inventario actualizado.");
      loadData();
    } catch (error: any) {
      alert(error.message || "Error al recibir la orden");
    }
  };

  const handleOpenInvoiceModal = (order: PurchaseOrder) => {
    setSelectedOrderForInvoice(order);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenPayModal = (inv: PurchaseInvoice) => {
    setSelectedInvoiceForPay(inv);
    setIsPayModalOpen(true);
  };

  const handleExportExcel = (type: Tab) => {
    downloadWithAuth(
      `${API_URL}/purchases/export/excel?type=${type}`,
      type === "invoices" ? "Reporte_Facturas_Proveedores.csv" : "Reporte_Ordenes_Compra.csv"
    ).catch((err) => alert(err.message));
  };

  // ---------- Render ----------

  return (
    <div style={styles.page}>
      {/* Cabecera */}
      <div style={styles.header}>
        <h1 style={styles.title}>Control de Compras - Beer House 2026</h1>
        <div style={styles.headerActions}>
          <button onClick={() => handleExportExcel(activeTab)} style={styles.headerButton("#1565c0")}>
            Exportar Reporte Excel/CSV
          </button>
          <button onClick={() => setIsOrderModalOpen(true)} style={styles.headerButton("#2e7d32")}>
            + Generar Orden de Compra
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div style={styles.kpiRow}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Gastado en Compras</span>
          <h2 style={styles.kpiValue("#4caf50")}>{formatMoney(summary.total_spent)}</h2>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Órdenes Recibidas</span>
          <h2 style={styles.kpiValue("#2196f3")}>{summary.received_orders}</h2>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Órdenes Pendientes</span>
          <h2 style={styles.kpiValue("#ff9800")}>{summary.pending_orders}</h2>
        </div>
      </div>

      {/* Pestañas */}
      <div style={styles.tabsRow}>
        <button onClick={() => setActiveTab("orders")} style={styles.tab(activeTab === "orders", "#4caf50")}>
          Órdenes de Compra ({orders.length})
        </button>
        <button onClick={() => setActiveTab("invoices")} style={styles.tab(activeTab === "invoices", "#2196f3")}>
          Facturas y Cuentas por Pagar ({invoices.length})
        </button>
      </div>

      {/* Tabla 1: Órdenes de Compra */}
      {activeTab === "orders" && (
        <table style={styles.table}>
          <thead>
            <tr style={styles.headRow}>
              <th style={styles.th}>N° Orden</th>
              <th style={styles.th}>Proveedor</th>
              <th style={styles.th}>Fecha</th>
              <th style={styles.th}>Fecha Estimada</th>
              <th style={styles.th}>Forma de Pago</th>
              <th style={styles.th}>Monto Total</th>
              <th style={styles.th}>Estado</th>
              <th style={styles.thCenter}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              orders.map((order, index) => {
                const status = String(order.status ?? "Pendiente");
                const isPending = status.toLowerCase() === "pendiente";
                const isReceived = status.toLowerCase() === "recibida";

                return (
                  <tr key={order.id ?? `order-${index}`} style={styles.bodyRow}>
                    <td style={styles.tdBold}>{order.order_number ?? "N/A"}</td>
                    <td style={styles.td}>{order.supplier_name ?? "Sin proveedor"}</td>
                    <td style={styles.td}>{formatDate(order.created_at)}</td>
                    <td style={styles.td}>{formatOptionalDate(order.expected_date)}</td>
                    <td style={styles.td}>{order.payment_method || "—"}</td>
                    <td style={styles.td}>{formatMoney(order.total_amount)}</td>
                    <td style={styles.td}>
                      <span style={styles.badge(orderStatusColor(status))}>{status.toUpperCase()}</span>
                    </td>
                    <td style={styles.tdCenter}>
                      {isPending && order.id && (
                        <button onClick={() => handleReceiveOrder(order)} style={styles.rowButton("#2e7d32")}>
                          Recibir
                        </button>
                      )}
                      {isReceived && order.id && (
                        <button onClick={() => handleOpenInvoiceModal(order)} style={styles.rowButton("#1565c0")}>
                          + Factura
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}

      {/* Tabla 2: Facturas de Proveedores y Cuentas por Pagar */}
      {activeTab === "invoices" && (
        <table style={styles.table}>
          <thead>
            <tr style={styles.headRow}>
              <th style={styles.th}>N° Factura</th>
              <th style={styles.th}>Orden Asoc.</th>
              <th style={styles.th}>Monto</th>
              <th style={styles.th}>Fecha Emisión</th>
              <th style={styles.th}>Fecha Vencimiento</th>
              <th style={styles.th}>Estado Pago</th>
              <th style={styles.thCenter}>Acción Pago</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              invoices.map((inv, index) => {
                const isPaid = inv.payment_status === "Pagada";

                return (
                  <tr key={inv.id ?? `inv-${index}`} style={styles.bodyRow}>
                    <td style={{ ...styles.tdBold, color: "#64b5f6" }}>{inv.invoice_number}</td>
                    <td style={styles.td}>ID Orden #{inv.purchase_order_id}</td>
                    <td style={styles.td}>{formatMoney(inv.amount)}</td>
                    <td style={styles.td}>{formatDate(inv.invoice_date)}</td>
                    <td style={styles.td}>{formatDate(inv.due_date)}</td>
                    <td style={styles.td}>
                      <span style={styles.badge(isPaid ? "#2e7d32" : "#d32f2f")}>
                        {(inv.payment_status || "PENDIENTE").toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.tdCenter}>
                      {!isPaid ? (
                        <button onClick={() => handleOpenPayModal(inv)} style={styles.rowButton("#2e7d32")}>
                          Pagar Factura
                        </button>
                      ) : (
                        <span style={{ color: "#aaa", fontSize: "12px" }}>✓ Pagado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}

      {/* Modales */}
      <CreateOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={loadData}
      />
      <CreateInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSuccess={loadData}
        orderId={Number(selectedOrderForInvoice?.id)}
        orderNumber={String(selectedOrderForInvoice?.order_number)}
        suggestedAmount={Number(selectedOrderForInvoice?.total_amount)}
      />
      <PayInvoiceModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        onSuccess={loadData}
        invoiceId={Number(selectedInvoiceForPay?.id)}
        invoiceNumber={String(selectedInvoiceForPay?.invoice_number)}
        amount={Number(selectedInvoiceForPay?.amount)}
      />
    </div>
  );
};