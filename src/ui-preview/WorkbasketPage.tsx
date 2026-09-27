import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ChatCircleText, ClockCountdown, Hourglass, MagnifyingGlass, Tray, X } from '@phosphor-icons/react'
import { Badge, Button, Input, Panel, PreviewIcon, Table } from './components/primitives'
import { actionNeeded, activityAge, isQueueId, matchingClaims, orderedClaims, queues, sla, workspaceUrl, type QueueId, type WorkbasketFilter } from './data/workbasket'
import './workbasket.css'
import './workbasket/reminders.css'
import { WaitingCustomer } from './workbasket/WaitingCustomer'
import { commitReminders, loadWaitingState, validWaitingFilter, waitingClaims } from './workbasket/reminders'

import { readWorkbasketSelection, useWorkbasketPosition, type WorkbasketSelection } from './workbasket/navigation'

const queueIcons = { 'customer-replied': ChatCircleText, 'due-overdue': ClockCountdown, 'not-attended': Tray, 'waiting-customer': Hourglass }
function readFilters() {
  const params = new URLSearchParams(window.location.search)
  const queue = params.get('queue')
  return { queue: (queue === 'all' || isQueueId(queue) ? queue : params.get('q') ? 'all' : 'customer-replied') as WorkbasketFilter, search: params.get('q') || '', waiting: validWaitingFilter(params.get('waiting')) }
}

