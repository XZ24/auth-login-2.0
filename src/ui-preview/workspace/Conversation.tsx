import { useRef } from 'react'
import { CaretDown, ChatCircleText, FileText, Paperclip, PaperPlaneTilt, X } from '@phosphor-icons/react'
import { Badge, Button, PreviewIcon } from '../components/primitives'
import type { RegistryClaim } from '../data/registry'
import { customerEmail, stamp, type ClaimDocument, type WorkspaceState } from './model'

export function Conversation({ claim, state, draftChanged, removeAttachment, attach, send, preview }: {
  claim: RegistryClaim; state: WorkspaceState; draftChanged: (text: string) => void; removeAttachment: (id: string) => void
  attach: (files: FileList | null) => void; send: () => void; preview: (document: ClaimDocument) => void
}) {
  const upload = useRef<HTMLInputElement>(null)
  const latestCustomer = [...state.messages].reverse().find(message => message.role === 'Customer')?.id
  const templates: Record<string, string> = {
    acknowledge: `Dear ${claim.customer},\n\nThank you for the additional documents. We have received them and will continue our assessment of claim ${claim.claimNo}. We will contact you if any further information is needed.\n\nKind regards,\nNurul Aisyah`,
    clarify: `Dear ${claim.customer},\n\nThank you for your response regarding claim ${claim.claimNo}. Could you please clarify the incident date and confirm that the attached documents relate to this trip?\n\nKind regards,\nNurul Aisyah`,
    update: `Dear ${claim.customer},\n\nWe are reviewing your claim ${claim.claimNo} against the policy benefits and the supporting documents. We will share the outcome once the assessment is complete.\n\nKind regards,\nNurul Aisyah`,
  }
  return <>
    <div className="ws-centre-heading"><div><h2>Claim conversation</h2><p>Customer emails, reminders, and replies in one thread.</p></div><Badge>{state.messages.filter(message => message.role !== 'System').length} messages</Badge></div>
    <div className="ws-thread">
      {!state.messages.length && <div className="ws-empty"><PreviewIcon icon={ChatCircleText} size="illustration" /><h3>No communication yet</h3><p>Review the new claim, then send the initial document request or write a reply below.</p></div>}
      {state.messages.map(message => message.role === 'System' ? <div key={message.id} className="ws-system-event"><span className="ws-timeline-dot" /><div><span>{message.title}</span><small>{stamp(message.date)} · System</small></div></div> : <details key={message.id} className={`ws-message ${message.role === 'Customer' ? 'is-customer' : ''}`} open={message.id === latestCustomer || message.id.startsWith('sent-')}>
        <summary><span className={`ws-message-avatar ${message.role === 'Customer' ? 'is-customer' : ''}`}>{message.sender.split(' ').slice(0, 2).map(part => part[0]).join('')}</span><span className="ws-message-heading"><span><strong>{message.sender}</strong><small>{message.role}</small></span><span className="ws-subject">{message.title}</span></span><span className="ws-message-date"><time dateTime={message.date}>{stamp(message.date)}</time>{message.documents.length > 0 && <span><PreviewIcon icon={Paperclip} />{message.documents.length}</span>}</span><PreviewIcon icon={CaretDown} /></summary>
        <div className="ws-message-content"><p>{message.body}</p>{message.documents.length > 0 && <div className="ws-message-files">{message.documents.map(id => { const document = state.documents.find(item => item.id === id); return document && <div className="ws-file" key={id}><PreviewIcon icon={FileText} /><span>{document.name}<small>{document.kind}</small></span><Button variant="ghost" onClick={() => preview(document)}>Preview</Button></div> })}</div>}</div>
      </details>)}
    </div>
    <form className="ws-composer" onSubmit={event => { event.preventDefault(); send() }}>
      <div className="ws-composer-heading"><h3>Reply to customer</h3><span>Mock send</span></div>
      <div className="ws-recipient"><span>To</span><span>{customerEmail(claim)}</span></div>
      <label className="pv-sr-only" htmlFor="workspace-reply">Reply text</label><textarea id="workspace-reply" value={state.draft} onChange={event => draftChanged(event.target.value)} placeholder="Write a clear next step for the customer…" rows={5} required />
      {state.draftAttachments.length > 0 && <div className="ws-draft-files">{state.draftAttachments.map(id => { const document = state.documents.find(item => item.id === id); return document && <span key={id}><PreviewIcon icon={Paperclip} />{document.name}<button type="button" aria-label={`Remove ${document.name} from reply`} onClick={() => removeAttachment(id)}><PreviewIcon icon={X} /></button></span> })}</div>}
      <div className="ws-compose-actions"><label><span className="pv-sr-only">Reply template</span><select aria-label="Reply template" value="" onChange={event => { if (templates[event.target.value]) draftChanged(state.draft.trim() ? `${state.draft}\n\n${templates[event.target.value]}` : templates[event.target.value]) }}><option value="">Insert template</option><option value="acknowledge">Acknowledge documents</option><option value="clarify">Request clarification</option><option value="update">Assessment update</option></select></label><input ref={upload} className="pv-sr-only" type="file" accept=".pdf,.png,.jpg,.jpeg,.txt" multiple aria-label="Attach files to reply" onChange={event => { attach(event.target.files); event.target.value = '' }} /><Button onClick={() => upload.current?.click()}><PreviewIcon icon={Paperclip} />Attach</Button><Button type="submit" variant="primary" disabled={!state.draft.trim()}><PreviewIcon icon={PaperPlaneTilt} />Send reply</Button></div>
      <p className="ws-local-caption">Draft stays with this claim when switching tabs. No email is sent.</p>
    </form>
  </>
}
