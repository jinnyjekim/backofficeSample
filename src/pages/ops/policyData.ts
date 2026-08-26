export type PolicyStatus = '임시저장' | '적용 예정' | '적용중' | '종료';
export type PolicyVisibility = '공개' | '내부용';

export interface PolicyVersion {
  id: string;
  version: string;
  status: PolicyStatus;
  effectiveFrom: string;
  effectiveTo: string | null;
  content: string;
  changeReason: string;
  createdBy: string;
  createdAt: string;
}

export interface PolicyHistory {
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface PolicyDefinition {
  id: string;
  name: string;
  code: string;
  type: string;
  visibility: PolicyVisibility;
  description: string;
  versions: PolicyVersion[];
  history: PolicyHistory[];
}

const policyContent = (name: string, details: string) => `1. 목적\n본 정책은 ${name}의 일관된 운영 기준을 정하는 것을 목적으로 합니다.\n\n2. 적용 범위\n서비스를 이용하는 고객과 관련 업무를 수행하는 운영자에게 적용합니다.\n\n3. 운영 기준\n${details}\n\n4. 예외 처리\n정책에 정하지 않은 사항은 담당 부서 검토와 승인 절차에 따라 처리합니다.`;

export const POLICIES: PolicyDefinition[] = [
  { id: 'POL-001', name: '회원 계정 운영 정책', code: 'POLICY_ACCOUNT', type: '서비스 운영', visibility: '공개', description: '계정 생성, 휴면, 이용 제한 및 탈퇴 처리 기준', versions: [
    { id: 'PV-001-3', version: 'v2.1', status: '적용중', effectiveFrom: '2026-08-01', effectiveTo: null, content: policyContent('회원 계정 운영 정책', '장기 미접속 계정 안내 및 이용 제한 해제 기준을 준수합니다.'), changeReason: '휴면 계정 안내 절차 개정', createdBy: 'admin01', createdAt: '2026-07-18 14:20' },
    { id: 'PV-001-2', version: 'v2.0', status: '종료', effectiveFrom: '2025-09-01', effectiveTo: '2026-07-31', content: policyContent('회원 계정 운영 정책', '계정 이용 제한과 탈퇴 기준을 준수합니다.'), changeReason: '이용 제한 기준 구체화', createdBy: 'admin02', createdAt: '2025-08-14 11:10' },
    { id: 'PV-001-1', version: 'v1.0', status: '종료', effectiveFrom: '2025-01-01', effectiveTo: '2025-08-31', content: policyContent('회원 계정 운영 정책', '최초 회원 운영 기준입니다.'), changeReason: '최초 등록', createdBy: 'admin01', createdAt: '2024-12-10 09:30' },
  ], history: [{ at: '2026-08-01 00:00', actor: 'SYSTEM', action: 'v2.1 적용 시작', detail: 'v2.0 자동 종료' }, { at: '2026-07-18 14:20', actor: 'admin01', action: 'v2.1 등록', detail: '휴면 계정 안내 절차 개정' }] },
  { id: 'POL-002', name: '커뮤니티 게시물 운영 기준', code: 'POLICY_COMMUNITY', type: '게시 운영', visibility: '공개', description: '게시물 노출, 신고, 숨김 및 삭제 처리 기준', versions: [
    { id: 'PV-002-2', version: 'v1.6', status: '적용 예정', effectiveFrom: '2026-09-01', effectiveTo: null, content: policyContent('커뮤니티 게시물 운영 기준', 'AI 생성 콘텐츠 표기와 반복 신고 검토 기준을 추가합니다.'), changeReason: 'AI 콘텐츠 및 신고 처리 기준 추가', createdBy: 'admin02', createdAt: '2026-08-24 10:20' },
    { id: 'PV-002-1', version: 'v1.5', status: '적용중', effectiveFrom: '2026-02-01', effectiveTo: '2026-08-31', content: policyContent('커뮤니티 게시물 운영 기준', '신고 접수 후 24시간 이내 1차 검토합니다.'), changeReason: '신고 처리시간 명시', createdBy: 'admin01', createdAt: '2026-01-15 13:20' },
  ], history: [{ at: '2026-08-24 10:20', actor: 'admin02', action: 'v1.6 등록', detail: '2026-09-01 공개 예약' }] },
  { id: 'POL-003', name: '고객 상담 처리 기준', code: 'POLICY_CS_HANDLING', type: '고객 응대', visibility: '내부용', description: '상담 우선순위, 담당자 배정 및 응답 목표시간 기준', versions: [
    { id: 'PV-003-2', version: 'v3.2', status: '적용중', effectiveFrom: '2026-06-10', effectiveTo: null, content: policyContent('고객 상담 처리 기준', '긴급 문의는 1시간, 일반 문의는 영업일 24시간 내 1차 응답합니다.'), changeReason: '긴급 문의 SLA 조정', createdBy: 'admin01', createdAt: '2026-05-28 16:10' },
    { id: 'PV-003-1', version: 'v3.1', status: '종료', effectiveFrom: '2025-06-10', effectiveTo: '2026-06-09', content: policyContent('고객 상담 처리 기준', '문의 유형에 따라 담당 조직을 배정합니다.'), changeReason: '담당 조직 개편', createdBy: 'admin02', createdAt: '2025-06-01 10:00' },
  ], history: [{ at: '2026-06-10 00:00', actor: 'SYSTEM', action: 'v3.2 적용 시작', detail: '이전 버전 자동 종료' }] },
  { id: 'POL-004', name: '콘텐츠 검수 운영 정책', code: 'POLICY_CONTENT_REVIEW', type: '콘텐츠 운영', visibility: '내부용', description: '콘텐츠 등록 전 검수 항목과 승인 권한 기준', versions: [{ id: 'PV-004-1', version: 'v2.4', status: '적용중', effectiveFrom: '2026-07-01', effectiveTo: null, content: policyContent('콘텐츠 검수 운영 정책', '저작권, 개인정보, 부적절 표현을 등록 전에 확인합니다.'), changeReason: '저작권 검수 항목 보강', createdBy: 'admin02', createdAt: '2026-06-17 09:10' }], history: [{ at: '2026-07-01 00:00', actor: 'SYSTEM', action: 'v2.4 적용 시작', detail: '내부 운영 문서 배포' }] },
  { id: 'POL-005', name: '운영 장애 대응 기준', code: 'POLICY_INCIDENT', type: '장애 대응', visibility: '내부용', description: '서비스 장애 등급과 보고 및 복구 커뮤니케이션 기준', versions: [{ id: 'PV-005-1', version: 'v1.0', status: '임시저장', effectiveFrom: '2026-10-01', effectiveTo: null, content: policyContent('운영 장애 대응 기준', '장애 등급에 따라 비상 연락망과 공지 절차를 가동합니다.'), changeReason: '유관 부서 검토 중', createdBy: 'admin01', createdAt: '2026-08-25 17:40' }], history: [{ at: '2026-08-25 17:40', actor: 'admin01', action: '임시저장', detail: '정보보호팀 검토 전' }] },
  { id: 'POL-006', name: '서비스 점검 안내 정책', code: 'POLICY_MAINTENANCE', type: '서비스 운영', visibility: '공개', description: '정기 및 긴급 점검의 사전 안내 기준', versions: [{ id: 'PV-006-1', version: 'v1.3', status: '적용 예정', effectiveFrom: '2026-09-15', effectiveTo: null, content: policyContent('서비스 점검 안내 정책', '정기 점검은 최소 7일 전에 안내합니다.'), changeReason: '사전 안내 기간 확대', createdBy: 'admin02', createdAt: '2026-08-20 11:30' }], history: [{ at: '2026-08-20 11:30', actor: 'admin02', action: 'v1.3 등록', detail: '2026-09-15 적용 예정' }] },
  { id: 'POL-007', name: '이전 파트너 운영 기준', code: 'POLICY_PARTNER_OLD', type: '파트너 운영', visibility: '내부용', description: '개편 전 파트너 등록과 관리 기준', versions: [{ id: 'PV-007-1', version: 'v1.8', status: '종료', effectiveFrom: '2025-01-01', effectiveTo: '2026-03-31', content: policyContent('이전 파트너 운영 기준', '개편 전 파트너 등록 기준입니다.'), changeReason: '파트너 운영 체계 개편', createdBy: 'admin01', createdAt: '2024-12-20 09:00' }], history: [{ at: '2026-03-31 23:59', actor: 'admin01', action: '적용 종료', detail: '신규 파트너 정책으로 대체' }] },
  { id: 'POL-008', name: '종료 프로모션 운영 기준', code: 'POLICY_PROMOTION_OLD', type: '프로모션 운영', visibility: '공개', description: '구 프로모션 검수와 노출 기준', versions: [{ id: 'PV-008-1', version: 'v1.0', status: '종료', effectiveFrom: '2025-11-01', effectiveTo: '2025-12-31', content: policyContent('종료 프로모션 운영 기준', '구 프로모션 운영 기준입니다.'), changeReason: '프로모션 체계 개편', createdBy: 'admin02', createdAt: '2025-10-20 14:00' }], history: [{ at: '2025-12-31 23:59', actor: 'SYSTEM', action: '적용 종료', detail: '설정된 종료일 도달' }] },
];

export function currentPolicyVersion(policy: PolicyDefinition) {
  return policy.versions.find((version) => version.status === '적용 예정') ?? policy.versions.find((version) => version.status === '적용중') ?? policy.versions[0];
}
