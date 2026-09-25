import { useState, useEffect, useRef, useCallback } from 'react'
import { ClaimsList } from './components/ClaimsList'
import { ClaimDetail } from './components/ClaimDetail'
import { DashboardHeader, View } from './components/DashboardHeader'
import { AssessorRequestsPanel } from './components/AssessorRequestsPanel'
import { EdpClaimsBoard } from './components/EdpClaimsBoard'
import { EdpKpiDashboard } from './components/EdpKpiDashboard'
import { EdpKpiDailyTrend } from './components/EdpKpiDailyTrend'
import { loadKpiSummary, loadKpiDaily } from './kpiCache'
// import { DashboardLanding } from './components/DashboardLanding'
import { LoginPage } from './components/LoginPage'
import { AuthContext } from './authContext'
import {
  AuthUser,
  getMe,
  getRefreshToken,
  hasPermission,
  logout as authLogout,
  onForcedLogout,
} from './auth'
import { Claim } from './data/mockClaims'
import { SortMode } from './api'
import { getClaimsPage, getClaimDetail, useMockClaims } from './claimsData'

function ClaimDetailSkeleton({ claimNumber }: { claimNumber: string }) {
  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Claim Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-800">{claimNumber}</h2>
              <span className="skeleton h-5 w-12 rounded-full" />
              <span className="skeleton h-5 w-14 rounded-full" />
            </div>
            <div className="skeleton h-3.5 w-72" />
          </div>
          <div className="text-right space-y-2">
            <div className="skeleton h-7 w-28 ml-auto" />
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
          <div className="skeleton h-4 w-36" />
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-4 w-24" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-4 py-3">
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-5 w-20" />
          <div className="skeleton h-5 w-24" />
          <div className="skeleton h-5 w-24" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="skeleton h-9 w-24" />
          <div className="skeleton h-9 w-44" />
        </div>
        <div className="skeleton h-4 w-28" />
      </div>

      {/* Message card */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <div className="skeleton h-4 w-40" />
                <div className="skeleton h-3 w-56" />
              </div>
            </div>
            <div className="skeleton h-3 w-28" />
          </div>
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="skeleton h-3.5 w-11/12" />
            <div className="skeleton h-3.5 w-10/12" />
            <div className="skeleton h-3.5 w-9/12" />
            <div className="skeleton h-3.5 w-7/12" />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Loading claim {claimNumber}…
        </div>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // On load: if a refresh token survives (page reload), validate the session by
  // fetching the profile — authFetch silently refreshes the access token first.
  useEffect(() => {
    let cancelled = false
    const unsub = onForcedLogout(() => {
      if (!cancelled) setUser(null)
    })
    ;(async () => {
      if (getRefreshToken()) {
        try {
          const me = await getMe()
          if (!cancelled) setUser(me)
        } catch {
          if (!cancelled) setUser(null)
        }
      }
      if (!cancelled) setAuthLoading(false)
    })()
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const handleLogout = useCallback(async () => {
    await authLogout()
    setUser(null)
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout, can: (permission) => hasPermission(user, permission) }}>
      <MainApp onLogout={handleLogout} />
    </AuthContext.Provider>
  )
}

function MainApp({ onLogout }: { onLogout: () => void }) {
  const PAGE_SIZE = 50
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [view, setView] = useState<View>('claims')
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  // Filter: only show claims where the assessor still needs to reply
  // (last_reply_is_etiqa === false).
  const [notReplied, setNotReplied] = useState(false)

  // Cache: claimNumber -> fully-loaded Claim (so we only fetch detail once per claim)
  const detailCache = useRef<Map<string, Claim>>(new Map())
  // Dedup set survives across page loads (reset on new search)
  const seenIds = useRef<Set<string>>(new Set())
  const nextOffset = useRef(0)
  const inFlight = useRef(false)
  // Mirror hasMore in a ref so the callback always sees the latest value,
  // not the value captured when it was memoized.
  const hasMoreRef = useRef(true)
  // Token to invalidate in-flight requests when search changes
  const searchToken = useRef(0)

  const sortRef = useRef<SortMode>('newest')
  const notRepliedRef = useRef(false)

  // Prefetch KPI summary + daily trend in the background so the KPI views
  // are instant when the user navigates to them.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    loadKpiSummary(false, { to_date: today }).catch(() => { /* errors surfaced inside the KPI view */ })
    loadKpiDaily().catch(() => { /* errors surfaced inside the trend view */ })
  }, [])

  const loadNextPage = useCallback(async (search: string, token: number) => {
    if (inFlight.current || !hasMoreRef.current) return
    inFlight.current = true
    setLoadingMore(true)
    try {
      const page = await getClaimsPage(PAGE_SIZE, nextOffset.current, search || undefined, sortRef.current, notRepliedRef.current ? false : undefined)
      // Stale response from a previous search — drop it
      if (token !== searchToken.current) return
      const fresh: Claim[] = []
      for (const item of page) {
        if (!item?.claimNumber || seenIds.current.has(item.claimNumber)) continue
        seenIds.current.add(item.claimNumber)
        fresh.push(item)
      }
      if (fresh.length) setClaims(prev => [...prev, ...fresh])
      nextOffset.current += PAGE_SIZE
      if (page.length < PAGE_SIZE) {
        hasMoreRef.current = false
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load claims page:', err)
    } finally {
      inFlight.current = false
      setLoadingMore(false)
    }
  }, [])

  // Initial page load
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadNextPage('', searchToken.current)
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce the search input → server search
  useEffect(() => {
    const handle = setTimeout(() => {
      setActiveSearch(searchInput.trim())
    }, 300)
    return () => clearTimeout(handle)
  }, [searchInput])

  // Helper: reset pagination and reload from scratch
  const resetAndReload = useCallback((search: string) => {
    searchToken.current += 1
    const token = searchToken.current
    seenIds.current = new Set()
    nextOffset.current = 0
    hasMoreRef.current = true
    inFlight.current = false
    setClaims([])
    setHasMore(true)
    setLoadingMore(false)
    loadNextPage(search, token)
  }, [loadNextPage])

  // When the active (debounced) search changes, reset the list and re-fetch from page 0
  useEffect(() => {
    // Skip the very first render (covered by the initial-page effect above)
    if (searchToken.current === 0 && activeSearch === '') return
    resetAndReload(activeSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch])

  // When sort changes, reset and re-fetch
  const handleSortChange = useCallback((s: SortMode) => {
    setSort(s)
    sortRef.current = s
    resetAndReload(activeSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch, resetAndReload])

  // When the "Not yet replied" filter toggles, reset and re-fetch
  const handleNotRepliedChange = useCallback((v: boolean) => {
    setNotReplied(v)
    notRepliedRef.current = v
    resetAndReload(activeSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch, resetAndReload])

  async function loadClaimDetail(stub: Claim): Promise<Claim | null> {
    const claimNumber = stub.claimNumber
    const cached = detailCache.current.get(claimNumber)
    if (cached) return cached
    try {
      const full = await getClaimDetail(claimNumber)
      // Preserve the stub's display label + list-only fields so the detail view
      // doesn't lose data the single-claim endpoint doesn't return.
      const merged: Claim = {
        ...full,
        insuredName: stub.insuredName || full.insuredName,
        // The single-claim detail endpoint doesn't return last_reply_is_etiqa,
        // so keep the value from the list stub to preserve the blue dot.
        lastReplyIsEtiqa: stub.lastReplyIsEtiqa ?? full.lastReplyIsEtiqa,
        // The detail endpoint also doesn't return the edp_claims fields,
        // so keep current_status / current_pic from the list stub.
        currentStatus: stub.currentStatus ?? full.currentStatus,
        currentPic: stub.currentPic ?? full.currentPic,
        claimant: {
          ...full.claimant,
          fullName: stub.claimant.fullName || full.claimant.fullName,
        },
      }
      // Reflect the merged detail back into the list row.
      setClaims(prev => prev.map(c => (c.claimNumber === claimNumber ? merged : c)))
      detailCache.current.set(claimNumber, merged)
      return merged
    } catch (err) {
      console.error(`Failed to load detail for ${claimNumber}:`, err)
      return null
    }
  }

  const handleSelectClaim = async (claim: Claim) => {
    setView('claims')
    // Show stub immediately so the UI feels responsive, then fetch full detail.
    setSelectedClaim(claim)
    if (detailCache.current.has(claim.claimNumber)) {
      setSelectedClaim(detailCache.current.get(claim.claimNumber)!)
      return
    }
    setDetailLoading(true)
    const full = await loadClaimDetail(claim)
    setDetailLoading(false)
    if (full) setSelectedClaim(full)
  }

  const handleOpenAssessorClaim = async (claimNo: string) => {
    setView('claims')

    const existing = claims.find((c) => c.claimNumber === claimNo)
    if (existing) {
      await handleSelectClaim(existing)
      return
    }

    try {
      const rows = await getClaimsPage(1, 0, claimNo, sortRef.current)
      const matched = rows.find((r) => r?.claimNumber === claimNo) ?? rows[0]
      if (!matched) {
        setSearchInput(claimNo)
        return
      }

      const stub = matched
      setClaims((prev) => (prev.some((c) => c.claimNumber === stub.claimNumber) ? prev : [stub, ...prev]))
      await handleSelectClaim(stub)
    } catch (err) {
      console.error(`Failed to open assessor claim ${claimNo}:`, err)
      setSearchInput(claimNo)
    }
  }

  const handleViewChange = (v: View) => {
    setView(v)
    if (v === 'dashboard') setSelectedClaim(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-lg">Loading claims...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader claimsCount={claims.length} currentView={view} onViewChange={handleViewChange} onLogout={onLogout} />
      {view === 'edp' ? (
        <EdpClaimsBoard />
      ) : view === 'kpi' ? (
        <EdpKpiDashboard />
      ) : view === 'trend' ? (
        <EdpKpiDailyTrend />
      ) : view === 'assessor' ? (
        <AssessorRequestsPanel onOpenClaim={handleOpenAssessorClaim} />
      ) : (
        <div className="flex h-[calc(100vh-56px)]">
          <div className="w-[420px] border-r border-slate-200 bg-white">
            <ClaimsList
              mockData={useMockClaims}
              claims={claims}
              selectedId={selectedClaim?.id ?? null}
              onSelect={(claim) => handleSelectClaim(claim)}
              loadingMore={loadingMore}
              hasMore={hasMore}
              searchQuery={searchInput}
              onSearchChange={setSearchInput}
              searching={searchInput !== activeSearch}
              sort={sort}
              onSortChange={handleSortChange}
              notReplied={notReplied}
              onNotRepliedChange={handleNotRepliedChange}
              onListScroll={(e) => {
                const el = e.currentTarget
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
                  loadNextPage(activeSearch, searchToken.current)
                }
              }}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedClaim ? (
              detailLoading ? (
                <ClaimDetailSkeleton claimNumber={selectedClaim.claimNumber} />
              ) : (
                <div className="animate-fade-in">
                  <ClaimDetail claim={selectedClaim} />
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg">Select a claim to view details</p>
                  <p className="text-sm mt-2">7,000 outstanding claims &middot; 300 new daily</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
   
    </div>
  )
}

export default App
