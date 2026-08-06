import {
    createContext
} from 'react'

import {
    useLayoutState
} from '../hooks'

type layoutContextValue = ReturnType<typeof useLayoutState>

export const LayoutContext = createContext<layoutContextValue | undefined>(undefined)