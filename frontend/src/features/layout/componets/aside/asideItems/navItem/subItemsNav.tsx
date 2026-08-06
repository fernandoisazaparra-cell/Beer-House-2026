import { NavLink } from 'react-router-dom'

import { Floating } from '@/shared'

import styles from './itemsNav.module.css'

import type { NavItemType } from '@/config'

interface SubItemsNavProps {
    item: NavItemType
    level: number
    index: number
    isClose: boolean
    hasChildren: boolean
    children: React.ReactNode
}

export const SubItemsNav = ({
    item,
    level,
    index,
    isClose,
    hasChildren,
    children,
}: SubItemsNavProps) => {
    const liProps = {
        className: `${styles.liWrapper} ${isClose ? styles.close : ''}`,
        'data-level': level,
        style: { '--i': index } as React.CSSProperties,
    }

    return (
        <Floating
            enabled={isClose}
            trigger="hover"
            placement={hasChildren ? 'right-start' : 'right'}
            offsetPx={20}
            className={hasChildren ? styles.subMenuFixed : styles.tooltipFixed}
            anchor={({ ref, props, isOpen }) => (
                <li
                    ref={ref as React.Ref<HTMLLIElement>}
                    {...props}
                    {...liProps}
                    data-open={isOpen || undefined}
                >
                    {children}
                </li>
            )}
            content={
                hasChildren ? (
                    <ul>
                        <li className={styles.subMenuTitle}>{item.label}</li>
                        {item.children!.map((child) => (
                            <li key={child.path}>
                                {child.path ? (
                                    <NavLink to={child.path} className={styles.subMenuItem}>
                                        {child.icon && <child.icon className={styles.iconWrapper} />}
                                        <span>{child.label}</span>
                                    </NavLink>
                                ) : child.action ? (
                                    <button
                                        type="button"
                                        onClick={child.action}
                                        className={styles.subMenuItem}
                                    >
                                        {child.icon && <child.icon className={styles.iconWrapper} />}
                                        <span>{child.label}</span>
                                    </button>
                                ) : (
                                    <span className={styles.subMenuItem}>
                                        {child.icon && <child.icon className={styles.iconWrapper} />}
                                        <span>{child.label}</span>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <span>{item.label}</span>
                )
            }
        />
    )
}