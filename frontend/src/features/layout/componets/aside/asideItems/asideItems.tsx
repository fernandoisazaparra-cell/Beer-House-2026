import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'

import styles from './asideItems.module.css'

import {
    menuConfig
} from '@/config'

import {
    useAuth
} from '@/app/context'

import {
    useLayout
} from '@/features/layout/context'

import {
    ItemsNav
} from './navItem/itemsNav'

export const AsideItems = () => {
    const { currentRole } = useAuth()
    const { isClose } = useLayout()

    return (
        <OverlayScrollbarsComponent
            element="nav"
            className={styles.contentItem}
            options={{
                scrollbars: {
                    theme: 'os-theme-custom',
                    autoHide: 'never',
                    autoHideDelay: 300,
                },
                overflow: {
                    x: 'hidden',
                    y: 'scroll',
                },
                paddingAbsolute: true,
            }}
            defer
        >
            {menuConfig.map((section) => {
                const visibleItems = section.items.filter((subItem) => subItem.rol.includes(currentRole))
                if (visibleItems.length === 0) return null

                return (
                    <div key={section.title} className={styles.navItemWrapper}>
                        <div className={styles.contentText}>
                            <h1 className={`${isClose ? styles.closeText : ''}`}>{section.title}</h1>
                        </div>
                        <ul className={styles.WrapperUl}>
                            {visibleItems.map((item, i) => (
                                <ItemsNav
                                    key={item.path ?? `${item.label}-${i}`}
                                    item={item}
                                />
                            ))}
                        </ul>
                    </div>
                )
            })}
        </OverlayScrollbarsComponent>
    )
}