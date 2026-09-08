import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './Dashboard.module.css';
import {
   MdDashboard 
} from '@/ui/icons';
import {
  getDashboardStats,
  formatCurrency,
  formatDate
} from '@/features/dashboard/services/dashboardStatsService';
import {
  getErrorMessage
} from '@/features/dashboard/services/errorsService';
import type { Order, OrderStatus } from '@/features/dashboard/services/ordersService';

interface DashboardData {
  total_products: number;
  total_orders: number;
  clientes: number;
  total_income: number;
  low_stock: number;
  recent_orders: Order[];
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const Dashboard = () => {
  const location = useLocation();

  const isMainDashboard = location.pathname === '/dashboard';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isMainDashboard) return;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await getDashboardStats();
        setData({
          total_products: result.stats.total_products,
          total_orders: result.stats.total_orders,
          clientes: result.stats.clientes,
          total_income: result.stats.total_income,
          low_stock: result.stats.low_stock,
          recent_orders: result.recent_orders,
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    void loadStats();
  }, [isMainDashboard]);

  const maxOrderTotal = Math.max(
    1,
    ...(data?.recent_orders.map((order) => order.total) ?? [1])
  );

  return (
    <div className={styles.dashboard}>

      {/* ENCABEZADO */}
      <header className={styles.header}>
        <div>
          <h1>Dashboard</h1>
          <p>Bienvenido al panel administrativo de Beer House</p>
        </div>
      </header>

      {/* RENDERIZADO DINÁMICO */}
      {isMainDashboard ? (
        <>
          {loading ? (
            <p style={{ color: '#999' }}>Cargando estadísticas...</p>
          ) : error ? (
            <p style={{ color: '#f87171' }}>{error}</p>
          ) : data ? (
            <>
              {/* TARJETAS DE ESTADÍSTICAS */}
              <section className={styles.cards}>
                <div className={styles.card}>
                  <span className={styles.icon}></span>
                  <div>
                    <p>Productos</p>
                    <h2>{data.total_products}</h2>
                  </div>
                </div>

                <div className={styles.card}>
                  <span className={styles.icon}></span>
                  <div>
                    <p>Pedidos</p>
                    <h2>{data.total_orders}</h2>
                  </div>
                </div>

                <div className={styles.card}>
                  <span className={styles.icon}></span>
                  <div>
                    <p>Clientes</p>
                    <h2>{data.clientes}</h2>
                  </div>
                </div>

                <div className={styles.card}>
                  <span className={styles.icon}></span>
                  <div>
                    <p>Ventas</p>
                    <h2>{formatCurrency(data.total_income)}</h2>
                  </div>
                </div>
              </section>

              {/* CONTENIDO PRINCIPAL */}
              <section className={styles.content}>
                {/* VENTAS */}
                <div className={styles.chart}>
                  <h2>Ventas recientes</h2>
                  {data.recent_orders.length === 0 ? (
                    <div className={styles.chartPlaceholder}>
                      Sin ventas registradas
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '12px',
                        height: '280px',
                        paddingTop: '20px',
                      }}
                    >
                      {data.recent_orders.map((order) => (
                        <div key={order.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                          <div
                            title={`${order.code}: ${formatCurrency(order.total)}`}
                            style={{
                              width: '100%',
                              maxWidth: '60px',
                              height: `${Math.max(8, (order.total / maxOrderTotal) * 220)}px`,
                              background: order.status === 'cancelado' ? '#7f1d1d' : '#d4af37',
                              borderRadius: '6px 6px 0 0',
                            }}
                          />
                          <span style={{ color: '#999', fontSize: '11px' }}>{order.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
                    Productos con bajo stock: <strong style={{ color: '#facc15' }}>{data.low_stock}</strong>
                  </p>
                </div>

                {/* PEDIDOS */}
                <div className={styles.orders}>
                  <h2>Pedidos recientes</h2>

                  {data.recent_orders.length === 0 ? (
                    <p style={{ color: '#999' }}>Sin pedidos recientes.</p>
                  ) : (
                    data.recent_orders.map((order) => (
                      <div className={styles.order} key={order.id}>
                        <span>{order.code}</span>
                        <span>{order.client_name} · {STATUS_LABEL[order.status]} · {formatDate(order.created_at)}</span>
                        <strong>{formatCurrency(order.total)}</strong>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : (
        /* Renderiza las subrutas (Productos, Inventario, Categorías, etc.) */
        <div style={{ paddingTop: '20px' }}>
          <Outlet />
        </div>
      )}

    </div>
  );
  <MdDashboard />
};

export default Dashboard;