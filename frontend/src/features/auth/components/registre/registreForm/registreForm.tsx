import styles from './registreForm.module.css'

import {
    LineDecoration,
    FormField,
    FormCheckbox,
    VerifyTokenModal
} from '@/shared'

import {
    FaUser,
    SiGmail,
    FaLock,
    FaGoogle
} from '@/ui/icons'

import { useRegistreForm } from '@/features/auth/hooks'

export const RegistreForm = () => {
    const {
        terms,
        setTerms,
        years,
        setYear,
        isLoading,
        errors,

        handleSubmit,
        handleToken,

        showVerify,
        setShowVerify,
        registeredEmail,
        handleVerify,
        verifyError,
        setVerifyError

    } = useRegistreForm()

    const getFieldError = (name: string): string | undefined => {
        return errors[name]?.[0]
    }

    return (
        <>
            <div className={styles.registreForm}>
                <div className={styles.contentText}>
                    <span>CREAR</span>
                    <span>CUENTA</span>
                </div>

                <LineDecoration color='var(--color-accent)' />

                <h2 className={styles.textDescription}>
                    Tu experiencia comienza aquí. Crea tu cuenta y descubre
                    un mundo de sabores seleccionados para ti.
                </h2>

                <form action="" className={styles.formList} onSubmit={handleSubmit}>
                    <FormField
                        label='Nombre Completo'
                        name='name'
                        placeholder='Ingrese tu nombre completo'
                        icon={<FaUser />}
                        error={getFieldError('name')}
                        autoComplete='off'
                    />
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

                    <FormCheckbox
                        name="terms"
                        checked={terms}
                        onChange={() => setTerms((prev) => !prev)}
                        error={getFieldError('terms')}
                    >
                        Acepto los <a href="">Términos y Condiciones</a> y la <a href="">Política de Privacidad</a>
                    </FormCheckbox>

                    <FormCheckbox
                        name="years"
                        checked={years}
                        onChange={() => setYear((prev) => !prev)}
                        error={getFieldError('years')}
                    >
                        Declaro bajo mi responsabilidad que soy mayor de 18 años
                    </FormCheckbox>

                    {errors.general && (
                        <span className={styles.generalError}>
                            {errors.general[0]}
                        </span>
                    )}

                    <button type='submit' className={styles.button} disabled={isLoading}>
                        {isLoading
                            ? 'REGISTRANDO...'
                            : 'CREAR CUENTA'
                        }
                    </button>
                </form>

                <LineDecoration
                    variant='text'
                    color='var(--color-text-muted)'
                >o regístrate con</LineDecoration>

                <div className={styles.registreExternert}>
                    <button type="button">
                        <FaGoogle />
                        Google
                    </button>
                </div>
                
                <h2 className={styles.contentLogin}>
                    ¿Ya tienes una cuenta? <a href="">Inicia sesión</a>
                </h2>
            </div>

            <VerifyTokenModal
                isOpen={showVerify}
                onClose={() => {
                    setShowVerify(false)
                    setVerifyError({})
                }}
                email={registeredEmail}
                onVerify={handleVerify}
                onToken={handleToken}
                error={verifyError.code?.[0]}
            />
        </>
    )
}