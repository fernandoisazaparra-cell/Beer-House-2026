import React, {
    useState
} from 'react'

import {
    useAuth
} from '@/app/context'

import {
    registreUser,
    verifyEmail,
    RepeatToken,
    loginGoogle,
    type ApiErrorResponse
} from '../services'

import { useGoogleLogin } from "@react-oauth/google";

export const useRegistreForm = () => {
    const { login, loginWithGoogle } = useAuth()

    const [terms, setTerms] = useState(false)
    const [years, setYear] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [errorsToken, setErrorsToken] = useState<Record<string, string[]>>({})
    const [verifyError, setVerifyError] = useState<Record<string, string[]>>({})
    const [verifyLogin, setVerifyLogin] = useState<Record<string, string[]>>({})

    const [showVerify, setShowVerify] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')
    const [registeredPassword, setRegisteredPassword] = useState('')

    const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            terms,
            years
        }

        try {
            setIsLoading(true)
            setErrors({})

            await registreUser(data)
            setRegisteredEmail(data.email)
            setRegisteredPassword(data.password)
            setShowVerify(true)
        } catch (err) {
            const result = err as ApiErrorResponse
            if ('errors' in result) {
                setErrors(result.errors)
            } else if ('message' in result) {
                setErrors({general: [result.message]})
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogin = async (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const data = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }

        try {
            setIsLoading(true)
            setVerifyLogin({})
            await login(data.email, data.password)
        } catch(err) {
            const result = err as ApiErrorResponse
            if ('errors' in result) {
                setErrors(result.errors)
            } else if ('message' in result) {
                setErrors({general: [result.message]})
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = async (code: string) => {
        try {
            setVerifyError({})
            await verifyEmail({
                email: registeredEmail,
                code
            })

            setShowVerify(false)
            await login(registeredEmail, registeredPassword)
        } catch (err) {
            const result = err as ApiErrorResponse
            if ('errors' in result) {
                setVerifyError(result.errors)
            } else if ('message' in result) {
                setVerifyError({ code: [result.message] })
            }
        }
    }

    const handleToken = async (email: string) => {
        try {
            setErrorsToken({})
            await RepeatToken(email)
        } catch (err) {
            if (err instanceof Error) {
                setErrorsToken({
                    general: [err.message]
                });
            } else {
                setErrorsToken({
                    general: ['Ocurrió un error inesperado.']
                });
            }
        }
    }

    const handleGoogleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (codeResponse) => {
            try {
                const result = await loginGoogle(codeResponse.code);
                loginWithGoogle(result);
            } catch (err) {
                if (err instanceof Error) {
                    setErrorsToken({ general: [err.message] });
                } else {
                    setErrorsToken({ general: ['Ocurrió un error inesperado.'] });
                }
            }
        },
        onError: () => {
            console.error('Error al iniciar sesión con Google');
        },
    });

    return {
        terms,
        setTerms,

        years,
        setYear,

        isLoading,

        errors,
        errorsToken,
        verifyLogin,
        handleSubmit,
        handleToken,
        handleLogin,
        handleGoogleLogin,

        showVerify,
        setShowVerify,

        registeredEmail,

        handleVerify,

        verifyError,
        setVerifyError
    }
}