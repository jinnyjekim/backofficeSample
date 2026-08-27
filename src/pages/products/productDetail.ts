import { fmtWon, STATUS_META, SUPPLY_FG, type Product } from './productsData';

export interface FieldRow {
  label: string;
  value: string;
  color?: string;
}

export interface DealSummaryItem {
  label: string;
  value: string;
}

export interface DealRow {
  no: string;
  partner: string;
  qty: string;
  amount: string;
  date: string;
}

export interface ProductDetail {
  code: string;
  name: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  supplyLabel: string;
  supplyFg: string;
  saleActionLabel: string;
  saleBorder: string;
  saleBg: string;
  saleFg: string;
  openOrders: number;
  basicFields: FieldRow[];
  description: string;
  priceFields: FieldRow[];
  priceLinks: Product['priceLinks'];
  options: Product['options'];
  orderFields: FieldRow[];
  supplyFields: FieldRow[];
  salesTarget: string;
  partnerRows: Product['partnerRows'];
  inventoryManaged: boolean;
  inventoryFields: FieldRow[];
  dealSummary: DealSummaryItem[];
  deals: DealRow[];
  history: Product['history'];
  memos: Product['memos'];
}

export function buildProductDetail(p: Product): ProductDetail {
  const sm = STATUS_META[p.status];
  const stock = p.stock ?? 0;
  const reserved = p.reserved ?? 0;
  const available = p.available ?? 0;
  const safety = p.safety ?? 0;

  return {
    code: p.code,
    name: p.name,
    statusLabel: p.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    supplyLabel: p.supply,
    supplyFg: SUPPLY_FG[p.supply],
    saleActionLabel: p.status === '판매중' ? '판매 중지' : p.status === '판매중지' ? '판매 재개' : '판매 시작',
    saleBorder: p.status === '판매중' ? '#fecaca' : 'rgba(0,0,0,.12)',
    saleBg: p.status === '판매중' ? '#fef2f2' : '#fff',
    saleFg: p.status === '판매중' ? '#dc2626' : '#3f3f46',
    openOrders: 12,

    basicFields: [
      { label: '상품코드', value: p.code },
      { label: '상품명', value: p.name },
      { label: '브랜드', value: `${p.brandName} · ${p.brandCode}` },
      { label: '카테고리', value: p.category },
      { label: '상품 유형', value: p.type },
      { label: '판매 상태', value: p.status },
      { label: '공급 상태', value: p.supply },
      { label: '등록일', value: p.registered },
      { label: '최근 수정', value: p.updated },
      { label: '등록 관리자', value: p.admin },
    ],
    description: p.description,

    priceFields: [
      { label: '기본 가격', value: p.price ? fmtWon(p.price) : '미등록' },
      { label: '세금', value: p.tax },
      { label: '가격 적용일', value: p.priceDate },
    ],
    priceLinks: p.priceLinks,

    options: p.options,

    orderFields: [
      { label: '최소 주문수량', value: p.minQty ? p.minQty + '개' : '-' },
      { label: '주문 단위', value: p.unit ? String(p.unit) : '-' },
      { label: '최소 주문금액', value: p.minAmount ? fmtWon(p.minAmount) : '-' },
      { label: '최대 주문수량', value: p.maxQty },
    ],

    supplyFields: [
      { label: '공급 상태', value: p.supply },
      { label: '기본 납기', value: p.leadTime },
      { label: '공급 단위', value: p.supplyUnit },
      { label: '1 ' + p.supplyUnit, value: p.boxQty ? p.boxQty + '개' : '-' },
      { label: '공급 최소수량', value: p.minBoxQty ? p.minBoxQty + ' ' + p.supplyUnit : '-' },
    ],

    salesTarget: '전체 거래처 · 개별 설정 ' + p.partnerCount + '건',
    partnerRows: p.partnerRows,

    inventoryManaged: p.inventoryManaged,
    inventoryFields: p.inventoryManaged
      ? [
          { label: '현재 재고', value: stock.toLocaleString('ko-KR'), color: '#18181b' },
          { label: '예약 재고', value: reserved.toLocaleString('ko-KR'), color: '#18181b' },
          { label: '판매 가능 재고', value: available.toLocaleString('ko-KR'), color: available < safety ? '#dc2626' : '#18181b' },
          { label: '안전재고', value: safety.toLocaleString('ko-KR'), color: '#18181b' },
        ]
      : [],

    dealSummary: [
      { label: '누적 주문', value: p.dealSummary.count + '건' },
      { label: '누적 수량', value: p.dealSummary.qty.toLocaleString('ko-KR') },
      { label: '최근 주문', value: p.dealSummary.last },
    ],
    deals: p.deals.map((d) => ({ no: d.no, partner: d.partner, qty: d.qty.toLocaleString('ko-KR'), amount: fmtWon(d.amount), date: d.date })),

    history: p.history,
    memos: p.memos,
  };
}
