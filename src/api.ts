// Route every backend request through the authenticated fetch wrapper, which
// attaches the Bearer access token and transparently refreshes it on a 401.
import { authFetch as fetch } from './auth';

export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const EDP_API_BASE = (import.meta.env.VITE_EDP_API_URL ?? API_BASE).replace(/\/$/, '');

async function ensureOk(res: Response, message: string): Promise<void> {
  if (!res.ok) throw new Error(`${message}: ${res.status} ${res.url}`);
}

export const EDP_CURRENT_STATUS_OPTIONS = [
  'Fast Track',
  'Complex',
  'Agency (Fast Track)',
  'Agency (Complex)',
  'Appeal',
  'Reject',
] as const;

export type EdpCurrentStatus = (typeof EDP_CURRENT_STATUS_OPTIONS)[number] | '';

export interface EdpClaimUpdate {
  current_status?: EdpCurrentStatus
  current_pic?: string
  doc_request_date?: string
  doc_reminder_1_date?: string
  doc_reminder_2_date?: string
  doc_reminder_3_date?: string
  bank_reminder_1_date?: string
  bank_reminder_2_date?: string
  bank_reminder_3_date?: string
  completed_doc_date?: string
  assessment_complete_date?: string
  reject_letter_issue_date?: string
  closed_date?: string
  remark?: string
}

export type SortMode = 'newest' | 'oldest' | 'claim'

export interface EdpClaim {
  id?: number
  entity: string
  claim_no: string
  policy_no: string
  reported_by: string
  cnttype: string
  rsktyp: string
  product_name: string
  client_no: string
  identity_num: string
  email: string
  contact_number?: string
  insured_name: string
  agent_no: string
  agent_name: string
  reported_date: string
  loss_date: string
  registered_date: string
  latest_tran_date: string
  status: string
  claim_desc: string
  claim_officer: string
  reserve_paid: number
  reserve_os: number
  gross_paid: number
  gross_os: number
  net_paid: number
  net_os: number
  claim_type: string
  client_ref: string
  reqnno: string
  bankacckey: string
  cbillamt: number
  billdate: string
  ercode: string
  erdesc: string
  credate: string
  payment_status: string
  stp_status: string
  non_stp_reason: string
  category: string
  missing_doc?: string[]
  doc_request_date?: string | null
  doc_reminder_1_date?: string | null
  doc_reminder_2_date?: string | null
  doc_reminder_3_date?: string | null
  bank_reminder_1_date?: string | null
  bank_reminder_2_date?: string | null
  bank_reminder_3_date?: string | null
  completed_doc_date?: string | null
  assessment_complete_date?: string | null
  reject_letter_issue_date?: string | null
  closed_date?: string | null
  remark?: string | null
  current_status: EdpCurrentStatus
  current_pic: string
  previous_pic?: string | null
  created_at?: string
  age_from_registered_date?: number
  age_from_latest_tran_date?: number
  last_reply_is_etiqa?: boolean | null
  sla_status?: string | null
  sla_detail?: string | null
  blacklisted?: boolean
  flight_no?: string
  new_flight_no?: string
  flight_destination?: string
}

export interface EdpUploadError {
  row: Record<string, unknown>
  error: string
}

export interface EdpUploadResponse {
  ok: boolean
  filename: string
  total_rows: number
  inserted: number
  updated: number
  errors: EdpUploadError[]
}

export async function fetchClaimsList(
  limit = 100,
  offset = 0,
  search?: string,
  sort?: SortMode,
  lastReplyIsEtiqa?: boolean,
): Promise<any[]> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (search && search.trim()) params.set('search', search.trim());
  if (sort && sort !== 'newest') params.set('sort', sort);
  if (typeof lastReplyIsEtiqa === 'boolean') params.set('last_reply_is_etiqa', String(lastReplyIsEtiqa));
  const res = await fetch(`${API_BASE}/claims?${params.toString()}`);
  await ensureOk(res, 'Failed to fetch claims list');
  return res.json();
}

export async function fetchClaimDetail(claimNumber: string): Promise<any> {
  const res = await fetch(`${API_BASE}/claims/${encodeURIComponent(claimNumber)}`);
  await ensureOk(res, `Failed to fetch claim ${claimNumber}`);
  return res.json();
}

export interface ClaimSummaryAttachmentDetail {
  attachment_id: number
  filename: string
  status: 'extracted' | 'empty' | 'skipped' | 'error'
  chars?: number
  reason?: string
}

