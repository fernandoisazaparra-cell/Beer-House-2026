import { Route, Routes } from "react-router-dom";
import { AuthRoutesPublic } from "./";

// Importación de ProtectedRoute
import { ProtectedRoute } from "./pages/ProtectedRoute";
import { useAuth } from "@/app/context/authUse";

// Páginas Públicas y Layout
import { Home, ProductsPage, MainLayout } from "@/pages";
import { ProductDetailPage } from "@/pages/Products/ProductDetailPage";
// Importación de la página de Perfil
import { ProfilePage } from "@/pages/auth/ProfilePage";

// Carrito
import CarritoPage from "@/pages/Carrito/CarritoPage";

// Catálogo Visual (Nuevo)

// Dashboard y Vistas Administrativas
import Dashboard from "@/pages/Dashboard/Dashboard";
import PedidosAdmin from "@/pages/Dashboard/PedidosAdmin";
import ProductosAdmin from "@/pages/Dashboard/ProductosAdmin";
import CategoriasAdmin from "@/pages/Dashboard/CategoriasAdmin";
import ClientesAdmin from "@/pages/Dashboard/ClientesAdmin";
import VentasAdmin from "@/pages/Dashboard/VentasAdmin";
import PromocionesAdmin from "@/pages/Dashboard/PromocionesAdmin";
import ProveedoresAdmin from "@/pages/Dashboard/ProveedoresAdmin";
import ComprasAdmin from "@/pages/Dashboard/ComprasAdmin";
import PurchaseHistory from "@/features/sales/components/PurchaseHistory";

// Marketing y Combos Admin (Nuevo)
import { MarketingCombosPage } from "@/pages/admin/MarketingCombosPage";
import CampaignsAdmin from "@/pages/admin/CampaignsAdmin";
// Módulos de Inventario
import InventoryPage from "./pages/InventoryPage";
import { PhysicalCountsDashboard } from "@/pages/Dashboard/PhysicalCountsDashboard";
import { StockAlertsDashboard } from "@/pages/Dashboard/StockAlertsDashboard";
import { LossesDashboard } from "@/pages/Dashboard/LossesDashboard";
import { ProfileRequestsAdmin } from "@/pages/Dashboard/ProfileRequestsAdmin";
// import { HistorialCompras } from "@/components/HistorialCompras";

export const AppRoutes = () => {
  // Obtenemos los datos del usuario guardados en la sesión/localStorage
  const { user } = useAuth();

  const currentUser = user
    ? {
        first_name: user.name?.split(" ")[0] ?? "",
        last_name: user.name?.split(" ").slice(1).join(" ") ?? "",
        email: user.email,
      }
    : {
        first_name: "",
        last_name: "",
        email: "",
      };

  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Rutas Públicas */}
        <Route index element={<Home />} />
        {/* Catálogo (RF-021 / RN-020): solo con sesión; la edad la valida el backend */}
        <Route
          path="productos"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="productos/:id"
          element={
            <ProtectedRoute>
              <ProductDetailPage />
            </ProtectedRoute>
          }

        />
        {AuthRoutesPublic}

        {/* Ruta del Perfil (RF-002 / RN-002): Protegida para cualquier usuario autenticado */}
        <Route
          path="perfil"
          element={
            <ProtectedRoute>
              <ProfilePage currentUser={currentUser} />
            </ProtectedRoute>
          }
        />
        {/* <Route path="perfil/historial-compras" element={<HistorialCompras />} /> */}
        <Route
          path="perfil/historial-compras"
          element={
            <ProtectedRoute allowedRoles={["cliente", "user"]}>
              <PurchaseHistory />
            </ProtectedRoute>
          }
        />

        {/* Ruta del Carrito: Protegida únicamente para Clientes */}
        <Route
          path="carrito"
          element={
            <ProtectedRoute allowedRoles={["cliente", "user"]}>
              <CarritoPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas del Dashboard: Protegidas para Administrador y Supervisor */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route path="pedidos" element={<PedidosAdmin />} />
          <Route
            path="productos"
            element={
              <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                <ProductosAdmin />
              </ProtectedRoute>
            }
          />
          <Route path="categorias" element={<CategoriasAdmin />} />
          <Route
            path="inventario"
            element={
              <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="conteos-fisicos"
            element={
              <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                <PhysicalCountsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="alertas-inventario"
            element={
              <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                <StockAlertsDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="mermas"
            element={
              <ProtectedRoute allowedRoles={["admin", "supervisor"]}>
                <LossesDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="proveedores" element={<ProveedoresAdmin />} />
          <Route path="clientes" element={<ClientesAdmin />} />
          <Route path="ventas" element={<VentasAdmin />} />
          <Route path="promociones" element={<PromocionesAdmin />} />
          {/* NUEVO: Gestión de Marketing y Combos en el Dashboard */}
          <Route path="marketing-combos" element={<MarketingCombosPage />} />
          <Route path="campanas" element={<CampaignsAdmin />} />
          <Route path="compras" element={<ComprasAdmin />} />
          <Route path="solicitudes-perfil" element={<ProfileRequestsAdmin />} />
        </Route>
      </Route>
    </Routes>
  );
};
