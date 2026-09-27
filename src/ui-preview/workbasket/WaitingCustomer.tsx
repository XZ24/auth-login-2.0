import { useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react'
import { ArrowRight, Check } from '@phosphor-icons/react'
import { Button, Panel, PreviewIcon, Table } from '../components/primitives'
import { workspaceUrl } from '../data/workbasket'
import { type WorkbasketSelection } from './navigation'
import { ReminderChooser, ReminderReview } from './ReminderFlow'
import { lastContactAge, reminderDate, type ReminderKind, type WaitingClaim, type WaitingFilter } from './reminders'

export function WaitingCustomer({ claims, filter, setFilter, search, send, returnTo, navigationSelection }: { navigationSelection: MutableRefObject<WorkbasketSelection>; returnTo: string; claims: WaitingClaim[]; filter: WaitingFilter; setFilter: (filter: WaitingFilter) => void; search: string; send: (ids: string[], kind: ReminderKind) => void }) {
  const [restored] = useState(() => navigationSelection.current)
  const [selected, setSelected] = useState<Set<string>>(() => new Set(restored.selectedClaimIds.filter(id => claims.some(claim => claim.claimNo === id && (filter === 'all' || (filter === 'follow-up' ? claim.needsFollowUp : !claim.needsFollowUp))))))
  const [review, setReview] = useState<{ kind: ReminderKind; recipients: WaitingClaim[] } | null>(() => {
    const recipients = claims.filter(claim => selected.has(claim.claimNo))
    return restored.reminder && recipients.length ? { kind: restored.reminder, recipients } : null
  })
  const [notice, setNotice] = useState('')
  const headerCheckbox = useRef<HTMLInputElement>(null)
  const count = claims.filter(claim => claim.needsFollowUp).length
  const visible = claims.filter(claim => filter === 'all' || (filter === 'follow-up' ? claim.needsFollowUp : !claim.needsFollowUp))
  const chosen = visible.filter(claim => selected.has(claim.claimNo))
  const all = visible.length > 0 && chosen.length === visible.length
  const previousScope = useRef({ filter, search })
  useEffect(() => {
    if (previousScope.current.filter !== filter || previousScope.current.search !== search) {
      setSelected(new Set()); setReview(null)
      previousScope.current = { filter, search }
    }
  }, [filter, search])
  // Only IDs and the manual template choice enter the navigation snapshot.
  // The parent saves this ref on departure; checkbox changes never rerender the page.
  useLayoutEffect(() => {
    navigationSelection.current = { selectedClaimIds: chosen.map(claim => claim.claimNo), reminder: review?.kind || null }
  })
  useEffect(() => { if (headerCheckbox.current) headerCheckbox.current.indeterminate = chosen.length > 0 && !all }, [chosen.length, all])
  function toggle(id: string) { setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next }) }
  return <Panel className="wb-results wr-results" id="workbasket-results" aria-label="Waiting on Customer claims">
    <div className="wb-list-heading"><div><h2>Waiting on Customer<span className="wb-total">{claims.length} claims</span></h2><p>{count} currently need follow-up{search && ' in these search results'} · reminder choice is manual</p></div></div>
    <div className="wr-filters" role="group" aria-label="Waiting on Customer filters">{([{ id: 'all', label: 'All', count: claims.length }, { id: 'follow-up', label: 'Needs Follow-up', count }, { id: 'waiting', label: 'Waiting', count: claims.length - count }] as const).map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}<span>{item.count}</span></button>)}</div>
    {notice && <p className="wr-success" role="status"><PreviewIcon icon={Check} />{notice}</p>}
    {chosen.length > 0 && <div className="wr-bulk" aria-label="Bulk reminder actions"><span><strong>{chosen.length}</strong> {chosen.length === 1 ? 'claim' : 'claims'} selected</span><Button variant="ghost" onClick={() => setSelected(new Set())}>Clear selection</Button><ReminderChooser choose={kind => setReview({ kind, recipients: [...chosen] })} /></div>}
    <Table label="Waiting customer follow-up list"><thead><tr><th scope="col"><input ref={headerCheckbox} type="checkbox" aria-label="Select all visible waiting claims" checked={all} disabled={!visible.length} onChange={() => setSelected(all ? new Set() : new Set(visible.map(claim => claim.claimNo)))} /></th><th scope="col">Claim</th><th scope="col">Customer</th><th scope="col">Waiting For</th><th scope="col">Last Reminder</th><th scope="col">Last Contact</th><th scope="col"><span className="pv-sr-only">Open claim</span></th></tr></thead><tbody>{visible.map(claim => {
      const last = claim.history[claim.history.length - 1]
      const href = workspaceUrl(claim, 'waiting-customer', search, visible, returnTo)
      return <tr key={claim.claimNo} className={`wb-claim-row ${selected.has(claim.claimNo) ? 'wr-selected' : ''}`} onClick={event => { if ((event.target as HTMLElement).closest('a, button, input, label') || window.getSelection()?.toString()) return; window.location.assign(href) }}><td><input type="checkbox" aria-label={`Select ${claim.claimNo}`} checked={selected.has(claim.claimNo)} onChange={() => toggle(claim.claimNo)} /></td><td><a className="wb-claim-link pv-mono" href={href} aria-label={`Open claim ${claim.claimNo} for ${claim.customer}`}>{claim.claimNo}</a><span className="wb-secondary pv-mono">{claim.policyNo}</span></td><td className="wb-customer">{claim.customer}</td><td>{claim.waitingFor}{claim.needsFollowUp && <span className="wb-secondary wr-follow-up">Needs follow-up</span>}</td><td>{last ? `${last.kind} sent` : 'None'}{last && <time className="wb-secondary" dateTime={last.sentAt}>{lastContactAge(last.sentAt) === 'Just now' ? 'Just now' : reminderDate(last.sentAt)}</time>}</td><td><time dateTime={claim.lastContact} title={reminderDate(claim.lastContact)}>{lastContactAge(claim.lastContact)}</time></td><td className="wb-row-arrow"><PreviewIcon icon={ArrowRight} /></td></tr>
    })}</tbody></Table>
    {!visible.length && <div className="wb-empty"><h3>{filter === 'follow-up' && !search ? 'No claims currently need follow-up' : 'No claims in this view'}</h3><p>{search ? 'Try a different search or waiting filter.' : 'Choose All to review the waiting claims.'}</p>{filter !== 'all' && <Button onClick={() => setFilter('all')}>Show all waiting claims</Button>}</div>}
    <div className="wb-list-footer"><span>{visible.length} {visible.length === 1 ? 'claim' : 'claims'} shown · select visible claims to send a reminder</span></div>
    {review && <ReminderReview kind={review.kind} recipients={review.recipients} cancel={() => setReview(null)} send={() => {
      send(review.recipients.map(claim => claim.claimNo), review.kind)
      setNotice(`${review.recipients.length} ${review.recipients.length === 1 ? 'reminder sent' : 'reminders sent'} successfully · local simulation`)
      setSelected(new Set()); setReview(null)
      window.requestAnimationFrame(() => headerCheckbox.current?.focus())
    }} />}
  </Panel>
}
