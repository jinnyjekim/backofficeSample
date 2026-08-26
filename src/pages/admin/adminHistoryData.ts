export const TODAY = '2026-08-26';

export type LoginResult = '성공' | '실패';
export type ActionResult = '성공' | '실패';
export type ActionType = '등록' | '수정' | '삭제' | '상태 변경' | '권한 변경' | '다운로드';

export const ACTION_TYPES: ActionType[] = ['등록', '수정', '삭제', '상태 변경', '권한 변경', '다운로드'];

export const MENUS = ['회원 관리', '콘텐츠 관리', '정산 관리', '상품 관리', '주문 관리', '프로모션 관리', '쿠폰 관리', '브랜드 관리', '리뷰 관리', '관리자 관리'] as const;

export interface LoginLogEntry {
  id: string;
  adminId: string;
  at: string;
  result: LoginResult;
  failReason: string | null;
  ip: string;
  device: string;
  logoutAt: string | null;
}

export interface ChangeField {
  field: string;
  before: string;
  after: string;
}

export interface ActionLogEntry {
  id: string;
  adminId: string;
  at: string;
  menu: (typeof MENUS)[number];
  menuPath: string;
  actionType: ActionType;
  targetType: string;
  targetId: string;
  result: ActionResult;
  failReason: string | null;
  errorCode: string | null;
  reason: string | null;
  changes: ChangeField[];
  ip: string;
}

export const LOGIN_LOGS: LoginLogEntry[] = [
  { id: 'LG-20260826-001', adminId: 'admin001', at: '2026-08-26 09:32:14', result: '성공', failReason: null, ip: '121.134.22.10', device: 'Windows 11 / Chrome', logoutAt: '2026-08-26 18:02:11' },
  { id: 'LG-20260826-002', adminId: 'admin005', at: '2026-08-26 08:02:33', result: '성공', failReason: null, ip: '121.134.22.15', device: 'macOS / Safari', logoutAt: null },
  { id: 'LG-20260825-001', adminId: 'admin002', at: '2026-08-25 17:20:05', result: '성공', failReason: null, ip: '121.134.22.41', device: 'Windows 11 / Edge', logoutAt: '2026-08-25 19:00:00' },
  { id: 'LG-20260822-001', adminId: 'admin009', at: '2026-08-22 19:44:02', result: '성공', failReason: null, ip: '121.134.22.63', device: 'Windows 10 / Chrome', logoutAt: '2026-08-22 21:10:00' },
  { id: 'LG-20260820-002', adminId: 'admin003', at: '2026-08-20 11:05:40', result: '실패', failReason: '비밀번호 불일치', ip: '58.229.10.77', device: 'Windows 11 / Chrome', logoutAt: null },
  { id: 'LG-20260820-003', adminId: 'admin003', at: '2026-08-20 11:05:58', result: '실패', failReason: '비밀번호 불일치', ip: '58.229.10.77', device: 'Windows 11 / Chrome', logoutAt: null },
  { id: 'LG-20260820-004', adminId: 'admin003', at: '2026-08-20 11:06:20', result: '실패', failReason: '비밀번호 불일치', ip: '58.229.10.77', device: 'Windows 11 / Chrome', logoutAt: null },
  { id: 'LG-20260819-001', adminId: 'admin008', at: '2026-08-19 10:15:22', result: '성공', failReason: null, ip: '121.134.22.77', device: 'Windows 11 / Chrome', logoutAt: '2026-08-19 12:40:00' },
  { id: 'LG-20260818-001', adminId: 'admin010', at: '2026-08-18 09:10:11', result: '성공', failReason: null, ip: '58.229.10.55', device: 'macOS / Chrome', logoutAt: '2026-08-18 17:55:00' },
  { id: 'LG-20260824-001', adminId: 'admin004', at: '2026-08-24 08:41:07', result: '성공', failReason: null, ip: '121.134.22.90', device: 'Windows 11 / Edge', logoutAt: '2026-08-24 17:30:00' },
];

