import { Claim } from '../data/mockClaims'
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpCircle,
  FileWarning,
  ShieldAlert,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Zap,
} from 'lucide-react'

interface AIDecisionPanelProps {
  claim: Claim
}

const decisionStyles: Record<string, { bg: string; border: string; text: string; icon: typeof CheckCircle2 }> = {
  'Approve': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle2 },
  'Reject': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: XCircle },
  'Partial Approve': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
  'Escalate': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: ArrowUpCircle },
}

const riskSeverityColors: Record<string, string> = {
  'low': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'medium': 'bg-orange-100 text-orange-700 border-orange-200',
  'high': 'bg-red-100 text-red-700 border-red-200',
}

export function AIDecisionPanel({ claim }: AIDecisionPanelProps) {
  const rec = claim.aiRecommendation

  if (!rec) {
    return (
      <div className="p-6 text-center text-slate-400">
        <Brain size={48} className="mx-auto mb-3 opacity-50" />
        <p>AI analysis not yet available for this claim</p>
      </div>
    )
  }

  const style = decisionStyles[rec.decision]
  const Icon = style.icon

  return (
    <div className="p-6 space-y-5">
      {/* Primary Decision Card — This is what the assessor sees FIRST */}
      <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-6`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${style.bg} border ${style.border}`}>
              <Icon size={28} className={style.text} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-xl font-bold ${style.text}`}>
                  {rec.decision}
                </h3>
                <span className="text-sm bg-white/80 px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                  {Math.round(rec.confidence * 100)}% confidence
                </span>
              </div>
              {rec.suggestedAmount !== null && (
                <p className={`text-2xl font-bold mt-1 ${style.text}`}>
                  MYR {rec.suggestedAmount.toLocaleString()}
                  {rec.suggestedAmount !== claim.customerClaimAmount && (
                    <span className="text-sm font-normal ml-2 text-slate-500">
                      (claimed: MYR {claim.customerClaimAmount.toLocaleString()})
                    </span>
                  )}
                </p>
              )}
              <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-2xl">{rec.reasoning}</p>
            </div>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 w-20">Confidence</span>
            <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${rec.confidence > 0.8 ? 'bg-green-500' : rec.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${rec.confidence * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-slate-600">{Math.round(rec.confidence * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons — One-click decisioning */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-blue-600" />
          <h4 className="font-semibold text-slate-800">Quick Decision</h4>
          <span className="text-xs text-slate-400">Accept or override the AI recommendation</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors">
            <ThumbsUp size={18} />
            Accept: {rec.decision}
            {rec.suggestedAmount !== null && ` (MYR ${rec.suggestedAmount.toLocaleString()})`}
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            <ThumbsDown size={18} />
            Override
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            <MessageSquare size={18} />
            Request Info
          </button>
        </div>
      </div>

      {/* AI Summary — Synthesized claim brief */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} className="text-purple-600" />
          <h4 className="font-semibold text-slate-800">AI Claim Summary</h4>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
          {rec.summary}
        </p>
      </div>

      {/* Risk Flags */}
      {rec.riskFlags.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={16} className="text-orange-600" />
            <h4 className="font-semibold text-slate-800">Risk Flags</h4>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{rec.riskFlags.length}</span>
          </div>
          <div className="space-y-2">
            {rec.riskFlags.map((flag, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${riskSeverityColors[flag.severity]}`}>
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium uppercase">{flag.type} — {flag.severity}</span>
                  <p className="text-sm mt-0.5">{flag.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Documents & Exclusions */}
      <div className="grid grid-cols-2 gap-4">
        {rec.missingDocuments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileWarning size={16} className="text-amber-600" />
              <h4 className="font-semibold text-slate-800">Missing Documents</h4>
            </div>
            <ul className="space-y-2">
              {rec.missingDocuments.map((doc, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {doc}
                </li>
              ))}
            </ul>
            <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
              → Send document request email
            </button>
          </div>
        )}

        {rec.policyExclusions.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-red-600" />
              <h4 className="font-semibold text-slate-800">Policy Exclusions Applied</h4>
            </div>
            <ul className="space-y-2">
              {rec.policyExclusions.map((ex, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                  {ex}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Audit Trail Note */}
      <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
        AI analysis generated at {new Date().toLocaleString()} &middot; Model v2.1 &middot; All decisions require human approval
      </div>
    </div>
  )
}
