export type VerificationPurpose = '기본 회원' | '판매자 등록' | '고액 거래' | '재인증' | '계정 복구';
export type VerificationStatus = '접수' | '자동검증중' | '수동심사' | '보완요청' | '승인' | '실패' | '만료';
export type VerificationRisk = '정상' | '주의' | '높음' | '긴급';

export interface VerificationCheck {
  label: string;
  result: '일치' | '불일치' | '확인 필요' | '미제출';
  detail: string;
}

export interface VerificationCase {
  id: string;
  memberId: string;
  nickname: string;
  memberType: '구매자' | '판매자' | '공통';
  purpose: VerificationPurpose;
  methods: string[];
  status: VerificationStatus;
  risk: VerificationRisk;
  submittedAt: string;
  dueAt: string;
  verifiedAt: string;
  expiresAt: string;
  attempt: number;
  provider: string;
  providerTxnId: string;
  assignee: string;
  source: string;
  maskedName: string;
  maskedPhone: string;
  maskedBirth: string;
  failureCode: string;
  reason: string;
  documents: string[];
  checks: VerificationCheck[];
}

export interface VerificationPolicy {
  id: string;
  name: string;
  purpose: VerificationPurpose;
  requiredSteps: string[];
  provider: string;
  validity: string;
  retryLimit: string;
  manualReview: string;
  retention: string;
  status: '사용' | '검토 필요' | '중지';
  owner: string;
  updatedAt: string;
}

export interface VerificationAuditLog {
  id: string;
  occurredAt: string;
  verificationId: string;
  memberId: string;
  nickname: string;
  purpose: VerificationPurpose;
  action: string;
  before: string;
  after: string;
  actor: string;
  providerTxnId: string;
  result: '성공' | '실패' | '보류';
  reason: string;
}

const checks = (values:Array<[string,VerificationCheck['result'],string]>):VerificationCheck[] => values.map(([label,result,detail])=>({label,result,detail}));

