import { Download, Info, RefreshCw, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CommonSelect } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { downloadStatisticsReport } from '../../lib/statisticsReport';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { INVENTORY_PRODUCTS, productRows, type InventoryProduct, type InventoryViewRow } from '../inventory/inventoryData';
import shared from '../ops/opsShared.module.css';
import layout from './SalesAnalysisPage.module.css';
import styles from './InventoryAnalysisPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import { TODAY, addDays, fmtDate, fmtWon } from './transactionStatsData';

type Mode = 'b2c' | 'b2b';
type TrendMetric = 'current' | 'available' | 'inbound' | 'outbound' | 'sales';
type Risk = '정상' | '부족' | '품절 위험' | '품절' | '과잉' | '장기' | '판매중지';

interface InventoryAnalysisRow {
  id: string;
  name: string;
  code: string;
  subtitle: string;
  current: number;
  reserved: number;
  locked: number;
  available: number;
  safety: number;
  inbound: number;
  outbound: number;
  sales: number;
  dailySales: number;
  inventoryDays: number;
  depletionDate: string;
  turnover: number;
  asset: number;
  deliveryDue: number;
  expectedRemaining: number;
  shortage: number;
  issues: Risk[];
  abc: 'A' | 'B' | 'C';
  products: InventoryProduct[];
}

const COSTS = [165_000, 480_000, 42_000, 25_000, 0, 290_000, 36_000, 180_000];
const DAILY_SALES = [7.6, 2.8, 15.4, 58, 0, 0.08, 9.2, 1.2];
const SUPPLIERS = ['워크핏 공급사', '워크핏 공급사', '키웍스', '페이퍼온', '클라우드원', '비전빔', '오피스픽', '보드랩'];
const ANALYSIS_DAYS: Record<string, number> = { '최근 7일': 7, '최근 30일': 30, '최근 90일': 90, '이번 달': 31, '최근 6개월': 180 };
const MODE_TABS: Record<Mode, string[]> = {
  b2c: ['상품별', '카테고리별', '창고별', '재고 연령'],
  b2b: ['상품별', '카테고리별', '창고별', '재고 연령', '공급처별'],
};

const RISK_META: Record<Risk, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#047857' },
  부족: { bg: '#fff7ed', fg: '#c2410c' },
  '품절 위험': { bg: '#fef2f2', fg: '#dc2626' },
  품절: { bg: '#18181b', fg: '#fff' },
  과잉: { bg: '#eef2ff', fg: '#4338ca' },
  장기: { bg: '#f5f3ff', fg: '#7c3aed' },
  판매중지: { bg: '#f4f4f5', fg: '#71717a' },
};

function round(value: number) {
  return Math.round(value);
}

function fmtQty(value: number) {
  return `${round(value).toLocaleString('ko-KR')}개`;
}

function productWarehouseValues(row: InventoryViewRow, warehouse: string) {
  if (warehouse === '전체 창고') {
    return { current: row.current, reserved: row.reserved, locked: row.locked, inbound: row.inboundExpected };
  }
  return row.sourceSkus.reduce((sum, sku) => {
    const target = sku.warehouses.find((item) => item.warehouse === warehouse);
    if (!target) return sum;
    return { current: sum.current + target.current, reserved: sum.reserved + target.reserved, locked: sum.locked + target.locked, inbound: sum.inbound + target.inboundExpected };
  }, { current: 0, reserved: 0, locked: 0, inbound: 0 });
}

function riskFor(row: InventoryAnalysisRow): Risk[] {
  const issues: Risk[] = [];
  if (row.available <= 0 && row.current > 0) issues.push('품절');
  else if (row.available <= 0 && row.current === 0 && row.products.some((product) => product.saleStatus === '판매중')) issues.push('품절');
  if (row.inventoryDays > 0 && row.inventoryDays <= 7) issues.push('품절 위험');
  if (row.available > 0 && row.available < row.safety) issues.push('부족');
  if (row.inventoryDays > 180) issues.push('과잉');
  if (row.products.some((product) => product.saleStatus === '판매중지')) issues.push('판매중지', '장기');
  const resolved: Risk[] = issues.length ? issues : ['정상'];
  return [...new Set(resolved)];
}

