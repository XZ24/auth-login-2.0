import { Claim } from '../data/mockClaims'
import { SortMode } from '../api'
import type { UIEventHandler } from 'react'
// import { Clock, AlertCircle } from 'lucide-react'

interface ClaimsListProps {
  mockData?: boolean
  claims: Claim[]
  selectedId: string | null
  onSelect: (claim: Claim) => void
  loadingMore?: boolean
  hasMore?: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  searching?: boolean
  sort: SortMode
  onSortChange: (s: SortMode) => void
  notReplied: boolean
  onNotRepliedChange: (v: boolean) => void
  onListScroll?: UIEventHandler<HTMLDivElement>
}

const DAILY_TARGET = 15

// const statusColors: Record<string, string> = {
//   'New': 'bg-blue-100 text-blue-700',
//   'In Review': 'bg-yellow-100 text-yellow-700',
//   'Pending Info': 'bg-orange-100 text-orange-700',
//   'Assessed': 'bg-purple-100 text-purple-700',
//   'Approved': 'bg-green-100 text-green-700',
//   'Rejected': 'bg-red-100 text-red-700',
//   'Closed': 'bg-slate-100 text-slate-600',
// }

const priorityColors: Record<number, string> = {
  4: 'border-l-slate-300',
  3: 'border-l-yellow-400',
  2: 'border-l-orange-500',
  1: 'border-l-red-500',
}

export function ClaimsList({
  mockData,
  claims,
  selectedId,
  onSelect,
  loadingMore,
  hasMore,
  searchQuery,
  onSearchChange,
  searching,
  sort,
  onSortChange,
  notReplied,
  onNotRepliedChange,
  onListScroll,
}: ClaimsListProps) {
  // Server handles sorting; render in the order returned.
  const sortedClaims = claims

  // const closedToday = claims.filter(c => c.claimStatus === 'Closed').length
  // const closedToday = 0 // claimStatus not reliable — hardcode to 0
  // const progressPercent = Math.min((closedToday / DAILY_TARGET) * 100, 100)

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-white p-4 border-b border-slate-200 shadow-sm">
        {mockData && <p className="text-xs text-amber-700 mb-2">Local sample claims</p>}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search claims, emails, attachments..."
            className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searching && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {!searching && searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex gap-1.5 mt-2">
          {(['newest', 'oldest'] as SortMode[]).map(s => (
            <button
              key={s}
              onClick={() => onSortChange(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${sort === s
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
            >
              {s === 'newest' ? 'Newest' : s === 'oldest' ? 'Oldest' : 'Claim No.'}
            </button>
          ))}
          <button
            onClick={() => onNotRepliedChange(!notReplied)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors inline-flex items-center gap-1.5 ${notReplied
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            title="Show only claims awaiting the assessor's reply"
          >
            <span className={`w-2 h-2 rounded-full ${notReplied ? 'bg-white' : 'bg-slate-400'}`} />
            Not yet replied
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" onScroll={onListScroll}>
        <div>
          {sortedClaims.map((claim, index) => {
            // const hasUnread = claim.communications.some(c => !c.read && c.direction === 'inbound')
            const isInTarget = index < DAILY_TARGET
            return (
              <div
                key={`${claim.id}-${claim.claimNumber}`}
                onClick={() => onSelect(claim)}
                className={`p-4 border-b border-slate-200 cursor-pointer border-l-4 ${priorityColors[claim.priority] ?? 'border-l-slate-300'} hover:bg-slate-50 transition-colors ${selectedId === claim.id ? 'bg-blue-50 border-l-blue-600' : ''
                  } ${isInTarget ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${isInTarget ? 'bg-slate-300 text-black' : 'bg-slate-200 text-slate-700'}`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm text-slate-800 truncate">{claim.claimNumber}</span>
                      {claim.lastReplyIsEtiqa === false && (
                        <span
                          className="w-2 h-2 rounded-full bg-blue-500 shrink-0"
                          title="Awaiting assessor reply"
                          aria-label="Awaiting assessor reply"
                        />
                      )}
                      {/* {hasUnread && (
                        <span className="flex items-center gap-1 text-xs text-blue-600">
                          <Mail size={12} /> New
                        </span>
                      )} */}
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-0.5">{claim.claimant.fullName}</p>
                    <p className="text-xs text-slate-400 mt-1">{claim.claimEventType} &middot; {claim.claimReserveField?.[0]?.destination ?? ''} &middot; {claim.sourceSystem}</p>
                  </div>
                </div>
                {/* <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={11} /> {claim.daysOpen}d open
                  </span>
                  {claim.daysOpen > 90 && (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={11} /> SLA breach
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{claim.assignedTo}</span>
                </div> */}
              </div>
            )
          })}
        </div>

        {loadingMore && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500 border-t border-slate-100">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Loading more claims…
          </div>
        )}
        {!loadingMore && !hasMore && claims.length > 0 && (
          <div className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
            All {claims.length} claims loaded
          </div>
        )}
      </div>
    </div>
  )
}
