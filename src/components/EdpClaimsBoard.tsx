import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import {
  EdpClaim,
  EdpCurrentStatus,
  EDP_CURRENT_STATUS_OPTIONS,
  EdpClaimUpdate,
  EdpSendReminderResponse,
  sendEdpBankDetailsReminder,
  sendEdpPaymentReissueReminder,
  sendCustomReminder,
  fetchEdpCategories,
  fetchEdpClaimDetail,
  fetchEdpClaimTypes,
  fetchEdpClaims,
  fetchEdpCurrentStatuses,
  fetchEdpPics,
  updateEdpClaim,
  exportEdpClaimsXlsx,
} from '../api'
import { X, Filter, Download, Loader2, Search, RefreshCw, Inbox, PanelRightOpen, PanelRightClose, Paperclip } from 'lucide-react'

// SLA status and detail are now computed by the backend and returned on each
// claim (`sla_status` / `sla_detail`). The frontend only maps the status label
// to a badge colour.
const SLA_STATUS_OPTIONS = ['Breached (Active)', 'Breached (Closed)', 'Near SLA', 'Monitor', 'On Track', 'N/A', 'Pending Manager Approval'] as const

function slaBadgeClass(status?: string | null): string {
  switch ((status ?? '').trim().toLowerCase()) {
    case 'breached':
    case 'breached (active)':
      return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'
    case 'breached (closed)':
      return 'bg-rose-50 text-rose-500 ring-1 ring-inset ring-rose-200'
    case 'near sla':
      return 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200'
    case 'monitor':
      return 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
    case 'on track':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
    case 'pending manager approval':
      return 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200'
    default:
      return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
  }
}

function slaDotClass(status?: string | null): string {
  switch ((status ?? '').trim().toLowerCase()) {
    case 'breached':
    case 'breached (active)':
      return 'bg-red-500'
    case 'breached (closed)':
      return 'bg-rose-400'
    case 'near sla':
      return 'bg-orange-500'
    case 'monitor':
      return 'bg-amber-500'
    case 'on track':
      return 'bg-emerald-500'
    case 'pending manager approval':
      return 'bg-violet-500'
    default:
      return 'bg-slate-400'
  }
}

function formatDate(value?: string): string {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  } catch {
    return value
  }
}

