import { 
    NavLink 
} from 'react-router-dom'

import styles from './itemsNav.module.css'

import type { 
    NavItemType 
} from '@/config'

import { 
    TiArrowSortedDown 
} from '@/ui/icons'

import { 
    ItemsNav 
} from './itemsNav'

interface NavItemProps {
    item: NavItemType
    level: number
    isClose: boolean
    hasChildren: boolean
    isOpen: boolean
    showInlineSubMenu: boolean
    toggleOpen: () => void
}

export const NavItem = ({
    item,
    level,
    isClose,
    hasChildren,
    isOpen,
    showInlineSubMenu,
    toggleOpen,
}: NavItemProps) => {
    const Icon = item.icon

    const itemContent = (
        <>
            {Icon && (
                <div className={`${styles.iconContainer} ${isClose ? styles.close : ''}`}>
                    <Icon className={styles.iconWrapper} />
                </div>
            )}

            <span
                className={`${styles.textLabel} ${
                    isClose ? styles.close : ''
                }`}
            >
                {item.label}
            </span>
        </>
    )

    return (
        <>
            {hasChildren ? (
                <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => !isClose && toggleOpen()}
                >
                    <div className={styles.leftContainer}>
                        {itemContent}
                    </div>

                    {!isClose && (
                        <div className={styles.iconContainer}>
                            <TiArrowSortedDown
                                className={`${styles.iconWrapper} ${
                                    isOpen ? styles.activateIcon : ''
                                }`}
                            />
                        </div>
                    )}
                </button>
            ) : item.path ? (
                <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                        `${styles.NavLink} ${
                            isActive ? styles.active : ''
                        }`
                    }
                >
                    {itemContent}
                </NavLink>
            ) : item.action ? (
                <button
                    type="button"
                    onClick={item.action}
                    className={styles.NavLink}
                >
                    {itemContent}
                </button>
            ) : null}

            {showInlineSubMenu && (
                <ul className={styles.subMenuInline}>
                    {item.children!.map((child, i) => (
                        <ItemsNav
                            key={child.path ?? `${child.label}-${i}`}
                            item={child}
                            level={level + 1}
                            index={i}
                        />
                    ))}
                </ul>
            )}
        </>
    )
}