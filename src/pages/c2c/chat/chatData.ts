export type ChatStatus = '거래중' | '거래완료' | '분쟁중' | '종료';
export type ChatRisk = '정상' | '주의' | '높음' | '긴급';
export type MessageStatus = '정상' | '탐지' | '제한' | '삭제';

export interface ChatMessage {
  id: string;
  sentAt: string;
  senderId: string;
  senderLabel: '구매자' | '판매자' | 'SYSTEM';
  content: string;
  status: MessageStatus;
  detection: string;
}

export interface ChatRoom {
  id: string;
  tradeId: string;
  productTitle: string;
  buyerId: string;
  buyerNickname: string;
  sellerId: string;
  sellerNickname: string;
  status: ChatStatus;
  risk: ChatRisk;
  messageCount: number;
  reportedCount: number;
  restrictedCount: number;
  lastAt: string;
  lastPreview: string;
  retentionUntil: string;
  disputeId: string;
  messages: ChatMessage[];
}

export interface MessagePolicy {
  id: string;
  name: string;
  category: string;
  patterns: string[];
  detection: string;
  action: '표시' | '마스킹' | '발송 차단' | '신고 큐 생성';
  severity: ChatRisk;
  exceptions: string;
  status: '사용' | '검토 필요' | '중지';
  owner: string;
  updatedAt: string;
}

export interface ChatAccessLog {
  id: string;
  accessedAt: string;
  adminId: string;
  roomId: string;
  tradeId: string;
  reason: string;
  ticketId: string;
  scope: string;
  result: '허용' | '거부' | '만료';
  ip: string;
  duration: string;
  exported: boolean;
}

const msg = (id:string,sentAt:string,senderId:string,senderLabel:ChatMessage['senderLabel'],content:string,status:MessageStatus='정상',detection='-'):ChatMessage => ({id,sentAt,senderId,senderLabel,content,status,detection});

