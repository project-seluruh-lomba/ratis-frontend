import { getStoreDetail } from './admin-store-detail-data'

export type AuditCategory =
  | 'Verifikasi Legalitas'
  | 'Delegasi Staf'
  | 'Rekonsiliasi Escrow'
  | 'Penerbitan Akad Digital'
  | 'Uji Isolasi Sanksi'
  | 'Inisiasi Relasi Akun'

export type AuditActorTone = 'primary' | 'emerald' | 'amber' | 'slate'

export type StoreAuditActor = {
  name: string
  role: string
  initials: string
  tone: AuditActorTone
}

export type StoreAuditEntry = {
  id: string
  at: string
  category: AuditCategory
  title: string
  reference: string
  actor: StoreAuditActor
  hash: string
  ip: string
  agent: string
  payloadBefore: Record<string, unknown>
  payloadAfter: Record<string, unknown>
}

export type StoreAuditLog = {
  slug: string
  relationId: string
  relationCode: string
  merkleRoot: string
  since: string
  ownerName: string
  ownerUserId: string
  ownerInitials: string
  staffActive: number
  staffRoles: string
  escrowBank: string
  escrowMasked: string
  escrowHolder: string
  escrowLimit: string
  escrowRail: string
  clauseTitle: string
  clauseRef: string
  clauseBody: string
  clausePoints: string[]
  entries: StoreAuditEntry[]
}