export interface ClaimSummaryResponse {
  ok: boolean
  claim_value: string
  summary: string
  message?: string
  total_messages: number
  total_attachments: number
  attachment_details: ClaimSummaryAttachmentDetail[]
  context_chars: number
}

// Generates an AI assessor briefing for a claim by gathering all its emails +
// attachment text and sending them to the LLM. See POST /claims/{claim}/summary.
export async function fetchClaimSummary(
  claimNumber: string,
  signal?: AbortSignal,
): Promise<ClaimSummaryResponse> {
  const res = await fetch(
    `${API_BASE}/claims/${encodeURIComponent(claimNumber)}/summary`,
    { method: 'POST', signal },
  );
  await ensureOk(res, `Failed to generate summary for claim ${claimNumber}`);
  return res.json();
}

export interface ClaimSummaryMeta {
  total_messages: number
  total_attachments: number
  attachment_details: ClaimSummaryAttachmentDetail[]
  context_chars: number
}

export type ClaimSummaryStage = 'extracting' | 'summarizing'

export interface ClaimSummaryStreamHandlers {
  onProgress?: (stage: ClaimSummaryStage) => void
  onMeta?: (meta: ClaimSummaryMeta) => void
  onToken?: (text: string) => void
  onDone?: (result: { ok: boolean; message?: string }) => void
  onError?: (err: { status: number; detail: string }) => void
}

// Streams an AI assessor briefing via Server-Sent Events over POST.
// EventSource can't be used (it's GET-only), so this reads the response
// body stream and parses SSE frames manually.
// See POST /claims/{claim}/summary/stream.
export async function streamClaimSummary(
  claimNumber: string,
  handlers: ClaimSummaryStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/claims/${encodeURIComponent(claimNumber)}/summary/stream`,
    { method: 'POST', headers: { Accept: 'text/event-stream' }, signal },
  );

  // A missing claim (or other failure) responds with a normal HTTP error
  // status *before* the stream begins.
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`.trim();
    try {
      const body = await res.json();
      if (body && typeof body.detail === 'string') detail = body.detail;
    } catch {
      /* non-JSON error body — keep the status text */
    }
    handlers.onError?.({ status: res.status, detail });
    return;
  }

  if (!res.body) {
    handlers.onError?.({ status: res.status, detail: 'Empty response stream' });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (frame: string) => {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of frame.split('\n')) {
      if (line.startsWith(':')) continue; // comment/keep-alive
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).replace(/^ /, ''));
      }
    }
    if (dataLines.length === 0) return;
    let payload: any;
    try {
      payload = JSON.parse(dataLines.join('\n'));
    } catch {
      return; // ignore unparseable frames
    }
    switch (event) {
      case 'progress':
        if (payload?.stage) handlers.onProgress?.(payload.stage);
        break;
      case 'meta':
        handlers.onMeta?.(payload);
        break;
      case 'token':
        if (typeof payload?.t === 'string') handlers.onToken?.(payload.t);
        break;
      case 'done':
        handlers.onDone?.({ ok: !!payload?.ok, message: payload?.message });
        break;
      case 'error':
        handlers.onError?.({
          status: typeof payload?.status === 'number' ? payload.status : 500,
          detail: payload?.detail ?? 'Stream error',
        });
        break;
    }
  };

  try {
    for (; ;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      // SSE frames are separated by a blank line.
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        if (frame.trim()) dispatch(frame);
      }
    }
    // Flush any trailing frame without a terminating blank line.
    if (buffer.trim()) dispatch(buffer);
  } finally {
    reader.releaseLock();
  }
}

// --- Attachment OCR + translation pipeline (POST /process/{id}/stream) ---

export interface AttachmentTranslationPage {
  page: number
  ocr_text: string
}

export interface AttachmentTranslationHandlers {
  onDocStart?: (document: string) => void
  onPages?: (document: string, pages: AttachmentTranslationPage[]) => void
  onToken?: (page: number, delta: string) => void
  onPageDone?: (page: number, translatedText: string) => void
  onDocDone?: (document: string) => void
  onDocError?: (document: string, error: string) => void
  onDone?: () => void
  onError?: (err: { status: number; detail: string }) => void
}

