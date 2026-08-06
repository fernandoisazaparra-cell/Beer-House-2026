import {
    useContext
} from 'react'

import {
    LayoutContext
} from './layoutContext'

export const useLayout = () => {
    const context = useContext(LayoutContext)
    if(context === undefined) throw new Error('useLayout debe usarse dentro de <LayoutProvider>')
    return context
}