function buildProductRows(mode: Mode, days: number, warehouse: string, includeInbound: string): InventoryAnalysisRow[] {
  return productRows().filter((row) => row.inventoryManaged).map((row) => {
    const productIndex = Math.max(0, INVENTORY_PRODUCTS.findIndex((product) => product.id === row.productId));
    const warehouseValue = productWarehouseValues(row, warehouse);
    const baseScale = 40 * (mode === 'b2c' ? 0.62 : 0.38);
    const warehouseRatio = row.current ? warehouseValue.current / row.current : warehouse === '전체 창고' ? 1 : 0;
    const current = round(warehouseValue.current * baseScale);
    const reservedMultiplier = mode === 'b2b' ? 1.7 : 1;
    const reserved = round(warehouseValue.reserved * baseScale * reservedMultiplier);
    const locked = round(warehouseValue.locked * baseScale);
    const available = current - reserved - locked;
    const inbound = round(warehouseValue.inbound * baseScale);
    const safety = round((row.safety ?? 0) * baseScale * Math.max(warehouseRatio, warehouse === '전체 창고' ? 1 : 0));
    const dailySales = DAILY_SALES[productIndex] * baseScale * Math.max(warehouseRatio, warehouse === '전체 창고' ? 1 : 0) * (mode === 'b2b' ? 0.55 : 1);
    const sales = round(dailySales * days);
    const outbound = round((row.outboundExpected * baseScale + sales * 0.18) * (mode === 'b2b' ? 1.15 : 1));
    const deliveryDue = mode === 'b2b' ? round(reserved * 0.72 + outbound) : outbound;
    const inboundApplied = includeInbound === '미반영' ? 0 : includeInbound === '7일 내 입고만' && row.inboundDate && row.inboundDate > addDays(TODAY, 7) ? 0 : inbound;
    const expectedRemaining = available + inboundApplied - deliveryDue;
    const inventoryDays = dailySales > 0 ? Math.max(0, available) / dailySales : available > 0 ? 999 : 0;
    const turnover = current > 0 ? sales / Math.max((current + Math.max(current - sales * 0.35, 1)) / 2, 1) : 0;
    const product = INVENTORY_PRODUCTS.find((item) => item.id === row.productId)!;
    const draft: InventoryAnalysisRow = {
      id: row.id,
      name: row.productName,
      code: row.productCode,
      subtitle: `${row.category} · ${row.brand}`,
      current,
      reserved,
      locked,
      available,
      safety,
      inbound,
      outbound,
      sales,
      dailySales,
      inventoryDays,
      depletionDate: dailySales > 0 && available > 0 ? addDays(TODAY, Math.ceil(inventoryDays)) : available <= 0 ? '품절' : '판매 없음',
      turnover,
      asset: round(current * COSTS[productIndex]),
      deliveryDue,
      expectedRemaining,
      shortage: Math.max(0, safety - expectedRemaining),
      issues: [],
      abc: productIndex < 2 ? 'A' : productIndex < 5 ? 'B' : 'C',
      products: [product],
    };
    draft.issues = riskFor(draft);
    if (row.sourceSkus.some((sku) => sku.inventoryManaged && sku.safety !== null && sku.current - sku.reserved - sku.locked <= sku.safety) && !draft.issues.includes('부족')) {
      draft.issues = [...draft.issues.filter((issue) => issue !== '정상'), '부족'];
    }
    return draft;
  }).filter((row) => warehouse === '전체 창고' || row.current || row.inbound);
}

function aggregateRows(id: string, name: string, subtitle: string, rows: InventoryAnalysisRow[]): InventoryAnalysisRow {
  const sum = (key: keyof InventoryAnalysisRow) => rows.reduce((total, row) => total + (typeof row[key] === 'number' ? row[key] as number : 0), 0);
  const current = sum('current');
  const available = sum('available');
  const dailySales = sum('dailySales');
  const safety = sum('safety');
  const expectedRemaining = sum('expectedRemaining');
  const result: InventoryAnalysisRow = {
    id, name, subtitle,
    code: rows[0]?.code ?? id,
    current,
    reserved: sum('reserved'),
    locked: sum('locked'),
    available,
    safety,
    inbound: sum('inbound'),
    outbound: sum('outbound'),
    sales: sum('sales'),
    dailySales,
    inventoryDays: dailySales > 0 ? Math.max(0, available) / dailySales : available > 0 ? 999 : 0,
    depletionDate: dailySales > 0 && available > 0 ? addDays(TODAY, Math.ceil(available / dailySales)) : available <= 0 ? '품절' : '판매 없음',
    turnover: rows.length ? rows.reduce((total, row) => total + row.turnover, 0) / rows.length : 0,
    asset: sum('asset'),
    deliveryDue: sum('deliveryDue'),
    expectedRemaining,
    shortage: Math.max(0, safety - expectedRemaining),
    issues: [],
    abc: rows.some((row) => row.abc === 'A') ? 'A' : rows.some((row) => row.abc === 'B') ? 'B' : 'C',
    products: rows.flatMap((row) => row.products),
  };
  result.issues = [...new Set(rows.flatMap((row) => row.issues).filter((issue) => issue !== '정상'))];
  if (!result.issues.length) result.issues = ['정상'];
  return result;
}