export const VERIFICATION_CASES: VerificationCase[] = [
  { id:'KYC-260827-041',memberId:'SEL-11209',nickname:'준호의창고',memberType:'판매자',purpose:'재인증',methods:['휴대폰','신분증','얼굴'],status:'수동심사',risk:'높음',submittedAt:'2026-08-27 09:22',dueAt:'2026-08-27 15:00',verifiedAt:'2025-08-25',expiresAt:'2026-08-25',attempt:2,provider:'NICE 본인확인',providerTxnId:'NICE-26****1842',assignee:'admin05',source:'인증 유효기간 만료',maskedName:'이*호',maskedPhone:'010-****-4911',maskedBirth:'19**.**.14',failureCode:'FACE_MISMATCH',reason:'신분증 사진과 얼굴 촬영 유사도 71%로 수동 확인 필요',documents:['신분증 이미지 · 암호화 보관','얼굴 촬영 이미지 · 암호화 보관'],checks:checks([['휴대폰 명의','일치','가입자 명의 일치'],['신분증 진위','일치','발급기관 검증 완료'],['얼굴 유사도','확인 필요','유사도 71% · 기준 78%'],['제재 계정 중복','일치','중복 계정 없음']]) },
  { id:'KYC-260827-040',memberId:'SEL-12991',nickname:'수빈북스',memberType:'판매자',purpose:'판매자 등록',methods:['휴대폰','신분증','계좌'],status:'보완요청',risk:'주의',submittedAt:'2026-08-27 08:41',dueAt:'2026-08-28 12:00',verifiedAt:'-',expiresAt:'-',attempt:1,provider:'KCB + BankCheck',providerTxnId:'KCB-26****0931',assignee:'admin03',source:'판매자 전환 신청',maskedName:'박*빈',maskedPhone:'010-****-6624',maskedBirth:'19**.**.02',failureCode:'ACCOUNT_NAME_MISMATCH',reason:'본인확인은 성공했으나 출금계좌 예금주 표기가 상이함',documents:['신분증 이미지 · 암호화 보관','통장 사본 · 보완 필요'],checks:checks([['휴대폰 명의','일치','가입자 명의 일치'],['신분증 진위','일치','발급기관 검증 완료'],['출금계좌 예금주','불일치','띄어쓰기 포함 표기 상이'],['제재 계정 중복','일치','중복 계정 없음']]) },
  { id:'KYC-260827-039',memberId:'buyer_8841',nickname:'quickdeal88',memberType:'구매자',purpose:'고액 거래',methods:['휴대폰','얼굴'],status:'실패',risk:'긴급',submittedAt:'2026-08-27 08:05',dueAt:'2026-08-27 10:00',verifiedAt:'-',expiresAt:'-',attempt:3,provider:'PASS + FaceMatch',providerTxnId:'PASS-26****7810',assignee:'SYSTEM',source:'24시간 고액 거래 기준 초과',maskedName:'최*우',maskedPhone:'010-****-8841',maskedBirth:'19**.**.28',failureCode:'DUPLICATE_IDENTITY',reason:'동일 본인 정보로 연결된 제한 계정 2개 확인',documents:['얼굴 촬영 이미지 · 암호화 보관'],checks:checks([['휴대폰 명의','일치','가입자 명의 일치'],['얼굴 유사도','일치','유사도 92%'],['제재 계정 중복','불일치','제한 계정 2개 연관'],['기기 일치','확인 필요','서로 다른 기기 4대']]) },
  { id:'KYC-260827-037',memberId:'SEL-14002',nickname:'fastmarket',memberType:'판매자',purpose:'계정 복구',methods:['휴대폰','신분증','얼굴'],status:'수동심사',risk:'긴급',submittedAt:'2026-08-27 07:32',dueAt:'2026-08-27 12:00',verifiedAt:'-',expiresAt:'-',attempt:1,provider:'NICE + FaceMatch',providerTxnId:'NICE-26****1160',assignee:'admin05',source:'보안 잠금 계정 복구 요청',maskedName:'정*민',maskedPhone:'010-****-0204',maskedBirth:'19**.**.05',failureCode:'IDENTITY_CONFLICT',reason:'기존 인증 명의와 신규 제출 명의가 일치하지 않음',documents:['신분증 이미지 · 암호화 보관','얼굴 촬영 이미지 · 암호화 보관','계정 복구 진술서'],checks:checks([['휴대폰 명의','불일치','기존 인증 명의와 상이'],['신분증 진위','일치','발급기관 검증 완료'],['얼굴 유사도','확인 필요','기존 인증 이미지 비교 필요'],['보안 로그','확인 필요','해외 접속 이력 검토 필요']]) },
  { id:'KYC-260826-128',memberId:'SEL-10813',nickname:'campplus',memberType:'판매자',purpose:'판매자 등록',methods:['휴대폰','신분증','계좌'],status:'승인',risk:'정상',submittedAt:'2026-08-26 18:22',dueAt:'2026-08-27 18:00',verifiedAt:'2026-08-26 18:28',expiresAt:'2027-08-26',attempt:1,provider:'KCB + BankCheck',providerTxnId:'KCB-26****0822',assignee:'SYSTEM',source:'판매자 전환 신청',maskedName:'김*우',maskedPhone:'010-****-4128',maskedBirth:'19**.**.19',failureCode:'-',reason:'필수 인증 단계 자동 검증 통과',documents:['신분증 이미지 · 암호화 보관'],checks:checks([['휴대폰 명의','일치','가입자 명의 일치'],['신분증 진위','일치','발급기관 검증 완료'],['출금계좌 예금주','일치','예금주 일치'],['제재 계정 중복','일치','중복 계정 없음']]) },
  { id:'KYC-260826-122',memberId:'buyer_5512',nickname:'honestbuyer',memberType:'구매자',purpose:'기본 회원',methods:['휴대폰'],status:'승인',risk:'정상',submittedAt:'2026-08-26 16:10',dueAt:'2026-08-27 16:10',verifiedAt:'2026-08-26 16:11',expiresAt:'2027-08-26',attempt:1,provider:'PASS',providerTxnId:'PASS-26****6221',assignee:'SYSTEM',source:'회원 가입',maskedName:'한*수',maskedPhone:'010-****-5512',maskedBirth:'19**.**.11',failureCode:'-',reason:'휴대폰 명의 본인확인 성공',documents:[],checks:checks([['휴대폰 명의','일치','가입자 명의 일치'],['중복 가입','일치','정상 범위']]) },
  { id:'KYC-260826-119',memberId:'buyer_4301',nickname:'mountain7',memberType:'구매자',purpose:'재인증',methods:['휴대폰'],status:'자동검증중',risk:'주의',submittedAt:'2026-08-27 10:40',dueAt:'2026-08-27 14:00',verifiedAt:'2025-08-26',expiresAt:'2026-08-26',attempt:1,provider:'PASS',providerTxnId:'PASS-26****4301',assignee:'SYSTEM',source:'휴대폰 명의 변경 감지',maskedName:'오*훈',maskedPhone:'010-****-4301',maskedBirth:'19**.**.08',failureCode:'-',reason:'통신사 응답 대기 중',documents:[],checks:checks([['휴대폰 명의','확인 필요','통신사 검증 진행 중'],['기존 명의 비교','확인 필요','응답 후 비교 예정']]) },
  { id:'KYC-260826-112',memberId:'SEL-12438',nickname:'urbanpicker',memberType:'판매자',purpose:'판매자 등록',methods:['휴대폰','신분증','계좌'],status:'접수',risk:'주의',submittedAt:'2026-08-27 11:10',dueAt:'2026-08-28 11:10',verifiedAt:'-',expiresAt:'-',attempt:1,provider:'KCB + BankCheck',providerTxnId:'-',assignee:'미배정',source:'판매자 전환 신청',maskedName:'서*현',maskedPhone:'010-****-2438',maskedBirth:'19**.**.23',failureCode:'-',reason:'인증 자료 접수 · 자동 검증 대기',documents:['신분증 이미지 · 암호화 보관'],checks:checks([['휴대폰 명의','확인 필요','검증 대기'],['신분증 진위','확인 필요','검증 대기'],['출금계좌 예금주','확인 필요','검증 대기']]) },
];

