import { useState, useRef, useEffect } from 'react'
import { Claim, Communication, CommunicationAttachment } from '../data/mockClaims'
import { API_BASE, streamAttachmentTranslation } from '../api'
import { Markdown } from './Markdown'
import { Send, Reply, Mail, Paperclip, ChevronDown, ChevronRight, FileText, Image, X, ChevronLeft, ChevronRight as ChevronRightIcon, Download, Eye, Languages, Loader2, AlertCircle } from 'lucide-react'

interface EmailPanelProps {
  claim: Claim
}

// const templates = [
//   { id: 'missing_doc', label: 'Request Missing Documents', body: 'Dear {claimant},\n\nWe are processing your claim {claimNo} and require the following additional document(s):\n\n1. [Document Name]\n\nPlease submit within 14 days to avoid delays in processing.\n\nRegards,\nEtiqa Claims Team' },
//   { id: 'clarification', label: 'Request Clarification', body: 'Dear {claimant},\n\nRegarding your claim {claimNo}, we require further clarification on the following:\n\n[Details]\n\nPlease respond at your earliest convenience.\n\nRegards,\nEtiqa Claims Team' },
//   { id: 'approval', label: 'Claim Approved', body: 'Dear {claimant},\n\nWe are pleased to inform you that your claim {claimNo} has been approved.\n\nApproved Amount: {currency} {amount}\n\nPayment will be processed within 5-7 working days to your registered bank account.\n\nRegards,\nEtiqa Claims Team' },
//   { id: 'partial', label: 'Partial Approval', body: 'Dear {claimant},\n\nYour claim {claimNo} has been assessed. We are approving a partial amount as follows:\n\nClaimed: {currency} {claimedAmount}\nApproved: {currency} {amount}\n\nReason for partial approval:\n[Reason]\n\nIf you have additional supporting documents, please submit them for reconsideration.\n\nRegards,\nEtiqa Claims Team' },
//   { id: 'rejection', label: 'Claim Rejected', body: 'Dear {claimant},\n\nAfter careful review of your claim {claimNo}, we regret to inform you that the claim has been declined.\n\nReason: [Reason]\n\nYou may appeal this decision within 30 days by providing additional supporting documentation.\n\nRegards,\nEtiqa Claims Team' },
// ]