function groupRows(rows: InventoryAnalysisRow[], dimension: string, mode: Mode, days: number, includeInbound: string): InventoryAnalysisRow[] {
  if (dimension === '상품별') return rows;
  if (dimension === '카테고리별') {
    const categories = [...new Set(rows.map((row) => row.products[0]?.category ?? '기타'))];
    return categories.map((category) => aggregateRows(`category-${category}`, category, `${rows.filter((row) => row.products[0]?.category === category).length}개 상품`, rows.filter((row) => row.products[0]?.category === category)));
  }
  if (dimension === '창고별') {
    return ['수도권 센터', '부산 센터'].map((warehouse) => aggregateRows(`warehouse-${warehouse}`, warehouse, '다중 SKU 재고 합계', buildProductRows(mode, days, warehouse, includeInbound)));
  }
  if (dimension === '공급처별') {
    const suppliers = [...new Set(SUPPLIERS)];
    return suppliers.map((supplier) => {
      const targets = rows.filter((row) => SUPPLIERS[INVENTORY_PRODUCTS.findIndex((product) => product.id === row.products[0]?.id)] === supplier);
      return aggregateRows(`supplier-${supplier}`, supplier, `${targets.length}개 공급 상품`, targets);
    }).filter((row) => row.products.length);
  }
  const buckets = [
    ['0~30일', 0.42], ['31~60일', 0.24], ['61~90일', 0.14], ['91~180일', 0.12], ['180일 초과', 0.08],
  ] as const;
  const total = aggregateRows('age-total', '전체', '', rows);
  return buckets.map(([name, weight], index) => {
    const scaled = rows.map((row) => ({ ...row,
      current: round(row.current * weight), available: round(row.available * weight), reserved: round(row.reserved * weight), locked: round(row.locked * weight), safety: round(row.safety * weight), inbound: round(row.inbound * weight), outbound: round(row.outbound * weight), sales: round(row.sales * weight), dailySales: row.dailySales * weight, asset: round(row.asset * weight), deliveryDue: round(row.deliveryDue * weight), expectedRemaining: round(row.expectedRemaining * weight), shortage: round(row.shortage * weight), products: row.products,
    }));
    const result = aggregateRows(`age-${index}`, name, `재고 연령 비중 ${(weight * 100).toFixed(0)}%`, scaled);
    result.issues = index === 4 ? ['장기'] : index === 3 ? ['과잉'] : ['정상'];
    result.current = round(total.current * weight);
    result.asset = round(total.asset * weight);
    return result;
  });
}

