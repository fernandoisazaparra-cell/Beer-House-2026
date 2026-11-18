import React, { useEffect, useState } from 'react';
import {
  generateReorderSuggestions,
  getStockAlerts,
  type DetailedStockAlert,
} from '../../features/inventory/api/inventoryApi';

interface SuggestedItem {
  product_id: number;
  product_name: string;
  current_stock: number;
  min_stock: number;
  suggested_quantity: number;
  unit_cost: number;
  total_estimated: number;
}

interface SupplierSuggestion {
  supplier_id: number;
  supplier_name: string;
  items: SuggestedItem[];
  total_order_cost: number;
}

export const StockAlertsDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<DetailedStockAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SupplierSuggestion[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getStockAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar alertas de stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleGeneratePurchaseOrders = async () => {
    setFeedback(null);
    if (alerts.length === 0) {
      setFeedback({
        type: 'error',
        text: 'No hay productos con alertas de stock para reabastecer.',
      });
      return;
    }

    try {
      setGenerating(true);
      const allProductIds = alerts.map((a) => a.product_id);
      const res = await generateReorderSuggestions(allProductIds);
      const list = Array.isArray(res) ? res : Array.isArray(res?.suggestions) ? res.suggestions : [];
      setSuggestions(list);
      setFeedback({
        type: 'success',
        text: 'Sugerencias de Orden de Compra agrupadas por proveedor generadas exitosamente.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar sugerencias.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #333',
          paddingBottom: '10px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', margin: 0 }}>
            Alertas y Reabastecimiento Automático (RF-028)
          </h1>
          <p style={{ color: '#aaa', fontSize: '13px', margin: '5px 0 0 0' }}>
            Productos en nivel crítico o por debajo de su stock mínimo de seguridad
          </p>
        </div>

        <button
          type="button"
          onClick={handleGeneratePurchaseOrders}
          disabled={alerts.length === 0 || generating}
          style={{
            backgroundColor: alerts.length > 0 ? '#1565c0' : '#444',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '4px',
            cursor: alerts.length > 0 && !generating ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
          }}
        >
          {generating
            ? 'Generando...'
            : `⚡ Generar Orden de Compra Sugerida (${alerts.length})`}
        </button>
      </div>

      {/* Mensaje de estado */}
      {feedback && (
        <div
          style={{
            backgroundColor: feedback.type === 'success' ? '#1b5e20' : '#b71c1c',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Tabla de alertas */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#1e1e1e',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '30px',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left', color: '#aaa' }}>
            <th style={{ padding: '12px' }}>Estado</th>
            <th style={{ padding: '12px' }}>Producto</th>
            <th style={{ padding: '12px' }}>Proveedor Asignado</th>
            <th style={{ padding: '12px' }}>Stock Actual</th>
            <th style={{ padding: '12px' }}>Stock Mínimo</th>
            <th style={{ padding: '12px' }}>Sugerido a Pedir</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}>
                Verificando niveles de inventario...
              </td>
            </tr>
          )}

          {!loading &&
            alerts.map((a) => (
              <tr key={a.product_id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      backgroundColor: a.alert_level === 'CRITICO' ? '#c62828' : '#f57c00',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  >
                    {a.alert_level === 'CRITICO' ? 'AGOTADO' : 'STOCK BAJO'}
                  </span>
                </td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{a.product_name}</td>
                <td style={{ padding: '12px', color: '#aaa' }}>{a.supplier_name}</td>
                <td
                  style={{
                    padding: '12px',
                    color: a.current_stock === 0 ? '#f44336' : '#ffb74d',
                    fontWeight: 'bold',
                  }}
                >
                  {a.current_stock} un.
                </td>
                <td style={{ padding: '12px' }}>{a.min_stock} un.</td>
                <td style={{ padding: '12px', color: '#4caf50', fontWeight: 'bold' }}>
                  +{a.suggested_quantity} un.
                </td>
              </tr>
            ))}

          {!loading && alerts.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#4caf50' }}>
                ✓ Todos los productos tienen stock por encima del nivel mínimo de seguridad.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Propuesta Generada */}
      {suggestions.length > 0 && (
        <div
          style={{
            backgroundColor: '#1a237e',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #283593',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '18px', color: '#82b1ff' }}>
            Propuesta de Órdenes de Compra Sugeridas
          </h2>
          {suggestions.map((s, idx) => (
            <div
              key={`${s.supplier_id}-${idx}`}
              style={{
                backgroundColor: '#0d47a1',
                padding: '15px',
                borderRadius: '6px',
                marginBottom: '15px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                <strong style={{ fontSize: '16px' }}>Proveedor: {s.supplier_name}</strong>
                <span style={{ fontWeight: 'bold', color: '#80d8ff' }}>
                  Total Estimado: ${Number(s.total_order_cost || 0).toLocaleString()}
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                {s.items.map((item) => (
                  <li key={item.product_id} style={{ marginBottom: '4px' }}>
                    {item.product_name} — Solicitar{' '}
                    <strong>{item.suggested_quantity} unidades</strong> (${item.unit_cost} c/u)
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