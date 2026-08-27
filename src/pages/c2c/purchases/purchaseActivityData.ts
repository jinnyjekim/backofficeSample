import { SALE_PRODUCTS, SELLERS } from '../sales/salesActivityData';

export type PurchaseStatus = '결제완료' | '배송중' | '구매확정' | '취소요청' | '취소완료' | '분쟁중';
export type CancelStatus = '승인대기' | '구매자 확인' | '판매자 확인' | '환불처리중' | '취소완료' | '반려';
export type DisputeStatus = '접수' | '검토중' | '증빙대기' | '운영판단' | '조정완료';

export interface Buyer {
  id: string;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  grade: '일반' | '우수' | 'VIP';
  verification: '완료' | '미완료';
  joinedAt: string;
  lastActiveAt: string;
  purchaseCount: number;
  purchaseAmount: number;
  cancelCount: number;
  disputeCount: number;
  mannerScore: number;
}

export interface Purchase {
  id: string;
  tradeId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number;
  deliveryFee: number;
  status: PurchaseStatus;
  paymentMethod: string;
  paidAt: string;
  updatedAt: string;
  shipping: string;
  confirmedAt: string;
  issue: string;
}

export interface PurchaseCancel {
  id: string;
  purchaseId: string;
  requestedAt: string;
  reasonType: '단순 변심' | '판매자 미발송' | '상품 정보 상이' | '중복 결제' | '운영자 취소';
  reason: string;
  responsibility: '구매자' | '판매자' | '플랫폼' | '검토중';
  refundAmount: number;
  refundMethod: string;
  status: CancelStatus;
  assignee: string;
  sellerResponse: string;
  completedAt: string;
}

export interface PurchaseDispute {
  id: string;
  purchaseId: string;
  receivedAt: string;
  category: '상품 상태' | '미배송' | '가품 의심' | '구성품 누락' | '거래 취소';
  status: DisputeStatus;
  priority: '일반' | '주의' | '긴급';
  buyerClaim: string;
  sellerClaim: string;
  buyerEvidence: number;
  sellerEvidence: number;
  assignee: string;
  dueAt: string;
  resolution: string;
}

export interface DisputeAuditLog {
  id: string;
  occurredAt: string;
  disputeId: string;
  purchaseId: string;
  action: string;
  before: string;
  after: string;
  actor: string;
  reason: string;
  evidenceChange: string;
}

export interface PurchaseActivityLog {
  id: string;
  occurredAt: string;
  buyerId: string;
  category: '구매' | '결제' | '배송' | '취소' | '분쟁' | '환불';
  action: string;
  target: string;
  before: string;
  after: string;
  actor: string;
  reason: string;
  ip: string;
}

