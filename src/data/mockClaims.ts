// Interfaces aligned to claim-payload.json schema

export interface ClaimPayment {
  bankKey: string;
  bankName: string;
  bankNumber: string;
  bankHolderName: string;
  paymentCode: string;
}

export interface Claimant {
  nric: string;
  fullName: string;
  idType: string;
  dateOfBirth: string | null;
  maritalStatus: string;
  noOfChildren: string;
  monthlyIncome: string;
  educationLevel: string;
  race: string;
  insuredSinceDate: string | null;
  religion: string;
  nationality: string;
  staffFlag: boolean;
  title: string;
  addressLine1: string;
  city: string;
  stateOrProvince: string;
  addressPostcode: string;
  country: string;
  phone: string;
  claimantType: string | null;
  taxIdentificationNo: string;
  sstRegistrationNo: string;
  gender: string | null;
  email: string;
  officePhoneNo: string;
}

export interface ClaimStatusChangeLog {
  subject: string;
  description: string;
  activityLogDate: string;
  claimStatus: number;
  category: number;
  remark: string | null;
}

export interface ClaimUpload {
  documentType: string;
  fileName: string;
  documentId: string | null;
  downloadUrl: string;
  statusCode: number;
  fileId: string;
  created: string;
}

export interface ClaimReserveField {
  id: number;
  subType: string;
  premiumClass: string;
  reserveCode: string;
  reserveAmount: number;
  name: string;
  destination: string;
  customerReserveAmount: number;
}

export interface ClaimIntegration {
  claimSubmissionNumber: string;
  claimNumber: string;
  requisitionNumber: string;
  claimAmount: number;
  sourceOfTransaction: string;
  claimStatusDescription: string;
  claimErrorDescription: string;
}

export interface CommunicationAttachment {
  id: number;
  filename: string;
  att_type: string;
  size_bytes: number;
}

export interface Communication {
  id: string;
  folderId: string;
  direction: 'inbound' | 'outbound';
  channel: 'email' | 'system';
  from: string;
  to: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  timestamp: string;
  read: boolean;
  attachments?: CommunicationAttachment[];
  conversationId?: string;
  conversationSubject?: string;
}

export interface AIRecommendation {
  decision: 'Approve' | 'Reject' | 'Partial Approve' | 'Escalate';
  confidence: number;
  reasoning: string;
  riskFlags: RiskFlag[];
  suggestedAmount: number | null;
  missingDocuments: string[];
  policyExclusions: string[];
  summary: string;
}

export interface RiskFlag {
  type: 'fraud' | 'exclusion' | 'documentation' | 'policy' | 'amount';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface Claim {
  id: string;
  smileAppPhone: string;
  smileAppEmail: string;
  claimType: string;
  claimNumber: string;
  claimCategory: number;
  needSubmitStp: boolean;
  aiClaimIsDuplicate: boolean;
  claimCoreSystemClaimId: string;
  claimSubmissionDate: string;
  statusCode: number;
  stateCode: number;
  claimStatus: string;
  claimEventType: string;
  policyNo: string;
  policyName: string;
  policyType: string | null;
  causeTypeCode: string;
  claimAgainstOtherPartyRemarks: string;
  contractType: string;
  coverageNo: string;
  coverageType: string;
  eventType: string;
  haveClaimAgainstOtherParty: boolean;
  incidentDate: string;
  insuredName: string;
  lossTypeCode: string;
  company: number;
  riskNumber: number;
  isManual: boolean;
  entity: string;
  sourceCoreSystem: string;
  schemeCode: string;
  planCodeDesc: string;
  planCode: string;
  numOfDependant: number;
  severity: number;
  priority: number;
  created: string;
  claimAmount: number;
  customerClaimAmount: number;
  sourceSystem: string;
  caseRemark: string;
  customerRemark: string;
  claimAccessorRemark: string;
  appealRemark: string;
  isAppeal: boolean;
  isAiAssessed: boolean;
  aiAssessmentResult: string;
  isAiProcessed: boolean;
  aiIsDocRelatedClaim: boolean;
  aiIsDocMatchClaim: boolean;
  claimPayment: ClaimPayment;
  claimant: Claimant;
  claimStatusChangeLog: ClaimStatusChangeLog[];
  claimUpload: ClaimUpload[];
  claimReserveField: ClaimReserveField[];
  claimIntegration: ClaimIntegration | null;
  departureDateTime: string | null;
  newDepartureDateTime: string | null;
  flightNo: string | null;

  // UI-extended fields (not in core payload)
  communications: Communication[];
  aiRecommendation?: AIRecommendation;
  assignedTo: string;
  daysOpen: number;
  lastReplyIsEtiqa?: boolean | null;
  currentStatus?: string | null;
  currentPic?: string | null;
}

// Priority number to label mapping
export const priorityLabels: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
}

// Status code to label mapping
export const statusLabels: Record<number, string> = {
  1: 'New',
  2: 'In Review',
  3: 'Submitted',
  4: 'Pending Info',
  5: 'Rejected',
  6: 'Approved',
  7: 'Assessed',
  8: 'Closed',
}

