import { 
    IoIosNotifications,
    IoIosHome
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
            { path: '/', icon: IoIosHome ,label: 'Inicio', rol: ['user', 'admin', "guest"]},
            { action: (() => alert("hola")), icon: IoIosNotifications , label: 'Consola', rol: ['user', 'admin']},
        ]
    }
]