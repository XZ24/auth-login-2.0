import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCcw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  EdpKpiPoolTotal,
  EdpKpiRow,
  EdpKpiStatus,
  EdpKpiSummary,
} from '../api'
import {
  loadKpiSummary,
  setKpiSummaryCache,
} from '../kpiCache'

const KPI_STATUS_COLORS: Record<string, { dot: string; pill: string; bar: string }> = {
  Green: {
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    bar: 'bg-emerald-500',
  },
  Amber: {
    dot: 'bg-amber-500',
    pill: 'bg-amber-100 text-amber-800 border border-amber-200',
    bar: 'bg-amber-500',
  },
  Red: {
    dot: 'bg-red-500',
    pill: 'bg-red-100 text-red-700 border border-red-200',
    bar: 'bg-red-500',
  },
}

function statusColors(status?: EdpKpiStatus) {
  if (!status) return KPI_STATUS_COLORS.Amber
  return KPI_STATUS_COLORS[status] ?? KPI_STATUS_COLORS.Amber
}

function complianceTextClass(status?: EdpKpiStatus): string {
  if (status === 'Green') return 'text-emerald-700'
  if (status === 'Red') return 'text-red-700'
  return 'text-amber-700'
}

function formatPct(value: number | undefined | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `${value.toFixed(1)}%`
}

function formatShare(count: number, total: number): string {
  if (total <= 0) return '0.0%'
  return formatPct((count / total) * 100)
}

interface StackedBarProps {
  withinSla: number
  nearBreach: number
  breach: number
  total: number
}

function StackedBar({ withinSla, nearBreach, breach, total }: StackedBarProps) {
  if (total <= 0) {
    return <div className="h-2 w-full bg-slate-100 rounded" />
  }
  const w = (n: number) => `${(n / total) * 100}%`
  return (
    <div className="flex h-2 w-full overflow-hidden rounded bg-slate-100">
      <div className="bg-emerald-500" style={{ width: w(withinSla) }} title={`Within SLA: ${withinSla}`} />
      <div className="bg-amber-500" style={{ width: w(nearBreach) }} title={`Near breach: ${nearBreach}`} />
      <div className="bg-red-500" style={{ width: w(breach) }} title={`Breach: ${breach}`} />
    </div>
  )
}

interface ComplianceGaugeProps {
  pct: number
  withinSla: number
  nearBreach: number
  breach: number
}