const BU_SARI_ENTRIES: StoreAuditEntry[] = [
  {
    id: 'LOG-REL-88219',
    at: '2024-10-18T14:22:08+07:00',
    category: 'Verifikasi Legalitas',
    title: 'Penetapan Bu Sri Wahyuni sebagai Pemilik Sah Warung Bu Sari',
    reference: 'Audit OSS Kemenkop • Ref. Dokumen OSS-NIB-2023.pdf',
    actor: { name: 'Dian Nurdin', role: 'Superadmin Kurasi', initials: 'DN', tone: 'emerald' },
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ip: '182.253.14.88',
    agent: 'Chrome 122.0 (Windows) • Admin Console TLS 1.3',
    payloadBefore: {
      event: 'OSS_NIB_VERIFICATION',
      shop_id: '#SHIP-KUL-012',
      owner_id: 'USR-1082-SLL',
      compliance_tier: 'PROVISIONAL',
      escrow_unrestricted: false,
    },
    payloadAfter: {
      event: 'OSS_NIB_VERIFICATION',
      shop_id: '#SHIP-KUL-012',
      owner_id: 'USR-1082-SLL',
      compliance_tier: 'VERIFIED',
      escrow_unrestricted: true,
    },
  },
  {
    id: 'LOG-REL-88194',
    at: '2024-10-05T09:14:31+07:00',
    category: 'Delegasi Staf',
    title: 'Penambahan staf Bagus Anugrah sebagai Kasir POS',
    reference: 'Otorisasi POS Mandiri • Disetujui via PIN OTP Pemilik',
    actor: { name: 'Bu Sri Wahyuni', role: 'Pemilik Toko', initials: 'SW', tone: 'primary' },
    hash: '9f2c71d4a6b8e05c3d1f7a920b46e8d5c2a19f4b7e83d06c5a2f18b9e4d7c301',
    ip: '182.253.14.88',
    agent: 'Chrome 122.0 (Android) • Owner App TLS 1.3',
    payloadBefore: {
      event: 'STAFF_DELEGATION_ADD',
      staff_id: 'USR-2240-STF',
      active_staff: 1,
      scope: ['pos', 'receipt'],
    },
    payloadAfter: {
      event: 'STAFF_DELEGATION_ADD',
      staff_id: 'USR-2240-STF',
      active_staff: 2,
      scope: ['pos', 'receipt', 'order_status'],
    },
  },
  {
    id: 'LOG-REL-87910',
    at: '2024-09-22T16:45:12+07:00',
    category: 'Rekonsiliasi Escrow',
    title: 'Penarikan saldo escrow merchant ke rekening BCA terdaftar',
    reference: 'Pencairan Penjualan • Tx ID: #WD-20240922-819',
    actor: { name: 'System Cron Job', role: 'Escrow Clearing Engine', initials: 'SC', tone: 'slate' },
    hash: '4b7a10e8d3c5f29a6b0d8471c3e95f2a8d6b01c4e7f3829a5d0c6b1e4f7a2d93',
    ip: '10.20.4.11',
    agent: 'Escrow Worker v3.4 • Internal Service Mesh',
    payloadBefore: {
      event: 'ESCROW_PAYOUT',
      escrow_balance: 1845000,
      payout_status: 'QUEUED',
      channel: 'BI_FAST',
    },
    payloadAfter: {
      event: 'ESCROW_PAYOUT',
      escrow_balance: 0,
      payout_status: 'SETTLED',
      channel: 'BI_FAST',
    },
  },
  {
    id: 'LOG-REL-87102',
    at: '2024-08-14T11:05:40+07:00',
    category: 'Penerbitan Akad Digital',
    title: 'Penandatanganan addendum digital perjanjian kemitraan v2.1',
    reference: 'Perjanjian Kemitraan v2.1 • Cert Doc #AD-2024-884',
    actor: { name: 'Bu Sri Wahyuni', role: 'Pemilik Toko', initials: 'SW', tone: 'primary' },
    hash: 'c1d9e4f7a2b6c8035d7e91f4a6c2b8d0e3f5a7c9b1d4e6f8a0c2b4d6e8f0a1c3',
    ip: '182.253.14.88',
    agent: 'Chrome 122.0 (Android) • Digital Signature API',
    payloadBefore: {
      event: 'PARTNERSHIP_ADDENDUM',
      document_version: 'v2.0',
      signature: null,
      clause_15_3: 'PENDING',
    },
    payloadAfter: {
      event: 'PARTNERSHIP_ADDENDUM',
      document_version: 'v2.1',
      signature: 'sha256:c1d9e4f7a2b6c8...',
      clause_15_3: 'ACKNOWLEDGED',
    },
  },
  {
    id: 'LOG-REL-86540',
    at: '2024-06-03T08:12:19+07:00',
    category: 'Uji Isolasi Sanksi',
    title: 'Simulasi penangguhan akun tanpa menghentikan operasional toko',
    reference: 'Uji Coba PRD 15.3 • Audit Sandbox Success',
    actor: { name: 'Rizky Ramadha', role: 'Operator Verifikasi', initials: 'RR', tone: 'amber' },
    hash: '7a2f5c9e1b4d8f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a',
    ip: '103.28.14.20',
    agent: 'Chrome 121.0 (Windows) • Sandbox Console',
    payloadBefore: {
      event: 'SANCTION_ISOLATION_TEST',
      owner_account_state: 'SUSPENDED',
      store_operational: true,
      order_intake: 'OPEN',
    },
    payloadAfter: {
      event: 'SANCTION_ISOLATION_TEST',
      owner_account_state: 'SUSPENDED',
      store_operational: true,
      order_intake: 'OPEN',
      assertion: 'PASSED',
    },
  },
  {
    id: 'LOG-REL-85011',
    at: '2023-11-12T10:00:00+07:00',
    category: 'Inisiasi Relasi Akun',
    title: 'Penciptaan relasi hukum permanen akun pemilik dan entitas toko',
    reference: 'Registrasi Awal Merchant • Genesis Block Hubungan',
    actor: {
      name: 'System Onboarding',
      role: 'Automated Service',
      initials: 'SC',
      tone: 'slate',
    },
    hash: '2d8f6a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f',
    ip: '10.20.4.12',
    agent: 'Onboarding Worker v2.8 • Internal Service Mesh',
    payloadBefore: {
      event: 'RELATION_GENESIS',
      owner_id: 'USR-1082-SLL',
      shop_id: '#SHIP-KUL-012',
      relation_state: 'DRAFT',
    },
    payloadAfter: {
      event: 'RELATION_GENESIS',
      owner_id: 'USR-1082-SLL',
      shop_id: '#SHIP-KUL-012',
      relation_state: 'BOUND',
      relation_id: '#REL-2024-KUL-091',
    },
  },
  {
    id: 'LOG-REL-84920',
    at: '2023-11-02T09:12:44+07:00',
    category: 'Inisiasi Relasi Akun',
    title: 'Pra-registrasi entitas Warung Bu Sari pada pusat operasional UMKM',
    reference: 'Registrasi Awal Merchant • Formulir Pra-Daftar #REG-0912',
    actor: {
      name: 'System Onboarding',
      role: 'Automated Service',
      initials: 'SC',
      tone: 'slate',
    },
    hash: '5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e',
    ip: '10.20.4.12',
    agent: 'Onboarding Worker v2.8 • Internal Service Mesh',
    payloadBefore: {
      event: 'SHOP_PRE_REGISTRATION',
      shop_id: null,
      owner_email: 'warungsri@gmail.com',
    },
    payloadAfter: {
      event: 'SHOP_PRE_REGISTRATION',
      shop_id: '#SHIP-KUL-012',
      owner_email: 'warungsri@gmail.com',
    },
  },
  {
    id: 'LOG-REL-84801',
    at: '2023-10-28T13:30:09+07:00',
    category: 'Verifikasi Legalitas',
    title: 'Validasi NIB 9120008129384 terhadap basis data OSS BKPM',
    reference: 'Audit OSS Kemenkop • Ref. Dokumen OSS-NIB-2023.pdf',
    actor: { name: 'Dian Nurdin', role: 'Superadmin Kurasi', initials: 'DN', tone: 'emerald' },
    hash: '8f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a',
    ip: '182.253.14.88',
    agent: 'Chrome 122.0 (Windows) • Admin Console TLS 1.3',
    payloadBefore: {
      event: 'NIB_LOOKUP',
      nib: '9120008129384',
      oss_status: 'UNCHECKED',
    },
    payloadAfter: {
      event: 'NIB_LOOKUP',
      nib: '9120008129384',
      oss_status: 'VALID',
    },
  },
  {
    id: 'LOG-REL-84712',
    at: '2023-10-25T10:02:51+07:00',
    category: 'Delegasi Staf',
    title: 'Siti Rahayu ditambahkan sebagai staf dapur dan inventaris',
    reference: 'Otorisasi POS Mandiri • Disetujui via PIN OTP Pemilik',
    actor: { name: 'Bu Sri Wahyuni', role: 'Pemilik Toko', initials: 'SW', tone: 'primary' },
    hash: '1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e',
    ip: '182.253.14.88',
    agent: 'Chrome 121.0 (Android) • Owner App TLS 1.3',
    payloadBefore: {
      event: 'STAFF_DELEGATION_ADD',
      staff_id: 'USR-3819-STF',
      active_staff: 0,
      scope: [],
    },
    payloadAfter: {
      event: 'STAFF_DELEGATION_ADD',
      staff_id: 'USR-3819-STF',
      active_staff: 1,
      scope: ['stock', 'order_status', 'daily_report'],
    },
  },
  {
    id: 'LOG-REL-84620',
    at: '2023-10-21T15:48:33+07:00',
    category: 'Penerbitan Akad Digital',
    title: 'Penerbitan akad kemitraan awal v1.0 antara pemilik dan Ratis',
    reference: 'Perjanjian Kemitraan v1.0 • Cert Doc #AD-2023-120',
    actor: {
      name: 'System Onboarding',
      role: 'Automated Service',
      initials: 'SC',
      tone: 'slate',
    },
    hash: '3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a',
    ip: '10.20.4.12',
    agent: 'Document Service v1.9 • Internal Service Mesh',
    payloadBefore: {
      event: 'PARTNERSHIP_ISSUED',
      document_version: null,
      owner_signature: null,
    },
    payloadAfter: {
      event: 'PARTNERSHIP_ISSUED',
      document_version: 'v1.0',
      owner_signature: 'sha256:3f6a9c2e5b8d...',
    },
  },
  {
    id: 'LOG-REL-84544',
    at: '2023-10-19T08:21:17+07:00',
    category: 'Verifikasi Legalitas',
    title: 'Pemeriksaan kesesuaian KTP pemilik dengan nama entitas usaha',
    reference: 'Audit OSS Kemenkop • Berkas KTP-1082-SLL.pdf',
    actor: { name: 'Dian Nurdin', role: 'Superadmin Kurasi', initials: 'DN', tone: 'emerald' },
    hash: '6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b',
    ip: '182.253.14.88',
    agent: 'Chrome 122.0 (Windows) • Admin Console TLS 1.3',
    payloadBefore: {
      event: 'IDENTITY_MATCH',
      ktp_name: 'SRI WAHYUNI',
      entity_name: null,
    },
    payloadAfter: {
      event: 'IDENTITY_MATCH',
      ktp_name: 'SRI WAHYUNI',
      entity_name: 'WARUNG BU SARI',
      match: true,
    },
  },
  {
    id: 'LOG-REL-84402',
    at: '2023-10-15T11:36:58+07:00',
    category: 'Rekonsiliasi Escrow',
    title: 'Aktivasi rekening penampung escrow BCA **** 9283',
    reference: 'Pencairan Penjualan • Verifikasi BI-FAST Directory',
    actor: { name: 'System Cron Job', role: 'Escrow Clearing Engine', initials: 'SC', tone: 'slate' },
    hash: '0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f',
    ip: '10.20.4.11',
    agent: 'Escrow Worker v3.4 • Internal Service Mesh',
    payloadBefore: {
      event: 'ESCROW_ACCOUNT_BIND',
      account_masked: '**** 9283',
      binding_status: 'PENDING',
    },
    payloadAfter: {
      event: 'ESCROW_ACCOUNT_BIND',
      account_masked: '**** 9283',
      binding_status: 'ACTIVE',
    },
  },
  {
    id: 'LOG-REL-84318',
    at: '2023-10-11T09:07:05+07:00',
    category: 'Uji Isolasi Sanksi',
    title: 'Uji drift kebijakan isolasi akun pada lingkungan sandbox',
    reference: 'Uji Coba PRD 15.3 • Audit Sandbox Success',
    actor: { name: 'Rizky Ramadha', role: 'Operator Verifikasi', initials: 'RR', tone: 'amber' },
    hash: '7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e',
    ip: '103.28.14.20',
    agent: 'Chrome 121.0 (Windows) • Sandbox Console',
    payloadBefore: {
      event: 'POLICY_DRIFT_TEST',
      isolation_rule: 'PRD_15_3',
      drift_detected: false,
    },
    payloadAfter: {
      event: 'POLICY_DRIFT_TEST',
      isolation_rule: 'PRD_15_3',
      drift_detected: false,
      assertion: 'PASSED',
    },
  },
  {
    id: 'LOG-REL-84206',
    at: '2023-10-08T16:19:40+07:00',
    category: 'Inisiasi Relasi Akun',
    title: 'Permintaan tautan akun pemilik ke entitas toko Warung Bu Sari',
    reference: 'Registrasi Awal Merchant • Permintaan #LINK-2023-771',
    actor: { name: 'Bu Sri Wahyuni', role: 'Pemilik Toko', initials: 'SW', tone: 'primary' },
    hash: '9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a',
    ip: '182.253.14.88',
    agent: 'Chrome 121.0 (Android) • Owner App TLS 1.3',
    payloadBefore: {
      event: 'OWNER_LINK_REQUEST',
      shop_id: '#SHIP-KUL-012',
      linked_owner: null,
    },
    payloadAfter: {
      event: 'OWNER_LINK_REQUEST',
      shop_id: '#SHIP-KUL-012',
      linked_owner: 'USR-1082-SLL',
      approval: 'PENDING_ADMIN',
    },
  },
  {
    id: 'LOG-REL-84090',
    at: '2023-10-04T10:44:12+07:00',
    category: 'Verifikasi Legalitas',
    title: 'Sinkronisasi data NIB dengan layanan OSS BKPM',
    reference: 'Audit OSS Kemenkop • Ref. Dokumen OSS-NIB-2023.pdf',
    actor: { name: 'Dian Nurdin', role: 'Superadmin Kurasi', initials: 'DN', tone: 'emerald' },
    hash: '4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c',
    ip: '182.253.14.88',
    agent: 'Chrome 122.0 (Windows) • Admin Console TLS 1.3',
    payloadBefore: {
      event: 'OSS_SYNC',
      sync_status: 'STALE',
      last_sync: null,
    },
    payloadAfter: {
      event: 'OSS_SYNC',
      sync_status: 'FRESH',
      last_sync: '2023-10-04T03:44:10Z',
    },
  },
  {
    id: 'LOG-REL-83955',
    at: '2023-09-29T14:13:27+07:00',
    category: 'Delegasi Staf',
    title: 'Pencabutan sementara delegasi kasir lama sebelum rekrutmen baru',
    reference: 'Otorisasi POS Mandiri • Disetujui via PIN OTP Pemilik',
    actor: { name: 'Bu Sri Wahyuni', role: 'Pemilik Toko', initials: 'SW', tone: 'primary' },
    hash: '2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b',
    ip: '182.253.14.88',
    agent: 'Chrome 121.0 (Android) • Owner App TLS 1.3',
    payloadBefore: {
      event: 'STAFF_DELEGATION_REVOKE',
      staff_id: 'USR-1998-STF',
      active_staff: 1,
    },
    payloadAfter: {
      event: 'STAFF_DELEGATION_REVOKE',
      staff_id: 'USR-1998-STF',
      active_staff: 0,
      reason: 'Rotasi kasir',
    },
  },
  {
    id: 'LOG-REL-83811',
    at: '2023-09-24T09:58:03+07:00',
    category: 'Penerbitan Akad Digital',
    title: 'Pembaruan klausul 15.3 tentang independensi akun dan toko',
    reference: 'Perjanjian Kemitraan v1.1 • Cert Doc #AD-2023-455',
    actor: {
      name: 'System Onboarding',
      role: 'Automated Service',
      initials: 'SC',
      tone: 'slate',
    },
    hash: '6d9f2a5c8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f',
    ip: '10.20.4.12',
    agent: 'Document Service v1.9 • Internal Service Mesh',
    payloadBefore: {
      event: 'CLAUSE_UPDATE',
      clause_15_3: 'NOT_PRESENT',
      document_version: 'v1.0',
    },
    payloadAfter: {
      event: 'CLAUSE_UPDATE',
      clause_15_3: 'INDEPENDENCE_OF_STORE_AND_ACCOUNT',
      document_version: 'v1.1',
    },
  },
  {
    id: 'LOG-REL-83704',
    at: '2023-09-18T11:02:36+07:00',
    category: 'Inisiasi Relasi Akun',
    title: 'Entitas toko dibuat dalam status draf menunggu kelengkapan berkas',
    reference: 'Registrasi Awal Merchant • Draf #DRAFT-2023-0912',
    actor: {
      name: 'System Onboarding',
      role: 'Automated Service',
      initials: 'SC',
      tone: 'slate',
    },
    hash: '8e1b4d7f0a3c6e9b2d5f8a1c4e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b',
    ip: '10.20.4.12',
    agent: 'Onboarding Worker v2.8 • Internal Service Mesh',
    payloadBefore: {
      event: 'SHOP_DRAFT_CREATED',
      shop_id: null,
      owner_id: 'USR-1082-SLL',
    },
    payloadAfter: {
      event: 'SHOP_DRAFT_CREATED',
      shop_id: '#SHIP-KUL-012',
      owner_id: 'USR-1082-SLL',
      draft_state: 'INCOMPLETE',
    },
  },
]