export const ACTION_LOGS: ActionLogEntry[] = [
  {
    id: 'AL-20260826-001', adminId: 'admin002', at: '2026-08-26 14:12:42', menu: '회원 관리', menuPath: '회원 관리 > 회원 상세',
    actionType: '상태 변경', targetType: '회원', targetId: 'user08', result: '성공', failReason: null, errorCode: null,
    reason: '운영 정책 위반', changes: [{ field: '상태', before: '정상', after: '이용 정지' }], ip: '121.134.22.41',
  },
  {
    id: 'AL-20260826-002', adminId: 'admin001', at: '2026-08-26 13:58:20', menu: '관리자 관리', menuPath: '관리자 관리 > 역할 및 권한 관리',
    actionType: '권한 변경', targetType: '역할', targetId: 'role-content', result: '성공', failReason: null, errorCode: null,
    reason: null, changes: [{ field: '콘텐츠 관리 > 삭제', before: '허용', after: '미허용' }], ip: '121.134.22.10',
  },
  {
    id: 'AL-20260825-001', adminId: 'admin005', at: '2026-08-25 16:40:05', menu: '콘텐츠 관리', menuPath: '콘텐츠 관리 > 콘텐츠 목록',
    actionType: '수정', targetType: '콘텐츠', targetId: 'CT-00123', result: '성공', failReason: null, errorCode: null,
    reason: null, changes: [{ field: '노출 상태', before: '비노출', after: '노출' }, { field: '제목', before: '여름 신상 프로모션', after: '2026 여름 신상 프로모션' }], ip: '121.134.22.15',
  },
  {
    id: 'AL-20260825-002', adminId: 'admin004', at: '2026-08-25 11:22:51', menu: '정산 관리', menuPath: '정산 관리 > 정산 목록',
    actionType: '상태 변경', targetType: '정산', targetId: 'SET-20260825-011', result: '성공', failReason: null, errorCode: null,
    reason: null, changes: [{ field: '정산 상태', before: '정산 대기', after: '정산 완료' }], ip: '121.134.22.90',
  },
  {
    id: 'AL-20260824-001', adminId: 'admin001', at: '2026-08-24 15:02:10', menu: '관리자 관리', menuPath: '관리자 관리 > 관리자 목록',
    actionType: '등록', targetType: '관리자', targetId: 'admin007', result: '성공', failReason: null, errorCode: null,
    reason: null, changes: [], ip: '121.134.22.10',
  },
  {
    id: 'AL-20260823-001', adminId: 'admin009', at: '2026-08-23 10:14:37', menu: '프로모션 관리', menuPath: '프로모션 관리 > 프로모션 목록',
    actionType: '수정', targetType: '프로모션', targetId: 'PROMO-0032', result: '성공', failReason: null, errorCode: null,
    reason: null, changes: [{ field: '할인율', before: '10%', after: '15%' }], ip: '121.134.22.63',
  },
  {
    id: 'AL-20260822-001', adminId: 'admin009', at: '2026-08-22 09:30:00', menu: '쿠폰 관리', menuPath: '쿠폰 관리 > 쿠폰 발급 관리',
    actionType: '삭제', targetType: '쿠폰 발급', targetId: 'CI-20260822-00305', result: '실패', errorCode: 'PERMISSION_DENIED',
    failReason: '권한 부족', reason: null, changes: [], ip: '121.134.22.63',
  },
  {
    id: 'AL-20260821-001', adminId: 'admin010', at: '2026-08-21 14:05:19', menu: '브랜드 관리', menuPath: '브랜드 관리',
    actionType: '수정', targetType: '브랜드', targetId: 'BR-00004', result: '성공', failReason: null, errorCode: null,
    reason: null, changes: [{ field: '노출 순서', before: '4', after: '2' }], ip: '58.229.10.55',
  },
  {
    id: 'AL-20260820-001', adminId: 'admin005', at: '2026-08-20 17:44:02', menu: '리뷰 관리', menuPath: '리뷰 관리',
    actionType: '상태 변경', targetType: '리뷰', targetId: 'RV-20260812-00183', result: '성공', failReason: null, errorCode: null,
    reason: '신고 누적', changes: [{ field: '노출 상태', before: '노출', after: '비노출' }], ip: '121.134.22.15',
  },
  {
    id: 'AL-20260819-002', adminId: 'admin004', at: '2026-08-19 11:20:44', menu: '정산 관리', menuPath: '정산 관리 > 조정 내역',
    actionType: '등록', targetType: '정산 조정', targetId: 'ADJ-20260819-004', result: '성공', failReason: null, errorCode: null,
    reason: '반품에 따른 정산 금액 조정', changes: [], ip: '121.134.22.90',
  },
  {
    id: 'AL-20260818-002', adminId: 'admin010', at: '2026-08-18 15:33:09', menu: '콘텐츠 관리', menuPath: '콘텐츠 관리 > 콘텐츠 목록',
    actionType: '다운로드', targetType: '콘텐츠', targetId: '(목록 전체)', result: '성공', failReason: null, errorCode: null,
    reason: null, changes: [], ip: '58.229.10.55',
  },
  {
    id: 'AL-20260817-001', adminId: 'admin002', at: '2026-08-17 10:02:55', menu: '회원 관리', menuPath: '회원 관리 > 제재 회원',
    actionType: '상태 변경', targetType: '회원', targetId: 'user04', result: '성공', failReason: null, errorCode: null,
    reason: '어뷰징 의심', changes: [{ field: '상태', before: '정상', after: '제재' }], ip: '121.134.22.41',
  },
  {
    id: 'AL-20260816-001', adminId: 'admin001', at: '2026-08-16 09:18:30', menu: '관리자 관리', menuPath: '관리자 관리 > 역할 및 권한 관리',
    actionType: '삭제', targetType: '역할', targetId: 'role-custom-1', result: '실패', errorCode: 'ROLE_IN_USE',
    failReason: '배정된 관리자가 있어 삭제할 수 없음', reason: null, changes: [], ip: '121.134.22.10',
  },
  {
    id: 'AL-20260815-001', adminId: 'admin008', at: '2026-08-15 13:47:12', menu: '정산 관리', menuPath: '정산 관리 > 정산 거래 내역',
    actionType: '다운로드', targetType: '정산 거래', targetId: '(기간: 2026.08.01~2026.08.15)', result: '성공', failReason: null, errorCode: null,
    reason: null, changes: [], ip: '121.134.22.77',
  },
];
