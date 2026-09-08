import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/context'
import type { JSX } from 'react'

interface RequireAdminProps {
    children: JSX.Element
}

export const RequireAdmin = ({ children }: RequireAdminProps) => {
    const { currentRole } = useAuth()

    if (currentRole !== 'admin') {
        return <Navigate to="/" replace />
    }

    return children
}