import {
    BrowserRouter
} from 'react-router-dom'

import {
    AppRoutes
} from './router'

import { AuthProvider, useAuth } from './context'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { TermsConfirmationModal } from '@/shared'
import { useState } from 'react'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

import '@/ui/styles/main.css'

const TermsConfirmationGate = () => {
    const { needsTermsConfirmation, confirmGoogleTerms } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | undefined>()

    const handleConfirm = async () => {
        setIsLoading(true)
        setError(undefined)
        try {
            await confirmGoogleTerms()
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('Ocurrió un error inesperado.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <TermsConfirmationModal
            isOpen={needsTermsConfirmation}
            onConfirm={handleConfirm}
            isLoading={isLoading}
            error={error}
        />
    )
}

export const App = () => {
    return (
        <BrowserRouter>
            <GoogleOAuthProvider clientId={googleClientId}>
                <AuthProvider>
                    <AppRoutes />
                    <TermsConfirmationGate />
                </AuthProvider>
            </GoogleOAuthProvider>
        </BrowserRouter>
    )
}