export function WorkbasketPage() {
  const root = useRef<HTMLDivElement>(null)
  const [view] = useState(() => new URLSearchParams(window.location.search).get('wbView') || crypto.randomUUID())
  const [filters, setFilters] = useState(readFilters)
  const { queue, search } = filters
  const [waitingState, setWaitingState] = useState(loadWaitingState)
  const [appliedSearch, setAppliedSearch] = useState(search)
  useEffect(() => {
    const timer = window.setTimeout(() => setAppliedSearch(search), 150)
    return () => window.clearTimeout(timer)
  }, [search])
  const params = new URLSearchParams({ queue, wbView: view })
  if (search) params.set('q', search)
  if (filters.waiting !== 'all') params.set('waiting', filters.waiting)
  const returnTo = `/ui-preview/workbasket?${params}`
  const [initialSelection] = useState(() => readWorkbasketSelection(returnTo))
  const selection = useRef<WorkbasketSelection>(initialSelection)
  useWorkbasketPosition(root, view, returnTo, selection)
  if (queue !== 'waiting-customer') selection.current = { selectedClaimIds: [], reminder: null }
  useEffect(() => {
    window.history.replaceState(window.history.state, '', returnTo)
  }, [returnTo])
  useEffect(() => {
    const restore = () => setFilters(readFilters())
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  const matches = matchingClaims(appliedSearch)
  const rows = orderedClaims(queue, appliedSearch)
  const selectedQueue = queue === 'all' ? { label: 'All Workbasket queues', description: 'Results ordered by queue priority, then SLA urgency. Choose a queue above to narrow your search.' } : queues.find(item => item.id === queue)!
  const count = (id: QueueId) => matches.filter(claim => claim.queue === id).length
  const searching = search !== appliedSearch
  const waiting = waitingClaims(matches, waitingState)
  const followUpCount = waiting.filter(claim => claim.needsFollowUp).length

  return <div ref={root} className="pv-workbasket">
    <div className="pv-page-heading"><div><div className="pv-eyebrow">YOUR WORK QUEUE</div><h1>Workbasket</h1><p>Start with customer replies, then due work and new claims. Each queue is ordered by SLA urgency.</p></div><Badge>Mock data · 25 Sep 2026</Badge></div>
    <div className="wb-search-row"><div className="wb-search"><PreviewIcon icon={MagnifyingGlass} /><label htmlFor="workbasket-search" className="pv-sr-only">Search workbasket by claim number, policy number, or customer</label><Input id="workbasket-search" type="search" placeholder="Search all queues by claim, policy, or customer" value={search} onChange={event => setFilters(current => ({ ...current, queue: event.target.value.trim() ? 'all' : 'customer-replied', search: event.target.value }))} />{search && <button type="button" aria-label="Clear workbasket search" onClick={() => setFilters(current => ({ ...current, search: '' }))}><PreviewIcon icon={X} /></button>}</div><span className="pv-caption">{queue === 'all' ? 'Scope: All queues' : search ? `Filtered to ${selectedQueue.label}` : 'Search includes all queues'}</span></div>
    <div className="wb-queue-bar" role="group" aria-label="Actionable work queues">
      {queues.slice(0, 3).map((item, index) => <button key={item.id} type="button" className={`wb-queue ${queue === item.id ? 'is-selected' : ''}`} aria-pressed={queue === item.id} aria-controls="workbasket-results" onClick={() => setFilters(current => ({ ...current, queue: item.id }))}>
        <span className="wb-queue-top"><PreviewIcon icon={queueIcons[item.id]} size="navigation" /><span>{item.label}</span><span className="wb-count">{count(item.id)}</span></span><span className="wb-queue-bottom"><span>{['Review customer responses', 'Resolve time-sensitive work', 'Make the first review'][index]}</span><span className="pv-mono">0{index + 1}</span></span>
      </button>)}
    </div>
    <div className="wb-waiting-row"><button type="button" aria-pressed={queue === 'waiting-customer'} aria-controls="workbasket-results" className={`wb-waiting ${queue === 'waiting-customer' ? 'is-selected' : ''}`} onClick={() => setFilters(current => ({ ...current, queue: 'waiting-customer', waiting: 'all' }))}><PreviewIcon icon={Hourglass} />Waiting on Customer<span className="wb-waiting-count">{count('waiting-customer')}</span></button><span>{waiting.length} waiting · <button type="button" className="wr-follow-up-link" onClick={() => setFilters(current => ({ ...current, queue: 'waiting-customer', waiting: 'follow-up' }))}>{followUpCount} need follow-up</button></span></div>
    {queue === 'waiting-customer' ? <WaitingCustomer navigationSelection={selection} returnTo={returnTo} claims={waiting} filter={filters.waiting} setFilter={value => setFilters(current => ({ ...current, waiting: value }))} search={appliedSearch} send={(ids, kind) => {
      const next = commitReminders(waitingState, ids, kind)
      setWaitingState(next)
    }} /> : <Panel className="wb-results" id="workbasket-results" aria-label={`${selectedQueue.label} claims`}>
      <div className="wb-list-heading"><div><h2>{selectedQueue.label}<span className="wb-total">{rows.length}</span></h2><p>{selectedQueue.description}</p></div><span className="wb-order"><PreviewIcon icon={ArrowDown} />SLA priority, oldest activity first</span></div>
      <div role="status" className="pv-sr-only">{searching ? 'Searching claims' : `${rows.length} claims in ${selectedQueue.label}${appliedSearch ? ` matching ${appliedSearch}` : ''}`}</div>
      <div aria-busy={searching}>
        <Table label={`${selectedQueue.label} work list`}><thead><tr><th scope="col">Claim No / Policy</th><th scope="col">Customer</th><th scope="col">Claim Type</th><th scope="col">Action Needed</th><th scope="col">Latest Activity</th><th scope="col">SLA</th><th scope="col"><span className="pv-sr-only">Open claim</span></th></tr></thead><tbody>
          {rows.map(claim => {
            const due = sla(claim)
            const href = workspaceUrl(claim, queue, appliedSearch, rows, returnTo)
            return <tr key={claim.claimNo} className="wb-claim-row" onClick={event => {
              if ((event.target as HTMLElement).closest('a') || window.getSelection()?.toString()) return
              window.location.assign(href)
            }}>
              <td><a className="wb-claim-link pv-mono" href={href} aria-label={`Open claim ${claim.claimNo} for ${claim.customer}`}>{claim.claimNo}</a><span className="wb-secondary pv-mono">{claim.policyNo}</span></td>
              <td className="wb-customer">{claim.customer}</td><td>{claim.claimType}</td>
              <td><span className={`wb-state wb-state--${claim.queue}`}>{claim.queue === 'customer-replied' && <span className="wb-reply-dot" />}{actionNeeded(claim)}</span><span className="wb-secondary">{claim.reason}</span></td>
              <td><span>{claim.activity}</span><time className="wb-secondary" dateTime={claim.activityAt} title={new Date(claim.activityAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}>{activityAge(claim)}</time></td>
              <td><span className={`wb-sla ${due.overdue ? 'is-overdue' : due.urgent ? 'is-due' : ''}`}>{due.urgent && <PreviewIcon icon={ClockCountdown} />}{due.label}</span></td>
              <td className="wb-row-arrow"><PreviewIcon icon={ArrowRight} /></td>
            </tr>
          })}
        </tbody></Table>
      </div>
      {rows.length === 0 && <div className="wb-empty"><PreviewIcon icon={MagnifyingGlass} size="illustration" /><h3>{appliedSearch ? 'No matching claims in this queue' : 'This queue is clear'}</h3><p>{appliedSearch ? 'Try another queue, claim number, policy number, or customer.' : 'Choose another queue to find your next claim.'}</p>{appliedSearch && <Button onClick={() => setFilters(current => ({ ...current, search: '' }))}>Clear search</Button>}</div>}
      <div className="wb-list-footer"><span>{rows.length} {rows.length === 1 ? 'claim' : 'claims'}{appliedSearch && <> matching “{appliedSearch}”</>}</span></div>
    </Panel>}
    <p className="wb-footnote">Local preview data · SLA and activity times are shown as of 25 Sep 2026, 09:00 MYT.</p>
  </div>
}
