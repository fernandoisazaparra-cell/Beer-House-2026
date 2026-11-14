import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import styles from "./Dashboard.module.css";
import { useAuth } from "@/app/context/authUse";
import {
  FaBeer,
  FaUsers,
  FaShoppingBag,
  FaExclamationTriangle,
  FaClipboardCheck,
} from "react-icons/fa";
import { authFetch } from "@/shared/lib/authFetch";
import { API_URL } from "@/app/api";

/* ───────────── Tipos ───────────── */

interface StockAlert {
  id: number | string;
  name: string;
  stock: number;
  min_stock: number;
}

interface DashboardApiData {
  metrics: {
    active_products: number;
    total_customers: number;
    monthly_orders: number;
    pending_losses: number;
    monthly_physical_counts: number;
  };
  low_stock_items: StockAlert[];
}

/* ───────────── Utilidades ───────────── */

const formatCOP = (value?: number) =>
  `$${(value ?? 0).toLocaleString("es-CO")}`;

const formatMillions = (value?: number) =>
  `$${(Number(value) || 0).toFixed(1)}M`;

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();


/* ───────────── Componente Principal ───────────── */


const Dashboard = () => {
  const location = useLocation();
  const isMainDashboard = location.pathname === "/dashboard";

  const { user } = useAuth();

  const currentRole = user?.rol?.toLowerCase() ?? "user";
  const isSupervisor = currentRole === "supervisor";
  const isAdmin = currentRole === "admin";

  const [loading, setLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    activeProducts: 0,
    monthlyOrders: 0,
    totalClients: 0,
    pendingLosses: 0,
    physicalCounts: 0,
  });

  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    if (!isMainDashboard) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const response = await authFetch(
          `${API_URL}/dashboard/summary`
        );

        if (!response.ok) {
          throw new Error("Error al consultar el dashboard");
        }

        const data: DashboardApiData = await response.json();

        setMetrics({
          activeProducts: data.metrics?.active_products ?? 0,
          monthlyOrders: data.metrics?.monthly_orders ?? 0,
          totalClients: data.metrics?.total_customers ?? 0,
          pendingLosses: data.metrics?.pending_losses ?? 0,
          physicalCounts: data.metrics?.monthly_physical_counts ?? 0,
        });

        setStockAlerts(data.low_stock_items ?? []);

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isMainDashboard]);

  const today = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (!isMainDashboard) {
    return (
      <div className={styles.dashboard}>
        <Outlet />
      </div>
    );
  }

  const KPIS = isSupervisor
    ? [
        {
          label: "Productos activos",
          value: metrics.activeProducts,
          icon: <FaBeer />,
        },
        {
          label: "Mermas pendientes",
          value: metrics.pendingLosses,
          icon: <FaExclamationTriangle />,
        },
        {
          label: "Conteos físicos del mes",
          value: metrics.physicalCounts,
          icon: <FaClipboardCheck />,
        },
      ]
    : [
        {
          label: "Productos activos",
          value: metrics.activeProducts,
          icon: <FaBeer />,
        },
        {
          label: "Pedidos del mes",
          value: metrics.monthlyOrders,
          icon: <FaShoppingBag />,
        },
        {
          label: "Clientes registrados",
          value: metrics.totalClients,
          icon: <FaUsers />,
        },
      ];

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1>
            {isSupervisor
              ? "Panel de supervisión"
              : "Dashboard principal"}
          </h1>

          <p>
            {isSupervisor
              ? "Control operativo del inventario y las mermas"
              : "Resumen general de Beer House"}
          </p>
        </div>

        <time className={styles.date}>{today}</time>
      </header>

      <section className={styles.kpis} aria-label="Indicadores clave">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className={styles.kpi}>
            <div className={styles.kpiIcon}>{kpi.icon}</div>

            <div>
              <p>{kpi.label}</p>
              <strong>
                {loading ? "..." : kpi.value}
              </strong>
            </div>
          </div>
        ))}
      </section>

      <section className={styles.main}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>
              Productos con stock bajo
            </h2>

            <FaExclamationTriangle
              className={styles.warnIcon}
            />
          </div>

          <div className={styles.list}>
            {loading ? (
              <p>Cargando inventario...</p>
            ) : stockAlerts.length === 0 ? (
              <p>
                No hay productos con alertas de stock.
              </p>
            ) : (
              stockAlerts.map((item) => {
                const ratio =
                  item.min_stock > 0
                    ? Math.min(item.stock / item.min_stock, 1)
                    : 1;

                return (
                  <div
                    key={item.id}
                    className={styles.stockRow}
                  >
                    <div className={styles.stockTop}>
                      <span>{item.name}</span>

                      <span className={styles.stockQty}>
                        {item.stock} de {item.min_stock} uds
                      </span>
                    </div>

                    <div className={styles.bar}>
                      <div
                        className={`${styles.barFill} ${
                          ratio < 0.3 ? styles.barLow : ""
                        }`}
                        style={{
                          width: `${ratio * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            to="/dashboard/inventario"
            className={styles.link}
          >
            Ir al inventario
          </Link>
        </div>

        {isAdmin && (
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>
                Resumen comercial
              </h2>
            </div>

            <p>
              Pedidos registrados este mes:{" "}
              <strong>
                {loading ? "..." : metrics.monthlyOrders}
              </strong>
            </p>

            <p>
              Clientes registrados:{" "}
              <strong>
                {loading ? "..." : metrics.totalClients}
              </strong>
            </p>
          </div>
        )}

        {isSupervisor && (
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <h2 className={styles.panelTitle}>
                Gestión operativa
              </h2>
            </div>

            <div className={styles.list}>
              <p>
                Mermas pendientes:{" "}
                <strong>
                  {loading ? "..." : metrics.pendingLosses}
                </strong>
              </p>

              <Link
                to="/dashboard/mermas"
                className={styles.link}
              >
                Revisar mermas
              </Link>

              <p>
                Conteos físicos del mes:{" "}
                <strong>
                  {loading ? "..." : metrics.physicalCounts}
                </strong>
              </p>

              <Link
                to="/dashboard/conteos-fisicos"
                className={styles.link}
              >
                Revisar conteos físicos
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

