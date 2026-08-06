import {
    createContext
} from 'react'

import {
    useAuthState
} from '@/app/hooks'

type authContextValue = ReturnType<typeof useAuthState>

export const AuthContext = createContext<authContextValue | undefined>(undefined)