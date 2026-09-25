import { Injectable } from '@nestjs/common';

// In-memory mock EDP claims, matching the shape the frontend's EdpClaim
// interface expects (src/api.ts). Local UI development only.
const claims: Record<string, any>[] = [
  {
    id: 5192324,
    entity: 'EGIB',
    claim_no: 'P9119206',
    policy_no: 'PU647713',
    reported_by: 'Etiqa+',
    cnttype: 'BPT',
    rsktyp: 'RR7',
    product_name: 'TripCare 360 - International',
    client_no: '31387062',
    identity_num: '630210107663',
    email: 'tssunrisetravel@gmail.com',
    insured_name: 'MOHAN AL RAJA GOPAL',
    agent_no: 'N0034719',
    agent_name: 'E-CHANNEL EGIB',
    reported_date: '2026-08-16 00:00:00',
    loss_date: '2026-08-15 00:00:00',
    registered_date: '2026-08-16 00:00:00',
    status: 'ACTIVE',
    claim_desc: 'Travel Delay',
    claim_officer: 'NON STP',
    reserve_paid: 0,
    reserve_os: 0,
    gross_paid: 0,
    gross_os: 162,
    net_paid: 0,
    net_os: 157.95,
    claim_type: 'Travel Delay',
    category: 'Not Yet Attended',
    latest_tran_date: '2026-08-16 00:00:00',
    current_status: 'Fast Track',
    current_pic: 'Nurmasriza',
    missing_doc: [],
    doc_request_date: null,
    doc_reminder_1_date: null,
    doc_reminder_2_date: null,
    doc_reminder_3_date: null,
    completed_doc_date: null,
    assessment_complete_date: null,
    reject_letter_issue_date: null,
    closed_date: null,
    remark: '',
    sla_status: 'Breached (Active)',
    sla_detail: '37/5 calendar days',
    bank_reminder_1_date: null,
    bank_reminder_2_date: null,
    bank_reminder_3_date: null,
    blacklisted: false,
    flight_no: 'MH370',
    new_flight_no: '',
    flight_destination: 'Kuala Lumpur',
    age_from_registered_date: 37,
    age_from_latest_tran_date: 37,
    last_reply_is_etiqa: false,
  },
  {
    id: 5311532,
    entity: 'EGTB',
    claim_no: 'C9198354',
    policy_no: 'CU570563',
    reported_by: 'Etiqa+',
    cnttype: 'TPT',
    rsktyp: 'RR7',
    product_name: 'TripCare 360 - International',
    client_no: '24687794',
    identity_num: '911231075614',
    email: 'limks1231@gmail.com',
    insured_name: 'LIM KUAN SIN',
    agent_no: 'N0039574',
    agent_name: 'E-CHANNEL EGTB',
    reported_date: '2026-07-28 00:00:00',
    loss_date: '2026-07-09 00:00:00',
    registered_date: '2026-07-28 00:00:00',
    status: 'ACTIVE',
    claim_desc: 'Trip Cancelled',
    claim_officer: 'STP',
    reserve_paid: 0,
    reserve_os: 0,
    gross_paid: 0,
    gross_os: 220,
    net_paid: 0,
    net_os: 220,
    claim_type: 'Trip Cancellation',
    category: 'Not Yet Attended',
    latest_tran_date: '2026-08-17 00:00:00',
    current_status: 'Complex',
    current_pic: 'Emmyra',
    missing_doc: [],
    doc_request_date: null,
    doc_reminder_1_date: null,
    doc_reminder_2_date: null,
    doc_reminder_3_date: null,
    completed_doc_date: null,
    assessment_complete_date: null,
    reject_letter_issue_date: null,
    closed_date: null,
    remark: '',
    sla_status: 'Breached (Active)',
    sla_detail: '56/30 calendar days',
    bank_reminder_1_date: null,
    bank_reminder_2_date: null,
    bank_reminder_3_date: null,
    blacklisted: false,
    flight_no: '',
    new_flight_no: '',
    flight_destination: '',
    age_from_registered_date: 56,
    age_from_latest_tran_date: 36,
    last_reply_is_etiqa: false,
  },
  {
    id: 5191272,
    entity: 'EGIB',
    claim_no: 'P9118466',
    policy_no: 'PU528996',
    reported_by: 'Gen Ease',
    cnttype: 'BPT',
    rsktyp: 'RR7',
    product_name: 'TripCare 360 - International',
    client_no: '24395496',
    identity_num: '870324055622',
    email: 'yiru.cheok@gmail.com',
    insured_name: 'CHEOK HUI LEE',
    agent_no: 'N0030855',
    agent_name: 'TAN CHEE WEI',
    reported_date: '2026-08-03 00:00:00',
    loss_date: '2026-08-02 00:00:00',
    registered_date: '2026-08-03 00:00:00',
    status: 'ACTIVE',
    claim_desc: 'Trip Cancelled',
    claim_officer: 'STP',
    reserve_paid: 0,
    reserve_os: 0,
    gross_paid: 0,
    gross_os: 220,
    net_paid: 0,
    net_os: 214.5,
    claim_type: 'Trip Cancellation',
    category: 'Not Yet Attended',
    latest_tran_date: '2026-08-17 00:00:00',
    current_status: 'Agency (Complex)',
    current_pic: '',
    missing_doc: [],
    doc_request_date: null,
    doc_reminder_1_date: null,
    doc_reminder_2_date: null,
    doc_reminder_3_date: null,
    completed_doc_date: null,
    assessment_complete_date: null,
    reject_letter_issue_date: null,
    closed_date: null,
    remark: '',
    sla_status: 'Breached (Active)',
    sla_detail: '50/5 calendar days',
    bank_reminder_1_date: null,
    bank_reminder_2_date: null,
    bank_reminder_3_date: null,
    blacklisted: false,
    flight_no: '',
    new_flight_no: '',
    flight_destination: '',
    age_from_registered_date: 50,
    age_from_latest_tran_date: 36,
    last_reply_is_etiqa: true,
  },
];

