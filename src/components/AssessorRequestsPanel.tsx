import { useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, RefreshCcw, Send, X, Download, Loader2 } from 'lucide-react'
import {
  AssessorRequestItem,
  AssessorRequestStatus,
  fetchAssessorRequests,
  updateClaimInfoRequest,
  fetchPccClaimEmails,
  exportClaimInfoRequestsXlsx,
} from '../api'
import { mapClaimFromApi } from '../mappers'
import { ClaimDetail } from './ClaimDetail'
import { Claim } from '../data/mockClaims'

interface AssessorRequestsPanelProps {
  onOpenClaim?: (claimNo: string) => void
}

type AssessorTabKey = AssessorRequestStatus | 'all'

const ASSESSOR_STATUS_CONFIG: Record<
  AssessorRequestStatus,
  { label: string; pill: string; dot: string }
> = {
  no_reply: {
    label: 'No reply',
    pill: 'bg-red-100 text-red-700 border border-red-200',
    dot: 'bg-red-500',
  },
  complete: {
    label: 'Complete',
    pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
  },
  ambiguous: {
    label: 'Ambiguous',
    pill: 'bg-orange-100 text-orange-700 border border-orange-200',
    dot: 'bg-orange-500',
  },
  unmatched: {
    label: 'Unmatched',
    pill: 'bg-rose-100 text-rose-700 border border-rose-200',
    dot: 'bg-rose-500',
  },
  incomplete: {
    label: 'Incomplete',
    pill: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    dot: 'bg-yellow-500',
  },
}

const REQUEST_TABLE_MIN_WIDTH_PX = 2120
const REQUEST_PAGE_SIZE = 50

function maskSensitive(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return '-'
  if (trimmed.length <= 4) return trimmed
  return `${'*'.repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-4)}`
}

function getReminderSentDisplayCount(row: AssessorRequestItem): number {
  const progress = String((row._raw as { reminder_progress?: string } | undefined)?.reminder_progress ?? '').trim()
  const match = /^([0-3])\/3$/.exec(progress)
  if (match) {
    return Number(match[1])
  }

  const r3 = String(row._raw?.reminder_3 ?? '').trim()
  const r2 = String(row._raw?.reminder_2 ?? '').trim()
  const r1 = String(row._raw?.reminder_1 ?? '').trim()
  if (r3) return 3
  if (r2) return 2
  if (r1) return 1
  return 0
}

