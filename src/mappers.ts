import type { Claim, Communication } from './data/mockClaims';

/** Clean email body: strip security banners and confidentiality footers */
function cleanEmailBody(raw: string | undefined): string {
  if (!raw) return '';
  let body = raw.replace(/\r\n/g, '\n');
  body = body.replace(/WARNING![\s\S]*?if you cannot ascertain that it is safe\.\n*/i, '');
  body = body.replace(/AMARAN![\s\S]*?dari e-mel ini\.\n*/i, '');
  const footerMarkers = [
    '________________________________\n\nThis message is intended only',
    '________________________________\n\n\nThis message is intended only',
    '\nThis message is intended only for the use of the person',
  ];
  for (const marker of footerMarkers) {
    const idx = body.lastIndexOf(marker);
    if (idx > 0) body = body.substring(0, idx).trimEnd();
  }
  body = body.replace(/Get Outlook for iOS\n<https?:\/\/[^\n>]+>\s*/g, '');
  body = body.replace(/\n{4,}/g, '\n\n\n');
  return body.trim();
}

/** Map a single raw email message to a Communication */
function mapMessage(
  msg: any,
  i: number,
  total: number,
  convId?: string,
  convSubject?: string,
): Communication {
  const senderEmail = msg.sender_email || '';
  const isFromEtiqa = senderEmail.toLowerCase().includes('etiqa');
  const direction: 'inbound' | 'outbound' = isFromEtiqa ? 'outbound' : 'inbound';
  return {
    id: `${msg.id ?? convId ?? 'msg'}-${i}`,
    folderId: msg.entry_id?.substring(0, 30) ?? '',
    direction,
    channel: 'email',
    from: senderEmail,
    to: msg.to_recipients || '',
    subject: msg.subject || convSubject || '',
    body: cleanEmailBody(msg.body_plain),
    bodyHtml: msg.body_html || undefined,
    timestamp: msg.sent_at || msg.received_at || '',
    read: i < total - 1,
    attachments: msg.attachments?.length > 0 ? msg.attachments : undefined,
    conversationId: convId,
    conversationSubject: convSubject,
  };
}

/** Flatten messages from the API payload into a single sorted Communication[].
 *  Supports both the new nested shape (`conversations: [{ conversation, messages, participants }]`)
 *  and the legacy flat shape (`messages: [...]`). */
function mapEmailsToCommunications(localData: any): Communication[] {
  // New nested shape
  if (Array.isArray(localData?.conversations)) {
    const flat: Array<{ msg: any; convId?: string; convSubject?: string }> = [];
    for (const conv of localData.conversations) {
      const c = conv.conversation || {};
      for (const msg of conv.messages ?? []) {
        flat.push({ msg, convId: c.id, convSubject: c.display_name });
      }
    }
    flat.sort((a, b) => {
      const ta = a.msg.sent_at || a.msg.received_at || '';
      const tb = b.msg.sent_at || b.msg.received_at || '';
      return ta.localeCompare(tb);
    });
    return flat.map((x, i) => mapMessage(x.msg, i, flat.length, x.convId, x.convSubject));
  }

  // Legacy flat shape
  if (Array.isArray(localData?.messages)) {
    return localData.messages.map((msg: any, i: number) =>
      mapMessage(msg, i, localData.messages.length),
    );
  }

  return [];
}

