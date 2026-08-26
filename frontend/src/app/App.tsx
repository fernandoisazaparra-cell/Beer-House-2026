import {
    BrowserRouter
} from 'react-router-dom'

import {
    AppRoutes
} from './router'

import { AuthProvider } from './context'

import '@/ui/styles/main.css'

export const App = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}