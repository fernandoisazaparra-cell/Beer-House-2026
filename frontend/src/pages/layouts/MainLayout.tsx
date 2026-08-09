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
    AuthProvider
} from '@/app/context'

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
        <div className={styles.layout}>
            <LayoutProvider>
                <AuthProvider>
                    <Aside />
                    <Header />
                    <MobileOverlay />
                </AuthProvider>
            </LayoutProvider>

            <main className={styles.main}>
                <Outlet />
                <Footer />
            </main>
        </div>
    )
}
