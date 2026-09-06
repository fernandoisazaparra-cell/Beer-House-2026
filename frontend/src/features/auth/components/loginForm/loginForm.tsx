import styles from '../Form.module.css'

import {
    LineDecoration,
    FormField,
} from '@/shared'

import {
    SiGmail,
    FaLock,
    FaGoogle
} from '@/ui/icons'

import {
    API_ROUTES
} from '@/app/api'

import { useRegistreForm } from '@/features/auth/hooks'

export const LoginForm = () => {
    const {
        isLoading,
        errors,

        handleLogin,
        handleGoogleLogin,
    } = useRegistreForm()

    const getFieldError = (name: string): string | undefined => {
        return errors[name]?.[0]
    }

    return (
        <>
            <div className={styles.registreForm}>
                <div className={styles.contentText}>
                    <span>INICIA</span>
                    <span>SECCION</span>
                </div>

                <LineDecoration color='var(--color-accent)' />

                <h2 className={styles.textDescription}>
                    Tu experiencia continúa aquí. Inicia sesión y 
                    descubre un mundo de sabores seleccionados para ti.
                </h2>

                <form action="" className={styles.formList} onSubmit={handleLogin}>
                    <FormField
                        label='Correo eletronico'
                        name='email'
                        placeholder='Ingrese tu correo electrónico'
                        icon={<SiGmail />}
                        error={getFieldError('email')}
                        autoComplete='off'
                    />
                    <FormField
                        label='Contraseña'
                        name='password'
                        placeholder='Crear una contraseña'
                        type='password'
                        icon={<FaLock />}
                        error={getFieldError('password')}
                        autoComplete='new-password'
                    />
                    {errors.general && (
                        <span className={styles.generalError}>
                            {errors.general[0]}
                        </span>
                    )}
                    <button type='submit' className={styles.button} disabled={isLoading}>
                        {isLoading
                            ? 'INICIANDO...'
                            : 'INICIA SECCION'
                        }
                    </button>
                </form>

                <LineDecoration
                    variant='text'
                    color='var(--color-text-muted)'
                >o inicia con</LineDecoration>

                <div className={styles.registreExternert}>
                    <button type="button" onClick={() => handleGoogleLogin()}>
                        <FaGoogle />
                        Google
                    </button>
                </div>
                
                <h2 className={styles.contentLogin}>
                    ¿Aún no tienes una cuenta? <a href={API_ROUTES.Auth.Registre}>Registrate</a>
                </h2>
            </div>
        </>
    )
}