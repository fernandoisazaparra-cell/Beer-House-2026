import { useState } from 'react'

import { useLayout } from '@/features/layout/context'

import type { NavItemType } from '@/config'

import { NavItem } from './navItem'
import { SubItemsNav } from './subItemsNav'

export interface SidebarLinkProps {
    item: NavItemType
    level?: number
    index?: number
}

export const ItemsNav = ({
    item,
    level = 0,
    index = 0
}: SidebarLinkProps) => {
    const { isClose } = useLayout()
    const [isOpen, setIsOpen] = useState(false)

    const hasChildren = !!item.children?.length

    const toggleOpen = () => setIsOpen((prev) => !prev)

    const showInlineSubMenu =
        hasChildren &&
        !isClose &&
        isOpen

    return (
        <SubItemsNav
            item={item}
            level={level}
            index={index}
            isClose={isClose}
            hasChildren={hasChildren}
        >
            <NavItem
                item={item}
                level={level}
                isClose={isClose}
                hasChildren={hasChildren}
                isOpen={isOpen}
                showInlineSubMenu={showInlineSubMenu}
                toggleOpen={toggleOpen}
            />
        </SubItemsNav>
    )
}