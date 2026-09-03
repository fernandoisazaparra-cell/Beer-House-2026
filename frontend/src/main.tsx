import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { CartProvider } from '@/app/context/CartProvider'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <CartProvider>
            <App />
        </CartProvider>
    </StrictMode>,
)