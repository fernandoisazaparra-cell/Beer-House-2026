import { 
    IoIosNotifications,
    IoIosHome,
    FaWineBottle
} from '@/ui/icons'

// Importa los iconos adicionales si los tienes en @/ui/icons, o mapea los existentes
import type { MenuSection } from './menuConfig.types'

export const menuConfig: MenuSection[] = [
    {
        title: "menu inicio",
        items: [
            { path: '/', icon: IoIosHome, label: 'Inicio', rol: ['user', 'admin', 'guest'] },
            { path: '/productos', icon: FaWineBottle, label: 'Productos', rol: ['user', 'admin', 'guest'] },
            { action: (() => alert("hola")), icon: IoIosNotifications, label: 'Consola', rol: ['user', 'admin'] },
        ]
    },
    {
        title: "administración",
        items: [
            { path: '/dashboard', icon: IoIosHome, label: 'Dashboard', rol: ['admin'] },
            { path: '/dashboard/productos', icon: FaWineBottle, label: 'Productos', rol: ['admin'] },
            { path: '/dashboard/categorias', icon: FaWineBottle, label: 'Categorías', rol: ['admin'] },
            { path: '/dashboard/inventario', icon: FaWineBottle, label: 'Inventario', rol: ['admin'] },
            { path: '/dashboard/clientes', icon: IoIosHome, label: 'Clientes', rol: ['admin'] },
            { path: '/dashboard/pedidos', icon: FaWineBottle, label: 'Pedidos', rol: ['admin'] },
            { path: '/dashboard/ventas', icon: IoIosHome, label: 'Ventas', rol: ['admin'] },
            { path: '/dashboard/promociones', icon: IoIosNotifications, label: 'Promociones', rol: ['admin'] },
            { path: '/dashboard/configuracion', icon: IoIosNotifications, label: 'Configuración', rol: ['admin'] },
        ]
    }
]