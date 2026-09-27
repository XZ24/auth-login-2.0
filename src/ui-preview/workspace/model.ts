import { registryClaims, isOpen, type RegistryClaim, type ClaimStatus } from '../data/registry'
import { isQueueId, orderedClaims, queues, WORKBASKET_AS_OF } from '../data/workbasket'
import { readAssignments } from '../data/localState'

export const CATEGORIES = ['New claim', 'Customer replied', 'Awaiting documents', 'In assessment', 'Ready for payment', 'Closed'] as const
export type Category = typeof CATEGORIES[number]
export const TASKS = ['Verify policy', 'Review documents', 'Confirm customer details', 'Complete assessment']
export const REMINDERS = ['Initial Request', 'Reminder 1', 'Reminder 2'] as const
export type WorkspaceTab = 'Conversation' | 'Details' | 'Documents' | 'Assessment' | 'History'
export interface ClaimDocument {
  id: string; name: string; kind: string; status: 'Missing' | 'Received' | 'Verified'; source: string; date: string
  summary: string; dataUrl?: string; mime?: string
}
export interface Message {
  id: string; sender: string; role: 'Customer' | 'Claims Team' | 'System'; title: string; body: string; date: string; documents: string[]
}
export interface AuditEvent { id: string; title: string; detail: string; date: string; actor: string }
export interface Assessment {
  status: ClaimStatus; pic: string; claimed: string; eligible: string; deductible: string; recommendation: string; followUp: string; rationale: string
}
export interface WorkspaceState {
  version: 1; claimNo: string; status: ClaimStatus; pic: string; category: Category
  assessment: Assessment; assessmentDraft: Assessment; draft: string; draftAttachments: string[]
  messages: Message[]; documents: ClaimDocument[]; reminders: (string | null)[]
  notes: { id: string; text: string; date: string }[]; tasks: boolean[]; history: AuditEvent[]
}
export const money = (amount: number | string) => `MYR ${Number(amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const stamp = (date: string) => new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })
export const shortDate = (date: string) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })
export const uid = () => crypto.randomUUID()
export const storageKey = (claimNo: string) => `ui-preview:workspace:v1:${claimNo}`
export const customerEmail = (claim: RegistryClaim) => `${claim.customer.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`
export const incidentDate = (claim: RegistryClaim) => new Date(new Date(claim.registeredAt).getTime() - 2 * 86400000).toISOString().slice(0, 10)
export function newEvent(state: WorkspaceState, title: string, detail: string): AuditEvent {
  const latest = Math.max(new Date(WORKBASKET_AS_OF).getTime(), ...state.history.map(event => new Date(event.date).getTime()))
  return { id: uid(), title, detail, date: new Date(latest + 60000).toISOString(), actor: 'Nurul Aisyah' }
}
export function replyReceived(state: WorkspaceState) { return state.messages.some(message => message.role === 'Customer') }
export function nextReminder(state: WorkspaceState): number | null {
  if (replyReceived(state) || state.status === 'Approved' || state.status === 'Closed' || state.category === 'In assessment' || state.category === 'Ready for payment' || state.category === 'Closed') return null
  const next = state.reminders.findIndex(date => !date)
  return next < 0 ? null : next
}
const typeDocuments: Record<string, [string, string]> = {
  'Travel delay': ['Airline delay confirmation', 'airline_delay_confirmation.pdf'],
  'Baggage delay': ['Baggage delivery report', 'baggage_delivery_report.pdf'],
  'Lost baggage': ['Property irregularity report', 'baggage_report.pdf'],
  'Medical expenses': ['Medical invoice', 'medical_invoice.pdf'],
  'Trip cancellation': ['Medical certificate', 'medical_certificate.pdf'],
  'Trip curtailment': ['Revised travel itinerary', 'revised_itinerary.pdf'],
}
export function initialWorkspace(claim: RegistryClaim): WorkspaceState {
  const responded = claim.queue === 'customer-replied' || !isOpen(claim)
  const needsRequest = claim.status === 'New'
  const assessing = claim.queue === 'due-overdue' && !claim.reason.startsWith('Reminder') && isOpen(claim)
  const latest = new Date(claim.activityAt).getTime()
  const start = new Date(claim.registeredAt).getTime() + 3600000
  const count = needsRequest ? 0 : claim.activity === 'Reminder 2 sent' ? 3 : claim.activity === 'Reminder 1 sent' ? 2 : claim.activity === 'Initial request sent' ? 1 : responded ? Number(claim.claimNo.slice(-1)) % 2 === 0 ? 3 : 2 : 1
  const sentEnd = responded ? latest - 86400000 : latest
  const reminders = REMINDERS.map((_, index) => index < count ? new Date(start + Math.max(0, sentEnd - start) * index / Math.max(1, count - 1)).toISOString() : null)
  const [requiredName, requiredFile] = typeDocuments[claim.claimType]
  const documents: ClaimDocument[] = [
    { id: 'policy', name: 'policy_schedule.pdf', kind: 'Policy schedule', status: 'Verified', source: 'Policy system', date: claim.registeredAt, summary: `TripCare 360 International\nPolicy: ${claim.policyNo}\nInsured: ${claim.customer}\nCoverage: Single trip · Asia Pacific\nBenefit: ${claim.claimType}\nThis synthetic policy schedule is for interface review only.` },
    { id: 'itinerary', name: 'booking_confirmation.pdf', kind: 'Original itinerary', status: 'Received', source: 'Claim submission', date: claim.registeredAt, summary: `Booking confirmation\nPassenger: ${claim.customer}\nRoute: Kuala Lumpur → Bangkok\nDeparture: ${incidentDate(claim)}\nBooking reference: DEMO-${claim.claimNo.slice(-4)}\nSynthetic preview document.` },
    { id: 'evidence', name: requiredFile, kind: requiredName, status: responded || assessing ? 'Received' : 'Missing', source: responded ? 'Customer email' : assessing ? 'Claim submission' : 'Requested from customer', date: responded || assessing ? claim.activityAt : '', summary: `${requiredName}\nClaim: ${claim.claimNo}\nCustomer: ${claim.customer}\nIncident: ${incidentDate(claim)}\nSupporting evidence for ${claim.claimType.toLowerCase()}.\nThis sample is not an actual customer document.` },
  ]
  const messages: Message[] = []
  reminders.forEach((date, index) => { if (date) messages.push({ id: `request-${index}`, sender: claim.pic === 'Unassigned' ? 'Claims team' : claim.pic, role: 'Claims Team', title: index === 0 ? `Documents required · ${claim.claimNo}` : `${REMINDERS[index]} · Supporting documents`, date, documents: [], body: `Dear ${claim.customer},\n\n${index === 0 ? 'Thank you for submitting your claim. To continue our review, please provide' : 'We are following up on our request for'} your ${requiredName.toLowerCase()}. Please reply to this email with a clear copy.\n\nYour claim reference is ${claim.claimNo}. Let us know if you need help obtaining this document.\n\nKind regards,\nTravel Claims Team` }) })
  if (responded) {
    messages.push({ id: 'customer-reply', sender: claim.customer, role: 'Customer', title: `Re: Documents required · ${claim.claimNo}`, date: claim.activityAt, documents: ['evidence'], body: `Hello,\n\nPlease find the ${requiredName.toLowerCase()} attached, as requested. This relates to my trip on ${incidentDate(claim)}.\n\nCould you confirm that you have everything needed to continue with my claim? Please let me know if anything else is required.\n\nThank you,\n${claim.customer}` })
    messages.push({ id: 'received-event', sender: 'Mail service', role: 'System', title: 'Reply linked to claim', date: new Date(latest + 60000).toISOString(), documents: [], body: 'Customer email and attachment matched to this claim. Ready for assessor review.' })
    messages.push({ id: 'assessor-acknowledgement', sender: claim.pic === 'Unassigned' ? 'Claims team' : claim.pic, role: 'Claims Team', title: 'Acknowledgement of documents', date: new Date(latest + 120000).toISOString(), documents: [], body: `Dear ${claim.customer},\n\nThank you for sending the supporting document. We have received it and will review it against your policy coverage. We will contact you if we need any clarification.\n\nKind regards,\nTravel Claims Team` })
  }
  const assessment: Assessment = { status: claim.status, pic: claim.pic, claimed: claim.amount.toFixed(2), eligible: (Math.round(claim.amount * .8 * 100) / 100).toFixed(2), deductible: '0.00', recommendation: isOpen(claim) ? 'Pending review' : 'Approve', followUp: isOpen(claim) ? '2026-09-28' : '', rationale: isOpen(claim) ? '' : 'Policy coverage and supporting evidence verified. Benefit is payable within the policy limit.' }
  const history: AuditEvent[] = [
    { id: 'created', title: 'Claim registered', detail: `Submitted through the customer portal. Reference ${claim.claimNo}.`, date: claim.registeredAt, actor: 'System' },
    { id: 'assigned', title: claim.pic === 'Unassigned' ? 'Added to unassigned queue' : 'Assessor assigned', detail: claim.pic, date: new Date(start - 60000).toISOString(), actor: 'Claims operations' },
    ...messages.map(message => ({ id: `audit-${message.id}`, title: message.role === 'Customer' ? 'Customer reply received' : message.title, detail: message.role === 'System' ? message.body : `${message.documents.length ? `${message.documents.length} attachment · ` : ''}${message.title}`, date: message.date, actor: message.sender })),
  ]
  if (!isOpen(claim)) history.push({ id: 'status', title: `Status changed to ${claim.status}`, detail: claim.reason, date: new Date(latest + 180000).toISOString(), actor: claim.pic })
  return { version: 1, claimNo: claim.claimNo, status: claim.status, pic: claim.pic,
    category: claim.status === 'Closed' ? 'Closed' : claim.status === 'Approved' ? 'Ready for payment' : needsRequest ? 'New claim' : responded ? 'Customer replied' : assessing ? 'In assessment' : 'Awaiting documents',
    assessment, assessmentDraft: { ...assessment }, draft: '', draftAttachments: [], messages, documents, reminders,
    notes: needsRequest ? [] : [{ id: 'seed-note', text: responded ? 'Supporting evidence received. Check the dates and benefit limit before completing assessment.' : 'Policy schedule checked. Supporting evidence is still outstanding.', date: new Date(start + 60000).toISOString() }],
    tasks: [!needsRequest, !isOpen(claim), !isOpen(claim), !isOpen(claim)], history,
  }
}
export function loadWorkspace(claim: RegistryClaim): WorkspaceState {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey(claim.claimNo)) || 'null') as WorkspaceState | null
    if (saved?.version === 1 && saved.claimNo === claim.claimNo && Array.isArray(saved.messages) && Array.isArray(saved.documents) && Array.isArray(saved.history) && Array.isArray(saved.reminders) && saved.reminders.length === 3 && saved.assessment && saved.assessmentDraft && Array.isArray(saved.tasks) && Array.isArray(saved.notes) && Array.isArray(saved.draftAttachments)) {
      const pic = readAssignments()[claim.claimNo] || saved.pic
      return { ...saved, pic, assessment: { ...saved.assessment, pic }, assessmentDraft: { ...saved.assessmentDraft, pic } }
    }
  } catch { /* Invalid browser state falls back to synthetic fixtures. */ }
  return initialWorkspace(claim)
}
export function workspaceContext() {
  const params = new URLSearchParams(window.location.search)
  const claims = registryClaims(), wanted = params.get('claim') || 'TC-17720'
  const claim = claims.find(item => item.claimNo === wanted)
  const origin = params.get('from') === 'claims' ? 'claims' : 'workbasket'
  const rawQueue = params.get('queue')
  const queue = rawQueue === 'all' || isQueueId(rawQueue) ? rawQueue : claim?.queue || 'customer-replied'
  const search = params.get('q') || ''
  const validIds = new Set(claims.map(item => item.claimNo))
  const supplied = [...new Set((params.get('order') || '').split(',').filter(id => validIds.has(id)))]
  const fallback = origin === 'claims' ? claims : orderedClaims(queue, search)
  const order = supplied.includes(wanted) ? supplied : fallback.map(item => item.claimNo)
  if (claim && !order.includes(wanted)) order.splice(0, order.length, wanted)
  const index = order.indexOf(wanted)
  let back = `/ui-preview/workbasket?${new URLSearchParams({ queue, ...(search ? { q: search } : {}) })}`
  if (origin === 'claims') {
    back = '/ui-preview/claims'
    const returnTo = params.get('returnTo')
    if (returnTo) {
      try {
        const target = new URL(returnTo, window.location.origin)
        if (target.origin === window.location.origin && target.pathname === '/ui-preview/claims') back = target.pathname + target.search
      } catch { /* Invalid return links fall back to the Claims registry. */ }
    }
  }
  const label = origin === 'claims' ? params.get('view') || 'Claims results' : queue === 'all' ? 'All Workbasket queues' : queues.find(item => item.id === queue)!.label
  const href = (target: number) => {
    const next = new URLSearchParams(params)
    next.set('claim', order[target]); next.set('from', origin); next.set('queue', queue); next.set('order', order.join(',')); next.set('position', String(target + 1)); next.set('total', String(order.length))
    return `/ui-preview/workspace?${next}`
  }
  return { claim, wanted, origin, label, order, index, back, previous: index > 0 ? href(index - 1) : null, next: index >= 0 && index < order.length - 1 ? href(index + 1) : null }
}