export function AssessorRequestsPanel({ onOpenClaim: _onOpenClaim }: AssessorRequestsPanelProps) {
  const [rows, setRows] = useState<AssessorRequestItem[]>([])
  const [allRowsCache, setAllRowsCache] = useState<AssessorRequestItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<AssessorRequestStatus | 'all'>('all')
  const [tabCounts, setTabCounts] = useState<Record<AssessorTabKey, number>>({
    all: 0,
    no_reply: 0,
    complete: 0,
    ambiguous: 0,
    unmatched: 0,
    incomplete: 0,
  })
  const [editingRemark, setEditingRemark] = useState<{ claimInfoId: number; value: string } | null>(null)
  const [savingRemark, setSavingRemark] = useState<number | null>(null)
  const requestIdRef = useRef(0)
  const [exporting, setExporting] = useState(false)
  const exportAbortRef = useRef<AbortController | null>(null)

  // Inline email thread drawer
  const [drawerClaimNo, setDrawerClaimNo] = useState<string | null>(null)
  const [drawerClaim, setDrawerClaim] = useState<Claim | null>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerError, setDrawerError] = useState<string | null>(null)
  const drawerCache = useRef<Map<string, Claim>>(new Map())

  const openDrawer = useCallback(async (claimInfoId: number, claimNo: string) => {
    const cacheKey = String(claimInfoId)
    setDrawerClaimNo(claimNo)
    setDrawerError(null)
    setDrawerClaim(drawerCache.current.get(cacheKey) ?? null)
    if (drawerCache.current.has(cacheKey)) return
    setDrawerLoading(true)
    try {
      const raw = await fetchPccClaimEmails(claimInfoId)
      const claim = mapClaimFromApi(raw)
      drawerCache.current.set(cacheKey, claim)
      setDrawerClaim(claim)
    } catch (e) {
      setDrawerError(e instanceof Error ? e.message : String(e))
    } finally {
      setDrawerLoading(false)
    }
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerClaimNo(null)
    setDrawerClaim(null)
  }, [])

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeDrawer])

  const buildTabCounts = (source: AssessorRequestItem[]): Record<AssessorTabKey, number> => {
    const nextCounts: Record<AssessorTabKey, number> = {
      all: source.length,
      no_reply: 0,
      complete: 0,
      ambiguous: 0,
      unmatched: 0,
      incomplete: 0,
    }
    source.forEach((r) => {
      nextCounts[r.status] = (nextCounts[r.status] ?? 0) + 1
    })
    return nextCounts
  }

  const load = useCallback((refreshCounts = false) => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    // Prevent stale rows from previous tab being shown while new tab data is loading.
    setRows([])
    // Keep tab switches to one request while preventing All-tab re-fetch loops.
    const shouldRefreshAll = refreshCounts || !allRowsCache
    const requests = filter === 'all'
      ? Promise.all([
          fetchAssessorRequests({ limit: REQUEST_PAGE_SIZE, status: 'all' }),
          Promise.resolve<AssessorRequestItem[] | null>(null),
        ])
      : Promise.all([
          fetchAssessorRequests({ limit: REQUEST_PAGE_SIZE, status: filter }),
          shouldRefreshAll
            ? fetchAssessorRequests({ limit: REQUEST_PAGE_SIZE, status: 'all' })
            : Promise.resolve<AssessorRequestItem[] | null>(allRowsCache),
        ])

    requests
      .then(([filteredRows, allRows]) => {
        if (requestId !== requestIdRef.current) return
        setRows(filteredRows)
        const source = filter === 'all' ? filteredRows : (allRows ?? filteredRows)
        if (shouldRefreshAll) {
          setAllRowsCache(source)
        }
        setTabCounts(buildTabCounts(source))
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return
        setRows([])
        setError(err instanceof Error ? err.message : 'Failed to load requests')
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return
        setLoading(false)
      })
  }, [allRowsCache, filter])

  useEffect(() => { load() }, [load])

  // Render exactly what the selected-tab API call returns.
  const filtered = rows

  const handleExport = async () => {
    if (exporting) return
    setError(null)
    setExporting(true)
    const controller = new AbortController()
    exportAbortRef.current = controller
    try {
      const { blob, filename } = await exportClaimInfoRequestsXlsx(
        { status: filter === 'all' ? undefined : filter },
        controller.signal,
      )
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Failed to export')
      }
    } finally {
      exportAbortRef.current = null
      setExporting(false)
    }
  }

  const handleCancelExport = () => {
    exportAbortRef.current?.abort()
  }

  const handleSaveRemark = async (claimInfoId: number, value: string) => {
    setEditingRemark(null)
    setSavingRemark(claimInfoId)
    try {
      await updateClaimInfoRequest(claimInfoId, { assessor_note: value })
      setRows((prev) => prev.map((r) => r.claimInfoId === claimInfoId ? { ...r, assessorNote: value } : r))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save remark')
    } finally {
      setSavingRemark(null)
    }
  }

  return (
    <div className="h-[calc(100vh-56px)] overflow-hidden bg-slate-50 relative">
      <div className="max-w-[1400px] mx-auto h-full p-6 flex flex-col gap-5 overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Personal & Commercial Care Claims Review</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track customer replies and reminder progress for requested information updates.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => load(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            {exporting ? (
              <button
                onClick={handleCancelExport}
                title="Cancel the in-progress export"
                className="group inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                <Loader2 size={14} className="animate-spin group-hover:hidden" />
                <X size={14} className="hidden group-hover:block" />
                <span className="group-hover:hidden">Exporting...</span>
                <span className="hidden group-hover:inline">Cancel</span>
              </button>
            ) : (
              <button
                onClick={handleExport}
                title="Export current view to Excel (.xlsx)"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Download size={14} />
                Export
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_6px_24px_-20px_rgba(15,23,42,0.45)]">
          <div className="flex items-end gap-0 px-3 pt-2 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-end gap-1 flex-1">
              {(['all', 'no_reply', 'complete', 'ambiguous', 'unmatched', 'incomplete'] as const).map((s) => {
                const isActive = filter === s
                const cfg = s === 'all' ? null : ASSESSOR_STATUS_CONFIG[s]
                const label = s === 'all' ? 'All' : cfg!.label
                const count = tabCounts[s] ?? 0
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
                      isActive
                        ? 'bg-slate-50 text-blue-700 border-slate-200 relative z-10 -mb-px'
                        : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    {s !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${cfg!.dot}`} />}
                    <span>{label}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-300 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table
              className="w-full text-sm border-separate border-spacing-0"
              style={{ minWidth: `${REQUEST_TABLE_MIN_WIDTH_PX}px` }}
            >
              <thead className="sticky top-0 z-10">
                <tr className="[&>th]:bg-slate-50 [&>th]:text-[11px] [&>th]:uppercase [&>th]:tracking-wider [&>th]:font-semibold [&>th]:text-slate-500 [&>th]:border-b [&>th]:border-slate-200 [&>th]:shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Claim No</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Customer</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Bank Account No</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Bank Name</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">NRIC</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Passport</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">ID Type</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Status</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Reminder</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Days Since Sent</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">AI Remarks</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Assessor Note</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-16 text-center text-slate-500 text-sm">Loading requests...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-16 text-center text-slate-500 text-sm">No requests found.</td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const s = ASSESSOR_STATUS_CONFIG[row.status]
                    const remindersSentDisplay = getReminderSentDisplayCount(row)
                    return (
                      <tr
                        key={String(row.claimInfoId)}
                        className="group transition-all [&>td]:border-b [&>td]:border-slate-100 odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/55"
                      >
                        <td className="px-3 py-3 font-mono font-medium text-blue-600">
                          <button
                            type="button"
                            onClick={() => openDrawer(row.claimInfoId, row.claimNo)}
                            className="hover:underline"
                          >
                            {row.claimNo}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 min-w-[220px]">
                          <button
                            type="button"
                            onClick={() => openDrawer(row.claimInfoId, row.claimNo)}
                            className="text-sm font-medium text-slate-800 hover:text-blue-700 hover:underline text-left"
                          >
                            {row.owner}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap" title={row.bankAccNo}>
                          {maskSensitive(row.bankAccNo)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap" title={row.bankName}>
                          {row.bankName?.trim() || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap" title={row.nric}>
                          {maskSensitive(row.nric)}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-mono text-slate-600 whitespace-nowrap" title={row.passport}>
                          {maskSensitive(row.passport)}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-600 whitespace-nowrap" title={row.idType}>
                          {row.idType?.trim() || '-'}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${s.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {row.fullStatus || s.label}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{row.lastActivity}</p>
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium text-slate-700 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1">
                            <Send size={12} className="text-slate-400 shrink-0" />
                            {remindersSentDisplay}/{row.remindersTotal}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-sm tabular-nums text-slate-700 whitespace-nowrap">
                          {row.daysSinceSent ? `${row.daysSinceSent}d` : '-'}
                        </td>
                        <td className="px-3 py-2.5 min-w-[320px] text-xs text-slate-500" title={row.aiRemarks}>
                          {row.aiRemarks ? (
                            <span className="line-clamp-2 text-slate-600">{row.aiRemarks}</span>
                          ) : (
                            <span className="text-slate-300 italic">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 min-w-[320px] text-xs text-slate-500">
                          {editingRemark?.claimInfoId === row.claimInfoId ? (
                            <textarea
                              autoFocus
                              rows={2}
                              className="w-full text-xs border border-slate-300 rounded-md px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                              value={editingRemark.value}
                              onChange={(e) => setEditingRemark({ claimInfoId: row.claimInfoId, value: e.target.value })}
                              onBlur={() => handleSaveRemark(row.claimInfoId, editingRemark.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveRemark(row.claimInfoId, editingRemark.value) }
                                if (e.key === 'Escape') setEditingRemark(null)
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingRemark({ claimInfoId: row.claimInfoId, value: row.assessorNote ?? '' })}
                              className="group flex items-start gap-1 text-left w-full"
                            >
                              {savingRemark === row.claimInfoId ? (
                                <span className="text-[11px] text-slate-400 italic">Saving...</span>
                              ) : row.assessorNote ? (
                                <span className="text-xs text-slate-600 line-clamp-2">{row.assessorNote}</span>
                              ) : (
                                <span className="text-[11px] text-slate-300 group-hover:text-slate-400 italic">Add note…</span>
                              )}
                              <Pencil size={11} className="text-slate-300 group-hover:text-slate-400 shrink-0 mt-0.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* {!loading && noResponseCount > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-b-xl">
              <AlertTriangle size={13} className="shrink-0" />
              <span>
                <strong>{noResponseCount}</strong> case{noResponseCount > 1 ? 's' : ''} with no response after all reminders � consider closing or escalating.
              </span>
            </div>
          )} */}
        </div>
      </div>

      {/* Email thread slide-in drawer */}
      {drawerClaimNo && (
        <>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 z-20"
            onClick={closeDrawer}
          />
          {/* Panel */}
          <div className="absolute top-0 right-0 h-full w-[640px] max-w-full bg-white shadow-2xl z-30 flex flex-col animate-slide-in-right border-l border-slate-200">
            {/* Floating close button */}
            <button
              type="button"
              onClick={closeDrawer}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-white"
            >
              <X size={15} />
            </button>
            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto">
              {drawerLoading && !drawerClaim ? (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading emails…</div>
              ) : drawerError ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-red-600 text-sm px-6 text-center">
                  <span className="font-semibold">Failed to load emails</span>
                  <span className="text-xs text-slate-500">{drawerError}</span>
                </div>
              ) : drawerClaim ? (
                <ClaimDetail claim={drawerClaim} />
              ) : (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">No email data found for {drawerClaimNo}.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