// Runs the OCR + translation pipeline on a single stored attachment and streams
// progress as NDJSON (one JSON object per line). Translation tokens stream live
// per page. See POST /process/{attachment_id}/stream.
export async function streamAttachmentTranslation(
  attachmentId: number,
  handlers: AttachmentTranslationHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/process/${encodeURIComponent(String(attachmentId))}/stream`,
    { method: 'POST', headers: { Accept: 'application/x-ndjson' }, signal },
  );

  // Pre-stream errors (404/400) arrive as a normal FastAPI { detail } body
  // *before* the NDJSON stream begins — check status first.
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`.trim();
    try {
      const body = await res.json();
      if (body && typeof body.detail === 'string') detail = body.detail;
    } catch {
      /* non-JSON error body — keep the status text */
    }
    handlers.onError?.({ status: res.status, detail });
    return;
  }

  if (!res.body) {
    handlers.onError?.({ status: res.status, detail: 'Empty response stream' });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (line: string) => {
    let evt: any;
    try {
      evt = JSON.parse(line);
    } catch {
      return; // ignore unparseable lines
    }
    switch (evt?.type) {
      case 'doc_start':
        handlers.onDocStart?.(evt.document);
        break;
      case 'pages':
        handlers.onPages?.(evt.document, Array.isArray(evt.pages) ? evt.pages : []);
        break;
      case 'token':
        if (typeof evt.delta === 'string') handlers.onToken?.(evt.page, evt.delta);
        break;
      case 'page_done':
        handlers.onPageDone?.(evt.page, evt.translated_text ?? '');
        break;
      case 'doc_done':
        handlers.onDocDone?.(evt.document);
        break;
      case 'doc_error':
        handlers.onDocError?.(evt.document, evt.error ?? 'Processing failed');
        break;
      case 'done':
        handlers.onDone?.();
        break;
    }
  };

  try {
    for (; ;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // NDJSON: split on newlines, keep the trailing partial line buffered.
      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (line) dispatch(line);
      }
    }
    // Flush any trailing line without a terminating newline.
    if (buffer.trim()) dispatch(buffer.trim());
  } finally {
    reader.releaseLock();
  }
}

export interface EdpClaimsFilters {
  search?: string;
  status?: string;
  pic?: string[];
  current_status?: string[];
  category?: string[];
  claim_type?: string[];
  last_reply_is_etiqa?: boolean;
  sla_status?: string;
  loss_date?: string;
}

export interface EdpSendReminderResult {
  claim_no: string;
  email: string | null;
  sent: boolean;
  error: string | null;
}

export interface EdpSendReminderResponse {
  requested: number;
  sent: number;
  failed: number;
  results: EdpSendReminderResult[];
}

export interface CustomReminderSendInput {
  claim_id?: number;
  to_recipients: string[];
  cc_recipients?: string[];
  bcc_recipients?: string[];
  subject: string;
  body: string;
  body_format: 'html' | 'plain';
  attachments?: File[];
  inline_images?: File[];
  inline_content_ids?: string[];
}

export interface CustomReminderSendOutput {
  ok?: boolean;
  claim_no?: string;
  recipient?: string | null;
  subject?: string;
  body_format?: string;
  sent_at?: string | null;
  message?: string;
}

async function sendEdpReminderRequest(
  endpoint: string,
  claimNos: string[],
): Promise<EdpSendReminderResponse> {
  const normalized = Array.from(
    new Set(
      claimNos
        .map((claimNo) => claimNo.trim())
        .filter((claimNo) => claimNo.length > 0),
    ),
  );

  if (normalized.length === 0) {
    throw new Error('Please select at least one claim to send a reminder.');
  }

  const url = `${EDP_API_BASE}${endpoint}`;
  const init: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim_nos: normalized }),
  };

  // Some backends define reminder routes with a trailing slash only.
  // Retry once with "/" when the first POST returns 405.
  let res = await fetch(url, init);
  if (res.status === 405 && !url.endsWith('/')) {
    res = await fetch(`${url}/`, init);
  }
  await ensureOk(res, 'Failed to send reminder emails');
  return res.json();
}

export async function sendEdpBankDetailsReminder(
  claimNos: string[],
): Promise<EdpSendReminderResponse> {
  return sendEdpReminderRequest('/edp-claims/send-bank-details-reminder', claimNos);
}

export async function sendEdpPaymentReissueReminder(
  claimNos: string[],
): Promise<EdpSendReminderResponse> {
  return sendEdpReminderRequest('/edp-claims/send-payment-reissue-reminder', claimNos);
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [meta, base64] = dataUrl.split(',', 2);
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch?.[1] ?? 'image/png';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
}

