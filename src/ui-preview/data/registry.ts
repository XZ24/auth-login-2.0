import { workbasketClaims, WORKBASKET_AS_OF, type WorkbasketClaim } from './workbasket'
import { PIC_OPTIONS, readAssignments } from './localState'

export const STATUSES = ['New', 'In review', 'Waiting on customer', 'Approved', 'Closed'] as const
export type ClaimStatus = typeof STATUSES[number]
export interface RegistryClaim extends WorkbasketClaim {
  status: ClaimStatus
  registeredAt: string
  amount: number
}
const amounts = [480, 325.80, 2450, 1876.50, 960, 240, 3150, 2840, 1640.75, 420, 360, 890, 2145.60, 180, 3480, 275, 320, 720, 1688, 2960, 280, 340, 1450, 560]
const asOf = new Date(WORKBASKET_AS_OF).getTime()
const openClaims: RegistryClaim[] = workbasketClaims.map((claim, index) => ({
  ...claim,
  status: claim.queue === 'not-attended' ? 'New' : claim.queue === 'waiting-customer' || claim.reason.startsWith('Reminder') ? 'Waiting on customer' : 'In review',
  registeredAt: new Date(asOf - (claim.queue === 'not-attended' ? 1 : 8 + index % 15) * 86_400_000).toISOString(),
  amount: amounts[index],
}))
const resolved: [string, string, string, string, ClaimStatus, number, string, number][] = [
  ['TC-17501', 'TR-26050108', 'Alicia Tan Shu Min', 'Travel delay', 'Approved', 480, 'Fatimah', 4],
  ['TC-17518', 'TR-26050173', 'Zulkifli Ahmad', 'Baggage delay', 'Closed', 275.50, 'Nurul Aisyah', 7],
  ['TC-17525', 'TR-26050221', 'Meena Selvaraj', 'Medical expenses', 'Approved', 2196.80, 'Emmyra', 3],
  ['TC-17533', 'TR-26050287', 'Chia Yew Hong', 'Trip cancellation', 'Closed', 3280, 'Nurmasriza', 10],
  ['TC-17540', 'TR-26050319', 'Noor Amalina Yusof', 'Lost baggage', 'Closed', 980, 'Fatimah', 6],
  ['TC-17547', 'TR-26050370', 'Ravi Shankar', 'Trip curtailment', 'Approved', 1240.90, 'Nurul Aisyah', 2],
]
const registrySeed: RegistryClaim[] = [...openClaims, ...resolved.map(([claimNo, policyNo, customer, claimType, status, amount, pic, days]): RegistryClaim => ({
  claimNo, policyNo, customer, claimType, status, amount, pic, queue: 'due-overdue',
  reason: status === 'Closed' ? 'Payment completed' : 'Payment pending',
  activity: status === 'Closed' ? 'Claim closed' : 'Assessment approved',
  activityAt: new Date(asOf - days * 86_400_000).toISOString(),
  registeredAt: new Date(asOf - (days + 25) * 86_400_000).toISOString(),
  dueAt: new Date(asOf - days * 86_400_000).toISOString(),
}))]
export const CLAIM_TYPES = [...new Set(registrySeed.map(claim => claim.claimType))].sort()
export function registryClaims() {
  const assignments = readAssignments()
  return registrySeed.map(claim => ({ ...claim, pic: assignments[claim.claimNo] || claim.pic }))
}
export const isOpen = (claim: RegistryClaim) => claim.status !== 'Approved' && claim.status !== 'Closed'
export type SortField = 'claimNo' | 'customer' | 'registeredAt' | 'amount' | 'dueAt'
export interface RegistryFilters {
  q: string
  status: 'All' | ClaimStatus
  pic: string
  type: string
  sla: 'all' | 'overdue' | 'due-today' | 'upcoming'
  sort: SortField
  direction: 'asc' | 'desc'
}
export const defaultFilters: RegistryFilters = { q: '', status: 'All', pic: '', type: '', sla: 'all', sort: 'registeredAt', direction: 'desc' }
export function normalizeFilters(value: Partial<Record<keyof RegistryFilters, unknown>>): RegistryFilters {
  return {
    q: typeof value.q === 'string' ? value.q : '',
    status: STATUSES.includes(value.status as ClaimStatus) ? value.status as ClaimStatus : 'All',
    pic: PIC_OPTIONS.includes(String(value.pic)) ? String(value.pic) : '',
    type: CLAIM_TYPES.includes(String(value.type)) ? String(value.type) : '',
    sla: ['overdue', 'due-today', 'upcoming'].includes(String(value.sla)) ? value.sla as RegistryFilters['sla'] : 'all',
    sort: ['claimNo', 'customer', 'registeredAt', 'amount', 'dueAt'].includes(String(value.sort)) ? value.sort as SortField : 'registeredAt',
    direction: value.direction === 'asc' ? 'asc' : 'desc',
  }
}
export function filterRegistry(claims: RegistryClaim[], filters: RegistryFilters, includeStatus = true) {
  const query = filters.q.trim().toLowerCase()
  return claims.filter(claim => {
    if (query && ![claim.claimNo, claim.policyNo, claim.customer].some(value => value.toLowerCase().includes(query))) return false
    if (includeStatus && filters.status !== 'All' && claim.status !== filters.status) return false
    if (filters.pic && claim.pic !== filters.pic) return false
    if (filters.type && claim.claimType !== filters.type) return false
    const due = Math.round((new Date(claim.dueAt).getTime() - asOf) / 86_400_000)
    if (filters.sla !== 'all' && !isOpen(claim)) return false
    if (filters.sla === 'overdue' && due >= 0) return false
    if (filters.sla === 'due-today' && due !== 0) return false
    if (filters.sla === 'upcoming' && due <= 0) return false
    return true
  }).sort((a, b) => {
    if (filters.sort === 'dueAt' && isOpen(a) !== isOpen(b)) return isOpen(a) ? -1 : 1
    const left = a[filters.sort], right = b[filters.sort]
    const comparison = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))
    return comparison * (filters.direction === 'asc' ? 1 : -1) || a.claimNo.localeCompare(b.claimNo)
  })
}
export interface SavedView { id: string; name: string; filters: RegistryFilters }
export const builtinViews: SavedView[] = [
  { id: 'all', name: 'All claims', filters: defaultFilters },
  { id: 'mine', name: 'Assigned to me', filters: { ...defaultFilters, pic: 'Nurul Aisyah' } },
  { id: 'unassigned', name: 'Unassigned', filters: { ...defaultFilters, pic: 'Unassigned', status: 'New' } },
  { id: 'overdue', name: 'Overdue', filters: { ...defaultFilters, sla: 'overdue', sort: 'dueAt', direction: 'asc' } },
]
export const SAVED_VIEWS_KEY = 'ui-preview:claims-saved-views:v1'
export function readSavedViews(): SavedView[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SAVED_VIEWS_KEY) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter(item => item && typeof item.id === 'string' && item.id.startsWith('custom-') && typeof item.name === 'string' && item.filters && typeof item.filters === 'object').map(item => ({ id: item.id, name: item.name.slice(0, 40), filters: normalizeFilters(item.filters) }))
  } catch { return [] }
}
export function registryParams(filters: RegistryFilters, page: number) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value !== defaultFilters[key as keyof RegistryFilters]) params.set(key, value)
  if (page > 1) params.set('page', String(page))
  return params
}
export function exportClaimsCsv(claims: RegistryClaim[]) {
  const cell = (value: string | number) => `"${String(value).replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`
  const rows = [['Claim No', 'Policy No', 'Customer', 'Claim Type', 'Status', 'Claimed MYR', 'PIC', 'Registered'], ...claims.map(claim => [claim.claimNo, claim.policyNo, claim.customer, claim.claimType, claim.status, claim.amount.toFixed(2), claim.pic, claim.registeredAt.slice(0, 10)])]
  return '\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')
}
