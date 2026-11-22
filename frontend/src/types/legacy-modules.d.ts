// Tipos para módulos escritos en JavaScript (.js / .jsx) que se usan desde TypeScript.
// Cuando conviertas CartDrawer.jsx y cartService.js a .tsx / .ts, borra su bloque de aquí.

declare module '@/services/cartService' {
    export interface CartValidationResult {
        success: boolean
        items?: any[]
        issues?: Array<{ product_id?: number | null; code?: string; message?: string; available?: number }>
        total?: number
        updatedCart?: any[]
    }

    export function validateCartWithBackend(cart: any[]): Promise<CartValidationResult>
}

declare module '@/components/CartDrawer' {
    import type { ComponentType } from 'react'

    export interface CartDrawerProps {
        isOpen: boolean
        onClose?: () => void
        cart: any[]
        onUpdateQuantity?: (id: number, newQty: number) => void
        onRemoveItem?: (id: number) => void
        onCheckout?: () => void | Promise<void>
    }

    const CartDrawer: ComponentType<CartDrawerProps>
    export default CartDrawer
}