import { useEffect, useState } from "react"
import { useSidebarWidth } from "./useSidebarWidth"

import {
    useMediaQuery,
    BreakPoints
} from '@/app/hooks'

export const useLayoutState = () => {
    const isTablet = useMediaQuery({ query: BreakPoints.tablet })

    // UseStates
    const [isClose, setIsClose] = useState(isTablet)
    
    // Effect
    useEffect(() => {
        const media = window.matchMedia(BreakPoints.tablet)
        const listener = (event: MediaQueryListEvent) => {
            if (event.matches) setIsClose(true)
        }
        media.addEventListener('change', listener)
        return () => media.removeEventListener('change', listener)
    }, [])

    useSidebarWidth(isClose)

    // Toggles
    const openSidebar = () => setIsClose(false)
    const closeSidebar = () => setIsClose(true)
    const toggleClose = () => setIsClose((prev) => !prev)

    return {
        isClose,
        openSidebar,
        closeSidebar,
        toggleClose
    }
}