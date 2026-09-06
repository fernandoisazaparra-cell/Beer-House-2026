import styles from './user.module.css'

import {
    useAuth
} from '@/app/context'

import {
    FaGear
} from '@/ui/icons'

interface UserProps {
    variant?: 'header' | 'aside'
    isClose?: boolean
}

const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
}

export const User = ({
    variant = 'header',
    isClose = false,
}: UserProps) => {
    const { user } = useAuth()
    if (!user) return

    return (
        <div
            className={`
                ${styles.ContentUser}
                ${styles[variant]}
                ${variant === 'aside' && isClose ? styles.close : ''}
            `}
        >
            <div className={styles.userInitials}>
                {getInitials(user.name)}
            </div>

            <div className={styles.userText}>
                <h1>{user.name}</h1>
                <span>{user.email}</span>
            </div>

            {variant === 'aside' && (
                <div className={styles.userConfig}>
                    <FaGear className={styles.icons} />
                </div>
            )}
        </div>
    )
}
