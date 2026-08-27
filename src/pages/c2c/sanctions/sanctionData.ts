export type SanctionType = '경고' | '상품 등록 제한' | '판매 제한' | '구매 제한' | '채팅 제한' | '계정 정지';
export type SanctionStatus = '검토대기' | '승인대기' | '예약' | '적용중' | '해제검토' | '종료' | '철회';
export type SanctionSeverity = '낮음' | '보통' | '높음' | '긴급';
export type SanctionDuration = '1일' | '3일' | '7일' | '30일' | '영구' | '-';

export interface SanctionCase {
  id: string;
  memberId: string;
  nickname: string;
  memberRole: '판매자' | '구매자' | '공통';
  type: SanctionType;
  duration: SanctionDuration;
  violation: string;
  reason: string;
  source: string;
  sourceId: string;
  status: SanctionStatus;
  severity: SanctionSeverity;
  strike: number;
  startedAt: string;
  endedAt: string;
  assignee: string;
  approval: string;
  effect: string;
  evidence: string[];
  memo: string;
}

export interface SanctionPolicy {
  id: string;
  name: string;
  violation: string;
  firstAction: string;
  secondAction: string;
  repeatAction: string;
  approval: string;
  appealDays: number;
  automation: string;
  status: '사용' | '검토 필요' | '중지';
  owner: string;
  updatedAt: string;
}

export interface SanctionAuditLog {
  id: string;
  occurredAt: string;
  sanctionId: string;
  memberId: string;
  nickname: string;
  type: SanctionType;
  action: string;
  before: string;
  after: string;
  actor: string;
  source: string;
  reason: string;
}

export const SANCTION_CASES: SanctionCase[] = [
  { id:'SNC-260827-032',memberId:'SEL-12438',nickname:'urbanpicker',memberRole:'판매자',type:'채팅 제한',duration:'3일',violation:'외부 결제 유도',reason:'안전결제 취소 후 계좌이체를 반복 요구',source:'메시지 신고',sourceId:'RPT-260827-051',status:'검토대기',severity:'높음',strike:2,startedAt:'-',endedAt:'-',assignee:'미배정',approval:'담당자 승인',effect:'거래 채팅 발신 차단 · 기존 대화 조회 가능',evidence:['신고 메시지 원문','앞뒤 대화 10건'],memo:'동일 유형 재발 시 판매 제한 병행 검토' },
  { id:'SNC-260827-031',memberId:'SEL-13226',nickname:'태윤테크',memberRole:'판매자',type:'판매 제한',duration:'7일',violation:'반복 거래 취소',reason:'결제 이후 판매자 귀책 취소 3회 누적',source:'회원 신고',sourceId:'RPT-260827-049',status:'승인대기',severity:'높음',strike:3,startedAt:'2026-08-28 00:00',endedAt:'2026-09-03 23:59',assignee:'admin04',approval:'2인 승인',effect:'판매 상품 비노출 · 신규 등록 및 거래 차단',evidence:['취소 거래 3건','판매자 채팅 응답'],memo:'진행 중 거래 정리 후 적용 예정' },
  { id:'SNC-260827-030',memberId:'buyer_8841',nickname:'quickdeal88',memberRole:'구매자',type:'구매 제한',duration:'7일',violation:'반복 예약 취소',reason:'연관 계정으로 동일 상품을 반복 예약 후 취소',source:'거래 안전',sourceId:'RISK-260826-044',status:'적용중',severity:'높음',strike:2,startedAt:'2026-08-27 09:30',endedAt:'2026-09-02 23:59',assignee:'admin04',approval:'담당자 승인',effect:'상품 구매·예약·결제 차단',evidence:['연관 거래 4건','기기 식별 결과'],memo:'해제 전 연관 계정 재탐지 결과 확인' },
  { id:'SNC-260826-118',memberId:'SEL-11209',nickname:'retrobox',memberRole:'판매자',type:'상품 등록 제한',duration:'30일',violation:'위조품 의심 상품 반복 등록',reason:'동일 이미지와 설명으로 반려 상품 재등록',source:'상품 조치',sourceId:'MOD-260826-022',status:'적용중',severity:'긴급',strike:4,startedAt:'2026-08-26 18:10',endedAt:'2026-09-24 23:59',assignee:'admin03',approval:'2인 승인',effect:'신규 상품 등록 및 임시저장 상품 게시 차단',evidence:['중복 이미지 비교','반려 상품 3건','판매자 소명'],memo:'정품 매입 증빙 확인 시 조기 해제 가능' },
  { id:'SNC-260826-113',memberId:'SEL-10482',nickname:'dailyobject',memberRole:'판매자',type:'채팅 제한',duration:'1일',violation:'스팸 메시지',reason:'거래와 무관한 홍보 링크 반복 발송',source:'메시지 신고',sourceId:'RPT-260826-113',status:'종료',severity:'보통',strike:1,startedAt:'2026-08-26 20:02',endedAt:'2026-08-27 20:02',assignee:'admin01',approval:'자동 적용',effect:'거래 채팅 발신 차단',evidence:['신고 메시지 3건'],memo:'제한 기간 정상 종료' },
  { id:'SNC-260826-109',memberId:'buyer_5512',nickname:'honestbuyer',memberRole:'구매자',type:'경고',duration:'-',violation:'리뷰 비방 표현',reason:'거래 후기 내 모욕적 표현 확인',source:'리뷰 신고',sourceId:'RPT-260826-118',status:'적용중',severity:'낮음',strike:1,startedAt:'2026-08-27 08:50',endedAt:'-',assignee:'admin01',approval:'자동 적용',effect:'회원 경고 안내 · 기능 차단 없음',evidence:['리뷰 원문','수정 전 스냅샷'],memo:'동일 위반 재발 시 채팅·리뷰 작성 제한 검토' },
  { id:'SNC-260825-091',memberId:'SEL-11902',nickname:'lensman',memberRole:'판매자',type:'판매 제한',duration:'3일',violation:'상품 상태 허위 기재',reason:'분쟁 조정 결과 판매자 설명 의무 위반 확인',source:'분쟁 처리',sourceId:'DSP-260824-009',status:'해제검토',severity:'보통',strike:2,startedAt:'2026-08-25 12:00',endedAt:'2026-08-28 12:00',assignee:'admin02',approval:'담당자 승인',effect:'판매 상품 비노출 · 신규 거래 차단',evidence:['분쟁 판정서','수령 상품 사진'],memo:'소명 자료 제출 완료 · 조기 해제 검토' },
  { id:'SNC-260824-074',memberId:'SEL-14002',nickname:'fastmarket',memberRole:'공통',type:'계정 정지',duration:'영구',violation:'사기 거래 및 계정 도용',reason:'다수 피해 거래와 타인 명의 인증 사용 확인',source:'보안 조사',sourceId:'SEC-260824-011',status:'승인대기',severity:'긴급',strike:5,startedAt:'-',endedAt:'영구',assignee:'admin05',approval:'상위 관리자 승인',effect:'로그인·판매·구매·채팅 전체 차단',evidence:['피해 거래 6건','본인 인증 불일치','접속 보안 로그'],memo:'법무 검토 번호 LEG-260824-04 연계' },
  { id:'SNC-260829-004',memberId:'SEL-10813',nickname:'campplus',memberRole:'판매자',type:'판매 제한',duration:'7일',violation:'배송 지연 반복',reason:'송장 미등록과 발송 지연 기준 초과',source:'배송 모니터링',sourceId:'DLY-RISK-310',status:'예약',severity:'보통',strike:2,startedAt:'2026-08-29 00:00',endedAt:'2026-09-04 23:59',assignee:'admin03',approval:'담당자 승인',effect:'판매 상품 비노출 · 신규 거래 차단',evidence:['발송 지연 주문 5건'],memo:'8월 28일까지 소명 접수 시 예약 재검토' },
];

