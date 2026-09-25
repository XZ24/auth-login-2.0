import { Claim, priorityLabels } from '../data/mockClaims'
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  // Timer,
  BarChart3,
  Hourglass,
  ChevronRight,
  Mail,
} from 'lucide-react'

interface DashboardLandingProps {
  claims: Claim[]
  onSelectClaim: (claim: Claim) => void
}

/* ── helpers ─────────────────────────────────────────────────── */

function isQuickWin(c: Claim): boolean {
  const hasHighConfidence = (c.aiRecommendation?.confidence ?? 0) >= 0.90
  const noMissing = (c.aiRecommendation?.missingDocuments ?? []).length === 0
  const isApprove = c.aiRecommendation?.decision === 'Approve'
  // const isOpen = ['New', 'In Review', 'Assessed'].includes(c.claimStatus)
  return hasHighConfidence && noMissing && isApprove // removed isOpen — claimStatus not reliable
}

function isAging(c: Claim): boolean {
  return c.daysOpen >= 60 // removed claimStatus check — not reliable
}

function daysLabel(d: number) {
  if (d <= 30) return { text: `${d}d`, color: 'text-green-600', bg: 'bg-green-50' }
  if (d <= 60) return { text: `${d}d`, color: 'text-yellow-600', bg: 'bg-yellow-50' }
  if (d <= 90) return { text: `${d}d`, color: 'text-orange-600', bg: 'bg-orange-50' }
  return { text: `${d}d`, color: 'text-red-600', bg: 'bg-red-50' }
}

const priorityDot: Record<number, string> = {
  4: 'bg-slate-400',
  3: 'bg-yellow-400',
  2: 'bg-orange-500',
  1: 'bg-red-500',
}

// const statusColors: Record<string, string> = {
//   'New': 'bg-blue-100 text-blue-700',
//   'In Review': 'bg-yellow-100 text-yellow-700',
//   'Pending Info': 'bg-orange-100 text-orange-700',
//   'Assessed': 'bg-purple-100 text-purple-700',
//   'Approved': 'bg-green-100 text-green-700',
//   'Rejected': 'bg-red-100 text-red-700',
//   'Closed': 'bg-slate-100 text-slate-600',
// }

/* ── component ───────────────────────────────────────────────── */

export function DashboardLanding({ claims, onSelectClaim }: DashboardLandingProps) {
  const quickWins = claims
    .filter(isQuickWin)
    .sort((a, b) => (b.aiRecommendation?.confidence ?? 0) - (a.aiRecommendation?.confidence ?? 0))

  const agingClaims = claims
    .filter(isAging)
    .sort((a, b) => b.daysOpen - a.daysOpen)

  // claimStatus not reliable — treat all claims as open
  const openClaims = claims
  // const pendingInfo = claims.filter(c => c.claimStatus === 'Pending Info')
  const slaBreach = claims.filter(c => c.daysOpen > 90)
  const unreadComms = claims.filter(c => c.communications.some(m => !m.read && m.direction === 'inbound'))

  const quickWinValue = quickWins.reduce((s, c) => s + (c.aiRecommendation?.suggestedAmount ?? 0), 0)

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* ── KPI strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard icon={<BarChart3 size={18} />} label="Open Claims" value={openClaims.length.toLocaleString()} sub="of 7,000 total" accent="blue" />
        <KpiCard icon={<Zap size={18} />} label="Quick Wins" value={quickWins.length.toString()} sub={`MYR ${quickWinValue.toLocaleString()}`} accent="green" />
        <KpiCard icon={<Hourglass size={18} />} label="Aging (60d+)" value={agingClaims.length.toString()} sub={`${slaBreach.length} SLA breach`} accent="orange" />
        <KpiCard icon={<AlertTriangle size={18} />} label="SLA Breach" value={slaBreach.length.toString()} sub="90+ days" accent="red" />
        <KpiCard icon={<Mail size={18} />} label="Unread Replies" value={unreadComms.length.toString()} sub="need attention" accent="purple" />
        {/* <KpiCard icon={<Timer size={18} />} label="Pending Info" value={pendingInfo.length.toString()} sub="awaiting docs" accent="amber" /> */}
      </div>

      {/* ── Two-column layout: quick wins vs aging ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Wins Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Zap size={18} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Quick Wins</h2>
                  <p className="text-xs text-slate-500">High-confidence, docs-complete — clear these fast</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                {quickWins.length} ready
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
            {quickWins.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40" />
                No quick-win claims right now
              </div>
            ) : (
              quickWins.map(claim => (
                <QuickWinRow key={claim.id} claim={claim} onClick={() => onSelectClaim(claim)} />
              ))
            )}
          </div>

          {quickWins.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-center">
              <p className="text-xs text-slate-500">
                Clearing {quickWins.length} quick wins would release&nbsp;
                <span className="font-semibold text-green-700">MYR {quickWinValue.toLocaleString()}</span>
              </p>
            </div>
          )}
        </div>

        {/* Aging Claims Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <Hourglass size={18} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">Aging Claims</h2>
                  <p className="text-xs text-slate-500">60+ days open — reduce backlog &amp; SLA risk</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                {agingClaims.length} overdue
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
            {agingClaims.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40" />
                No aging claims — great work!
              </div>
            ) : (
              agingClaims.map(claim => (
                <AgingRow key={claim.id} claim={claim} onClick={() => onSelectClaim(claim)} />
              ))
            )}
          </div>

          {agingClaims.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
              <AgingDistribution claims={agingClaims} />
            </div>
          )}
        </div>
      </div>

      {/* ── Workload balance bar ──────────────────────────────── */}
      <WorkloadBalance claims={openClaims} quickWins={quickWins.length} aging={agingClaims.length} />
    </div>
  )
}

