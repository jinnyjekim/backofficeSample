export type AdminStatus = '정상' | '비활성' | '잠금';

export const ADMIN_STATUSES: AdminStatus[] = ['정상', '비활성', '잠금'];

export const STATUS_META: Record<AdminStatus, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#059669' },
  비활성: { bg: '#f4f4f5', fg: '#71717a' },
  잠금: { bg: '#fef2f2', fg: '#b91c1c' },
};

import { ROLES_LIST, roleName as roleNameFromRoles } from './roleData';

export interface Role {
  id: string;
  name: string;
}

// Role list is sourced from 역할 및 권한 관리 (roleData.ts), not hardcoded here —
// 관리자 목록 only ever displays roles that actually exist there.
export const ROLES: Role[] = ROLES_LIST.map((r) => ({ id: r.id, name: r.name }));

export function roleName(id: string): string {
  return roleNameFromRoles(id);
}

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  detail?: string;
}

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roleIds: string[];
  status: AdminStatus;
  isSuperAdmin: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  loginFailCount: number;
  createdAt: string;
  updatedAt: string;
  memos: Memo[];
  history: HistoryEntry[];
}

export const TODAY = '2026-08-26';

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length <= 2 ? `${local[0]}*` : `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}`;
  const domainParts = domain.split('.');
  const tld = domainParts.pop() ?? '';
  const maskedDomain = '*'.repeat(Math.max(3, domainParts.join('.').length));
  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

