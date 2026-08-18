import { useState, useEffect } from 'react'

// Story 1.16: no existing media-query hook in this repo. Used to switch
// IssuePickerModal between a desktop-centered Dialog and a mobile bottom
// Sheet (ux-design-specification.md's Responsive Strategy). SSR-safe:
// starts false (desktop-first default) and syncs after mount, since
// `window` doesn't exist during server rendering.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    setMatches(mediaQueryList.matches)

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQueryList.addEventListener('change', listener)
    return () => mediaQueryList.removeEventListener('change', listener)
  }, [query])

  return matches
}
