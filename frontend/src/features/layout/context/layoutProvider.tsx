import {
    useLayoutState
} from '../hooks'

import {
    LayoutContext
} from './layoutContext'

import type {
    ReactNode
} from 'react'

interface LayoutProviderValue {
    children: ReactNode
}

export const LayoutProvider = ({
    children
}: LayoutProviderValue) => {
    const layoutState = useLayoutState()

    return (
        <LayoutContext.Provider value={layoutState}>
            {children}
        </LayoutContext.Provider>
    )
}