export const BUYERS: Buyer[] = [
  { id:'BUY-20318',name:'강하늘',nickname:'skyblue',email:'skyblue@example.com',phone:'010-3218-4490',grade:'VIP',verification:'완료',joinedAt:'2024-03-12',lastActiveAt:'2026-08-26 14:45',purchaseCount:84,purchaseAmount:18420000,cancelCount:2,disputeCount:0,mannerScore:98 },
  { id:'BUY-20841',name:'문지아',nickname:'moodhome',email:'moodhome@example.com',phone:'010-8803-1924',grade:'우수',verification:'완료',joinedAt:'2024-10-07',lastActiveAt:'2026-08-26 13:28',purchaseCount:47,purchaseAmount:7310000,cancelCount:1,disputeCount:0,mannerScore:96 },
  { id:'BUY-21105',name:'김태호',nickname:'photo_j',email:'photoj@example.com',phone:'010-5720-8831',grade:'VIP',verification:'완료',joinedAt:'2025-01-19',lastActiveAt:'2026-08-26 11:05',purchaseCount:62,purchaseAmount:29780000,cancelCount:3,disputeCount:1,mannerScore:91 },
  { id:'BUY-21472',name:'신예린',nickname:'dailybag',email:'dailybag@example.com',phone:'010-1187-4902',grade:'우수',verification:'완료',joinedAt:'2025-04-28',lastActiveAt:'2026-08-25 22:16',purchaseCount:35,purchaseAmount:9260000,cancelCount:1,disputeCount:0,mannerScore:94 },
  { id:'BUY-21809',name:'배지훈',nickname:'lensman',email:'lensman@example.com',phone:'010-4491-7708',grade:'일반',verification:'완료',joinedAt:'2025-07-11',lastActiveAt:'2026-08-26 09:14',purchaseCount:18,purchaseAmount:8430000,cancelCount:2,disputeCount:2,mannerScore:76 },
  { id:'BUY-22144',name:'이나경',nickname:'oldcloset',email:'oldcloset@example.com',phone:'010-7732-2051',grade:'우수',verification:'완료',joinedAt:'2025-10-02',lastActiveAt:'2026-08-25 19:31',purchaseCount:41,purchaseAmount:5180000,cancelCount:1,disputeCount:0,mannerScore:95 },
  { id:'BUY-22483',name:'정세진',nickname:'sneaker88',email:'sneaker88@example.com',phone:'010-2910-6634',grade:'일반',verification:'완료',joinedAt:'2026-01-08',lastActiveAt:'2026-08-24 18:50',purchaseCount:11,purchaseAmount:6120000,cancelCount:4,disputeCount:2,mannerScore:68 },
  { id:'BUY-22716',name:'박소민',nickname:'bookcollector',email:'books@example.com',phone:'010-9061-3277',grade:'우수',verification:'완료',joinedAt:'2026-02-22',lastActiveAt:'2026-08-26 08:43',purchaseCount:29,purchaseAmount:2940000,cancelCount:0,disputeCount:0,mannerScore:97 },
  { id:'BUY-23052',name:'윤승호',nickname:'minipad',email:'minipad@example.com',phone:'010-6351-4802',grade:'일반',verification:'미완료',joinedAt:'2026-05-16',lastActiveAt:'2026-08-23 17:22',purchaseCount:7,purchaseAmount:1920000,cancelCount:2,disputeCount:1,mannerScore:72 },
  { id:'BUY-23390',name:'최은서',nickname:'objet_user',email:'objet@example.com',phone:'010-1724-5509',grade:'일반',verification:'완료',joinedAt:'2026-07-03',lastActiveAt:'2026-08-26 12:07',purchaseCount:6,purchaseAmount:680000,cancelCount:0,disputeCount:0,mannerScore:90 },
];

const PURCHASE_SEEDS: Array<[number,number,number,PurchaseStatus,string,string]> = [
  [0,0,420000,'결제완료','안전결제',''],[1,1,185000,'배송중','카드',''],[2,2,68000,'구매확정','간편결제',''],[3,3,240000,'취소완료','카드','판매 제한 자동 취소'],
  [4,4,390000,'구매확정','안전결제',''],[5,5,1980000,'배송중','카드','배송 지연 문의'],[6,6,720000,'분쟁중','간편결제','상품 상태 설명 불일치'],
  [7,7,128000,'결제완료','안전결제',''],[8,8,1150000,'취소요청','카드','정품 검수 보류'],[9,10,94000,'배송중','안전결제',''],
  [0,11,55000,'구매확정','카드',''],[8,12,490000,'구매확정','간편결제',''],[9,13,49000,'결제완료','안전결제',''],[2,14,170000,'배송중','카드',''],
];

export const PURCHASES: Purchase[] = PURCHASE_SEEDS.map((seed,index)=>({
  id:`PUR-202608-${String(5101+index).padStart(4,'0')}`,tradeId:`TRD-202608-${String(8101+index).padStart(4,'0')}`,buyerId:BUYERS[seed[0]].id,sellerId:SALE_PRODUCTS[seed[1]].sellerId,productId:SALE_PRODUCTS[seed[1]].id,
  amount:seed[2],deliveryFee:index%4===0?0:3000,status:seed[3],paymentMethod:seed[4],issue:seed[5],paidAt:`2026-08-${String(18+index%8).padStart(2,'0')} ${String(9+index%9).padStart(2,'0')}:12`,updatedAt:`2026-08-${String(20+index%7).padStart(2,'0')} ${String(10+index%8).padStart(2,'0')}:45`,
  shipping:seed[3]==='배송중'?'CJ대한통운 · 이동중':seed[3]==='구매확정'?'배송 완료':seed[3].includes('취소')?'배송 없음':'송장 등록 대기',confirmedAt:seed[3]==='구매확정'?`2026-08-${String(23+index%4).padStart(2,'0')} 18:20`:'-',
}));

