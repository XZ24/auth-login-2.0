import { useState } from 'react'
import { Claim, documentStatusLabels } from '../data/mockClaims'
import { EmailPanel } from './EmailPanel'
import { AIDecisionPanel } from './AIDecisionPanel'
import { ClaimSummaryPanel } from './ClaimSummaryPanel'
import { FileText, Paperclip, User, Calendar, DollarSign } from 'lucide-react'

interface ClaimDetailProps {
  claim: Claim
}

type Tab = 'overview' | 'communications' | 'documents' | 'ai-decision' | 'summary'

// const statusColors: Record<string, string> = {
//   'New': 'bg-blue-100 text-blue-700',
//   'In Review': 'bg-yellow-100 text-yellow-700',
//   'Pending Info': 'bg-orange-100 text-orange-700',
//   'Assessed': 'bg-purple-100 text-purple-700',
//   'Approved': 'bg-green-100 text-green-700',
//   'Rejected': 'bg-red-100 text-red-700',
//   'Closed': 'bg-slate-100 text-slate-600',
// }

export function ClaimDetail({ claim }: ClaimDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('communications')

  console.log('[ClaimDetail]', claim.claimNumber, {
    currentPic: claim.currentPic,
    currentStatus: claim.currentStatus,
  })

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'communications', label: 'Communications' },
    { id: 'summary', label: '✨ AI Summary' },
    // { id: 'overview', label: 'Overview' },
    // { id: 'documents', label: 'Documents', badge: claim.claimUpload.filter(d => d.statusCode === 0).length },
    // { id: 'ai-decision', label: '✨ AI Decision' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Claim Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-800">{claim.claimNumber}</h2>
              {claim.currentPic ? (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                  <User size={12} className="text-slate-400" />
                  {claim.currentPic}
                </span>
              ) : null}
              {/* <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[claim.claimStatus] ?? ''}`}>
                {claim.claimStatus}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                {claim.sourceSystem}
              </span> */}
            </div>
            {/* <p className="text-sm text-slate-500 mt-1">{claim.claimEventType} &middot; {claim.daysOpen} days open &middot; Assigned to {claim.assignedTo}</p> */}
          </div>
          <div className="text-right">
            {/* <p className="text-2xl font-bold text-slate-800">MYR {claim.customerClaimAmount.toLocaleString()}</p> */}
            {/* {claim.claimAmount > 0 && (
              <p className="text-sm text-green-600 font-medium">Assessed: MYR {claim.claimAmount.toLocaleString()}</p>
            )} */}
          </div>
        </div>

        {/* Quick Info Bar */}
        {/* <div className="flex gap-6 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User size={14} className="text-slate-400" />
            <span>{claim.claimant.fullName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} className="text-slate-400" />
            <span>{claim.claimReserveField?.[0]?.destination ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar size={14} className="text-slate-400" />
            <span>Incident: {claim.incidentDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Shield size={14} className="text-slate-400" />
            <span>{claim.policyNo}</span>
          </div>
        </div> */}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.badge ? (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab claim={claim} />}
        {activeTab === 'communications' && <EmailPanel claim={claim} />}
        {activeTab === 'summary' && <ClaimSummaryPanel claim={claim} />}
        {activeTab === 'documents' && <DocumentsTab claim={claim} />}
        {activeTab === 'ai-decision' && <AIDecisionPanel claim={claim} />}
      </div>
    </div>
  )
}

function OverviewTab({ claim }: { claim: Claim }) {
  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-medium text-slate-800 mb-3">Claim Description</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{claim.caseRemark}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <User size={16} /> Claimant Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="text-slate-800">{claim.claimant.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="text-slate-800">{claim.smileAppEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone</span>
              <span className="text-slate-800">{claim.smileAppPhone}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <DollarSign size={16} /> Financial Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Claimed</span>
              <span className="text-slate-800 font-medium">MYR {claim.customerClaimAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Assessed</span>
              <span className="text-slate-800 font-medium">
                {claim.claimAmount > 0 ? `MYR ${claim.claimAmount.toLocaleString()}` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AI Suggested</span>
              <span className="text-blue-600 font-medium">
                {claim.aiRecommendation?.suggestedAmount
                  ? `MYR ${claim.aiRecommendation.suggestedAmount.toLocaleString()}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <Calendar size={16} /> Timeline
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 w-32">Travel Date</span>
            <span className="text-slate-800">{claim.departureDateTime ? new Date(claim.departureDateTime).toLocaleDateString() : '—'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 w-32">Incident Date</span>
            <span className="text-slate-800">{new Date(claim.incidentDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 w-32">Submitted</span>
            <span className="text-slate-800">{new Date(claim.claimSubmissionDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 w-32">Last Updated</span>
            <span className="text-slate-800">{new Date(claim.created).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentsTab({ claim }: { claim: Claim }) {
  const docStatusColors: Record<string, string> = {
    'Received': 'bg-blue-100 text-blue-700',
    'Verified': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'Missing': 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-medium text-slate-800 flex items-center gap-2">
            <Paperclip size={16} /> Submitted Documents ({claim.claimUpload.length})
          </h3>
          <button className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Request Document
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {claim.claimUpload.map(doc => {
            const statusLabel = documentStatusLabels[doc.statusCode] ?? 'Unknown'
            return (
              <div key={doc.fileId} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{doc.fileName || doc.documentType}</p>
                    <p className="text-xs text-slate-400">
                      {doc.created ? `Uploaded ${new Date(doc.created).toLocaleDateString()}` : 'Not yet uploaded'}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${docStatusColors[statusLabel] ?? ''}`}>
                  {statusLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