function sanitizeInlineHtmlForMultipart(bodyHtml: string): { body: string; inlineImages: File[]; contentIds: string[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${bodyHtml}</div>`, 'text/html');
  const nodes = Array.from(doc.querySelectorAll('img[src]'));
  const inlineImages: File[] = [];
  const contentIds: string[] = [];

  for (const node of nodes) {
    const src = node.getAttribute('src') ?? '';
    if (!src.startsWith('data:')) continue;

    const contentId = `inline-image-${Date.now()}-${contentIds.length}-${Math.random().toString(36).slice(2, 8)}`;
    const file = dataUrlToFile(src, `${contentId}.png`);
    inlineImages.push(file);
    contentIds.push(contentId);
    node.setAttribute('src', `cid:${contentId}`);
  }

  return {
    body: doc.body.innerHTML,
    inlineImages,
    contentIds,
  };
}

export async function sendCustomReminder(
  payload: CustomReminderSendInput,
): Promise<CustomReminderSendOutput> {
  const url = `${EDP_API_BASE}/emails/send`;
  const recipients = payload.to_recipients.map((r) => r.trim()).filter(Boolean);
  if (recipients.length === 0) {
    throw new Error('At least one recipient is required to send the email.');
  }

  const sanitized = sanitizeInlineHtmlForMultipart(payload.body);
  const inlineImages = [...(payload.inline_images ?? []), ...sanitized.inlineImages];
  const inlineContentIds = [...(payload.inline_content_ids ?? []), ...sanitized.contentIds];
  const attachments = payload.attachments ?? [];
  const hasFiles = inlineImages.length > 0 || attachments.length > 0;

  // JSON path when there are no files; multipart when attachments/inline images exist.
  if (!hasFiles) {
    const jsonBody = {
      ...(payload.claim_id != null ? { claim_id: payload.claim_id } : {}),
      to_recipients: recipients,
      cc_recipients: payload.cc_recipients?.filter(Boolean),
      bcc_recipients: payload.bcc_recipients?.filter(Boolean),
      subject: payload.subject,
      body: sanitized.body,
      body_format: payload.body_format,
    };
    console.log('[emails/send] JSON payload:', jsonBody);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonBody),
    });
    await ensureOk(res, 'Failed to send email');
    return res.json();
  }

  const formData = new FormData();
  if (payload.claim_id != null) formData.append('claim_id', String(payload.claim_id));
  for (const to of recipients) formData.append('to_recipients', to);
  for (const cc of payload.cc_recipients?.filter(Boolean) ?? []) formData.append('cc_recipients', cc);
  for (const bcc of payload.bcc_recipients?.filter(Boolean) ?? []) formData.append('bcc_recipients', bcc);
  formData.append('subject', payload.subject);
  formData.append('body', sanitized.body);
  formData.append('body_format', payload.body_format);
  for (const file of attachments) formData.append('attachments', file);
  for (const file of inlineImages) formData.append('inline_images', file);
  for (const contentId of inlineContentIds) formData.append('inline_content_ids', contentId);

  console.log('[emails/send] multipart payload:', {
    claim_id: payload.claim_id,
    to_recipients: recipients,
    cc_recipients: payload.cc_recipients?.filter(Boolean),
    bcc_recipients: payload.bcc_recipients?.filter(Boolean),
    subject: payload.subject,
    body: sanitized.body,
    body_format: payload.body_format,
    inline_content_ids: inlineContentIds,
    inline_images: inlineImages.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    attachments: attachments.map((f) => ({ name: f.name, size: f.size, type: f.type })),
  });

  // Do NOT set Content-Type manually - the browser adds the multipart boundary.
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  await ensureOk(res, 'Failed to send email');
  return res.json();
}

export async function fetchEdpClaims(
  limit = 100,
  offset = 0,
  filters: EdpClaimsFilters = {},
): Promise<EdpClaim[]> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.status && filters.status.trim()) params.set('status', filters.status.trim());
  for (const pic of filters.pic ?? []) {
    if (pic) params.append('pic', pic);
  }
  for (const cs of filters.current_status ?? []) {
    if (cs) params.append('current_status', cs);
  }
  for (const cat of filters.category ?? []) {
    if (cat) params.append('category', cat);
  }
  for (const type of filters.claim_type ?? []) {
    if (type) params.append('claim_type', type);
  }
  if (typeof filters.last_reply_is_etiqa === 'boolean') {
    params.set('last_reply_is_etiqa', String(filters.last_reply_is_etiqa));
  }
  if (filters.sla_status && filters.sla_status.trim()) {
    params.set('sla_status', filters.sla_status.trim());
  }
  if (filters.loss_date && filters.loss_date.trim()) {
    params.set('loss_date', filters.loss_date.trim());
  }
  const res = await fetch(`${EDP_API_BASE}/edp-claims?${params.toString()}`);
  await ensureOk(res, 'Failed to fetch EDP claims');
  return res.json();
}

// Normalize endpoints that may return ["A","B"], [{name:"A"}, ...], or
// envelope objects like { pics: [...] }. Returns a deduped string list.
function normalizeMetaList(data: unknown, envelopeKeys: string[]): string[] {
  let raw: unknown[] = [];
  if (Array.isArray(data)) {
    raw = data;
  } else if (data && typeof data === 'object') {
    for (const key of envelopeKeys) {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        raw = value;
        break;
      }
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    let name: string | undefined;
    if (typeof item === 'string') {
      name = item;
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const candidate = obj.name ?? obj.value ?? obj.label ?? obj.code;
      if (typeof candidate === 'string') name = candidate;
    }
    if (!name) continue;
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export async function fetchEdpPics(): Promise<string[]> {
  const res = await fetch(`${EDP_API_BASE}/edp-pics`);
  await ensureOk(res, 'Failed to fetch EDP PICs');
  const data = await res.json();
  return normalizeMetaList(data, ['pics', 'items', 'data']);
}

export async function fetchEdpStatuses(): Promise<string[]> {
  const res = await fetch(`${EDP_API_BASE}/edp-claims-meta/statuses`);
  await ensureOk(res, 'Failed to fetch EDP statuses');
  const data = await res.json();
  return normalizeMetaList(data, ['statuses', 'items', 'data']);
}

export async function fetchEdpCurrentStatuses(): Promise<string[]> {
  const res = await fetch(`${EDP_API_BASE}/edp-claims-meta/current-statuses`);
  await ensureOk(res, 'Failed to fetch EDP current statuses');
  const data = await res.json();
  return normalizeMetaList(data, ['current_statuses', 'items', 'data']);
}

export async function fetchEdpCategories(): Promise<string[]> {
  const res = await fetch(`${EDP_API_BASE}/edp-claims-meta/categories`);
  await ensureOk(res, 'Failed to fetch EDP categories');
  const data = await res.json();
  return normalizeMetaList(data, ['categories', 'items', 'data']);
}

export async function fetchEdpClaimTypes(): Promise<string[]> {
  const res = await fetch(`${EDP_API_BASE}/edp-claims-meta/claim-types`);
  await ensureOk(res, 'Failed to fetch EDP claim types');
  const data = await res.json();
  return normalizeMetaList(data, ['claim_types', 'items', 'data']);
}

export async function fetchEdpClaimDetail(claimNo: string): Promise<EdpClaim> {
  const res = await fetch(`${EDP_API_BASE}/edp-claims/${encodeURIComponent(claimNo)}`);
  await ensureOk(res, `Failed to fetch EDP claim ${claimNo}`);
  return res.json();
}

export async function updateEdpClaim(
  claimNo: string,
  updates: EdpClaimUpdate,
): Promise<EdpClaim> {
  const url = `${EDP_API_BASE}/edp-claims/${encodeURIComponent(claimNo)}`;
  const body = new FormData();

  if (updates.current_status !== undefined) {
    body.append('current_status', updates.current_status);
  }

  if (updates.current_pic !== undefined) {
    body.append('current_pic', updates.current_pic);
  }

  if (updates.doc_request_date !== undefined) {
    body.append('doc_request_date', updates.doc_request_date);
  }

  if (updates.doc_reminder_1_date !== undefined) {
    body.append('doc_reminder_1_date', updates.doc_reminder_1_date);
  }

  if (updates.doc_reminder_2_date !== undefined) {
    body.append('doc_reminder_2_date', updates.doc_reminder_2_date);
  }

  if (updates.doc_reminder_3_date !== undefined) {
    body.append('doc_reminder_3_date', updates.doc_reminder_3_date);
  }

  if (updates.completed_doc_date !== undefined) {
    body.append('completed_doc_date', updates.completed_doc_date);
  }

  if (updates.assessment_complete_date !== undefined) {
    body.append('assessment_complete_date', updates.assessment_complete_date);
  }

  if (updates.reject_letter_issue_date !== undefined) {
    body.append('reject_letter_issue_date', updates.reject_letter_issue_date);
  }

  if (updates.closed_date !== undefined) {
    body.append('closed_date', updates.closed_date);
  }

  if (updates.remark !== undefined) {
    body.append('remark', updates.remark);
  }

  const res = await fetch(url, {
    method: 'PATCH',
    // Do NOT set Content-Type manually - browser will set the correct
    // multipart/form-data boundary automatically when body is FormData.
    body,
  });

  await ensureOk(res, `Failed to update EDP claim ${claimNo}`);
  return res.json();
}

// Download the EDP claims table as a formatted .xlsx file. Reuses the same
// filters as the list so the export mirrors the on-screen view. A full-table
// export (no filters) can take a while server-side.
export async function exportEdpClaimsXlsx(
  filters: EdpClaimsFilters = {},
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const params = new URLSearchParams();
  if (filters.search && filters.search.trim()) params.set('search', filters.search.trim());
  if (filters.status && filters.status.trim()) params.set('status', filters.status.trim());
  for (const pic of filters.pic ?? []) {
    if (pic) params.append('pic', pic);
  }
  for (const cs of filters.current_status ?? []) {
    if (cs) params.append('current_status', cs);
  }
  for (const cat of filters.category ?? []) {
    if (cat) params.append('category', cat);
  }
  for (const type of filters.claim_type ?? []) {
    if (type) params.append('claim_type', type);
  }
  if (filters.sla_status && filters.sla_status.trim()) {
    params.set('sla_status', filters.sla_status.trim());
  }
  if (filters.loss_date && filters.loss_date.trim()) {
    params.set('loss_date', filters.loss_date.trim());
  }
  const query = params.toString();
  const url = `${EDP_API_BASE}/edp-claims/export.xlsx${query ? `?${query}` : ''}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to export EDP claims: ${res.status}`);

  const blob = await res.blob();

  // Prefer the server-provided filename, fall back to a timestamped default.
  let filename = `edp-claims-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const disposition = res.headers.get('Content-Disposition');
  if (disposition) {
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    if (match?.[1]) filename = decodeURIComponent(match[1]);
  }

  return { blob, filename };
}

// ---------------------------------------------------------------------------
// Payment Fail — sourced from pcc_claims DB table
// ---------------------------------------------------------------------------

export type AssessorRequestStatus = 'no_reply' | 'complete' | 'ambiguous' | 'unmatched' | 'incomplete'

/** Raw row from the pcc_claims DB table */
export interface ClaimInfoRequest {
  id: number
  claim_no: string
  policy_no: string
  identity_num: string
  email: string
  insured_name: string
  registered_date: string
  reqnno: string
  bankkey: string
  bankacckey: string
  cbillamt: string
  ercode: string
  erdesc: string
  group_policy: string
  reminder_1: string
  reminder_2: string
  reminder_3: string
  reminder_progress?: string
  sent_at?: string | null
  reminder_1_at?: string | null
  reminder_2_at?: string | null
  reminder_3_at?: string | null
  days_since_sent: string
  reminder_due: string
  reply_received: string
  last_reply_date: string
  reply_matched_by: string
  status: string
  frontend_status?: string
  reply_status?: string
  bank_acc_no: string
  bank_name: string
  nric: string
  passport: string
  id_type: string
  assessor_note: string
  ai_remarks: string
  created_at: string
}

export interface AssessorRequestItem {
  claimInfoId: number   // pcc_claims.id — used to fetch PCC emails directly
  claimNo: string
  owner: string
  assessor: string
  remindersSent: number
  remindersTotal: number
  status: AssessorRequestStatus
  fullStatus: string // Original status string from backend (e.g., "Complete - verify before payment")
  lastActivity: string
  docRequestDate: string
  daysSinceSent: string
  assessorNote: string
  aiRemarks: string
  bankName: string
  nric: string
  passport: string
  idType: string
  bankAccNo: string
  _raw: ClaimInfoRequest
}

function formatActivityDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`
}

function mapBackendAssessorStatus(value: string | null | undefined): AssessorRequestStatus | null {
  const raw = (value ?? '').trim()
  if (!raw) return null
  const lower = raw.toLowerCase()
  if (lower === 'no reply') return 'no_reply'
  if (lower.startsWith('complete')) return 'complete'
  if (lower.startsWith('ambiguous')) return 'ambiguous'
  if (lower.startsWith('unmatched')) return 'unmatched'
  if (lower.startsWith('incomplete')) return 'incomplete'
  return null
}

/** Maps a raw pcc_claims DB row to the UI AssessorRequestItem shape. */
export function mapClaimInfoRequestToAssessorRequest(c: ClaimInfoRequest): AssessorRequestItem {
  const reminder1 = (c.reminder_1 ?? '').trim()
  const reminder2 = (c.reminder_2 ?? '').trim()
  const reminder3 = (c.reminder_3 ?? '').trim()

  let remindersSent = 0
  if (reminder3) remindersSent = 3
  else if (reminder2) remindersSent = 2
  else if (reminder1) remindersSent = 1

  const backendProgress = (c.reminder_progress ?? '').trim()
  const parsedProgress = /^([0-3])\/3$/.exec(backendProgress)
  if (parsedProgress) {
    remindersSent = Number(parsedProgress[1])
  }

  const lastReminderDate = reminder3 || reminder2 || reminder1 || null

  const backendStatus = mapBackendAssessorStatus(c.frontend_status)
    ?? mapBackendAssessorStatus(c.reply_status)
    ?? mapBackendAssessorStatus(c.status)

  let status: AssessorRequestStatus
  if (backendStatus) {
    // Backend returns canonical status; trust that first.
    status = backendStatus
  } else {
    // Fallback: default to incomplete if no status detected
    status = 'incomplete'
  }

  let lastActivity: string
  if (status === 'complete') {
    lastActivity = `Completed · ${formatActivityDate(c.last_reply_date || c.reply_received)}`
  } else if (lastReminderDate) {
    lastActivity = `Reminder #${remindersSent} sent · ${formatActivityDate(lastReminderDate)}`
  } else {
    lastActivity = `Request sent · ${formatActivityDate(c.created_at)}`
  }

  const fullStatus = (c.frontend_status || c.reply_status || c.status || '').trim()

  return {
    claimNo: c.claim_no,
    owner: c.insured_name,
    assessor: c.reply_matched_by || '-',
    remindersSent,
    remindersTotal: 3,
    status,
    fullStatus,
    lastActivity,
    claimInfoId: Number(c.id),
    docRequestDate: c.created_at,
    daysSinceSent: c.days_since_sent,
    assessorNote: c.assessor_note,
    aiRemarks: c.ai_remarks,
    bankName: c.bank_name,
    nric: c.nric,
    passport: c.passport,
    idType: c.id_type,
    bankAccNo: c.bank_acc_no,
    _raw: c,
  }
}

