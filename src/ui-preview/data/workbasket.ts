import { readAssignments } from './localState'
// Synthetic preview records. A fixed clock keeps SLA and activity labels reproducible.
export const WORKBASKET_AS_OF = '2026-09-25T09:00:00+08:00'
export type WorkbasketFilter = QueueId | 'all'
export type QueueId = 'customer-replied' | 'due-overdue' | 'not-attended' | 'waiting-customer'
export const queues: { id: QueueId; label: string; description: string }[] = [
  { id: 'customer-replied', label: 'Customer Replied', description: 'Review new information and move the claim forward.' },
  { id: 'due-overdue', label: 'Due / Overdue', description: 'Resolve overdue work and claims due today.' },
  { id: 'not-attended', label: 'Not Yet Attended', description: 'Review new claims and make first contact.' },
  { id: 'waiting-customer', label: 'Waiting on Customer', description: 'Awaiting a response. No immediate assessor action.' },
]
export interface WorkbasketClaim {
  claimNo: string
  policyNo: string
  customer: string
  claimType: string
  queue: QueueId
  reason: string
  activity: string
  activityAt: string
  dueAt: string
  pic: string
}
// Each record belongs to its highest-priority actionable queue. A reply supersedes
// a due reminder; waiting records have no action due yet. SLA remains independent.
const seed: [string, string, string, string, QueueId, string, string, number, number, string][] = [
  ['TC-17720', 'TR-26080419', 'Tan Mei Ling', 'Travel delay', 'customer-replied', 'Flight confirmation received', 'Customer replied', 48, 0, 'Fatimah'],
  ['TC-17684', 'TR-26070286', 'Arjun Menon', 'Baggage delay', 'customer-replied', 'Receipts received', 'Customer replied', 52, -2, 'Nurul Aisyah'],
  ['TC-17703', 'TR-26080351', 'Nur Aina Rahman', 'Trip cancellation', 'customer-replied', 'Medical certificate received', 'Customer replied', 26, -1, 'Emmyra'],
  ['TC-17746', 'TR-26080672', 'Lim Jun Wei', 'Medical expenses', 'customer-replied', 'Hospital invoice received', 'Customer replied', 5, 0, 'Nurul Aisyah'],
  ['TC-17758', 'TR-26090134', 'Siti Hajar Abdullah', 'Lost baggage', 'customer-replied', 'Baggage report received', 'Customer replied', 3, 1, 'Fatimah'],
  ['TC-17761', 'TR-26090179', 'Kavitha Subramaniam', 'Travel delay', 'customer-replied', 'Itinerary clarified', 'Customer replied', 2, 1, 'Nurmasriza'],
  ['TC-17775', 'TR-26090302', 'Chong Wei Han', 'Trip curtailment', 'customer-replied', 'Return ticket received', 'Customer replied', 1, 2, 'Nurul Aisyah'],
  ['TC-17562', 'TR-26060217', 'Rashid Ismail', 'Trip cancellation', 'due-overdue', 'Assessment overdue', 'Documents verified', 96, -4, 'Emmyra'],
  ['TC-17612', 'TR-26070082', 'Wong Su Yin', 'Medical expenses', 'due-overdue', 'Assessment overdue', 'Invoice reviewed', 72, -3, 'Nurul Aisyah'],
  ['TC-17641', 'TR-26070125', 'Devan Nair', 'Baggage delay', 'due-overdue', 'Reminder 2 due', 'Reminder 1 sent', 168, -1, 'Fatimah'],
  ['TC-17699', 'TR-26080230', 'Farah Nadia Hassan', 'Travel delay', 'due-overdue', 'Assessment due today', 'Documents verified', 22, 0, 'Nurmasriza'],
  ['TC-17709', 'TR-26080389', 'Lee Jia Xin', 'Lost baggage', 'due-overdue', 'Reminder 1 due', 'Initial request sent', 168, 0, 'Nurul Aisyah'],
  ['TC-17731', 'TR-26080501', 'Amir Hakim Zain', 'Trip curtailment', 'due-overdue', 'Assessment due today', 'Evidence reviewed', 8, 0, 'Emmyra'],
  ['TC-17792', 'TR-26090444', 'Priya Raman', 'Medical expenses', 'not-attended', 'First review required', 'Claim registered', 25, 0, 'Unassigned'],
  ['TC-17801', 'TR-26090487', 'Muhammad Iqbal Noor', 'Travel delay', 'not-attended', 'First review required', 'Claim registered', 18, 1, 'Nurul Aisyah'],
  ['TC-17806', 'TR-26090513', 'Teoh Pei Shan', 'Trip cancellation', 'not-attended', 'First review required', 'Claim registered', 7, 1, 'Unassigned'],
  ['TC-17811', 'TR-26090558', 'Azlina Osman', 'Baggage delay', 'not-attended', 'First review required', 'Claim registered', 4, 2, 'Fatimah'],
  ['TC-17815', 'TR-26090594', 'Daniel Jeyaraj', 'Travel delay', 'not-attended', 'First review required', 'Claim registered', 2, 2, 'Unassigned'],
  ['TC-17653', 'TR-26070190', 'Nur Syafiqah Ali', 'Lost baggage', 'waiting-customer', 'Awaiting baggage report', 'Reminder 2 sent', 24, 3, 'Emmyra'],
  ['TC-17673', 'TR-26070241', 'Goh Kai En', 'Medical expenses', 'waiting-customer', 'Awaiting original invoice', 'Reminder 1 sent', 48, 4, 'Nurul Aisyah'],
  ['TC-17713', 'TR-26080403', 'Shalini Krishnan', 'Trip cancellation', 'waiting-customer', 'Awaiting medical certificate', 'Initial request sent', 72, 4, 'Fatimah'],
  ['TC-17738', 'TR-26080586', 'Hafiz Roslan', 'Travel delay', 'waiting-customer', 'Awaiting airline confirmation', 'Initial request sent', 36, 5, 'Nurmasriza'],
  ['TC-17749', 'TR-26080711', 'Chew Li Wen', 'Baggage delay', 'waiting-customer', 'Awaiting purchase receipts', 'Initial request sent', 20, 6, 'Nurul Aisyah'],
  ['TC-17763', 'TR-26090203', 'Vikram Chandran', 'Trip curtailment', 'waiting-customer', 'Awaiting revised itinerary', 'Initial request sent', 6, 7, 'Emmyra'],
]
const clock = new Date(WORKBASKET_AS_OF).getTime()
export const workbasketClaims: WorkbasketClaim[] = seed.map(([claimNo, policyNo, customer, claimType, queue, reason, activity, hoursAgo, dueDays, pic]) => ({
  claimNo, policyNo, customer, claimType, queue, reason, activity, pic,
  activityAt: new Date(clock - hoursAgo * 3_600_000).toISOString(),
  dueAt: new Date(clock + dueDays * 86_400_000).toISOString(),
}))
export function isQueueId(value: string | null): value is QueueId {
  return queues.some(queue => queue.id === value)
}
export function matchingClaims(search: string) {
  const term = search.trim().toLowerCase()
  const assignments = readAssignments()
  return workbasketClaims.map(claim => ({ ...claim, pic: assignments[claim.claimNo] || claim.pic })).filter(claim => [claim.claimNo, claim.policyNo, claim.customer].some(value => value.toLowerCase().includes(term)))
}
export function orderedClaims(queue: WorkbasketFilter, search: string) {
  return matchingClaims(search).filter(claim => queue === 'all' || claim.queue === queue).sort((a, b) =>
    (queue === 'all' ? queues.findIndex(item => item.id === a.queue) - queues.findIndex(item => item.id === b.queue) : 0) ||
    a.dueAt.localeCompare(b.dueAt) || a.activityAt.localeCompare(b.activityAt) || a.claimNo.localeCompare(b.claimNo))
}
export function sla(claim: WorkbasketClaim) {
  const days = Math.round((new Date(claim.dueAt).getTime() - clock) / 86_400_000)
  return { urgent: days <= 0, overdue: days < 0, label: days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `Due in ${days}d` }
}
export function activityAge(claim: WorkbasketClaim) {
  const hours = Math.round((clock - new Date(claim.activityAt).getTime()) / 3_600_000)
  return hours >= 24 ? `${Math.floor(hours / 24)}d ago` : `${hours}h ago`
}
export function workspaceUrl(claim: WorkbasketClaim, queue: WorkbasketFilter, search: string, ordered: WorkbasketClaim[], returnTo?: string) {
  const params = new URLSearchParams({ claim: claim.claimNo, queue, from: 'workbasket', q: search,
    position: String(ordered.findIndex(item => item.claimNo === claim.claimNo) + 1),
    total: String(ordered.length), order: ordered.map(item => item.claimNo).join(','), asOf: WORKBASKET_AS_OF })
  if (returnTo) params.set('returnTo', returnTo)
  return `/ui-preview/workspace?${params}`
}

export function actionNeeded(claim: WorkbasketClaim) {
  if (claim.queue === 'customer-replied') return claim.reason === 'Itinerary clarified' ? 'Respond to customer' : 'Review new documents'
  if (claim.queue === 'not-attended') return 'Complete first review'
  if (claim.queue === 'waiting-customer') return 'Await customer response'
  if (claim.reason.startsWith('Reminder 1')) return 'Send Reminder 1'
  if (claim.reason.startsWith('Reminder 2')) return 'Send Reminder 2'
  return 'Complete assessment'
}
