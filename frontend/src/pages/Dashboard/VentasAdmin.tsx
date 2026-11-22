import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/app/api';
import { authFetch } from '@/shared/lib/authFetch';
import './VentasAdmin.css';

interface ProductSalesRow {
  product_id: number;
  product: string;
  quantity_sold: number;
  clients: number;
  revenue: number;
  period: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

/** RF-047: reporte real de ventas por producto (Admin y Supervisor). */
export const VentasAdmin = () => {
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo, setDateTo] = useState(today());
  const [rows, setRows] = useState<ProductSalesRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
      const res = await authFetch(`${API_URL}/dashboard/sales-by-product?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo generar el reporte.');
      setRows(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el reporte.');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const totalUnits = rows.reduce((sum, row) => sum + row.quantity_sold, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <h2>Reporte de Ventas por Producto</h2>
          <p>Periodo: {dateFrom} a {dateTo}</p>
        </div>
        <div className="sales-header-actions">
          <div className="sales-summary-card">
            <span className="summary-label">Unidades vendidas:</span>
            <span className="sales-total-amount">{totalUnits.toLocaleString('es-CO')}</span>
          </div>
          <div className="sales-summary-card">
            <span className="summary-label">Ingresos:</span>
            <span className="sales-total-amount">${totalRevenue.toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="date-from">Desde</label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-field">
            <label htmlFor="date-to">Hasta</label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="form-input"
            />
          </div>
          <button type="button" onClick={loadReport} className="btn-primary" disabled={loading}>
            {loading ? 'Generando...' : 'Generar reporte'}
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad vendida</th>
              <th>Nº de clientes</th>
              <th>Periodo</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5}>No hay ventas pagadas en el periodo seleccionado.</td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.product_id}>
                <td>{row.product}</td>
                <td>{row.quantity_sold.toLocaleString('es-CO')}</td>
                <td>{row.clients.toLocaleString('es-CO')}</td>
                <td>{row.period}</td>
                <td className="price-text">${row.revenue.toLocaleString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentasAdmin;