export const VERIFICATION_POLICIES: VerificationPolicy[] = [
  { id:'KYP-001',name:'기본 회원 본인확인',purpose:'기본 회원',requiredSteps:['휴대폰 명의 확인'],provider:'PASS / KCB',validity:'1년',retryLimit:'일 5회',manualReview:'동일 명의 계정 3개 이상',retention:'탈퇴 후 6개월 분리 보관',status:'사용',owner:'회원 운영',updatedAt:'2026-08-18' },
  { id:'KYP-002',name:'C2C 판매자 인증',purpose:'판매자 등록',requiredSteps:['휴대폰 명의','신분증 진위','출금계좌 예금주'],provider:'KCB + BankCheck',validity:'1년',retryLimit:'일 3회',manualReview:'명의 불일치 또는 위조 의심',retention:'거래 종료 후 5년 암호화 보관',status:'사용',owner:'판매자 운영',updatedAt:'2026-08-25' },
  { id:'KYP-003',name:'고액 거래 추가 인증',purpose:'고액 거래',requiredSteps:['휴대폰 명의','얼굴 유사도','연관 계정'],provider:'PASS + FaceMatch',validity:'해당 거래',retryLimit:'거래당 3회',manualReview:'유사도 78% 미만 또는 연관 계정',retention:'거래 종료 후 5년',status:'사용',owner:'Fraud 운영',updatedAt:'2026-08-24' },
  { id:'KYP-004',name:'정기 재인증',purpose:'재인증',requiredSteps:['기존 인증 정보 비교','변경 항목 재검증'],provider:'기존 인증 사업자',validity:'1년 갱신',retryLimit:'7일 내 3회',manualReview:'명의·얼굴 정보 변경',retention:'이전 인증 버전 포함 5년',status:'검토 필요',owner:'Trust & Safety',updatedAt:'2026-08-27' },
  { id:'KYP-005',name:'보안 계정 복구',purpose:'계정 복구',requiredSteps:['휴대폰 명의','신분증 진위','얼굴 비교','보안 로그'],provider:'NICE + FaceMatch',validity:'복구 1회',retryLimit:'30일 내 2회',manualReview:'항상 2인 수동 심사',retention:'복구일로부터 5년',status:'사용',owner:'보안 운영',updatedAt:'2026-08-22' },
  { id:'KYP-006',name:'구형 판매자 간편 인증',purpose:'판매자 등록',requiredSteps:['휴대폰 명의'],provider:'PASS',validity:'-',retryLimit:'-',manualReview:'신규 정책으로 대체',retention:'기존 법정 기간',status:'중지',owner:'정책 관리',updatedAt:'2026-07-31' },
];