const warungBuSariAuditLog: StoreAuditLog = {
  slug: 'warung-bu-sari',
  relationId: 'REL-2024-KUL-091',
  relationCode: '#REL-2024-KUL-091',
  merkleRoot: '#MTR-8812-701A',
  since: '2023-11-12T10:00:00+07:00',
  ownerName: 'Bu Sri Wahyuni',
  ownerUserId: 'USR-1082-SLL',
  ownerInitials: 'SW',
  staffActive: 2,
  staffRoles: 'Kasir POS & Operator Dapur',
  escrowBank: 'BCA',
  escrowMasked: '**** 9283',
  escrowHolder: 'a/n Sri Wahyuni (Pencairan Mandiri)',
  escrowLimit: 'Pemilik Tunggal',
  escrowRail: 'BI-FAST',
  clauseTitle: 'Klausul Independensi Toko & Akun (PRD Bab 4.5 & 15.3)',
  clauseRef: 'REG-2024-UKM',
  clauseBody:
    'Sistem menjamin operasional Warung Bu Sari (#SHIP-KUL-012) tetap berjalan via delegasi staf kasir resmi apabila akun personal Bu Sri Wahyuni menghadapi investigasi administratif, pembekuan kartu, atau pembaruan password berkala tanpa menghentikan pelayanan pelanggan warung fisik.',
  clausePoints: [
    'Akun pemilik dan entitas usaha dicatat sebagai dua subjek hukum terpisah dengan relasi kepemilikan yang eksplisit.',
    'Penangguhan akun personal tidak otomatis menonaktifkan etalase, menahan pesanan berjalan, atau membekukan saldo escrow tanpa keputusan arbitrase.',
    'Delegasi staf resmi wajib tercatat, memiliki cakupan akses terbatas, dan dapat dicabut pemilik kapan saja.',
    'Setiap perubahan status hubungan disegel dengan hash SHA-256 dan dirangkum pada Merkle root harian agar tidak dapat diubah diam-diam.',
  ],
  entries: BU_SARI_ENTRIES,
}

