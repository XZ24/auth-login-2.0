import { useEffect, useRef, useState } from 'react'
import { CaretDown, CircleNotch, WarningCircle, X } from '@phosphor-icons/react'
import { Button, PreviewIcon } from '../components/primitives'
import { REMINDER_TEMPLATES, reminderDate, type ReminderKind, type WaitingClaim } from './reminders'

// Manual decision boundary. A future stage recommendation can replace this
// chooser without changing recipient review, duplicate checks, or local sending.
export function ReminderChooser({ choose }: { choose: (kind: ReminderKind) => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [])
  useEffect(() => { if (open) root.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus() }, [open])
  return <div ref={root} className="wr-chooser" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={event => {
    if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const items = Array.from(root.current!.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
      const index = items.indexOf(document.activeElement as HTMLButtonElement)
      items[event.key === 'Home' ? 0 : event.key === 'End' ? 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + 2) % 2]?.focus()
    }
  }}><button ref={trigger} type="button" className="pv-button pv-button--primary" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>Send Reminder<PreviewIcon icon={CaretDown} /></button>{open && <div role="menu" aria-label="Choose reminder template" className="wr-menu">{(['Reminder 1', 'Reminder 2'] as const).map(kind => <button key={kind} type="button" role="menuitem" onClick={() => { setOpen(false); trigger.current?.focus(); choose(kind) }}>{kind}</button>)}</div>}</div>
}

export function ReminderReview({ kind, recipients, cancel, send }: { kind: ReminderKind; recipients: WaitingClaim[]; cancel: () => void; send: () => void }) {
  const duplicates = recipients.flatMap(claim => {
    const last = [...claim.history].reverse().find(item => item.kind === kind)
    return last ? [{ claim, last }] : []
  })
  const [sending, setSending] = useState(false)
  const [previewId, setPreviewId] = useState(recipients[0].claimNo), [error, setError] = useState('')
  const dialog = useRef<HTMLDialogElement>(null), heading = useRef<HTMLHeadingElement>(null), locked = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const template = REMINDER_TEMPLATES[kind], sample = recipients.find(claim => claim.claimNo === previewId)!
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    heading.current?.focus()
    return () => { window.clearTimeout(timer.current); element.close() }
  }, [])
  function confirmSend() {
    if (locked.current) return
    locked.current = true
    setSending(true); setError('')
    // Deliberate UI-only delay. No request, stage inference, or scheduling.
    timer.current = window.setTimeout(() => {
      try { send() } catch {
        locked.current = false; setSending(false)
        setError('Could not save this simulation in browser storage. No reminder history was updated. Please try again.')
      }
    }, 800)
  }
  return <dialog ref={dialog} className="wr-dialog" aria-labelledby="reminder-review-title" aria-busy={sending} onCancel={event => { if (locked.current) event.preventDefault(); else cancel() }}>
    <div className="wr-dialog-head"><div><span className="pv-eyebrow">REVIEW RECIPIENTS & TEMPLATE</span><h2 ref={heading} tabIndex={-1} id="reminder-review-title">Review {kind}</h2></div><Button onClick={cancel} disabled={sending} aria-label="Close reminder review"><PreviewIcon icon={X} /></Button></div>
    <div className="wr-dialog-body">
      <p className="wr-review-count">{recipients.length} {recipients.length === 1 ? 'customer will' : 'customers will'} receive this reminder.</p>
      <dl className="wr-template-meta"><div><dt>Template</dt><dd>{kind}</dd></div><div><dt>Subject</dt><dd>{template.subject}</dd></div></dl>
      <div className="wr-preview-for"><label htmlFor="reminder-preview-for">Preview for</label><select id="reminder-preview-for" value={previewId} disabled={sending} onChange={event => setPreviewId(event.target.value)}>{recipients.map(claim => <option key={claim.claimNo} value={claim.claimNo}>{claim.claimNo} · {claim.customer}</option>)}</select></div>
      <div className="wr-template" aria-label="Read-only reminder message">{template.message(sample)}</div>
      <p className="wr-muted">Names, claim references, and outstanding information are personalised for each recipient. The template is fixed.</p>
      <h3>Recipients · {recipients.length}</h3><ul className="wr-recipients">{recipients.map(claim => <li key={claim.claimNo}><div><strong>{claim.claimNo}</strong><span>{claim.customer}</span><small>{claim.email}</small></div><p>Waiting for: <strong>{claim.waitingFor}</strong></p></li>)}</ul>
      {duplicates.length > 0 && <section className="wr-history-warning" aria-label="Duplicate reminder warning"><p className="wr-warning-lead"><PreviewIcon icon={WarningCircle} />{duplicates.length} selected {duplicates.length === 1 ? 'claim has' : 'claims have'} already received {kind}.</p><ul className="wr-duplicates">{duplicates.map(({ claim, last }) => <li key={claim.claimNo}><strong>{claim.claimNo}</strong> · {kind} sent on {reminderDate(last.sentAt)}<small>{claim.customer}</small></li>)}</ul><p className="wr-muted">Please confirm before sending again. Sending below will include these recipients.</p></section>}
      {error && <p role="alert" className="wr-error">{error}</p>}
    </div>
    <div className="wr-dialog-footer"><span role="status">{sending ? 'Sending reminders…' : 'Local simulation only · no emails sent'}</span><Button onClick={cancel} disabled={sending}>Cancel</Button><Button variant="primary" disabled={sending} onClick={confirmSend}>{sending ? <><span className="wr-sending-icon"><PreviewIcon icon={CircleNotch} /></span>Sending…</> : recipients.length === 1 ? 'Send reminder' : `Send ${recipients.length} reminders`}</Button></div>
  </dialog>
}