export const CHAT_ROOMS: ChatRoom[] = [
  { id:'CHAT-260827-1042',tradeId:'TRD-202608-8108',productTitle:'소니 WH-1000XM5 헤드폰',buyerId:'buyer_9012',buyerNickname:'musicday',sellerId:'SEL-12438',sellerNickname:'urbanpicker',status:'거래중',risk:'긴급',messageCount:28,reportedCount:1,restrictedCount:1,lastAt:'2026-08-27 11:42',lastPreview:'안전결제 말고 계좌로 보내주시면…',retentionUntil:'2031-08-27',disputeId:'-',messages:[msg('MSG-882101','2026-08-27 11:32','buyer_9012','구매자','오늘 바로 발송 가능할까요?'),msg('MSG-882102','2026-08-27 11:35','SEL-12438','판매자','네, 오후 3시 전에 접수 가능합니다.'),msg('MSG-882104','2026-08-27 11:40','SEL-12438','판매자','안전결제 말고 계좌로 보내주시면 조금 할인해 드릴게요.','탐지','외부 결제 유도'),msg('MSG-882105','2026-08-27 11:42','buyer_9012','구매자','안전결제로만 거래하겠습니다.')] },
  { id:'CHAT-260827-1038',tradeId:'TRD-202608-8107',productTitle:'시그마 28-70mm F2.8 렌즈',buyerId:'lensman',buyerNickname:'lensman',sellerId:'SEL-11902',sellerNickname:'focusmarket',status:'분쟁중',risk:'높음',messageCount:46,reportedCount:1,restrictedCount:0,lastAt:'2026-08-27 10:18',lastPreview:'사진에 없던 흠집이 보여요.',retentionUntil:'2031-08-27',disputeId:'DSP-260827-014',messages:[msg('MSG-882071','2026-08-27 09:55','lensman','구매자','방금 수령했습니다.'),msg('MSG-882074','2026-08-27 10:02','lensman','구매자','사진에 없던 흠집이 보여요.'),msg('MSG-882078','2026-08-27 10:08','SEL-11902','판매자','출고 전에 확인했을 때는 없었습니다.'),msg('MSG-882081','2026-08-27 10:18','SYSTEM','SYSTEM','분쟁이 접수되어 거래가 보류되었습니다.')] },
  { id:'CHAT-260827-1031',tradeId:'TRD-202608-8104',productTitle:'캠핑 테이블 세트',buyerId:'buyer_3021',buyerNickname:'camping22',sellerId:'SEL-10482',sellerNickname:'dailyobject',status:'거래완료',risk:'주의',messageCount:19,reportedCount:2,restrictedCount:2,lastAt:'2026-08-27 09:41',lastPreview:'[제한된 메시지입니다]',retentionUntil:'2031-08-27',disputeId:'-',messages:[msg('MSG-881951','2026-08-26 19:25','buyer_3021','구매자','상품 잘 받았습니다.'),msg('MSG-881955','2026-08-26 19:30','SEL-10482','판매자','공동구매 링크도 확인해 보세요. h***://promo.example','제한','스팸 URL'),msg('MSG-881956','2026-08-26 19:31','SEL-10482','판매자','다른 상품도 최저가로 판매합니다.','제한','반복 홍보'),msg('MSG-881960','2026-08-27 09:41','SYSTEM','SYSTEM','운영 정책 위반 메시지가 제한되었습니다.')] },
  { id:'CHAT-260826-0994',tradeId:'TRD-202608-8096',productTitle:'닌텐도 스위치 OLED',buyerId:'buyer_5512',buyerNickname:'honestbuyer',sellerId:'SEL-10813',sellerNickname:'campplus',status:'거래중',risk:'정상',messageCount:12,reportedCount:0,restrictedCount:0,lastAt:'2026-08-26 22:10',lastPreview:'내일 오전에 발송하겠습니다.',retentionUntil:'2031-08-26',disputeId:'-',messages:[msg('MSG-881700','2026-08-26 21:50','buyer_5512','구매자','구성품 모두 포함인가요?'),msg('MSG-881704','2026-08-26 21:55','SEL-10813','판매자','박스와 기본 구성품 모두 포함입니다.'),msg('MSG-881712','2026-08-26 22:10','SEL-10813','판매자','내일 오전에 발송하겠습니다.')] },
  { id:'CHAT-260826-0971',tradeId:'TRD-202608-8088',productTitle:'아크테릭스 베타 LT 재킷',buyerId:'buyer_4301',buyerNickname:'mountain7',sellerId:'SEL-11209',sellerNickname:'retrobox',status:'종료',risk:'높음',messageCount:34,reportedCount:1,restrictedCount:1,lastAt:'2026-08-26 18:44',lastPreview:'개인 연락처는 010-****-1284입니다.',retentionUntil:'2031-08-26',disputeId:'-',messages:[msg('MSG-881501','2026-08-26 18:31','buyer_4301','구매자','정품 구매 영수증이 있나요?'),msg('MSG-881504','2026-08-26 18:35','SEL-11209','판매자','개인 연락처는 010-****-1284입니다.','탐지','개인정보·외부 연락 유도'),msg('MSG-881510','2026-08-26 18:44','SYSTEM','SYSTEM','안전한 거래를 위해 플랫폼 채팅을 이용해 주세요.')] },
  { id:'CHAT-260826-0950',tradeId:'TRD-202608-8075',productTitle:'한정판 캐릭터 피규어 세트',buyerId:'buyer_3182',buyerNickname:'figure82',sellerId:'SEL-11209',sellerNickname:'retrobox',status:'거래중',risk:'주의',messageCount:22,reportedCount:0,restrictedCount:0,lastAt:'2026-08-26 16:22',lastPreview:'정품 인증 사진을 추가했습니다.',retentionUntil:'2031-08-26',disputeId:'-',messages:[msg('MSG-881401','2026-08-26 15:58','buyer_3182','구매자','정품 인증 사진을 볼 수 있을까요?'),msg('MSG-881408','2026-08-26 16:22','SEL-11209','판매자','정품 인증 사진을 추가했습니다.')] },
];

export const MESSAGE_POLICIES: MessagePolicy[] = [
  { id:'CMP-001',name:'외부 결제 유도',category:'거래 안전',patterns:['계좌 이체 요청','외부 결제 링크','수수료 회피 표현'],detection:'문맥 모델 + 금지 표현',action:'신고 큐 생성',severity:'긴급',exceptions:'공식 환불 계좌 안내',status:'사용',owner:'Trust & Safety',updatedAt:'2026-08-25' },
  { id:'CMP-002',name:'개인 연락처 노출',category:'개인정보',patterns:['휴대전화 번호','메신저 ID','이메일 주소'],detection:'개인정보 패턴 탐지',action:'마스킹',severity:'높음',exceptions:'배송 기사 안심번호',status:'사용',owner:'개인정보보호',updatedAt:'2026-08-23' },
  { id:'CMP-003',name:'스팸·홍보 URL',category:'스팸',patterns:['단축 URL','반복 홍보 문구','거래 무관 도메인'],detection:'URL 평판 + 반복도',action:'발송 차단',severity:'높음',exceptions:'공식 택배사 조회 URL',status:'사용',owner:'CS 운영',updatedAt:'2026-08-24' },
  { id:'CMP-004',name:'욕설·위협 표현',category:'유해 표현',patterns:['직접 욕설','신체 위해 협박','반복 괴롭힘'],detection:'유해 표현 분류 모델',action:'표시',severity:'높음',exceptions:'인용·상품명 오탐 검토',status:'검토 필요',owner:'Trust & Safety',updatedAt:'2026-08-27' },
  { id:'CMP-005',name:'개인정보 문서',category:'개인정보',patterns:['신분증 번호','계좌번호 이미지','주소 전체'],detection:'OCR + 개인정보 패턴',action:'발송 차단',severity:'긴급',exceptions:'운영자 승인 증빙 채널',status:'사용',owner:'개인정보보호',updatedAt:'2026-08-20' },
  { id:'CMP-006',name:'구형 키워드 사전',category:'레거시',patterns:['과거 수동 키워드'],detection:'단순 일치',action:'표시',severity:'주의',exceptions:'신규 정책으로 대체',status:'중지',owner:'정책 관리',updatedAt:'2026-07-31' },
];

