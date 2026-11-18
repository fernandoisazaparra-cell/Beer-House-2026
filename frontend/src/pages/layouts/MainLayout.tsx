import {
    Outlet
} from "react-router-dom"

import {
    Aside,
    Header,
    Footer
} from '@/features'

import {
    LayoutProvider,
    useLayout
} from '@/features/layout/context'

import {
    useMediaQuery,
    BreakPoints
} from '@/app/hooks'

import styles from './MainLayout.module.css'

const MobileOverlay = () => {
    const isResponsive = useMediaQuery({ query: BreakPoints.tablet })
    const { isClose, closeSidebar } = useLayout()

    if (!isResponsive || isClose) return null

    return (
        <div
            className={styles.overlay}
            onClick={closeSidebar}
            aria-hidden="true"
        />
    )
}

export const MainLayout = () => {
    return (
        <LayoutProvider>
            <div className={styles.layout}>
                <Aside />
                <Header />
                <MobileOverlay />

                <main className={styles.main}>
                    <div className={styles.content}>
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </LayoutProvider>
    )
}