/** Map local/ claim data (with email messages) to the Claim type used by the UI */
export function mapClaimFromApi(localData: any): Claim {
  const claimNumber = localData.claim_value || '';

  // Gather conversations from new shape, or synthesize a single one from legacy shape
  const rawConversations: any[] = Array.isArray(localData.conversations)
    ? localData.conversations
    : localData.conversation
      ? [{ conversation: localData.conversation, messages: localData.messages, participants: localData.participants }]
      : [];

  // Earliest created_at across conversations → claim submission date
  const createdAts = rawConversations
    .map(c => c.conversation?.created_at)
    .filter(Boolean)
    .sort();
  const createdAt = createdAts[0] || '';
  const submissionDate = createdAt ? new Date(createdAt) : new Date();
  const now = new Date();
  const daysOpen = Math.max(0, Math.floor((now.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Primary conversation = the earliest one (used for top-level id / status)
  const primaryConv = rawConversations.find(c => c.conversation?.created_at === createdAt)?.conversation
    || rawConversations[0]?.conversation
    || {};

  const communications = mapEmailsToCommunications(localData);

  // Dedupe + flatten participants across all conversations
  const participantMap = new Map<string, any>();
  for (const conv of rawConversations) {
    for (const p of conv.participants ?? []) {
      if (p?.email && !participantMap.has(p.email.toLowerCase())) {
        participantMap.set(p.email.toLowerCase(), p);
      }
    }
  }
  const participants = Array.from(participantMap.values());
  const customer = participants.find((p: any) =>
    p.is_internal === 0 && p.email && p.email.includes('@')
  );
  const customerName = customer?.display_name || '';
  const customerEmail = customer?.email || '';

  return {
    id: primaryConv.id || claimNumber,
    smileAppPhone: '',
    smileAppEmail: customerEmail,
    claimType: 'Travel Claim',
    claimNumber,
    claimCategory: 2,
    needSubmitStp: false,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: '',
    claimSubmissionDate: createdAt,
    statusCode: 1,
    stateCode: 0,
    claimStatus: primaryConv.status === 'open' ? 'New' : 'Closed',
    claimEventType: '',
    policyNo: '',
    policyName: '',
    policyType: null,
    causeTypeCode: '',
    claimAgainstOtherPartyRemarks: '',
    contractType: '',
    coverageNo: '',
    coverageType: '',
    eventType: '',
    haveClaimAgainstOtherParty: false,
    incidentDate: '',
    insuredName: customerName || primaryConv.display_name || '',
    lossTypeCode: '',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: '',
    sourceCoreSystem: '',
    schemeCode: '',
    planCodeDesc: '',
    planCode: '',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: createdAt,
    claimAmount: 0,
    customerClaimAmount: 0,
    sourceSystem: '',
    caseRemark: '',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: false,
    aiAssessmentResult: '',
    isAiProcessed: false,
    aiIsDocRelatedClaim: false,
    aiIsDocMatchClaim: false,
    claimPayment: { bankKey: '', bankName: '', bankNumber: '', bankHolderName: '', paymentCode: '' },
    claimant: {
      nric: '', fullName: customerName, idType: '', dateOfBirth: null, maritalStatus: '',
      noOfChildren: '0', monthlyIncome: '', educationLevel: '', race: '', insuredSinceDate: null,
      religion: '', nationality: '', staffFlag: false, title: '', addressLine1: '', city: '',
      stateOrProvince: '', addressPostcode: '', country: '', phone: '', claimantType: null,
      taxIdentificationNo: '', sstRegistrationNo: '', gender: null, email: customerEmail, officePhoneNo: '',
    },
    claimStatusChangeLog: [],
    claimUpload: [],
    claimReserveField: [],
    claimIntegration: null,
    departureDateTime: null,
    newDepartureDateTime: null,
    flightNo: null,
    communications,
    aiRecommendation: undefined,
    assignedTo: 'Unassigned',
    daysOpen,
    lastReplyIsEtiqa: null,
  };
}

/** Build a lightweight Claim stub from a /claims list item, before its detail is loaded. */
export function mapClaimStub(item: any): Claim {
  const claimNumber = item.value || '';
  const display = item.conversation_display_name || '';
  return {
    id: item.conversation_id || claimNumber,
    smileAppPhone: '',
    smileAppEmail: '',
    claimType: 'Travel Claim',
    claimNumber,
    claimCategory: 2,
    needSubmitStp: false,
    aiClaimIsDuplicate: false,
    claimCoreSystemClaimId: '',
    claimSubmissionDate: '',
    statusCode: 1,
    stateCode: 0,
    claimStatus: '',
    claimEventType: '',
    policyNo: '',
    policyName: '',
    policyType: null,
    causeTypeCode: '',
    claimAgainstOtherPartyRemarks: '',
    contractType: '',
    coverageNo: '',
    coverageType: '',
    eventType: '',
    haveClaimAgainstOtherParty: false,
    incidentDate: '',
    insuredName: display,
    lossTypeCode: '',
    company: 2,
    riskNumber: 1,
    isManual: false,
    entity: '',
    sourceCoreSystem: '',
    schemeCode: '',
    planCodeDesc: '',
    planCode: '',
    numOfDependant: 0,
    severity: 3,
    priority: 3,
    created: '',
    claimAmount: 0,
    customerClaimAmount: 0,
    sourceSystem: '',
    caseRemark: '',
    customerRemark: '',
    claimAccessorRemark: '',
    appealRemark: '',
    isAppeal: false,
    isAiAssessed: false,
    aiAssessmentResult: '',
    isAiProcessed: false,
    aiIsDocRelatedClaim: false,
    aiIsDocMatchClaim: false,
    claimPayment: { bankKey: '', bankName: '', bankNumber: '', bankHolderName: '', paymentCode: '' },
    claimant: {
      nric: '', fullName: display, idType: '', dateOfBirth: null, maritalStatus: '',
      noOfChildren: '0', monthlyIncome: '', educationLevel: '', race: '', insuredSinceDate: null,
      religion: '', nationality: '', staffFlag: false, title: '', addressLine1: '', city: '',
      stateOrProvince: '', addressPostcode: '', country: '', phone: '', claimantType: null,
      taxIdentificationNo: '', sstRegistrationNo: '', gender: null, email: '', officePhoneNo: '',
    },
    claimStatusChangeLog: [],
    claimUpload: [],
    claimReserveField: [],
    claimIntegration: null,
    departureDateTime: null,
    newDepartureDateTime: null,
    flightNo: null,
    communications: [],
    aiRecommendation: undefined,
    assignedTo: 'Unassigned',
    daysOpen: 0,
    lastReplyIsEtiqa: item.last_reply_is_etiqa ?? null,
    currentStatus: item.current_status ?? null,
    currentPic: item.current_pic ?? null,
  };
}
