import React, { useEffect, useState } from "react";
import { getStockAlerts, generateReorderSuggestions, type DetailedStockAlert } from "../../features/inventory/api/inventoryApi";

export const StockAlertsDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<DetailedStockAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getStockAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar alertas de stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleGeneratePurchaseOrders = async () => {
    if (alerts.length === 0) {
      alert("No hay productos con alertas de stock para reabastecer.");
      return;
    }

    try {
      const allProductIds = alerts.map((a) => a.product_id);
      const res = await generateReorderSuggestions(allProductIds);
      setSuggestions(res.suggestions);
      alert("Sugerencias de Orden de Compra agrupadas por proveedor generadas exitosamente.");
    } catch (err: any) {
      alert(err.message || "Error al generar sugerencias.");
    }
  };

  return (
    <div style={{ padding: "20px", backgroundColor: "#121212", color: "#fff", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <div>
          <h1 style={{ fontSize: "24px", margin: 0 }}>Alertas y Reabastecimiento Automático (RF-028)</h1>
          <p style={{ color: "#aaa", fontSize: "13px", margin: "5px 0 0 0" }}>
            Productos en nivel crítico o por debajo de su stock mínimo de seguridad
          </p>
        </div>
        <button
          onClick={handleGeneratePurchaseOrders}
          disabled={alerts.length === 0}
          style={{
            backgroundColor: alerts.length > 0 ? "#1565c0" : "#444",
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: "4px",
            cursor: alerts.length > 0 ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >
          ⚡ Generar Orden de Compra Sugerida ({alerts.length})
        </button>
      </div>

      {/* Tabla sin columna de Checkbox */}
      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#1e1e1e", borderRadius: "6px", overflow: "hidden", marginBottom: "30px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #333", textAlign: "left", color: "#aaa" }}>
            <th style={{ padding: "12px" }}>Estado</th>
            <th style={{ padding: "12px" }}>Producto</th>
            <th style={{ padding: "12px" }}>Proveedor Asignado</th>
            <th style={{ padding: "12px" }}>Stock Actual</th>
            <th style={{ padding: "12px" }}>Stock Mínimo</th>
            <th style={{ padding: "12px" }}>Sugerido a Pedir</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#aaa" }}>
                Verificando niveles de inventario...
              </td>
            </tr>
          )}

          {!loading && alerts.map((a) => (
            <tr key={a.product_id} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "12px" }}>
                <span
                  style={{
                    backgroundColor: a.alert_level === "CRITICO" ? "#c62828" : "#f57c00",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {a.alert_level === "CRITICO" ? "AGOTADO" : "STOCK BAJO"}
                </span>
              </td>
              <td style={{ padding: "12px", fontWeight: "bold" }}>{a.product_name}</td>
              <td style={{ padding: "12px", color: "#aaa" }}>{a.supplier_name}</td>
              <td style={{ padding: "12px", color: a.current_stock === 0 ? "#f44336" : "#ffb74d", fontWeight: "bold" }}>
                {a.current_stock} un.
              </td>
              <td style={{ padding: "12px" }}>{a.min_stock} un.</td>
              <td style={{ padding: "12px", color: "#4caf50", fontWeight: "bold" }}>
                +{a.suggested_quantity} un.
              </td>
            </tr>
          ))}

          {!loading && alerts.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#4caf50" }}>
                ✓ Todos los productos tienen stock por encima del nivel mínimo de seguridad.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Propuesta Generada */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ backgroundColor: "#1a237e", padding: "20px", borderRadius: "8px", border: "1px solid #283593" }}>
          <h2 style={{ marginTop: 0, fontSize: "18px", color: "#82b1ff" }}>
            Propuesta de Órdenes de Compra Sugeridas
          </h2>
          {suggestions.map((s, idx) => (
            <div key={idx} style={{ backgroundColor: "#0d47a1", padding: "15px", borderRadius: "6px", marginBottom: "15px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <strong style={{ fontSize: "16px" }}>Proveedor: {s.supplier_name}</strong>
                <span style={{ fontWeight: "bold", color: "#80d8ff" }}>
                  Total Estimado: ${s.total_order_cost.toLocaleString()}
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px" }}>
                {s.items.map((item: any, i: number) => (
                  <li key={i} style={{ marginBottom: "4px" }}>
                    {item.product_name} — Solicitar <strong>{item.suggested_quantity} unidades</strong> (${item.unit_cost} c/u)
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};