export function nextAdminId(all: AdminAccount[]): string {
  const max = all.reduce((m, a) => {
    const n = Number(a.id.replace('admin', ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `admin${String(max + 1).padStart(3, '0')}`;
}

export function activeSuperAdminCount(all: AdminAccount[]): number {
  return all.filter((a) => a.isSuperAdmin && a.status === '정상').length;
}

export function computeIssues(a: AdminAccount, all: AdminAccount[]): string[] {
  const issues: string[] = [];
  if (a.status === '정상' && a.loginFailCount >= 5) issues.push('로그인 실패가 누적되어 잠금 처리 검토가 필요합니다.');
  const dupEmail = all.some((x) => x.id !== a.id && x.email.toLowerCase() === a.email.toLowerCase());
  if (dupEmail) issues.push('동일한 이메일을 사용하는 다른 관리자 계정이 있습니다.');
  if (a.status === '정상' && a.roleIds.length === 0) issues.push('할당된 역할이 없습니다.');
  return issues;
}

export const ADMINS: AdminAccount[] = [
  {
    id: 'admin001',
    name: '김운영',
    email: 'admin01@example.com',
    phone: '010-1234-5001',
    roleIds: ['role-super', 'role-ops'],
    status: '정상',
    isSuperAdmin: true,
    lastLoginAt: '2026-08-26 09:32',
    lastLoginIp: '121.134.22.10',
    loginFailCount: 0,
    createdAt: '2024-01-15',
    updatedAt: '2026-08-26',
    memos: [],
    history: [
      { id: 'H-admin001-1', at: '2024-01-15 10:00', by: 'system', action: '계정 생성' },
      { id: 'H-admin001-2', at: '2026-08-26 09:32', by: 'admin001', action: '로그인' },
    ],
  },
  {
    id: 'admin002',
    name: '이상담',
    email: 'admin02@example.com',
    phone: '010-1234-5002',
    roleIds: ['role-cs'],
    status: '정상',
    isSuperAdmin: false,
    lastLoginAt: '2026-08-25 17:20',
    lastLoginIp: '121.134.22.41',
    loginFailCount: 0,
    createdAt: '2024-03-02',
    updatedAt: '2026-08-25',
    memos: [{ id: 'M-admin002-1', at: '2025-06-01 11:00', by: 'admin001', text: 'CS팀 리드로 역할 조정.' }],
    history: [
      { id: 'H-admin002-1', at: '2024-03-02 09:00', by: 'admin001', action: '계정 생성' },
      { id: 'H-admin002-2', at: '2025-06-01 11:00', by: 'admin001', action: '역할 변경', detail: 'CS 관리자' },
    ],
  },
  {
    id: 'admin003',
    name: '박콘텐츠',
    email: 'admin03@example.com',
    phone: null,
    roleIds: ['role-content'],
    status: '잠금',
    isSuperAdmin: false,
    lastLoginAt: '2026-08-20 11:05',
    lastLoginIp: '58.229.10.77',
    loginFailCount: 6,
    createdAt: '2024-05-11',
    updatedAt: '2026-08-20',
    memos: [],
    history: [
      { id: 'H-admin003-1', at: '2024-05-11 09:00', by: 'admin001', action: '계정 생성' },
      { id: 'H-admin003-2', at: '2026-08-20 11:06', by: 'system', action: '로그인 잠금', detail: '로그인 5회 연속 실패' },
    ],
  },
  {
    id: 'admin004',
    name: '최정산',
    email: 'admin04@example.com',
    phone: '010-1234-5004',
    roleIds: ['role-settlement'],
    status: '정상',
    isSuperAdmin: false,
    lastLoginAt: '2026-08-24 08:41',
    lastLoginIp: '121.134.22.90',
    loginFailCount: 0,
    createdAt: '2024-07-19',
    updatedAt: '2026-08-24',
    memos: [],
    history: [{ id: 'H-admin004-1', at: '2024-07-19 09:00', by: 'admin001', action: '계정 생성' }],
  },
  {
    id: 'admin005',
    name: '정운영',
    email: 'admin05@example.com',
    phone: '010-1234-5005',
    roleIds: ['role-ops', 'role-content'],
    status: '정상',
    isSuperAdmin: false,
    lastLoginAt: '2026-08-26 08:02',
    lastLoginIp: '121.134.22.15',
    loginFailCount: 0,
    createdAt: '2024-09-01',
    updatedAt: '2026-08-26',
    memos: [],
    history: [{ id: 'H-admin005-1', at: '2024-09-01 09:00', by: 'admin001', action: '계정 생성' }],
  },
  {
    id: 'admin006',
    name: '한지원',
    email: 'admin06@example.com',
    phone: '010-1234-5006',
    roleIds: ['role-cs'],
    status: '비활성',
    isSuperAdmin: false,
    lastLoginAt: '2026-03-11 14:20',
    lastLoginIp: '58.229.10.20',
    loginFailCount: 0,
    createdAt: '2023-11-08',
    updatedAt: '2026-04-01',
    memos: [{ id: 'M-admin006-1', at: '2026-04-01 10:00', by: 'admin001', text: '퇴사로 계정 비활성화 처리.' }],
    history: [
      { id: 'H-admin006-1', at: '2023-11-08 09:00', by: 'admin001', action: '계정 생성' },
      { id: 'H-admin006-2', at: '2026-04-01 10:00', by: 'admin001', action: '계정 비활성화', detail: '퇴사' },
    ],
  },
  {
    id: 'admin007',
    name: '오신규',
    email: 'admin07@example.com',
    phone: '010-1234-5007',
    roleIds: ['role-content'],
    status: '정상',
    isSuperAdmin: false,
    lastLoginAt: null,
    lastLoginIp: null,
    loginFailCount: 0,
    createdAt: '2026-08-24',
    updatedAt: '2026-08-24',
    memos: [],
    history: [{ id: 'H-admin007-1', at: '2026-08-24 15:00', by: 'admin001', action: '계정 생성' }],
  },
  {
    id: 'admin008',
    name: '윤정산',
    email: 'admin04@example.com',
    phone: '010-1234-5008',
    roleIds: ['role-settlement'],
    status: '정상',
    isSuperAdmin: false,
    lastLoginAt: '2026-08-19 10:15',
    lastLoginIp: '121.134.22.77',
    loginFailCount: 0,
    createdAt: '2025-01-20',
    updatedAt: '2026-08-19',
    memos: [],
    history: [{ id: 'H-admin008-1', at: '2025-01-20 09:00', by: 'admin001', action: '계정 생성' }],
  },
  {
    id: 'admin009',
    name: '서운영',
    email: 'admin09@example.com',
    phone: '010-1234-5009',
    roleIds: ['role-ops'],
    status: '정상',
    isSuperAdmin: false,
    lastLoginAt: '2026-08-22 19:44',
    lastLoginIp: '121.134.22.63',
    loginFailCount: 5,
    createdAt: '2025-02-14',
    updatedAt: '2026-08-22',
    memos: [],
    history: [{ id: 'H-admin009-1', at: '2025-02-14 09:00', by: 'admin001', action: '계정 생성' }],
  },
  {
    id: 'admin010',
    name: '장콘텐츠',
    email: 'admin10@example.com',
    phone: null,
    roleIds: ['role-content'],
    status: '정상',
    isSuperAdmin: false,
    lastLoginAt: '2026-08-18 09:10',
    lastLoginIp: '58.229.10.55',
    loginFailCount: 0,
    createdAt: '2025-04-30',
    updatedAt: '2026-08-18',
    memos: [],
    history: [{ id: 'H-admin010-1', at: '2025-04-30 09:00', by: 'admin001', action: '계정 생성' }],
  },
];

export const SEARCH_SCOPES = ['전체', '관리자 ID', '관리자명', '이메일'] as const;
export type SearchScope = (typeof SEARCH_SCOPES)[number];

export function matchesSearch(a: AdminAccount, scope: SearchScope, keyword: string): boolean {
  if (!keyword) return true;
  const k = keyword.toLowerCase();
  if (scope === '관리자 ID') return a.id.toLowerCase().includes(k);
  if (scope === '관리자명') return a.name.toLowerCase().includes(k);
  if (scope === '이메일') return a.email.toLowerCase().includes(k);
  return a.id.toLowerCase().includes(k) || a.name.toLowerCase().includes(k) || a.email.toLowerCase().includes(k);
}
