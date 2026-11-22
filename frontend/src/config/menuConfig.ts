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
  /** Título del grupo al que pertenece el ítem; se muestra en el menú. */
  group?: string;
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
// TÍTULOS DE GRUPO (reutilizables en varias secciones)
// ==========================================

export const MENU_GROUPS = {
  PANEL: "Panel y catálogo",
  INVENTARIO: "Inventario",
  PROVEEDORES: "Proveedores y clientes",
  VENTAS: "Pedidos, compras y ventas",
  MARKETING: "Marketing",
  REPORTES: "Reportes",
  SISTEMA: "Sistema",
} as const;

// ==========================================
// SECCIONES DEL MENÚ
// ==========================================

const homeSection: MenuSection = {
  title: "Inicio",
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
    { path: "/dashboard", icon: MdDashboard, label: "Dashboard", rol: [ADMIN], group: MENU_GROUPS.PANEL },
    { path: "/dashboard/productos", icon: AiOutlineProduct, label: "Productos", rol: [ADMIN], group: MENU_GROUPS.PANEL },
    { path: "/dashboard/categorias", icon: BiCategory, label: "Categorías", rol: [ADMIN], group: MENU_GROUPS.PANEL },

    // --- Inventario ---
    { path: "/dashboard/inventario", icon: MdOutlineInventory, label: "Inventario", rol: [ADMIN], group: MENU_GROUPS.INVENTARIO },
    { path: "/dashboard/conteos-fisicos", icon: MdOutlineInventory, label: "Conteos Físicos", rol: [ADMIN], group: MENU_GROUPS.INVENTARIO },
    { path: "/dashboard/alertas-inventario", icon: MdOutlineInventory, label: "Alertas de Stock", rol: [ADMIN], group: MENU_GROUPS.INVENTARIO },
    { path: "/dashboard/mermas", icon: FaTrashAlt, label: "Mermas y Pérdidas", rol: [ADMIN, SUPERVISOR], group: MENU_GROUPS.INVENTARIO },

    // --- Proveedores y clientes ---
    { path: "/dashboard/proveedores", icon: FaTruck, label: "Proveedores", rol: [ADMIN], group: MENU_GROUPS.PROVEEDORES },
    { path: "/dashboard/clientes", icon: RiCustomerService2Fill, label: "Clientes", rol: [ADMIN], group: MENU_GROUPS.PROVEEDORES },
    { path: "/dashboard/usuarios", icon: FaUser, label: "Usuarios", rol: [ADMIN], group: MENU_GROUPS.PROVEEDORES },
    { path: "/dashboard/solicitudes-perfil", icon: FaUser, label: "Solicitudes Perfil", rol: [ADMIN], group: MENU_GROUPS.PROVEEDORES },

    // --- Pedidos, compras y ventas ---
    { path: "/dashboard/pedidos", icon: BsBorderStyle, label: "Pedidos", rol: [ADMIN], group: MENU_GROUPS.VENTAS },
    { path: "/dashboard/compras", icon: FaShoppingCart, label: "Compras", rol: [ADMIN], group: MENU_GROUPS.VENTAS },
    { path: "/dashboard/ventas", icon: FcSalesPerformance, label: "Ventas", rol: [ADMIN, SUPERVISOR], group: MENU_GROUPS.VENTAS },

    // --- Marketing ---
    { path: "/dashboard/promociones", icon: FaTag, label: "Promociones", rol: [ADMIN], group: MENU_GROUPS.MARKETING },
    { path: "/dashboard/campanas", icon: FaBullhorn, label: "Campañas", rol: [ADMIN], group: MENU_GROUPS.MARKETING },
    { path: "/dashboard/marketing-combos", icon: FaBullhorn, label: "Marketing y Combos", rol: [ADMIN], group: MENU_GROUPS.MARKETING },

    // --- Sistema ---
    { path: "/dashboard/configuracion", icon: MdDashboard, label: "Configuración", rol: [ADMIN], group: MENU_GROUPS.SISTEMA },
  ],
};

const supervisorSection: MenuSection = {
  title: "supervisión",
  items: [
    { path: "/dashboard", icon: MdDashboard, label: "Dashboard", rol: [SUPERVISOR], group: MENU_GROUPS.PANEL },
    { path: "/dashboard/productos", icon: AiOutlineProduct, label: "Productos", rol: [SUPERVISOR], group: MENU_GROUPS.PANEL },

    { path: "/dashboard/inventario", icon: MdOutlineInventory, label: "Inventario", rol: [SUPERVISOR], group: MENU_GROUPS.INVENTARIO },
    { path: "/dashboard/conteos-fisicos", icon: MdOutlineInventory, label: "Conteos Físicos", rol: [SUPERVISOR], group: MENU_GROUPS.INVENTARIO },
    { path: "/dashboard/alertas-inventario", icon: MdOutlineInventory, label: "Alertas de Stock", rol: [SUPERVISOR], group: MENU_GROUPS.INVENTARIO },
    { path: "/dashboard/mermas", icon: FaTrashAlt, label: "Mermas y Pérdidas", rol: [SUPERVISOR], group: MENU_GROUPS.INVENTARIO },
    { path: "/dashboard/ventas", icon: FcSalesPerformance, label: "Reporte de Ventas", rol: [SUPERVISOR], group: MENU_GROUPS.VENTAS },

    { path: "/dashboard/reportes", icon: FcSalesPerformance, label: "Reportes", rol: [SUPERVISOR], group: MENU_GROUPS.REPORTES },
    { path: "/dashboard/compras", icon: FaShoppingCart, label: "Compras", rol: [SUPERVISOR], group: MENU_GROUPS.VENTAS },
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