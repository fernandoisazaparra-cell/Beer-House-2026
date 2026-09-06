import styles from './asideFooter.module.css'
import { useNavigate } from 'react-router-dom';

import {
    useAuth,
} from '@/app/context'

import {
    useMediaQuery,
    BreakPoints,
} from '@/app/hooks'

import {
    User,
} from '@/shared/componets'

import {
    useLayout
} from '@/features/layout/context'

import {
    IoIosExit,
    FaUser
} from '@/ui/icons'

import {
    ItemsNav
} from '@/features/layout/componets/aside/asideItems/navItem/itemsNav'

import {
    type MenuSection
} from '@/config'

import {
    API_ROUTES
} from '@/app/api'

export const AsideFooter = () => {
    const { token, logout } = useAuth()
    const { isClose } = useLayout()
        const navigate = useNavigate();
    const isResponsive = useMediaQuery({ query: BreakPoints.tablet })

    const FooterMenu: MenuSection[] = [
        {
            title: "login",
            items: [
                { action: (logout), icon: IoIosExit, label: 'Cerrar seccion', rol: ['user', 'admin'] },
            ]
        },
        {
            title: "noLogin",
            items: [
                { action: (() => navigate(API_ROUTES.Auth.Registre)), icon: FaUser, label: 'Iniciar seccion', rol: ['user', 'admin'] },
            ]
        }
    ]

    const currentSection = token ? 'login' : 'noLogin'
    const footerVisible = FooterMenu.filter(
        section => section.title === currentSection
    );

    const NavItem = footerVisible.map((section) => (
        <ul key={section.title} className={styles.WrapperUl}>
            {section.items.map((item, i) => (
                <ItemsNav
                    key={item.path ?? `${item.label}-${i}`}
                    item={item}
                />
            ))}
        </ul>
    ));

    return (
        <div className={styles.asideFooter}>
            {(isResponsive && token) ? (
                <User
                    isClose={isClose}
                    variant='aside'
                />
            ) : (isResponsive && !token) ? (
                <>
                    {NavItem}
                </>
            ) : token ? (
                <>
                    {NavItem}
                </>
            ) : null}
        </div >
    )
}