/**
 * Fetch the email thread for a PCC assessor info request using the canonical
 * pcc_claims.id → pcc_messages.pcc_claim_id join.
 * Returns data in ClaimLookupOut shape so mapClaimFromApi() can consume it.
 */
export async function fetchPccClaimEmails(claimInfoId: number): Promise<any> {
  const res = await fetch(`${EDP_API_BASE}/claim-info-requests/${claimInfoId}/emails`)
  await ensureOk(res, `Failed to fetch PCC emails for request ${claimInfoId}`)
  return res.json()
}

export interface FetchAssessorRequestsParams {
  limit?: number
  offset?: number
  search?: string
  status?: AssessorRequestStatus | 'all'
}

export async function fetchAssessorRequests(params: FetchAssessorRequestsParams = {}): Promise<AssessorRequestItem[]> {
  const query = new URLSearchParams()
  if (typeof params.limit === 'number') query.set('limit', String(params.limit))
  if (typeof params.offset === 'number') query.set('offset', String(params.offset))
  if (params.search && params.search.trim()) query.set('search', params.search.trim())
  if (params.status && params.status !== 'all') query.set('status', params.status)

  const queryString = query.toString()
  const url = `${EDP_API_BASE}/claim-info-requests${queryString ? `?${queryString}` : ''}`
  const res = await fetch(url)
  await ensureOk(res, 'Failed to fetch payment fail')
  const rows: ClaimInfoRequest[] = await res.json()
  return rows.map(mapClaimInfoRequestToAssessorRequest)
}

