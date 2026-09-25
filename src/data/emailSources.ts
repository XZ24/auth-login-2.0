/**
 * Real email metadata extracted from sources/_email_staging and sources/_attachment_staging.
 * Each entry maps a staging folder ID to its email filename and associated attachments.
 * Emails are grouped into logical claim cases for use in mock claim generation.
 */

export interface EmailSource {
  folderId: string;
  filename: string;
  date: string;
  subject: string;
  attachments: string[];
}

export interface CaseEmailGroup {
  caseKey: string;
  claimNo?: string;
  policyNo?: string;
  claimantName?: string;
  claimType: string;
  emails: EmailSource[];
}

// ─── Raw email sources grouped by claim case ──────────────────────────────

export const caseEmailGroups: CaseEmailGroup[] = [
  // 1. SARAH IZANA – Trip Cancelled (KIV)
  {
    caseKey: 'C9171084',
    claimNo: 'C9171084',
    policyNo: 'CU703201',
    claimantName: 'SARAH IZANA BINTI ROSZMI',
    claimType: 'Trip Cancellation',
    emails: [
      {
        folderId: '9F45000424C654530000',
        filename: '2026-05-11_172659_RE_ (KIV!) TRIP CANCELLED_ C9171084 SARAH IZANA BINTI ROSZMI - CU703201.msg',
        date: '2026-05-11T17:26:59',
        subject: 'RE: (KIV!) TRIP CANCELLED: C9171084 SARAH IZANA BINTI ROSZMI - CU703201',
        attachments: ['image001.png'],
      },
    ],
  },

  // 2. Flight Delay – PU551901 (email thread)
  {
    caseKey: 'PU551901',
    policyNo: 'PU551901',
    claimType: 'Flight Delay',
    emails: [
      {
        folderId: '9F45000424C654550000',
        filename: '2026-05-11_173424_RE_ FLIGHT DELAY CLAIM __ PU551901.msg',
        date: '2026-05-11T17:34:24',
        subject: 'RE: FLIGHT DELAY CLAIM // PU551901',
        attachments: [],
      },
      {
        folderId: '9F45000424C654560000',
        filename: '2026-05-11_173424_RE_ FLIGHT DELAY CLAIM __ PU551901.msg',
        date: '2026-05-11T17:34:24',
        subject: 'RE: FLIGHT DELAY CLAIM // PU551901',
        attachments: ['image001.jpg', 'image001_1.jpg', 'image001_2.jpg', 'image002.jpg', 'image002_1.jpg', 'image002_2.jpg'],
      },
    ],
  },

  // 3. FRAUD – CHE MOHD RAZLIN (3-email thread)
  {
    caseKey: 'FRAUD-841120115117',
    claimantName: 'CHE MOHD RAZLIN BIN CHE REZALI',
    claimType: 'Fraud Investigation',
    emails: [
      {
        folderId: '9F45000424C654570000',
        filename: '2026-05-11_173637_FRAUD_Reporting of Confirmed Fraudulent Claim(s). CHE MOHD RAZLIN BIN CHE REZALI [841120115117].msg',
        date: '2026-05-11T17:36:37',
        subject: 'FRAUD: Reporting of Confirmed Fraudulent Claim(s). CHE MOHD RAZLIN BIN CHE REZALI [841120115117]',
        attachments: [],
      },
      {
        folderId: '9F45000424C654690000',
        filename: '2026-05-11_182406_RE_ FRAUD_Reporting of Confirmed Fraudulent Claim(s). CHE MOHD RAZLIN BIN CHE REZALI [841120115117].msg',
        date: '2026-05-11T18:24:06',
        subject: 'RE: FRAUD: Reporting of Confirmed Fraudulent Claim(s). CHE MOHD RAZLIN BIN CHE REZALI [841120115117]',
        attachments: ['image001.png'],
      },
      {
        folderId: '9F45000424C6546B0000',
        filename: '2026-05-11_183500_RE_ FRAUD_Reporting of Confirmed Fraudulent Claim(s). CHE MOHD RAZLIN BIN CHE REZALI [841120115117].msg',
        date: '2026-05-11T18:35:00',
        subject: 'RE: FRAUD: Reporting of Confirmed Fraudulent Claim(s). CHE MOHD RAZLIN BIN CHE REZALI [841120115117]',
        attachments: ['image001.png'],
      },
    ],
  },

  // 4. SUZANA – Pending Documents – PU534046
  {
    caseKey: 'PU534046',
    policyNo: 'PU534046',
    claimantName: 'SUZANA BINTI ONGKOMONG',
    claimType: 'Travel Claim – Pending Documents',
    emails: [
      {
        folderId: '9F45000424C654590000',
        filename: '2026-05-11_174546_RE_ TRAVEL CLAIM_ PENDING DOCUMENTS _ SUZANA BINTI ONGKOMONG - PU534046.msg',
        date: '2026-05-11T17:45:46',
        subject: 'RE: TRAVEL CLAIM: PENDING DOCUMENTS / SUZANA BINTI ONGKOMONG - PU534046',
        attachments: ['image001.png', 'image001_1.png', 'image001_2.png'],
      },
    ],
  },

  // 5. Noraini Ruslan – Travel Insurance – PU572929 (rich attachments)
  {
    caseKey: 'PU572929',
    policyNo: 'PU572929',
    claimantName: 'NORAINI BINTI RUSLAN',
    claimType: 'Travel Insurance Claim',
    emails: [
      {
        folderId: '9F45000424C6545A0000',
        filename: '2026-05-11_174607_Claim Travel Insurance for Policy No_ PU572929 , Noraini Ruslan CRM_0001854001832.msg',
        date: '2026-05-11T17:46:07',
        subject: 'Claim Travel Insurance for Policy No: PU572929, Noraini Ruslan CRM_0001854001832',
        attachments: [
          '7d9475ad-ebf8-49b8-b75f-6bc53be7773c.jpeg',
          'e672e6ec-8e78-48ca-bb8d-be878efcf4f3.jpeg',
          'faf676e9-f616-493d-8ba2-9542b484e758.jpeg',
          'IMG_6135.png',
          'Pu572929.pdf',
          'Trip to italy meeting .pdf',
        ],
      },
    ],
  },

  // 6. Puteri Nur Badrina – Luggage Claim – CU776464
  {
    caseKey: 'CU776464',
    claimNo: 'CU776464',
    claimantName: 'PUTERI NUR BADRINA BINTI NOR MD RIHAN',
    claimType: 'Luggage Claim',
    emails: [
      {
        folderId: '9F45000424C6545B0000',
        filename: '2026-05-11_174724_RE_ Claims luggage - Puteri Nur Badrina binti Nor Md Rihan - CU776464 CRM_0001239000060.msg',
        date: '2026-05-11T17:47:24',
        subject: 'RE: Claims luggage - Puteri Nur Badrina binti Nor Md Rihan - CU776464 CRM_0001239000060',
        attachments: [],
      },
    ],
  },

  // 7. OOI SAW WAH – Trip Cancellation – P9106385 / PU322143
  {
    caseKey: 'P9106385',
    claimNo: 'P9106385',
    policyNo: 'PU322143',
    claimantName: 'OOI SAW WAH',
    claimType: 'Trip Cancellation',
    emails: [
      {
        folderId: '9F45000424C6545D0000',
        filename: '2026-05-11_175013_POLICY NO _ PU322143 - CLAIM NO _ P9106385 - OOI SAW WAH - TRIP CANCELLATION.msg',
        date: '2026-05-11T17:50:13',
        subject: 'POLICY NO: PU322143 - CLAIM NO: P9106385 - OOI SAW WAH - TRIP CANCELLATION',
        attachments: ['image001.jpg'],
      },
    ],
  },

  // 8. MOHD AZMI – Pending Docs – CU744250
  {
    caseKey: 'CU744250',
    claimNo: 'CU744250',
    claimantName: 'MOHD AZMI BIN MAARIF',
    claimType: 'Travel Claim – Pending Documents',
    emails: [
      {
        folderId: '9F45000424C6545E0000',
        filename: '2026-05-11_175146_RE_ TRAVEL CLAIM_ PENDING DOCUMENTS _ MOHD AZMI BIN MAARIF - CU744250.msg',
        date: '2026-05-11T17:51:46',
        subject: 'RE: TRAVEL CLAIM: PENDING DOCUMENTS / MOHD AZMI BIN MAARIF - CU744250',
        attachments: ['image001.png'],
      },
    ],
  },

  // 9. Abd Latiff – Certificate Status – CU284412 (2-email thread)
  {
    caseKey: 'CU284412',
    claimNo: 'CU284412',
    claimantName: 'ABD LATIFF BIN MD YUSUF',
    claimType: 'Certificate Status',
    emails: [
      {
        folderId: '9F45000424C6545F0000',
        filename: '2026-05-11_175401_STATUS - CERT.CU284412_Abd Latiff b Md Yusuf.pdf.msg',
        date: '2026-05-11T17:54:01',
        subject: 'STATUS - CERT.CU284412_Abd Latiff b Md Yusuf.pdf',
        attachments: [],
      },
      {
        folderId: '9F45000424C654710000',
        filename: '2026-05-11_185343_Re_ STATUS - CERT.CU284412_Abd Latiff b Md Yusuf.pdf.msg',
        date: '2026-05-11T18:53:43',
        subject: 'Re: STATUS - CERT.CU284412_Abd Latiff b Md Yusuf.pdf',
        attachments: [],
      },
    ],
  },

  // 10. Sin Chian Ying – Firefly Flight Delayed – MBB Credit Card (multi-email)
  {
    caseKey: 'FIREFLY-MBB',
    claimantName: 'SIN CHIAN YING',
    claimType: 'Flight Delay',
    emails: [
      {
        folderId: '9F45000424C654600000',
        filename: '2026-05-11_175700_FW_ Flight Delayed Firefly - Purchase Via MBB Credit Card.msg',
        date: '2026-05-11T17:57:00',
        subject: 'FW: Flight Delayed Firefly - Purchase Via MBB Credit Card',
        attachments: ['gmail_images20260504_203911.png'],
      },
      {
        folderId: '9F45000424C654610000',
        filename: '2026-05-11_175701_RE_ Flight Delayed Firefly - Purchase Via MBB Credit Card.msg',
        date: '2026-05-11T17:57:01',
        subject: 'RE: Flight Delayed Firefly - Purchase Via MBB Credit Card',
        attachments: ['image001.jpg', 'image002.jpg'],
      },
      {
        folderId: '9F45000424C654640000',
        filename: '2026-05-11_181257_FW_ Flight Delayed Firefly - Purchase Via MBB Credit Card.msg',
        date: '2026-05-11T18:12:57',
        subject: 'FW: Flight Delayed Firefly - Purchase Via MBB Credit Card',
        attachments: [
          '0379011908636600_20260503.pdf',
          '821343.jpg', '821350.jpg', '821355.jpg', '821357.jpg', '821359.jpg',
        ],
      },
      {
        folderId: '9F45000424C654670000',
        filename: '2026-05-11_181556_FW_ Flight Delayed Firefly - Purchase Via MBB Credit Card - Sin Chian Ying.msg',
        date: '2026-05-11T18:15:56',
        subject: 'FW: Flight Delayed Firefly - Purchase Via MBB Credit Card - Sin Chian Ying',
        attachments: ['gmail_images20260504_203911.png', 'image002.jpg'],
      },
    ],
  },

  // 11. PU551128 – Flight Delay Coverage Enquiry (4-email thread)
  {
    caseKey: 'PU551128',
    policyNo: 'PU551128',
    claimType: 'Flight Delay Coverage Enquiry',
    emails: [
      {
        folderId: '9F45000424C654F60000',
        filename: '2026-05-12_024644_FW_ Enquiry on Flight Delay Coverage – Policy PU551128.msg',
        date: '2026-05-12T02:46:44',
        subject: 'FW: Enquiry on Flight Delay Coverage – Policy PU551128',
        attachments: [
          'Indonesia Trip_Insurance_260503_150115.pdf',
          'Medan to Penang Itenary.pdf',
          'Reschedule boarding pass.jpeg',
          'Reschedule during the day - 11.30pm.jpeg',
          'Schedule during booking - 9.30pm.jpeg',
        ],
      },
      {
        folderId: '9F45000424C654F70000',
        filename: '2026-05-12_024645_RE_ Enquiry on Flight Delay Coverage – Policy PU551128.msg',
        date: '2026-05-12T02:46:45',
        subject: 'RE: Enquiry on Flight Delay Coverage – Policy PU551128',
        attachments: ['image001.jpg', 'image002.jpg'],
      },
      {
        folderId: '9F45000424C654F80000',
        filename: '2026-05-12_024652_RE_ Enquiry on Flight Delay Coverage – Policy PU551128.msg',
        date: '2026-05-12T02:46:52',
        subject: 'RE: Enquiry on Flight Delay Coverage – Policy PU551128',
        attachments: [],
      },
      {
        folderId: '9F45000424C654F90000',
        filename: '2026-05-12_024652_RE_ Enquiry on Flight Delay Coverage – Policy PU551128.msg',
        date: '2026-05-12T02:46:52',
        subject: 'RE: Enquiry on Flight Delay Coverage – Policy PU551128',
        attachments: ['image001.jpg', 'image002.jpg'],
      },
    ],
  },

  // 12. LEE THENG THENG – Pending Docs – CU639251 (6 attachments)
  {
    caseKey: 'CU639251',
    claimNo: 'CU639251',
    claimantName: 'LEE THENG THENG',
    claimType: 'Travel Claim – Pending Documents',
    emails: [
      {
        folderId: '9F45000424C654780000',
        filename: '2026-05-11_191006_Re_ TRAVEL CLAIM_ PENDING DOCUMENTS _ LEE THENG THENG - CU639251.msg',
        date: '2026-05-11T19:10:06',
        subject: 'Re: TRAVEL CLAIM: PENDING DOCUMENTS / LEE THENG THENG - CU639251',
        attachments: [
          'E-receipt theng theng.pdf',
          'image001.png',
          'Itinerary and receipt.pdf',
          'Resit .pdf',
          'RESIT DP - LEETHENG 28DEC-1JAN.pdf',
          'RESIT FULL - LEETHENG 28DEC-1JAN.pdf',
        ],
      },
    ],
  },

  // 13. MOHD FAIZAL – Flight Delay – C9176096 / CU725085
  {
    caseKey: 'C9176096',
    claimNo: 'C9176096',
    policyNo: 'CU725085',
    claimantName: 'MOHD FAIZAL BIN ABU BAKKAR',
    claimType: 'Flight Delay',
    emails: [
      {
        folderId: '9F45000424C6547A0000',
        filename: '2026-05-11_194433_Re_ POLICY NO _ CU725085 - CLAIM NO _ C9176096 - MOHD FAIZAL BIN ABU BAKKAR - FLIGHT DELAY.msg',
        date: '2026-05-11T19:44:33',
        subject: 'Re: POLICY NO: CU725085 - CLAIM NO: C9176096 - MOHD FAIZAL BIN ABU BAKKAR - FLIGHT DELAY',
        attachments: ['image001.jpg'],
      },
    ],
  },

  // 14. MOHD RAISSUDIN – REDO – CU636796 / C9180602 & C9180604
  {
    caseKey: 'C9180602',
    claimNo: 'C9180602',
    policyNo: 'CU636796',
    claimantName: 'MOHD RAISSUDIN BIN RAMLI',
    claimType: 'REDO – Multiple Claims',
    emails: [
      {
        folderId: '9F45000424C654FB0000',
        filename: '2026-05-12_054348_REDO! POLICY NO_ CU636796 – CLAIM NO_ C9180602 _ C9180604 – MOHD RAISSUDIN BIN RAMLI.msg',
        date: '2026-05-12T05:43:48',
        subject: 'REDO! POLICY NO: CU636796 – CLAIM NO: C9180602 / C9180604 – MOHD RAISSUDIN BIN RAMLI',
        attachments: ['image.png', 'image_1.png', 'image_2.png', 'image_3.png', 'image_4.png', 'image_5.png', 'image_6.png'],
      },
    ],
  },

  // 15. AE YIT YUEN – Trip Curtailment – P9096694 / PU448060
  {
    caseKey: 'P9096694',
    claimNo: 'P9096694',
    policyNo: 'PU448060',
    claimantName: 'AE YIT YUEN',
    claimType: 'Trip Curtailment',
    emails: [
      {
        folderId: '9F45000424C654FE0000',
        filename: '2026-05-12_075046_Re_ (Etiqa+_KIV) TR_ Trip Curtailment _ Pol. No._ PU448060 _ Claim No._ P9096694 (AE YIT YUEN).msg',
        date: '2026-05-12T07:50:46',
        subject: 'Re: (Etiqa+/KIV) TR: Trip Curtailment / Pol. No.: PU448060 / Claim No.: P9096694 (AE YIT YUEN)',
        attachments: [],
      },
    ],
  },

  // 16. Missed Travel Connection – CU76470801010000150502 (thread + 8 attachments)
  {
    caseKey: 'CU764708-MTC',
    claimNo: 'CU76470801010000150502',
    claimType: 'Missed Travel Connection',
    emails: [
      {
        folderId: '9F45000424C654FF0000',
        filename: '2026-05-12_075914_Travel Insurance Claim – Missed Travel Connection (Claim No. CU76470801010000150502).msg',
        date: '2026-05-12T07:59:14',
        subject: 'Travel Insurance Claim – Missed Travel Connection (Claim No. CU76470801010000150502)',
        attachments: [
          'AirAsia KUL-KIX Boarding Pass.pdf',
          'Batik Air Itinerary.pdf',
          'Batik Air KIX-KUL Receipt.pdf',
          'CYGYYS Itinerary KUL-KIX.pdf',
          'CYGYYS KUL-KIX AirAsia Receipt.pdf',
          'FE78NE VA Ticket Open.pdf',
          'FlightDivertedCertification_08May2026_14-06-02.pdf',
          'VA Boarding Pass.pdf',
        ],
      },
      {
        folderId: '9F45000424C655010000',
        filename: '2026-05-12_080350_Travel Insurance Claim – Missed Travel Connection (Claim No. CU76470801010000150502).msg',
        date: '2026-05-12T08:03:50',
        subject: 'Travel Insurance Claim – Missed Travel Connection (Claim No. CU76470801010000150502)',
        attachments: [],
      },
    ],
  },

  // 17. NAJMAH ABD RAHMAN – Pending Case – CU734963
  {
    caseKey: 'CU734963',
    policyNo: 'CU734963',
    claimantName: 'NAJMAH ABD RAHMAN',
    claimType: 'Pending Case – Updated Status',
    emails: [
      {
        folderId: '9F45000424C655000000',
        filename: '2026-05-12_080029_Re_ [UPDATED] PENDING CASE- POLICY CU734963 NAJMAH ABD RAHMAN.msg',
        date: '2026-05-12T08:00:29',
        subject: 'Re: [UPDATED] PENDING CASE- POLICY CU734963 NAJMAH ABD RAHMAN',
        attachments: ['image.png', 'image_1.png', 'image_2.png', 'image_3.png', 'image_4.png', 'image_5.png', 'image_6.png'],
      },
    ],
  },

  // 18. NORAZLINA – Pending Docs 2nd Reminder – CU743278
  {
    caseKey: 'CU743278',
    claimNo: 'CU743278',
    claimantName: 'NORAZLINA BINTI SHARIFFUDDIN',
    claimType: 'Travel Claim – Pending Documents (2nd Reminder)',
    emails: [
      {
        folderId: '9F45000424C654770000',
        filename: '2026-05-11_191004_RE_ TRAVEL CLAIM_ PENDING DOCUMENTS _ NORAZLINA BINTI SHARIFFUDDIN - CU743278 2ND REMINDER.msg',
        date: '2026-05-11T19:10:04',
        subject: 'RE: TRAVEL CLAIM: PENDING DOCUMENTS / NORAZLINA BINTI SHARIFFUDDIN - CU743278 2ND REMINDER',
        attachments: ['9A76OK.pdf'],
      },
    ],
  },

  // 19. Appeal – CU84283201010000152078
  {
    caseKey: 'CU842832-APPEAL',
    claimNo: 'CU84283201010000152078',
    claimType: 'Appeal – Travel Claim',
    emails: [
      {
        folderId: '9F45000424C654720000',
        filename: '2026-05-11_185349_Appeal Travel Claim Case _ CU84283201010000152078.msg',
        date: '2026-05-11T18:53:49',
        subject: 'Appeal Travel Claim Case: CU84283201010000152078',
        attachments: [],
      },
    ],
  },

  // 20. PU578252 – Flight Cancellation
  {
    caseKey: 'PU578252',
    policyNo: 'PU578252',
    claimType: 'Flight Cancellation',
    emails: [
      {
        folderId: '9F45000424C654760000',
        filename: '2026-05-11_190214_Travel Insurance Claim Request for Flight Cancellation – Policy PU578252.msg',
        date: '2026-05-11T19:02:14',
        subject: 'Travel Insurance Claim Request for Flight Cancellation – Policy PU578252',
        attachments: [],
      },
    ],
  },
]

/** Flat list of all email source records */
export const allEmailSources: EmailSource[] = caseEmailGroups.flatMap(g => g.emails)

/** Look up case group by case key */
export function getCaseGroup(caseKey: string): CaseEmailGroup | undefined {
  return caseEmailGroups.find(g => g.caseKey === caseKey)
}

/** Build base path for an email .msg file */
export function emailPath(folderId: string): string {
  return `sources/_email_staging/${folderId}`
}

/** Build base path for an attachment */
export function attachmentPath(folderId: string, filename: string): string {
  return `sources/_attachment_staging/${folderId}/${filename}`
}
