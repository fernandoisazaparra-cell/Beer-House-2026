import { Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthRoutesPublic } from "./";

import { ProtectedRoute } from "./pages/ProtectedRoute";
import { useAuth } from "@/app/context/authUse";

// Páginas públicas y layout
import { Home, ProductsPage, MainLayout } from "@/pages";
import { ProductDetailPage } from "@/pages/Products/ProductDetailPage";
import { ProfilePage } from "@/pages/auth/ProfilePage";
import CarritoPage from "@/pages/Carrito/CarritoPage";
import PurchaseHistory from "@/features/sales/components/PurchaseHistory";

// Dashboard y vistas administrativas
import Dashboard from "@/pages/Dashboard/Dashboard";
import PedidosAdmin from "@/pages/Dashboard/PedidosAdmin";
import ProductosAdmin from "@/pages/Dashboard/ProductosAdmin";
import CategoriasAdmin from "@/pages/Dashboard/CategoriasAdmin";
import ClientesAdmin from "@/pages/Dashboard/ClientesAdmin";
import UsuariosAdmin from "@/pages/Dashboard/UsuariosAdmin";
import VentasAdmin from "@/pages/Dashboard/VentasAdmin";
import PromocionesAdmin from "@/pages/Dashboard/PromocionesAdmin";
import ProveedoresAdmin from "@/pages/Dashboard/ProveedoresAdmin";
import ComprasAdmin from "@/pages/Dashboard/ComprasAdmin";
import { ProfileRequestsAdmin } from "@/pages/Dashboard/ProfileRequestsAdmin";

// Marketing y combos
import { MarketingCombosPage } from "@/pages/admin/MarketingCombosPage";
import CampaignsAdmin from "@/pages/admin/CampaignsAdmin";

// Módulos de inventario
import InventoryPage from "./pages/InventoryPage";
import { PhysicalCountsDashboard } from "@/pages/Dashboard/PhysicalCountsDashboard";
import { StockAlertsDashboard } from "@/pages/Dashboard/StockAlertsDashboard";
import { LossesDashboard } from "@/pages/Dashboard/LossesDashboard";

// ==========================================
// ROLES POR TIPO DE ACCESO
// ==========================================

const CLIENT_ROLES = ["cliente", "user"];
const ADMIN_ONLY = ["admin"];
const ADMIN_AND_SUPERVISOR = ["admin", "supervisor"];

/** Envuelve una página con la protección por roles. */
const guard = (roles: string[], page: ReactNode) => (
  <ProtectedRoute allowedRoles={roles}>{page}</ProtectedRoute>
);

export const AppRoutes = () => {
  const { user, updateCurrentUser } = useAuth();

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
        {/* ---------- Públicas ---------- */}
        <Route index element={<Home />} />
        {AuthRoutesPublic}

        {/* ---------- Con sesión (cualquier rol) ---------- */}
        {/* Catálogo (RF-021 / RN-020): solo con sesión; la edad la valida el backend */}
        <Route
          path="productos"
          element={<ProtectedRoute><ProductsPage /></ProtectedRoute>}
        />
        <Route
          path="productos/:id"
          element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>}
        />
        {/* Perfil (RF-002 / RN-002) */}
        <Route
          path="perfil"
          element={
            <ProtectedRoute>
              <ProfilePage
                currentUser={currentUser}
                onUserChange={updateCurrentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* ---------- Solo clientes ---------- */}
        <Route
          path="perfil/historial-compras"
          element={guard(CLIENT_ROLES, <PurchaseHistory />)}
        />
        <Route
          path="carrito"
          element={guard(CLIENT_ROLES, <CarritoPage />)}
        />

        {/* ---------- Dashboard (admin y supervisor) ---------- */}
        <Route
          path="dashboard"
          element={guard(ADMIN_AND_SUPERVISOR, <Dashboard />)}
        >
          {/* Inventario y productos: admin y supervisor */}
          <Route path="productos" element={guard(ADMIN_AND_SUPERVISOR, <ProductosAdmin />)} />
          <Route path="inventario" element={guard(ADMIN_AND_SUPERVISOR, <InventoryPage />)} />
          <Route path="conteos-fisicos" element={guard(ADMIN_AND_SUPERVISOR, <PhysicalCountsDashboard />)} />
          <Route path="alertas-inventario" element={guard(ADMIN_AND_SUPERVISOR, <StockAlertsDashboard />)} />
          <Route path="mermas" element={guard(ADMIN_AND_SUPERVISOR, <LossesDashboard />)} />

          {/* Compras: admin y supervisor (RN-035) */}
          <Route path="compras" element={guard(ADMIN_AND_SUPERVISOR, <ComprasAdmin />)} />

          {/* Resto del panel: solo administrador */}
          <Route path="categorias" element={guard(ADMIN_ONLY, <CategoriasAdmin />)} />
          <Route path="pedidos" element={guard(ADMIN_ONLY, <PedidosAdmin />)} />
          <Route path="proveedores" element={guard(ADMIN_ONLY, <ProveedoresAdmin />)} />
          <Route path="clientes" element={guard(ADMIN_ONLY, <ClientesAdmin />)} />
          <Route path="usuarios" element={guard(ADMIN_ONLY, <UsuariosAdmin />)} />
          <Route path="ventas" element={guard(ADMIN_AND_SUPERVISOR, <VentasAdmin />)} />
          <Route path="promociones" element={guard(ADMIN_ONLY, <PromocionesAdmin />)} />
          <Route path="marketing-combos" element={guard(ADMIN_ONLY, <MarketingCombosPage />)} />
          <Route path="campanas" element={guard(ADMIN_ONLY, <CampaignsAdmin />)} />
          <Route path="solicitudes-perfil" element={guard(ADMIN_ONLY, <ProfileRequestsAdmin />)} />
        </Route>
      </Route>
    </Routes>
  );
};