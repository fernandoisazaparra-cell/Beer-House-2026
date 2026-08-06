import { useEffect } from "react";

import {
    useMediaQuery,
    BreakPoints
} from '@/app/hooks'

const Sidebar_Width = {
    open: "16.5rem",
    close: "4rem",
    closeResponsive: '0rem',
    openResponsive: '100%'
}

export const useSidebarWidth = (isClose: boolean) => {
    const isResponsive = useMediaQuery({ query: BreakPoints.tablet })

    useEffect(() => {
        const closedWidth = isResponsive
            ? Sidebar_Width.closeResponsive
            : Sidebar_Width.close

        const openWidth = isResponsive
            ? Sidebar_Width.openResponsive
            : Sidebar_Width.open

        document.documentElement.style.setProperty(
            "--sidebar-width",
            isClose ? closedWidth : openWidth
        )
    }, [isClose, isResponsive])
}
