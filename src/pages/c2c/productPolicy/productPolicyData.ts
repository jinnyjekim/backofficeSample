export type ProductPolicyLevel = '금지' | '제한' | '조건부 허용';
export type ProductPolicyStatus = '사용' | '검토 필요' | '중지';
export type DetectionRuleType = '키워드' | '이미지' | 'OCR' | '가격 이상' | '중복 등록' | '분류 모델';
export type DetectionAction = '등록 차단' | '임시 숨김' | '검토 큐 생성' | '위험 표시';
export type DetectionResult = '등록 차단' | '조치 연계' | '통과' | '오탐 해제';

export interface ProductPolicy {
  id: string;
  name: string;
  category: string;
  level: ProductPolicyLevel;
  criteria: string;
  examples: string[];
  exceptions: string;
  defaultAction: string;
  evidence: string;
  legalBasis: string;
  region: string;
  status: ProductPolicyStatus;
  owner: string;
  version: string;
  updatedAt: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  type: DetectionRuleType;
  policyId: string;
  target: string;
  signals: string[];
  threshold: string;
  action: DetectionAction;
  hits24h: number;
  reviewRate: number;
  falsePositiveRate: number;
  version: string;
  status: ProductPolicyStatus;
  owner: string;
  updatedAt: string;
}

export interface DetectionLog {
  id: string;
  detectedAt: string;
  ruleId: string;
  ruleName: string;
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerNickname: string;
  score: number;
  signals: string[];
  policyId: string;
  result: DetectionResult;
  actionId: string;
  actor: string;
  reason: string;
}

export const PRODUCT_POLICIES: ProductPolicy[] = [
  { id:'PP-001',name:'위조품·상표권 침해 상품',category:'지식재산권',level:'금지',criteria:'정품으로 오인시키는 위조품, 복제품 또는 상표권 침해 상품',examples:['가품 명품·스니커즈','복제 소프트웨어 키','위조 정품 인증서'],exceptions:'권리자가 허용한 공식 라이선스 상품',defaultAction:'등록 차단 · 노출 상품 즉시 숨김',evidence:'정품 구매 영수증·시리얼·공식 인증',legalBasis:'상표법 및 운영정책 3.1',region:'전체',status:'사용',owner:'상품 정책',version:'v3.4',updatedAt:'2026-08-25' },
  { id:'PP-002',name:'무기·위험 물품',category:'안전',level:'금지',criteria:'총포·도검·폭발물과 위해 가능성이 높은 개조 물품',examples:['실탄·화약','허가 없는 도검','무기 개조 부품'],exceptions:'법령상 거래 가능한 장식품은 별도 증빙 검토',defaultAction:'등록 차단 · 고위험 신고 생성',evidence:'허가증·제품 규격 자료',legalBasis:'총포화약법 및 운영정책 3.2',region:'대한민국',status:'사용',owner:'Trust & Safety',version:'v2.8',updatedAt:'2026-08-22' },
  { id:'PP-003',name:'의약품·의료기기',category:'규제 상품',level:'금지',criteria:'전문의약품, 처방약, 허가되지 않은 의료기기 개인 거래',examples:['처방 의약품','개봉 의약품','미허가 의료기기'],exceptions:'일반 공산품으로 분류된 건강관리 용품',defaultAction:'등록 차단 · 반복 판매자 제재 검토',evidence:'품목허가·공산품 분류 자료',legalBasis:'약사법·의료기기법',region:'대한민국',status:'사용',owner:'상품 정책',version:'v3.0',updatedAt:'2026-08-18' },
  { id:'PP-004',name:'주류·담배·성인 인증 상품',category:'연령 제한',level:'제한',criteria:'연령 확인 또는 판매 자격이 필요한 상품',examples:['주류','전자담배 액상','성인 인증 콘텐츠'],exceptions:'빈 병·수집용 패키지는 내용물 없음이 명확해야 함',defaultAction:'검토 큐 생성 · 자격 증빙 확인',evidence:'판매 자격·성인 인증·내용물 없음 증빙',legalBasis:'청소년보호법 및 운영정책 4.1',region:'대한민국',status:'검토 필요',owner:'상품 정책',version:'v2.5',updatedAt:'2026-08-27' },
  { id:'PP-005',name:'티켓·예약권',category:'권리 상품',level:'제한',criteria:'양도 제한, 웃돈 거래 또는 본인 확인이 필요한 티켓',examples:['공연 티켓','항공권','숙박 예약권'],exceptions:'공식 양도 기능이 있고 가격 기준을 준수한 상품',defaultAction:'가격·양도 조건 검토 후 노출',evidence:'구매 내역·공식 양도 가능 확인',legalBasis:'운영정책 4.3',region:'전체',status:'사용',owner:'거래 운영',version:'v1.9',updatedAt:'2026-08-20' },
  { id:'PP-006',name:'개봉 화장품·식품',category:'위생',level:'제한',criteria:'사용·개봉 여부와 유통기한에 따라 안전성이 달라지는 상품',examples:['개봉 화장품','소분 식품','보관 조건 미표시 식품'],exceptions:'밀봉 상태, 유통기한과 보관 조건이 명확한 상품',defaultAction:'필수 정보 누락 시 등록 보류',evidence:'밀봉 사진·유통기한·보관 방법',legalBasis:'식품위생법 및 운영정책 4.5',region:'대한민국',status:'사용',owner:'상품 정책',version:'v2.1',updatedAt:'2026-08-19' },
  { id:'PP-007',name:'고가 브랜드 중고품',category:'브랜드 상품',level:'조건부 허용',criteria:'위조 위험이 높은 브랜드·가격 구간의 중고 상품',examples:['명품 가방','고가 시계','한정판 스니커즈'],exceptions:'정품 증빙과 실물 검수 기준을 충족한 상품',defaultAction:'정품 증빙 제출 후 노출',evidence:'영수증·시리얼·검수 결과',legalBasis:'운영정책 5.2',region:'전체',status:'사용',owner:'브랜드 검수',version:'v1.7',updatedAt:'2026-08-24' },
  { id:'PP-008',name:'구형 디지털 코드 정책',category:'디지털 상품',level:'제한',criteria:'과거 디지털 코드 수동 검수 기준',examples:['게임 코드','기프트 카드'],exceptions:'신규 정책 PP-010으로 대체',defaultAction:'수동 검수',evidence:'구매 영수증',legalBasis:'구형 운영정책',region:'전체',status:'중지',owner:'정책 관리',version:'v1.2',updatedAt:'2026-07-31' },
];

