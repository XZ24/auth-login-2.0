// Module-level cache for EDP KPI endpoints so switching views doesn't
// re-trigger the (slow) API calls. Cleared via the corresponding
// `set*Cache(null)` (e.g. when the user hits Refresh).
import {
  EdpKpiDaily,
  EdpKpiSummary,
  EdpKpiSummaryParams,
  fetchEdpKpiDaily,
  fetchEdpKpiSummary,
} from './api'

// ---------------------------------------------------------------------------
// KPI summary
// ---------------------------------------------------------------------------

const DEFAULT_SUMMARY_KEY = 'default'
let cachedKey: string | null = null
let cached: EdpKpiSummary | null = null
let inflightKey: string | null = null
let inflight: Promise<EdpKpiSummary> | null = null
const listeners = new Set<() => void>()

function summaryCacheKey(params: EdpKpiSummaryParams = {}): string {
  const qs = new URLSearchParams()
  if (params.from_date) qs.set('from_date', params.from_date)
  if (params.to_date) qs.set('to_date', params.to_date)
  if (params.as_of) qs.set('as_of', params.as_of)
  if (params.pool) qs.set('pool', params.pool)
  return qs.toString() || DEFAULT_SUMMARY_KEY
}

export function getKpiSummaryCache(): EdpKpiSummary | null {
  return cached
}

export function setKpiSummaryCache(value: EdpKpiSummary | null): void {
  cachedKey = value ? DEFAULT_SUMMARY_KEY : null
  cached = value
  listeners.forEach((l) => l())
}

export function setKpiSummaryCacheForParams(
  value: EdpKpiSummary | null,
  params: EdpKpiSummaryParams = {},
): void {
  cachedKey = value ? summaryCacheKey(params) : null
  cached = value
  listeners.forEach((l) => l())
}

export function subscribeKpiSummaryCache(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function loadKpiSummary(
  force = false,
  params: EdpKpiSummaryParams = {},
): Promise<EdpKpiSummary> {
  const key = summaryCacheKey(params)
  if (!force && cached && cachedKey === key) return Promise.resolve(cached)
  if (!force && inflight && inflightKey === key) return inflight
  inflightKey = key
  inflight = fetchEdpKpiSummary(params)
    .then((data) => {
      setKpiSummaryCacheForParams(data, params)
      return data
    })
    .finally(() => {
      inflightKey = null
      inflight = null
    })
  return inflight
}

// ---------------------------------------------------------------------------
// KPI daily trend (fixed window: 30 days ending today)
// ---------------------------------------------------------------------------

const DAILY_DAYS = 30

let dailyCached: EdpKpiDaily | null = null
let dailyInflight: Promise<EdpKpiDaily> | null = null
const dailyListeners = new Set<() => void>()

export function getKpiDailyCache(): EdpKpiDaily | null {
  return dailyCached
}

export function setKpiDailyCache(value: EdpKpiDaily | null): void {
  dailyCached = value
  dailyListeners.forEach((l) => l())
}

export function subscribeKpiDailyCache(listener: () => void): () => void {
  dailyListeners.add(listener)
  return () => dailyListeners.delete(listener)
}

export function loadKpiDaily(force = false): Promise<EdpKpiDaily> {
  if (!force && dailyCached) return Promise.resolve(dailyCached)
  if (!force && dailyInflight) return dailyInflight
  dailyInflight = fetchEdpKpiDaily({ days: DAILY_DAYS })
    .then((data) => {
      setKpiDailyCache(data)
      return data
    })
    .finally(() => {
      dailyInflight = null
    })
  return dailyInflight
}
