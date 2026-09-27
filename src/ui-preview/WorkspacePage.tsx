import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CaretLeft, CaretRight, Check, ClockCountdown } from '@phosphor-icons/react'
import { Badge, Button, Panel, PreviewIcon, Tabs } from './components/primitives'
import { saveAssignments } from './data/localState'
import { sla } from './data/workbasket'
import type { RegistryClaim } from './data/registry'
import { ActionPanel } from './workspace/ActionPanel'
import { ContextPanel } from './workspace/ContextPanel'
import { Conversation } from './workspace/Conversation'
import { DocumentPreview } from './workspace/DocumentPreview'
import { AssessmentForm, ClaimDetails, Documents, History } from './workspace/WorkingViews'
import { loadWorkspace, newEvent, nextReminder, REMINDERS, storageKey, TASKS, uid, workspaceContext, type Category, type ClaimDocument, type WorkspaceState, type WorkspaceTab } from './workspace/model'
import './workspace.css'

const tabs: WorkspaceTab[] = ['Conversation', 'Details', 'Documents', 'Assessment', 'History']
export function WorkspacePage() {
  const context = workspaceContext()
  if (!context.claim) return <Panel className="ws-not-found"><h1>Claim not found</h1><p>“{context.wanted}” is not part of this preview dataset.</p><a className="pv-button" href={context.back}><PreviewIcon icon={ArrowLeft} />Back to {context.origin === 'claims' ? 'Claims' : 'Workbasket'}</a></Panel>
  return <ClaimWorkspace key={context.claim.claimNo} claim={context.claim} context={context} />
}
function ClaimWorkspace({ claim, context }: { claim: RegistryClaim; context: ReturnType<typeof workspaceContext> }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState(() => loadWorkspace(claim))
  const [tab, setTab] = useState<WorkspaceTab>('Conversation')
  const [preview, setPreview] = useState<ClaimDocument | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [storageError, setStorageError] = useState(false)
  const due = sla(claim)
  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const measure = () => rootRef.current?.style.setProperty('--ws-header-height', `${header.getBoundingClientRect().height}px`)
    const observer = new ResizeObserver(measure)
    observer.observe(header); measure()
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    try { sessionStorage.setItem(storageKey(claim.claimNo), JSON.stringify(state)); setStorageError(false) }
    catch { setStorageError(true) }
  }, [state, claim.claimNo])

  function record(title: string, detail: string, change: (current: WorkspaceState, date: string) => Partial<WorkspaceState> | null) {
    setState(current => { const event = newEvent(current, title, detail); const patch = change(current, event.date); return patch ? { ...current, ...patch, history: [...current.history, event] } : current })
    setNotice(`${title}. Saved to the local preview.`); setError('')
  }
  function assign(pic: string) {
    try {
      saveAssignments([claim.claimNo], pic)
      record('Assessor reassigned', `${state.pic} → ${pic}`, current => ({ pic, assessment: { ...current.assessment, pic }, assessmentDraft: { ...current.assessmentDraft, pic } }))
    } catch { setError('Could not save the assignment. Check browser storage and try again.') }
  }
  function changeCategory(category: Category) {
    record('Category changed', `${state.category} → ${category}`, () => ({ category }))
  }
  function sendReply() {
    if (!state.draft.trim()) { setError('Write a reply before sending.'); return }
    record('Assessor reply sent', `Mock email to ${claim.customer} · ${state.draftAttachments.length} attachment(s).`, (current, date) => ({
      messages: [...current.messages, { id: `sent-${uid()}`, sender: 'Nurul Aisyah', role: 'Claims Team', title: `Re: Your claim ${claim.claimNo}`, body: current.draft.trim(), date, documents: [...current.draftAttachments] }], draft: '', draftAttachments: [],
    }))
  }
  function sendReminder() {
    const stage = nextReminder(state)
    if (stage === null) return
    const missing = state.documents.filter(document => document.status === 'Missing').map(document => document.kind).join(', ') || 'outstanding supporting evidence'
    record(`${REMINDERS[stage]} sent`, `Mock request for ${missing}.`, (current, date) => {
      // Recheck against current state so repeated clicks cannot duplicate a stage.
      if (nextReminder(current) !== stage) return null
      const reminders = [...current.reminders]; reminders[stage] = date
      return { reminders, status: 'Waiting on customer', assessment: { ...current.assessment, status: 'Waiting on customer' }, assessmentDraft: { ...current.assessmentDraft, status: 'Waiting on customer' }, category: 'Awaiting documents', messages: [...current.messages, { id: `sent-reminder-${uid()}`, sender: 'Nurul Aisyah', role: 'Claims Team', title: `${REMINDERS[stage]} · ${claim.claimNo}`, body: `Dear ${claim.customer},\n\n${stage === 0 ? 'To assess your claim, please send' : 'We are following up on our request for'} ${missing.toLowerCase()}. You can reply directly to this email with the documents. Please let us know if you need any assistance.\n\nKind regards,\nNurul Aisyah`, date, documents: [] }] }
    })
  }
  async function addFiles(files: FileList | null, destination: 'reply' | 'documents', replace?: string) {
    if (!files?.length) return
    try {
      const uploaded: ClaimDocument[] = []
      for (const file of Array.from(files)) {
        const extension = file.name.split('.').pop()?.toLowerCase()
        const mime = ({ pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', txt: 'text/plain' } as Record<string, string>)[extension || '']
        if (!mime || file.size > 1024 * 1024) throw new Error('Use PDF, PNG, JPG, or TXT files up to 1 MB each.')
        const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Could not read the selected file.')); reader.readAsDataURL(new Blob([file], { type: mime })) })
        uploaded.push({ id: replace || `upload-${uid()}`, name: file.name, kind: replace ? state.documents.find(document => document.id === replace)!.kind : 'Additional document', status: 'Received', source: destination === 'reply' ? 'Assessor reply attachment' : 'Assessor upload', date: '', summary: '', dataUrl, mime })
      }
      const totalSize = [...state.documents.filter(document => document.id !== replace), ...uploaded].reduce((sum, document) => sum + (document.dataUrl?.length || 0), 0)
      if (totalSize > 2_500_000) throw new Error('This local preview supports about 1.8 MB of attachments per claim. Choose smaller files.')
      record(destination === 'reply' ? 'Reply attachments added' : 'Document added', uploaded.map(document => document.name).join(', '), (current, date) => ({
        documents: [...current.documents.filter(document => document.id !== replace), ...uploaded.map(document => ({ ...document, date }))],
        draftAttachments: destination === 'reply' ? [...current.draftAttachments, ...uploaded.map(document => document.id)] : current.draftAttachments,
      }))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add this file.') }
  }
  function saveAssessment() {
    const draft = state.assessmentDraft
    const claimed = Number(draft.claimed), eligible = Number(draft.eligible), deductible = Number(draft.deductible)
    if ([claimed, eligible, deductible].some(value => !Number.isFinite(value) || value < 0) || !draft.claimed || !draft.eligible || !draft.deductible) { setError('Enter a valid, non-negative amount in each financial field.'); return }
    if (eligible > claimed) { setError('Eligible amount cannot exceed the claimed amount.'); return }
    if (deductible > eligible) { setError('Deductible cannot exceed the eligible amount.'); return }
    if (!draft.rationale.trim()) { setError('Add the assessment rationale before saving.'); return }
    if (draft.followUp && draft.followUp < '2026-09-25') { setError('Follow-up must be on or after 25 Sep 2026, the preview date.'); return }
    if ((draft.status === 'Approved' || draft.status === 'Closed') && draft.recommendation === 'Pending review') { setError('Choose an assessment recommendation before approving or closing this claim.'); return }
    try { saveAssignments([claim.claimNo], draft.pic) } catch { setError('Could not save the PIC. Check browser storage and try again.'); return }
    const changes = Object.entries(draft).filter(([key, value]) => value !== state.assessment[key as keyof typeof draft]).map(([key, value]) => `${key}: ${value}`).join(' · ')
    record('Assessment saved', changes || 'Assessment reviewed.', current => {
      const completed = draft.status === 'Approved' || draft.status === 'Closed'
      const result = { ...draft, rationale: draft.rationale.trim() }
      return { assessment: result, assessmentDraft: { ...result }, status: draft.status, pic: draft.pic, category: draft.status === 'Closed' ? 'Closed' : draft.status === 'Approved' ? 'Ready for payment' : 'In assessment', tasks: current.tasks.map((value, index) => index === 3 && completed ? true : value) }
    })
  }

  return <div ref={rootRef} className="pv-workspace">
    <div ref={headerRef} className="ws-persistent-header"><div className="ws-continuity"><a href={context.back} className="ws-back"><PreviewIcon icon={ArrowLeft} />{context.origin === 'claims' ? 'Claims' : 'Workbasket'}</a><span className="ws-queue-context">{context.label}<span>· {context.index + 1} of {context.order.length}</span></span><div className="ws-prev-next">{context.previous ? <a className="pv-button" href={context.previous}><PreviewIcon icon={CaretLeft} />Previous</a> : <Button disabled><PreviewIcon icon={CaretLeft} />Previous</Button>}{context.next ? <a className="pv-button" href={context.next}>Next<PreviewIcon icon={CaretRight} /></a> : <Button disabled>Next<PreviewIcon icon={CaretRight} /></Button>}</div></div>
      <div className="ws-identity"><h1>{claim.claimNo}</h1><Badge tone={state.status === 'Approved' ? 'success' : state.status === 'In review' ? 'accent' : 'neutral'}>{state.status}</Badge><strong>{claim.customer}</strong><span>{claim.claimType}</span><span className="ws-header-pic">PIC: <b>{state.pic}</b></span><span className={`ws-header-sla ${due.urgent ? 'is-urgent' : ''}`}><PreviewIcon icon={ClockCountdown} />{state.status === 'Approved' || state.status === 'Closed' ? 'SLA complete' : due.label}</span></div>
    </div>
    <Tabs label="Workspace views" items={tabs.map(value => ({ id: value, label: value }))} value={tab} onChange={value => setTab(value as WorkspaceTab)}>
      <div className={`ws-columns ${tab === 'Assessment' || tab === 'Details' ? 'ws-columns--form' : ''}`}>
        <ContextPanel claim={claim} state={state} />
        <Panel className="ws-working-area" aria-label={`${tab} working area`}>
          {tab === 'Conversation' && <Conversation claim={claim} state={state} draftChanged={draft => setState(current => ({ ...current, draft }))} removeAttachment={id => setState(current => ({ ...current, draftAttachments: current.draftAttachments.filter(item => item !== id) }))} attach={files => { void addFiles(files, 'reply') }} send={sendReply} preview={setPreview} />}
          {tab === 'Details' && <ClaimDetails claim={claim} state={state} />}
          {tab === 'Documents' && <Documents state={state} preview={setPreview} upload={(files, replace) => { void addFiles(files, 'documents', replace) }} verify={id => record('Document verified', state.documents.find(document => document.id === id)!.name, current => ({ documents: current.documents.map(document => document.id === id ? { ...document, status: 'Verified' } : document) }))} />}
          {tab === 'Assessment' && <AssessmentForm state={state} change={fields => setState(current => ({ ...current, assessmentDraft: { ...current.assessmentDraft, ...fields } }))} save={saveAssessment} reset={() => { setState(current => ({ ...current, assessmentDraft: { ...current.assessment } })); setError('') }} />}
          {tab === 'History' && <History state={state} />}
        </Panel>
        <ActionPanel state={state} onCategory={changeCategory} onAssign={assign} onReminder={sendReminder} onTask={index => record(state.tasks[index] ? 'Task reopened' : 'Task completed', TASKS[index], current => ({ tasks: current.tasks.map((value, item) => item === index ? !value : value) }))} onNote={text => record('Internal note added', text, (current, date) => ({ notes: [...current.notes, { id: uid(), text, date }] }))} onAssessment={() => setTab('Assessment')} />
      </div>
    </Tabs>
    <div className={`ws-feedback ${error || notice || storageError ? 'has-message' : ''}`}>{error ? <p role="alert">{error}</p> : <p role="status">{notice && <PreviewIcon icon={Check} />}{notice || 'Local preview · synthetic claim and document data · all times MYT'}</p>}{storageError && <p role="alert">Browser storage is full or unavailable. Changes remain in this page but may be lost on navigation.</p>}</div>
    {preview && <DocumentPreview document={preview} onClose={() => setPreview(null)} />}
  </div>
}
