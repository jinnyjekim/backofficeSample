export type InboundStatus = '작성중' | '입고 예정' | '입고 진행' | '부분 입고' | '입고 완료' | '취소';
export type InboundType = '구매 입고' | '반품 재입고' | '재고 이동 입고' | '기타 입고';

export interface InboundReceipt {
  id: string;
  sequence: number;
  receivedAt: string;
  actor: string;
  items: { skuId: string; arrived: number; normal: number; defective: number; excluded: number; movementId?: string }[];
  memo?: string;
}

export interface InboundItem {
  skuId: string;
  sku: string;
  productCode: string;
  productName: string;
  option: string;
  thumbnail: string;
  planned: number;
  beforeStock: number;
}

export interface InboundHistory {
  at: string;
  actor: string;
  title: string;
  detail: string;
}

export interface InboundAdminMemo { id:string; at:string; actor:string; content:string; }

export interface InboundRecord {
  id: string;
  type: InboundType;
  status: InboundStatus;
  expectedDate: string;
  warehouse: string;
  supplier: string;
  supplierReference?: string;
  purchaseOrder?: string;
  returnReference?: string;
  manager: string;
  memo: string;
  adminMemos?: InboundAdminMemo[];
  items: InboundItem[];
  receipts: InboundReceipt[];
  closedRemaining: boolean;
  closedReason?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  history: InboundHistory[];
}

const item = (skuId: string, sku: string, productCode: string, productName: string, option: string, thumbnail: string, planned: number, beforeStock: number): InboundItem => ({ skuId, sku, productCode, productName, option, thumbnail, planned, beforeStock });
const receipt = (id: string, sequence: number, receivedAt: string, actor: string, items: InboundReceipt['items'], memo?: string): InboundReceipt => ({ id, sequence, receivedAt, actor, items, memo });