export function EmailPanel({ claim }: EmailPanelProps) {
  // Derive the claimant's actual email from the most recent inbound communication
  const lastInbound = [...claim.communications].reverse().find(c => c.direction === 'inbound')
  const claimantEmail = lastInbound?.from || claim.claimant.email || claim.smileAppEmail

  const [showCompose, setShowCompose] = useState(false)
  const [composeBody, setComposeBody] = useState('')
  const [composeSubject, setComposeSubject] = useState(`Re: ${claim.claimNumber}`)
  const [composeRecipient, setComposeRecipient] = useState(claimantEmail)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(
    claim.communications.length > 0 ? claim.communications[claim.communications.length - 1].id : null
  )
  const [lightbox, setLightbox] = useState<{ attachments: CommunicationAttachment[]; index: number } | null>(null)

  const handleSend = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(composeRecipient)}?subject=${encodeURIComponent(composeSubject)}&body=${encodeURIComponent(composeBody)}`
    window.open(mailtoUrl, '_blank')
  }

  // const handleTemplateSelect = (templateId: string) => {
  //   const template = templates.find(t => t.id === templateId)
  //   if (template) {
  //     const body = template.body
  //       .replace('{claimant}', claim.claimant.fullName.split(' ')[0])
  //       .replace('{claimNo}', claim.claimNumber)
  //       .replace('{currency}', 'MYR')
  //       .replace('{amount}', claim.aiRecommendation?.suggestedAmount?.toLocaleString() ?? '')
  //       .replace('{claimedAmount}', claim.customerClaimAmount.toLocaleString())
  //     setComposeBody(body)
  //     setComposeSubject(`${claim.claimNumber}: ${template.label}`)
  //     setShowCompose(true)
  //   }
  // }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {/* <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            <Send size={14} /> Compose
          </button>
          <div className="relative">
            <select
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="appearance-none text-sm px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 pr-8 cursor-pointer hover:border-slate-300"
              defaultValue=""
            >
              <option value="" disabled>Use Template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span>{claim.communications.length} messages</span>
          <span className="flex items-center gap-1 text-blue-600">
            <Mail size={14} />
            {claim.communications.filter(c => !c.read && c.direction === 'inbound').length} unread
          </span>
        </div>
      </div> */}

      {/* Compose Area */}
      {showCompose && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-slate-500 w-12">To:</span>
              <input
                type="email"
                value={composeRecipient}
                onChange={(e) => setComposeRecipient(e.target.value)}
                className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm"
              />
            </div>
            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-slate-500 w-12">Subject:</span>
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm"
              />
            </div>
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Type your message..."
              className="w-full h-40 p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between mt-3">
              <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
                <Paperclip size={14} /> Attach
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {claim.communications.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Mail size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No communications yet</p>
            <p className="text-xs mt-1">Send the first message to the claimant</p>
          </div>
        ) : (
          [...claim.communications].reverse().map(comm => (
            <EmailMessage
              key={comm.id}
              communication={comm}
              expanded={expandedEmail === comm.id}
              onToggle={() => setExpandedEmail(expandedEmail === comm.id ? null : comm.id)}
              onAttachmentClick={(idx) => {
                if (comm.attachments) {
                  setLightbox({ attachments: comm.attachments, index: idx })
                }
              }}
              onReply={() => {
                setComposeRecipient(comm.direction === 'inbound' ? comm.from : claimantEmail)
                setComposeSubject(`Re: ${comm.subject}`)
                setComposeBody(`\n\n--- Original Message ---\nFrom: ${comm.from}\nDate: ${new Date(comm.timestamp).toLocaleString()}\n\n${comm.body}`)
                setShowCompose(true)
              }}
            />
          ))
        )}

        {/* SLA Warning */}
        {/* claimStatus not reliable — disabled Pending Info warning
        {claim.claimStatus === 'Pending Info' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <Clock size={14} />
              <span className="font-medium">Awaiting customer response</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Last request sent {Math.floor((Date.now() - new Date(claim.communications[claim.communications.length - 1]?.timestamp ?? '').getTime()) / (1000 * 60 * 60 * 24))} days ago.
              Auto-reminder will be sent after 7 days of no response.
            </p>
          </div>
        )}
        */}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <AttachmentLightbox
          attachments={lightbox.attachments}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(idx) => setLightbox({ ...lightbox, index: idx })}
        />
      )}
    </div>
  )
}

function EmailMessage({ communication, expanded, onToggle, onAttachmentClick, onReply }: {
  communication: Communication
  expanded: boolean
  onToggle: () => void
  onAttachmentClick: (index: number) => void
  onReply: () => void
}) {
  const isInbound = false;

  return (
    <div className={`rounded-lg border ${isInbound ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-white'} ${!communication.read && isInbound ? 'ring-2 ring-blue-300' : ''}`}>
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
          {communication.read ? (
            <Mail size={16} className="text-slate-400" />
          ) : (
            <Mail size={16} className="text-slate-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                {isInbound ? communication.from : `To: ${communication.to}`}
              </span>
              {!communication.read && isInbound && (
                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">NEW</span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate max-w-md">{communication.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {communication.attachments && communication.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Paperclip size={12} /> {communication.attachments.length}
            </span>
          )}
          <span className="text-xs text-slate-400">
            {new Date(communication.timestamp).toLocaleDateString()} {new Date(communication.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isInbound && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">Inbound</span>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          {communication.bodyHtml ? (
            <HtmlBody html={communication.bodyHtml} />
          ) : (
            <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">
              {communication.body}
            </pre>
          )}
          {communication.attachments && communication.attachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                <Paperclip size={12} /> {communication.attachments.length} attachment{communication.attachments.length > 1 ? 's' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {communication.attachments.map((att, idx) => {
                  const displayName = att.filename === '@' ? `Attachment ${idx + 1}` : att.filename
                  const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(att.filename)
                  return (
                    <button
                      key={att.id}
                      onClick={() => onAttachmentClick(idx)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 cursor-pointer transition-colors"
                    >
                      {isImage ? <Image size={13} className="text-blue-400" /> : <FileText size={13} className="text-slate-400" />}
                      <span className="max-w-[180px] truncate">{displayName}</span>
                      <Eye size={11} className="text-slate-400 ml-0.5" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={onReply}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <Reply size={14} /> Reply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AttachmentLightbox({ attachments, index, onClose, onNavigate }: {
  attachments: CommunicationAttachment[]
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  const att = attachments[index]
  const filename = att.filename
  const previewPath = `${API_BASE}/attachments/${att.id}/inline`
  // Hide the browser PDF viewer's toolbar/sidebar for a clean, simple render.
  const pdfPreviewPath = `${previewPath}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
  const downloadPath = `${API_BASE}/attachments/${att.id}/download`
  const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(filename)
  const isPdf = /\.pdf$/i.test(filename)
  const canTranslate = /\.(pdf|png|jpe?g)$/i.test(filename)

  const [view, setView] = useState<'preview' | 'translation'>('preview')
  const translation = useAttachmentTranslation(att.id)

  // Reset back to the preview whenever the attachment changes.
  useEffect(() => {
    setView('preview')
  }, [att.id])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
    if (e.key === 'ArrowRight' && index < attachments.length - 1) onNavigate(index + 1)
  }

  const handleTranslate = () => {
    setView('translation')
    translation.start()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={(el) => el?.focus()}
    >
      <div
        className={`relative bg-white rounded-xl shadow-2xl ${view === 'translation' ? 'max-w-6xl' : 'max-w-4xl'} max-h-[90vh] w-full mx-4 flex flex-col transition-[max-width] duration-300 ease-out`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2 min-w-0">
            {isImage ? <Image size={16} className="text-blue-500 shrink-0" /> : <FileText size={16} className="text-slate-500 shrink-0" />}
            <span className="text-sm font-medium text-slate-700 truncate">{filename}</span>
            <span className="text-xs text-slate-400 shrink-0">({index + 1} of {attachments.length})</span>
          </div>
          <div className="flex items-center gap-1">
            {canTranslate && (
              view === 'translation' ? (
                <button
                  onClick={() => setView('preview')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100"
                  title="Back to document preview"
                >
                  <Eye size={14} /> Preview
                </button>
              ) : (
                <button
                  onClick={handleTranslate}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50"
                  title="Run OCR + translation on this document"
                >
                  <Languages size={14} /> Translate
                </button>
              )
            )}
            <a
              href={downloadPath}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700"
              title="Open in new tab"
            >
              <Download size={16} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'translation' ? (
          <div className="flex-1 overflow-hidden grid grid-cols-2 divide-x divide-slate-200 min-h-[300px]">
            {/* Document on the left */}
            <div className="overflow-auto flex items-center justify-center p-4 bg-slate-50">
              {isImage ? (
                <img
                  src={previewPath}
                  alt={filename}
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
                />
              ) : isPdf ? (
                <iframe
                  src={pdfPreviewPath}
                  title={filename}
                  className="w-full h-[70vh] rounded border border-slate-200"
                />
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">{filename}</p>
                </div>
              )}
            </div>
            {/* Translation on the right */}
            <TranslationView translation={translation} onRetry={handleTranslate} />
          </div>
        ) : (
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[300px] bg-slate-50">
            {isImage ? (
              <img
                src={previewPath}
                alt={filename}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
              />
            ) : isPdf ? (
              <iframe
                src={pdfPreviewPath}
                title={filename}
                className="w-full h-[70vh] rounded border border-slate-200"
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">{filename}</p>
                <a
                  href={downloadPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                >
                  Open file
                </a>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {attachments.length > 1 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-200">
            <button
              disabled={index === 0}
              onClick={() => onNavigate(index - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <div className="flex gap-1">
              {attachments.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-blue-500' : 'bg-slate-300 hover:bg-slate-400'}`}
                />
              ))}
            </div>
            <button
              disabled={index === attachments.length - 1}
              onClick={() => onNavigate(index + 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRightIcon size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface TranslatedPage {
  page: number
  ocrText: string
  translated: string
  done: boolean
}

type TranslationController = ReturnType<typeof useAttachmentTranslation>

// Manages the OCR + translation stream for a single attachment id.
function useAttachmentTranslation(attachmentId: number) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [pages, setPages] = useState<TranslatedPage[]>([])
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const startedRef = useRef(false)

  // Reset whenever the target attachment changes; abort any in-flight stream.
  useEffect(() => {
    abortRef.current?.abort()
    startedRef.current = false
    setStatus('idle')
    setPages([])
    setDocumentName(null)
    setError(null)
    return () => abortRef.current?.abort()
  }, [attachmentId])

  const start = () => {
    // Only run once per attachment (unless a retry resets startedRef).
    if (startedRef.current) return
    startedRef.current = true

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('running')
    setPages([])
    setError(null)

    streamAttachmentTranslation(
      attachmentId,
      {
        onDocStart: doc => {
          if (!controller.signal.aborted) setDocumentName(doc)
        },
        onPages: (doc, incoming) => {
          if (controller.signal.aborted) return
          setDocumentName(doc)
          setPages(
            incoming
              .slice()
              .sort((a, b) => a.page - b.page)
              .map(p => ({ page: p.page, ocrText: p.ocr_text, translated: '', done: false })),
          )
        },
        onToken: (page, delta) => {
          if (controller.signal.aborted) return
          setPages(prev =>
            prev.map(p => (p.page === page && !p.done ? { ...p, translated: p.translated + delta } : p)),
          )
        },
        onPageDone: (page, translatedText) => {
          if (controller.signal.aborted) return
          setPages(prev =>
            prev.map(p => (p.page === page ? { ...p, translated: translatedText, done: true } : p)),
          )
        },
        onDocError: (_doc, err) => {
          if (controller.signal.aborted) return
          setStatus('error')
          setError(err)
        },
        onDone: () => {
          if (controller.signal.aborted) return
          setStatus(prev => (prev === 'error' ? prev : 'done'))
        },
        onError: err => {
          if (controller.signal.aborted) return
          setStatus('error')
          setError(`${err.detail}${err.status ? ` (${err.status})` : ''}`)
        },
      },
      controller.signal,
    ).catch(err => {
      if (!controller.signal.aborted) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Translation failed')
      }
    })
  }

  const retry = () => {
    startedRef.current = false
    start()
  }

  return { status, pages, documentName, error, start, retry }
}

function TranslationView({ translation, onRetry }: {
  translation: TranslationController
  onRetry: () => void
}) {
  const { status, pages, error } = translation

  return (
    <div className="flex-1 overflow-auto p-4 min-h-[300px] bg-slate-50 space-y-4 animate-slide-in-right">
      {status === 'running' && pages.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 size={16} className="animate-spin" />
          Reading document (OCR)…
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-700">Couldn't translate this document</p>
            <p className="text-xs text-red-600 mt-1 break-words">{error}</p>
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {pages.map(page => (
        <div key={page.page} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/60">
            <span className="text-xs font-medium text-slate-600">Page {page.page}</span>
            {page.done ? (
              <span className="text-xs text-green-600 font-medium">Translated</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <Loader2 size={12} className="animate-spin" /> Translating…
              </span>
            )}
          </div>
          <div className="p-3">
            {page.translated ? (
              <Markdown content={page.translated} />
            ) : (
              <p className="text-xs text-slate-300">{page.done ? '— empty —' : '…'}</p>
            )}
          </div>
        </div>
      ))}

      {status === 'done' && pages.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <FileText size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No pages were found to translate.</p>
        </div>
      )}
    </div>
  )
}

/** Renders HTML email body inside a sandboxed iframe that auto-sizes to its content */
function HtmlBody({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // Rewrite root-relative URLs (e.g. /attachments/1893/inline) to absolute
    // URLs against the backend API base so inline images and links resolve.
    const rewritten = html.replace(
      /(\s(?:src|href))=(["'])(\/[^"']*)\2/gi,
      (_m, attr, quote, path) => `${attr}=${quote}${API_BASE}${path}${quote}`
    )

    // Write the HTML with a base style reset and responsive layout
    doc.open()
    doc.write(`<!DOCTYPE html>
<html><head><base href="${API_BASE}/"><style>
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         font-size: 14px; line-height: 1.6; color: #334155; word-break: break-word; }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
  table { max-width: 100% !important; }
  pre { white-space: pre-wrap; }
</style></head><body>${rewritten}</body></html>`)
    doc.close()

    // Auto-resize the iframe to fit its content
    const resize = () => {
      if (doc.body) {
        iframe.style.height = doc.body.scrollHeight + 'px'
      }
    }
    resize()
    // Resize again after images load
    const images = doc.querySelectorAll('img')
    images.forEach(img => img.addEventListener('load', resize))
    // Also resize after a short delay for late-rendering content
    const timer = setTimeout(resize, 300)
    return () => clearTimeout(timer)
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      title="Email body"
      className="w-full border-0 min-h-[100px]"
      style={{ height: '100px' }}
    />
  )
}
