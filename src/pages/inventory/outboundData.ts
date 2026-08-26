export type StockOutboundStatus = '작성중' | '출고 대기' | '출고 진행' | '부분 출고' | '출고 완료' | '취소';
export type StockOutboundType = '주문 출고' | '재고 이동 출고' | '반품 반송' | '기타 출고' | '폐기 출고' | '교환 출고';

export interface StockOutboundTransaction {
  id: string;
  sequence: number;
  shippedAt: string;
  actor: string;
  items: { skuId: string; shipped: number; deducted: number; reservationReleased: number; movementId?: string }[];
  memo?: string;
}

export interface StockOutboundItem {
  skuId: string;
  sku: string;
  productCode: string;
  productName: string;
  option: string;
  thumbnail: string;
  requested: number;
  currentStock: number;
  reservedStock: number;
  lockedStock: number;
}

export interface StockOutboundHistory { at:string; actor:string; title:string; detail:string; }
export interface StockOutboundRecord {
  id:string; type:StockOutboundType; status:StockOutboundStatus; requestedAt:string; expectedDate:string; warehouse:string; orderId?:string; shipmentId?:string; orderStatus?:string; shipmentStatus?:string; manager:string; reason:string; memo:string; items:StockOutboundItem[]; transactions:StockOutboundTransaction[]; closedRemaining:boolean; closedReason?:string; cancelReason?:string; issues:string[]; createdAt:string; updatedAt:string; history:StockOutboundHistory[];
}

const line=(skuId:string,sku:string,productCode:string,productName:string,option:string,thumbnail:string,requested:number,currentStock:number,reservedStock:number,lockedStock=0):StockOutboundItem=>({skuId,sku,productCode,productName,option,thumbnail,requested,currentStock,reservedStock,lockedStock});
const tx=(id:string,sequence:number,shippedAt:string,actor:string,items:StockOutboundTransaction['items'],memo?:string):StockOutboundTransaction=>({id,sequence,shippedAt,actor,items,memo});

