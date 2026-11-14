import React, { useEffect, useState } from "react";
import { getStockAlerts, type DetailedStockAlert } from "../features/inventory/api/inventoryApi";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/app/context/authUse';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAlertsCountChange: (count: number) => void;
}

export const NotificationDrawer: React.FC<Props> = ({ isOpen, onClose, onAlertsCountChange }) => {
  const [alerts, setAlerts] = useState<DetailedStockAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { currentRole } = useAuth()
  const canViewAlerts = ['admin', 'supervisor'].includes(currentRole)

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getStockAlerts();
      const list = Array.isArray(data) ? data : [];
      setAlerts(list);
      onAlertsCountChange(list.length);
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    if (!canViewAlerts) {
        setAlerts([])
        setLoading(false)
        onAlertsCountChange(0)
        return
    }

    loadAlerts()

    const interval = setInterval(loadAlerts, 30000)

    return () => clearInterval(interval)
}, [canViewAlerts])

if (!isOpen || !canViewAlerts) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "360px",
          backgroundColor: "#1e1e1e",
          color: "#fff",
          height: "100%",
          boxShadow: "-2px 0 10px rgba(0,0,0,0.5)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Panel */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #333", paddingBottom: "12px" }}>
          <h2 style={{ fontSize: "18px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
            🔔 Notificaciones ({alerts.length})
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {/* Lista de Notificaciones */}
        <div style={{ flex: 1, overflowY: "auto", marginTop: "15px" }}>
          {loading && <p style={{ color: "#aaa", fontSize: "13px" }}>Cargando notificaciones...</p>}

          {!loading && alerts.map((item) => (
            <div
              key={item.product_id}
              style={{
                backgroundColor: "#2a2a2a",
                borderLeft: `4px solid ${item.alert_level === "CRITICO" ? "#f44336" : "#ff9800"}`,
                borderRadius: "4px",
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <strong style={{ fontSize: "14px" }}>{item.product_name}</strong>
                <span
                  style={{
                    backgroundColor: item.alert_level === "CRITICO" ? "#c62828" : "#e65100",
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontWeight: "bold",
                  }}
                >
                  {item.alert_level === "CRITICO" ? "AGOTADO" : "STOCK BAJO"}
                </span>
              </div>
              <p style={{ margin: "4px 0", fontSize: "12px", color: "#ccc" }}>
                Stock actual: <strong style={{ color: item.current_stock === 0 ? "#f44336" : "#ffb74d" }}>{item.current_stock} un.</strong> (Mínimo: {item.min_stock} un.)
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#aaa" }}>
                Proveedor: {item.supplier_name}
              </p>
            </div>
          ))}

          {!loading && alerts.length === 0 && (
            <div style={{ textAlign: "center", marginTop: "40px", color: "#81c784" }}>
              <p style={{ fontSize: "24px", margin: "0 0 10px 0" }}>✓</p>
              <p style={{ fontSize: "14px", margin: 0 }}>No hay alertas de stock pendientes.</p>
            </div>
          )}
        </div>

        {/* Botón para ir al módulo completo */}
        {alerts.length > 0 && (
          <button
            onClick={() => {
              onClose();
              navigate("/dashboard/alertas-inventario");
            }}
            style={{
              width: "100%",
              backgroundColor: "#1565c0",
              color: "#fff",
              border: "none",
              padding: "10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            Ver Alertas Completa →
          </button>
        )}
      </div>
    </div>
  );
};