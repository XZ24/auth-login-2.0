import { WORKBASKET_AS_OF, workbasketClaims, type WorkbasketClaim } from '../data/workbasket'
export type ReminderKind = 'Reminder 1' | 'Reminder 2'
export type WaitingFilter = 'all' | 'follow-up' | 'waiting'
export interface ReminderRecord { kind: ReminderKind; sentAt: string }
export interface WaitingRecord { history: ReminderRecord[]; lastContact: string; needsFollowUp: boolean }
export type WaitingState = Record<string, WaitingRecord>
export interface WaitingClaim extends WorkbasketClaim, WaitingRecord { email: string; waitingFor: string }
const KEY = 'ui-preview:workbasket-reminders:v1'
const seeds: Record<string, { followUp: boolean; history: ReminderRecord[] }> = {
  'TC-17653': { followUp: false, history: [{ kind: 'Reminder 1', sentAt: '2026-09-19T09:00:00+08:00' }, { kind: 'Reminder 2', sentAt: '2026-09-24T09:00:00+08:00' }] },
  'TC-17673': { followUp: true, history: [{ kind: 'Reminder 1', sentAt: '2026-09-23T09:00:00+08:00' }] },
  'TC-17713': { followUp: true, history: [] },
  'TC-17738': { followUp: false, history: [] },
  'TC-17749': { followUp: false, history: [] },
  'TC-17763': { followUp: false, history: [] },
}
export const validWaitingFilter = (value: string | null): WaitingFilter => value === 'follow-up' || value === 'waiting' ? value : 'all'
export function loadWaitingState(): WaitingState {
  // Follow-up flags are explicit mock assessor flags, not inferred reminder stages.
  const state = Object.fromEntries(workbasketClaims.filter(claim => claim.queue === 'waiting-customer').map(claim => [claim.claimNo, { history: seeds[claim.claimNo].history, lastContact: claim.activityAt, needsFollowUp: seeds[claim.claimNo].followUp }]))
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || '{}') as WaitingState
    for (const [id, record] of Object.entries(saved || {})) {
      if (id in state && record && typeof record.needsFollowUp === 'boolean' && Number.isFinite(Date.parse(record.lastContact)) && Array.isArray(record.history) && record.history.every(entry => (entry.kind === 'Reminder 1' || entry.kind === 'Reminder 2') && Number.isFinite(Date.parse(entry.sentAt)))) state[id] = record
    }
  } catch { /* Use fixtures if local storage is unavailable or invalid. */ }
  return state
}
export function waitingClaims(claims: WorkbasketClaim[], state: WaitingState): WaitingClaim[] {
  return claims.filter(claim => claim.queue === 'waiting-customer').map(claim => ({ ...claim, ...state[claim.claimNo], email: `${claim.customer.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`, waitingFor: claim.reason.replace(/^Awaiting /, '').replace(/^./, letter => letter.toUpperCase()) }))
}
export function commitReminders(state: WaitingState, ids: string[], kind: ReminderKind): WaitingState {
  const sentAt = new Date(Math.max(Date.parse(WORKBASKET_AS_OF), ...Object.values(state).map(record => Date.parse(record.lastContact))) + 60000).toISOString()
  const next = { ...state }
  for (const id of ids) {
    if (!state[id]) throw new Error('A selected claim is no longer available. Please select the recipients again.')
    next[id] = { ...state[id], history: [...state[id].history, { kind, sentAt }], lastContact: sentAt, needsFollowUp: false }
  }
  sessionStorage.setItem(KEY, JSON.stringify(next))
  return next
}
export const reminderDate = (date: string) => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Asia/Kuala_Lumpur' })
export function lastContactAge(date: string) {
  const hours = Math.max(0, Math.floor((Date.parse(WORKBASKET_AS_OF) - Date.parse(date)) / 3600000))
  return hours < 1 ? 'Just now' : hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`
}
export const REMINDER_TEMPLATES: Record<ReminderKind, { subject: string; message: (claim: WaitingClaim) => string }> = {
  'Reminder 1': { subject: 'Outstanding claim information', message: claim => `Dear ${claim.customer},\n\nWe are following up on your claim ${claim.claimNo}. To continue our assessment, please provide the following outstanding information:\n\n${claim.waitingFor}\n\nPlease reply to this email with a clear copy of the requested information. If you have already submitted it, please let us know so we can check our records.\n\nThank you,\nTravel Claims Team` },
  'Reminder 2': { subject: 'Follow-up on outstanding claim information', message: claim => `Dear ${claim.customer},\n\nWe are contacting you again regarding claim ${claim.claimNo}. We are still awaiting the following information to proceed with your assessment:\n\n${claim.waitingFor}\n\nPlease reply with the requested information, or let us know if you need assistance obtaining it. If you have already sent it, please confirm the date of your submission.\n\nThank you,\nTravel Claims Team` },
}
