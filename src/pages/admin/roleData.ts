export interface MenuPermission {
  access: boolean;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  download: boolean;
}

export type PermKey = 'view' | 'create' | 'edit' | 'delete' | 'download';
export const PERM_LABELS: Record<PermKey, string> = { view: '조회', create: '등록', edit: '수정', delete: '삭제', download: '다운로드' };
export const PERM_KEYS: PermKey[] = ['view', 'create', 'edit', 'delete', 'download'];

export interface MenuLeaf {
  id: string;
  label: string;
}
export interface MenuGroup {
  id: string;
  label: string;
  children: MenuLeaf[];
}

export const MENU_TREE: MenuGroup[] = [
  { id: 'members', label: '회원 관리', children: [
    { id: 'members_list', label: '회원 목록' },
    { id: 'members_left', label: '탈퇴 회원' },
    { id: 'members_ban', label: '제재 회원' },
  ] },
  { id: 'content', label: '콘텐츠 관리', children: [
    { id: 'content_list', label: '콘텐츠 목록' },
    { id: 'content_review', label: '검수 관리' },
  ] },
  { id: 'settlement', label: '정산 관리', children: [
    { id: 'settlement_list', label: '정산 목록' },
    { id: 'settlement_tx', label: '정산 거래 내역' },
  ] },
  { id: 'products', label: '상품 관리', children: [
    { id: 'products_list', label: '상품' },
  ] },
  { id: 'orders', label: '주문 관리', children: [
    { id: 'orders_purchase', label: '발주' },
    { id: 'orders_cancel', label: '취소 관리' },
  ] },
  { id: 'promotions', label: '프로모션 관리', children: [
    { id: 'promotions_list', label: '프로모션 목록' },
    { id: 'coupons_list', label: '쿠폰 목록' },
  ] },
  { id: 'cs', label: '고객센터', children: [
    { id: 'cs_inquiries', label: '1:1 문의' },
    { id: 'cs_consultations', label: '상담 내역' },
  ] },
  { id: 'admin', label: '관리자 관리', children: [
    { id: 'admin_list', label: '관리자 목록' },
    { id: 'admin_roles', label: '역할 및 권한 관리' },
  ] },
];

export function allLeafIds(): string[] {
  return MENU_TREE.flatMap((g) => g.children.map((c) => c.id));
}

export function emptyPerm(): MenuPermission {
  return { access: false, view: false, create: false, edit: false, delete: false, download: false };
}
export function fullPerm(): MenuPermission {
  return { access: true, view: true, create: true, edit: true, delete: true, download: true };
}

export interface RoleHistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  active: boolean;
  isSystem: boolean;
  permissions: Record<string, MenuPermission>;
  history: RoleHistoryEntry[];
}

export const TODAY = '2026-08-26';

function permsFor(fullIds: string[], partial: Record<string, Partial<MenuPermission>> = {}): Record<string, MenuPermission> {
  const out: Record<string, MenuPermission> = {};
  allLeafIds().forEach((id) => {
    out[id] = fullIds.includes(id) ? fullPerm() : { ...emptyPerm(), ...(partial[id] ?? {}) };
  });
  return out;
}

export const ROLES_LIST: Role[] = [
  {
    id: 'role-super',
    name: '최고 관리자',
    code: 'ROLE_SUPER',
    description: '시스템의 모든 메뉴와 기능에 대한 전체 권한을 가진 시스템 역할입니다.',
    active: true,
    isSystem: true,
    permissions: permsFor(allLeafIds()),
    history: [{ id: 'RH-super-1', at: '2024-01-15 10:00', by: 'system', action: '역할 생성' }],
  },
  {
    id: 'role-ops',
    name: '운영 관리자',
    code: 'ROLE_OPERATOR',
    description: '서비스 운영 업무를 담당하는 관리자 역할입니다.',
    active: true,
    isSystem: false,
    permissions: permsFor(
      ['members_list', 'content_list', 'products_list', 'orders_purchase', 'promotions_list', 'coupons_list'],
      { members_left: { access: true, view: true }, members_ban: { access: true, view: true }, orders_cancel: { access: true, view: true, edit: true } },
    ),
    history: [
      { id: 'RH-ops-1', at: '2024-01-15 10:00', by: 'admin001', action: '역할 생성' },
      { id: 'RH-ops-2', at: '2026-08-20 14:32', by: 'admin001', action: '회원 관리 > 다운로드 권한 추가' },
    ],
  },
  {
    id: 'role-cs',
    name: 'CS 관리자',
    code: 'ROLE_CS',
    description: '1:1 문의 및 상담 업무를 담당하는 관리자 역할입니다.',
    active: true,
    isSystem: false,
    permissions: permsFor(['cs_inquiries', 'cs_consultations'], { members_list: { access: true, view: true } }),
    history: [{ id: 'RH-cs-1', at: '2024-03-02 09:00', by: 'admin001', action: '역할 생성' }],
  },
  {
    id: 'role-content',
    name: '콘텐츠 관리자',
    code: 'ROLE_CONTENT',
    description: '콘텐츠 등록과 검수를 담당하는 관리자 역할입니다.',
    active: true,
    isSystem: false,
    permissions: permsFor(['content_list', 'content_review']),
    history: [
      { id: 'RH-content-1', at: '2024-05-11 09:00', by: 'admin001', action: '역할 생성' },
      { id: 'RH-content-2', at: '2026-08-26 10:12', by: 'admin001', action: '콘텐츠 관리 > 삭제 권한 제거' },
    ],
  },
  {
    id: 'role-settlement',
    name: '정산 관리자',
    code: 'ROLE_SETTLEMENT',
    description: '정산 및 정산 거래 내역을 관리하는 관리자 역할입니다.',
    active: true,
    isSystem: false,
    permissions: permsFor(['settlement_list', 'settlement_tx']),
    history: [{ id: 'RH-settlement-1', at: '2024-07-19 09:00', by: 'admin001', action: '역할 생성' }],
  },
];

export function roleName(id: string, roles: Role[] = ROLES_LIST): string {
  return roles.find((r) => r.id === id)?.name ?? id;
}

export function assignedCount(roleId: string, admins: { roleIds: string[] }[]): number {
  return admins.filter((a) => a.roleIds.includes(roleId)).length;
}

export function nextRoleId(all: Role[], name: string): string {
  const base = `role-custom-${Math.max(1, all.filter((r) => r.id.startsWith('role-custom-')).length + 1)}`;
  return all.some((r) => r.id === base) ? `${base}-${Date.now().toString(36)}` : base || `role-${name}`;
}