export const DETECTION_RULES: DetectionRule[] = [
  { id:'DR-101',name:'가품 의심 표현·가격 조합',type:'분류 모델',policyId:'PP-001',target:'상품명·설명·가격',signals:['정품급·미러급 표현','브랜드 기준가 대비 75% 이상 저가','정품 증빙 누락'],threshold:'위험 점수 82점',action:'임시 숨김',hits24h:42,reviewRate:31.0,falsePositiveRate:4.8,version:'model-4.2',status:'사용',owner:'Trust ML',updatedAt:'2026-08-25' },
  { id:'DR-102',name:'금지 물품 키워드 사전',type:'키워드',policyId:'PP-002',target:'상품명·설명·태그',signals:['금지어 정확 일치','우회 표기 정규화','카테고리 교차 검증'],threshold:'고위험 1개 또는 일반 2개',action:'등록 차단',hits24h:18,reviewRate:100,falsePositiveRate:1.2,version:'dict-38',status:'사용',owner:'상품 정책',updatedAt:'2026-08-22' },
  { id:'DR-103',name:'신분증·의약품 OCR',type:'OCR',policyId:'PP-003',target:'상품 이미지',signals:['처방전 문구','의약품 성분·용량','신분증 번호 패턴'],threshold:'OCR 신뢰도 88%',action:'등록 차단',hits24h:11,reviewRate:100,falsePositiveRate:3.1,version:'ocr-2.8',status:'사용',owner:'Vision ML',updatedAt:'2026-08-21' },
  { id:'DR-104',name:'중복 이미지 재등록',type:'중복 등록',policyId:'PP-001',target:'상품 대표·상세 이미지',signals:['반려 상품 이미지 해시','다계정 동일 이미지','크롭·반전 유사 이미지'],threshold:'유사도 94%',action:'검토 큐 생성',hits24h:27,reviewRate:74.1,falsePositiveRate:6.7,version:'hash-5.1',status:'사용',owner:'Trust ML',updatedAt:'2026-08-24' },
  { id:'DR-105',name:'브랜드 상품 가격 이상',type:'가격 이상',policyId:'PP-007',target:'카테고리·브랜드·판매가',signals:['최근 중고 시세 하위 5%','신규 판매자','정품 증빙 없음'],threshold:'복합 위험 점수 70점',action:'위험 표시',hits24h:63,reviewRate:18.6,falsePositiveRate:9.4,version:'price-3.6',status:'검토 필요',owner:'Fraud Data',updatedAt:'2026-08-27' },
  { id:'DR-106',name:'티켓 웃돈 거래 탐지',type:'분류 모델',policyId:'PP-005',target:'상품명·가격·공연 정보',signals:['정가 대비 초과율','좌석 등급','양도 금지 표현'],threshold:'정가 대비 20% 초과',action:'검토 큐 생성',hits24h:9,reviewRate:88.9,falsePositiveRate:2.4,version:'ticket-1.9',status:'사용',owner:'거래 운영',updatedAt:'2026-08-20' },
  { id:'DR-107',name:'구형 이미지 단순 일치',type:'이미지',policyId:'PP-008',target:'대표 이미지',signals:['과거 해시 정확 일치'],threshold:'100%',action:'위험 표시',hits24h:0,reviewRate:0,falsePositiveRate:18.2,version:'hash-1.0',status:'중지',owner:'정책 관리',updatedAt:'2026-07-31' },
];

