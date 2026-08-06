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