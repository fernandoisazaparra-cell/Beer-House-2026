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
            <div className={styles.userImg}>
                <img src={user.img} alt={user.name} />
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