export const PURCHASE_CANCELS: PurchaseCancel[] = [
  {id:'CAN-260826-041',purchaseId:PURCHASES[8].id,requestedAt:'2026-08-26 13:42',reasonType:'상품 정보 상이',reason:'정품 검수 보류 사실을 결제 후 확인했습니다.',responsibility:'검토중',refundAmount:1150000,refundMethod:'카드 승인 취소',status:'승인대기',assignee:'미배정',sellerResponse:'정품 소명 자료 제출 예정',completedAt:'-'},
  {id:'CAN-260826-038',purchaseId:PURCHASES[0].id,requestedAt:'2026-08-26 11:08',reasonType:'단순 변심',reason:'색상을 잘못 확인하고 구매했습니다.',responsibility:'구매자',refundAmount:420000,refundMethod:'안전결제 환불',status:'구매자 확인',assignee:'admin02',sellerResponse:'발송 전으로 취소 동의',completedAt:'-'},
  {id:'CAN-260825-029',purchaseId:PURCHASES[7].id,requestedAt:'2026-08-25 17:33',reasonType:'판매자 미발송',reason:'결제 후 4일 동안 송장이 등록되지 않았습니다.',responsibility:'판매자',refundAmount:128000,refundMethod:'안전결제 환불',status:'판매자 확인',assignee:'admin04',sellerResponse:'개인 사정으로 발송 지연, 취소 동의',completedAt:'-'},
  {id:'CAN-260825-021',purchaseId:PURCHASES[3].id,requestedAt:'2026-08-25 14:10',reasonType:'운영자 취소',reason:'판매자 판매 제한에 따라 미발송 거래 자동 취소',responsibility:'판매자',refundAmount:240000,refundMethod:'카드 승인 취소',status:'환불처리중',assignee:'SYSTEM',sellerResponse:'-',completedAt:'-'},
  {id:'CAN-260824-018',purchaseId:PURCHASES[12].id,requestedAt:'2026-08-24 19:04',reasonType:'중복 결제',reason:'결제 버튼을 두 번 눌러 중복 승인되었습니다.',responsibility:'플랫폼',refundAmount:49000,refundMethod:'안전결제 환불',status:'취소완료',assignee:'admin01',sellerResponse:'중복 주문 확인',completedAt:'2026-08-25 10:22'},
  {id:'CAN-260823-012',purchaseId:PURCHASES[9].id,requestedAt:'2026-08-23 15:29',reasonType:'단순 변심',reason:'배송이 시작된 이후 구매 취소를 요청했습니다.',responsibility:'구매자',refundAmount:94000,refundMethod:'안전결제 환불',status:'반려',assignee:'admin03',sellerResponse:'이미 집화 완료되어 취소 불가',completedAt:'2026-08-23 17:40'},
];

export const PURCHASE_DISPUTES: PurchaseDispute[] = [
  {id:'DSP-260826-017',purchaseId:PURCHASES[6].id,receivedAt:'2026-08-26 09:18',category:'상품 상태',status:'검토중',priority:'주의',buyerClaim:'렌즈 내부에 설명에 없던 곰팡이 흔적이 있습니다.',sellerClaim:'출고 전 촬영 이미지에서는 확인되지 않았습니다.',buyerEvidence:4,sellerEvidence:2,assignee:'admin03',dueAt:'2026-08-27 18:00',resolution:''},
  {id:'DSP-260825-014',purchaseId:PURCHASES[8].id,receivedAt:'2026-08-25 16:05',category:'가품 의심',status:'증빙대기',priority:'긴급',buyerClaim:'상품 라벨과 박스 시리얼이 일치하지 않습니다.',sellerClaim:'정식 매장에서 구매한 상품이며 영수증을 제출하겠습니다.',buyerEvidence:6,sellerEvidence:1,assignee:'admin02',dueAt:'2026-08-26 16:00',resolution:''},
  {id:'DSP-260824-009',purchaseId:PURCHASES[5].id,receivedAt:'2026-08-24 13:42',category:'미배송',status:'접수',priority:'일반',buyerClaim:'송장 등록 후 이틀 동안 배송 이동이 없습니다.',sellerClaim:'택배사 집화 지연으로 확인 중입니다.',buyerEvidence:1,sellerEvidence:0,assignee:'미배정',dueAt:'2026-08-27 13:42',resolution:''},
  {id:'DSP-260822-031',purchaseId:PURCHASES[11].id,receivedAt:'2026-08-22 11:20',category:'구성품 누락',status:'운영판단',priority:'주의',buyerClaim:'충전 케이블이 포함되지 않았습니다.',sellerClaim:'상품 설명에 본체 단품으로 명시했습니다.',buyerEvidence:3,sellerEvidence:3,assignee:'admin01',dueAt:'2026-08-26 18:00',resolution:'상품 설명 고지 수준을 검토 중'},
  {id:'DSP-260819-022',purchaseId:PURCHASES[4].id,receivedAt:'2026-08-19 16:08',category:'거래 취소',status:'조정완료',priority:'일반',buyerClaim:'예약 상품으로 잘못 표시되어 취소를 요청했습니다.',sellerClaim:'구매자와 부분 보상에 합의했습니다.',buyerEvidence:1,sellerEvidence:1,assignee:'admin04',dueAt:'2026-08-23 18:00',resolution:'배송비 3,000원 판매자 부담, 거래 유지'},
];

