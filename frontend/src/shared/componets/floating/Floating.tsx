import { useState, useId, type ReactNode } from 'react'

/* eslint-disable react-hooks/refs -- @floating-ui pasa refs de callback durante el render; es su API */
import {
    useFloating,
    useHover,
    useClick,
    useDismiss,
    useInteractions,
    useDelayGroup,
    offset,
    flip,
    shift,
    limitShift,
    size,
    autoUpdate,
    safePolygon,
    FloatingPortal,
    type Placement,
} from '@floating-ui/react'

export interface FloatingRenderProps {
    ref: (node: HTMLElement | null) => void
    props: Record<string, unknown>
    isOpen: boolean
}

export interface FloatingProps {
    anchor: (renderProps: FloatingRenderProps) => ReactNode
    content: ReactNode | ((renderProps: { close: () => void }) => ReactNode)
    placement?: Placement
    trigger?: 'hover' | 'click'
    offsetPx?: number
    className?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
    enabled?: boolean          // <-- nuevo
}

export const Floating = ({
    anchor,
    content,
    placement = 'right-start',
    trigger = 'hover',
    offsetPx = 12,
    className,
    open: controlledOpen,
    onOpenChange,
    enabled = true,
}: FloatingProps) => {
    const groupId = useId()
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const isControlled = controlledOpen !== undefined

    const isOpen = enabled ? (isControlled ? controlledOpen : uncontrolledOpen) : false
    const setOpen = isControlled ? onOpenChange! : setUncontrolledOpen

    const { refs, x, y, strategy, context } = useFloating({
        open: isOpen,
        onOpenChange: setOpen,
        placement,
        middleware: [
            offset(offsetPx),
            flip({ fallbackAxisSideDirection: 'end', padding: 8 }),
            shift({ padding: 8, limiter: limitShift() }),
            size({
                padding: 8,
                apply({ availableWidth, availableHeight, elements }) {
                    Object.assign(elements.floating.style, {
                        maxWidth: `${Math.max(availableWidth, 120)}px`,
                        maxHeight: `${Math.max(availableHeight, 80)}px`,
                        overflowY: 'auto',
                    })
                },
            }),
        ],
        whileElementsMounted: enabled ? autoUpdate : undefined,
    })

    const { delay } = useDelayGroup(context, { id: groupId })
    const hover = useHover(context, {
        enabled: enabled && trigger === 'hover',
        delay,
        handleClose: safePolygon(),
    })

    const click = useClick(context, { enabled: enabled && trigger === 'click' })
    const dismiss = useDismiss(context, { enabled })
    const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss])

    const resolvedContent = typeof content === 'function'
        ? content({ close: () => setOpen(false) })
        : content

    return (
        <>
            {anchor({ ref: refs.setReference, props: enabled ? getReferenceProps() : {}, isOpen })}

            {enabled && isOpen && (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        className={className}
                        style={{ position: strategy, top: y ?? 0, left: x ?? 0, boxSizing: 'border-box' }}
                        {...getFloatingProps()}
                    >
                        {resolvedContent}
                    </div>
                </FloatingPortal>
            )}
        </>
    )
}