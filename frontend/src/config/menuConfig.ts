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

import { FaBullhorn, FaHistory, FaTruck, FaUser } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";

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

export const menuConfig: MenuSection[] = [
  {
    title: "menu inicio",
    items: [
      {
        path: "/",
        icon: IoIosHome,
        label: "Inicio",
        rol: ["user", "admin", "guest"],
      },
      {
        path: "/productos",
        icon: FaWineBottle,
        label: "Productos",
        rol: ["user", "admin", "guest"],
      },
      {
        path: "/carrito",
        icon: FaShoppingCart,
        label: "Carrito",
        rol: ["user"],
      },
      // AGREGADO: Opción de Mi Perfil para usuarios autenticados
      {
        path: "/perfil",
        icon: FaUser,
        label: "Mi Perfil",
        rol: ["user", "admin"],
      },
      {
        path: "/perfil/historial-compras",
        icon: FaHistory,
        label: "Historial de compras",
        rol: ["user"],
      },
    ],
  },
  {
    title: "administración",
    items: [
      {
        path: "/dashboard",
        icon: MdDashboard,
        label: "Dashboard",
        rol: ["admin"],
      },
      {
        path: "/dashboard/productos",
        icon: AiOutlineProduct,
        label: "Productos",
        rol: ["admin"],
      },
      {
        path: "/dashboard/categorias",
        icon: BiCategory,
        label: "Categorías",
        rol: ["admin"],
      },
      {
        path: "/dashboard/inventario",
        icon: MdOutlineInventory,
        label: "Inventario",
        rol: ["admin"],
      },
      {
        path: "/dashboard/conteos-fisicos",
        icon: MdOutlineInventory,
        label: "Conteos Físicos",
        rol: ["admin"],
      },
      {
        path: "/dashboard/alertas-inventario",
        icon: MdOutlineInventory,
        label: "Alertas de Stock",
        rol: ["admin"],
      },
      {
        path: "/dashboard/mermas",
        label: "Mermas y Pérdidas",
        icon: FaTrashAlt, // <-- Asigna aquí el icono deseado
        rol: ["admin", "supervisor"],
      },

      // AGREGADO: Opción de Proveedores
      {
        path: "/dashboard/proveedores",
        icon: FaTruck,
        label: "Proveedores",
        rol: ["admin"],
      },

      {
        path: "/dashboard/clientes",
        icon: RiCustomerService2Fill,
        label: "Clientes",
        rol: ["admin"],
      },
      {
        path: "/dashboard/solicitudes-perfil",
        icon: FaUser,
        label: "Solicitudes Perfil",
        rol: ["admin"],
      },
      {
        path: "/dashboard/pedidos",
        icon: BsBorderStyle,
        label: "Pedidos",
        rol: ["admin"],
      },
      {
        path: "/dashboard/compras",
        icon: FaShoppingCart,
        label: "Compras",
        rol: ["admin"],
      },
      {
        path: "/dashboard/ventas",
        icon: FcSalesPerformance,
        label: "Ventas",
        rol: ["admin"],
      },
      {
        path: "/dashboard/promociones",
        icon: FaTag,
        label: "Promociones",
        rol: ["admin"],
      },
      {
        path: "/dashboard/campanas",
        icon: FaBullhorn,
        label: "Campañas",
        rol: ["admin"],
      },
      // NUEVO: Enlace a la gestión de Marketing y Combos en el menú de Admin
      {
        path: "/dashboard/marketing-combos",
        icon: FaBullhorn,
        label: "Marketing y Combos",
        rol: ["admin"],
      },
      {
        path: "/dashboard/configuracion",
        icon: MdDashboard,
        label: "Configuración",
        rol: ["admin"],
      },
    ],
  },
  {
  title: "supervisión",
  items: [
    {
      path: "/dashboard",
      icon: MdDashboard,
      label: "Dashboard",
      rol: ["supervisor"],
    },
    {
      path: "/dashboard/inventario",
      icon: MdOutlineInventory,
      label: "Inventario",
      rol: ["supervisor"],
    },
    {
      path: "/dashboard/conteos-fisicos",
      icon: MdOutlineInventory,
      label: "Conteos Físicos",
      rol: ["supervisor"],
    },
    {
      path: "/dashboard/alertas-inventario",
      icon: MdOutlineInventory,
      label: "Alertas de Stock",
      rol: ["supervisor"],
    },
    {
      path: "/dashboard/mermas",
      icon: FaTrashAlt,
      label: "Mermas y Pérdidas",
      rol: ["supervisor"],
    },
    {
      path: "/dashboard/productos",
      icon: AiOutlineProduct,
      label: "Productos",
      rol: ["supervisor"],
    },
    {
      path: "/dashboard/reportes",
      icon: FcSalesPerformance,
      label: "Reportes",
      rol: ["supervisor"],
    },
  ],
},
];