export const SANCTION_POLICIES: SanctionPolicy[] = [
  { id:'SP-001',name:'외부 결제 유도',violation:'채팅에서 계좌이체·외부 링크로 결제 유도',firstAction:'채팅 3일 제한',secondAction:'판매 7일 제한',repeatAction:'계정 30일 정지',approval:'2차부터 2인 승인',appealDays:7,automation:'금지 표현 탐지 후 검토 큐 생성',status:'사용',owner:'Trust & Safety',updatedAt:'2026-08-22' },
  { id:'SP-002',name:'반복 거래 취소',violation:'30일 내 판매자 귀책 취소율·건수 기준 초과',firstAction:'경고',secondAction:'판매 7일 제한',repeatAction:'판매 30일 제한',approval:'제한부터 담당자 승인',appealDays:7,automation:'위험 점수 70점 이상 자동 연계',status:'사용',owner:'거래 운영',updatedAt:'2026-08-19' },
  { id:'SP-003',name:'위조품·금지 상품',violation:'위조품 또는 거래 금지 품목 등록',firstAction:'상품 등록 30일 제한',secondAction:'판매 30일 제한',repeatAction:'계정 영구 정지',approval:'항상 2인 승인',appealDays:14,automation:'이미지·키워드 탐지 후 상품 임시 숨김',status:'사용',owner:'상품 정책',updatedAt:'2026-08-25' },
  { id:'SP-004',name:'스팸·비방 메시지',violation:'홍보 링크, 욕설, 개인정보 노출 메시지',firstAction:'경고 또는 채팅 1일',secondAction:'채팅 7일 제한',repeatAction:'계정 30일 정지',approval:'30일 정지만 2인 승인',appealDays:7,automation:'고위험 표현만 자동 차단',status:'검토 필요',owner:'CS 운영',updatedAt:'2026-08-27' },
  { id:'SP-005',name:'비정상 구매 활동',violation:'예약 선점, 반복 취소, 결제 수단 악용',firstAction:'구매 3일 제한',secondAction:'구매 30일 제한',repeatAction:'계정 영구 정지',approval:'영구 정지 상위 관리자 승인',appealDays:7,automation:'연관 계정 포함 위험 건 생성',status:'사용',owner:'Fraud 운영',updatedAt:'2026-08-21' },
  { id:'SP-006',name:'장기 미사용 제재 기준',violation:'과거 기준 마이그레이션용',firstAction:'경고',secondAction:'기간 제한',repeatAction:'운영자 판단',approval:'수동 검토',appealDays:7,automation:'없음',status:'중지',owner:'정책 관리',updatedAt:'2026-07-30' },
];