export const VERIFICATION_AUDIT_LOGS: VerificationAuditLog[] = [
  { id:'KLOG-260827-092',occurredAt:'2026-08-27 11:10',verificationId:'KYC-260826-112',memberId:'SEL-12438',nickname:'urbanpicker',purpose:'판매자 등록',action:'인증 접수',before:'-',after:'접수',actor:'SYSTEM',providerTxnId:'-',result:'성공',reason:'판매자 전환 인증 자료 접수' },
  { id:'KLOG-260827-089',occurredAt:'2026-08-27 10:42',verificationId:'KYC-260826-119',memberId:'buyer_4301',nickname:'mountain7',purpose:'재인증',action:'자동 검증 시작',before:'접수',after:'자동검증중',actor:'SYSTEM',providerTxnId:'PASS-26****4301',result:'보류',reason:'통신사 본인확인 응답 대기' },
  { id:'KLOG-260827-085',occurredAt:'2026-08-27 09:35',verificationId:'KYC-260827-041',memberId:'SEL-11209',nickname:'준호의창고',purpose:'재인증',action:'수동 심사 전환',before:'자동검증중',after:'수동심사',actor:'SYSTEM',providerTxnId:'NICE-26****1842',result:'보류',reason:'얼굴 유사도 71%로 기준 미달' },
  { id:'KLOG-260827-081',occurredAt:'2026-08-27 09:02',verificationId:'KYC-260827-040',memberId:'SEL-12991',nickname:'수빈북스',purpose:'판매자 등록',action:'보완 요청',before:'수동심사',after:'보완요청',actor:'admin03',providerTxnId:'KCB-26****0931',result:'보류',reason:'출금계좌 예금주 표기 확인 자료 요청' },
  { id:'KLOG-260827-078',occurredAt:'2026-08-27 08:18',verificationId:'KYC-260827-039',memberId:'buyer_8841',nickname:'quickdeal88',purpose:'고액 거래',action:'인증 실패',before:'자동검증중',after:'실패',actor:'SYSTEM',providerTxnId:'PASS-26****7810',result:'실패',reason:'동일 명의 제한 계정 2개 확인' },
  { id:'KLOG-260827-073',occurredAt:'2026-08-27 07:45',verificationId:'KYC-260827-037',memberId:'SEL-14002',nickname:'fastmarket',purpose:'계정 복구',action:'수동 심사 배정',before:'접수',after:'수동심사',actor:'admin05',providerTxnId:'NICE-26****1160',result:'보류',reason:'기존 인증 명의와 신규 제출 명의 불일치' },
  { id:'KLOG-260826-211',occurredAt:'2026-08-26 18:28',verificationId:'KYC-260826-128',memberId:'SEL-10813',nickname:'campplus',purpose:'판매자 등록',action:'인증 승인',before:'자동검증중',after:'승인',actor:'SYSTEM',providerTxnId:'KCB-26****0822',result:'성공',reason:'필수 인증 단계 전체 통과' },
  { id:'KLOG-260826-202',occurredAt:'2026-08-26 16:11',verificationId:'KYC-260826-122',memberId:'buyer_5512',nickname:'honestbuyer',purpose:'기본 회원',action:'인증 승인',before:'자동검증중',after:'승인',actor:'SYSTEM',providerTxnId:'PASS-26****6221',result:'성공',reason:'휴대폰 명의 본인확인 성공' },
];

export const VERIFICATION_STATUS_META:Record<VerificationStatus,{bg:string;fg:string}>={
  접수:{bg:'#fff7ed',fg:'#c2410c'}, 자동검증중:{bg:'#eff6ff',fg:'#1d4ed8'}, 수동심사:{bg:'#f5f3ff',fg:'#6d28d9'}, 보완요청:{bg:'#ecfeff',fg:'#0e7490'}, 승인:{bg:'#ecfdf5',fg:'#047857'}, 실패:{bg:'#fef2f2',fg:'#dc2626'}, 만료:{bg:'#f4f4f5',fg:'#52525b'},
};
export const VERIFICATION_RISK_META:Record<VerificationRisk,{bg:string;fg:string}>={
  정상:{bg:'#ecfdf5',fg:'#047857'}, 주의:{bg:'#fff7ed',fg:'#c2410c'}, 높음:{bg:'#fef2f2',fg:'#dc2626'}, 긴급:{bg:'#fee2e2',fg:'#991b1b'},
};