function formatMoney(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `RM ${value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatAge(value?: number): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `${value} day${value === 1 ? '' : 's'}`
}

// Original flight combined with the rebooked flight (flight_no → new_flight_no).
function formatFlight(flightNo?: string, newFlightNo?: string): string {
  const original = (flightNo ?? '').trim()
  const rebooked = (newFlightNo ?? '').trim()
  if (original && rebooked) return `${original} → ${rebooked}`
  return original || rebooked || '-'
}

function normalizeDateInput(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

function getStatusBadgeClass(status?: string): string {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
  if (normalized === 'CLOSED') return 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
  return 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200'
}

type TableTab = 'claims' | 'dates'

const PAGE_SIZE = 50

interface ColumnFilterDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (next: string[]) => void
  variant?: 'icon' | 'pill'
  // When true, options are still being fetched; the empty state shows a
  // loading hint instead of "No options".
  loading?: boolean
  // When true the dropdown behaves as single-select (radio) instead of
  // multi-select. Used for the exact-match `status` filter which the backend
  // accepts as a single value.
  single?: boolean
}

// Multi-select dropdown. OR within this filter; the parent AND-combines
// across filters via separate query params. In `single` mode only one value
// may be selected at a time.
function ColumnFilterDropdown({ label, options, selected, onChange, variant = 'icon', loading = false, single = false }: ColumnFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const toggle = (value: string) => {
    if (single) {
      onChange(selected.includes(value) ? [] : [value])
      setOpen(false)
      return
    }
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const filtered = search.trim()
    ? options.filter((o) => o.toLowerCase().includes(search.trim().toLowerCase()))
    : options

  const active = selected.length > 0

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={active ? `${label}: ${selected.join(', ')}` : `Filter by ${label}`}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border ${
            active
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter size={14} />
          <span className="whitespace-nowrap">
            {label}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          title={active ? `${label}: ${selected.join(', ')}` : `Filter by ${label}`}
          className={`ml-1 inline-flex items-center justify-center w-5 h-5 rounded ${
            active ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <Filter size={12} />
        </button>
      )}
      {open && (
        <div className="absolute z-20 mt-1 left-0 w-56 bg-white border border-slate-300 rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Filter ${label.toLowerCase()}...`}
              className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {active && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 px-2 py-1">
                {loading ? 'Loading options\u2026' : 'No options'}
              </p>
            ) : (
              filtered.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                >
                  <input
                    type={single ? 'radio' : 'checkbox'}
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                    className="accent-blue-600"
                  />
                  <span className="truncate" title={opt}>
                    {opt}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function EdpClaimsBoard() {
  const [claims, setClaims] = useState<EdpClaim[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  // Multi-select filter state (values OR-combined within each filter,
  // AND-combined across filters by the backend).
  const [picFilter, setPicFilter] = useState<string[]>([])
  const [currentStatusFilter, setCurrentStatusFilter] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [claimTypeFilter, setClaimTypeFilter] = useState<string[]>([])
  // Status tab: 'all' shows all, otherwise filters by exact status match.
  const [statusTab, setStatusTab] = useState<'all' | 'ACTIVE' | 'CLOSED' | 'REOPEN'>('all')
  // Last-reply filter: '' = all, 'true' = Etiqa replied last, 'false' = external
  // replied last (action needed). Claims with no email data (null) are excluded
  // when this is set.
  const [replyFilter, setReplyFilter] = useState<'' | 'true' | 'false'>('')
  // SLA status filter: '' = all, otherwise an exact label matched by the backend
  // (case-insensitive). Options mirror the values the API returns.
  const [slaFilter, setSlaFilter] = useState<string>('')
  // Exact loss date filter (YYYY-MM-DD). Sent as loss_date query param.
  const [lossDateFilter, setLossDateFilter] = useState<string>('')
  // Dropdown option sources (fetched once).
  const [picOptions, setPicOptions] = useState<string[]>([])
  const [currentStatusOptions, setCurrentStatusOptions] = useState<string[]>([])
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [claimTypeOptions, setClaimTypeOptions] = useState<string[]>([])
  // True while the dropdown option sources are being (re)fetched on mount.
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [selectedClaimNo, setSelectedClaimNo] = useState<string | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detail, setDetail] = useState<EdpClaim | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, EdpClaimUpdate>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedClaimNos, setSelectedClaimNos] = useState<Set<string>>(new Set())
  const [reminderSendingType, setReminderSendingType] = useState<'bank' | 'reissue' | null>(null)
  const [customReminderOpen, setCustomReminderOpen] = useState(false)
  const [customReminderDraft, setCustomReminderDraft] = useState({ subject: '', body: '' })
  const [customReminderAttachments, setCustomReminderAttachments] = useState<File[]>([])
  const [customReminderSending, setCustomReminderSending] = useState(false)
  const customReminderSectionRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<any>(null)
  useEffect(() => {
    if (!customReminderOpen) return
    const frame = window.requestAnimationFrame(() => {
      customReminderSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [customReminderOpen])

  const insertImageIntoEditor = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) return
      const quill = quillRef.current?.getEditor()
      if (!quill) return
      const range = quill.getSelection() ?? { index: quill.getLength(), length: 0 }
      quill.insertEmbed(range.index, 'image', result, 'user')
      quill.setSelection(range.index + 1, 0)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) insertImageIntoEditor(file)
    }
    input.click()
  }, [insertImageIntoEditor])

  const handleAttachmentSelect = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const incoming = Array.from(fileList)
    setCustomReminderAttachments((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}:${f.size}`))
      return [...prev, ...incoming.filter((f) => !existing.has(`${f.name}:${f.size}`))]
    })
  }, [])

  const handleRemoveAttachment = useCallback((index: number) => {
    setCustomReminderAttachments((prev) => prev.filter((_, i) => i !== index))
  }, [])

  useEffect(() => {
    const editorRoot = quillRef.current?.getEditor()?.root
    if (!editorRoot) return

    const handleQuillPaste = (event: ClipboardEvent) => {
      const clipboardItems = Array.from(event.clipboardData?.items ?? [])
      const imageItem = clipboardItems.find((item) => item.type.startsWith('image/'))
      if (!imageItem) return

      event.preventDefault()
      const file = imageItem.getAsFile()
      if (file) insertImageIntoEditor(file)
    }

    editorRoot.addEventListener('paste', handleQuillPaste)
    return () => editorRoot.removeEventListener('paste', handleQuillPaste)
  }, [customReminderOpen, insertImageIntoEditor])

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [false, 1, 2, 3] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
    clipboard: {
      matchVisual: false,
    },
  }), [handleImageUpload])
  // Flash-highlight the Assessment Complete Date field when a reject save is blocked.
  const [highlightAssessmentDate, setHighlightAssessmentDate] = useState(false)
  const assessmentDateRef = useRef<HTMLInputElement>(null)
  const [activeTableTab, setActiveTableTab] = useState<TableTab>('claims')
  const [exporting, setExporting] = useState(false)
  const [statusCounts, setStatusCounts] = useState<Record<'all' | 'ACTIVE' | 'CLOSED' | 'REOPEN', number | null>>(
    { all: null, ACTIVE: null, CLOSED: null, REOPEN: null }
  )
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const filterPanelRef = useRef<HTMLDivElement | null>(null)

  const detailStatusOptions = useMemo(() => {
    const merged = [...currentStatusOptions, ...EDP_CURRENT_STATUS_OPTIONS]
    return Array.from(new Set(merged.map((value) => value.trim()).filter(Boolean)))
  }, [currentStatusOptions])

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLTableRowElement | null>(null)
  // Track the current request token so out-of-order responses get discarded.
  const requestIdRef = useRef(0)
  // Lets the user cancel an in-progress export.
  const exportAbortRef = useRef<AbortController | null>(null)

  // Debounce search input -> debouncedQuery (used for fetch).
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(id)
  }, [query])

  const loadPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      const token = ++requestIdRef.current
      if (replace) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError(null)
      try {
        const data = await fetchEdpClaims(PAGE_SIZE, nextOffset, {
          search: debouncedQuery,
          status: statusTab === 'all' ? undefined : statusTab,
          pic: picFilter,
          current_status: currentStatusFilter,
          category: categoryFilter,
          claim_type: claimTypeFilter,
          last_reply_is_etiqa: replyFilter === '' ? undefined : replyFilter === 'true',
          sla_status: slaFilter || undefined,
          loss_date: lossDateFilter || undefined,
        })
        if (token !== requestIdRef.current) return // stale
        setClaims((prev) => (replace ? data : [...prev, ...data]))
        setHasMore(data.length === PAGE_SIZE)
        setOffset(nextOffset + data.length)
        if (replace && data.length > 0 && !selectedClaimNo) {
          setSelectedClaimNo(data[0].claim_no)
        }
      } catch (err) {
        if (token !== requestIdRef.current) return
        setError(err instanceof Error ? err.message : 'Failed to load EDP claims')
        setHasMore(false)
      } finally {
        if (token === requestIdRef.current) {
          if (replace) setLoading(false)
          else setLoadingMore(false)
        }
      }
    },
    // selectedClaimNo intentionally omitted: we only auto-select on first load,
    // and including it would refetch when the user clicks a row.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedQuery, statusTab, picFilter, currentStatusFilter, categoryFilter, claimTypeFilter, replyFilter, slaFilter, lossDateFilter],
  )

  // Reset and reload whenever the debounced search or any filter changes.
  useEffect(() => {
    setClaims([])
    setOffset(0)
    setHasMore(true)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    loadPage(0, true)
  }, [debouncedQuery, statusTab, picFilter, currentStatusFilter, categoryFilter, claimTypeFilter, replyFilter, slaFilter, lossDateFilter, loadPage])

  // Fetch status counts — re-runs when non-status filters change so counts reflect active filters
  useEffect(() => {
    let cancelled = false

    const fetchCounts = async () => {
      try {
        const counts: Record<'all' | 'ACTIVE' | 'CLOSED' | 'REOPEN', number | null> = {
          all: null,
          ACTIVE: null,
          CLOSED: null,
          REOPEN: null,
        }
        const statuses: Array<'ACTIVE' | 'CLOSED' | 'REOPEN'> = ['ACTIVE', 'REOPEN']
        const results = await Promise.all(statuses.map((status) => fetchEdpClaims(50, 0, {
          status,
          pic: picFilter,
          current_status: currentStatusFilter,
          category: categoryFilter,
          claim_type: claimTypeFilter,
          last_reply_is_etiqa: replyFilter === '' ? undefined : replyFilter === 'true',
          sla_status: slaFilter || undefined,
          loss_date: lossDateFilter || undefined,
        })))
        results.forEach((data, idx) => {
          counts[statuses[idx]] = data.length
        })
        if (!cancelled) setStatusCounts(counts)
      } catch (err) {
        console.error('Failed to fetch status counts:', err)
      }
    }

    fetchCounts()
    return () => {
      cancelled = true
    }
  }, [picFilter, currentStatusFilter, categoryFilter, claimTypeFilter, replyFilter, slaFilter, lossDateFilter])

  // Close filter panel on outside click
  useEffect(() => {
    if (!filterPanelOpen) return
    const handler = (e: MouseEvent) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setFilterPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterPanelOpen])

  // Load dropdown option sources once on mount.
  useEffect(() => {
    let cancelled = false

    // Retry a meta fetch a few times before giving up, so a slow/cold backend
    // or a transient error doesn't leave the dropdown stuck on "No options".
    const withRetry = async (fn: () => Promise<string[]>, attempts = 3): Promise<string[]> => {
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn()
        } catch (err) {
          if (i === attempts - 1) {
            console.error('Failed to load EDP filter options:', err)
            return []
          }
          await new Promise((r) => setTimeout(r, 400 * (i + 1)))
        }
      }
      return []
    }

    setOptionsLoading(true)
    Promise.all([
      withRetry(fetchEdpPics),
      withRetry(fetchEdpCurrentStatuses),
      withRetry(fetchEdpCategories),
      withRetry(fetchEdpClaimTypes),
    ]).then(([pics, currentStatuses, categories, claimTypes]) => {
      if (cancelled) return
      setPicOptions(pics)
      setCurrentStatusOptions(currentStatuses)
      setCategoryOptions(categories)
      setClaimTypeOptions(claimTypes)
      setOptionsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = scrollRef.current
    const target = sentinelRef.current
    if (!root || !target) return
    if (!hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          loadPage(offset, false)
        }
      },
      { root, rootMargin: '200px 0px', threshold: 0 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, offset, loadPage])

  const handleRefresh = () => {
    setClaims([])
    setOffset(0)
    setHasMore(true)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    loadPage(0, true)
  }

  const handleExport = async () => {
    if (exporting) return
    setError(null)
    setNotice(null)
    setExporting(true)
    const controller = new AbortController()
    exportAbortRef.current = controller
    const isFullExport =
      !debouncedQuery &&
      statusTab === 'all' &&
      picFilter.length === 0 &&
      currentStatusFilter.length === 0 &&
      categoryFilter.length === 0 &&
      claimTypeFilter.length === 0 &&
      !slaFilter &&
      !lossDateFilter
    if (isFullExport) {
      setNotice('Exporting the full table - this can take up to ~2 minutes. You can cancel anytime.')
    }
    try {
      const { blob, filename } = await exportEdpClaimsXlsx({
        search: debouncedQuery,
        status: statusTab === 'all' ? undefined : statusTab,
        pic: picFilter,
        current_status: currentStatusFilter,
        category: categoryFilter,
        claim_type: claimTypeFilter,
        sla_status: slaFilter || undefined,
        loss_date: lossDateFilter || undefined,
      }, controller.signal)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setNotice(`Exported ${filename}`)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setNotice('Export cancelled.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to export EDP claims')
      }
    } finally {
      exportAbortRef.current = null
      setExporting(false)
    }
  }

  const handleCancelExport = () => {
    exportAbortRef.current?.abort()
  }

  const handleToggleClaimSelection = (claimNo: string, checked: boolean) => {
    setSelectedClaimNos((prev) => {
      const next = new Set(prev)
      if (checked) next.add(claimNo)
      else next.delete(claimNo)
      return next
    })
  }

  const handleToggleSelectAllVisible = (checked: boolean) => {
    setSelectedClaimNos((prev) => {
      const next = new Set(prev)
      if (checked) {
        for (const claim of filteredClaims) next.add(claim.claim_no)
      } else {
        for (const claim of filteredClaims) next.delete(claim.claim_no)
      }
      return next
    })
  }

  const handleSendReminder = async (type: 'bank' | 'reissue') => {
    const claimNos = Array.from(selectedClaimNos)
    if (claimNos.length === 0) {
      setError('Please select at least one claim before sending a reminder.')
      setNotice(null)
      return
    }

    setError(null)
    setNotice(null)
    setReminderSendingType(type)
    try {
      const response: EdpSendReminderResponse = type === 'bank'
        ? await sendEdpBankDetailsReminder(claimNos)
        : await sendEdpPaymentReissueReminder(claimNos)

      const failedClaims = response.results
        .filter((item) => !item.sent)
        .slice(0, 3)
        .map((item) => item.claim_no)

      const actionLabel = type === 'bank' ? 'bank details' : 'payment reissue'
      const suffix = failedClaims.length > 0
        ? ` Failed sample: ${failedClaims.join(', ')}.`
        : ''
      setNotice(`Sent ${response.sent}/${response.requested} ${actionLabel} reminders.${suffix}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminders')
    } finally {
      setReminderSendingType(null)
    }
  }

  // Server already filters by `search`. Skip client-side re-filtering so we
  // don't hide rows the server returned (and so infinite-scroll counts work).
  const filteredClaims = claims

  useEffect(() => {
    if (!selectedClaimNo) {
      setDetail(null)
      return
    }

    let cancelled = false
    setDetailLoading(true)
    setError(null)
    fetchEdpClaimDetail(selectedClaimNo)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load claim detail')
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedClaimNo])

  const visibleColSpan = activeTableTab === 'claims' ? 16 : 15

  const allVisibleSelected = filteredClaims.length > 0 && filteredClaims.every((claim) => selectedClaimNos.has(claim.claim_no))

  const isDirty = (claimNo: string): boolean => {
    const draft = drafts[claimNo]
    if (!draft) return false
    return Object.keys(draft).length > 0
  }

  const handleDraftFieldChange = <K extends keyof EdpClaimUpdate>(
    claimNo: string,
    field: K,
    value: EdpClaimUpdate[K],
  ) => {
    setDrafts((prev) => {
      const next = { ...(prev[claimNo] ?? {}), [field]: value }
      return { ...prev, [claimNo]: next }
    })
  }

  const handleResetDraft = (claimNo: string) => {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[claimNo]
      return next
    })
  }

  // Rejecting a claim requires an assessment complete date. Returns true when
  // the effective status is "Reject" but no assessment complete date is set.
  const rejectNeedsAssessmentDate = (claimNo: string): boolean => {
    const draft = drafts[claimNo]
    const source = detail?.claim_no === claimNo ? detail : undefined
    const status = (draft?.current_status ?? source?.current_status ?? '') as EdpCurrentStatus
    const assessmentDate = draft?.assessment_complete_date
      ?? normalizeDateInput(source?.assessment_complete_date)
    return status === 'Reject' && !assessmentDate
  }

  const handleSave = async (claimNo: string) => {
    const updates = drafts[claimNo]
    if (!updates || Object.keys(updates).length === 0) return
    // Block rejecting a claim without an assessment complete date. Guide the
    // user to the field by scrolling it into view and flashing a highlight.
    if (rejectNeedsAssessmentDate(claimNo)) {
      setNotice(null)
      setError('Please fill in the Assessment Complete Date before setting the status to "Reject".')
      assessmentDateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      assessmentDateRef.current?.focus({ preventScroll: true })
      setHighlightAssessmentDate(true)
      window.setTimeout(() => setHighlightAssessmentDate(false), 2000)
      return
    }
    setError(null)
    setNotice(null)
    setSaving((prev) => ({ ...prev, [claimNo]: true }))
    try {
      const updated = await updateEdpClaim(claimNo, updates)
      // Always trust the server response - cascade may have changed reminder fields
      // that the user did not send (e.g. editing doc_request_date auto-fills r1/r2/r3).
      setClaims((prev) => prev.map((claim) => (
        claim.claim_no === claimNo ? { ...claim, ...updated } : claim
      )))
      if (detail?.claim_no === claimNo) {
        setDetail(updated)
      }
      handleResetDraft(claimNo)
      setNotice(`Saved updates for claim ${claimNo}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save claim ${claimNo}`)
    } finally {
      setSaving((prev) => ({ ...prev, [claimNo]: false }))
    }
  }

  const handleSendCustomReminder = async () => {
    if (!detail || !detail.claim_no) return
    const recipient = (detail.email ?? '').trim()
    if (!recipient) {
      setError('This claim has no recipient email address on file.')
      setNotice(null)
      return
    }
    const subject = customReminderDraft.subject.trim()
    const bodyHtml = customReminderDraft.body || ''
    const body = bodyHtml.replace(/<br\s*\/?><\/p>|<p><br><\/p>/gi, '').trim()
    if (!subject || !body) {
      setError('Please provide both a subject and email body before sending the custom reminder.')
      setNotice(null)
      return
    }

    setError(null)
    setNotice(null)
    setCustomReminderSending(true)
    try {
      await sendCustomReminder({
        claim_id: detail.id,
        to_recipients: [recipient],
        subject,
        body,
        body_format: 'html',
        attachments: customReminderAttachments,
      })
      setNotice(`Custom reminder sent for claim ${detail.claim_no}`)
      setCustomReminderOpen(false)
      setCustomReminderDraft({ subject: '', body: '' })
      setCustomReminderAttachments([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send custom reminder')
    } finally {
      setCustomReminderSending(false)
    }
  }

  return (
    <>
    <div className="h-[calc(100vh-56px)] flex overflow-hidden bg-slate-50">
      {/* Left side: Claims table */}
      <div className={`${isDetailOpen ? 'w-[60%]' : 'w-full'} bg-white flex flex-col border-r border-slate-200`}>
        {/* Table toolbar */}
        <div className="relative z-30 p-4 flex flex-col gap-3 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          {/* Row 1: search + actions (stable width, never affected by filters/tab) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search claim no, policy, insured, type, description..."
                className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  title="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRefresh}
                title="Reload claims"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
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
                  <span className="hidden group-hover:inline">Cancel export</span>
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
              <button
                onClick={() => setIsDetailOpen(!isDetailOpen)}
                title={isDetailOpen ? 'Hide detail panel' : 'Show detail panel'}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {isDetailOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                {isDetailOpen ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>


        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-4 mb-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {notice && (
          <div className="mx-4 mb-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
            {notice}
          </div>
        )}
        {/* Table toolbar: filters only */}
        <div className="px-4">
          {/* Filter controls row */}
          <div className="flex items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <ColumnFilterDropdown label="Current PIC" options={picOptions} selected={picFilter} onChange={setPicFilter} variant="pill" loading={optionsLoading} />
              <ColumnFilterDropdown label="Current Status" options={currentStatusOptions} selected={currentStatusFilter} onChange={setCurrentStatusFilter} variant="pill" loading={optionsLoading} />
              <ColumnFilterDropdown label="Category" options={categoryOptions} selected={categoryFilter} onChange={setCategoryFilter} variant="pill" loading={optionsLoading} />
              <ColumnFilterDropdown label="Claim Type" options={claimTypeOptions} selected={claimTypeFilter} onChange={setClaimTypeFilter} variant="pill" loading={optionsLoading} />
              <select
                value={replyFilter}
                onChange={(e) => setReplyFilter(e.target.value as '' | 'true' | 'false')}
                className={`px-3 py-2 rounded-lg text-sm border ${replyFilter ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <option value="">All replies</option>
                <option value="false">Customer has replied</option>
                <option value="true">Customer has not replied</option>
              </select>
              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm border ${slaFilter ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <option value="">All SLA</option>
                {SLA_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${lossDateFilter ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                <span className="whitespace-nowrap">Loss Date</span>
                <input
                  type="date"
                  value={lossDateFilter}
                  onChange={(e) => setLossDateFilter(e.target.value)}
                  className="bg-transparent text-sm focus:outline-none"
                />
              </label>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {selectedClaimNos.size} selected
              </span>
              <button
                type="button"
                onClick={() => handleSendReminder('bank')}
                disabled={reminderSendingType !== null || selectedClaimNos.size === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send bank details reminder to selected claims"
              >
                {reminderSendingType === 'bank' && <Loader2 size={14} className="animate-spin" />}
                Bank Reminder
              </button>
              <button
                type="button"
                onClick={() => handleSendReminder('reissue')}
                disabled={reminderSendingType !== null || selectedClaimNos.size === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send payment reissue reminder to selected claims"
              >
                {reminderSendingType === 'reissue' && <Loader2 size={14} className="animate-spin" />}
                Reissue Reminder
              </button>
            </div>
          </div>

          {/* Active filter chips — only visible when filters are applied */}
          {(picFilter.length + currentStatusFilter.length + categoryFilter.length + claimTypeFilter.length + (replyFilter ? 1 : 0) + (slaFilter ? 1 : 0) + (lossDateFilter ? 1 : 0)) > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {picFilter.map((v) => (
                <span key={`pic-${v}`} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  PIC: {v}
                  <button type="button" onClick={() => setPicFilter(picFilter.filter((x) => x !== v))} className="hover:text-blue-900"><X size={10} /></button>
                </span>
              ))}
              {currentStatusFilter.map((v) => (
                <span key={`cs-${v}`} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  Status: {v}
                  <button type="button" onClick={() => setCurrentStatusFilter(currentStatusFilter.filter((x) => x !== v))} className="hover:text-blue-900"><X size={10} /></button>
                </span>
              ))}
              {categoryFilter.map((v) => (
                <span key={`cat-${v}`} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  Category: {v}
                  <button type="button" onClick={() => setCategoryFilter(categoryFilter.filter((x) => x !== v))} className="hover:text-blue-900"><X size={10} /></button>
                </span>
              ))}
              {claimTypeFilter.map((v) => (
                <span key={`claim-type-${v}`} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  Claim Type: {v}
                  <button type="button" onClick={() => setClaimTypeFilter(claimTypeFilter.filter((x) => x !== v))} className="hover:text-blue-900"><X size={10} /></button>
                </span>
              ))}
              {replyFilter && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  Reply: {replyFilter === 'true' ? 'Not replied' : 'Replied'}
                  <button type="button" onClick={() => setReplyFilter('')} className="hover:text-blue-900"><X size={10} /></button>
                </span>
              )}
              {slaFilter && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  SLA: {slaFilter}
                  <button type="button" onClick={() => setSlaFilter('')} className="hover:text-blue-900"><X size={10} /></button>
                </span>
              )}
              {lossDateFilter && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                  Loss Date: {lossDateFilter}
                  <button type="button" onClick={() => setLossDateFilter('')} className="hover:text-blue-900"><X size={10} /></button>
                </span>
              )}
              <button
                type="button"
                onClick={() => { setPicFilter([]); setCurrentStatusFilter([]); setCategoryFilter([]); setClaimTypeFilter([]); setReplyFilter(''); setSlaFilter(''); setLossDateFilter('') }}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 hover:underline whitespace-nowrap"
              >
                <X size={10} /> Clear all
              </button>
            </div>
          )}
        </div>
        <div className="mx-4 mt-2 mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_6px_24px_-20px_rgba(15,23,42,0.45)]">
          {/* Browser-style tabs attached to table */}
          <div className="flex items-end gap-0 px-3 pt-2 bg-white border-b border-slate-200 shrink-0">
            {/* Status tabs */}
            <div className="flex items-end gap-1 flex-1">
              {(['all', 'ACTIVE', 'REOPEN', 'CLOSED'] as const).map((tab) => {
                const count = tab === 'all' ? claims.length : statusCounts[tab]
                const shouldShowCount = tab !== 'all' && tab !== 'CLOSED' && count !== null
                const isActive = statusTab === tab
                return (
                  <button
                    key={tab}
                    onClick={() => setStatusTab(tab)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
                      isActive
                        ? 'bg-slate-50 text-blue-700 border-slate-200 relative z-10 -mb-px'
                        : 'bg-white text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <span>{tab === 'all' ? 'All' : tab}</span>
                    {shouldShowCount && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-300 text-slate-600'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Claims/Dates toggle + count — right-aligned, pinned to tab bar bottom */}
            <div className="flex items-center gap-2 pb-2">
              <div className="flex items-center rounded-lg border border-slate-300 overflow-hidden">
                <button
                  onClick={() => setActiveTableTab('claims')}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTableTab === 'claims' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Claims
                </button>
                <button
                  onClick={() => setActiveTableTab('dates')}
                  className={`px-3 py-1.5 text-xs font-medium border-l border-slate-300 transition-colors ${activeTableTab === 'dates' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Dates
                </button>
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                {claims.length} loaded{hasMore ? '' : ' · all'}
              </span>
            </div>
          </div>


          {/* Shared min width so the Claims and Dates tabs always render at the
              same table width (the wider Claims layout) instead of shifting. */}
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[1400px] text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="[&>th]:bg-slate-50 [&>th]:text-[11px] [&>th]:uppercase [&>th]:tracking-wider [&>th]:font-semibold [&>th]:text-slate-500 [&>th]:border-b [&>th]:border-slate-200 [&>th]:shadow-[0_1px_0_0_rgba(0,0,0,0.02)]">
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(e) => handleToggleSelectAllVisible(e.target.checked)}
                      className="accent-blue-600"
                      title="Select all visible claims"
                    />
                  </th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Index</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Claim No</th>
                  <th className="text-left px-3 py-2.5 whitespace-nowrap">Current PIC</th>
                  {activeTableTab === 'claims' ? (
                    <>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Policy No</th>
                      <th className="text-left px-3 py-2.5">Insured Name</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Reported By</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Status</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Current Status</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Reply</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Claim Type</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Flight</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Destination</th>
                      <th className="text-left px-3 py-2.5">Description</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Category</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Missing Doc</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">SLA Status</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Loss Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Registered Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Latest Tran Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Doc Request Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Doc Reminder 1 Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Doc Reminder 2 Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Doc Reminder 3 Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Bank Reminder 1 Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Bank Reminder 2 Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Bank Reminder 3 Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Completed Doc Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Assessment Complete Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Reject Letter Sent for Review</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Closed Date</th>
                      <th className="text-left px-3 py-2.5 whitespace-nowrap">Remark</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColSpan} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                      <Loader2 size={28} className="animate-spin text-blue-500" />
                      <span className="text-sm">Loading EDP claims…</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={visibleColSpan} className="py-16">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <Inbox size={36} strokeWidth={1.5} />
                      <span className="text-sm text-slate-500">No claims found.</span>
                      <span className="text-xs text-slate-400">Try adjusting your search or filters.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim, index) => {
                  const isSelected = selectedClaimNo === claim.claim_no
                  return (
                    <tr
                      key={claim.claim_no}
                      className={`group cursor-pointer transition-all [&>td]:border-b [&>td]:border-slate-100 ${
                        isSelected
                          ? 'bg-blue-50/80 [&>td]:border-blue-100 shadow-[inset_3px_0_0_0_rgba(37,99,235,0.85)]'
                          : 'odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/55'
                      }`}
                      onClick={() => {
                        setSelectedClaimNo(claim.claim_no)
                        setIsDetailOpen(true)
                      }}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedClaimNos.has(claim.claim_no)}
                          onChange={(e) => handleToggleClaimSelection(claim.claim_no, e.target.checked)}
                          className="accent-blue-600"
                          title={`Select ${claim.claim_no}`}
                        />
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap">{index + 1}</td>
                      <td className={`px-3 py-3 font-mono font-medium text-blue-600 group-hover:underline`}>
                        <span className="inline-flex items-center gap-1.5">
                          {claim.claim_no}
                          {claim.blacklisted && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-red-100 text-red-700 ring-1 ring-inset ring-red-200" title="Blacklisted claim">
                              Blacklisted
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 text-xs whitespace-nowrap">{claim.current_pic || '-'}</td>
                      {activeTableTab === 'claims' ? (
                        <>
                          <td className="px-3 py-2.5 text-slate-700">{claim.policy_no}</td>
                          <td className="px-3 py-2.5 text-slate-700 max-w-[200px] truncate" title={claim.insured_name}>
                            {claim.insured_name}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs">{claim.reported_by}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(claim.status)}`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700 text-xs whitespace-nowrap">{claim.current_status || '-'}</td>
                          <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                            {claim.last_reply_is_etiqa === false ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Customer has replied
                              </span>
                            ) : claim.last_reply_is_etiqa === true ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Customer has not replied
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Not found
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs">{claim.claim_type}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatFlight(claim.flight_no, claim.new_flight_no)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs">{claim.flight_destination?.trim() || '-'}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs max-w-[150px] truncate" title={claim.claim_desc}>
                            {claim.claim_desc}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs">{claim.category}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs max-w-[180px]" title={(claim.missing_doc ?? []).join(', ')}>
                            {(claim.missing_doc ?? []).length > 0 ? (
                              <div className="space-y-0.5">
                                {(claim.missing_doc ?? []).map((doc, index) => (
                                  <div key={`${claim.claim_no}-missing-${index}`} className="break-words">
                                    {doc}
                                  </div>
                                ))}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${slaBadgeClass(claim.sla_status)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${slaDotClass(claim.sla_status)}`} />
                                {claim.sla_status ?? 'N/A'}
                              </span>
                              <span className="text-slate-400 text-[11px]">{claim.sla_detail ?? '-'}</span>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.loss_date)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.registered_date)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.latest_tran_date)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.doc_request_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.doc_reminder_1_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.doc_reminder_2_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.doc_reminder_3_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.bank_reminder_1_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.bank_reminder_2_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.bank_reminder_3_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.completed_doc_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.assessment_complete_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.reject_letter_issue_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">{formatDate(claim.closed_date ?? undefined)}</td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs max-w-[220px] truncate" title={claim.remark ?? ''}>{claim.remark || '-'}</td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
              {/* Infinite-scroll sentinel + status row */}
              {!loading && filteredClaims.length > 0 && (
                <tr ref={sentinelRef}>
                  <td colSpan={visibleColSpan} className="text-center py-4 text-xs text-slate-400">
                    {loadingMore
                      ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin" />
                          Loading more…
                        </span>
                      )
                      : hasMore
                        ? 'Scroll to load more'
                        : '· End of results ·'}
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right side: Claim detail panel */}
      <div className={`w-[40%] bg-white flex flex-col border-l border-slate-200 overflow-hidden transition-all duration-300 ease-in-out ${
        isDetailOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
      }`}>
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Assessment Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">Assessors can update status, PIC, and document follow-up dates</p>
            </div>
            <button
              onClick={() => setIsDetailOpen(false)}
              title="Close panel"
              className="p-1.5 hover:bg-slate-200/70 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {!selectedClaimNo ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 p-6">
              <Inbox size={36} strokeWidth={1.5} />
              <p className="text-sm text-slate-500">Select a claim to view details.</p>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 p-6">
              <Loader2 size={26} className="animate-spin text-blue-500" />
              <p className="text-sm">Loading detail…</p>
            </div>
          ) : !detail ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm p-6">No detail available.</div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-4">
                {/* Claim overview */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide"><span className="w-1 h-3.5 rounded-full bg-blue-500" />Overview</h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs text-blue-600/80 mb-0.5">Claim No</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono font-semibold text-blue-800">{detail.claim_no}</p>
                        <div className="flex items-center gap-1.5">
                          {detail.blacklisted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 ring-1 ring-inset ring-red-200" title="Blacklisted claim">
                              Blacklisted
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(detail.status)}`}>
                            {detail.status}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${slaBadgeClass(detail.sla_status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${slaDotClass(detail.sla_status)}`} />
                            {detail.sla_status ?? 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-0.5">Insured Name</p>
                      <p className="font-semibold text-slate-800">{detail.insured_name}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-0.5">Email</p>
                      <p className="font-semibold text-slate-800 text-xs">{detail.email || '-'}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-0.5">Current PIC</p>
                      <p className="font-semibold text-slate-800">{detail.current_pic || '-'}</p>
                    </div>
                    {detail.current_status === 'Reject' && detail.previous_pic != null && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs text-amber-600 mb-0.5">Previous PIC</p>
                        <p className="font-semibold text-amber-800">{detail.previous_pic}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial summary */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide"><span className="w-1 h-3.5 rounded-full bg-emerald-500" />Financial</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-0.5">Net Paid</p>
                      <p className="font-semibold text-slate-800">{formatMoney(detail.net_paid)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-0.5">Net O/S</p>
                      <p className="font-semibold text-slate-800">{formatMoney(detail.net_os)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-0.5">Reserve Paid</p>
                      <p className="font-semibold text-slate-800">{formatMoney(detail.reserve_paid)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-0.5">Reserve O/S</p>
                      <p className="font-semibold text-slate-800">{formatMoney(detail.reserve_os)}</p>
                    </div>
                  </div>
                </div>

                {/* Editable fields for assessor */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide"><span className="w-1 h-3.5 rounded-full bg-indigo-500" />Assessment</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-600 font-medium">Current Status</label>
                      <select
                        value={(drafts[detail.claim_no]?.current_status
                          ?? detail.current_status
                          ?? detailStatusOptions[0]
                          ?? '') as EdpCurrentStatus}
                        onChange={(e) => handleDraftFieldChange(detail.claim_no, 'current_status', e.target.value as EdpCurrentStatus)}
                        className="w-full mt-1 px-2 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {detailStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-medium">Current PIC</label>
                      <div className="w-full mt-1 px-2 py-2 border border-slate-200 rounded text-sm bg-slate-50 text-slate-700">
                        {detail.current_pic || '-'}
                      </div>
                    </div>
                    {detail.current_status === 'Reject' && detail.previous_pic != null && (
                      <div>
                        <label className="text-xs text-amber-600 font-medium">Previous PIC</label>
                        <div className="w-full mt-1 px-2 py-2 border border-amber-200 rounded text-sm bg-amber-50 text-amber-800">
                          {detail.previous_pic}
                        </div>
                      </div>
                    )}
                    {(() => {
                      const r1Value = drafts[detail.claim_no]?.doc_reminder_1_date ?? normalizeDateInput(detail.doc_reminder_1_date)
                      const r2Value = drafts[detail.claim_no]?.doc_reminder_2_date ?? normalizeDateInput(detail.doc_reminder_2_date)
                      const r3Value = drafts[detail.claim_no]?.doc_reminder_3_date ?? normalizeDateInput(detail.doc_reminder_3_date)
                      const missingHint = (
                        <p className="mt-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                          Please fill in this reminder date.
                        </p>
                      )
                      return (
                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="text-xs text-slate-600 font-medium">Doc Request Date</label>
                            <input
                              type="date"
                              value={drafts[detail.claim_no]?.doc_request_date ?? normalizeDateInput(detail.doc_request_date)}
                              onChange={(e) => handleDraftFieldChange(detail.claim_no, 'doc_request_date', e.target.value)}
                              className="w-full mt-1 px-2 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 font-medium">Doc Reminder 1 Date</label>
                            <input
                              type="date"
                              value={r1Value}
                              onChange={(e) => handleDraftFieldChange(detail.claim_no, 'doc_reminder_1_date', e.target.value)}
                              className={`w-full mt-1 px-2 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${r1Value ? 'border-slate-300' : 'border-amber-400'}`}
                            />
                            {!r1Value && missingHint}
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 font-medium">Doc Reminder 2 Date</label>
                            <input
                              type="date"
                              value={r2Value}
                              onChange={(e) => handleDraftFieldChange(detail.claim_no, 'doc_reminder_2_date', e.target.value)}
                              className={`w-full mt-1 px-2 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${r2Value ? 'border-slate-300' : 'border-amber-400'}`}
                            />
                            {!r2Value && missingHint}
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 font-medium">Doc Reminder 3 Date</label>
                            <input
                              type="date"
                              value={r3Value}
                              onChange={(e) => handleDraftFieldChange(detail.claim_no, 'doc_reminder_3_date', e.target.value)}
                              className={`w-full mt-1 px-2 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${r3Value ? 'border-slate-300' : 'border-amber-400'}`}
                            />
                            {!r3Value && missingHint}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Workflow dates & remark (independent, no cascade) */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide"><span className="w-1 h-3.5 rounded-full bg-amber-500" />Workflow &amp; Closure</h3>
                  <p className="text-[11px] text-slate-500">
                    These fields are independent. Clearing a date stores NULL; clearing the remark stores an empty string.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-xs text-slate-600 font-medium">Completed Doc Date</label>
                      <input
                        type="date"
                        value={drafts[detail.claim_no]?.completed_doc_date ?? normalizeDateInput(detail.completed_doc_date)}
                        onChange={(e) => handleDraftFieldChange(detail.claim_no, 'completed_doc_date', e.target.value)}
                        className="w-full mt-1 px-2 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-medium">
                        Assessment Complete Date
                        {rejectNeedsAssessmentDate(detail.claim_no) && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        ref={assessmentDateRef}
                        type="date"
                        value={drafts[detail.claim_no]?.assessment_complete_date ?? normalizeDateInput(detail.assessment_complete_date)}
                        onChange={(e) => handleDraftFieldChange(detail.claim_no, 'assessment_complete_date', e.target.value)}
                        className={`w-full mt-1 px-2 py-2 border rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow ${rejectNeedsAssessmentDate(detail.claim_no) ? 'border-red-400' : 'border-slate-300'} ${highlightAssessmentDate ? 'ring-2 ring-red-500 border-red-500 animate-pulse' : ''}`}
                      />
                      {rejectNeedsAssessmentDate(detail.claim_no) && (
                        <p className="mt-1 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                          Required when the status is set to &quot;Reject&quot;.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-medium">Reject Letter Sent for Review</label>
                      <input
                        type="date"
                        value={drafts[detail.claim_no]?.reject_letter_issue_date ?? normalizeDateInput(detail.reject_letter_issue_date)}
                        onChange={(e) => handleDraftFieldChange(detail.claim_no, 'reject_letter_issue_date', e.target.value)}
                        className="w-full mt-1 px-2 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-medium">Closed Date</label>
                      <input
                        type="date"
                        value={drafts[detail.claim_no]?.closed_date ?? normalizeDateInput(detail.closed_date)}
                        onChange={(e) => handleDraftFieldChange(detail.claim_no, 'closed_date', e.target.value)}
                        className="w-full mt-1 px-2 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-medium">Remark</label>
                      <textarea
                        value={drafts[detail.claim_no]?.remark ?? detail.remark ?? ''}
                        onChange={(e) => handleDraftFieldChange(detail.claim_no, 'remark', e.target.value)}
                        placeholder="Internal note / comment"
                        rows={3}
                        className="w-full mt-1 px-2 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional info */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide"><span className="w-1 h-3.5 rounded-full bg-slate-400" />Details</h3>
                  <div className="text-xs space-y-1.5">
                    <div><span className="text-slate-600">Agent:</span> <span className="font-medium">{detail.agent_name} ({detail.agent_no})</span></div>
                    <div><span className="text-slate-600">Product:</span> <span className="font-medium">{detail.product_name}</span></div>
                    <div><span className="text-slate-600">Policy:</span> <span className="font-medium">{detail.policy_no}</span></div>
                    <div><span className="text-slate-600">Risk Type:</span> <span className="font-medium">{detail.rsktyp}</span></div>
                    <div><span className="text-slate-600">Category:</span> <span className="font-medium">{detail.category || '-'}</span></div>
                    <div><span className="text-slate-600">Status:</span> <span className="font-medium">{detail.status || '-'}</span></div>
                    <div><span className="text-slate-600">Claim Type:</span> <span className="font-medium">{detail.claim_type || '-'}</span></div>
                    <div><span className="text-slate-600">Flight:</span> <span className="font-medium">{formatFlight(detail.flight_no, detail.new_flight_no)}</span></div>
                    <div><span className="text-slate-600">Destination:</span> <span className="font-medium">{detail.flight_destination?.trim() || '-'}</span></div>
                    <div><span className="text-slate-600">Age From Registered:</span> <span className="font-medium">{formatAge(detail.age_from_registered_date)}</span></div>
                    <div><span className="text-slate-600">Age From Latest Tran:</span> <span className="font-medium">{formatAge(detail.age_from_latest_tran_date)}</span></div>
                    <div><span className="text-slate-600">Claim Description:</span> <span className="font-medium">{detail.claim_desc || '-'}</span></div>
                  </div>
                </div>

                <div ref={customReminderSectionRef} className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide"><span className="w-1 h-3.5 rounded-full bg-fuchsia-500" />Custom Reminder</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !customReminderOpen
                        setCustomReminderOpen(next)
                        setError(null)
                        setNotice(null)
                        if (next) {
                          window.setTimeout(() => {
                            customReminderSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
                          }, 50)
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 transition-colors"
                    >
                      {customReminderOpen ? 'Close' : 'Draft email'}
                    </button>
                  </div>
                  {customReminderOpen && (
                    <div className="space-y-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50/40 p-3">
                      <div>
                        <label className="text-xs text-slate-600 font-medium">Subject</label>
                        <input
                          type="text"
                          value={customReminderDraft.subject}
                          onChange={(e) => setCustomReminderDraft((prev) => ({ ...prev, subject: e.target.value }))}
                          placeholder="Reminder: supporting documents required"
                          className="w-full mt-1 px-2 py-2 border border-slate-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600 font-medium">Body</label>
                        <div className="mt-1 overflow-hidden rounded border border-slate-300 bg-white">
                          <ReactQuill
                            ref={quillRef}
                            theme="snow"
                            value={customReminderDraft.body}
                            onChange={(value) => setCustomReminderDraft((prev) => ({ ...prev, body: value }))}
                            modules={quillModules}
                            className="text-sm"
                            style={{ height: 320 }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-slate-600 font-medium">Attachments</label>
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">
                            <Paperclip size={13} />
                            Add files
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                handleAttachmentSelect(e.target.files)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                        {customReminderAttachments.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {customReminderAttachments.map((file, index) => (
                              <li
                                key={`${file.name}-${file.size}-${index}`}
                                className="flex items-center justify-between gap-2 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs"
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <Paperclip size={12} className="shrink-0 text-slate-400" />
                                  <span className="truncate text-slate-700">{file.name}</span>
                                  <span className="shrink-0 text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(index)}
                                  className="shrink-0 p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title="Remove attachment"
                                >
                                  <X size={13} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleSendCustomReminder}
                          disabled={customReminderSending}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {customReminderSending && <Loader2 size={14} className="animate-spin" />}
                          {customReminderSending ? 'Sending…' : 'Send custom reminder'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomReminderOpen(false)
                            setCustomReminderDraft({ subject: '', body: '' })
                            setCustomReminderAttachments([])
                          }}
                          className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {isDirty(detail.claim_no) && (
                  <div className="sticky bottom-0 -mx-4 -mb-4 px-4 py-3 bg-white/90 backdrop-blur border-t border-slate-200 flex gap-2 shadow-[0_-2px_8px_-4px_rgba(0,0,0,0.1)]">
                    <button
                      onClick={() => handleSave(detail.claim_no)}
                      disabled={saving[detail.claim_no] === true}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving[detail.claim_no] && <Loader2 size={14} className="animate-spin" />}
                      {saving[detail.claim_no] ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => handleResetDraft(detail.claim_no)}
                      className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Temporarily disabled: Send Reminder toast */}
    </>
  )
}
