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
} from '@/ui/icons'

export type userRol = 'user' | 'admin' | 'guest'

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
      { path: '/', icon: IoIosHome, label: 'Inicio', rol: ['user', 'admin', 'guest'] },
      { path: '/productos', icon: FaWineBottle, label: 'Productos', rol: ['user', 'admin', 'guest'] },
      { path: '/carrito', icon: FaShoppingCart, label: 'Carrito', rol: ['user', 'admin', 'guest'] }
    ]
  },
    {
        title: "administración",
        items: [
            { path: '/dashboard', icon:  MdDashboard, label: 'Dashboard', rol: ['admin'] },
            { path: '/dashboard/productos', icon: AiOutlineProduct, label: 'Productos', rol: ['admin'] },
            { path: '/dashboard/categorias', icon: BiCategory  , label: 'Categorías', rol: ['admin'] },
            { path: '/dashboard/inventario', icon: MdOutlineInventory, label: 'Inventario', rol: ['admin'] },
            { path: '/dashboard/clientes', icon: RiCustomerService2Fill, label: 'Clientes', rol: ['admin'] },
            { path: '/dashboard/pedidos', icon: BsBorderStyle, label: 'Pedidos', rol: ['admin'] },
            { path: '/dashboard/ventas', icon: FcSalesPerformance , label: 'Ventas', rol: ['admin'] },
            { path: '/dashboard/promociones', icon: FaTag , label: 'Promociones', rol: ['admin'] },
        ]
    }
]