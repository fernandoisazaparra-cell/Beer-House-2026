import {
    useAuthState
} from '@/app/hooks'

import {
    AuthContext
} from './authContext'

import type { 
    ReactNode 
} from "react"

interface AuthProviderValue {
    children: ReactNode
}

export const AuthProvider = ({
    children
}: AuthProviderValue) => {
    const authState = useAuthState()

    return (
        <AuthContext.Provider value={authState}>
            {children}
        </AuthContext.Provider>
    )
}