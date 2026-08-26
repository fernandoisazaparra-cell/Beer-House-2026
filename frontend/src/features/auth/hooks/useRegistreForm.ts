import React, {
    useState
} from 'react'

import {
    registreUser,
    verifyEmail,
    type ApiErrorResponse
} from '../services'


export const useRegistreForm = () => {
    const [terms, setTerms] = useState(false)
    const [years, setYear] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})
    const [showVerify, setShowVerify] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')

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
            await verifyEmail({
                email: registeredEmail,
                code
            })

            setShowVerify(false)
        } catch (err) {
            console.log(err)
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

        handleVerify
    }
}