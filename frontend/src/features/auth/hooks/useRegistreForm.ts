import React, {
    useState
} from 'react'

import {
    useAuth
} from '@/app/context'

import {
    registreUser,
    verifyEmail,
    type ApiErrorResponse
} from '../services'


export const useRegistreForm = () => {
    const { login } = useAuth()

    const [terms, setTerms] = useState(false)
    const [years, setYear] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [showVerify, setShowVerify] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')
    const [registeredPassword, setRegisteredPassword] = useState('')
    const [verifyError, setVerifyError] = useState<Record<string, string[]>>({})

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

    return {
        terms,
        setTerms,

        years,
        setYear,

        isLoading,

        errors,

        handleSubmit,

        showVerify,
        setShowVerify,

        registeredEmail,

        handleVerify,

        verifyError,
        setVerifyError
    }
}