@Injectable()
export class EdpService {
  list(query: Record<string, any>): Record<string, any>[] {
    const limit = Number(query.limit) || 100;
    const offset = Number(query.offset) || 0;
    let result = claims;

    if (query.search) {
      const term = String(query.search).toLowerCase();
      result = result.filter((c) =>
        [c.claim_no, c.policy_no, c.insured_name, c.claim_type, c.claim_desc]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      );
    }
    if (query.status) {
      result = result.filter((c) => c.status === query.status);
    }
    const asArray = (v: any) => (v == null ? [] : Array.isArray(v) ? v : [v]);
    const pics = asArray(query.pic);
    if (pics.length) result = result.filter((c) => pics.includes(c.current_pic));
    const currentStatuses = asArray(query.current_status);
    if (currentStatuses.length) result = result.filter((c) => currentStatuses.includes(c.current_status));
    const categories = asArray(query.category);
    if (categories.length) result = result.filter((c) => categories.includes(c.category));
    const claimTypes = asArray(query.claim_type);
    if (claimTypes.length) result = result.filter((c) => claimTypes.includes(c.claim_type));
    if (query.last_reply_is_etiqa !== undefined) {
      const flag = query.last_reply_is_etiqa === 'true';
      result = result.filter((c) => c.last_reply_is_etiqa === flag);
    }
    if (query.sla_status) {
      result = result.filter((c) => (c.sla_status ?? '').toLowerCase() === String(query.sla_status).toLowerCase());
    }
    if (query.loss_date) {
      result = result.filter((c) => (c.loss_date ?? '').startsWith(query.loss_date));
    }

    return result.slice(offset, offset + limit);
  }

  find(claimNo: string): Record<string, any> | undefined {
    return claims.find((c) => c.claim_no === claimNo);
  }

  update(claimNo: string, updates: Record<string, any>): Record<string, any> | undefined {
    const claim = this.find(claimNo);
    if (!claim) return undefined;
    Object.assign(claim, updates);
    return claim;
  }

  all(): Record<string, any>[] {
    return claims;
  }
}