export const DISPUTE_AUDIT_LOGS: DisputeAuditLog[] = [
  { id:'DLOG-260827-041',occurredAt:'2026-08-27 10:32',disputeId:'DSP-260826-017',purchaseId:PURCHASES[6].id,action:'추가 증빙 요청',before:'검토중',after:'증빙대기',actor:'admin03',reason:'출고 전 원본 이미지와 수령 후 근접 사진 비교 필요',evidenceChange:'판매자 증빙 +2 요청' },
  { id:'DLOG-260827-040',occurredAt:'2026-08-27 09:12',disputeId:'DSP-260826-017',purchaseId:PURCHASES[6].id,action:'분쟁 검토 시작',before:'접수',after:'검토중',actor:'admin03',reason:'상품 상태 설명 불일치 검토',evidenceChange:'구매자 4 / 판매자 2' },
  { id:'DLOG-260826-039',occurredAt:'2026-08-26 17:10',disputeId:'DSP-260825-014',purchaseId:PURCHASES[8].id,action:'판매자 증빙 요청',before:'검토중',after:'증빙대기',actor:'admin02',reason:'정품 구매 영수증과 시리얼 사진 요청',evidenceChange:'판매자 증빙 +1' },
  { id:'DLOG-260826-038',occurredAt:'2026-08-26 15:20',disputeId:'DSP-260824-009',purchaseId:PURCHASES[5].id,action:'분쟁 접수',before:'-',after:'접수',actor:'SYSTEM',reason:'신고 RPT-260827-050 연계',evidenceChange:'구매자 증빙 1' },
  { id:'DLOG-260826-037',occurredAt:'2026-08-26 14:05',disputeId:'DSP-260822-031',purchaseId:PURCHASES[11].id,action:'판단 단계 전환',before:'증빙대기',after:'운영판단',actor:'admin01',reason:'양측 증빙 제출 완료',evidenceChange:'구매자 3 / 판매자 3' },
  { id:'DLOG-260823-031',occurredAt:'2026-08-23 17:42',disputeId:'DSP-260819-022',purchaseId:PURCHASES[4].id,action:'운영 판단 확정',before:'운영판단',after:'조정완료',actor:'admin04',reason:'배송비 3,000원 판매자 부담, 거래 유지',evidenceChange:'변경 없음' },
  { id:'DLOG-260823-030',occurredAt:'2026-08-23 16:20',disputeId:'DSP-260819-022',purchaseId:PURCHASES[4].id,action:'당사자 합의 확인',before:'증빙대기',after:'운영판단',actor:'admin04',reason:'구매자와 판매자 부분 보상 합의',evidenceChange:'합의서 +1' },
];

