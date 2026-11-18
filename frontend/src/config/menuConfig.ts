// frontend/src/config/menuConfig.ts
//
// Configuración del menú lateral. Cada ítem indica qué roles lo ven.
//
// Secciones:
//   1. Menú inicio       (público y clientes)
//   2. Administración    (admin; Mermas también para supervisor)
//   3. Supervisión       (supervisor; incluye Compras)

import {
  IoIosHome,
  FaWineBottle,
  AiOutlineProduct,
  BiCategory,
  MdOutlineInventory,
  RiCustomerService2Fill,
  BsBorderStyle,
  FcSalesPerformance,
  FaTag,
  MdDashboard,
  FaShoppingCart,
} from "@/ui/icons";

import {
  FaBullhorn,
  FaHistory,
  FaTrashAlt,
  FaTruck,
  FaUser,
} from "react-icons/fa";

// ==========================================
// TIPOS
// ==========================================

export type userRol = "user" | "admin" | "supervisor" | "guest";

export interface NavItemType {
  path?: string;
  icon?: React.ElementType;
  action?: () => void;
  children?: NavItemType[];

  label: string;
  rol: string[];
}

export interface MenuSection {
  title?: string;
  items: NavItemType[];
}

// ==========================================
// ROLES (evita escribir los textos a mano)
// ==========================================

const USER: userRol = "user";
const ADMIN: userRol = "admin";
const SUPERVISOR: userRol = "supervisor";
const GUEST: userRol = "guest";

// ==========================================
// SECCIONES DEL MENÚ
// ==========================================

const homeSection: MenuSection = {
  title: "menu inicio",
  items: [
    { path: "/", icon: IoIosHome, label: "Inicio", rol: [USER, ADMIN, GUEST] },
    { path: "/productos", icon: FaWineBottle, label: "Productos", rol: [USER, ADMIN, GUEST] },
    { path: "/carrito", icon: FaShoppingCart, label: "Carrito", rol: [USER] },
    { path: "/perfil", icon: FaUser, label: "Mi Perfil", rol: [USER, ADMIN] },
    {
      path: "/perfil/historial-compras",
      icon: FaHistory,
      label: "Historial de compras",
      rol: [USER],
    },
  ],
};

const adminSection: MenuSection = {
  title: "administración",
  items: [
    // --- Panel y catálogo ---
    { path: "/dashboard", icon: MdDashboard, label: "Dashboard", rol: [ADMIN] },
    { path: "/dashboard/productos", icon: AiOutlineProduct, label: "Productos", rol: [ADMIN] },
    { path: "/dashboard/categorias", icon: BiCategory, label: "Categorías", rol: [ADMIN] },

    // --- Inventario ---
    { path: "/dashboard/inventario", icon: MdOutlineInventory, label: "Inventario", rol: [ADMIN] },
    { path: "/dashboard/conteos-fisicos", icon: MdOutlineInventory, label: "Conteos Físicos", rol: [ADMIN] },
    { path: "/dashboard/alertas-inventario", icon: MdOutlineInventory, label: "Alertas de Stock", rol: [ADMIN] },
    { path: "/dashboard/mermas", icon: FaTrashAlt, label: "Mermas y Pérdidas", rol: [ADMIN, SUPERVISOR] },

    // --- Proveedores y clientes ---
    { path: "/dashboard/proveedores", icon: FaTruck, label: "Proveedores", rol: [ADMIN] },
    { path: "/dashboard/clientes", icon: RiCustomerService2Fill, label: "Clientes", rol: [ADMIN] },
    { path: "/dashboard/solicitudes-perfil", icon: FaUser, label: "Solicitudes Perfil", rol: [ADMIN] },

    // --- Pedidos, compras y ventas ---
    { path: "/dashboard/pedidos", icon: BsBorderStyle, label: "Pedidos", rol: [ADMIN] },
    { path: "/dashboard/compras", icon: FaShoppingCart, label: "Compras", rol: [ADMIN] },
    { path: "/dashboard/ventas", icon: FcSalesPerformance, label: "Ventas", rol: [ADMIN] },

    // --- Marketing ---
    { path: "/dashboard/promociones", icon: FaTag, label: "Promociones", rol: [ADMIN] },
    { path: "/dashboard/campanas", icon: FaBullhorn, label: "Campañas", rol: [ADMIN] },
    { path: "/dashboard/marketing-combos", icon: FaBullhorn, label: "Marketing y Combos", rol: [ADMIN] },

    // --- Sistema ---
    { path: "/dashboard/configuracion", icon: MdDashboard, label: "Configuración", rol: [ADMIN] },
  ],
};

const supervisorSection: MenuSection = {
  title: "supervisión",
  items: [
    { path: "/dashboard", icon: MdDashboard, label: "Dashboard", rol: [SUPERVISOR] },
    { path: "/dashboard/inventario", icon: MdOutlineInventory, label: "Inventario", rol: [SUPERVISOR] },
    { path: "/dashboard/conteos-fisicos", icon: MdOutlineInventory, label: "Conteos Físicos", rol: [SUPERVISOR] },
    { path: "/dashboard/alertas-inventario", icon: MdOutlineInventory, label: "Alertas de Stock", rol: [SUPERVISOR] },
    { path: "/dashboard/mermas", icon: FaTrashAlt, label: "Mermas y Pérdidas", rol: [SUPERVISOR] },
    { path: "/dashboard/productos", icon: AiOutlineProduct, label: "Productos", rol: [SUPERVISOR] },
    { path: "/dashboard/reportes", icon: FcSalesPerformance, label: "Reportes", rol: [SUPERVISOR] },
    { path: "/dashboard/compras", icon: FaShoppingCart, label: "Compras", rol: [SUPERVISOR] },
  ],
};

// ==========================================
// MENÚ FINAL (el orden define el orden en pantalla)
// ==========================================

export const menuConfig: MenuSection[] = [
  homeSection,
  adminSection,
  supervisorSection,
];