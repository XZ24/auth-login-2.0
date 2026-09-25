import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, FilePlus2, RefreshCcw, TrendingUp } from 'lucide-react'
import { EdpKpiDaily, EdpKpiDailyRow } from '../api'
import {
  getKpiDailyCache,
  loadKpiDaily,
  setKpiDailyCache,
  subscribeKpiDailyCache,
} from '../kpiCache'

function fmtShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-MY', { month: 'short', day: '2-digit' })
}

function fmtLong(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-MY', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' })
}

function isWeekend(iso: string): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const w = d.getDay()
  return w === 0 || w === 6
}

type SeriesKey = 'new_registered' | 'closed' | 'sla_breach'

interface SeriesMeta {
  key: SeriesKey
  label: string
  stroke: string
  fill: string
  dot: string
}

const SERIES: SeriesMeta[] = [
  { key: 'new_registered', label: 'New Registered', stroke: '#2563eb', fill: 'rgba(37,99,235,0.12)', dot: 'bg-blue-600' },
  { key: 'closed', label: 'Closed', stroke: '#10b981', fill: 'rgba(16,185,129,0.12)', dot: 'bg-emerald-500' },
  { key: 'sla_breach', label: 'SLA Breach', stroke: '#ef4444', fill: 'rgba(239,68,68,0.12)', dot: 'bg-red-500' },
]

function normalizeDaily(data: EdpKpiDaily | null | undefined): EdpKpiDaily {
  return {
    days: data?.days ?? 0,
    end_date: data?.end_date ?? null,
    rows: Array.isArray(data?.rows) ? data!.rows : [],
  }
}

interface LineChartProps {
  rows: EdpKpiDailyRow[]
  visible: Record<SeriesKey, boolean>
  hoverIndex: number | null
  onHover: (i: number | null) => void
}

function LineChart({ rows, visible, hoverIndex, onHover }: LineChartProps) {
  const width = 960
  const height = 280
  const padding = { top: 16, right: 16, bottom: 28, left: 36 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const n = rows.length
  const maxVal = useMemo(() => {
    let m = 0
    for (const r of rows) {
      if (visible.new_registered) m = Math.max(m, r.new_registered)
      if (visible.closed) m = Math.max(m, r.closed)
      if (visible.sla_breach) m = Math.max(m, r.sla_breach)
    }
    return Math.max(m, 1)
  }, [rows, visible])

  // Round max to a nice ceiling for the Y axis.
  const niceMax = useMemo(() => {
    const pow = Math.pow(10, Math.floor(Math.log10(maxVal)))
    const r = maxVal / pow
    const factor = r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10
    return factor * pow
  }, [maxVal])

  const xAt = (i: number) => (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW) + padding.left
  const yAt = (v: number) => padding.top + innerH - (v / niceMax) * innerH

  const pathFor = (key: SeriesKey) => {
    if (!rows.length) return ''
    return rows
      .map((r, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(r[key]).toFixed(2)}`)
      .join(' ')
  }

  const areaFor = (key: SeriesKey) => {
    if (!rows.length) return ''
    const top = rows.map((r, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(r[key]).toFixed(2)}`).join(' ')
    const bottom = `L ${xAt(rows.length - 1).toFixed(2)} ${yAt(0).toFixed(2)} L ${xAt(0).toFixed(2)} ${yAt(0).toFixed(2)} Z`
    return `${top} ${bottom}`
  }

  // Y gridlines (5 segments).
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    value: Math.round(niceMax * p),
    y: yAt(niceMax * p),
  }))

  // X tick stride: aim for ~8 labels.
  const xStride = Math.max(1, Math.ceil(n / 8))

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[280px]"
        onMouseLeave={() => onHover(null)}
      >
        {/* Y grid + labels */}
        {yTicks.map((t, i) => (
          <g key={`y-${i}`}>
            <line
              x1={padding.left}
              x2={padding.left + innerW}
              y1={t.y}
              y2={t.y}
              stroke="#e2e8f0"
              strokeDasharray={i === 0 ? '' : '3 3'}
            />
            <text
              x={padding.left - 6}
              y={t.y + 3}
              fontSize="10"
              fill="#64748b"
              textAnchor="end"
            >
              {t.value}
            </text>
          </g>
        ))}

        {/* Weekend shading */}
        {rows.map((r, i) => {
          if (!isWeekend(r.date)) return null
          const x0 = i === 0 ? padding.left : (xAt(i - 1) + xAt(i)) / 2
          const x1 = i === n - 1 ? padding.left + innerW : (xAt(i) + xAt(i + 1)) / 2
          return (
            <rect
              key={`wk-${r.date}`}
              x={x0}
              y={padding.top}
              width={Math.max(0, x1 - x0)}
              height={innerH}
              fill="#f1f5f9"
              opacity={0.6}
            />
          )
        })}

        {/* Areas */}
        {SERIES.map((s) =>
          visible[s.key] ? (
            <path key={`a-${s.key}`} d={areaFor(s.key)} fill={s.fill} stroke="none" />
          ) : null,
        )}

        {/* Lines */}
        {SERIES.map((s) =>
          visible[s.key] ? (
            <path
              key={`l-${s.key}`}
              d={pathFor(s.key)}
              fill="none"
              stroke={s.stroke}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null,
        )}

        {/* Hover guide + dots */}
        {hoverIndex !== null && rows[hoverIndex] && (
          <g>
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={padding.top}
              y2={padding.top + innerH}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />
            {SERIES.map((s) =>
              visible[s.key] ? (
                <circle
                  key={`d-${s.key}`}
                  cx={xAt(hoverIndex)}
                  cy={yAt(rows[hoverIndex][s.key])}
                  r={4}
                  fill="white"
                  stroke={s.stroke}
                  strokeWidth={2}
                />
              ) : null,
            )}
          </g>
        )}

        {/* X labels */}
        {rows.map((r, i) =>
          i % xStride === 0 || i === n - 1 ? (
            <text
              key={`x-${r.date}`}
              x={xAt(i)}
              y={padding.top + innerH + 16}
              fontSize="10"
              fill="#64748b"
              textAnchor="middle"
            >
              {fmtShort(r.date)}
            </text>
          ) : null,
        )}

        {/* Hover capture rects (full height per data point) */}
        {rows.map((_, i) => {
          const x0 = i === 0 ? padding.left : (xAt(i - 1) + xAt(i)) / 2
          const x1 = i === n - 1 ? padding.left + innerW : (xAt(i) + xAt(i + 1)) / 2
          return (
            <rect
              key={`h-${i}`}
              x={x0}
              y={padding.top}
              width={Math.max(1, x1 - x0)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => onHover(i)}
            />
          )
        })}
      </svg>
    </div>
  )
}

