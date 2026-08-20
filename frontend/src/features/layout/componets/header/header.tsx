import styles from './header.module.css'
import { useNavigate } from 'react-router-dom';

import { 
    IoIosNotifications,
    IoIosMenu,

    RiShoppingCartFill,

    TiArrowSortedDown
} from '@/ui/icons'

import {
    useLayout
} from '@/features/layout/context'

import {
    useMediaQuery,
    BreakPoints
} from '@/app/hooks'

import {
    Logo,
    User
} from '@/shared'

import {
    useAuth
} from '@/app/context'

import {
    API_ROUTES
} from '@/app/api'

export const Header = () => {
    const { token } = useAuth()
    const navigate = useNavigate();

    // States
    const { isClose, toggleClose } = useLayout()
    const isCompact = useMediaQuery({ query: BreakPoints.tablet })

    return (
        <header className={`${styles.header} ${isCompact ? styles.responsive : ''}`}>
            <nav className={styles.nav}>
    
                    <div className={styles.contentLeft}>
                        {isCompact ? (
                            <Logo />
                        ) : (
                            <div className={styles.openContainer}>
                                <TiArrowSortedDown 
                                    className={`
                                        ${styles.icon} 
                                        ${styles.iconOpen} 
                                        ${isClose ? styles.close : ''}
                                    `}
                                    onClick={() => toggleClose()}
                                />
                            </div>
                        )}
                    </div>

                <div className={styles.contentRigth}>
                    <div className={styles.ContentOptions}>
                        <div>
                            <IoIosNotifications className={styles.icon} />
                        </div>

                        <div>
                            <RiShoppingCartFill className={styles.icon} />
                        </div>

                        {isCompact && 
                            <IoIosMenu 
                                className={styles.icon}
                                onClick={() => toggleClose()}
                            />
                        }
                    </div>

                    {(!isCompact && token) ? (
                        <div>
                            <User variant='header' />
                        </div>
                    ): !isCompact ? (
                        <div className={styles.contentLogin}>
                            <button 
                                onClick={() => navigate(API_ROUTES.Auth.Registre)}
                                className={styles.login}
                            >
                                <h2>Iniciar seccion</h2>
                            </button>
                        </div>
                    ) : null}
                </div>
            </nav>
        </header>
    )
}