export const DETECTION_LOGS: DetectionLog[] = [
  { id:'DET-260827-2241',detectedAt:'2026-08-27 11:28',ruleId:'DR-101',ruleName:'가품 의심 표현·가격 조합',productId:'C2C-P-1009',productTitle:'한정판 캐릭터 피규어 세트',sellerId:'SEL-11209',sellerNickname:'준호의창고',score:94,signals:['정품급 표현','시세 대비 81% 저가','증빙 누락'],policyId:'PP-001',result:'조치 연계',actionId:'MOD-2608-0201',actor:'SYSTEM',reason:'고위험 기준 충족 · 상품 임시 숨김 및 소명 요청' },
  { id:'DET-260827-2238',detectedAt:'2026-08-27 11:02',ruleId:'DR-104',ruleName:'중복 이미지 재등록',productId:'C2C-P-1010',productTitle:'프리미엄 브랜드 지갑',sellerId:'SEL-12438',sellerNickname:'urbanpicker',score:97,signals:['반려 상품 이미지 유사도 97%','다른 계정 이미지 재사용'],policyId:'PP-001',result:'조치 연계',actionId:'MOD-2608-0202',actor:'SYSTEM',reason:'검토 큐 생성 · 상품 노출 유지 중' },
  { id:'DET-260827-2234',detectedAt:'2026-08-27 10:44',ruleId:'DR-102',ruleName:'금지 물품 키워드 사전',productId:'C2C-P-1044',productTitle:'수집용 장식 나이프',sellerId:'SEL-14002',sellerNickname:'fastmarket',score:89,signals:['도검 키워드','날 길이 기준 미기재'],policyId:'PP-002',result:'등록 차단',actionId:'BLOCK-260827-031',actor:'SYSTEM',reason:'금지 가능성이 높은 위험 물품으로 등록 차단' },
  { id:'DET-260827-2227',detectedAt:'2026-08-27 09:58',ruleId:'DR-105',ruleName:'브랜드 상품 가격 이상',productId:'C2C-P-1038',productTitle:'빈티지 브랜드 숄더백',sellerId:'SEL-10813',sellerNickname:'campplus',score:76,signals:['시세 하위 4%','정품 영수증 미첨부'],policyId:'PP-007',result:'통과',actionId:'-',actor:'admin03',reason:'추가 사진과 시리얼 확인 후 정상 상품으로 판단' },
  { id:'DET-260827-2219',detectedAt:'2026-08-27 09:15',ruleId:'DR-103',ruleName:'신분증·의약품 OCR',productId:'C2C-P-1031',productTitle:'건강관리 보조 기기',sellerId:'SEL-12991',sellerNickname:'수빈북스',score:91,signals:['의료기기 모델명 OCR','품목 허가번호 미기재'],policyId:'PP-003',result:'조치 연계',actionId:'MOD-2608-0204',actor:'SYSTEM',reason:'허가 여부 확인을 위해 상품 임시 숨김' },
  { id:'DET-260826-2184',detectedAt:'2026-08-26 19:40',ruleId:'DR-104',ruleName:'중복 이미지 재등록',productId:'C2C-P-1010',productTitle:'프리미엄 브랜드 지갑',sellerId:'SEL-12438',sellerNickname:'urbanpicker',score:95,signals:['동일 이미지 해시'],policyId:'PP-001',result:'오탐 해제',actionId:'MOD-2608-0203',actor:'admin02',reason:'판매자가 직접 촬영한 연속 사진 원본 확인' },
  { id:'DET-260826-2168',detectedAt:'2026-08-26 17:21',ruleId:'DR-106',ruleName:'티켓 웃돈 거래 탐지',productId:'C2C-P-1025',productTitle:'공연 티켓 2매',sellerId:'SEL-10482',sellerNickname:'dailyobject',score:84,signals:['정가 대비 28% 초과'],policyId:'PP-005',result:'등록 차단',actionId:'BLOCK-260826-018',actor:'SYSTEM',reason:'재판매 가격 상한 기준 초과' },
];

export const PRODUCT_POLICY_LEVEL_META:Record<ProductPolicyLevel,{bg:string;fg:string}>={금지:{bg:'#fef2f2',fg:'#dc2626'},제한:{bg:'#fff7ed',fg:'#c2410c'},'조건부 허용':{bg:'#eff6ff',fg:'#1d4ed8'}};
export const PRODUCT_POLICY_STATUS_META:Record<ProductPolicyStatus,{bg:string;fg:string}>={사용:{bg:'#ecfdf5',fg:'#047857'},'검토 필요':{bg:'#fff7ed',fg:'#c2410c'},중지:{bg:'#f4f4f5',fg:'#52525b'}};
export const DETECTION_RESULT_META:Record<DetectionResult,{bg:string;fg:string}>={'등록 차단':{bg:'#fef2f2',fg:'#dc2626'},'조치 연계':{bg:'#fff7ed',fg:'#c2410c'},통과:{bg:'#ecfdf5',fg:'#047857'},'오탐 해제':{bg:'#eff6ff',fg:'#1d4ed8'}};
