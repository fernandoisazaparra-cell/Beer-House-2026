import { useState } from 'react';
import './VentasAdmin.css';

interface Sale {
  id: string;
  date: string;
  client: string;
  paymentMethod: string;
  total: number;
}

const initialSales: Sale[] = [
  { id: 'VTA-101', date: '2026-08-28', client: 'Carlos Pérez', paymentMethod: 'Tarjeta de Crédito', total: 85000 },
  { id: 'VTA-102', date: '2026-08-29', client: 'Enana', paymentMethod: 'Nequi / Transferencia', total: 120000 },
];

export const VentasAdmin = () => {
  const [sales] = useState<Sale[]>(initialSales);
  const totalIncome = sales.reduce((acc, sale) => acc + sale.total, 0);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Histórico de Ventas</h2>
        <div className="sales-summary-card">
          <span style={{ fontSize: '12px', color: '#aaa' }}>Total Ingresos: </span>
          <strong className="sales-total-amount">${totalIncome.toLocaleString()}</strong>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Recibo</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Método de Pago</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td style={{ fontWeight: 'bold' }}>{sale.id}</td>
                <td>{sale.date}</td>
                <td>{sale.client}</td>
                <td style={{ color: '#aaa' }}>{sale.paymentMethod}</td>
                <td className="price-text" style={{ fontWeight: 'bold' }}>${sale.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentasAdmin;