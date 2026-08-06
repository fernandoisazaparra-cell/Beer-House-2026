import { useState, useEffect } from "react";

interface mediaQueryValue{
    query: string
}

export const BreakPoints = {
  mobile: '(max-width: 500px)',
  tablet: '(max-width: 900px)',
}

export const useMediaQuery = ({
    query
}: mediaQueryValue) => {
    const [ matches, setMatches ] = useState(() => {
        if (typeof window !== 'undefined') return window.matchMedia(query).matches
        return false
    })

    useEffect(() => {
        const media = window.matchMedia(query)        
        const listener = () => setMatches(media.matches)
        media.addEventListener('change', listener)
        
        return () => media.removeEventListener('change', listener)
    }, [matches, query])

    return matches
}