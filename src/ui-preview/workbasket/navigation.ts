import { useLayoutEffect, type RefObject, type MutableRefObject } from 'react'

const key = (view: string) => `ui-preview:workbasket-position:${view}`

export type WorkbasketSelection = { selectedClaimIds: string[]; reminder: 'Reminder 1' | 'Reminder 2' | null }

export function readWorkbasketSelection(url: string): WorkbasketSelection {
  const empty: WorkbasketSelection = { selectedClaimIds: [], reminder: null }
  try {
    const view = new URL(url, window.location.origin).searchParams.get('wbView')
    if (!view) return empty
    const saved = JSON.parse(sessionStorage.getItem(key(view)) || 'null')
    if (saved?.url !== url) return empty
    return {
      selectedClaimIds: Array.isArray(saved.selectedClaimIds) ? saved.selectedClaimIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 1000) : [],
      reminder: saved.reminder === 'Reminder 1' || saved.reminder === 'Reminder 2' ? saved.reminder : null,
    }
  } catch { return empty }
}

/** Each Workbasket visit owns its return position, including horizontal table scroll. */
export function useWorkbasketPosition(root: RefObject<HTMLDivElement | null>, view: string, url: string, selection: MutableRefObject<WorkbasketSelection>) {
  useLayoutEffect(() => {
    const element = root.current
    const restore = () => {
      try {
        const saved = JSON.parse(sessionStorage.getItem(key(view)) || 'null')
        if (!saved || saved.url !== url) return
        if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) window.scrollTo(saved.x, saved.y)
        const table = element?.querySelector('.pv-table-scroll')
        if (table && Number.isFinite(saved.tableX)) table.scrollLeft = saved.tableX
      } catch { /* Browser history still retains the filter URL if storage is unavailable. */ }
    }
    const save = () => {
      try {
        sessionStorage.setItem(key(view), JSON.stringify({ ...selection.current, url, x: window.scrollX, y: window.scrollY,
          tableX: element?.querySelector('.pv-table-scroll')?.scrollLeft || 0 }))
      } catch { /* Position persistence is optional; never prevent opening a claim. */ }
    }
    // Capture before the row/link navigation, including keyboard and new-tab activation.
    const openingClaim = (event: Event) => {
      const target = event.target as HTMLElement
      if (target.closest('.wb-claim-row') && !target.closest('input, button, label')) save()
    }
    restore()
    window.addEventListener('pageshow', restore)
    window.addEventListener('pagehide', save)
    element?.addEventListener('click', openingClaim, true)
    element?.addEventListener('auxclick', openingClaim, true)
    return () => {
      window.removeEventListener('pageshow', restore)
      window.removeEventListener('pagehide', save)
      element?.removeEventListener('click', openingClaim, true)
      element?.removeEventListener('auxclick', openingClaim, true)
    }
  }, [root, view, url, selection])
}