export const STOCK_OUTBOUND_RECORDS:StockOutboundRecord[]=[
  {id:'OUT-20260826-00218',type:'주문 출고',status:'출고 대기',requestedAt:'2026-08-25',expectedDate:'2026-08-26',warehouse:'수도권 센터',orderId:'O-00240',shipmentId:'SHP-00240',orderStatus:'배송 준비',shipmentStatus:'출고 대기',manager:'김물류',reason:'고객 주문',memo:'오후 3시 집하 예정',items:[line('INV-011','SKU-007-SL','P-007','알루미늄 노트북 거치대','실버','#cffafe',12,80,12,4)],transactions:[],closedRemaining:false,issues:[],createdAt:'2026-08-25 18:30',updatedAt:'2026-08-25 18:30',history:[{at:'2026-08-25 18:30',actor:'system',title:'출고 요청 자동 생성',detail:'주문 O-00240 · 예약재고 12개'}]},
  {id:'OUT-20260826-00217',type:'주문 출고',status:'출고 진행',requestedAt:'2026-08-25',expectedDate:'2026-08-26',warehouse:'수도권 센터',orderId:'O-00230',shipmentId:'SHP-00230',orderStatus:'배송 준비',shipmentStatus:'피킹 중',manager:'이창고',reason:'고객 주문',memo:'B2B 대량 주문 · 10박스 단위 피킹',items:[line('INV-008','SKU-004-BOX','P-004','A4 복사용지 80g','2,500매 / 1박스','#fef3c7',120,1600,220)],transactions:[],closedRemaining:false,issues:[],createdAt:'2026-08-25 17:20',updatedAt:'2026-08-26 09:00',history:[{at:'2026-08-26 09:00',actor:'이창고',title:'피킹 시작',detail:'요청 120박스'},{at:'2026-08-25 17:20',actor:'system',title:'출고 요청 자동 생성',detail:'주문 O-00230'}]},
  {id:'OUT-20260825-00212',type:'주문 출고',status:'부분 출고',requestedAt:'2026-08-24',expectedDate:'2026-08-25',warehouse:'수도권 센터',orderId:'O-00201',shipmentId:'SHP-00201',orderStatus:'부분 배송',shipmentStatus:'1차 배송사 인계',manager:'김물류',reason:'고객 주문',memo:'잔여 3개 입고 후 출고 예정',items:[line('INV-005','SKU-002-W120','P-002','스탠딩 전동 데스크','화이트 / 1200','#ede9fe',8,12,8)],transactions:[tx('OTX-00212-1',1,'2026-08-25 10:20','김물류',[{skuId:'INV-005',shipped:5,deducted:5,reservationReleased:5,movementId:'ST-00921'}],'1차분 우선 출고')],closedRemaining:false,issues:[],createdAt:'2026-08-24 16:40',updatedAt:'2026-08-25 10:21',history:[{at:'2026-08-25 10:21',actor:'system',title:'재고 차감',detail:'현재고 -5 · 예약재고 -5 · ST-00921'},{at:'2026-08-25 10:20',actor:'김물류',title:'1차 출고 확정',detail:'정상 출고 5개'}]},
  {id:'OUT-20260824-00206',type:'주문 출고',status:'부분 출고',requestedAt:'2026-08-23',expectedDate:'2026-08-24',warehouse:'부산 센터',orderId:'O-00191',shipmentId:'SHP-00191',orderStatus:'부분 배송',shipmentStatus:'일부 인계',manager:'최부산',reason:'고객 주문',memo:'블루 M 잔여 재고 확인 중',items:[line('INV-003','SKU-001-BS','P-001','프리미엄 사무용 의자','블루 / S','#dbeafe',5,20,3),line('INV-004','SKU-001-BM','P-001','프리미엄 사무용 의자','블루 / M','#dbeafe',3,50,5)],transactions:[tx('OTX-00206-1',1,'2026-08-24 14:10','최부산',[{skuId:'INV-003',shipped:3,deducted:3,reservationReleased:3,movementId:'ST-00902'},{skuId:'INV-004',shipped:2,deducted:2,reservationReleased:2,movementId:'ST-00903'}])],closedRemaining:false,issues:['예약재고와 주문 수량 불일치'],createdAt:'2026-08-23 09:20',updatedAt:'2026-08-24 14:11',history:[{at:'2026-08-24 14:11',actor:'system',title:'재고 및 예약 차감',detail:'2개 SKU · 현재고 -5 · 예약재고 -5'},{at:'2026-08-24 14:10',actor:'최부산',title:'1차 출고 확정',detail:'요청 8개 중 5개'}]},
  {id:'OUT-20260826-00220',type:'기타 출고',status:'출고 대기',requestedAt:'2026-08-26',expectedDate:'2026-08-27',warehouse:'수도권 센터',manager:'admin01',reason:'샘플 제공',memo:'신규 거래처 데모용',items:[line('INV-010','SKU-006-WH','P-006','휴대용 빔프로젝터','화이트','#fee2e2',2,42,0)],transactions:[],closedRemaining:false,issues:[],createdAt:'2026-08-26 10:40',updatedAt:'2026-08-26 10:40',history:[{at:'2026-08-26 10:40',actor:'admin01',title:'수동 출고 등록',detail:'샘플 제공 · 요청 2개'}]},
  {id:'OUT-20260823-00201',type:'주문 출고',status:'출고 완료',requestedAt:'2026-08-22',expectedDate:'2026-08-23',warehouse:'수도권 센터',orderId:'O-00180',shipmentId:'SHP-00180',orderStatus:'배송 중',shipmentStatus:'배송사 인계 완료',manager:'이창고',reason:'고객 주문',memo:'',items:[line('INV-001','SKU-001-RS','P-001','프리미엄 사무용 의자','레드 / S','#dbeafe',2,22,2)],transactions:[tx('OTX-00201-1',1,'2026-08-23 09:30','이창고',[{skuId:'INV-001',shipped:2,deducted:2,reservationReleased:2,movementId:'ST-00892'}])],closedRemaining:false,issues:[],createdAt:'2026-08-22 14:20',updatedAt:'2026-08-23 09:31',history:[{at:'2026-08-23 09:31',actor:'system',title:'출고 완료 및 재고 차감',detail:'현재고 22 → 20 · 예약재고 -2'},{at:'2026-08-23 09:30',actor:'이창고',title:'1차 출고 확정',detail:'2개'}]},
  {id:'OUT-20260822-00198',type:'폐기 출고',status:'출고 완료',requestedAt:'2026-08-22',expectedDate:'2026-08-22',warehouse:'수도권 센터',manager:'admin02',reason:'파손 상품 폐기',memo:'재고 실사 중 파손 확인',items:[line('INV-006','SKU-002-B140','P-002','스탠딩 전동 데스크','블랙 / 1400','#ede9fe',1,29,0)],transactions:[tx('OTX-00198-1',1,'2026-08-22 17:00','admin02',[{skuId:'INV-006',shipped:1,deducted:1,reservationReleased:0,movementId:'ST-00888'}])],closedRemaining:false,issues:[],createdAt:'2026-08-22 15:30',updatedAt:'2026-08-22 17:01',history:[{at:'2026-08-22 17:01',actor:'system',title:'폐기 출고 재고 차감',detail:'현재고 -1 · ST-00888'}]},
  {id:'OUT-20260821-00194',type:'주문 출고',status:'출고 완료',requestedAt:'2026-08-20',expectedDate:'2026-08-21',warehouse:'수도권 센터',orderId:'O-00239',shipmentId:'SHP-00239',orderStatus:'배송 중',shipmentStatus:'배송사 인계 완료',manager:'김물류',reason:'고객 주문',memo:'재고 차감 재처리 필요',items:[line('INV-011','SKU-007-SL','P-007','알루미늄 노트북 거치대','실버','#cffafe',2,122,2)],transactions:[tx('OTX-00194-1',1,'2026-08-21 10:20','김물류',[{skuId:'INV-011',shipped:2,deducted:0,reservationReleased:0}])],closedRemaining:false,issues:['출고 완료인데 재고 미차감','배송 인계됐는데 예약재고 미해제'],createdAt:'2026-08-20 17:30',updatedAt:'2026-08-21 10:20',history:[{at:'2026-08-21 10:20',actor:'김물류',title:'출고 완료',detail:'2개 · 재고 차감 Transaction 누락'}]},
  {id:'OUT-20260820-00191',type:'주문 출고',status:'취소',requestedAt:'2026-08-20',expectedDate:'2026-08-20',warehouse:'수도권 센터',orderId:'O-00172',orderStatus:'주문 취소',manager:'이창고',reason:'고객 주문',memo:'',items:[line('INV-007','SKU-003-KR','P-003','무선 키보드 세트','한글 / 블랙','#dcfce7',3,3,3)],transactions:[],closedRemaining:false,cancelReason:'고객 주문 전체 취소',issues:[],createdAt:'2026-08-20 08:30',updatedAt:'2026-08-20 08:42',history:[{at:'2026-08-20 08:42',actor:'system',title:'출고 요청 취소',detail:'주문 취소 연동 · 예약재고 해제'}]},
];

