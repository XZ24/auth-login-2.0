import { useEffect, useRef, useState } from 'react'
import { Claim } from '../data/mockClaims'
import {
  streamClaimSummary,
  ClaimSummaryMeta,
  ClaimSummaryStage,
  ClaimSummaryAttachmentDetail,
} from '../api'
import { Markdown } from './Markdown'
import {
  Sparkles,
  RefreshCw,
  Mail,
  Paperclip,
  FileText,
  AlertCircle,
  CheckCircle2,
  MinusCircle,
  SkipForward,
  XCircle,
} from 'lucide-react'

interface ClaimSummaryPanelProps {
  claim: Claim
}

const attachmentStatusStyles: Record<
  ClaimSummaryAttachmentDetail['status'],
  { icon: typeof CheckCircle2; className: string; label: string }
> = {
  extracted: { icon: CheckCircle2, className: 'text-green-600', label: 'Extracted' },
  empty: { icon: MinusCircle, className: 'text-slate-400', label: 'Empty' },
  skipped: { icon: SkipForward, className: 'text-amber-600', label: 'Skipped' },
  error: { icon: XCircle, className: 'text-red-600', label: 'Error' },
}

const stageLabels: Record<ClaimSummaryStage, string> = {
  extracting: 'Reading emails & documents…',
  summarizing: 'Generating summary…',
}

export function ClaimSummaryPanel({ claim }: ClaimSummaryPanelProps) {
  const [summary, setSummary] = useState('')
  const [meta, setMeta] = useState<ClaimSummaryMeta | null>(null)
  const [stage, setStage] = useState<ClaimSummaryStage | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [noContentMessage, setNoContentMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function generate() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSummary('')
    setMeta(null)
    setStage(null)
    setError(null)
    setNoContentMessage(null)
    setStreaming(true)

    try {
      await streamClaimSummary(
        claim.claimNumber,
        {
          onProgress: s => {
            if (!controller.signal.aborted) setStage(s)
          },
          onMeta: m => {
            if (!controller.signal.aborted) setMeta(m)
          },
          onToken: t => {
            if (!controller.signal.aborted) setSummary(prev => prev + t)
          },
          onDone: result => {
            if (controller.signal.aborted) return
            if (!result.ok) {
              setNoContentMessage(result.message || 'No content found for this claim')
            }
          },
          onError: err => {
            if (!controller.signal.aborted) {
              setError(`${err.detail}${err.status ? ` (${err.status})` : ''}`)
            }
          },
        },
        controller.signal,
      )
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to generate summary')
      }
    } finally {
      if (!controller.signal.aborted) {
        setStreaming(false)
        setStage(null)
      }
    }
  }

  // Auto-generate once when a claim is opened; regenerate when the claim changes.
  useEffect(() => {
    generate()
    return () => abortRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim.claimNumber])

  const showInitialLoader = streaming && !summary && !meta && !error && !noContentMessage

  // Total attachments across every email under this claim.
  const attachmentCount = claim.communications.reduce(
    (sum, c) => sum + (c.attachments?.length ?? 0),
    0,
  )

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
            <Sparkles size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">AI Assessor Briefing</h3>
            <p className="text-xs text-slate-400">
              Generated from all emails &amp; attachment text for {claim.claimNumber}
            </p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={streaming}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw size={15} className={streaming ? 'animate-spin' : ''} />
          {streaming ? 'Generating…' : 'Regenerate'}
        </button>
      </div>

      {/* Streaming status */}
      {streaming && stage && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          {stageLabels[stage]}
        </div>
      )}

      {/* Initial loading skeleton (before any tokens arrive) */}
      {showInitialLoader && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
          <div className="skeleton h-3.5 w-11/12" />
          <div className="skeleton h-3.5 w-10/12" />
          <div className="skeleton h-3.5 w-9/12" />
          <div className="skeleton h-3.5 w-8/12" />
          <div className="skeleton h-3.5 w-6/12" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Couldn't generate summary</p>
            <p className="text-xs text-red-600 mt-1 break-words">{error}</p>
          </div>
        </div>
      )}

      {/* No content */}
      {noContentMessage && !error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-700">{noContentMessage}</p>
            <p className="text-xs text-amber-600 mt-1">
              There are no readable emails or attachment text to summarize yet.
            </p>
          </div>
        </div>
      )}

      {/* Stats (from meta) */}
      {meta && !error && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
            <Mail size={18} className="text-slate-400" />
            <div>
              <p className="text-lg font-semibold text-slate-800">{meta.total_messages}</p>
              <p className="text-xs text-slate-400">Emails</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
            <Paperclip size={18} className="text-slate-400" />
            <div>
              <p className="text-lg font-semibold text-slate-800">{attachmentCount}</p>
              <p className="text-xs text-slate-400">Attachments</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
            <FileText size={18} className="text-slate-400" />
            <div>
              <p className="text-lg font-semibold text-slate-800">
                {meta.context_chars.toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">Context chars</p>
            </div>
          </div>
        </div>
      )}

      {/* Briefing text (streams in) */}
      {summary && !error && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <Markdown content={summary} />
          {streaming && (
            <span className="inline-block w-2 h-4 -mb-0.5 bg-blue-500 animate-pulse align-middle" />
          )}
        </div>
      )}

      {/* Attachment extraction details (from meta) */}
      {meta && meta.attachment_details.length > 0 && !error && (
        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-4 border-b border-slate-100">
            <h4 className="text-sm font-medium text-slate-800 flex items-center gap-2">
              <Paperclip size={15} /> Attachment extraction
            </h4>
          </div>
          <div className="divide-y divide-slate-100">
            {meta.attachment_details.map(att => {
              const style = attachmentStatusStyles[att.status]
              const Icon = style.icon
              return (
                <div
                  key={att.attachment_id}
                  className="p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 truncate">{att.filename}</p>
                      {att.reason && (
                        <p className="text-xs text-slate-400 truncate">{att.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {typeof att.chars === 'number' && (
                      <span className="text-xs text-slate-400">
                        {att.chars.toLocaleString()} chars
                      </span>
                    )}
                    <span className={`flex items-center gap-1 text-xs font-medium ${style.className}`}>
                      <Icon size={14} />
                      {style.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
