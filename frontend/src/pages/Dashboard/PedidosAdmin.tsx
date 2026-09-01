import { useState } from 'react';
import "./PedidosAdmin.css";
import {
   BsBorderStyle
   } from '@/ui/icons';

interface Order {
  id: string;
  client: string;
  date: string;
  total: number;
  status: 'Pendiente' | 'Completado' | 'Cancelado';
}

const initialOrders: Order[] = [
  { id: '#001', client: 'Carlos Pérez', date: '2026-08-28', total: 85000, status: 'Completado' },
  { id: '#002', client: 'Enana', date: '2026-08-29', total: 120000, status: 'Pendiente' },
  { id: '#003', client: 'Mariana Gómez', date: '2026-08-30', total: 65000, status: 'Cancelado' },
];

export const PedidosAdmin = () => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const handleStatusChange = (id: string, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status: newStatus } : order))
    );
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Pedidos</h2>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 'bold' }}>{order.id}</td>
                <td>{order.client}</td>
                <td>{order.date}</td>
                <td className="price-text">${order.total.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    className="status-select"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Completado">Completado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  <BsBorderStyle />
};

export default PedidosAdmin;