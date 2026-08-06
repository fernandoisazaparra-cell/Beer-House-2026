import styles from './header.module.css'

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

export const Header = () => {
    const { token, login } = useAuth()

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
                                onClick={login}
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