export const SANCTION_AUDIT_LOGS: SanctionAuditLog[] = [
  { id:'SLOG-260827-061',occurredAt:'2026-08-27 10:12',sanctionId:'SNC-260827-031',memberId:'SEL-13226',nickname:'태윤테크',type:'판매 제한',action:'승인 요청',before:'검토대기',after:'승인대기',actor:'admin04',source:'RPT-260827-049',reason:'반복 취소 신고 3건과 취소율 기준 초과 확인' },
  { id:'SLOG-260827-060',occurredAt:'2026-08-27 09:30',sanctionId:'SNC-260827-030',memberId:'buyer_8841',nickname:'quickdeal88',type:'구매 제한',action:'제재 적용',before:'검토대기',after:'적용중',actor:'admin04',source:'RISK-260826-044',reason:'연관 계정 반복 예약 취소 위험 점수 83점' },
  { id:'SLOG-260827-059',occurredAt:'2026-08-27 09:18',sanctionId:'SNC-260827-032',memberId:'SEL-12438',nickname:'urbanpicker',type:'채팅 제한',action:'검토 건 생성',before:'-',after:'검토대기',actor:'SYSTEM',source:'RPT-260827-051',reason:'외부 결제 유도 메시지 신고 연계' },
  { id:'SLOG-260827-056',occurredAt:'2026-08-27 08:50',sanctionId:'SNC-260826-109',memberId:'buyer_5512',nickname:'honestbuyer',type:'경고',action:'경고 적용',before:'검토대기',after:'적용중',actor:'admin01',source:'RPT-260826-118',reason:'거래 후기 내 모욕적 표현 확인' },
  { id:'SLOG-260826-048',occurredAt:'2026-08-26 20:02',sanctionId:'SNC-260826-113',memberId:'SEL-10482',nickname:'dailyobject',type:'채팅 제한',action:'제재 적용',before:'검토대기',after:'적용중',actor:'admin01',source:'RPT-260826-113',reason:'스팸 링크 반복 전송 확인' },
  { id:'SLOG-260826-047',occurredAt:'2026-08-26 18:10',sanctionId:'SNC-260826-118',memberId:'SEL-11209',nickname:'retrobox',type:'상품 등록 제한',action:'최종 승인',before:'승인대기',after:'적용중',actor:'admin03',source:'MOD-260826-022',reason:'정책 SP-003 반복 위반 기준 충족' },
  { id:'SLOG-260825-039',occurredAt:'2026-08-25 12:00',sanctionId:'SNC-260825-091',memberId:'SEL-11902',nickname:'lensman',type:'판매 제한',action:'제재 적용',before:'검토대기',after:'적용중',actor:'admin02',source:'DSP-260824-009',reason:'분쟁 조정 결과 판매자 설명 의무 위반' },
  { id:'SLOG-260827-063',occurredAt:'2026-08-27 11:05',sanctionId:'SNC-260825-091',memberId:'SEL-11902',nickname:'lensman',type:'판매 제한',action:'해제 검토 요청',before:'적용중',after:'해제검토',actor:'admin02',source:'APL-260827-015',reason:'판매자 소명 및 개선 확인 자료 접수' },
];

export const SANCTION_STATUS_META: Record<SanctionStatus,{bg:string;fg:string}> = {
  검토대기:{bg:'#fff7ed',fg:'#c2410c'}, 승인대기:{bg:'#f5f3ff',fg:'#6d28d9'}, 예약:{bg:'#eff6ff',fg:'#1d4ed8'}, 적용중:{bg:'#fef2f2',fg:'#dc2626'}, 해제검토:{bg:'#ecfeff',fg:'#0e7490'}, 종료:{bg:'#ecfdf5',fg:'#047857'}, 철회:{bg:'#f4f4f5',fg:'#52525b'},
};

export const SANCTION_TYPE_META: Record<SanctionType,{bg:string;fg:string}> = {
  경고:{bg:'#fff7ed',fg:'#c2410c'}, '상품 등록 제한':{bg:'#fef3c7',fg:'#92400e'}, '판매 제한':{bg:'#fef2f2',fg:'#dc2626'}, '구매 제한':{bg:'#eff6ff',fg:'#1d4ed8'}, '채팅 제한':{bg:'#f5f3ff',fg:'#6d28d9'}, '계정 정지':{bg:'#18181b',fg:'#ffffff'},
};

export const SANCTION_SEVERITY_META: Record<SanctionSeverity,{bg:string;fg:string}> = {
  낮음:{bg:'#f4f4f5',fg:'#52525b'}, 보통:{bg:'#eff6ff',fg:'#1d4ed8'}, 높음:{bg:'#fff7ed',fg:'#c2410c'}, 긴급:{bg:'#fee2e2',fg:'#991b1b'},
};