export interface ClaimInfoRequestUpdate {
  reminder_1?: string
  reminder_2?: string
  reminder_3?: string
  assessor_note?: string
  ai_remarks?: string
  status?: string
}

export async function exportClaimInfoRequestsXlsx(
  filters: { search?: string; status?: string } = {},
  signal?: AbortSignal,
): Promise<{ blob: Blob; filename: string }> {
  const params = new URLSearchParams()
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  if (filters.status?.trim()) params.set('status', filters.status.trim())
  const query = params.toString()
  const url = `${EDP_API_BASE}/claim-info-requests/export.xlsx${query ? `?${query}` : ''}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Failed to export PCC claims: ${res.status}`)
  const blob = await res.blob()
  let filename = `pcc-claims-${new Date().toISOString().slice(0, 10)}.xlsx`
  const disposition = res.headers.get('Content-Disposition')
  if (disposition) {
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
    if (match?.[1]) filename = decodeURIComponent(match[1])
  }
  return { blob, filename }
}

export async function updateClaimInfoRequest(
  rowId: number,
  updates: ClaimInfoRequestUpdate,
): Promise<ClaimInfoRequest> {
  const res = await fetch(
    `${EDP_API_BASE}/claim-info-requests/${rowId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    },
  )
  await ensureOk(res, `Failed to update claim info request ${rowId}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// EDP KPI summary
// ---------------------------------------------------------------------------

export type EdpKpiStatus = 'Green' | 'Amber' | 'Red' | string

export interface EdpKpiSlaRule {
  limit: number
  mode: 'working' | 'calendar' | string
}

export interface EdpKpiRow {
  staff: string
  pool: string
  total_assigned: number
  pending: number
  closed: number
  within_sla: number
  near_breach: number
  breach: number
  compliance_pct: number
  breach_pct: number
  kpi_status: EdpKpiStatus
  action_required?: string
}

export interface EdpKpiPoolTotal {
  pool: string
  total_assigned: number
  pending: number
  closed: number
  within_sla: number
  near_breach: number
  breach: number
  compliance_pct: number
  breach_pct: number
  kpi_status: EdpKpiStatus
}

export interface EdpKpiGrandTotal {
  total_assigned: number
  pending: number
  closed: number
  within_sla: number
  near_breach: number
  breach: number
  compliance_pct: number
  breach_pct: number
}

export interface EdpKpiSummary {
  as_of: string | null
  from_date: string | null
  to_date: string | null
  pool: string | null
  sla_rules: Record<string, EdpKpiSlaRule>
  rows: EdpKpiRow[]
  totals_by_pool?: EdpKpiPoolTotal[]
  grand_total?: EdpKpiGrandTotal
}

export interface EdpKpiSummaryParams {
  from_date?: string
  to_date?: string
  as_of?: string
  pool?: string
}

export async function fetchEdpKpiSummary(
  params: EdpKpiSummaryParams = {},
): Promise<EdpKpiSummary> {
  const qs = new URLSearchParams()
  if (params.from_date) qs.set('from_date', params.from_date)
  if (params.to_date) qs.set('to_date', params.to_date)
  if (params.as_of) qs.set('as_of', params.as_of)
  if (params.pool) qs.set('pool', params.pool)
  const query = qs.toString()
  const url = `${EDP_API_BASE}/edp-kpi/summary${query ? `?${query}` : ''}`
  const res = await fetch(url)
  await ensureOk(res, 'Failed to fetch EDP KPI summary')
  return res.json()
}

export interface EdpKpiDailyRow {
  date: string
  new_registered: number
  closed: number
  sla_breach: number
}

export interface EdpKpiDaily {
  days: number
  end_date: string | null
  rows: EdpKpiDailyRow[]
}

export interface EdpKpiDailyParams {
  days?: number
  end_date?: string
}

export async function fetchEdpKpiDaily(
  params: EdpKpiDailyParams = {},
): Promise<EdpKpiDaily> {
  const qs = new URLSearchParams()
  if (params.days) qs.set('days', String(params.days))
  if (params.end_date) qs.set('end_date', params.end_date)
  const query = qs.toString()
  const url = `${EDP_API_BASE}/edp-kpi/daily${query ? `?${query}` : ''}`
  const res = await fetch(url)
  await ensureOk(res, 'Failed to fetch EDP KPI daily trend')
  return res.json()
}

export async function uploadEdpClaims(file: File): Promise<EdpUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${EDP_API_BASE}/edp-claims/upload`, {
    method: 'POST',
    body: formData,
  });

  await ensureOk(res, 'Failed to upload EDP claims file');
  return res.json();
}