export const INBOUND_RECORDS: InboundRecord[] = [
  { id:'IN-20260827-00192', type:'구매 입고', status:'입고 예정', expectedDate:'2026-08-27', warehouse:'수도권 센터', supplier:'오피스허브', supplierReference:'SUP-0827-31', purchaseOrder:'PO-20260820-0082', manager:'김물류', memo:'오전 도착 예정', items:[item('INV-001','SKU-001-RS','P-001','프리미엄 사무용 의자','레드 / S','#dbeafe',20,20),item('INV-002','SKU-001-RM','P-001','프리미엄 사무용 의자','레드 / M','#dbeafe',30,0)], receipts:[], closedRemaining:false, createdAt:'2026-08-20 10:20', updatedAt:'2026-08-20 10:20', history:[{at:'2026-08-20 10:20',actor:'김물류',title:'입고 예정 등록',detail:'PO-20260820-0082 기준 2개 SKU · 50개'}]},
  { id:'IN-20260826-00191', type:'구매 입고', status:'입고 진행', expectedDate:'2026-08-26', warehouse:'수도권 센터', supplier:'테크라인', purchaseOrder:'PO-20260819-0079', manager:'이창고', memo:'검수 대기 중', items:[item('INV-007','SKU-003-KB','P-003','무선 키보드 세트','블랙','#fee2e2',40,6)], receipts:[receipt('RCV-00191-1',1,'2026-08-26 09:10','이창고',[{skuId:'INV-007',arrived:40,normal:0,defective:0,excluded:0}],'도착 확인, 검수 대기')], closedRemaining:false, createdAt:'2026-08-19 14:10', updatedAt:'2026-08-26 09:10', history:[{at:'2026-08-26 09:10',actor:'이창고',title:'상품 도착',detail:'40개 도착 · 검수 대기'},{at:'2026-08-19 14:10',actor:'박구매',title:'입고 예정 등록',detail:'PO-20260819-0079 연동'}]},
  { id:'IN-20260824-00188', type:'구매 입고', status:'부분 입고', expectedDate:'2026-08-24', warehouse:'수도권 센터', supplier:'데스크웍스', purchaseOrder:'PO-20260817-0071', manager:'김물류', memo:'잔여 10개 8/29 재납품 예정', items:[item('INV-005','SKU-002-W120','P-002','스탠딩 전동 데스크','화이트 / 1200','#ede9fe',40,12)], receipts:[receipt('RCV-00188-1',1,'2026-08-24 15:20','김물류',[{skuId:'INV-005',arrived:30,normal:29,defective:1,excluded:0,movementId:'ST-00881'}],'모서리 파손 1개 반송')], closedRemaining:false, createdAt:'2026-08-17 09:30', updatedAt:'2026-08-24 15:20', history:[{at:'2026-08-24 15:20',actor:'김물류',title:'1차 입고 처리',detail:'정상 29개 · 불량 1개 · 재고 +29'},{at:'2026-08-17 09:30',actor:'박구매',title:'입고 예정 등록',detail:'예정 40개'}]},
  { id:'IN-20260823-00186', type:'구매 입고', status:'부분 입고', expectedDate:'2026-08-23', warehouse:'부산 센터', supplier:'워크핏 생산팀', purchaseOrder:'PO-20260816-0068', manager:'최부산', memo:'공급처 생산 지연', items:[item('INV-003','SKU-001-BS','P-001','프리미엄 사무용 의자','블루 / S','#dbeafe',50,50),item('INV-004','SKU-001-BM','P-001','프리미엄 사무용 의자','블루 / M','#dbeafe',50,50)], receipts:[receipt('RCV-00186-1',1,'2026-08-23 11:40','최부산',[{skuId:'INV-003',arrived:50,normal:50,defective:0,excluded:0,movementId:'ST-00873'},{skuId:'INV-004',arrived:30,normal:30,defective:0,excluded:0,movementId:'ST-00874'}])], closedRemaining:false, createdAt:'2026-08-16 13:00', updatedAt:'2026-08-23 11:40', history:[{at:'2026-08-23 11:40',actor:'최부산',title:'1차 입고 처리',detail:'2개 SKU 정상 80개 · 재고 +80'}]},
  { id:'IN-20260825-00190', type:'반품 재입고', status:'입고 완료', expectedDate:'2026-08-25', warehouse:'수도권 센터', supplier:'반품 회수', returnReference:'RET-20260822-0142', manager:'정반품', memo:'미개봉 확인', items:[item('INV-008','SKU-004-A4','P-004','복사용지 A4 80g','2,500매','#dcfce7',2,100)], receipts:[receipt('RCV-00190-1',1,'2026-08-25 16:05','정반품',[{skuId:'INV-008',arrived:2,normal:2,defective:0,excluded:0,movementId:'ST-00889'}],'재판매 가능')], closedRemaining:false, createdAt:'2026-08-22 16:30', updatedAt:'2026-08-25 16:05', history:[{at:'2026-08-25 16:05',actor:'정반품',title:'입고 완료',detail:'재판매 가능 2개 · 재고 +2'}]},
  { id:'IN-20260822-00183', type:'구매 입고', status:'입고 완료', expectedDate:'2026-08-22', warehouse:'수도권 센터', supplier:'모던스페이스', purchaseOrder:'PO-20260815-0060', manager:'이창고', memo:'', items:[item('INV-011','SKU-007-ST','P-007','알루미늄 노트북 스탠드','실버','#ffedd5',80,9)], receipts:[receipt('RCV-00183-1',1,'2026-08-22 13:20','이창고',[{skuId:'INV-011',arrived:84,normal:84,defective:0,excluded:0,movementId:'ST-00862'}],'초과 4개 관리자 승인')], closedRemaining:false, createdAt:'2026-08-15 11:20', updatedAt:'2026-08-22 13:20', history:[{at:'2026-08-22 13:20',actor:'이창고',title:'초과 입고 승인 및 완료',detail:'예정 대비 4개 초과 · 재고 +84'}]},
  { id:'IN-20260820-00178', type:'구매 입고', status:'입고 완료', expectedDate:'2026-08-20', warehouse:'부산 센터', supplier:'비즈보드', manager:'최부산', memo:'잔여 공급 불가 확정', items:[item('INV-012','SKU-008-WB','P-008','이동식 화이트보드','900×1800','#e0f2fe',100,20)], receipts:[receipt('RCV-00178-1',1,'2026-08-20 10:05','최부산',[{skuId:'INV-012',arrived:80,normal:79,defective:1,excluded:0,movementId:'ST-00841'}])], closedRemaining:true, closedReason:'공급처 미납품', createdAt:'2026-08-12 09:20', updatedAt:'2026-08-21 14:30', history:[{at:'2026-08-21 14:30',actor:'박구매',title:'잔여 입고 종료',detail:'잔여 21개 · 공급처 미납품'},{at:'2026-08-20 10:05',actor:'최부산',title:'1차 입고 처리',detail:'정상 79개 · 불량 1개'}]},
  { id:'IN-20260819-00174', type:'기타 입고', status:'취소', expectedDate:'2026-08-19', warehouse:'수도권 센터', supplier:'내부 운영', manager:'김물류', memo:'', items:[item('INV-010','SKU-006-PJ','P-006','회의실 빔프로젝터','기본형','#fce7f3',5,2)], receipts:[], closedRemaining:false, cancelReason:'테스트 등록 건', createdAt:'2026-08-18 17:00', updatedAt:'2026-08-18 17:15', history:[{at:'2026-08-18 17:15',actor:'김물류',title:'입고 취소',detail:'테스트 등록 건'}]},
  { id:'IN-20260830-00196', type:'재고 이동 입고', status:'입고 예정', expectedDate:'2026-08-30', warehouse:'부산 센터', supplier:'수도권 센터', manager:'최부산', memo:'센터 간 이동', items:[item('INV-006','SKU-002-B140','P-002','스탠딩 전동 데스크','블랙 / 1400','#ede9fe',10,10)], receipts:[], closedRemaining:false, createdAt:'2026-08-25 16:40', updatedAt:'2026-08-25 16:40', history:[{at:'2026-08-25 16:40',actor:'최부산',title:'이동 입고 예정 등록',detail:'수도권 센터 출고와 연결'}]},
];

