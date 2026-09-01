import { Outlet, useLocation } from 'react-router-dom';
import styles from './Dashboard.module.css';
import {
   MdDashboard 
} from '@/ui/icons';

const Dashboard = () => {
  const location = useLocation();

  // Muestra el resumen (tarjetas y gráficas) solo en la ruta exacta /dashboard
  const isMainDashboard = location.pathname === '/dashboard';

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
          {/* TARJETAS DE ESTADÍSTICAS */}
          <section className={styles.cards}>
            <div className={styles.card}>
              <span className={styles.icon}></span>
              <div>
                <p>Productos</p>
                <h2>125</h2>
              </div>
            </div>

            <div className={styles.card}>
              <span className={styles.icon}></span>
              <div>
                <p>Pedidos</p>
                <h2>48</h2>
              </div>
            </div>

            <div className={styles.card}>
              <span className={styles.icon}></span>
              <div>
                <p>Clientes</p>
                <h2>248</h2>
              </div>
            </div>

            <div className={styles.card}>
              <span className={styles.icon}></span>
              <div>
                <p>Ventas</p>
                <h2>$2.5M</h2>
              </div>
            </div>
          </section>

          {/* CONTENIDO PRINCIPAL */}
          <section className={styles.content}>
            {/* VENTAS */}
            <div className={styles.chart}>
              <h2>Ventas</h2>
              <div className={styles.chartPlaceholder}>
                Gráfica de ventas
              </div>
            </div>

            {/* PEDIDOS */}
            <div className={styles.orders}>
              <h2>Pedidos recientes</h2>

              <div className={styles.order}>
                <span>#001</span>
                <span>Cliente</span>
                <strong>$85.000</strong>
              </div>

              <div className={styles.order}>
                <span>#002</span>
                <span>Cliente</span>
                <strong>$120.000</strong>
              </div>

              <div className={styles.order}>
                <span>#003</span>
                <span>Cliente</span>
                <strong>$65.000</strong>
              </div>
            </div>
          </section>
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