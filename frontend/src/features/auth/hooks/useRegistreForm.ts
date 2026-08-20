import React, {
    useState
} from 'react'

import {
    registreUser,
    type ApiErrorResponse
} from '../services'

export const useRegistreForm = () => {
    const [terms, setTerms] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errors, setErrors] = useState<Record<string, string[]>>({})

    const handleSubmit = async (
        event: React.SubmitEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)

        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            terms
        }

        try {
            setIsLoading(true)
            setErrors({})

            await registreUser(data)
        } catch (err) {
            const result = err as ApiErrorResponse

            if ('errors' in result) {
                setErrors(result.errors)
            } else if ('message' in result) {
                setErrors({ general: [result.message] })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return {
        terms,
        setTerms,

        isLoading,
        errors,
        handleSubmit
    }
}
