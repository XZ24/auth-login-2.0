import { useEffect, useState } from 'react'
// Preserve context while allowing a compact stack on smaller screens.
export function useContextDisclosure() {
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 981px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 981px)')
    const resize = () => setOpen(media.matches)
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [])
  return { open, onToggle: (event: React.SyntheticEvent<HTMLDetailsElement>) => setOpen(event.currentTarget.open) }
}
