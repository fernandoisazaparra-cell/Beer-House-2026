import styles from './aside.module.css'

import {
    AsideFooter,
    AsideItems
} from './'

import {
    FloatingDelayGroup
} from '@floating-ui/react'

import {
    useMediaQuery,
    BreakPoints
} from '@/app/hooks'

import {
    useLayout
} from '@/features/layout/context'

import {
    Logo
} from '@/shared'

export const Aside = () => {
    const isResponsive = useMediaQuery({ query: BreakPoints.tablet })
    const { isClose } = useLayout()

    return (
        <FloatingDelayGroup delay={{ open: 20, close: 50 }}>
            <aside className={`${styles.aside} ${isResponsive ? styles.responsive : ''}`}>
                {!isResponsive && <Logo withName={!isClose} />}
                <AsideItems />
                <AsideFooter />
            </aside>
        </FloatingDelayGroup>
    )
}