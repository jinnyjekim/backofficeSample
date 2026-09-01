import { Download, Info, SlidersHorizontal, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { DatePicker } from '../../components/forms/DatePicker';
import { downloadStatisticsReport } from '../../lib/statisticsReport';
import { useOutsideClose } from '../../lib/useOutsideClose';
import shared from '../ops/opsShared.module.css';
import styles from './SalesAnalysisPage.module.css';
import {
  TODAY,
  aggregate,
  bucketSeries,
  delta,
  fmtDate,
  fmtWon,
  previousPeriod,
  quickRangeDates,
  type Bucket,
  type Granularity,
  type PeriodAggregate,
  type QuickRange,
} from './transactionStatsData';

type Mode = 'all' | 'b2c' | 'c2c' | 'b2b';
type ChartMetric = 'volume' | 'revenue' | 'count' | 'average' | 'cancel';

interface SalesMetrics {
  volume: number;
  revenue: number;
  count: number;
  average: number;
  cancelRefund: number;
  discount: number;
}

interface AnalysisRow {
  id: string;
  name: string;
  count: number;
  quantity: number;
  gross: number;
  discount: number;
  refund: number;
  net: number;
  settlement: number;
  average: number;
  share: number;
  change: number;
}

const MODES: { key: Mode; label: string; note: string }[] = [
  { key: 'all', label: '통합', note: '사업 거래규모와 실제 귀속 매출을 분리합니다.' },
  { key: 'b2c', label: 'B2C', note: '판매 매출 · 주문 기준' },
  { key: 'c2c', label: 'C2C', note: '거래액과 플랫폼 매출 분리' },
  { key: 'b2b', label: 'B2B', note: '주문금액 · 확정 매출 기준' },
];

const MODE_DIMENSIONS: Record<Mode, string[]> = {
  all: ['비즈니스별', '거래 유형별', '채널별'],
  b2c: ['상품별', '카테고리별', '브랜드별', '채널별'],
  c2c: ['카테고리별', '판매자별', '수수료 유형별'],
  b2b: ['거래처별', '상품별', '계약별', '담당자별'],
};

const DIMENSION_NAMES: Record<Mode, Record<string, string[]>> = {
  all: {
    비즈니스별: ['B2C 판매', 'C2C 거래', 'B2B 주문'],
    '거래 유형별': ['상품 판매', '회원 간 거래', '계약 주문', '배송비', '서비스 수수료'],
    채널별: ['웹', '모바일 앱', '파트너 포털', '관리자 주문', 'API 연동'],
  },
  b2c: {
    상품별: ['프리미엄 무선 헤드폰', '스마트 워치 Pro', '리빙 패브릭 세트', '데일리 백팩', '홈카페 패키지'],
    카테고리별: ['디지털', '리빙', '패션', '식품', '뷰티'],
    브랜드별: ['브랜드 01', '브랜드 02', '브랜드 03', '브랜드 04', '자체 브랜드'],
    채널별: ['모바일 앱', '모바일 웹', 'PC 웹', '제휴 채널', '관리자 주문'],
  },
  c2c: {
    카테고리별: ['디지털 기기', '패션', '취미·수집', '생활용품', '도서'],
    판매자별: ['seller_olive', 'seller_moon', 'seller_blue', 'seller_daily', 'seller_room'],
    '수수료 유형별': ['거래 수수료', '안전결제 수수료', '프로모션 수수료', '정산 조정', '기타'],
  },
  b2b: {
    거래처별: ['회사 01', '회사 02', '회사 03', '회사 04', '회사 05'],
    상품별: ['산업용 패키지 A', '오피스 패키지 B', '정기 공급 상품 C', '소모품 세트 D', '기업 전용 상품 E'],
    계약별: ['CT-00182', 'CT-00176', 'CT-00169', 'CT-00161', 'CT-00154'],
    담당자별: ['김영업', '이파트너', '박기업', '최계약', '정운영'],
  },
};

const WEIGHTS = [0.31, 0.24, 0.19, 0.15, 0.11];

function round(value: number) {
  return Math.round(value);
}

function metricsFor(base: Pick<PeriodAggregate, 'paymentAmount' | 'netAmount' | 'orderAmount' | 'refundAmount' | 'orderCount'>, mode: Mode): SalesMetrics {
  const part = (business: Exclude<Mode, 'all'>): SalesMetrics => {
    if (business === 'b2c') {
      const volume = base.paymentAmount * 0.44;
      const discount = volume * 0.045;
      const cancelRefund = base.refundAmount * 0.44;
      const count = base.orderCount * 0.68;
      return { volume: round(volume), revenue: round(volume - discount - cancelRefund), count: round(count), average: round(volume / Math.max(count, 1)), cancelRefund: round(cancelRefund), discount: round(discount) };
    }
    if (business === 'c2c') {
      const volume = base.paymentAmount * 0.21;
      const count = base.orderCount * 0.24;
      const platformRevenue = volume * 0.095;
      return { volume: round(volume), revenue: round(platformRevenue), count: round(count), average: round(volume / Math.max(count, 1)), cancelRefund: round(base.refundAmount * 0.21), discount: 0 };
    }
    const volume = base.orderAmount * 0.35;
    const cancelRefund = base.refundAmount * 0.35;
    const count = base.orderCount * 0.08;
    const adjustment = volume * 0.014;
    return { volume: round(volume), revenue: round(volume - cancelRefund - adjustment), count: round(count), average: round(volume / Math.max(count, 1)), cancelRefund: round(cancelRefund), discount: round(adjustment) };
  };

  if (mode !== 'all') return part(mode);
  const items = [part('b2c'), part('c2c'), part('b2b')];
  const volume = items.reduce((sum, item) => sum + item.volume, 0);
  const revenue = items.reduce((sum, item) => sum + item.revenue, 0);
  const count = items.reduce((sum, item) => sum + item.count, 0);
  return {
    volume,
    revenue,
    count,
    average: round(volume / Math.max(count, 1)),
    cancelRefund: items.reduce((sum, item) => sum + item.cancelRefund, 0),
    discount: items.reduce((sum, item) => sum + item.discount, 0),
  };
}

function scaleMetrics(metrics: SalesMetrics, factor: number): SalesMetrics {
  const volume = round(metrics.volume * factor);
  const revenue = round(metrics.revenue * factor);
  const count = round(metrics.count * factor);
  return {
    volume,
    revenue,
    count,
    average: round(volume / Math.max(count, 1)),
    cancelRefund: round(metrics.cancelRefund * factor),
    discount: round(metrics.discount * factor),
  };
}

function compactWon(value: number) {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) return `${(value / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${(value / 10_000).toFixed(0)}만`;
  return value.toLocaleString('ko-KR');
}