const LOG_SEEDS:Array<[number,PurchaseActivityLog['category'],string,string,string,string,string]>=[
  [8,'취소','구매 취소 요청','거래중','취소요청','상품 정보 상이','BUYER'],[6,'분쟁','구매 분쟁 접수','배송중','분쟁중','상품 상태 설명 불일치','BUYER'],[0,'결제','안전결제 승인','결제대기','결제완료','카드 승인 완료','SYSTEM'],
  [1,'배송','배송 상태 변경','상품준비','배송중','송장 집화 완료','SYSTEM'],[2,'구매','구매 확정','배송완료','구매확정','구매자 직접 확정','BUYER'],[3,'환불','환불 요청 전송','취소승인','환불처리중','카드사 승인 취소 요청','SYSTEM'],
  [5,'분쟁','배송 지연 문의','배송중','분쟁 접수 전','배송 이동 없음','BUYER'],[4,'구매','거래 평가 등록','구매확정','평가완료','판매자 평가 5점','BUYER'],[7,'취소','취소 요청 반려','승인대기','반려','이미 집화 완료','admin03'],
  [9,'배송','송장 등록','결제완료','배송중','판매자 송장 등록','SELLER'],[11,'분쟁','판매자 증빙 등록','증빙대기','운영판단','상품 설명 캡처 제출','SELLER'],[12,'환불','환불 완료','환불처리중','취소완료','안전결제 환불 완료','SYSTEM'],
  [13,'결제','결제수단 변경','카드','간편결제','구매자 결제 재시도','BUYER'],[0,'구매','관심 상품 구매','장바구니','결제완료','안전결제 구매','BUYER'],[8,'분쟁','운영자 담당 배정','미배정','admin02','긴급 분쟁 자동 배정','SYSTEM'],
];

export const PURCHASE_ACTIVITY_LOGS:PurchaseActivityLog[]=LOG_SEEDS.map((seed,index)=>({id:`PLOG-260826-${String(701+index).padStart(4,'0')}`,occurredAt:`2026-08-${String(26-Math.floor(index/3)).padStart(2,'0')} ${String(15-index%7).padStart(2,'0')}:${String(9+index*3).slice(-2)}`,buyerId:PURCHASES[seed[0]].buyerId,category:seed[1],action:seed[2],target:PURCHASES[seed[0]].id,before:seed[3],after:seed[4],reason:seed[5],actor:seed[6],ip:seed[6]==='SYSTEM'?'-':`10.30.${index%6}.${31+index}`}));

export const PURCHASE_STATUS_META:Record<PurchaseStatus,{bg:string;fg:string}>={결제완료:{bg:'#eff6ff',fg:'#1d4ed8'},배송중:{bg:'#f5f3ff',fg:'#6d28d9'},구매확정:{bg:'#ecfdf5',fg:'#047857'},취소요청:{bg:'#fff7ed',fg:'#c2410c'},취소완료:{bg:'#f4f4f5',fg:'#52525b'},분쟁중:{bg:'#fef2f2',fg:'#dc2626'}};
export const CANCEL_STATUS_META:Record<CancelStatus,{bg:string;fg:string}>={승인대기:{bg:'#fff7ed',fg:'#c2410c'},'구매자 확인':{bg:'#eff6ff',fg:'#1d4ed8'},'판매자 확인':{bg:'#f5f3ff',fg:'#6d28d9'},환불처리중:{bg:'#ecfeff',fg:'#0e7490'},취소완료:{bg:'#ecfdf5',fg:'#047857'},반려:{bg:'#f4f4f5',fg:'#52525b'}};
export const DISPUTE_STATUS_META:Record<DisputeStatus,{bg:string;fg:string}>={접수:{bg:'#fff7ed',fg:'#c2410c'},검토중:{bg:'#eff6ff',fg:'#1d4ed8'},증빙대기:{bg:'#f5f3ff',fg:'#6d28d9'},운영판단:{bg:'#fef2f2',fg:'#dc2626'},조정완료:{bg:'#ecfdf5',fg:'#047857'}};
export const buyerById=(id:string)=>BUYERS.find((buyer)=>buyer.id===id);
export const purchaseById=(id:string)=>PURCHASES.find((purchase)=>purchase.id===id);
export const productById=(id:string)=>SALE_PRODUCTS.find((product)=>product.id===id);
export const sellerById=(id:string)=>SELLERS.find((seller)=>seller.id===id);
export const formatWon=(value:number)=>`${value.toLocaleString('ko-KR')}원`;
