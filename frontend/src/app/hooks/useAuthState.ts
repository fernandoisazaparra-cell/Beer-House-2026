import { useState } from "react"
import { type userRol } from '@/config'
import { useNavigate } from "react-router-dom"
import { loginUser, type LoginResponse, confirmTerms } from '@/features/auth/services'

export interface user {
    id: number
    name: string
    email: string
    rol: string
}

const STORAGE_KEY_TOKEN = 'bh_token'
const STORAGE_KEY_USER = 'bh_user'

export const useAuthState = () => {
    const navigate = useNavigate()

    const [isAuth, setIsAuth] = useState(() => {
        return !!localStorage.getItem(STORAGE_KEY_TOKEN)
    })

    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem(STORAGE_KEY_TOKEN)
    })

    const [user, setUser] = useState<user | null>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_USER)
        return stored ? JSON.parse(stored) : null
    })

    const currentRole: userRol = (user?.rol ?? "guest") as userRol

    const [needsTermsConfirmation, setNeedsTermsConfirmation] = useState(false)

    const SetAuth = () => setIsAuth(true)
    const NotAuth = () => setIsAuth(false)

    const login = async (email: string, password: string) => {
        const result: LoginResponse = await loginUser({ email, password })

        localStorage.setItem(STORAGE_KEY_TOKEN, result.token)
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user))

        setToken(result.token)
        setUser(result.user)
        setIsAuth(true)
        navigate("/")
    }

    const loginWithGoogle = (result: LoginResponse) => {
        localStorage.setItem(STORAGE_KEY_TOKEN, result.token)
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user))

        setToken(result.token)
        setUser(result.user)
        setIsAuth(true)

        if (result.requires_confirmation) {
            setNeedsTermsConfirmation(true)
        } else {
            navigate("/")
        }
    }

    const confirmGoogleTerms = async (termsVersion = 'v1.0') => {
        const currentToken = token || localStorage.getItem(STORAGE_KEY_TOKEN)
        if (!currentToken) throw new Error("Token no disponible")

        await confirmTerms(currentToken, termsVersion)
        setNeedsTermsConfirmation(false)
        navigate("/")
    }

    const logout = () => {
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_USER)
        setToken(null)
        setUser(null)
        setIsAuth(false)
        setNeedsTermsConfirmation(false)
        navigate("/")
    }

    return {
        isAuth,
        SetAuth,
        NotAuth,

        token,
        setToken,

        user,
        currentRole,
        setUser,
        logout,
        login,
        loginWithGoogle,
        needsTermsConfirmation,
        confirmGoogleTerms
    }
}