/* ── sub-components ──────────────────────────────────────────── */

function KpiCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string; sub: string
  accent: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'amber'
}) {
  const ring: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${ring[accent]}`}>{icon}</div>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  )
}

function QuickWinRow({ claim, onClick }: { claim: Claim; onClick: () => void }) {
  const conf = claim.aiRecommendation?.confidence ?? 0
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-3.5 hover:bg-green-50/40 transition-colors flex items-center gap-4 group"
    >
      {/* confidence ring */}
      <div className="relative w-11 h-11 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.5" fill="none"
            stroke="#16a34a" strokeWidth="3"
            strokeDasharray={`${conf * 97.4} 97.4`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-700">
          {Math.round(conf * 100)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-800">{claim.claimNumber}</span>
          {/* <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[claim.claimStatus]}`}>
            {claim.claimStatus}
          </span> */}
        </div>
        <p className="text-xs text-slate-500 truncate">{claim.claimant.fullName} · {claim.claimEventType}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-slate-800">
          MYR {(claim.aiRecommendation?.suggestedAmount ?? claim.customerClaimAmount).toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-400">{claim.daysOpen}d open</p>
      </div>

      <ChevronRight size={16} className="text-slate-300 group-hover:text-green-500 transition-colors flex-shrink-0" />
    </button>
  )
}

function AgingRow({ claim, onClick }: { claim: Claim; onClick: () => void }) {
  const dl = daysLabel(claim.daysOpen)
  const hasUnread = claim.communications.some(c => !c.read && c.direction === 'inbound')
  const isBreach = claim.daysOpen > 90

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-3.5 hover:bg-orange-50/40 transition-colors flex items-center gap-4 group"
    >
      {/* days badge */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${dl.bg} ${isBreach ? 'ring-2 ring-red-300' : ''}`}>
        <span className={`text-xs font-bold ${dl.color}`}>{dl.text}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-800">{claim.claimNumber}</span>
          <span className={`w-2 h-2 rounded-full ${priorityDot[claim.priority] ?? ''}`} title={priorityLabels[claim.priority]} />
          {isBreach && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium flex items-center gap-0.5">
              <AlertCircle size={10} /> SLA
            </span>
          )}
          {hasUnread && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium flex items-center gap-0.5">
              <Mail size={10} /> Reply
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">
          {claim.claimant.fullName} · {claim.claimEventType}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-slate-800">
          MYR {claim.customerClaimAmount.toLocaleString()}
        </p>
        <div className="flex items-center gap-1 justify-end">
          {claim.aiRecommendation && (
            <span className="text-[10px] text-slate-400">
              AI: {claim.aiRecommendation.decision}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="text-slate-300 group-hover:text-orange-500 transition-colors flex-shrink-0" />
    </button>
  )
}

function AgingDistribution({ claims }: { claims: Claim[] }) {
  const bands = [
    { label: '60-90d', count: claims.filter(c => c.daysOpen >= 60 && c.daysOpen < 90).length, color: 'bg-yellow-400' },
    { label: '90-120d', count: claims.filter(c => c.daysOpen >= 90 && c.daysOpen < 120).length, color: 'bg-orange-400' },
    { label: '120-150d', count: claims.filter(c => c.daysOpen >= 120 && c.daysOpen < 150).length, color: 'bg-orange-600' },
    { label: '150d+', count: claims.filter(c => c.daysOpen >= 150).length, color: 'bg-red-500' },
  ]
  const total = claims.length || 1
  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden">
        {bands.map(b => (
          <div key={b.label} className={`${b.color}`} style={{ width: `${(b.count / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {bands.map(b => (
          <span key={b.label} className="text-[10px] text-slate-500">{b.label}: {b.count}</span>
        ))}
      </div>
    </div>
  )
}

function WorkloadBalance({ claims, quickWins, aging }: { claims: Claim[]; quickWins: number; aging: number }) {
  const total = claims.length || 1
  const other = total - quickWins - aging
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800 text-sm">Today's Workload Balance</h3>
        </div>
        <span className="text-xs text-slate-400">{claims.length} open claims</span>
      </div>
      <div className="flex h-4 rounded-full overflow-hidden">
        <div className="bg-green-500 transition-all" style={{ width: `${(quickWins / total) * 100}%` }} title="Quick wins" />
        <div className="bg-slate-300 transition-all" style={{ width: `${(other / total) * 100}%` }} title="In progress" />
        <div className="bg-orange-500 transition-all" style={{ width: `${(aging / total) * 100}%` }} title="Aging" />
      </div>
      <div className="flex items-center gap-6 mt-2.5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Quick wins ({quickWins})</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> In progress ({other})</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Aging ({aging})</span>
      </div>
      <p className="text-xs text-slate-400 mt-2">
        Recommended: Clear quick wins first to free capacity, then triage aging claims to prevent further SLA breach.
      </p>
    </div>
  )
}