export const INBOUND_SKU_OPTIONS = [
  item('INV-001','SKU-001-RS','P-001','프리미엄 사무용 의자','레드 / S','#dbeafe',0,20),
  item('INV-002','SKU-001-RM','P-001','프리미엄 사무용 의자','레드 / M','#dbeafe',0,0),
  item('INV-003','SKU-001-BS','P-001','프리미엄 사무용 의자','블루 / S','#dbeafe',0,50),
  item('INV-005','SKU-002-W120','P-002','스탠딩 전동 데스크','화이트 / 1200','#ede9fe',0,12),
  item('INV-006','SKU-002-B140','P-002','스탠딩 전동 데스크','블랙 / 1400','#ede9fe',0,38),
  item('INV-007','SKU-003-KB','P-003','무선 키보드 세트','블랙','#fee2e2',0,6),
  item('INV-008','SKU-004-A4','P-004','복사용지 A4 80g','2,500매','#dcfce7',0,100),
  item('INV-011','SKU-007-ST','P-007','알루미늄 노트북 스탠드','실버','#ffedd5',0,9),
];

export function inboundTotals(record: InboundRecord) {
  const planned = record.items.reduce((sum, value) => sum + value.planned, 0);
  const arrived = record.receipts.flatMap((value) => value.items).reduce((sum, value) => sum + value.arrived, 0);
  const normal = record.receipts.flatMap((value) => value.items).reduce((sum, value) => sum + value.normal, 0);
  const defective = record.receipts.flatMap((value) => value.items).reduce((sum, value) => sum + value.defective, 0);
  const excluded = record.receipts.flatMap((value) => value.items).reduce((sum, value) => sum + value.excluded, 0);
  return { planned, arrived, normal, defective, excluded, remaining: Math.max(planned - arrived, 0), over: Math.max(arrived - planned, 0), reflected: normal };
}

export function itemTotals(record: InboundRecord, skuId: string) {
  const target = record.items.find((value) => value.skuId === skuId);
  const received = record.receipts.flatMap((value) => value.items).filter((value) => value.skuId === skuId);
  const arrived = received.reduce((sum, value) => sum + value.arrived, 0);
  const normal = received.reduce((sum, value) => sum + value.normal, 0);
  const defective = received.reduce((sum, value) => sum + value.defective, 0);
  const excluded = received.reduce((sum, value) => sum + value.excluded, 0);
  const planned = target?.planned ?? 0;
  return { planned, arrived, normal, defective, excluded, remaining: Math.max(planned - arrived, 0), over: Math.max(arrived - planned, 0) };
}

export function isDelayed(record: InboundRecord) {
  return !['입고 완료','취소'].includes(record.status) && record.expectedDate < '2026-08-26' && inboundTotals(record).remaining > 0;
}

export function hasInboundIssue(record: InboundRecord) {
  const totals = inboundTotals(record);
  const inspectionPending = record.receipts.some((receipt) => receipt.items.some((line) => line.arrived !== line.normal + line.defective + line.excluded));
  const reflectionMismatch = record.status === '입고 완료' && totals.normal !== totals.reflected;
  return totals.over > 0 || totals.defective > 0 || inspectionPending || reflectionMismatch || isDelayed(record) || (record.closedRemaining && totals.remaining > 0);
}