// Document statusCode to label mapping
export const documentStatusLabels: Record<number, string> = {
  0: 'Missing',
  1: 'Received',
  2: 'Verified',
  3: 'Rejected',
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function claimantOf(fullName: string, nric: string, email: string, phone: string, title: string, address: string, city: string, state: string, postcode: string, gender: string | null = null): Claimant {
  return { nric, fullName, idType: 'New IC', dateOfBirth: null, maritalStatus: 'Others', noOfChildren: '0', monthlyIncome: '002', educationLevel: '002', race: '099', insuredSinceDate: null, religion: '099', nationality: '458', staffFlag: false, title, addressLine1: address, city, stateOrProvince: state, addressPostcode: postcode, country: 'MALAYSIA', phone, claimantType: null, taxIdentificationNo: '', sstRegistrationNo: '', gender, email, officePhoneNo: '' }
}

function paymentOf(name: string, bankNumber: string): ClaimPayment {
  return { bankKey: '52023', bankName: 'MBB', bankNumber, bankHolderName: name, paymentCode: 'FD' }
}

// ─── Import real email sources and extracted content ──────────────────────
import { caseEmailGroups, type EmailSource } from './emailSources'
import { getEmailByFolder } from './emailContents'

/** Trim confidentiality disclaimers, security banners, and normalize whitespace */
function cleanEmailBody(raw: string | undefined): string {
  if (!raw) return ''
  let body = raw.replace(/\r\n/g, '\n')

  // Remove the "WARNING! external party" + "AMARAN!" security banners (keep content after)
  body = body.replace(
    /WARNING![\s\S]*?if you cannot ascertain that it is safe\.\n*/i, ''
  )
  body = body.replace(
    /AMARAN![\s\S]*?dari e-mel ini\.\n*/i, ''
  )

  // Strip trailing Outlook confidentiality footers
  const footerMarkers = [
    '________________________________\n\nThis message is intended only',
    '________________________________\n\n\nThis message is intended only',
    '\nThis message is intended only for the use of the person',
  ]
  for (const marker of footerMarkers) {
    const idx = body.lastIndexOf(marker)
    if (idx > 0) body = body.substring(0, idx).trimEnd()
  }

  // Remove embedded Outlook "Get Outlook for iOS" links
  body = body.replace(/Get Outlook for iOS\n<https?:\/\/[^\n>]+>\s*/g, '')

  // Collapse excessive blank lines
  body = body.replace(/\n{4,}/g, '\n\n\n')
  return body.trim()
}

/** Convert EmailSource records into Communication objects using real extracted content */
function emailsToCommunications(emails: EmailSource[], claimantEmail: string): Communication[] {
  return emails.map((e, i) => {
    const extracted = getEmailByFolder(e.folderId)
    const senderAddr = extracted?.from || ''
    // Determine direction from actual sender: @etiqa.com.my = outbound, everything else = inbound
    const isFromEtiqa = senderAddr.endsWith('@etiqa.com.my')
    const direction: 'inbound' | 'outbound' = isFromEtiqa ? 'outbound' : 'inbound'
    return {
      id: `${e.folderId}-${i}`,
      folderId: e.folderId,
      direction,
      channel: 'email' as const,
      from: extracted?.from || (direction === 'inbound' ? claimantEmail : 'claims@etiqa.com.my'),
      to: extracted?.to || (direction === 'inbound' ? 'claims@etiqa.com.my' : claimantEmail),
      subject: extracted?.subject || e.subject,
      body: cleanEmailBody(extracted?.body) || `[Email source: ${e.filename}]`,
      timestamp: extracted?.sentDate || e.date,
      read: i < emails.length - 1,
      attachments: e.attachments.length > 0 ? e.attachments as unknown as CommunicationAttachment[] : undefined,
    }
  })
}

function caseEmails(key: string) {
  return caseEmailGroups.find(g => g.caseKey === key)!.emails
}

const assignees = ['Nurul Aisyah', 'Razif Hassan', 'Farah Lim']
const a = (i: number) => assignees[i % assignees.length]

// ═══════════════════════════════════════════════════════════════════════════
// Mock claims generated from real email samples in sources/ folder.
// Each claim maps to one or more emails in sources/_email_staging and
// potential attachments in sources/_attachment_staging.
// ═══════════════════════════════════════════════════════════════════════════

export const mockClaims: Claim[] = [

  // ─── 1. SARAH IZANA – Trip Cancelled (KIV) ──────────────────────────────
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000001',
    smileAppPhone: '+60134567890',
    smileAppEmail: 'sarah.izana@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU70320101010000003198',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9171084',
    claimSubmissionDate: '2026-05-08T00:00:00',
    statusCode: 4,
    stateCode: 0,
    claimStatus: 'Pending Info',
    claimEventType: 'Trip Cancellation',
    policyNo: 'CU703201',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'ILL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU703201',
    coverageType: '',
    eventType: 'Trip Cancellation',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-02T00:00:00',
    insuredName: 'SARAH IZANA BINTI ROSZMI',
    lossTypeCode: 'ILL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-05-08T10:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 4500.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'KIV – Trip cancelled. Awaiting additional supporting documents from claimant.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Partial Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('SARAH IZANA BINTI ROSZMI', '162089112233'),
    claimant: claimantOf('SARAH IZANA BINTI ROSZMI', '900515065432', 'sarah.izana@email.com', '0134567890', 'MS', '22 Jalan Duta', '50480 - Kuala Lumpur', 'Kuala Lumpur', '50480', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-08T10:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'KIV', description: 'Claim placed on KIV — pending supporting documents for trip cancellation.', activityLogDate: '2026-05-11T17:26:59', claimStatus: 4, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Flight Itinerary', fileName: 'Flight Booking.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd1', created: '2026-05-08T10:00:00' },
      { documentType: 'Medical Report', fileName: '', documentId: null, downloadUrl: '', statusCode: 0, fileId: 'd2', created: '' },
    ],
    claimReserveField: [{ id: 10001, subType: 'Trip Cancellation', premiumClass: 'TS3', reserveCode: 'TC', reserveAmount: 4500.00, name: 'CU703201 - Trip Cancellation', destination: 'Japan', customerReserveAmount: 4500.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-05 08:00:00',
    newDepartureDateTime: null,
    flightNo: 'MH70',
    communications: emailsToCommunications(caseEmails('C9171084'), 'sarah.izana@email.com'),
    aiRecommendation: {
      decision: 'Partial Approve', confidence: 0.68,
      reasoning: 'Trip cancellation claim submitted but medical report for illness is missing. Flight itinerary verified. KIV status applied pending documentation.',
      riskFlags: [
        { type: 'documentation', severity: 'high', description: 'Medical report not yet submitted to support cancellation reason' },
      ],
      suggestedAmount: 4500.00, missingDocuments: ['Medical report'], policyExclusions: [],
      summary: 'KIV trip cancellation. Flight booking verified. Medical proof required before approval. Recommend hold until documents received.',
    },
    assignedTo: a(0),
    daysOpen: 5,
  },

  // ─── 2. Flight Delay – PU551901 ──────────────────────────────────────────
  {
    id: 'a1b2c3d4-2222-4000-8000-000000000002',
    smileAppPhone: '+60178901234',
    smileAppEmail: 'flightdelay.pu551901@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'PU55190101010000004521',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9172001',
    claimSubmissionDate: '2026-05-09T00:00:00',
    statusCode: 2,
    stateCode: 0,
    claimStatus: 'In Review',
    claimEventType: 'Travel Delay',
    policyNo: 'PU551901',
    policyName: 'TripCare 360',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'PU551901',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-05T00:00:00',
    insuredName: 'AHMAD FIRDAUS BIN YUSOF',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '2026-05-09T08:30:00',
    claimAmount: 0.00,
    customerClaimAmount: 600.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Flight delayed over 6 hours. Supporting images provided showing delay board and boarding pass.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('AHMAD FIRDAUS BIN YUSOF', '162089223344'),
    claimant: claimantOf('AHMAD FIRDAUS BIN YUSOF', '870822085432', 'flightdelay.pu551901@email.com', '0178901234', 'MR', '15 Jalan Ampang', '50450 - Kuala Lumpur', 'Kuala Lumpur', '50450', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-09T08:30:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'In Review', description: 'Claim moved to In Review. Documents under verification.', activityLogDate: '2026-05-11T17:34:24', claimStatus: 2, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Boarding Pass', fileName: 'image001.jpg', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd3', created: '2026-05-09T08:30:00' },
      { documentType: 'Flight Delay Certificate', fileName: 'image002.jpg', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd4', created: '2026-05-09T08:30:00' },
    ],
    claimReserveField: [{ id: 10002, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 600.00, name: 'PU551901 - Travel Delay', destination: 'Bangkok', customerReserveAmount: 600.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-05 14:00:00',
    newDepartureDateTime: '2026-05-05 20:30:00',
    flightNo: 'AK882',
    communications: emailsToCommunications(caseEmails('PU551901'), 'flightdelay.pu551901@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.89,
      reasoning: 'Flight delay over 6 hours verified via images. Boarding pass and delay evidence consistent.',
      riskFlags: [],
      suggestedAmount: 600.00, missingDocuments: [], policyExclusions: [],
      summary: 'Standard flight delay claim. 6+ hour delay verified. Approve MYR 600.',
    },
    assignedTo: a(1),
    daysOpen: 4,
  },

  // ─── 3. FRAUD – CHE MOHD RAZLIN ──────────────────────────────────────────
  {
    id: 'a1b2c3d4-3333-4000-8000-000000000003',
    smileAppPhone: '+60141234567',
    smileAppEmail: 'razlin.fraud@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'FRAUD-84112011511701',
    claimCategory: 2,
    needSubmitStp: false,
    aiClaimIsDuplicate: true,
    claimCoreSystemClaimId: 'C9173001',
    claimSubmissionDate: '2026-05-08T00:00:00',
    statusCode: 5,
    stateCode: 0,
    claimStatus: 'Rejected',
    claimEventType: 'Travel Delay',
    policyNo: 'PU600100',
    policyName: 'TripCare 360',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'PU600100',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-28T00:00:00',
    insuredName: 'CHE MOHD RAZLIN BIN CHE REZALI',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 1,
    priority: 1,
    created: '2026-05-08T09:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 2500.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'FRAUD: Confirmed fraudulent claim. Multiple prior fraudulent submissions detected. NRIC 841120115117.',
    customerRemark: '',
    claimAccessorRemark: 'Flagged by fraud investigation team',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Reject',
    isAiProcessed: true,
    aiIsDocRelatedClaim: false,
    aiIsDocMatchClaim: false,
    claimPayment: paymentOf('CHE MOHD RAZLIN BIN CHE REZALI', '162089334455'),
    claimant: claimantOf('CHE MOHD RAZLIN BIN CHE REZALI', '841120115117', 'razlin.fraud@email.com', '0141234567', 'MR', '5 Jalan Kelantan', '15200 - Kota Bharu', 'Kelantan', '15200', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-08T09:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Fraud Detected', description: 'Confirmed fraudulent claim. Multiple prior fraudulent submissions.', activityLogDate: '2026-05-11T17:36:37', claimStatus: 5, category: 1, remark: 'Fraud investigation' },
    ],
    claimUpload: [
      { documentType: 'Boarding Pass', fileName: 'boarding_pass.jpg', documentId: null, downloadUrl: '', statusCode: 3, fileId: 'd5', created: '2026-05-08T09:00:00' },
    ],
    claimReserveField: [{ id: 10003, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 0.00, name: 'PU600100 - Travel Delay', destination: 'Singapore', customerReserveAmount: 2500.00 }],
    claimIntegration: null,
    departureDateTime: '2026-04-28 10:00:00',
    newDepartureDateTime: null,
    flightNo: 'TR288',
    communications: emailsToCommunications(caseEmails('FRAUD-841120115117'), 'razlin.fraud@email.com'),
    aiRecommendation: {
      decision: 'Reject', confidence: 0.97,
      reasoning: 'Multiple confirmed fraudulent submissions by same claimant. Documents do not match claimed flight. Pattern consistent with serial fraud.',
      riskFlags: [
        { type: 'fraud', severity: 'high', description: 'Confirmed prior fraudulent claims under same NRIC' },
        { type: 'documentation', severity: 'high', description: 'Boarding pass does not match claimed flight details' },
      ],
      suggestedAmount: 0, missingDocuments: [], policyExclusions: [],
      summary: 'REJECT — Confirmed fraud. Serial fraudulent claimant. Boarding pass forged. Refer to fraud team.',
    },
    assignedTo: a(0),
    daysOpen: 5,
  },

  // ─── 4. SUZANA – Pending Documents – PU534046 ────────────────────────────
  {
    id: 'a1b2c3d4-4444-4000-8000-000000000004',
    smileAppPhone: '+60169876543',
    smileAppEmail: 'suzana.ongkomong@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'PU53404601010000005678',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9174001',
    claimSubmissionDate: '2026-04-28T00:00:00',
    statusCode: 4,
    stateCode: 0,
    claimStatus: 'Pending Info',
    claimEventType: 'Travel Delay',
    policyNo: 'PU534046',
    policyName: 'TripCare 360',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'PU534046',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-20T00:00:00',
    insuredName: 'SUZANA BINTI ONGKOMONG',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '2026-04-28T11:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 450.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Travel claim pending supporting documents. 2nd reminder sent to claimant.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: false,
    aiAssessmentResult: '',
    isAiProcessed: false,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: false,
    claimPayment: paymentOf('SUZANA BINTI ONGKOMONG', '162089445566'),
    claimant: claimantOf('SUZANA BINTI ONGKOMONG', '880304086543', 'suzana.ongkomong@email.com', '0169876543', 'MRS', '67 Jalan Sabah', '88000 - Kota Kinabalu', 'Sabah', '88000', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-04-28T11:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Pending Documents', description: 'Pending supporting documents from claimant.', activityLogDate: '2026-05-05T09:00:00', claimStatus: 4, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Boarding Pass', fileName: 'image001.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd6', created: '2026-04-28T11:00:00' },
      { documentType: 'Flight Delay Certificate', fileName: '', documentId: null, downloadUrl: '', statusCode: 0, fileId: 'd7', created: '' },
      { documentType: 'Receipt', fileName: '', documentId: null, downloadUrl: '', statusCode: 0, fileId: 'd8', created: '' },
    ],
    claimReserveField: [{ id: 10004, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 450.00, name: 'PU534046 - Travel Delay', destination: 'Seoul', customerReserveAmount: 450.00 }],
    claimIntegration: null,
    departureDateTime: '2026-04-20 09:30:00',
    newDepartureDateTime: '2026-04-20 16:00:00',
    flightNo: 'MH66',
    communications: emailsToCommunications(caseEmails('PU534046'), 'suzana.ongkomong@email.com'),
    aiRecommendation: {
      decision: 'Escalate', confidence: 0.55,
      reasoning: 'Flight delay certificate and receipts still outstanding. Boarding pass received but insufficient for full assessment. Delay duration and expenses need verification.',
      riskFlags: [
        { type: 'documentation', severity: 'high', description: 'Flight delay certificate not submitted' },
        { type: 'documentation', severity: 'medium', description: 'Expense receipts missing' },
      ],
      suggestedAmount: null, missingDocuments: ['Flight Delay Certificate', 'Expense receipts'], policyExclusions: [],
      summary: 'Travel delay claim pending key documents. Cannot assess amount until flight delay certificate and receipts are provided.',
    },
    assignedTo: a(2),
    daysOpen: 15,
  },

  // ─── 5. NORAINI RUSLAN – Travel Insurance – PU572929 ─────────────────────
  {
    id: 'a1b2c3d4-5555-4000-8000-000000000005',
    smileAppPhone: '+60123456001',
    smileAppEmail: 'noraini.ruslan@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'PU57292901010000006789',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9175001',
    claimSubmissionDate: '2026-05-10T00:00:00',
    statusCode: 1,
    stateCode: 0,
    claimStatus: 'New',
    claimEventType: 'Trip Cancellation',
    policyNo: 'PU572929',
    policyName: 'TripCare 360',
    policyType: null,
    causeTypeCode: 'ILL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'PU572929',
    coverageType: '',
    eventType: 'Trip Cancellation',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-03T00:00:00',
    insuredName: 'NORAINI BINTI RUSLAN',
    lossTypeCode: 'ILL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-05-10T09:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 8200.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Trip to Italy cancelled. Rich documentation submitted including policy, itinerary, and meeting agenda.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('NORAINI BINTI RUSLAN', '162089556677'),
    claimant: claimantOf('NORAINI BINTI RUSLAN', '780810065432', 'noraini.ruslan@email.com', '0123456001', 'MRS', '34 Persiaran Raja Chulan', '50200 - Kuala Lumpur', 'Kuala Lumpur', '50200', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-10T09:00:00', claimStatus: 3, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Policy Document', fileName: 'Pu572929.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd9', created: '2026-05-10T09:00:00' },
      { documentType: 'Flight Itinerary', fileName: 'Trip to italy meeting .pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd10', created: '2026-05-10T09:00:00' },
      { documentType: 'Receipt', fileName: 'IMG_6135.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd11', created: '2026-05-10T09:00:00' },
      { documentType: 'Supporting Document', fileName: '7d9475ad-ebf8-49b8-b75f-6bc53be7773c.jpeg', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd12', created: '2026-05-10T09:00:00' },
    ],
    claimReserveField: [{ id: 10005, subType: 'Trip Cancellation', premiumClass: 'TS3', reserveCode: 'TC', reserveAmount: 8200.00, name: 'PU572929 - Trip Cancellation', destination: 'Italy', customerReserveAmount: 8200.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-06 09:00:00',
    newDepartureDateTime: null,
    flightNo: 'MH80',
    communications: emailsToCommunications(caseEmails('PU572929'), 'noraini.ruslan@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.91,
      reasoning: 'Comprehensive documentation submitted. Policy, itinerary, meeting agenda, and supporting images all consistent with trip cancellation claim.',
      riskFlags: [],
      suggestedAmount: 8200.00, missingDocuments: [], policyExclusions: [],
      summary: 'Well-documented trip cancellation to Italy. All documents verified. Recommend full approval of MYR 8,200.',
    },
    assignedTo: a(0),
    daysOpen: 3,
  },

  // ─── 6. PUTERI NUR BADRINA – Luggage Claim – CU776464 ────────────────────
  {
    id: 'a1b2c3d4-6666-4000-8000-000000000006',
    smileAppPhone: '+60123456002',
    smileAppEmail: 'puteri.badrina@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU77646401010000007890',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9176001',
    claimSubmissionDate: '2026-05-06T00:00:00',
    statusCode: 4,
    stateCode: 0,
    claimStatus: 'Pending Info',
    claimEventType: 'Baggage Loss',
    policyNo: 'CU776464',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'BGL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU776464',
    coverageType: '',
    eventType: 'Baggage Loss',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-30T00:00:00',
    insuredName: 'PUTERI NUR BADRINA BINTI NOR MD RIHAN',
    lossTypeCode: 'BGL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-05-06T14:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 3800.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Luggage claim. Correspondence ongoing via CRM_0001239000060. Pending property irregularity report from airline.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Partial Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: false,
    claimPayment: paymentOf('PUTERI NUR BADRINA BINTI NOR MD RIHAN', '162089667788'),
    claimant: claimantOf('PUTERI NUR BADRINA BINTI NOR MD RIHAN', '950220065432', 'puteri.badrina@email.com', '0123456002', 'MS', '12 Jalan Bangsar', '59000 - Kuala Lumpur', 'Kuala Lumpur', '59000', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-06T14:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Pending Info', description: 'Awaiting Property Irregularity Report (PIR) from airline.', activityLogDate: '2026-05-11T17:47:24', claimStatus: 4, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Boarding Pass', fileName: 'Boarding Pass.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd13', created: '2026-05-06T14:00:00' },
      { documentType: 'Property Report', fileName: '', documentId: null, downloadUrl: '', statusCode: 0, fileId: 'd14', created: '' },
    ],
    claimReserveField: [{ id: 10006, subType: 'Baggage Loss', premiumClass: 'TS3', reserveCode: 'BL', reserveAmount: 3800.00, name: 'CU776464 - Baggage Loss', destination: 'United Kingdom', customerReserveAmount: 3800.00 }],
    claimIntegration: null,
    departureDateTime: '2026-04-28 10:00:00',
    newDepartureDateTime: null,
    flightNo: 'MH4',
    communications: emailsToCommunications(caseEmails('CU776464'), 'puteri.badrina@email.com'),
    aiRecommendation: {
      decision: 'Partial Approve', confidence: 0.65,
      reasoning: 'Luggage claim pending airline PIR. Boarding pass verified. Cannot approve without formal loss confirmation.',
      riskFlags: [
        { type: 'documentation', severity: 'high', description: 'Property Irregularity Report from airline not yet submitted' },
      ],
      suggestedAmount: 3800.00, missingDocuments: ['Property Irregularity Report (PIR)'], policyExclusions: [],
      summary: 'Luggage loss claim. Boarding pass OK. Blocked on missing PIR from airline. Hold for document.',
    },
    assignedTo: a(1),
    daysOpen: 7,
  },

  // ─── 7. OOI SAW WAH – Trip Cancellation – P9106385 ───────────────────────
  {
    id: 'a1b2c3d4-7777-4000-8000-000000000007',
    smileAppPhone: '+60123456003',
    smileAppEmail: 'ooi.sawwah@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'PU32214301010000008901',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'P9106385',
    claimSubmissionDate: '2026-05-07T00:00:00',
    statusCode: 2,
    stateCode: 0,
    claimStatus: 'In Review',
    claimEventType: 'Trip Cancellation',
    policyNo: 'PU322143',
    policyName: 'TripCare 360',
    policyType: null,
    causeTypeCode: 'ILL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'PU322143',
    coverageType: '',
    eventType: 'Trip Cancellation',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-01T00:00:00',
    insuredName: 'OOI SAW WAH',
    lossTypeCode: 'ILL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '2026-05-07T14:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 6500.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Trip cancellation due to illness. Image evidence submitted.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('OOI SAW WAH', '162089778899'),
    claimant: claimantOf('OOI SAW WAH', '720518045432', 'ooi.sawwah@email.com', '0123456003', 'MRS', '8 Jalan Penang', '10000 - George Town', 'Penang', '10000', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-07T14:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'In Review', description: 'Claim under review.', activityLogDate: '2026-05-11T17:50:13', claimStatus: 2, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Medical Report', fileName: 'image001.jpg', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd15', created: '2026-05-07T14:00:00' },
      { documentType: 'Flight Itinerary', fileName: 'Flight Booking.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd16', created: '2026-05-07T14:00:00' },
    ],
    claimReserveField: [{ id: 10007, subType: 'Trip Cancellation', premiumClass: 'TS3', reserveCode: 'TC', reserveAmount: 6500.00, name: 'PU322143 - Trip Cancellation', destination: 'Taiwan', customerReserveAmount: 6500.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-03 08:00:00',
    newDepartureDateTime: null,
    flightNo: 'CI722',
    communications: emailsToCommunications(caseEmails('P9106385'), 'ooi.sawwah@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.85,
      reasoning: 'Medical report and flight itinerary consistent with trip cancellation claim. Illness documented.',
      riskFlags: [],
      suggestedAmount: 6500.00, missingDocuments: [], policyExclusions: [],
      summary: 'Trip cancellation with medical proof. Recommend full approval MYR 6,500.',
    },
    assignedTo: a(2),
    daysOpen: 6,
  },

  // ─── 8. MOHD AZMI – Pending Documents – CU744250 ─────────────────────────
  {
    id: 'a1b2c3d4-8888-4000-8000-000000000008',
    smileAppPhone: '+60123456004',
    smileAppEmail: 'mohd.azmi@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU74425001010000009012',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9178001',
    claimSubmissionDate: '2026-04-25T00:00:00',
    statusCode: 4,
    stateCode: 0,
    claimStatus: 'Pending Info',
    claimEventType: 'Medical Expenses',
    policyNo: 'CU744250',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'MED',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU744250',
    coverageType: '',
    eventType: 'Medical Expenses',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-18T00:00:00',
    insuredName: 'MOHD AZMI BIN MAARIF',
    lossTypeCode: 'MED',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '2026-04-25T10:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 3200.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Travel claim pending supporting documents. Reminder sent to claimant for medical receipts.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: false,
    aiAssessmentResult: '',
    isAiProcessed: false,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: false,
    claimPayment: paymentOf('MOHD AZMI BIN MAARIF', '162089889900'),
    claimant: claimantOf('MOHD AZMI BIN MAARIF', '850912025432', 'mohd.azmi@email.com', '0123456004', 'MR', '45 Jalan Johor', '80000 - Johor Bahru', 'Johor', '80000', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-04-25T10:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Pending Documents', description: 'Awaiting medical receipts from claimant.', activityLogDate: '2026-05-11T17:51:46', claimStatus: 4, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Medical Report', fileName: 'image001.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd17', created: '2026-04-25T10:00:00' },
      { documentType: 'Receipt', fileName: '', documentId: null, downloadUrl: '', statusCode: 0, fileId: 'd18', created: '' },
    ],
    claimReserveField: [{ id: 10008, subType: 'Medical Expenses', premiumClass: 'TS3', reserveCode: 'ME', reserveAmount: 3200.00, name: 'CU744250 - Medical Expenses', destination: 'Indonesia', customerReserveAmount: 3200.00 }],
    claimIntegration: null,
    departureDateTime: '2026-04-15 09:00:00',
    newDepartureDateTime: null,
    flightNo: 'AK360',
    communications: emailsToCommunications(caseEmails('CU744250'), 'mohd.azmi@email.com'),
    aiRecommendation: {
      decision: 'Escalate', confidence: 0.50,
      reasoning: 'Medical report received but expense receipts still pending. Claimed amount of MYR 3,200 requires receipt verification before approval.',
      riskFlags: [
        { type: 'documentation', severity: 'high', description: 'Medical expense receipts not yet submitted' },
        { type: 'amount', severity: 'medium', description: 'Claimed amount requires receipt substantiation' },
      ],
      suggestedAmount: null, missingDocuments: ['Medical expense receipts'], policyExclusions: [],
      summary: 'Medical expenses claim with report received but receipts outstanding. Escalate pending documentation.',
    },
    assignedTo: a(0),
    daysOpen: 18,
  },

  // ─── 9. ABD LATIFF – Certificate Status – CU284412 ──────────────────────
  {
    id: 'a1b2c3d4-9999-4000-8000-000000000009',
    smileAppPhone: '+60123456005',
    smileAppEmail: 'abd.latiff@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU28441201010000010123',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9179001',
    claimSubmissionDate: '2026-04-20T00:00:00',
    statusCode: 7,
    stateCode: 0,
    claimStatus: 'Assessed',
    claimEventType: 'Travel Delay',
    policyNo: 'CU284412',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU284412',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-15T00:00:00',
    insuredName: 'ABD LATIFF BIN MD YUSUF',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 4,
    priority: 4,
    created: '2026-04-20T09:00:00',
    claimAmount: 400.00,
    customerClaimAmount: 400.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Certificate status inquiry. Claim assessed and approved previously.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('ABD LATIFF BIN MD YUSUF', '162089990011'),
    claimant: claimantOf('ABD LATIFF BIN MD YUSUF', '650315015432', 'abd.latiff@email.com', '0123456005', 'MR', '23 Jalan Kuching', '50600 - Kuala Lumpur', 'Kuala Lumpur', '50600', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-04-20T09:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Assessed', description: 'Claim assessed. MYR 400 approved.', activityLogDate: '2026-04-28T16:00:00', claimStatus: 7, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Flight Delay Certificate', fileName: 'Delay Certificate.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd19', created: '2026-04-20T09:00:00' },
      { documentType: 'Receipt', fileName: 'Meal Receipts.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd20', created: '2026-04-20T09:00:00' },
    ],
    claimReserveField: [{ id: 10009, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 400.00, name: 'CU284412 - Travel Delay', destination: 'Thailand', customerReserveAmount: 400.00 }],
    claimIntegration: null,
    departureDateTime: '2026-04-15 14:00:00',
    newDepartureDateTime: '2026-04-15 21:00:00',
    flightNo: 'TG416',
    communications: emailsToCommunications(caseEmails('CU284412'), 'abd.latiff@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.95,
      reasoning: 'Flight delay exceeds threshold. All documents verified and claim assessed.',
      riskFlags: [],
      suggestedAmount: 400.00, missingDocuments: [], policyExclusions: [],
      summary: 'Assessed and approved. MYR 400 for 7-hour flight delay. Certificate status follow-up from claimant.',
    },
    assignedTo: a(1),
    daysOpen: 23,
  },

  // ─── 10. SIN CHIAN YING – Firefly Flight Delay ───────────────────────────
  {
    id: 'a1b2c3d4-aaaa-4000-8000-000000000010',
    smileAppPhone: '+60123456006',
    smileAppEmail: 'sin.chianying@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'MBB-FIREFLY-2026-00101',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9180001',
    claimSubmissionDate: '2026-05-10T00:00:00',
    statusCode: 2,
    stateCode: 0,
    claimStatus: 'In Review',
    claimEventType: 'Travel Delay',
    policyNo: 'MBB-PLT-889012',
    policyName: 'Maybank Platinum Travel Insurance',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'MBB-PLT-889012',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-03T00:00:00',
    insuredName: 'SIN CHIAN YING',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '2026-05-10T11:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 750.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Firefly flight delay. Purchased via MBB credit card. Multiple email exchanges with supporting documents including bank statement and photos.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('SIN CHIAN YING', '162089101122'),
    claimant: claimantOf('SIN CHIAN YING', '880712145432', 'sin.chianying@email.com', '0123456006', 'MS', '55 Persiaran Damansara', '47400 - Petaling Jaya', 'Selangor', '47400', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-10T11:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'In Review', description: 'Multiple documents under review.', activityLogDate: '2026-05-11T17:57:00', claimStatus: 2, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Receipt', fileName: '0379011908636600_20260503.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd21', created: '2026-05-10T11:00:00' },
      { documentType: 'Boarding Pass', fileName: '821343.jpg', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd22', created: '2026-05-10T11:00:00' },
      { documentType: 'Supporting Document', fileName: 'gmail_images20260504_203911.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd23', created: '2026-05-10T11:00:00' },
    ],
    claimReserveField: [{ id: 10010, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 750.00, name: 'MBB-PLT-889012 - Travel Delay', destination: 'Penang', customerReserveAmount: 750.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-03 18:00:00',
    newDepartureDateTime: '2026-05-04 02:00:00',
    flightNo: 'FY1234',
    communications: emailsToCommunications(caseEmails('FIREFLY-MBB'), 'sin.chianying@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.88,
      reasoning: 'Firefly flight delay. Bank statement and boarding pass verify claim. MBB credit card purchase confirmed via statement.',
      riskFlags: [{ type: 'documentation', severity: 'low', description: 'Credit card statement shows purchase but delay certificate from airline not included' }],
      suggestedAmount: 750.00, missingDocuments: [], policyExclusions: [],
      summary: 'Flight delay claim via MBB Platinum coverage. Strong documentation. Approve MYR 750.',
    },
    assignedTo: a(2),
    daysOpen: 3,
  },

  // ─── 11. PU551128 – Enquiry on Flight Delay Coverage ─────────────────────
  {
    id: 'a1b2c3d4-bbbb-4000-8000-000000000011',
    smileAppPhone: '+60123456007',
    smileAppEmail: 'enquiry.pu551128@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'PU55112801010000011234',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9181001',
    claimSubmissionDate: '2026-05-11T00:00:00',
    statusCode: 1,
    stateCode: 0,
    claimStatus: 'New',
    claimEventType: 'Travel Delay',
    policyNo: 'PU551128',
    policyName: 'TripCare 360',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'PU551128',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-03T00:00:00',
    insuredName: 'TAN MAY LING',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '2026-05-11T09:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 500.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Enquiry on flight delay coverage for Indonesia trip. Insurance certificate, itinerary, rescheduled boarding pass, and schedule screenshots submitted.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('TAN MAY LING', '162089112234'),
    claimant: claimantOf('TAN MAY LING', '910508145432', 'enquiry.pu551128@email.com', '0123456007', 'MS', '78 Lorong Setiawangsa', '54200 - Kuala Lumpur', 'Kuala Lumpur', '54200', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-11T09:00:00', claimStatus: 3, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Policy Document', fileName: 'Indonesia Trip_Insurance_260503_150115.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd24', created: '2026-05-11T09:00:00' },
      { documentType: 'Flight Itinerary', fileName: 'Medan to Penang Itenary.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd25', created: '2026-05-11T09:00:00' },
      { documentType: 'Boarding Pass', fileName: 'Reschedule boarding pass.jpeg', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd26', created: '2026-05-11T09:00:00' },
      { documentType: 'Supporting Document', fileName: 'Schedule during booking - 9.30pm.jpeg', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd27', created: '2026-05-11T09:00:00' },
      { documentType: 'Supporting Document', fileName: 'Reschedule during the day - 11.30pm.jpeg', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd28', created: '2026-05-11T09:00:00' },
    ],
    claimReserveField: [{ id: 10011, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 500.00, name: 'PU551128 - Travel Delay', destination: 'Indonesia', customerReserveAmount: 500.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-03 21:30:00',
    newDepartureDateTime: '2026-05-04 23:30:00',
    flightNo: 'AK395',
    communications: emailsToCommunications(caseEmails('PU551128'), 'enquiry.pu551128@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.90,
      reasoning: 'Flight rescheduled from 9:30pm to 11:30pm next day — over 2 hours delay. Insurance certificate, itinerary, and boarding pass all align. Schedule screenshots provide strong evidence.',
      riskFlags: [],
      suggestedAmount: 500.00, missingDocuments: [], policyExclusions: [],
      summary: 'Flight delay from Medan to Penang. Rescheduled by over 24 hours. Comprehensive evidence. Approve MYR 500.',
    },
    assignedTo: a(0),
    daysOpen: 2,
  },

  // ─── 12. LEE THENG THENG – Pending Documents – CU639251 ──────────────────
  {
    id: 'a1b2c3d4-cccc-4000-8000-000000000012',
    smileAppPhone: '+60123456008',
    smileAppEmail: 'leethengtheng@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU63925101010000012345',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9182001',
    claimSubmissionDate: '2026-04-15T00:00:00',
    statusCode: 4,
    stateCode: 0,
    claimStatus: 'Pending Info',
    claimEventType: 'Trip Cancellation',
    policyNo: 'CU639251',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'ILL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU639251',
    coverageType: '',
    eventType: 'Trip Cancellation',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-05T00:00:00',
    insuredName: 'LEE THENG THENG',
    lossTypeCode: 'ILL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-04-15T09:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 5800.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Customer responded with 6 attachments: e-receipts, itinerary, and deposit/full payment receipts for 28 Dec – 1 Jan trip.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('LEE THENG THENG', '162089223345'),
    claimant: claimantOf('LEE THENG THENG', '900220145432', 'leethengtheng@email.com', '0123456008', 'MS', '99 Jalan Sultan Ismail', '50250 - Kuala Lumpur', 'Kuala Lumpur', '50250', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-04-15T09:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Pending Documents', description: 'Requested itinerary and payment receipts.', activityLogDate: '2026-04-20T10:00:00', claimStatus: 4, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Receipt', fileName: 'E-receipt theng theng.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd29', created: '2026-05-11T19:10:06' },
      { documentType: 'Flight Itinerary', fileName: 'Itinerary and receipt.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd30', created: '2026-05-11T19:10:06' },
      { documentType: 'Receipt', fileName: 'Resit .pdf', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd31', created: '2026-05-11T19:10:06' },
      { documentType: 'Receipt', fileName: 'RESIT DP - LEETHENG 28DEC-1JAN.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd32', created: '2026-05-11T19:10:06' },
      { documentType: 'Receipt', fileName: 'RESIT FULL - LEETHENG 28DEC-1JAN.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd33', created: '2026-05-11T19:10:06' },
    ],
    claimReserveField: [{ id: 10012, subType: 'Trip Cancellation', premiumClass: 'TS3', reserveCode: 'TC', reserveAmount: 5800.00, name: 'CU639251 - Trip Cancellation', destination: 'Japan', customerReserveAmount: 5800.00 }],
    claimIntegration: null,
    departureDateTime: '2025-12-28 08:00:00',
    newDepartureDateTime: null,
    flightNo: 'MH70',
    communications: emailsToCommunications(caseEmails('CU639251'), 'leethengtheng@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.92,
      reasoning: 'All requested documents now submitted. E-receipts, itineraries, and payment receipts verified for 28 Dec – 1 Jan trip. Amounts consistent with claim.',
      riskFlags: [],
      suggestedAmount: 5800.00, missingDocuments: [], policyExclusions: [],
      summary: 'Comprehensive documentation received. Deposit and full payment receipts verified. Recommend full approval MYR 5,800.',
    },
    assignedTo: a(1),
    daysOpen: 28,
  },

  // ─── 13. MOHD FAIZAL – Flight Delay – C9176096 ───────────────────────────
  {
    id: 'a1b2c3d4-dddd-4000-8000-000000000013',
    smileAppPhone: '+60123456009',
    smileAppEmail: 'mohd.faizal@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU72508501010000013456',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9176096',
    claimSubmissionDate: '2026-05-08T00:00:00',
    statusCode: 2,
    stateCode: 0,
    claimStatus: 'In Review',
    claimEventType: 'Travel Delay',
    policyNo: 'CU725085',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU725085',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-02T00:00:00',
    insuredName: 'MOHD FAIZAL BIN ABU BAKKAR',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '2026-05-08T15:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 550.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Flight delay claim. Customer reply received with image attachment.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('MOHD FAIZAL BIN ABU BAKKAR', '162089334456'),
    claimant: claimantOf('MOHD FAIZAL BIN ABU BAKKAR', '870112015432', 'mohd.faizal@email.com', '0123456009', 'MR', '18 Jalan Melaka', '75000 - Melaka', 'Melaka', '75000', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-08T15:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'In Review', description: 'Claim in review. Customer reply received.', activityLogDate: '2026-05-11T19:44:33', claimStatus: 2, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Boarding Pass', fileName: 'image001.jpg', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd34', created: '2026-05-08T15:00:00' },
      { documentType: 'Flight Delay Certificate', fileName: 'Delay Certificate.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd35', created: '2026-05-08T15:00:00' },
    ],
    claimReserveField: [{ id: 10013, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 550.00, name: 'CU725085 - Travel Delay', destination: 'Vietnam', customerReserveAmount: 550.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-02 10:00:00',
    newDepartureDateTime: '2026-05-02 18:30:00',
    flightNo: 'VJ826',
    communications: emailsToCommunications(caseEmails('C9176096'), 'mohd.faizal@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.90,
      reasoning: 'Flight delay of 8.5 hours verified. Boarding pass and delay certificate consistent.',
      riskFlags: [],
      suggestedAmount: 550.00, missingDocuments: [], policyExclusions: [],
      summary: 'Standard flight delay. 8.5 hr delay confirmed. Approve MYR 550.',
    },
    assignedTo: a(2),
    daysOpen: 5,
  },

  // ─── 14. MOHD RAISSUDIN – REDO Multiple Claims – CU636796 ────────────────
  {
    id: 'a1b2c3d4-eeee-4000-8000-000000000014',
    smileAppPhone: '+60123456010',
    smileAppEmail: 'raissudin.ramli@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU63679601010000014567',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9180602',
    claimSubmissionDate: '2026-05-10T00:00:00',
    statusCode: 2,
    stateCode: 0,
    claimStatus: 'In Review',
    claimEventType: 'Travel Delay',
    policyNo: 'CU636796',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU636796',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-05T00:00:00',
    insuredName: 'MOHD RAISSUDIN BIN RAMLI',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-05-10T14:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 1200.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'REDO required. Multiple claim numbers C9180602 / C9180604 under same policy. 7 image attachments provided.',
    customerRemark: '',
    claimAccessorRemark: 'Requires redo — original processing had errors',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: false,
    aiAssessmentResult: '',
    isAiProcessed: false,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('MOHD RAISSUDIN BIN RAMLI', '162089445567'),
    claimant: claimantOf('MOHD RAISSUDIN BIN RAMLI', '880615015432', 'raissudin.ramli@email.com', '0123456010', 'MR', '33 Jalan Pahang', '25000 - Kuantan', 'Pahang', '25000', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-10T14:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'REDO', description: 'REDO required for claims C9180602 / C9180604.', activityLogDate: '2026-05-12T05:43:48', claimStatus: 2, category: 1, remark: 'Processing error correction' },
    ],
    claimUpload: [
      { documentType: 'Supporting Document', fileName: 'image.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd36', created: '2026-05-10T14:00:00' },
      { documentType: 'Supporting Document', fileName: 'image_1.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd37', created: '2026-05-10T14:00:00' },
      { documentType: 'Supporting Document', fileName: 'image_2.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd38', created: '2026-05-10T14:00:00' },
    ],
    claimReserveField: [{ id: 10014, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 1200.00, name: 'CU636796 - Travel Delay', destination: 'Bangkok', customerReserveAmount: 1200.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-05 07:00:00',
    newDepartureDateTime: '2026-05-05 15:00:00',
    flightNo: 'AK882',
    communications: emailsToCommunications(caseEmails('C9180602'), 'raissudin.ramli@email.com'),
    aiRecommendation: {
      decision: 'Escalate', confidence: 0.45,
      reasoning: 'Multiple claim numbers (C9180602 / C9180604) under same policy flagged for REDO. 7 image attachments provided but claim linkage needs manual review. Potential duplicate submission risk.',
      riskFlags: [
        { type: 'fraud', severity: 'medium', description: 'Multiple claim numbers under same policy – possible duplicate' },
        { type: 'documentation', severity: 'medium', description: 'REDO required – claim data needs reconciliation' },
      ],
      suggestedAmount: 1200.00, missingDocuments: [], policyExclusions: [],
      summary: 'Travel delay claim with REDO flag. Multiple claim references need manual reconciliation before processing.',
    },
    assignedTo: a(0),
    daysOpen: 3,
  },

  // ─── 15. AE YIT YUEN – Trip Curtailment – P9096694 ───────────────────────
  {
    id: 'a1b2c3d4-ffff-4000-8000-000000000015',
    smileAppPhone: '+60123456011',
    smileAppEmail: 'ae.yityuen@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'PU44806001010000015678',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'P9096694',
    claimSubmissionDate: '2026-04-20T00:00:00',
    statusCode: 4,
    stateCode: 0,
    claimStatus: 'Pending Info',
    claimEventType: 'Trip Curtailment',
    policyNo: 'PU448060',
    policyName: 'TripCare 360',
    policyType: null,
    causeTypeCode: 'ILL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'PU448060',
    coverageType: '',
    eventType: 'Trip Curtailment',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-12T00:00:00',
    insuredName: 'AE YIT YUEN',
    lossTypeCode: 'ILL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-04-20T09:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 9800.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Etiqa+ KIV — Trip curtailment claim. Customer cut trip short. Awaiting additional documentation.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Partial Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: false,
    claimPayment: paymentOf('AE YIT YUEN', '162089556678'),
    claimant: claimantOf('AE YIT YUEN', '750415145432', 'ae.yityuen@email.com', '0123456011', 'MR', '112 Jalan Ipoh', '31400 - Ipoh', 'Perak', '31400', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-04-20T09:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'KIV', description: 'KIV — Pending additional documentation for trip curtailment.', activityLogDate: '2026-05-12T07:50:46', claimStatus: 4, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Flight Itinerary', fileName: 'Original Itinerary.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd39', created: '2026-04-20T09:00:00' },
      { documentType: 'Flight Itinerary', fileName: 'Return Flight - Early.pdf', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd40', created: '2026-04-20T09:00:00' },
      { documentType: 'Medical Report', fileName: '', documentId: null, downloadUrl: '', statusCode: 0, fileId: 'd41', created: '' },
    ],
    claimReserveField: [{ id: 10015, subType: 'Trip Curtailment', premiumClass: 'TS3', reserveCode: 'TT', reserveAmount: 9800.00, name: 'PU448060 - Trip Curtailment', destination: 'Australia', customerReserveAmount: 9800.00 }],
    claimIntegration: null,
    departureDateTime: '2026-04-10 09:00:00',
    newDepartureDateTime: null,
    flightNo: 'MH145',
    communications: emailsToCommunications(caseEmails('P9096694'), 'ae.yityuen@email.com'),
    aiRecommendation: {
      decision: 'Partial Approve', confidence: 0.72,
      reasoning: 'Trip curtailment claim with original and early-return itineraries. Medical report for curtailment reason is still missing.',
      riskFlags: [
        { type: 'documentation', severity: 'high', description: 'Medical report for trip curtailment reason not submitted' },
      ],
      suggestedAmount: 9800.00, missingDocuments: ['Medical report supporting reason for trip curtailment'], policyExclusions: [],
      summary: 'Trip curtailment from Australia. Itineraries provided but medical proof missing. KIV until documentation complete.',
    },
    assignedTo: a(1),
    daysOpen: 23,
  },

  // ─── 16. Missed Travel Connection – CU76470801010000150502 ────────────────
  {
    id: 'a1b2c3d4-1010-4000-8000-000000000016',
    smileAppPhone: '+60123456012',
    smileAppEmail: 'mtc.claimant@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU76470801010000150502',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9183001',
    claimSubmissionDate: '2026-05-12T00:00:00',
    statusCode: 1,
    stateCode: 0,
    claimStatus: 'New',
    claimEventType: 'Missed Travel Connection',
    policyNo: 'CU764708',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU764708',
    coverageType: '',
    eventType: 'Missed Travel Connection',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-08T00:00:00',
    insuredName: 'WONG KAH SENG',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-05-12T07:59:14',
    claimAmount: 0.00,
    customerClaimAmount: 4200.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Missed connection at KIX. Flight diverted causing missed connecting Batik Air flight. 8 supporting documents including boarding passes, receipts, and flight diversion certification.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: true,
    aiAssessmentResult: 'Approve',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('WONG KAH SENG', '162089667789'),
    claimant: claimantOf('WONG KAH SENG', '870915145432', 'mtc.claimant@email.com', '0123456012', 'MR', '20 Persiaran Surian', '47810 - Petaling Jaya', 'Selangor', '47810', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-12T07:59:14', claimStatus: 3, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Boarding Pass', fileName: 'AirAsia KUL-KIX Boarding Pass.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd42', created: '2026-05-12T07:59:14' },
      { documentType: 'Flight Itinerary', fileName: 'Batik Air Itinerary.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd43', created: '2026-05-12T07:59:14' },
      { documentType: 'Receipt', fileName: 'Batik Air KIX-KUL Receipt.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd44', created: '2026-05-12T07:59:14' },
      { documentType: 'Flight Itinerary', fileName: 'CYGYYS Itinerary KUL-KIX.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd45', created: '2026-05-12T07:59:14' },
      { documentType: 'Receipt', fileName: 'CYGYYS KUL-KIX AirAsia Receipt.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd46', created: '2026-05-12T07:59:14' },
      { documentType: 'Flight Itinerary', fileName: 'FE78NE VA Ticket Open.pdf', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd47', created: '2026-05-12T07:59:14' },
      { documentType: 'Flight Delay Certificate', fileName: 'FlightDivertedCertification_08May2026_14-06-02.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd48', created: '2026-05-12T07:59:14' },
      { documentType: 'Boarding Pass', fileName: 'VA Boarding Pass.pdf', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd49', created: '2026-05-12T07:59:14' },
    ],
    claimReserveField: [{ id: 10016, subType: 'Missed Travel Connection', premiumClass: 'TS3', reserveCode: 'MC', reserveAmount: 4200.00, name: 'CU764708 - Missed Travel Connection', destination: 'Japan', customerReserveAmount: 4200.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-08 08:00:00',
    newDepartureDateTime: null,
    flightNo: 'AK504',
    communications: emailsToCommunications(caseEmails('CU764708-MTC'), 'mtc.claimant@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.93,
      reasoning: 'Comprehensive documentation. Flight diversion certification from airline confirms diverted flight caused missed connection. All boarding passes and receipts consistent. Replacement Batik Air ticket receipt matches claim amount.',
      riskFlags: [],
      suggestedAmount: 4200.00, missingDocuments: [], policyExclusions: [],
      summary: 'Missed connection due to diverted flight at KIX. Excellent documentation with 8 supporting files. Approve MYR 4,200.',
    },
    assignedTo: a(2),
    daysOpen: 1,
  },

  // ─── 17. NAJMAH ABD RAHMAN – Pending Case – CU734963 ─────────────────────
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000017',
    smileAppPhone: '+60123456013',
    smileAppEmail: 'najmah.rahman@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU73496301010000016789',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9184001',
    claimSubmissionDate: '2026-04-28T00:00:00',
    statusCode: 4,
    stateCode: 0,
    claimStatus: 'Pending Info',
    claimEventType: 'Travel Delay',
    policyNo: 'CU734963',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU734963',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-20T00:00:00',
    insuredName: 'NAJMAH ABD RAHMAN',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '2026-04-28T09:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 680.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Updated pending case. Customer responded with 7 image attachments.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: false,
    aiAssessmentResult: '',
    isAiProcessed: false,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: false,
    claimPayment: paymentOf('NAJMAH ABD RAHMAN', '162089778890'),
    claimant: claimantOf('NAJMAH ABD RAHMAN', '780918065432', 'najmah.rahman@email.com', '0123456013', 'MRS', '44 Jalan Terengganu', '20200 - Kuala Terengganu', 'Terengganu', '20200', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-04-28T09:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Pending Info', description: 'Awaiting additional documents.', activityLogDate: '2026-05-05T10:00:00', claimStatus: 4, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Supporting Document', fileName: 'image.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd50', created: '2026-05-12T08:00:29' },
      { documentType: 'Supporting Document', fileName: 'image_1.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd51', created: '2026-05-12T08:00:29' },
      { documentType: 'Supporting Document', fileName: 'image_2.png', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd52', created: '2026-05-12T08:00:29' },
    ],
    claimReserveField: [{ id: 10017, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 680.00, name: 'CU734963 - Travel Delay', destination: 'Thailand', customerReserveAmount: 680.00 }],
    claimIntegration: null,
    departureDateTime: '2026-04-20 08:00:00',
    newDepartureDateTime: '2026-04-20 15:30:00',
    flightNo: 'FD321',
    communications: emailsToCommunications(caseEmails('CU734963'), 'najmah.rahman@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.78,
      reasoning: 'Travel delay claim with supporting documents provided. Group policy confirmed via claimant correspondence. Flight delay of 7.5 hours exceeds policy trigger of 6 hours.',
      riskFlags: [
        { type: 'policy', severity: 'low', description: 'Group policy – not visible in claimant mobile app, verified via email' },
      ],
      suggestedAmount: 680.00, missingDocuments: [], policyExclusions: [],
      summary: 'Travel delay claim under group policy. Documentation complete, delay verified. Recommend approval of MYR 680.',
    },
    assignedTo: a(0),
    daysOpen: 15,
  },

  // ─── 18. NORAZLINA – Pending Docs 2nd Reminder – CU743278 ────────────────
  {
    id: 'a1b2c3d4-1212-4000-8000-000000000018',
    smileAppPhone: '+60123456014',
    smileAppEmail: 'norazlina.shariff@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU74327801010000017890',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9185001',
    claimSubmissionDate: '2026-04-18T00:00:00',
    statusCode: 4,
    stateCode: 0,
    claimStatus: 'Pending Info',
    claimEventType: 'Medical Expenses',
    policyNo: 'CU743278',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'MED',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU743278',
    coverageType: '',
    eventType: 'Medical Expenses',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-10T00:00:00',
    insuredName: 'NORAZLINA BINTI SHARIFFUDDIN',
    lossTypeCode: 'MED',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-04-18T10:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 2800.00,
    sourceSystem: 'Etiqa+',
    caseRemark: '2nd reminder sent. Pending supporting medical documents. PDF attachment "9A76OK.pdf" received with partial response.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: false,
    aiAssessmentResult: '',
    isAiProcessed: false,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: false,
    claimPayment: paymentOf('NORAZLINA BINTI SHARIFFUDDIN', '162089889901'),
    claimant: claimantOf('NORAZLINA BINTI SHARIFFUDDIN', '820225065432', 'norazlina.shariff@email.com', '0123456014', 'MRS', '56 Jalan Negeri Sembilan', '70000 - Seremban', 'Negeri Sembilan', '70000', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-04-18T10:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Pending Documents', description: '1st reminder: Awaiting medical receipts.', activityLogDate: '2026-04-28T10:00:00', claimStatus: 4, category: 1, remark: null },
      { subject: '2nd Reminder', description: '2nd reminder sent for pending documents.', activityLogDate: '2026-05-11T19:10:04', claimStatus: 4, category: 1, remark: null },
    ],
    claimUpload: [
      { documentType: 'Medical Report', fileName: '9A76OK.pdf', documentId: null, downloadUrl: '', statusCode: 1, fileId: 'd53', created: '2026-05-11T19:10:04' },
      { documentType: 'Receipt', fileName: '', documentId: null, downloadUrl: '', statusCode: 0, fileId: 'd54', created: '' },
    ],
    claimReserveField: [{ id: 10018, subType: 'Medical Expenses', premiumClass: 'TS3', reserveCode: 'ME', reserveAmount: 2800.00, name: 'CU743278 - Medical Expenses', destination: 'Vietnam', customerReserveAmount: 2800.00 }],
    claimIntegration: null,
    departureDateTime: '2026-04-08 09:00:00',
    newDepartureDateTime: null,
    flightNo: 'VJ826',
    communications: emailsToCommunications(caseEmails('CU743278'), 'norazlina.shariff@email.com'),
    aiRecommendation: {
      decision: 'Escalate', confidence: 0.52,
      reasoning: 'Medical expenses claim with report received but receipts still missing after 2nd reminder. 25 days open exceeds SLA. High risk of claimant dissatisfaction.',
      riskFlags: [
        { type: 'documentation', severity: 'high', description: 'Expense receipts not submitted despite 2nd reminder' },
        { type: 'policy', severity: 'medium', description: 'SLA breach – 25 days without resolution' },
      ],
      suggestedAmount: null, missingDocuments: ['Medical expense receipts'], policyExclusions: [],
      summary: 'Medical claim pending receipts after 2nd reminder. SLA breached at 25 days. Escalate for management follow-up.',
    },
    assignedTo: a(1),
    daysOpen: 25,
  },

  // ─── 19. Appeal – CU84283201010000152078 ──────────────────────────────────
  {
    id: 'a1b2c3d4-1313-4000-8000-000000000019',
    smileAppPhone: '+60123456015',
    smileAppEmail: 'appeal.cu842832@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'CU84283201010000152078',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9186001',
    claimSubmissionDate: '2026-04-10T00:00:00',
    statusCode: 5,
    stateCode: 0,
    claimStatus: 'Rejected',
    claimEventType: 'Travel Delay',
    policyNo: 'CU842832',
    policyName: 'TripCare 360 Takaful',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'CU842832',
    coverageType: '',
    eventType: 'Travel Delay',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-04-01T00:00:00',
    insuredName: 'HAKIM BIN ZAINAL',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-04-10T10:00:00',
    claimAmount: 0.00,
    customerClaimAmount: 500.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Previously rejected — delay below 2 hour threshold. Customer has filed appeal.',
    customerRemark: '',
    claimAccessorRemark: 'Rejected: delay less than policy threshold',
    appealRemark: 'Customer believes actual delay was longer than system recorded.',
    isAppeal: true,
    isAiAssessed: true,
    aiAssessmentResult: 'Reject',
    isAiProcessed: true,
    aiIsDocRelatedClaim: true,
    aiIsDocMatchClaim: true,
    claimPayment: paymentOf('HAKIM BIN ZAINAL', '162089990012'),
    claimant: claimantOf('HAKIM BIN ZAINAL', '910405015432', 'appeal.cu842832@email.com', '0123456015', 'MR', '72 Jalan Perak', '30000 - Ipoh', 'Perak', '30000', 'Male'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-04-10T10:00:00', claimStatus: 3, category: 1, remark: null },
      { subject: 'Rejected', description: 'Delay below policy threshold of 2 hours.', activityLogDate: '2026-04-12T09:00:00', claimStatus: 5, category: 1, remark: null },
      { subject: 'Appeal Filed', description: 'Customer filed appeal claiming actual delay was longer.', activityLogDate: '2026-05-11T18:53:49', claimStatus: 5, category: 1, remark: 'Appeal' },
    ],
    claimUpload: [
      { documentType: 'Boarding Pass', fileName: 'Boarding Pass.pdf', documentId: null, downloadUrl: '', statusCode: 2, fileId: 'd55', created: '2026-04-10T10:00:00' },
    ],
    claimReserveField: [{ id: 10019, subType: 'Travel Delay', premiumClass: 'TS3', reserveCode: 'TD', reserveAmount: 0.00, name: 'CU842832 - Travel Delay', destination: 'Jakarta', customerReserveAmount: 500.00 }],
    claimIntegration: { claimSubmissionNumber: 'CU84283201010000152078', claimNumber: 'C9186001', requisitionNumber: '', claimAmount: 0.00, sourceOfTransaction: 'ETIQA+', claimStatusDescription: 'Claim Rejected', claimErrorDescription: 'REJ Invalid Travel Delay' },
    departureDateTime: '2026-04-01 08:00:00',
    newDepartureDateTime: '2026-04-01 09:30:00',
    flightNo: 'AK380',
    communications: emailsToCommunications(caseEmails('CU842832-APPEAL'), 'appeal.cu842832@email.com'),
    aiRecommendation: {
      decision: 'Reject', confidence: 0.85,
      reasoning: 'System recorded delay of 1.5 hours, below the 2-hour policy threshold. Appeal filed but no additional evidence provided to dispute system record.',
      riskFlags: [
        { type: 'policy', severity: 'medium', description: 'Delay below 2-hour policy threshold per Variflight data' },
      ],
      suggestedAmount: 0, missingDocuments: ['Evidence of actual delay exceeding 2 hours'], policyExclusions: ['Travel delay below minimum 2-hour threshold'],
      summary: 'Appeal case. Original rejection stands — delay below threshold. No new evidence from claimant. Recommend uphold rejection.',
    },
    assignedTo: a(2),
    daysOpen: 33,
  },

  // ─── 20. PU578252 – Flight Cancellation ───────────────────────────────────
  {
    id: 'a1b2c3d4-1414-4000-8000-000000000020',
    smileAppPhone: '+60123456016',
    smileAppEmail: 'flightcancel.pu578252@email.com',
    claimType: 'Travel Claim',
    claimNumber: 'PU57825201010000018901',
    claimCategory: 2,
    needSubmitStp: true,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: 'C9187001',
    claimSubmissionDate: '2026-05-11T00:00:00',
    statusCode: 1,
    stateCode: 0,
    claimStatus: 'New',
    claimEventType: 'Flight Cancellation',
    policyNo: 'PU578252',
    policyName: 'TripCare 360',
    policyType: null,
    causeTypeCode: 'FLL',
    claimAgainstOtherPartyRemarks: '',
    contractType: 'TPT',
    coverageNo: 'PU578252',
    coverageType: '',
    eventType: 'Flight Cancellation',
    haveClaimAgainstOtherParty: false,
    incidentDate: '2026-05-06T00:00:00',
    insuredName: 'NURUL HUDA BINTI ISMAIL',
    lossTypeCode: 'FLL',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: 'ETB',
    sourceCoreSystem: 'PolisyM',
    schemeCode: 'W09',
    planCodeDesc: 'Individual',
    planCode: 'V3',
    numOfDependant: 0,
    severity: 2,
    priority: 2,
    created: '2026-05-11T19:02:14',
    claimAmount: 0.00,
    customerClaimAmount: 3500.00,
    sourceSystem: 'Etiqa+',
    caseRemark: 'Travel insurance claim for flight cancellation. New submission — no documents attached yet.',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: false,
    aiAssessmentResult: '',
    isAiProcessed: false,
    aiIsDocRelatedClaim: false,
    aiIsDocMatchClaim: false,
    claimPayment: paymentOf('NURUL HUDA BINTI ISMAIL', '162089101123'),
    claimant: claimantOf('NURUL HUDA BINTI ISMAIL', '940818065432', 'flightcancel.pu578252@email.com', '0123456016', 'MS', '30 Jalan Kedah', '05000 - Alor Setar', 'Kedah', '05000', 'Female'),
    claimStatusChangeLog: [
      { subject: 'Claim Submitted', description: 'Your Travel Claim Request has been Received!', activityLogDate: '2026-05-11T19:02:14', claimStatus: 3, category: 1, remark: null },
    ],
    claimUpload: [],
    claimReserveField: [{ id: 10020, subType: 'Flight Cancellation', premiumClass: 'TS3', reserveCode: 'FC', reserveAmount: 3500.00, name: 'PU578252 - Flight Cancellation', destination: 'Singapore', customerReserveAmount: 3500.00 }],
    claimIntegration: null,
    departureDateTime: '2026-05-06 15:00:00',
    newDepartureDateTime: null,
    flightNo: 'SQ119',
    communications: emailsToCommunications(caseEmails('PU578252'), 'flightcancel.pu578252@email.com'),
    aiRecommendation: {
      decision: 'Approve', confidence: 0.82,
      reasoning: 'Flight cancellation claim for SQ119 KUL–SIN. Cancellation confirmed via airline notification. Claim submitted within 2 days of incident. No documents uploaded yet but claim amount within policy limits.',
      riskFlags: [
        { type: 'documentation', severity: 'low', description: 'No supporting documents uploaded yet – new claim' },
      ],
      suggestedAmount: 3500.00, missingDocuments: ['Flight cancellation notification', 'Original booking confirmation'], policyExclusions: [],
      summary: 'Fresh flight cancellation claim. Airline cancellation verified. Recommend approval of MYR 3,500 pending standard document upload.',
    },
    assignedTo: a(0),
    daysOpen: 2,
  },
];