export const CHAT_ACCESS_LOGS: ChatAccessLog[] = [
  { id:'CLOG-260827-081',accessedAt:'2026-08-27 11:55',adminId:'admin02',roomId:'CHAT-260827-1038',tradeId:'TRD-202608-8107',reason:'분쟁 증빙 확인',ticketId:'DSP-260827-014',scope:'전체 대화 46건',result:'허용',ip:'10.24.8.***',duration:'8분 12초',exported:false },
  { id:'CLOG-260827-079',accessedAt:'2026-08-27 11:18',adminId:'admin01',roomId:'CHAT-260827-1042',tradeId:'TRD-202608-8108',reason:'신고 메시지 확인',ticketId:'RPT-260827-051',scope:'신고 전후 10건',result:'허용',ip:'10.24.7.***',duration:'4분 31초',exported:false },
  { id:'CLOG-260827-075',accessedAt:'2026-08-27 10:42',adminId:'admin03',roomId:'CHAT-260826-0971',tradeId:'TRD-202608-8088',reason:'제재 근거 검토',ticketId:'SNC-260826-118',scope:'탐지 메시지 3건',result:'허용',ip:'10.24.9.***',duration:'6분 04초',exported:true },
  { id:'CLOG-260827-071',accessedAt:'2026-08-27 09:52',adminId:'admin04',roomId:'CHAT-260827-1031',tradeId:'TRD-202608-8104',reason:'신고 메시지 확인',ticketId:'RPT-260826-113',scope:'신고 전후 10건',result:'허용',ip:'10.24.11.***',duration:'3분 48초',exported:false },
  { id:'CLOG-260826-164',accessedAt:'2026-08-26 21:30',adminId:'admin07',roomId:'CHAT-260826-0994',tradeId:'TRD-202608-8096',reason:'기타',ticketId:'-',scope:'열람 요청',result:'거부',ip:'10.24.5.***',duration:'-',exported:false },
  { id:'CLOG-260826-158',accessedAt:'2026-08-26 19:08',adminId:'admin01',roomId:'CHAT-260826-0950',tradeId:'TRD-202608-8075',reason:'상품 신고 확인',ticketId:'RPT-260827-052',scope:'신고 전후 10건',result:'만료',ip:'10.24.7.***',duration:'30분',exported:false },
];

export const CHAT_STATUS_META: Record<ChatStatus,{bg:string;fg:string}> = {
  거래중:{bg:'#eff6ff',fg:'#1d4ed8'}, 거래완료:{bg:'#ecfdf5',fg:'#047857'}, 분쟁중:{bg:'#fff7ed',fg:'#c2410c'}, 종료:{bg:'#f4f4f5',fg:'#52525b'},
};
export const CHAT_RISK_META: Record<ChatRisk,{bg:string;fg:string}> = {
  정상:{bg:'#ecfdf5',fg:'#047857'}, 주의:{bg:'#fff7ed',fg:'#c2410c'}, 높음:{bg:'#fef2f2',fg:'#dc2626'}, 긴급:{bg:'#fee2e2',fg:'#991b1b'},
};
export const MESSAGE_STATUS_META: Record<MessageStatus,{bg:string;fg:string}> = {
  정상:{bg:'#f4f4f5',fg:'#52525b'}, 탐지:{bg:'#fff7ed',fg:'#c2410c'}, 제한:{bg:'#fef2f2',fg:'#dc2626'}, 삭제:{bg:'#f4f4f5',fg:'#71717a'},
};