function signedWon(value: number) {
  return `${value >= 0 ? '+' : '-'}${compactWon(Math.abs(value))}원`;
}

function metricValue(metrics: SalesMetrics, metric: ChartMetric) {
  if (metric === 'volume') return metrics.volume;
  if (metric === 'revenue') return metrics.revenue;
  if (metric === 'count') return metrics.count;
  if (metric === 'average') return metrics.average;
  return metrics.cancelRefund;
}

function chartMetrics(bucket: Bucket, mode: Mode): SalesMetrics {
  return metricsFor({
    paymentAmount: bucket.paymentAmount,
    netAmount: bucket.netAmount,
    orderAmount: bucket.orderAmount,
    refundAmount: bucket.refundAmount,
    orderCount: bucket.orderCount,
  }, mode);
}

function TrendChart({ current, previous, labels, formatCount }: { current: number[]; previous?: number[]; labels: string[]; formatCount?: boolean }) {
  const values = [...current, ...(previous ?? [])];
  const max = Math.max(...values, 1);
  const width = 860;
  const height = 230;
  const padX = 38;
  const padY = 18;
  const point = (value: number, index: number, length: number) => {
    const x = length <= 1 ? width / 2 : padX + (index / (length - 1)) * (width - padX * 2);
    const y = height - padY - (value / max) * (height - padY * 2);
    return `${x},${y}`;
  };
  const currentPoints = current.map((value, index) => point(value, index, current.length)).join(' ');
  const previousPoints = previous?.map((value, index) => point(value, index, previous.length)).join(' ');
  const areaPoints = `${padX},${height - padY} ${currentPoints} ${width - padX},${height - padY}`;
  const labelStep = Math.max(1, Math.ceil(labels.length / 7));

  return (
    <div className={styles.trendChart}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="매출 추이 그래프" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1={padX} x2={width - padX} y1={height - padY - ratio * (height - padY * 2)} y2={height - padY - ratio * (height - padY * 2)} className={styles.gridLine} />)}
        <polygon points={areaPoints} className={styles.chartAreaFill} />
        {previousPoints && <polyline points={previousPoints} className={styles.previousLine} />}
        <polyline points={currentPoints} className={styles.currentLine} />
        {current.map((value, index) => (
          <circle key={`${labels[index]}-${value}`} cx={point(value, index, current.length).split(',')[0]} cy={point(value, index, current.length).split(',')[1]} r="3" className={styles.chartPoint}>
            <title>{`${labels[index]} · ${formatCount ? `${round(value).toLocaleString('ko-KR')}건` : fmtWon(value)}`}</title>
          </circle>
        ))}
      </svg>
      <div className={styles.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % labelStep === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

function buildRows(mode: Mode, dimension: string, metrics: SalesMetrics, allBase: PeriodAggregate): AnalysisRow[] {
  if (mode === 'all' && dimension === '비즈니스별') {
    const unscaledTotal = metricsFor(allBase, 'all');
    const appliedFactor = unscaledTotal.volume ? metrics.volume / unscaledTotal.volume : 1;
    return (['b2c', 'c2c', 'b2b'] as const).map((business, index) => {
      const item = scaleMetrics(metricsFor(allBase, business), appliedFactor);
      return {
        id: business,
        name: DIMENSION_NAMES.all['비즈니스별'][index],
        count: item.count,
        quantity: round(item.count * 1.18),
        gross: item.volume,
        discount: item.discount,
        refund: item.cancelRefund,
        net: item.revenue,
        settlement: Math.max(0, item.volume - item.revenue - item.cancelRefund),
        average: item.average,
        share: metrics.volume ? (item.volume / metrics.volume) * 100 : 0,
        change: [8.4, 12.1, 5.7][index],
      };
    });
  }

  return (DIMENSION_NAMES[mode][dimension] ?? []).map((name, index) => {
    const weight = WEIGHTS[index] ?? 0;
    const gross = round(metrics.volume * weight);
    const discount = round(metrics.discount * weight);
    const refund = round(metrics.cancelRefund * weight);
    const net = round(metrics.revenue * weight);
    const count = round(metrics.count * weight);
    return {
      id: `${mode}-${dimension}-${index}`,
      name,
      count,
      quantity: round(count * (mode === 'b2c' ? 1.32 : 1)),
      gross,
      discount,
      refund,
      net,
      settlement: Math.max(0, gross - net - refund),
      average: round(gross / Math.max(count, 1)),
      share: weight * 100,
      change: [12.8, 8.2, 4.1, -2.8, 1.6][index] ?? 0,
    };
  });
}

export function SalesAnalysisPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('all');
  const [dimension, setDimension] = useState(MODE_DIMENSIONS.all[0]);
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState(TODAY);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [range, setRange] = useState('이번 달');
  const [compare, setCompare] = useState('이전 기간');
  const [salesBasis, setSalesBasis] = useState('결제 완료 기준');
  const [dateBasis, setDateBasis] = useState('결제일');
  const [amountBasis, setAmountBasis] = useState('세금 포함');
  const [channel, setChannel] = useState('전체 채널');
  const [tradeState, setTradeState] = useState('정상 거래');
  const [advanced, setAdvanced] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>('일별');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('revenue');
  const [selectedRow, setSelectedRow] = useState<AnalysisRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadFields, setDownloadFields] = useState(() => new Set(['target', 'count', 'gross', 'discount', 'refund', 'net', 'average', 'share', 'change']));
  const [notice, setNotice] = useState('');

  const base = useMemo(() => aggregate(start, end), [start, end]);
  const [prevStart, prevEnd] = useMemo(() => previousPeriod(start, end), [start, end]);
  const previousBase = useMemo(() => aggregate(prevStart, prevEnd), [prevStart, prevEnd]);
  const basisFactor = (salesBasis === '주문 기준' ? 1.04 : salesBasis === '거래 완료 기준' ? 0.96 : salesBasis === '매출 확정 기준' ? 0.94 : 1)
    * (amountBasis === '공급가액' ? 1 / 1.1 : 1)
    * (channel === '전체 채널' ? 1 : 0.36)
    * (tradeState === '정상 거래' ? 1 : tradeState === '완료 거래만' ? 0.82 : 1.08);
  const metrics = useMemo(() => scaleMetrics(metricsFor(base, mode), basisFactor), [base, mode, basisFactor]);
  const previousMetrics = useMemo(() => scaleMetrics(metricsFor(previousBase, mode), basisFactor), [previousBase, mode, basisFactor]);
  const analysisRows = useMemo(() => buildRows(mode, dimension, metrics, base), [mode, dimension, metrics, base]);

  const currentBuckets = useMemo(() => bucketSeries(start, end, granularity), [start, end, granularity]);
  const previousBuckets = useMemo(() => compare === '비교 없음' ? [] : bucketSeries(prevStart, prevEnd, granularity), [compare, prevStart, prevEnd, granularity]);
  const chartCurrent = currentBuckets.map((bucket) => metricValue(scaleMetrics(chartMetrics(bucket, mode), basisFactor), chartMetric));
  const chartPrevious = previousBuckets.map((bucket) => metricValue(scaleMetrics(chartMetrics(bucket, mode), basisFactor), chartMetric));
  const highestIndex = chartCurrent.reduce((best, value, index) => value > (chartCurrent[best] ?? -Infinity) ? index : best, 0);
  const lowestIndex = chartCurrent.reduce((best, value, index) => value < (chartCurrent[best] ?? Infinity) ? index : best, 0);
  const formatChartValue = (value: number) => chartMetric === 'count' ? `${round(value).toLocaleString('ko-KR')}건` : fmtWon(value);

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelectedRow(null), !!selectedRow);

  const modeLabels = {
    all: { volume: '사업 거래규모', revenue: '플랫폼/서비스 매출', count: '거래·주문', average: '평균 거래금액' },
    b2c: { volume: '총매출', revenue: '순매출', count: '주문', average: '객단가' },
    c2c: { volume: '거래액', revenue: '플랫폼 매출', count: '거래', average: '평균 거래액' },
    b2b: { volume: '주문금액', revenue: '확정 매출', count: '주문', average: '평균 주문금액' },
  }[mode];

  const chartOptions: { key: ChartMetric; label: string }[] = [
    { key: 'volume', label: modeLabels.volume },
    { key: 'revenue', label: modeLabels.revenue },
    { key: 'count', label: modeLabels.count },
    { key: 'average', label: modeLabels.average },
    { key: 'cancel', label: '취소·환불' },
  ];

  function changeMode(next: Mode) {
    setMode(next);
    setDimension(MODE_DIMENSIONS[next][0]);
    setSelectedRow(null);
    setChartMetric(next === 'c2c' ? 'volume' : 'revenue');
    setDateBasis(next === 'b2b' ? '매출 확정일' : next === 'c2c' ? '거래 완료일' : '결제일');
  }

  function pickRange(value: string) {
    setRange(value);
    if (value === '직접 설정') return;
    const mapped = value === '이번 분기' ? ['2026-07-01', TODAY] : quickRangeDates(value as QuickRange);
    setDraftStart(mapped[0]);
    setDraftEnd(mapped[1]);
    setStart(mapped[0]);
    setEnd(mapped[1]);
  }

  function applyFilters() {
    if (!draftStart || !draftEnd || draftStart > draftEnd) {
      setNotice('조회 시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }
    setStart(draftStart);
    setEnd(draftEnd);
    setRange('직접 설정');
    setNotice('조회 조건을 적용했습니다.');
    window.setTimeout(() => setNotice(''), 1800);
  }

  function resetFilters() {
    setStart('2026-08-01'); setEnd(TODAY); setDraftStart('2026-08-01'); setDraftEnd(TODAY);
    setRange('이번 달'); setCompare('이전 기간'); setSalesBasis('결제 완료 기준');
    setDateBasis(mode === 'b2b' ? '매출 확정일' : mode === 'c2c' ? '거래 완료일' : '결제일');
    setAmountBasis('세금 포함'); setChannel('전체 채널'); setTradeState('정상 거래'); setAdvanced(false);
  }

  const kpis = [
    { key: 'volume' as const, label: modeLabels.volume, value: fmtWon(metrics.volume), previous: previousMetrics.volume, definition: mode === 'all' ? 'B2C 판매액 + C2C 거래액(GMV) + B2B 주문금액' : '선택한 집계 기준의 전체 거래 발생 금액' },
    { key: 'revenue' as const, label: modeLabels.revenue, value: fmtWon(metrics.revenue), previous: previousMetrics.revenue, definition: mode === 'c2c' ? '거래액이 아닌 플랫폼 수수료 등 실제 귀속 매출' : '취소·환불·할인 및 조정을 반영한 통계 기준 매출' },
    { key: 'count' as const, label: modeLabels.count, value: `${metrics.count.toLocaleString('ko-KR')}건`, previous: previousMetrics.count, definition: '선택한 날짜 및 상태 기준에 포함된 유효 거래 건수' },
    { key: 'average' as const, label: modeLabels.average, value: fmtWon(metrics.average), previous: previousMetrics.average, definition: `${modeLabels.volume} ÷ ${modeLabels.count} 건수` },
  ];

  const columns: GridColumn[] = mode === 'b2c'
    ? [{ label: dimension.replace('별', '') }, { label: '주문', align: 'right' }, { label: '판매수량', align: 'right' }, { label: '총매출', align: 'right' }, { label: '할인', align: 'right' }, { label: '취소·환불', align: 'right' }, { label: '순매출', align: 'right' }, { label: '비중', align: 'right' }, { label: '전기 대비', align: 'right' }]
    : mode === 'c2c'
      ? [{ label: dimension.replace('별', '') }, { label: '거래', align: 'right' }, { label: '거래액', align: 'right' }, { label: '플랫폼 매출', align: 'right' }, { label: '취소·환불', align: 'right' }, { label: '판매자 정산대상', align: 'right' }, { label: '비중', align: 'right' }, { label: '전기 대비', align: 'right' }]
      : mode === 'b2b'
        ? [{ label: dimension.replace('별', '') }, { label: '주문', align: 'right' }, { label: '주문금액', align: 'right' }, { label: '취소·조정', align: 'right' }, { label: '확정 매출', align: 'right' }, { label: '평균 주문금액', align: 'right' }, { label: '비중', align: 'right' }, { label: '전기 대비', align: 'right' }]
        : [{ label: dimension.replace('별', '') }, { label: '거래·주문', align: 'right' }, { label: '사업 거래규모', align: 'right' }, { label: '플랫폼/서비스 매출', align: 'right' }, { label: '취소·환불', align: 'right' }, { label: '비중', align: 'right' }, { label: '전기 대비', align: 'right' }];

  const gridRows: GridRow[] = analysisRows.map((row) => {
    const changeColor = row.change >= 0 ? '#dc2626' : '#2563eb';
    const commonEnd: Cell[] = [
      { kind: 'text', text: `${row.share.toFixed(1)}%`, align: 'right', numeric: true },
      { kind: 'text', text: `${row.change >= 0 ? '▲' : '▼'} ${Math.abs(row.change).toFixed(1)}%`, align: 'right', color: changeColor, weight: 600, numeric: true },
    ];
    const cells: Cell[] = mode === 'b2c'
      ? [{ kind: 'stack', title: row.name, subtitle: `${dimension} 매출 상세` }, { kind: 'text', text: row.count.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: row.quantity.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.gross), align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.discount), align: 'right', color: '#71717a', numeric: true }, { kind: 'text', text: fmtWon(row.refund), align: 'right', color: '#b45309', numeric: true }, { kind: 'text', text: fmtWon(row.net), align: 'right', weight: 700, numeric: true }, ...commonEnd]
      : mode === 'c2c'
        ? [{ kind: 'stack', title: row.name, subtitle: `${dimension} 거래 상세` }, { kind: 'text', text: row.count.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.gross), align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.net), align: 'right', weight: 700, numeric: true }, { kind: 'text', text: fmtWon(row.refund), align: 'right', color: '#b45309', numeric: true }, { kind: 'text', text: fmtWon(row.settlement), align: 'right', numeric: true }, ...commonEnd]
        : mode === 'b2b'
          ? [{ kind: 'stack', title: row.name, subtitle: `${dimension} 주문 상세` }, { kind: 'text', text: row.count.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.gross), align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.refund + row.discount), align: 'right', color: '#b45309', numeric: true }, { kind: 'text', text: fmtWon(row.net), align: 'right', weight: 700, numeric: true }, { kind: 'text', text: fmtWon(row.average), align: 'right', numeric: true }, ...commonEnd]
          : [{ kind: 'stack', title: row.name, subtitle: row.id.toUpperCase() }, { kind: 'text', text: row.count.toLocaleString('ko-KR'), align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.gross), align: 'right', numeric: true }, { kind: 'text', text: fmtWon(row.net), align: 'right', weight: 700, numeric: true }, { kind: 'text', text: fmtWon(row.refund), align: 'right', color: '#b45309', numeric: true }, ...commonEnd];
    return { id: row.id, cells, onClick: () => setSelectedRow(row), bg: selectedRow?.id === row.id ? '#f7f8ff' : undefined };
  });

  const gridTemplate = mode === 'b2c'
    ? 'minmax(190px,1.4fr) 74px 78px 112px 96px 104px 112px 70px 82px'
    : mode === 'c2c'
      ? 'minmax(190px,1.4fr) 74px 112px 112px 104px 116px 70px 82px'
      : mode === 'b2b'
        ? 'minmax(190px,1.4fr) 74px 112px 104px 112px 118px 70px 82px'
        : 'minmax(190px,1.4fr) 82px 128px 136px 108px 70px 82px';

  const compositionRows = mode === 'all'
    ? buildRows('all', '비즈니스별', metrics, base)
    : analysisRows.slice(0, 3);
  const revenueDelta = delta(metrics.revenue, previousMetrics.revenue);
  const factors = mode === 'b2c'
    ? [['프리미엄 무선 헤드폰', metrics.revenue * 0.057], ['신규 구매 증가', metrics.revenue * 0.032], ['환불 증가', -metrics.revenue * 0.014]] as const
    : mode === 'c2c'
      ? [['디지털 기기 거래 증가', metrics.revenue * 0.061], ['안전결제 이용 증가', metrics.revenue * 0.028], ['거래 취소 증가', -metrics.revenue * 0.019]] as const
      : mode === 'b2b'
        ? [['회사 01 주문 증가', metrics.revenue * 0.052], ['신규 계약 매출', metrics.revenue * 0.034], ['납품 조정 증가', -metrics.revenue * 0.012]] as const
        : [['B2C 상품 판매 증가', metrics.revenue * 0.041], ['B2B 회사 01 주문', metrics.revenue * 0.029], ['C2C 환불 증가', -metrics.revenue * 0.011]] as const;

  const exportDefinitions = [
    { key: 'target', label: dimension.replace('별', ''), value: (row: AnalysisRow) => row.name },
    { key: 'count', label: modeLabels.count, value: (row: AnalysisRow) => row.count },
    { key: 'gross', label: modeLabels.volume, value: (row: AnalysisRow) => row.gross },
    { key: 'discount', label: mode === 'b2b' ? '조정' : '할인', value: (row: AnalysisRow) => row.discount },
    { key: 'refund', label: '취소·환불', value: (row: AnalysisRow) => row.refund },
    { key: 'net', label: modeLabels.revenue, value: (row: AnalysisRow) => row.net },
    { key: 'average', label: modeLabels.average, value: (row: AnalysisRow) => row.average },
    { key: 'share', label: '비중(%)', value: (row: AnalysisRow) => row.share.toFixed(1) },
    { key: 'change', label: '전기 대비(%)', value: (row: AnalysisRow) => row.change.toFixed(1) },
  ];

  function runDownload() {
    const fields = exportDefinitions.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string) => ({ name, headers: fields.map((field) => field.label), rows: buildRows(mode, name, metrics, base).map((row) => fields.map((field) => field.value(row))) });
    const trendRows = currentBuckets.map((bucket) => {
      const values = scaleMetrics(chartMetrics(bucket, mode), basisFactor);
      return [bucket.label, values.volume, values.revenue, values.count, values.average, values.cancelRefund];
    });
    const metricRow = (label: string, current: number, previous: number) => {
      const change = compare === '비교 없음' ? undefined : delta(current, previous);
      return { label, current, previous: compare === '비교 없음' ? undefined : previous, change: change?.abs, changeRate: change ? `${change.pct.toFixed(1)}%` : undefined };
    };
    downloadStatisticsReport({
      reportName: '매출 분석', mode: mode === 'all' ? '통합' : mode.toUpperCase(), period: `${start}~${end}`, comparisonPeriod: compare === '비교 없음' ? undefined : `${prevStart}~${prevEnd}`,
      filters: [['매출 기준', salesBasis], ['날짜 기준', dateBasis], ['금액 기준', amountBasis], ['거래 상태', tradeState], ['판매 채널', channel], ['집계 단위', granularity]],
      summary: [metricRow(modeLabels.volume, metrics.volume, previousMetrics.volume), metricRow(modeLabels.revenue, metrics.revenue, previousMetrics.revenue), metricRow(modeLabels.count, metrics.count, previousMetrics.count), metricRow(modeLabels.average, metrics.average, previousMetrics.average), metricRow('취소·환불액', metrics.cancelRefund, previousMetrics.cancelRefund)],
      trend: { name: '02_매출추이', headers: ['기간', modeLabels.volume, modeLabels.revenue, modeLabels.count, modeLabels.average, '취소·환불'], rows: trendRows },
      dimensions: [...MODE_DIMENSIONS[mode].map(dimensionSheet), { name: '증감요인', headers: ['요인', '증감 금액'], rows: factors.map(([label, value]) => [label, Math.round(value)]) }],
      definitions: [{ term: modeLabels.revenue, description: mode === 'c2c' ? '거래액이 아닌 플랫폼 수수료 등 실제 귀속 매출' : '취소·환불·할인 및 조정을 반영한 통계 기준 매출' }, { term: modeLabels.volume, description: mode === 'all' ? 'B2C 판매액, C2C 거래액, B2B 주문금액의 합계' : '선택한 집계 기준의 전체 거래 발생 금액' }, { term: modeLabels.average, description: `${modeLabels.volume}을 ${modeLabels.count} 건수로 나눈 금액` }, { term: '취소·환불액', description: '조회 기간에 취소 또는 환불로 차감된 금액' }],
      dataAsOf: '2026.08.31 16:55',
    });
    setDownloadOpen(false);
    setNotice('매출 전체 분석 리포트를 다운로드했습니다.');
    window.setTimeout(() => setNotice(''), 1800);
  }

  function openTransactions() {
    if (mode === 'c2c') navigate('/c2c/sales/trades');
    else if (mode === 'b2b') navigate('/orders/purchase');
    else navigate('/orders/processing');
  }

  return (
    <section className={`${shared.page} ${styles.page}`}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>매출 분석</h1>
            <p className={shared.subtitle}>B2C 판매 매출, C2C 거래액·플랫폼 매출, B2B 주문·확정 매출을 구분해 비교합니다.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setShowBasis((value) => !value)}><Info size={15} /> 집계 기준</button>
            <button type="button" className={styles.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button>
          </div>
        </div>

        <div className={styles.modeSwitch} aria-label="매출 분석 비즈니스 모드">
          {MODES.map((item) => <button key={item.key} type="button" className={mode === item.key ? styles.modeActive : ''} onClick={() => changeMode(item.key)}><strong>{item.label}</strong><span>{item.note}</span></button>)}
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterGrid}>
            <label className={styles.filterField}><span>기간</span><select value={range} onChange={(event) => pickRange(event.target.value)}>{['오늘', '최근 7일', '최근 30일', '이번 달', '지난 달', '이번 분기', '직접 설정'].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={`${styles.filterField} ${styles.dateField}`}><span>조회 기간</span><div className={styles.dateRange}><DatePicker controlSize="sm" value={draftStart} onChange={(event) => setDraftStart(event.target.value)} /><em>~</em><DatePicker controlSize="sm" value={draftEnd} onChange={(event) => setDraftEnd(event.target.value)} /></div></label>
            <label className={styles.filterField}><span>비교</span><select value={compare} onChange={(event) => setCompare(event.target.value)}><option>비교 없음</option><option>이전 기간</option></select></label>
            <label className={styles.filterField}><span>매출 기준</span><select value={salesBasis} onChange={(event) => setSalesBasis(event.target.value)}>{['주문 기준', '결제 완료 기준', '거래 완료 기준', '매출 확정 기준'].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={styles.filterField}><span>날짜 기준</span><select value={dateBasis} onChange={(event) => setDateBasis(event.target.value)}>{(mode === 'b2b' ? ['주문일', '납품 완료일', '매출 확정일'] : mode === 'c2c' ? ['결제일', '거래 완료일', '정산 확정일'] : ['주문일', '결제일', '배송 완료일', '매출 확정일']).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className={styles.filterField}><span>금액 기준</span><select value={amountBasis} onChange={(event) => setAmountBasis(event.target.value)}><option>세금 포함</option><option>공급가액</option></select></label>
            <div className={styles.filterActions}><button type="button" className={styles.detailButton} onClick={() => setAdvanced((value) => !value)}><SlidersHorizontal size={14} /> 상세 조건</button><button type="button" className={styles.resetButton} onClick={resetFilters}>초기화</button><button type="button" className={styles.applyButton} onClick={applyFilters}>조회</button></div>
          </div>
          {advanced && <div className={styles.advancedFilters}><label className={styles.filterField}><span>거래 상태</span><select value={tradeState} onChange={(event) => setTradeState(event.target.value)}><option>정상 거래</option><option>취소·환불 포함</option><option>완료 거래만</option></select></label><label className={styles.filterField}><span>판매 채널</span><select value={channel} onChange={(event) => setChannel(event.target.value)}><option>전체 채널</option><option>모바일 앱</option><option>웹</option><option>파트너 포털</option></select></label><div className={styles.filterDescription}>상세 조건은 KPI, 추이, 구성 및 상세 표에 동일하게 적용됩니다.</div></div>}
          <div className={styles.periodSummary}>조회 기간 <strong>{fmtDate(start)} ~ {fmtDate(end)}</strong>{compare !== '비교 없음' && <> · 비교 기간 <strong>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</strong></>} · 최근 집계 <strong>2026.08.31 16:55</strong></div>
        </div>

        {showBasis && <div className={styles.basisPanel}><Info size={16} /><div><strong>통계 기준 매출</strong><p>{mode === 'c2c' ? 'C2C 거래액은 구매자와 판매자 사이의 GMV이며, 플랫폼 매출에는 수수료 등 실제 귀속 금액만 포함합니다.' : mode === 'all' ? '사업 거래규모에는 B2C 판매액, C2C GMV, B2B 주문금액이 포함됩니다. 플랫폼/서비스 매출에는 실제 귀속 금액만 합산합니다.' : `${mode.toUpperCase()} ${modeLabels.revenue}은(는) 취소·환불 및 할인·조정을 반영한 운영 통계 기준이며 회계 매출과 다를 수 있습니다.`}</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
      </div>

      <div className={styles.body}>
        <div className={styles.kpiGrid}>
          {kpis.map((item) => {
            const change = compare === '비교 없음' ? null : delta(metricValue(metrics, item.key), item.previous);
            return <article key={item.key} className={styles.kpiCard}><div className={styles.kpiLabel}>{item.label}<span title={item.definition} aria-label={item.definition}><Info size={12} /></span></div><strong>{item.value}</strong>{change ? <div className={change.pct >= 0 ? styles.changeUp : styles.changeDown}>{change.pct >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(change.pct).toFixed(1)}% <span>· 이전 {item.key === 'count' ? `${round(item.previous).toLocaleString('ko-KR')}건` : fmtWon(item.previous)}</span></div> : <div className={styles.noCompare}>비교 기간 없음</div>}</article>;
          })}
        </div>

        <div className={styles.secondaryMetrics}><div><span>취소·환불액</span><strong>{fmtWon(metrics.cancelRefund)}</strong><em>{metrics.volume ? ((metrics.cancelRefund / metrics.volume) * 100).toFixed(1) : '0.0'}%</em></div><div><span>{mode === 'b2b' ? '매출 조정' : mode === 'c2c' ? '판매자 정산대상' : '할인·조정'}</span><strong>{mode === 'c2c' ? fmtWon(Math.max(0, metrics.volume - metrics.revenue - metrics.cancelRefund)) : fmtWon(metrics.discount)}</strong><em>{amountBasis}</em></div><div><span>데이터 기준</span><strong>2026.08.31 16:55</strong><em>5분 단위 집계</em></div></div>

        <section className={styles.card}>
          <div className={styles.cardHead}><div><h2>매출 추이</h2><p>{fmtDate(start)} ~ {fmtDate(end)}{compare !== '비교 없음' && ` · 이전 기간과 비교`}</p></div><div className={styles.legend}><span><i className={styles.legendCurrent} />현재 기간</span>{compare !== '비교 없음' && <span><i className={styles.legendPrevious} />비교 기간</span>}</div></div>
          <div className={styles.chartToolbar}><label><span>지표</span><select value={chartMetric} onChange={(event) => setChartMetric(event.target.value as ChartMetric)}>{chartOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><div className={styles.segmented}>{(['일별', '주별', '월별'] as Granularity[]).map((item) => <button key={item} type="button" className={granularity === item ? styles.segmentedActive : ''} onClick={() => setGranularity(item)}>{item}</button>)}</div></div>
          {chartCurrent.length ? <TrendChart current={chartCurrent} previous={compare === '비교 없음' ? undefined : chartPrevious} labels={currentBuckets.map((bucket) => bucket.label)} formatCount={chartMetric === 'count'} /> : <div className={styles.emptyState}><strong>해당 기간의 매출 데이터가 없습니다.</strong><span>기간 또는 필터 조건을 변경해 주세요.</span><button type="button" onClick={resetFilters}>필터 초기화</button></div>}
          <div className={styles.chartSummary}><div><span>기간 {modeLabels.revenue}</span><strong>{fmtWon(metrics.revenue)}</strong><em className={revenueDelta.pct >= 0 ? styles.changeUp : styles.changeDown}>{signedWon(revenueDelta.abs)} / {revenueDelta.pct >= 0 ? '+' : ''}{revenueDelta.pct.toFixed(1)}%</em></div><div><span>최고 구간</span><strong>{currentBuckets[highestIndex]?.label ?? '-'}</strong><em>{formatChartValue(chartCurrent[highestIndex] ?? 0)}</em></div><div><span>최저 구간</span><strong>{currentBuckets[lowestIndex]?.label ?? '-'}</strong><em>{formatChartValue(chartCurrent[lowestIndex] ?? 0)}</em></div></div>
        </section>

        <div className={styles.insightGrid}>
          <section className={styles.card}>
            <div className={styles.cardHead}><div><h2>{mode === 'all' ? '통합 매출 구성' : `${modeLabels.volume} 구성`}</h2><p>{mode === 'all' ? '거래규모와 실제 귀속 매출을 함께 표시합니다.' : `${dimension} 상위 항목`}</p></div></div>
            <div className={styles.compositionList}>{compositionRows.map((row) => <div key={row.id} className={styles.compositionItem}><div><strong>{row.name}</strong><span>{fmtWon(row.gross)}{mode === 'all' && ` · 귀속 ${fmtWon(row.net)}`}</span></div><em>{row.share.toFixed(1)}%</em><div className={styles.compositionTrack}><i style={{ width: `${row.share}%` }} /></div></div>)}</div>
          </section>
          <section className={styles.card}>
            <div className={styles.cardHead}><div><h2>증감 요인</h2><p>이전 기간 대비 {signedWon(revenueDelta.abs)}</p></div></div>
            <div className={styles.factorList}>{factors.map(([label, value]) => <div key={label}><span className={value >= 0 ? styles.factorPositive : styles.factorNegative}>{value >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}</span><strong>{label}</strong><em className={value >= 0 ? styles.changeUp : styles.changeDown}>{signedWon(value)}</em></div>)}</div>
            <p className={styles.factorNote}>금액 차이가 큰 항목을 단순 Difference Ranking으로 표시합니다.</p>
          </section>
        </div>

        <section className={styles.card}>
          <div className={styles.analysisHead}><div><h2>상세 분석</h2><p>행을 클릭하면 해당 항목의 구성과 실제 거래 이동 경로를 확인할 수 있습니다.</p></div><button type="button" className={styles.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button></div>
          <div className={styles.dimensionTabs}>{MODE_DIMENSIONS[mode].map((item) => <button key={item} type="button" className={dimension === item ? styles.dimensionActive : ''} onClick={() => setDimension(item)}>{item}</button>)}</div>
          <DataGrid columns={columns} rows={gridRows} gridTemplate={gridTemplate} minWidth={mode === 'b2c' ? '1120px' : '980px'} empty={!analysisRows.length} emptyText="해당 조건에 집계된 매출 데이터가 없습니다." emptySubtext="기간 또는 분석 기준을 변경해 주세요." />
        </section>
      </div>

      {selectedRow && <aside ref={drawerRef} className={styles.drawer} aria-label="매출 분석 상세"><div className={styles.drawerHead}><div><span>{mode === 'all' ? '통합' : mode.toUpperCase()} · {dimension}</span><h2>{selectedRow.name}</h2></div><button type="button" onClick={() => setSelectedRow(null)} aria-label="닫기"><X size={18} /></button></div><div className={styles.drawerBody}><div className={styles.drawerHero}><span>{modeLabels.revenue}</span><strong>{fmtWon(selectedRow.net)}</strong><em className={selectedRow.change >= 0 ? styles.changeUp : styles.changeDown}>{selectedRow.change >= 0 ? '▲' : '▼'} {Math.abs(selectedRow.change).toFixed(1)}%</em></div><div className={styles.drawerFacts}><div><span>{modeLabels.count}</span><strong>{selectedRow.count.toLocaleString('ko-KR')}건</strong></div><div><span>{modeLabels.volume}</span><strong>{fmtWon(selectedRow.gross)}</strong></div><div><span>취소·환불</span><strong>{fmtWon(selectedRow.refund)}</strong></div><div><span>{modeLabels.average}</span><strong>{fmtWon(selectedRow.average)}</strong></div><div><span>매출 비중</span><strong>{selectedRow.share.toFixed(1)}%</strong></div><div><span>비교 기간 추정</span><strong>{fmtWon(selectedRow.net / (1 + selectedRow.change / 100))}</strong></div></div><div className={styles.drawerSection}><h3>집계 조건</h3><p>{fmtDate(start)} ~ {fmtDate(end)} · {salesBasis} · {dateBasis} · {amountBasis}</p></div><div className={styles.drawerSection}><h3>금액 구성</h3><div className={styles.amountFlow}><span>거래 발생 <b>{fmtWon(selectedRow.gross)}</b></span><span>취소·환불 <b>-{fmtWon(selectedRow.refund)}</b></span><span>할인·조정 <b>-{fmtWon(selectedRow.discount)}</b></span><span>유효/귀속 매출 <b>{fmtWon(selectedRow.net)}</b></span></div></div></div><div className={styles.drawerFooter}><button type="button" className={styles.secondaryButton} onClick={() => setSelectedRow(null)}>닫기</button><button type="button" className={styles.primaryButton} onClick={openTransactions}>실제 거래 보기</button></div></aside>}

      {downloadOpen && <div className={styles.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}><div className={styles.dialog}><div className={styles.dialogHead}><div><span>매출 분석 다운로드</span><h2>{mode === 'all' ? '통합' : mode.toUpperCase()} · {dimension}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div><div className={styles.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>매출 기준 <b>{salesBasis}</b></span><span>금액 기준 <b>{amountBasis}</b></span></div><div className={styles.downloadFields}><strong>포함 항목</strong>{exportDefinitions.map((field) => <label key={field.key}><input type="checkbox" checked={downloadFields.has(field.key)} onChange={() => setDownloadFields((current) => { const next = new Set(current); if (next.has(field.key)) next.delete(field.key); else next.add(field.key); return next; })} />{field.label}</label>)}</div><div className={styles.dialogActions}><button type="button" className={styles.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={styles.primaryButton} disabled={!downloadFields.size} onClick={runDownload}><Download size={14} /> Excel 다운로드</button></div></div></div>}

      {notice && <div className={styles.toast}>{notice}</div>}
    </section>
  );
}
