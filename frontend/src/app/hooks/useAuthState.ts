import { useState } from "react"
import {
    type userRol
} from '@/config'

import { useNavigate } from "react-router-dom";

import UserBeta from '@/ui/assets/UserTest.webp'

export interface user {
    id: number;
    name: string;
    email: string;
    rol: userRol;
    img: string
}

export const useAuthState = () => {
    const navigate = useNavigate();

    // States
    const [isAuth, setIsAuth] = useState(false)
    const [token, setToken] = useState<string | null>();
    const [user, setUser] = useState<user | null>();

    const currentRole = user?.rol ?? "guest"

    // Toggles
    const ToggleAuth = () => setIsAuth((prev) => !prev)
    const SetAuth = () => setIsAuth(true)
    const NotAuth = () => setIsAuth(false)

    // Actions
    const logout = async () => {
        setUser(null)
        setToken(null)
        navigate("/")
    }

    const login = async () => {
        setUser({
            id: 1,
            name: "Enana",
            email: "Enana@gmail.com",
            rol: "admin",
            img: UserBeta
        })
        setToken("Jejeje soy falso >:D")
        navigate("/")
    }

    return {
        isAuth,
        SetAuth,
        NotAuth,
        ToggleAuth,

        token,
        setToken,

        user,
        currentRole,
        setUser,
        logout,
        login
    }
}