function InventoryTrendChart({ primary, secondary, labels }: { primary: number[]; secondary?: number[]; labels: string[] }) {
  const max = Math.max(...primary, ...(secondary ?? []), 1);
  const width = 860;
  const height = 220;
  const px = 38;
  const py = 18;
  const points = (values: number[]) => values.map((value, index) => {
    const x = values.length <= 1 ? width / 2 : px + (index / (values.length - 1)) * (width - px * 2);
    const y = height - py - (value / max) * (height - py * 2);
    return `${x},${y}`;
  }).join(' ');
  const step = Math.max(1, Math.ceil(labels.length / 7));
  return <div className={layout.trendChart}><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="재고 추이 차트">{[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}{secondary && <polyline points={points(secondary)} className={layout.previousLine} />}<polyline points={points(primary)} className={layout.currentLine} /></svg><div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div></div>;
}

export function InventoryAnalysisPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('b2c');
  const [dimension, setDimension] = useState('상품별');
  const [snapshotDate, setSnapshotDate] = useState(TODAY);
  const [period, setPeriod] = useState('최근 30일');
  const [category, setCategory] = useState('전체 카테고리');
  const [warehouse, setWarehouse] = useState('전체 창고');
  const [risk, setRisk] = useState('전체 상태');
  const [valuation, setValuation] = useState('평균 원가');
  const [includeInbound, setIncludeInbound] = useState('미반영');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('available');
  const [compareMetric, setCompareMetric] = useState<TrendMetric | 'none'>('sales');
  const [selected, setSelected] = useState<InventoryAnalysisRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.08.31 16:55');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['code', 'name', 'current', 'available', 'safety', 'sales', 'daily', 'days', 'depletion', 'turnover', 'asset', 'risk']));
  const days = ANALYSIS_DAYS[period] ?? 30;

  const sourceRows = useMemo(() => buildProductRows(mode, days, warehouse, includeInbound), [mode, days, warehouse, includeInbound]);
  const filteredProducts = useMemo(() => sourceRows.filter((row) => {
    if (category !== '전체 카테고리' && row.products[0]?.category !== category) return false;
    if (risk !== '전체 상태' && !row.issues.includes(risk as Risk)) return false;
    return true;
  }), [sourceRows, category, risk]);
  const detailRows = useMemo(() => groupRows(filteredProducts, dimension, mode, days, includeInbound), [filteredProducts, dimension, mode, days, includeInbound]);
  const total = useMemo(() => aggregateRows('total', '전체 재고', '', filteredProducts), [filteredProducts]);
  const previousFactor = mode === 'b2c' ? 1.032 : 1.018;
  const previous = { ...total, current: round(total.current * previousFactor), available: round(total.available * previousFactor), asset: round(total.asset * .982), turnover: Math.max(0, total.turnover - .4) };

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function switchMode(next: Mode) {
    setMode(next);
    setDimension('상품별');
    setSelected(null);
    setRisk('전체 상태');
    setTrendMetric(next === 'b2b' ? 'available' : 'current');
  }

  function reset() {
    setSnapshotDate(TODAY); setPeriod('최근 30일'); setCategory('전체 카테고리'); setWarehouse('전체 창고');
    setRisk('전체 상태'); setValuation('평균 원가'); setIncludeInbound('미반영'); setTrendMetric(mode === 'b2b' ? 'available' : 'current'); setCompareMetric('sales');
  }

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }

  const categories = ['전체 카테고리', ...new Set(INVENTORY_PRODUCTS.map((product) => product.category))];
  const riskCounts = (['품절', '품절 위험', '부족', '과잉', '장기'] as Risk[]).map((label) => ({ label, count: sourceRows.filter((row) => row.issues.includes(label)).length }));
  const normalCount = sourceRows.filter((row) => row.issues.length === 1 && row.issues[0] === '정상').length;

  const kpis = mode === 'b2c' ? [
    { key: 'current', label: '현재 재고수량', value: fmtQty(total.current), previous: previous.current, unit: '개', definition: `실물재고 합계 · 가용 ${fmtQty(total.available)} · 예약 ${fmtQty(total.reserved)} · 보류 ${fmtQty(total.locked)}` },
    { key: 'asset', label: '재고자산금액', value: fmtWon(total.asset), previous: previous.asset, unit: '원', definition: `${valuation} × 현재 재고수량` },
    { key: 'turnover', label: '재고 회전율', value: `${total.turnover.toFixed(1)}회`, previous: previous.turnover, unit: '회', definition: '분석기간 판매수량 ÷ 평균 재고수량' },
    { key: 'risk', label: '품절 위험 상품', value: `${riskCounts.filter((item) => ['품절', '품절 위험'].includes(item.label)).reduce((sum, item) => sum + item.count, 0)}개`, previous: 0, unit: '개', definition: '가용재고 기준 예상 재고일수 7일 이하' },
  ] : [
    { key: 'available', label: '가용재고', value: fmtQty(total.available), previous: previous.available, unit: '개', definition: '현재재고 - 확정 주문 예약 - 판매불가 재고' },
    { key: 'reserved', label: '확정 주문 예약량', value: fmtQty(total.reserved), previous: round(total.reserved * .94), unit: '개', definition: '확정 주문 및 출고 준비에 할당된 수량' },
    { key: 'shortage', label: '납품 부족 예상', value: `${detailRows.filter((row) => row.shortage > 0).length}개 상품`, previous: Math.max(0, detailRows.filter((row) => row.shortage > 0).length - 1), unit: '개', definition: '가용 + 반영 입고 - 납품 예정이 안전재고보다 낮은 상품' },
    { key: 'turnover', label: '재고 회전율', value: `${total.turnover.toFixed(1)}회`, previous: previous.turnover, unit: '회', definition: '기간 출고수량 ÷ 평균 재고수량' },
  ];

  const kpiValue = (key: string, row: InventoryAnalysisRow) => key === 'current' ? row.current : key === 'available' ? row.available : key === 'asset' ? row.asset : key === 'reserved' ? row.reserved : key === 'shortage' ? detailRows.filter((item) => item.shortage > 0).length : key === 'risk' ? riskCounts.filter((item) => ['품절', '품절 위험'].includes(item.label)).reduce((sum, item) => sum + item.count, 0) : row.turnover;

  const trendLength = days <= 31 ? days : Math.ceil(days / 7);
  const trendLabels = Array.from({ length: trendLength }, (_, index) => {
    const offset = (trendLength - 1 - index) * (days <= 31 ? 1 : 7);
    return addDays(snapshotDate, -offset).slice(5).replace('-', '.');
  });
  const trendValues = (metric: TrendMetric) => Array.from({ length: trendLength }, (_, index) => {
    const progress = trendLength <= 1 ? 1 : index / (trendLength - 1);
    const wave = 1 + Math.sin(index * .72) * .035;
    if (metric === 'current') return Math.max(0, total.current * (1.08 - .08 * progress) * wave);
    if (metric === 'available') return Math.max(0, total.available * (1.1 - .1 * progress) * wave);
    if (metric === 'inbound') return Math.max(0, total.inbound / Math.max(trendLength / 3, 1) * (index % 6 === 2 ? 2.3 : .32));
    if (metric === 'outbound') return Math.max(0, total.outbound / Math.max(trendLength, 1) * (1 + Math.cos(index * .8) * .18));
    return Math.max(0, total.sales / Math.max(trendLength, 1) * (1 + Math.sin(index * .65) * .14));
  });
  const primaryTrend = trendValues(trendMetric);
  const secondaryTrend = compareMetric === 'none' ? undefined : trendValues(compareMetric);
  const metricLabels: Record<TrendMetric, string> = { current: '재고수량', available: '가용재고', inbound: '입고수량', outbound: '출고수량', sales: mode === 'b2b' ? '납품수량' : '판매수량' };

  const columns: GridColumn[] = mode === 'b2c'
    ? [{ label: dimension.replace('별', '') }, { label: '현재재고', align: 'right' }, { label: '가용재고', align: 'right' }, { label: '안전재고', align: 'right' }, { label: '기간 판매', align: 'right' }, { label: '일평균', align: 'right' }, { label: '재고일수', align: 'right' }, { label: '회전율', align: 'right' }, { label: '재고자산', align: 'right' }, { label: '재고 위험' }]
    : [{ label: dimension.replace('별', '') }, { label: '현재재고', align: 'right' }, { label: '예약재고', align: 'right' }, { label: '가용재고', align: 'right' }, { label: '입고 예정', align: 'right' }, { label: '납품 예정', align: 'right' }, { label: '예상 잔여', align: 'right' }, { label: '안전재고', align: 'right' }, { label: '부족 수량', align: 'right' }, { label: '재고 위험' }];

  const gridRows: GridRow[] = detailRows.map((row) => {
    const primaryRisk = row.issues[0] ?? '정상';
    const riskMeta = RISK_META[primaryRisk];
    const cells: Cell[] = mode === 'b2c'
      ? [{ kind: 'stack', title: row.name, subtitle: `${row.code} · ABC ${row.abc}` }, { kind: 'text', text: row.current.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: row.available.toLocaleString('ko-KR'), align: 'right', weight: 600, numeric: true }, { kind: 'text', text: row.safety.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: row.sales.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: row.dailySales.toFixed(1), align: 'right', numeric: true }, { kind: 'text', text: row.inventoryDays >= 999 ? '판매 없음' : `${row.inventoryDays.toFixed(1)}일`, align: 'right', color: row.inventoryDays <= 7 ? '#dc2626' : undefined, weight: row.inventoryDays <= 7 ? 700 : undefined, numeric: true }, { kind: 'text', text: `${row.turnover.toFixed(1)}회`, align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.asset), align: 'right', numeric: true }, { kind: 'badgeSub', text: primaryRisk, subText: row.issues[1], bg: riskMeta.bg, fg: riskMeta.fg }]
      : [{ kind: 'stack', title: row.name, subtitle: `${row.code} · ABC ${row.abc}` }, { kind: 'text', text: row.current.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: row.reserved.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: row.available.toLocaleString('ko-KR'), align: 'right', weight: 600, numeric: true }, { kind: 'text', text: row.inbound.toLocaleString('ko-KR'), align: 'right', color: '#047857', numeric: true }, { kind: 'text', text: row.deliveryDue.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: row.expectedRemaining.toLocaleString('ko-KR'), align: 'right', color: row.expectedRemaining < row.safety ? '#dc2626' : undefined, weight: 600, numeric: true }, { kind: 'text', text: row.safety.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: row.shortage ? row.shortage.toLocaleString('ko-KR') : '-', align: 'right', color: row.shortage ? '#dc2626' : '#a1a1aa', weight: row.shortage ? 700 : undefined, numeric: true }, { kind: 'badgeSub', text: primaryRisk, subText: row.issues[1], bg: riskMeta.bg, fg: riskMeta.fg }];
    return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
  });

  const exportFields = [
    { key: 'code', label: '상품코드', value: (row: InventoryAnalysisRow) => row.code },
    { key: 'name', label: dimension.replace('별', ''), value: (row: InventoryAnalysisRow) => row.name },
    { key: 'current', label: '현재재고', value: (row: InventoryAnalysisRow) => row.current },
    { key: 'available', label: '가용재고', value: (row: InventoryAnalysisRow) => row.available },
    { key: 'safety', label: '안전재고', value: (row: InventoryAnalysisRow) => row.safety },
    { key: 'sales', label: mode === 'b2b' ? '납품 예정' : '기간 판매량', value: (row: InventoryAnalysisRow) => mode === 'b2b' ? row.deliveryDue : row.sales },
    { key: 'daily', label: '평균 일판매', value: (row: InventoryAnalysisRow) => row.dailySales.toFixed(1) },
    { key: 'days', label: '재고일수', value: (row: InventoryAnalysisRow) => row.inventoryDays >= 999 ? '판매 없음' : row.inventoryDays.toFixed(1) },
    { key: 'depletion', label: '예상 소진일', value: (row: InventoryAnalysisRow) => row.depletionDate },
    { key: 'turnover', label: '회전율', value: (row: InventoryAnalysisRow) => row.turnover.toFixed(1) },
    { key: 'asset', label: '재고자산', value: (row: InventoryAnalysisRow) => row.asset },
    { key: 'risk', label: '재고 위험', value: (row: InventoryAnalysisRow) => row.issues.join(' / ') },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string) => {
      const values = groupRows(filteredProducts, name, mode, days, includeInbound);
      return { name, headers: fields.map((field) => field.label), rows: values.map((row) => fields.map((field) => field.value(row))) };
    };
    const metricRow = (item: typeof kpis[number]) => {
      const current = kpiValue(item.key, total);
      const changeRate = item.previous ? ((current - item.previous) / item.previous) * 100 : 0;
      return { label: item.label, current, previous: item.previous, change: current - item.previous, changeRate: `${changeRate.toFixed(1)}%` };
    };
    downloadStatisticsReport({
      reportName: '재고 분석', mode: mode.toUpperCase(), period: `${snapshotDate} 기준 · ${period}`,
      filters: [['카테고리', category], ['창고', warehouse], ['재고 위험', risk], ['평가 기준', valuation], ['입고 예정 반영', includeInbound], ['현재 분석', dimension]],
      summary: kpis.map(metricRow),
      trend: { name: '02_재고추이', headers: ['일자', metricLabels[trendMetric], compareMetric === 'none' ? '비교 없음' : metricLabels[compareMetric]], rows: trendLabels.map((label, index) => [label, Math.round(primaryTrend[index] ?? 0), secondaryTrend ? Math.round(secondaryTrend[index] ?? 0) : '-']) },
      dimensions: [...MODE_TABS[mode].map(dimensionSheet), { name: '재고위험', headers: ['위험 상태', '상품 수'], rows: [['정상', normalCount], ...riskCounts.map((item) => [item.label, item.count])] }],
      definitions: [{ term: '가용재고', description: '현재재고에서 예약 및 판매불가 재고를 제외한 수량' }, { term: '재고일수', description: `현재 가용재고를 ${period} 평균 일판매량으로 나눈 값` }, { term: '품절 위험', description: '가용재고 기준 예상 재고일수가 7일 이하인 상품' }, { term: '장기재고', description: '최근 90일 동안 출고 또는 판매가 없는 상품' }, { term: '회전율', description: '분석 기간 판매·출고수량을 평균 재고수량으로 나눈 값' }],
      dataAsOf: `${snapshotDate} 23:59`,
    });
    setDownloadOpen(false);
    flash('재고 전체 분석 리포트를 다운로드했습니다.');
  }

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}><div><h1 className={shared.title}>재고 분석</h1><p className={shared.subtitle}>재고량과 판매·확정 수요를 연결해 품절, 부족, 과잉 및 장기재고 대응 대상을 분석합니다.</p></div><div className={layout.headerActions}><button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((value) => !value)}><Info size={15} /> 집계 기준</button><button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 재고 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button><button type="button" className={layout.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button></div></div>

      <div className={`${layout.modeSwitch} ${styles.twoMode}`}><button type="button" className={mode === 'b2c' ? layout.modeActive : ''} onClick={() => switchMode('b2c')}><strong>B2C</strong><span>판매속도 · 소진 · 과잉/장기 재고</span></button><button type="button" className={mode === 'b2b' ? layout.modeActive : ''} onClick={() => switchMode('b2b')}><strong>B2B</strong><span>예약수요 · 입고/납품 계획 · 예상 부족</span></button></div>

      <div className={layout.filterCard}>
        <div className={`${layout.filterGrid} ${styles.inventoryFilterGrid}`}>
          <label className={layout.filterField}><span>재고 기준일</span><DatePicker controlSize="sm" value={snapshotDate} onChange={(event) => setSnapshotDate(event.target.value)} /></label>
          <label className={layout.filterField}><span>{mode === 'b2b' ? '수요 분석 기간' : '판매속도 기준'}</span><CommonSelect className={layout.analysisSelect} size="sm" value={period} options={Object.keys(ANALYSIS_DAYS).map((value) => ({ label: value, value }))} onChange={(value) => setPeriod(String(value))} /></label>
          <label className={layout.filterField}><span>카테고리</span><CommonSelect className={layout.analysisSelect} size="sm" value={category} options={categories.map((value) => ({ label: value, value }))} onChange={(value) => setCategory(String(value))} /></label>
          <label className={layout.filterField}><span>창고</span><CommonSelect className={layout.analysisSelect} size="sm" value={warehouse} options={['전체 창고', '수도권 센터', '부산 센터'].map((value) => ({ label: value, value }))} onChange={(value) => setWarehouse(String(value))} /></label>
          <label className={layout.filterField}><span>재고 위험</span><CommonSelect className={layout.analysisSelect} size="sm" value={risk} options={['전체 상태', ...Object.keys(RISK_META)].map((value) => ({ label: value, value }))} onChange={(value) => setRisk(String(value))} /></label>
          <label className={layout.filterField}><span>재고 평가 기준</span><CommonSelect className={layout.analysisSelect} size="sm" value={valuation} options={['평균 원가', '최근 매입가', '표준 원가'].map((value) => ({ label: value, value }))} onChange={(value) => setValuation(String(value))} /></label>
          <label className={layout.filterField}><span>입고 예정 반영</span><CommonSelect className={layout.analysisSelect} size="sm" value={includeInbound} options={['미반영', '7일 내 입고만', '전체 입고 예정'].map((value) => ({ label: value, value }))} onChange={(value) => setIncludeInbound(String(value))} /></label>
          <div className={layout.filterActions}><button type="button" className={layout.resetButton} onClick={reset}>초기화</button><button type="button" className={layout.applyButton} onClick={() => flash('조회 조건을 적용했습니다.')}>조회</button></div>
        </div>
        <div className={layout.periodSummary}>재고 기준 <strong>{fmtDate(snapshotDate)} 23:59</strong> · {mode === 'b2b' ? '수요' : '판매'} 분석 <strong>{period}</strong> · 최근 집계 <strong>{refreshedAt}</strong> · C2C는 플랫폼 보유 재고가 없어 분석 대상에서 제외</div>
      </div>

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>재고 분석 집계 기준</strong><p>가용재고는 현재재고에서 예약 및 판매불가 재고를 제외합니다. 재고일수는 {period} 평균 일판매량, 품절 위험은 가용재고 기준 7일 이하, 장기재고는 최근 90일 출고 없음 기준입니다. 회전율은 기간 판매·출고수량을 평균 재고수량으로 나눕니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
    </div>

    <div className={layout.body}>
      <div className={layout.kpiGrid}>{kpis.map((item) => { const current = kpiValue(item.key, total); const change = item.previous ? ((current - item.previous) / item.previous) * 100 : 0; const positiveBad = ['current', 'risk', 'shortage'].includes(item.key); const good = positiveBad ? change <= 0 : change >= 0; return <article key={item.key} className={layout.kpiCard}><div className={layout.kpiLabel}>{item.label}<span title={item.definition} aria-label={item.definition}><Info size={12} /></span></div><strong>{item.value}</strong><div className={good ? layout.changeUp : layout.changeDown}>{change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(change).toFixed(1)}% <span>· 전기 대비</span></div></article>; })}</div>

      <div className={layout.secondaryMetrics}><div><span>현재 / 가용 / 예약</span><strong>{fmtQty(total.current)} / {fmtQty(total.available)} / {fmtQty(total.reserved)}</strong><em>가용재고 기준 위험 판단</em></div><div><span>기간 입고 / 출고</span><strong>+{fmtQty(total.inbound)} / -{fmtQty(total.outbound)}</strong><em>순변동 {fmtQty(total.inbound - total.outbound)}</em></div><div><span>{mode === 'b2b' ? '납품 후 예상 잔여' : '기간 판매량'}</span><strong>{mode === 'b2b' ? fmtQty(total.expectedRemaining) : fmtQty(total.sales)}</strong><em>{mode === 'b2b' ? `부족 ${fmtQty(total.shortage)}` : `일평균 ${fmtQty(total.dailySales)}`}</em></div></div>

      <section className={layout.card}><div className={layout.cardHead}><div><h2>재고 추이</h2><p>{period} · 기준일 {fmtDate(snapshotDate)}</p></div><div className={layout.legend}><span><i className={layout.legendCurrent} />{metricLabels[trendMetric]}</span>{compareMetric !== 'none' && <span><i className={layout.legendPrevious} />{metricLabels[compareMetric]}</span>}</div></div><div className={layout.chartToolbar}><label><span>주 지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={trendMetric} options={Object.entries(metricLabels).map(([value, label]) => ({ label, value }))} onChange={(value) => setTrendMetric(value as TrendMetric)} /></label><label><span>비교 지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={compareMetric} options={[{ label: '비교 없음', value: 'none' }, ...Object.entries(metricLabels).filter(([key]) => key !== trendMetric).map(([value, label]) => ({ label, value }))]} onChange={(value) => setCompareMetric(value as TrendMetric | 'none')} /></label></div>{primaryTrend.length ? <InventoryTrendChart primary={primaryTrend} secondary={secondaryTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 재고 데이터가 없습니다.</strong><span>재고 데이터가 생성되면 분석 결과가 표시됩니다.</span><button type="button" onClick={reset}>필터 초기화</button></div>}<div className={layout.chartSummary}><div><span>{metricLabels[trendMetric]} 현재값</span><strong>{fmtQty(primaryTrend.at(-1) ?? 0)}</strong><em>기준일 {fmtDate(snapshotDate)}</em></div><div><span>기간 입고</span><strong>{fmtQty(total.inbound)}</strong><em className={layout.changeUp}>재고 증가</em></div><div><span>기간 출고·판매</span><strong>{fmtQty(total.outbound + total.sales)}</strong><em className={layout.changeDown}>재고 감소</em></div></div></section>

      <div className={layout.insightGrid}><section className={layout.card}><div className={layout.cardHead}><div><h2>재고 상태 구성</h2><p>하나의 상품이 여러 위험을 동시에 가질 수 있습니다.</p></div></div><div className={styles.statusComposition}><div><strong>정상</strong><span>{normalCount}개 상품</span><em>{sourceRows.length ? ((normalCount / sourceRows.length) * 100).toFixed(1) : '0.0'}%</em><i><b style={{ width: `${sourceRows.length ? (normalCount / sourceRows.length) * 100 : 0}%` }} /></i></div>{riskCounts.map((item) => <div key={item.label}><strong>{item.label}</strong><span>{item.count}개 상품</span><em>{sourceRows.length ? ((item.count / sourceRows.length) * 100).toFixed(1) : '0.0'}%</em><i><b style={{ width: `${sourceRows.length ? (item.count / sourceRows.length) * 100 : 0}%` }} /></i></div>)}</div></section><section className={layout.card}><div className={layout.cardHead}><div><h2>재고 위험</h2><p>숫자를 선택하면 재고 현황에서 대상 상품을 확인합니다.</p></div></div><div className={styles.riskList}>{riskCounts.map((item) => <button key={item.label} type="button" onClick={() => navigate(`/inventory/status?risk=${encodeURIComponent(item.label)}`)}><span style={{ background: RISK_META[item.label].bg, color: RISK_META[item.label].fg }}>{item.label}</span><strong>{item.count}</strong><em>상품 보기 →</em></button>)}</div></section></div>

      <section className={layout.card}><div className={layout.analysisHead}><div><h2>상세 분석</h2><p>분석 결과에서 재고를 직접 조정하지 않고 원본 재고 업무로 이동합니다.</p></div><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button></div><div className={layout.dimensionTabs}>{MODE_TABS[mode].map((item) => <button key={item} type="button" className={dimension === item ? layout.dimensionActive : ''} onClick={() => setDimension(item)}>{item}</button>)}</div><DataGrid columns={columns} rows={gridRows} gridTemplate={mode === 'b2c' ? 'minmax(190px,1.5fr) 70px 70px 70px 74px 56px 70px 56px 108px 74px' : 'minmax(190px,1.5fr) 70px 70px 70px 74px 74px 74px 70px 74px 74px'} minWidth="940px" empty={!detailRows.length} emptyText="현재 조건에 해당하는 재고 데이터가 없습니다." emptySubtext="카테고리, 창고 또는 재고 위험 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} /></section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="재고 분석 상세"><div className={layout.drawerHead}><div><span>{mode.toUpperCase()} · {dimension}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div><div className={layout.drawerBody}><div className={layout.drawerHero}><span>{mode === 'b2b' ? '납품 후 예상 잔여' : '가용재고'}</span><strong>{fmtQty(mode === 'b2b' ? selected.expectedRemaining : selected.available)}</strong><div className={styles.issueBadges}>{selected.issues.map((issue) => <em key={issue} style={{ background: RISK_META[issue].bg, color: RISK_META[issue].fg }}>{issue}</em>)}</div></div><div className={layout.drawerFacts}><div><span>현재재고</span><strong>{fmtQty(selected.current)}</strong></div><div><span>예약 / 보류</span><strong>{fmtQty(selected.reserved)} / {fmtQty(selected.locked)}</strong></div><div><span>안전재고</span><strong>{fmtQty(selected.safety)}</strong></div><div><span>입고 예정</span><strong>{fmtQty(selected.inbound)}</strong></div><div><span>{mode === 'b2b' ? '납품 예정' : '기간 판매'}</span><strong>{fmtQty(mode === 'b2b' ? selected.deliveryDue : selected.sales)}</strong></div><div><span>{mode === 'b2b' ? '부족 수량' : '재고일수'}</span><strong>{mode === 'b2b' ? fmtQty(selected.shortage) : selected.inventoryDays >= 999 ? '판매 없음' : `${selected.inventoryDays.toFixed(1)}일`}</strong></div></div><div className={layout.drawerSection}><h3>재고 변화 근거</h3><div className={layout.amountFlow}><span>기초 재고 <b>{fmtQty(Math.max(0, selected.current - selected.inbound + selected.outbound))}</b></span><span>입고 <b>+{fmtQty(selected.inbound)}</b></span><span>출고·판매 <b>-{fmtQty(selected.outbound + selected.sales)}</b></span><span>기말 재고 <b>{fmtQty(selected.current)}</b></span></div></div>{selected.products.length === 1 && <div className={layout.drawerSection}><h3>옵션별 재고</h3><div className={styles.optionList}>{selected.products[0].skus.filter((sku) => sku.inventoryManaged).map((sku) => { const available = sku.current - sku.reserved - sku.locked; const issue = available <= 0 ? '품절' : sku.safety !== null && available <= sku.safety ? '부족' : '정상'; return <div key={sku.id}><span><strong>{sku.option}</strong><em>{sku.sku}</em></span><b>가용 {available.toLocaleString('ko-KR')}</b><i style={{ color: RISK_META[issue].fg }}>{issue}</i></div>; })}</div></div>}<div className={layout.drawerSection}><h3>분석 기준</h3><p>기준일 {fmtDate(snapshotDate)} · {period} · {warehouse} · {valuation} · 입고 예정 {includeInbound}</p></div></div><div className={layout.drawerFooter}><button type="button" className={layout.secondaryButton} onClick={() => navigate(`/inventory/history?product=${encodeURIComponent(selected.code)}`)}>변동 이력</button><button type="button" className={layout.secondaryButton} onClick={() => navigate('/inventory/inbound')}>입고 관리</button><button type="button" className={layout.primaryButton} onClick={() => navigate(`/inventory/status?product=${encodeURIComponent(selected.code)}`)}>재고 현황 보기</button></div></aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}><div className={layout.dialog}><div className={layout.dialogHead}><div><span>재고 분석 다운로드</span><h2>{mode.toUpperCase()} · {dimension}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div><div className={layout.downloadSummary}><span>기준일 <b>{fmtDate(snapshotDate)}</b></span><span>분석기간 <b>{period}</b></span><span>창고 <b>{warehouse}</b></span><span>평가기준 <b>{valuation}</b></span></div><StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} /><div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div></div></div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