interface SummaryCardProps {
  label: string
  value: number
  hint?: string
  icon: React.ReactNode
  tone?: 'default' | 'good' | 'warn' | 'bad' | 'info'
}

function SummaryCard({ label, value, hint, icon, tone = 'default' }: SummaryCardProps) {
  const toneMap: Record<string, string> = {
    default: 'bg-white border-slate-200 text-slate-800',
    good: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warn: 'bg-amber-50 border-amber-200 text-amber-800',
    bad: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }
  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${toneMap[tone]}`}>
      <div className="p-2 rounded-lg bg-white/60 border border-white/40 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
        <p className="text-2xl font-semibold leading-tight">{value.toLocaleString()}</p>
        {hint && <p className="text-xs opacity-70 mt-0.5">{hint}</p>}
      </div>
    </div>
  )
}

export function EdpKpiDailyTrend() {
  // Fixed window: last 30 days ending today. Sourced from a module-level
  // cache so switching views doesn't re-trigger the (slow) API call.
  const [daily, setDaily] = useState<EdpKpiDaily | null>(() => {
    const c = getKpiDailyCache()
    return c ? normalizeDaily(c) : null
  })
  const [loading, setLoading] = useState(() => getKpiDailyCache() === null)
  const [error, setError] = useState<string | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    new_registered: true,
    closed: true,
    sla_breach: true,
  })

  const load = (force = false) => {
    setLoading(true)
    setError(null)
    if (force) setKpiDailyCache(null)
    loadKpiDaily(force)
      .then((data) => setDaily(normalizeDaily(data)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load daily trend'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const unsub = subscribeKpiDailyCache(() => {
      const c = getKpiDailyCache()
      if (c) {
        setDaily(normalizeDaily(c))
        setLoading(false)
      }
    })
    if (!getKpiDailyCache()) {
      load()
    }
    return () => {
      unsub()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rows = daily?.rows ?? []

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.new_registered += r.new_registered
        acc.closed += r.closed
        acc.sla_breach += r.sla_breach
        return acc
      },
      { new_registered: 0, closed: 0, sla_breach: 0 },
    )
  }, [rows])

  const averages = useMemo(() => {
    const n = rows.length || 1
    return {
      new_registered: totals.new_registered / n,
      closed: totals.closed / n,
      sla_breach: totals.sla_breach / n,
    }
  }, [rows.length, totals])

  const peaks = useMemo(() => {
    let peakNew: EdpKpiDailyRow | null = null
    let peakBreach: EdpKpiDailyRow | null = null
    for (const r of rows) {
      if (!peakNew || r.new_registered > peakNew.new_registered) peakNew = r
      if (!peakBreach || r.sla_breach > peakBreach.sla_breach) peakBreach = r
    }
    return { peakNew, peakBreach }
  }, [rows])

  const hovered = hoverIndex !== null ? rows[hoverIndex] : null

  const toggleSeries = (key: SeriesKey) => {
    setVisible((v) => ({ ...v, [key]: !v[key] }))
  }

  return (
    <div className="h-[calc(100vh-56px)] overflow-auto bg-slate-50">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">EDP Daily Trending</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Last 30 days ending today — new registrations, closures, and SLA breaches. Weekends shaded for context.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
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

        {loading && !daily ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading daily trend...</div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">No data for the selected window.</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <SummaryCard
                label="New Registered"
                value={totals.new_registered}
                hint={`Avg ${averages.new_registered.toFixed(1)}/day`}
                icon={<FilePlus2 size={18} className="text-blue-700" />}
                tone="info"
              />
              <SummaryCard
                label="Closed"
                value={totals.closed}
                hint={`Avg ${averages.closed.toFixed(1)}/day`}
                icon={<CheckCircle2 size={18} className="text-emerald-700" />}
                tone="good"
              />
              <SummaryCard
                label="SLA Breaches"
                value={totals.sla_breach}
                hint={`Avg ${averages.sla_breach.toFixed(1)}/day`}
                icon={<AlertTriangle size={18} className="text-red-700" />}
                tone="bad"
              />
              <SummaryCard
                label="Net Pending Δ"
                value={totals.new_registered - totals.closed}
                hint={totals.new_registered - totals.closed >= 0 ? 'Backlog growing' : 'Backlog shrinking'}
                icon={<TrendingUp size={18} className="text-slate-700" />}
                tone={totals.new_registered - totals.closed > 0 ? 'warn' : 'good'}
              />
              <SummaryCard
                label="Peak Registered"
                value={peaks.peakNew?.new_registered ?? 0}
                hint={peaks.peakNew ? fmtShort(peaks.peakNew.date) : undefined}
                icon={<FilePlus2 size={18} className="text-blue-700" />}
              />
              <SummaryCard
                label="Peak Breach"
                value={peaks.peakBreach?.sla_breach ?? 0}
                hint={peaks.peakBreach ? fmtShort(peaks.peakBreach.date) : undefined}
                icon={<AlertTriangle size={18} className="text-red-700" />}
                tone={peaks.peakBreach && peaks.peakBreach.sla_breach > 0 ? 'bad' : 'default'}
              />
            </div>

            {/* Trend chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Daily Trend</h3>
                  <p className="text-[11px] text-slate-500">
                    {rows.length} day{rows.length === 1 ? '' : 's'} · {rows[0].date} → {rows[rows.length - 1].date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {SERIES.map((s) => {
                    const on = visible[s.key]
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleSeries(s.key)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                          on
                            ? 'bg-white border-slate-300 text-slate-700'
                            : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <LineChart rows={rows} visible={visible} hoverIndex={hoverIndex} onHover={setHoverIndex} />

              {/* Hover detail */}
              <div className="mt-2 min-h-[44px] text-xs">
                {hovered ? (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700">
                    <span className="font-medium text-slate-800">{fmtLong(hovered.date)}</span>
                    {isWeekend(hovered.date) && (
                      <span className="text-[10px] uppercase tracking-wide text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Weekend</span>
                    )}
                    {SERIES.map((s) => (
                      <span key={s.key} className="inline-flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label}: <span className="font-semibold">{hovered[s.key]}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400">Hover the chart to see daily values.</span>
                )}
              </div>
            </div>

            {/* Daily breakdown table */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Daily Breakdown</h3>
                <p className="text-[11px] text-slate-500">Newest first · weekends highlighted</p>
              </div>
              <div className="overflow-auto max-h-[420px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-slate-700 z-10">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-semibold whitespace-nowrap">Date</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">New Registered</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Closed</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">SLA Breach</th>
                      <th className="px-3 py-2 font-semibold whitespace-nowrap text-right">Net Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice().reverse().map((r) => {
                      const weekend = isWeekend(r.date)
                      const net = r.new_registered - r.closed
                      return (
                        <tr key={r.date} className={`border-t border-slate-100 ${weekend ? 'bg-slate-50/60' : 'hover:bg-slate-50'}`}>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">{fmtLong(r.date)}</span>
                              {weekend && (
                                <span className="text-[10px] uppercase tracking-wide text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">WK</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-blue-700">{r.new_registered}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-emerald-700">{r.closed}</td>
                          <td className={`px-3 py-2 text-right tabular-nums ${r.sla_breach > 0 ? 'text-red-700 font-semibold' : 'text-slate-500'}`}>{r.sla_breach}</td>
                          <td className={`px-3 py-2 text-right tabular-nums ${net > 0 ? 'text-amber-700' : net < 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {net > 0 ? `+${net}` : net}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              SLA breach counts a claim on <em>registered_date + (limit + 1)</em> days (per-pool working/calendar mode), only if it was still open on that day. Same SLA rules as the per-claim badges, so daily totals and per-staff KPI agree.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
