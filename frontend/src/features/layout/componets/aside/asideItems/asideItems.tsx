import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'
import 'overlayscrollbars/overlayscrollbars.css'

import styles from './asideItems.module.css'

import {
    menuConfig,
    type NavItemType
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

interface ItemGroup {
    title?: string
    items: NavItemType[]
}

/** Agrupa los ítems visibles por su título de grupo, respetando el orden del menú. */
const groupVisibleItems = (items: NavItemType[]): ItemGroup[] =>
    items.reduce<ItemGroup[]>((groups, item) => {
        const lastGroup = groups[groups.length - 1]

        if (item.group && lastGroup?.title !== item.group) {
            groups.push({ title: item.group, items: [item] })
        } else if (lastGroup) {
            lastGroup.items.push(item)
        } else {
            groups.push({ items: [item] })
        }

        return groups
    }, [])

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

                const groups = groupVisibleItems(visibleItems)

                return (
                    <div key={section.title} className={styles.navItemWrapper}>
                        <div className={styles.contentText}>
                            <h1 className={`${isClose ? styles.closeText : ''}`}>{section.title}</h1>
                        </div>
                        {groups.map((group, groupIndex) => (
                            <div key={group.title ?? `group-${groupIndex}`}>
                                {group.title && (
                                    <h2 className={`${styles.groupTitle} ${isClose ? styles.closeText : ''}`}>
                                        {group.title}
                                    </h2>
                                )}
                                <ul className={styles.WrapperUl}>
                                    {group.items.map((item, i) => (
                                        <ItemsNav
                                            key={item.path ?? `${item.label}-${i}`}
                                            item={item}
                                        />
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )
            })}
        </OverlayScrollbarsComponent>
    )
}