// SVG donut broken into three arcs (within SLA / near breach / breached) sized
// by their share of the total, with the compliance % shown in the centre.
function ComplianceGauge({ pct, withinSla, nearBreach, breach }: ComplianceGaugeProps) {
  const clamped = Math.max(0, Math.min(100, pct))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const total = withinSla + nearBreach + breach
  const segments = [
    { value: withinSla, color: '#10b981' }, // green - within SLA
    { value: nearBreach, color: '#f59e0b' }, // amber - near breach
    { value: breach, color: '#ef4444' }, // red - breached
  ]
  let offset = 0
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} stroke="#e2e8f0" strokeWidth="12" fill="none" />
        {total > 0 &&
          segments.map((seg, i) => {
            if (seg.value <= 0) return null
            const len = (seg.value / total) * circumference
            const dashOffset = -offset
            offset += len
            return (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={radius}
                stroke={seg.color}
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 60 60)"
              />
            )
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-slate-800">{clamped.toFixed(1)}%</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Compliance</span>
      </div>
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: string | number
  hint?: string
  icon: React.ReactNode
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'info' | 'ontrack' | 'crit'
}

function SummaryCard({ label, value, hint, icon, tone = 'default' }: SummaryCardProps) {
  const toneMap: Record<string, string> = {
    default: 'bg-white border-slate-200 text-slate-800',
    good: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    bad: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    ontrack: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    crit: 'bg-rose-50 border-rose-200 text-rose-700',
  }
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${toneMap[tone]}`}>
      <div className="p-2 rounded-lg bg-white/60 border border-white/40 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        {hint && <p className="text-xs opacity-70 mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}

interface PoolCardProps {
  pool: EdpKpiPoolTotal
  slaRuleLabel?: string
}

function PoolCard({ pool, slaRuleLabel }: PoolCardProps) {
  const colors = statusColors(pool.kpi_status)
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{pool.pool}</h4>
          {slaRuleLabel && <p className="text-[11px] text-slate-500 mt-0.5">{slaRuleLabel}</p>}
        </div>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${colors.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          {pool.kpi_status}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Compliance</p>
          <p className="text-2xl font-semibold text-slate-800">{formatPct(pool.compliance_pct)}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Assigned</p>
          <p className="text-lg font-semibold text-slate-800">{pool.total_assigned}</p>
        </div>
      </div>

      <StackedBar
        withinSla={pool.within_sla}
        nearBreach={pool.near_breach}
        breach={pool.breach}
        total={pool.total_assigned}
      />

      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded bg-emerald-50 text-emerald-700 py-1">
          <p className="font-semibold">{pool.within_sla}</p>
          <p className="opacity-75">Within</p>
        </div>
        <div className="rounded bg-amber-50 text-amber-700 py-1">
          <p className="font-semibold">{pool.near_breach}</p>
          <p className="opacity-75">Near</p>
        </div>
        <div className="rounded bg-red-50 text-red-700 py-1">
          <p className="font-semibold">{pool.breach}</p>
          <p className="opacity-75">Breach</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>Pending: <span className="font-medium text-slate-700">{pool.pending}</span></span>
        <span>Closed: <span className="font-medium text-slate-700">{pool.closed}</span></span>
        <span>Breach %: <span className="font-medium text-slate-700">{formatPct(pool.breach_pct)}</span></span>
      </div>
    </div>
  )
}

type SortKey = 'staff' | 'pool' | 'total_assigned' | 'compliance_pct' | 'breach' | 'pending'

const KPI_POOL_OPTIONS = [
  'Fast Track',
  'Fast Track (pending)',
  'Complex',
  'Complex (pending)',
  'Agency (Fast Track)',
  'Agency (Complex)',
  'Agency (pending)',
  'Appeal',
  'Reject',
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_GRAND_TOTAL = {
  total_assigned: 0,
  pending: 0,
  closed: 0,
  within_sla: 0,
  near_breach: 0,
  breach: 0,
  compliance_pct: 0,
  breach_pct: 0,
}

// API may omit arrays / grand_total when there is no data. Coerce to safe shape
// so downstream code can rely on arrays/objects always existing. If
// totals_by_pool is missing/empty but rows are present, synthesize it by
// grouping rows by pool so the per-pool visualizations still work.
function normalizeSummary(data: EdpKpiSummary | null | undefined): EdpKpiSummary {
  const rows = Array.isArray(data?.rows) ? data!.rows : []
  let totals_by_pool = Array.isArray(data?.totals_by_pool) ? data!.totals_by_pool : []
  if (totals_by_pool.length === 0 && rows.length > 0) {
    const groups = new Map<string, EdpKpiRow[]>()
    for (const r of rows) {
      const key = r.pool || 'Unassigned'
      const arr = groups.get(key) ?? []
      arr.push(r)
      groups.set(key, arr)
    }
    totals_by_pool = Array.from(groups.entries()).map(([poolName, poolRows]) => {
      const totals = aggregateTotals(poolRows)
      const kpi_status: EdpKpiStatus = totals.compliance_pct >= 90
        ? 'Green'
        : totals.compliance_pct >= 75
          ? 'Amber'
          : 'Red'
      return { pool: poolName, ...totals, kpi_status }
    })
  }
  return {
    as_of: data?.as_of ?? null,
    from_date: data?.from_date ?? null,
    to_date: data?.to_date ?? null,
    pool: data?.pool ?? null,
    sla_rules: data?.sla_rules ?? {},
    rows,
    totals_by_pool,
    grand_total: data?.grand_total
      ? { ...EMPTY_GRAND_TOTAL, ...data.grand_total }
      : aggregateTotals(totals_by_pool.length > 0 ? totals_by_pool : rows),
  }
}

// Sum numeric KPI fields across an arbitrary list of rows/pool-totals and
// recompute compliance / breach percentages. Used when the user selects a
// single pool: we want grand_total to reflect only that pool, without
// re-fetching from the server.
function aggregateTotals(items: Array<{
  total_assigned: number
  pending: number
  closed: number
  within_sla: number
  near_breach: number
  breach: number
}>): typeof EMPTY_GRAND_TOTAL {
  const acc = { ...EMPTY_GRAND_TOTAL }
  for (const it of items) {
    acc.total_assigned += it.total_assigned
    acc.pending += it.pending
    acc.closed += it.closed
    acc.within_sla += it.within_sla
    acc.near_breach += it.near_breach
    acc.breach += it.breach
  }
  acc.compliance_pct = acc.total_assigned > 0 ? (acc.within_sla / acc.total_assigned) * 100 : 0
  acc.breach_pct = acc.total_assigned > 0 ? (acc.breach / acc.total_assigned) * 100 : 0
  return acc
}

export function EdpKpiDashboard() {
  const todayStr = todayIso()
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>(todayStr)
  const [pool, setPool] = useState<string>('')
  const [asOf] = useState<string>('')
  const [summary, setSummary] = useState<EdpKpiSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('compliance_pct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [statusFilter, setStatusFilter] = useState<EdpKpiStatus | ''>('')

  const buildParams = (
    next: Partial<{ fromDate: string; toDate: string; asOf: string; pool: string }> = {},
  ) => {
    const nextFromDate = next.fromDate ?? fromDate
    const nextToDate = next.toDate ?? toDate
    const nextAsOf = next.asOf ?? asOf
    const nextPool = next.pool ?? pool
    return {
      ...(nextFromDate ? { from_date: nextFromDate } : {}),
      ...(nextToDate ? { to_date: nextToDate } : {}),
      ...(nextAsOf ? { as_of: nextAsOf } : {}),
      ...(nextPool ? { pool: nextPool } : {}),
    }
  }

  const load = (
    force = false,
    next: Partial<{ fromDate: string; toDate: string; asOf: string; pool: string }> = {},
  ) => {
    const params = buildParams(next)
    setLoading(true)
    setError(null)
    if (force) setKpiSummaryCache(null)
    loadKpiSummary(force, params)
      .then((data) => setSummary(normalizeSummary(data)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load KPI summary'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredRows = useMemo(() => {
    if (!summary) return [] as EdpKpiRow[]
    let rows = summary.rows.slice()
    if (statusFilter) rows = rows.filter((r) => r.kpi_status === statusFilter)
    rows.sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return rows
  }, [summary, sortKey, sortDir, statusFilter])

  const grand = summary?.grand_total
  const totalsByPool = summary?.totals_by_pool ?? []
  const totalAssigned = grand?.total_assigned ?? 0
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Green: 0, Amber: 0, Red: 0 }
    summary?.rows.forEach((r) => {
      counts[r.kpi_status] = (counts[r.kpi_status] ?? 0) + 1
    })
    return counts
  }, [summary])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'staff' || key === 'pool' ? 'asc' : 'desc')
    }
  }

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? '↑' : '↓') : '')

  return (
    <div className="h-[calc(100vh-56px)] overflow-auto bg-slate-50">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">EDP Staff KPI Monitoring</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manager view of per-staff SLA performance across claim pools.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-500 mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                max={toDate || todayStr}
                onChange={(e) => {
                  const next = e.target.value
                  setFromDate(next)
                  load(false, { fromDate: next })
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-500 mb-1">To</label>
              <input
                type="date"
                value={toDate}
                min={fromDate}
                max={todayStr}
                onChange={(e) => {
                  const next = e.target.value
                  setToDate(next)
                  load(false, { toDate: next })
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] text-slate-500 mb-1">Pool</label>
              <select
                value={pool}
                onChange={(e) => {
                  const next = e.target.value
                  setPool(next)
                  load(false, { pool: next })
                }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All pools</option>
                {KPI_POOL_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => load(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && !summary ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading KPI summary...</div>
        ) : !summary ? (
          <div className="py-20 text-center text-slate-500 text-sm">No data available.</div>
        ) : (
          <>
            {/* Grand-total summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <SummaryCard
                label="Total Assigned"
                value={grand?.total_assigned ?? 0}
                icon={<Users size={18} className="text-slate-700" />}
                hint={`${summary.rows.length} staff`}
              />
              <SummaryCard
                label="Pending"
                value={grand?.pending ?? 0}
                tone="info"
                icon={<Clock size={18} className="text-blue-700" />}
                hint={`${formatShare(grand?.pending ?? 0, totalAssigned)} of assigned`}
              />
              <SummaryCard
                label="Closed"
                value={grand?.closed ?? 0}
                tone="good"
                icon={<CheckCircle2 size={18} className="text-emerald-700" />}
                hint={`${formatShare(grand?.closed ?? 0, totalAssigned)} of assigned`}
              />
              <SummaryCard
                label="Compliance"
                value={formatPct(grand?.compliance_pct ?? 0)}
                tone="good"
                icon={<Target size={18} className="text-slate-700" />}
                hint={`${grand?.within_sla ?? 0} within SLA`}
              />
              <SummaryCard
                label="Near Breach"
                tone="warn"
                icon={<TrendingUp size={18} className="text-amber-700" />}
                value={formatShare(grand?.near_breach ?? 0, totalAssigned)}
                hint={`${grand?.near_breach ?? 0} claims`}
              />
              <SummaryCard
                label="Breached"
                tone="bad"
                icon={<TrendingDown size={18} className="text-red-700" />}
                value={formatShare(grand?.breach ?? 0, totalAssigned)}
                hint={`${grand?.breach ?? 0} claims`}
              />
            </div>

            {/* Overall row: gauge + staff status mix + pool stacked breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-center justify-center">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide self-start mb-2">
                  Overall Compliance
                </h3>
                <ComplianceGauge
                  pct={grand?.compliance_pct ?? 0}
                  withinSla={grand?.within_sla ?? 0}
                  nearBreach={grand?.near_breach ?? 0}
                  breach={grand?.breach ?? 0}
                />
                <div className="flex gap-4 mt-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Within {grand?.within_sla ?? 0}</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Near {grand?.near_breach ?? 0}</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Breach {grand?.breach ?? 0}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Staff KPI Status
                </h3>
                <div className="space-y-3">
                  {(['Green', 'Amber', 'Red'] as EdpKpiStatus[]).map((s) => {
                    const count = statusCounts[s] ?? 0
                    const total = summary.rows.length || 1
                    const pct = (count / total) * 100
                    const colors = statusColors(s)
                    return (
                      <div key={s}>
                        <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                            {s}
                          </span>
                          <span className="font-medium">{count} staff · {pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded overflow-hidden">
                          <div className={`h-full ${colors.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                {statusCounts.Red > 0 && (
                  <div className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <span>{statusCounts.Red} staff in <strong>Red</strong> — review required.</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Pool Distribution
                </h3>
                <div className="space-y-3">
                  {totalsByPool.map((p) => (
                    <div key={p.pool}>
                      <div className="flex items-center justify-between text-xs text-slate-700 mb-1">
                        <span className="font-medium">{p.pool}</span>
                        <span className="text-slate-500">{p.total_assigned} assigned · {formatPct(p.compliance_pct)}</span>
                      </div>
                      <StackedBar
                        withinSla={p.within_sla}
                        nearBreach={p.near_breach}
                        breach={p.breach}
                        total={p.total_assigned}
                      />
                    </div>
                  ))}
                  {totalsByPool.length === 0 && (
                    <p className="text-xs text-slate-500">No pool data.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Per-pool cards */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Pools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {totalsByPool.map((p) => {
                  const rule = summary.sla_rules[p.pool]
                  const label = rule
                    ? `SLA: ${rule.limit} ${rule.mode === 'working' ? 'working' : 'calendar'} days`
                    : undefined
                  return <PoolCard key={p.pool} pool={p} slaRuleLabel={label} />
                })}
                {totalsByPool.length === 0 && (
                  <p className="text-sm text-slate-500 col-span-full">No pools to display.</p>
                )}
              </div>
            </div>

            {/* Staff workload bar chart - grouped by staff with pools nested */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800">Staff Workload &amp; SLA Mix</h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Within SLA</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Near breach</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Breach</span>
                </div>
              </div>
              <div className="space-y-4">
                {filteredRows.length === 0 ? (
                  <p className="text-sm text-slate-500">No staff rows match the current filters.</p>
                ) : (
                  (() => {
                    // Group rows by staff name
                    const staffGroups = new Map<string, typeof filteredRows>()
                    for (const row of filteredRows) {
                      const key = row.staff
                      if (!staffGroups.has(key)) staffGroups.set(key, [])
                      staffGroups.get(key)!.push(row)
                    }

                    // Calculate totals per staff member
                    const staffTotals = new Map<string, {
                      total_assigned: number
                      within_sla: number
                      near_breach: number
                      breach: number
                      compliance_pct: number
                    }>()

                    for (const [staffName, rows] of staffGroups.entries()) {
                      const totals = {
                        total_assigned: 0,
                        within_sla: 0,
                        near_breach: 0,
                        breach: 0,
                        compliance_pct: 0,
                      }
                      for (const row of rows) {
                        totals.total_assigned += row.total_assigned
                        totals.within_sla += row.within_sla
                        totals.near_breach += row.near_breach
                        totals.breach += row.breach
                      }
                      totals.compliance_pct =
                        totals.total_assigned > 0
                          ? (totals.within_sla / totals.total_assigned) * 100
                          : 0
                      staffTotals.set(staffName, totals)
                    }

                    // Render grouped staff
                    return Array.from(staffGroups.entries()).map(([staffName, staffRows]) => {
                      const staffTotal = staffTotals.get(staffName)!
                      return (
                        <div key={staffName} className="border border-slate-200 rounded-lg overflow-hidden">
                          {/* Staff header with overall compliance */}
                          <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200">
                            <div>
                              <h4 className="text-sm font-semibold text-slate-800">{staffName}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Compliance</p>
                                <p className={`text-lg font-semibold ${complianceTextClass(
                                  staffTotal.compliance_pct >= 90
                                    ? 'Green'
                                    : staffTotal.compliance_pct >= 75
                                      ? 'Amber'
                                      : 'Red'
                                )}`}>
                                  {formatPct(staffTotal.compliance_pct)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Total</p>
                                <p className="text-lg font-semibold text-slate-800">{staffTotal.total_assigned}</p>
                              </div>
                            </div>
                          </div>

                          {/* Pool rows for this staff */}
                          <div className="divide-y divide-slate-200">
                            {staffRows.map((row) => {
                              return (
                                <div key={`${row.staff}-${row.pool}`} className="px-4 py-3 grid grid-cols-12 items-center gap-3">
                                  <div className="col-span-2 min-w-0">
                                    <p className="text-sm text-slate-600">{row.pool}</p>
                                  </div>
                                  <div className="col-span-7">
                                    <div className="flex items-center gap-2">
                                      <div className="h-5 w-full min-w-[100px] bg-slate-100 rounded overflow-hidden">
                                        <div className="flex h-full w-full">
                                          {row.total_assigned > 0 ? (
                                            <>
                                              <div className="bg-emerald-500" style={{ width: `${(row.within_sla / row.total_assigned) * 100}%` }} title={`Within SLA: ${row.within_sla}`} />
                                              <div className="bg-amber-500" style={{ width: `${(row.near_breach / row.total_assigned) * 100}%` }} title={`Near breach: ${row.near_breach}`} />
                                              <div className="bg-red-500" style={{ width: `${(row.breach / row.total_assigned) * 100}%` }} title={`Breach: ${row.breach}`} />
                                            </>
                                          ) : null}
                                        </div>
                                      </div>
                                      <span className="w-8 text-xs font-medium text-slate-900 text-left tabular-nums">
                                        {row.total_assigned}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="col-span-3 flex items-center justify-end gap-2">
                                    <span className="text-xs w-12 text-right font-semibold text-slate-800">
                                      {formatPct(row.compliance_pct)}
                                    </span>
                                    <span className="text-xs text-slate-600 w-16 text-right">{row.within_sla}/{row.total_assigned} claims</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })
                  })()
                )}
              </div>
            </div>

            {/* Detailed staff KPI table */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Per-Staff KPI</h3>
                  <p className="text-[11px] text-slate-500">Click a column header to sort.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Filter status:</span>
                  {(['', 'Green', 'Amber', 'Red'] as const).map((s) => {
                    const active = statusFilter === s
                    const label = s === '' ? 'All' : s
                    const base = 'px-2.5 py-1 rounded-full text-[11px] border'
                    const styling = active
                      ? s === ''
                        ? 'bg-slate-800 text-white border-slate-800'
                        : `${statusColors(s as EdpKpiStatus).pill} ring-2 ring-offset-1 ring-current/30`
                      : s === ''
                        ? 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                        : `${statusColors(s as EdpKpiStatus).pill} opacity-70 hover:opacity-100`
                    return (
                      <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`${base} ${styling}`}>
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr className="text-left">
                      <th onClick={() => handleSort('staff')} className="px-3 py-2 font-semibold cursor-pointer whitespace-nowrap">Staff {sortIndicator('staff')}</th>
                      <th onClick={() => handleSort('pool')} className="px-3 py-2 font-semibold cursor-pointer whitespace-nowrap">Pool {sortIndicator('pool')}</th>
                      <th onClick={() => handleSort('total_assigned')} className="px-3 py-2 font-semibold cursor-pointer whitespace-nowrap text-right">Assigned {sortIndicator('total_assigned')}</th>
                      <th onClick={() => handleSort('pending')} className="px-3 py-2 font-semibold cursor-pointer whitespace-nowrap text-right">Pending {sortIndicator('pending')}</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Closed</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Within</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Near</th>
                      <th onClick={() => handleSort('breach')} className="px-3 py-2 font-semibold cursor-pointer whitespace-nowrap text-right">Breach {sortIndicator('breach')}</th>
                      <th onClick={() => handleSort('compliance_pct')} className="px-3 py-2 font-semibold cursor-pointer whitespace-nowrap text-right">Compliance {sortIndicator('compliance_pct')}</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Breach %</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">KPI</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center py-6 text-slate-500 text-sm">No staff rows.</td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const colors = statusColors(row.kpi_status)
                        return (
                          <tr key={`${row.staff}-${row.pool}`} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{row.staff}</td>
                            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{row.pool}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.total_assigned}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.pending}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.closed}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{row.within_sla}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-amber-700">{row.near_breach}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-red-700">{row.breach}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatPct(row.compliance_pct)}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{formatPct(row.breach_pct)}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${colors.pill}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                {row.kpi_status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-600">{row.action_required ?? '-'}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SLA rules legend */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">SLA Rules</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(summary.sla_rules).map(([name, rule]) => (
                  <span key={name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    <strong>{name}</strong>
                    <span className="text-slate-500">{rule.limit} {rule.mode === 'working' ? 'working' : 'calendar'} days</span>
                  </span>
                ))}
                {Object.keys(summary.sla_rules).length === 0 && (
                  <span className="text-slate-500">No SLA rules returned.</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Period: {(summary.from_date ?? fromDate) || 'Beginning'} to {summary.to_date ?? toDate}{summary.pool ? ` · Pool: ${summary.pool}` : ''}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
