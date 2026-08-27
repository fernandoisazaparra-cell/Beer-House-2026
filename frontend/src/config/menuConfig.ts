import { 
    IoIosNotifications,
    IoIosHome,
    FaWineBottle
} from '@/ui/icons'

import type { MenuSection } from './menuConfig.types'

export const menuConfig: MenuSection[] = [
    {
        title: "menu inicio",
        items: [
            { path: '/', icon: IoIosHome ,label: 'Inicio', rol: ['user', 'admin', "guest"]},
            { path: '/productos', icon: FaWineBottle, label: 'Productos', rol: ['user', 'admin', "guest"]},
            { action: (() => alert("hola")), icon: IoIosNotifications , label: 'Consola', rol: ['user', 'admin']},
        ]
    },
]