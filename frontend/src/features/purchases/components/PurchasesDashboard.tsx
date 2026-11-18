import React, { useEffect, useState } from "react";
import { CreateOrderModal } from "./CreateOrderModal";
import { CreateInvoiceModal } from "./CreateInvoiceModal";
import { PayInvoiceModal } from "./PayInvoiceModal";
import { receivePurchaseOrder, getPurchaseInvoices } from "../api/purchasesApi";
import { authFetch, downloadWithAuth } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";

type PurchaseOrder = {
  id?: number | string;
  order_number?: string | number;
  supplier_name?: string;
  created_at?: string;
  total_amount?: number | string;
  status?: string;
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

export const PurchasesDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"orders" | "invoices">("orders");
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
                total_amount: order?.total_amount ?? 0,
                status: order?.status ?? "Pendiente",
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

  const formatDate = (value?: string) => {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatMoney = (value?: number | string) => {
    const numericValue = Number(value ?? 0);
    return `$${numericValue.toLocaleString("es-ES")}`;
  };

  const handleReceiveOrder = async (orderId: number | string) => {
    try {
      await receivePurchaseOrder(Number(orderId));
      alert("Orden recibida correctamente e inventario actualizado.");
      loadData();
    } catch (error: any) {
      alert(error.message || "Error al recibir la orden");
    }
  };

  const handleOpenPayModal = (inv: PurchaseInvoice) => {
    setSelectedInvoiceForPay(inv);
    setIsPayModalOpen(true);
  };

  const handleExportExcel = (type: "orders" | "invoices") => {
    downloadWithAuth(
      `${API_URL}/purchases/export/excel?type=${type}`,
      type === "invoices" ? "Reporte_Facturas_Proveedores.csv" : "Reporte_Ordenes_Compra.csv"
    ).catch((err) => alert(err.message));
  };
  return (
    <div style={{ padding: "20px", backgroundColor: "#121212", color: "#fff", minHeight: "100vh" }}>
      {/* Cabecera */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <h1 style={{ fontSize: "24px", margin: 0 }}>Control de Compras - Beer House 2026</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => handleExportExcel(activeTab)}
            style={{ backgroundColor: "#1565c0", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
             Exportar Reporte Excel/CSV
          </button>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "10px 15px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
          >
            + Generar Orden de Compra
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
        <div style={{ flex: 1, backgroundColor: "#1e1e1e", padding: "15px", borderRadius: "6px", border: "1px solid #333" }}>
          <span style={{ fontSize: "12px", color: "#aaa" }}>Total Gastado en Compras</span>
          <h2 style={{ margin: "5px 0 0 0", color: "#4caf50", fontSize: "22px" }}>{formatMoney(summary.total_spent)}</h2>
        </div>
        <div style={{ flex: 1, backgroundColor: "#1e1e1e", padding: "15px", borderRadius: "6px", border: "1px solid #333" }}>
          <span style={{ fontSize: "12px", color: "#aaa" }}>Órdenes Recibidas</span>
          <h2 style={{ margin: "5px 0 0 0", color: "#2196f3", fontSize: "22px" }}>{summary.received_orders}</h2>
        </div>
        <div style={{ flex: 1, backgroundColor: "#1e1e1e", padding: "15px", borderRadius: "6px", border: "1px solid #333" }}>
          <span style={{ fontSize: "12px", color: "#aaa" }}>Órdenes Pendientes</span>
          <h2 style={{ margin: "5px 0 0 0", color: "#ff9800", fontSize: "22px" }}>{summary.pending_orders}</h2>
        </div>
      </div>

      {/* Navegación Pestañas */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            backgroundColor: activeTab === "orders" ? "#2a2a2a" : "#1a1a1a",
            color: activeTab === "orders" ? "#4caf50" : "#aaa",
            border: "1px solid #333",
            padding: "8px 16px",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Órdenes de Compra ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          style={{
            backgroundColor: activeTab === "invoices" ? "#2a2a2a" : "#1a1a1a",
            color: activeTab === "invoices" ? "#2196f3" : "#aaa",
            border: "1px solid #333",
            padding: "8px 16px",
            borderRadius: "4px 4px 0 0",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Facturas y Cuentas por Pagar ({invoices.length})
        </button>
      </div>

      {/* Tabla 1: Órdenes de Compra */}
      {activeTab === "orders" && (
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#1e1e1e", borderRadius: "6px", overflow: "hidden" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", textAlign: "left", color: "#aaa" }}>
              <th style={{ padding: "12px" }}>N° Orden</th>
              <th style={{ padding: "12px" }}>Proveedor</th>
              <th style={{ padding: "12px" }}>Fecha</th>
              <th style={{ padding: "12px" }}>Monto Total</th>
              <th style={{ padding: "12px" }}>Estado</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              orders.map((order, index) => {
                const status = String(order.status ?? "Pendiente");
                const isPending = status.toLowerCase() === "pendiente";
                const isReceived = status.toLowerCase() === "recibida";

                return (
                  <tr key={order.id ?? `order-${index}`} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "12px", fontWeight: "bold" }}>{order.order_number ?? "N/A"}</td>
                    <td style={{ padding: "12px" }}>{order.supplier_name ?? "Sin proveedor"}</td>
                    <td style={{ padding: "12px" }}>{formatDate(order.created_at)}</td>
                    <td style={{ padding: "12px" }}>{formatMoney(order.total_amount)}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ backgroundColor: isPending ? "#f57c00" : "#2e7d32", padding: "3px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: "bold" }}>
                        {status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {isPending && order.id && (
                        <button onClick={() => handleReceiveOrder(order.id!)} style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
                          Recibir
                        </button>
                      )}
                      {isReceived && order.id && (
                        <button onClick={() => { setSelectedOrderForInvoice(order); setIsInvoiceModalOpen(true); }} style={{ backgroundColor: "#1565c0", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
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
        <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#1e1e1e", borderRadius: "6px", overflow: "hidden" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", textAlign: "left", color: "#aaa" }}>
              <th style={{ padding: "12px" }}>N° Factura</th>
              <th style={{ padding: "12px" }}>Orden Asoc.</th>
              <th style={{ padding: "12px" }}>Monto</th>
              <th style={{ padding: "12px" }}>Fecha Emisión</th>
              <th style={{ padding: "12px" }}>Fecha Vencimiento</th>
              <th style={{ padding: "12px" }}>Estado Pago</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Acción Pago</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              invoices.map((inv, index) => {
                const isPaid = inv.payment_status === "Pagada";
                return (
                  <tr key={inv.id ?? `inv-${index}`} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "12px", fontWeight: "bold", color: "#64b5f6" }}>{inv.invoice_number}</td>
                    <td style={{ padding: "12px" }}>ID Orden #{inv.purchase_order_id}</td>
                    <td style={{ padding: "12px" }}>{formatMoney(inv.amount)}</td>
                    <td style={{ padding: "12px" }}>{formatDate(inv.invoice_date)}</td>
                    <td style={{ padding: "12px" }}>{formatDate(inv.due_date)}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ backgroundColor: isPaid ? "#2e7d32" : "#d32f2f", padding: "3px 8px", borderRadius: "3px", fontSize: "11px", fontWeight: "bold" }}>
                        {(inv.payment_status || "PENDIENTE").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      {!isPaid ? (
                        <button onClick={() => handleOpenPayModal(inv)} style={{ backgroundColor: "#2e7d32", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
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
      <CreateOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} onSuccess={loadData} />
      <CreateInvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onSuccess={loadData} orderId={Number(selectedOrderForInvoice?.id)} orderNumber={String(selectedOrderForInvoice?.order_number)} suggestedAmount={Number(selectedOrderForInvoice?.total_amount)} />
      <PayInvoiceModal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} onSuccess={loadData} invoiceId={Number(selectedInvoiceForPay?.id)} invoiceNumber={String(selectedInvoiceForPay?.invoice_number)} amount={Number(selectedInvoiceForPay?.amount)} />
    </div>
  );
};
