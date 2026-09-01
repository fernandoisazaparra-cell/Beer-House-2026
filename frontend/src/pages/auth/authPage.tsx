import styles from './auth.module.css'
import BackgroundRegistre from '@/ui/assets/BackgroundRegistre.jpg'
import { useLocation } from "react-router-dom";

import {
    RegistreForm,
    LoginForm
} from '@/features/auth'

import {
    API_ROUTES
} from '@/app/api'

export const AuthPage = () => {
    const location = useLocation()
    const isLogin = location.pathname === API_ROUTES.Auth.Registre
    return (
        <>
            <section className={styles.seccion}>
                <img src={BackgroundRegistre} alt="Fondo del registre" className={styles.background}/>
        
                <div className={styles.contentForm}>
                    {isLogin ? (<RegistreForm />) : (<LoginForm />)}
                </div>
            </section>
        </>
    )
}