import { useContextDisclosure } from './useContextDisclosure'
import { useState } from 'react'
import { ArrowRight, Check, Circle, ClockCountdown, NotePencil, UserPlus } from '@phosphor-icons/react'
import { Badge, Button, PreviewIcon } from '../components/primitives'
import { PIC_OPTIONS } from '../data/localState'
import { CATEGORIES, nextReminder, REMINDERS, replyReceived, stamp, TASKS, type Category, type WorkspaceState } from './model'

export function ActionPanel({ state, onCategory, onAssign, onReminder, onTask, onNote, onAssessment }: {
  state: WorkspaceState; onCategory: (value: Category) => void; onAssign: (pic: string) => void; onReminder: () => void
  onTask: (index: number) => void; onNote: (text: string) => void; onAssessment: () => void
}) {
  const disclosure = useContextDisclosure()
  const [edit, setEdit] = useState<'category' | 'pic' | 'note' | null>(null)
  const [category, setCategory] = useState(state.category), [pic, setPic] = useState(state.pic), [note, setNote] = useState('')
  const next = nextReminder(state), replied = replyReceived(state), finished = state.status === 'Closed' || state.status === 'Approved'
  const latestReply = [...state.messages].reverse().find(message => message.role === 'Customer')
  return <details className="ws-side-panel ws-actions" {...disclosure}><summary><h2>Actions</h2><span>Next steps</span></summary><div className="ws-side-content">
    <section className="ws-next-action"><div className="pv-eyebrow">NEXT ACTION</div><h3>{finished ? state.status === 'Closed' ? 'Claim complete' : 'Ready for payment' : state.category === 'In assessment' ? 'Complete assessment' : replied ? 'Review customer response' : next === 0 ? 'Review this new claim' : 'Follow up on documents'}</h3><p>{finished ? 'Review the record and audit history below.' : replied ? 'Check the new information against the policy and requested documents.' : 'Confirm what is outstanding before contacting the customer.'}</p><Badge tone={replied ? 'accent' : 'neutral'}>{state.category}</Badge>{latestReply && <small className="ws-action-time">Customer replied · {stamp(latestReply.date)}</small>}
    {replied && state.category === 'Customer replied' && !finished ? <Button variant="primary" onClick={() => onCategory('In assessment')}><PreviewIcon icon={Check} />Details received</Button> : !finished && <Button variant="primary" onClick={onAssessment}>Open assessment<PreviewIcon icon={ArrowRight} /></Button>}
    <div className="ws-action-links"><Button variant="ghost" onClick={() => { setCategory(state.category); setEdit(edit === 'category' ? null : 'category') }}>Change category</Button><Button variant="ghost" onClick={() => { setPic(state.pic); setEdit(edit === 'pic' ? null : 'pic') }}><PreviewIcon icon={UserPlus} />Reassign</Button></div>
    {edit === 'category' && <form className="ws-inline-editor" onSubmit={event => { event.preventDefault(); onCategory(category); setEdit(null) }}><label htmlFor="ws-category">Category</label><select id="ws-category" value={category} onChange={event => setCategory(event.target.value as Category)}>{CATEGORIES.map(value => <option key={value}>{value}</option>)}</select><Button type="submit">Save category</Button></form>}
    {edit === 'pic' && <form className="ws-inline-editor" onSubmit={event => { event.preventDefault(); onAssign(pic); setEdit(null) }}><label htmlFor="ws-pic">Assign to</label><select id="ws-pic" value={pic} onChange={event => setPic(event.target.value)}>{PIC_OPTIONS.map(value => <option key={value}>{value}</option>)}</select><Button type="submit">Apply assignment</Button></form>}
    </section>
    <section><div className="ws-side-heading"><h3>Reminder progress</h3><PreviewIcon icon={ClockCountdown} /></div><ol className="ws-reminders">{REMINDERS.map((label, index) => <li key={label}><span className={state.reminders[index] ? 'ws-done' : 'ws-muted'}><PreviewIcon icon={state.reminders[index] ? Check : Circle} /></span><div><strong>{label}</strong><small>{state.reminders[index] ? `Sent ${stamp(state.reminders[index]!)}` : replied || finished || next === null ? 'Not required' : 'Not sent'}</small></div></li>)}</ol>
    {state.reminders.every(Boolean) ? <p className="ws-reminder-note">No reminders remaining.</p> : replied ? <p className="ws-reminder-note">Customer has replied. Further reminders are not required.</p> : next !== null ? <Button onClick={onReminder}>{next === 0 ? 'Send Initial Request' : `Send ${REMINDERS[next]}`}</Button> : <p className="ws-reminder-note">No reminder action required.</p>}
    </section>
    <section><div className="ws-side-heading"><h3>Tasks</h3><span>{state.tasks.filter(Boolean).length} / {TASKS.length}</span></div><div className="ws-tasks">{TASKS.map((task, index) => <label key={task}><input type="checkbox" checked={state.tasks[index]} onChange={() => onTask(index)} /><span className={state.tasks[index] ? 'is-done' : ''}>{task}</span></label>)}</div></section>
    <section><div className="ws-side-heading"><h3>Internal notes</h3><PreviewIcon icon={NotePencil} /></div><div className="ws-note-history">{state.notes.length ? [...state.notes].reverse().map(item => <article key={item.id}><p>{item.text}</p><small>Assessor · {stamp(item.date)}</small></article>) : <p className="ws-muted">No internal notes yet.</p>}</div>{edit === 'note' ? <form className="ws-inline-editor" onSubmit={event => { event.preventDefault(); if (note.trim()) { onNote(note.trim()); setNote(''); setEdit(null) } }}><label htmlFor="ws-note">Note for the claims team</label><textarea id="ws-note" value={note} onChange={event => setNote(event.target.value)} rows={3} required maxLength={2000} autoFocus /><div><Button type="submit" disabled={!note.trim()}>Save note</Button><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></div></form> : <Button variant="ghost" onClick={() => setEdit('note')}><PreviewIcon icon={NotePencil} />Add note</Button>}</section>
  </div></details>
}