export const STOCK_OUTBOUND_SKUS:StockOutboundItem[]=[
  line('INV-001','SKU-001-RS','P-001','프리미엄 사무용 의자','레드 / S','#dbeafe',0,20,5),line('INV-003','SKU-001-BS','P-001','프리미엄 사무용 의자','블루 / S','#dbeafe',0,50,8),line('INV-004','SKU-001-BM','P-001','프리미엄 사무용 의자','블루 / M','#dbeafe',0,50,5),line('INV-005','SKU-002-W120','P-002','스탠딩 전동 데스크','화이트 / 1200','#ede9fe',0,12,8),line('INV-006','SKU-002-B140','P-002','스탠딩 전동 데스크','블랙 / 1400','#ede9fe',0,38,4),line('INV-008','SKU-004-BOX','P-004','A4 복사용지 80g','2,500매 / 1박스','#fef3c7',0,2480,320),line('INV-010','SKU-006-WH','P-006','휴대용 빔프로젝터','화이트','#fee2e2',0,42,0),line('INV-011','SKU-007-SL','P-007','알루미늄 노트북 거치대','실버','#cffafe',0,120,18,4)
];

export function outboundTotals(record:StockOutboundRecord){const requested=record.items.reduce((sum,value)=>sum+value.requested,0);const txItems=record.transactions.flatMap((value)=>value.items);const shipped=txItems.reduce((sum,value)=>sum+value.shipped,0);const deducted=txItems.reduce((sum,value)=>sum+value.deducted,0);const reservationReleased=txItems.reduce((sum,value)=>sum+value.reservationReleased,0);return{requested,shipped,deducted,reservationReleased,remaining:Math.max(requested-shipped,0),difference:shipped-deducted}}
export function outboundItemTotals(record:StockOutboundRecord,skuId:string){const target=record.items.find((value)=>value.skuId===skuId);const txItems=record.transactions.flatMap((value)=>value.items).filter((value)=>value.skuId===skuId);const shipped=txItems.reduce((sum,value)=>sum+value.shipped,0);const deducted=txItems.reduce((sum,value)=>sum+value.deducted,0);const reservationReleased=txItems.reduce((sum,value)=>sum+value.reservationReleased,0);const requested=target?.requested??0;return{requested,shipped,deducted,reservationReleased,remaining:Math.max(requested-shipped,0),currentAvailable:Math.max((target?.currentStock??0)-deducted,0),reservedAvailable:Math.max((target?.reservedStock??0)-reservationReleased,0)}}
export function isOutboundDelayed(record:StockOutboundRecord){return !['출고 완료','취소'].includes(record.status)&&record.expectedDate<'2026-08-26'&&outboundTotals(record).remaining>0}
export function outboundIssues(record:StockOutboundRecord){const totals=outboundTotals(record);const calculated=[...record.issues];if(isOutboundDelayed(record))calculated.push('출고 예정일 초과');if(totals.shipped!==totals.deducted&&!calculated.some((value)=>value.includes('재고 미차감')))calculated.push('출고 수량과 재고 차감 불일치');return[...new Set(calculated)]}
