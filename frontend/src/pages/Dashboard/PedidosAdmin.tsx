import { useEffect, useState } from 'react';
import './AdminShared.css';
import {
   BsBorderStyle
   } from '@/ui/icons';
import {
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  type Order,
  type OrderStatus
} from '@/features/dashboard/services/ordersService';
import {
  getErrorMessage
} from '@/features/dashboard/services/errorsService';
import {
  formatCurrency,
  formatDate
} from '@/features/dashboard/services/dashboardStatsService';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const PedidosAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await getOrders();
        setError('');
        setOrders(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, []);

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    try {
      const updated = await updateOrderStatus(order.id, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleOpenDetail = async (order: Order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    try {
      const detail = await getOrderDetail(order.id);
      setSelectedOrder(detail);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Pedidos</h2>
      </div>

      {error && <p className="admin-error">{error}</p>}

      <div className="admin-table-container">
        {loading ? (
          <p className="admin-loading">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="admin-empty">No hay pedidos registrados.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Recibo</th>
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
                  <td style={{ fontWeight: 'bold' }}>{order.code}</td>
                  <td>{order.client_name}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td className="price-text">{formatCurrency(order.total)}</td>
                  <td>
                    <span className={`status-badge ${order.status}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenDetail(order)}
                        className="btn-secondary"
                      >
                        Ver detalle
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order, e.target.value as OrderStatus)
                        }
                        className="status-select"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Detalle Pedido: {selectedOrder.code}</h3>
            {detailLoading ? (
              <p className="admin-loading">Cargando detalle...</p>
            ) : (
              <>
                <div className="sale-detail-info">
                  <p><strong>Cliente:</strong> {selectedOrder.client_name}</p>
                  <p><strong>Correo:</strong> {selectedOrder.client_email || '—'}</p>
                  <p><strong>Fecha:</strong> {formatDate(selectedOrder.created_at)}</p>
                  <p><strong>Método de pago:</strong> {selectedOrder.payment_method || '—'}</p>
                  <p>
                    <strong>Estado:</strong>{' '}
                    <span className={`status-badge ${selectedOrder.status}`}>
                      {STATUS_LABEL[selectedOrder.status]}
                    </span>
                  </p>
                </div>

                <table className="admin-table detail-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="sale-detail-total">
                  Total: <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  <BsBorderStyle />
};

export default PedidosAdmin;