function buildFallbackAuditLog(slug: string): StoreAuditLog {
  const detail = getStoreDetail(slug)
  const ownerName = detail.owner.name
  const ownerInitials = ownerName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return {
    ...warungBuSariAuditLog,
    slug,
    relationId: 'REL-BARU-000',
    relationCode: '#REL-BARU-000',
    merkleRoot: '#MTR-0000-0000',
    since: detail.registeredAt,
    ownerName,
    ownerUserId: detail.owner.userId,
    ownerInitials,
    staffActive: detail.staff.filter((member) => member.status === 'aktif').length,
    staffRoles: 'Staf operasional terdaftar',
    escrowHolder: `a/n ${ownerName}`,
    clauseBody: `Sistem menjamin operasional ${detail.name} (${detail.storeCode}) tetap berjalan via delegasi staf resmi apabila akun personal ${ownerName} menghadapi investigasi administratif, pembekuan kartu, atau pembaruan password berkala.`,
    entries: [
      {
        id: 'LOG-REL-00001',
        at: detail.registeredAt,
        category: 'Inisiasi Relasi Akun',
        title: `Penciptaan relasi hukum akun ${ownerName} dan entitas ${detail.name}`,
        reference: `Registrasi Awal Merchant • ${detail.storeCode}`,
        actor: {
          name: 'System Onboarding',
          role: 'Automated Service',
          initials: 'SC',
          tone: 'slate',
        },
        hash: '0000000000000000000000000000000000000000000000000000000000000001',
        ip: '10.20.4.12',
        agent: 'Onboarding Worker v2.8 • Internal Service Mesh',
        payloadBefore: {
          event: 'RELATION_GENESIS',
          owner_id: detail.owner.userId,
          shop_id: detail.storeCode,
          relation_state: 'DRAFT',
        },
        payloadAfter: {
          event: 'RELATION_GENESIS',
          owner_id: detail.owner.userId,
          shop_id: detail.storeCode,
          relation_state: 'BOUND',
          relation_id: '#REL-BARU-000',
        },
      },
    ],
  }
}

export function getStoreAuditLog(slug: string): StoreAuditLog {
  if (slug === warungBuSariAuditLog.slug) return warungBuSariAuditLog
  return buildFallbackAuditLog(slug)
}
