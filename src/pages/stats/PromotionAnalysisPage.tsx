import { Download, Info, RefreshCw, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CommonSelect } from '../../components/common';
import { downloadStatisticsReport } from '../../lib/statisticsReport';
import { useOutsideClose } from '../../lib/useOutsideClose';
import shared from '../ops/opsShared.module.css';
import layout from './SalesAnalysisPage.module.css';
import styles from './PromotionAnalysisPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import {
  AUDIENCE_DIMENSION,
  MODES,
  MODE_LABELS,
  ORDER_LABEL,
  PROMOTION_TYPES,
  REVENUE_LABEL,
  TYPE_META,
  aggregate,
  audienceRows,
  categoryRows,
  delta,
  fmtCount,
  fmtDate,
  fmtDiscountRate,
  fmtEfficiency,
  fmtPct,
  fmtSignedPct,
  fmtWon,
  previousPeriod,
  productRows,
  promotionRows,
  quickRangeDates,
  summaryStats,
  trendSeries,
  typeBreakdown,
  type DimensionRow,
  type Mode,
  type PromotionRow,
  type QuickRange,
} from './promotionStatsData';

type Dimension = 'promotion' | 'product' | 'category' | 'audience';
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
const COMPARE_OPTIONS = ['이전 기간', '전년 동기', '비교 없음'] as const;

function TrendChart({ primary, secondary, labels }: { primary: number[]; secondary?: number[]; labels: string[] }) {
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
  return (
    <div className={layout.trendChart}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="프로모션 성과 추이 차트">
        {[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}
        {secondary && <polyline points={points(secondary)} className={layout.previousLine} />}
        <polyline points={points(primary)} className={layout.currentLine} />
      </svg>
      <div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

export function PromotionAnalysisPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('all');
  const [range, setRange] = useState<QuickRange>('최근 30일');
  const [compare, setCompare] = useState<typeof COMPARE_OPTIONS[number]>('이전 기간');
  const [typeFilter, setTypeFilter] = useState('전체');
  const [dimension, setDimension] = useState<Dimension>('promotion');
  const [trendMetric, setTrendMetric] = useState<'revenue' | 'orders' | 'discount'>('revenue');
  const [selected, setSelected] = useState<PromotionRow | DimensionRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.09.01 09:20');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['name', 'type', 'orders', 'gross', 'discount', 'net', 'aov', 'rate', 'efficiency', 'refund', 'change']));

  const [start, end] = quickRangeDates(range);
  const [prevStart, prevEnd] = previousPeriod(start, end);

  const agg = useMemo(() => aggregate(mode, start, end), [mode, start, end]);
  const prevAgg = useMemo(() => aggregate(mode, prevStart, prevEnd), [mode, prevStart, prevEnd]);

  const promoRowsAll = useMemo(() => promotionRows(mode, start, end), [mode, start, end]);
  const promoRowsFiltered = useMemo(() => typeFilter === '전체' ? promoRowsAll : promoRowsAll.filter((r) => r.type === typeFilter), [promoRowsAll, typeFilter]);
  const typeRows = useMemo(() => typeBreakdown(promoRowsAll), [promoRowsAll]);
  const summary = useMemo(() => summaryStats(mode, agg, prevAgg), [mode, agg, prevAgg]);

  const productDimRows = useMemo(() => productRows(mode, start, end), [mode, start, end]);
  const categoryDimRows = useMemo(() => categoryRows(mode, start, end), [mode, start, end]);
  const audienceDimRows = useMemo(() => audienceRows(mode, start, end), [mode, start, end]);

  const trendDays = trendSeries(mode, start, end);
  const trendLength = trendDays.length;
  const trendLabels = trendDays.map((r) => r.date.slice(5).replace('-', '.'));
  const trendValue = (metric: typeof trendMetric) => trendDays.map((r) => metric === 'revenue' ? r.netRevenue : metric === 'orders' ? r.promoOrders : r.discountCost);
  const primaryTrend = trendValue(trendMetric);
  const prevTrendDays = trendSeries(mode, prevStart, prevEnd);
  const secondaryTrend = compare === '비교 없음' ? undefined : prevTrendDays.map((r) => trendMetric === 'revenue' ? r.netRevenue : trendMetric === 'orders' ? r.promoOrders : r.discountCost).slice(0, trendLength);
  const metricLabels: Record<typeof trendMetric, string> = { revenue: '순매출', orders: '주문', discount: '혜택비용' };

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }

  function reset() {
    setRange('최근 30일'); setCompare('이전 기간'); setTypeFilter('전체'); setDimension('promotion');
  }

  const revenueGrowth = prevAgg.netRevenue ? delta(agg.netRevenue, prevAgg.netRevenue).pct : 0;
  const promoShare = agg.totalOrders ? (agg.promoOrders / agg.totalOrders) * 100 : 0;
  const aovDiff = agg.nonPromoAvgOrderValue ? delta(agg.avgOrderValue, agg.nonPromoAvgOrderValue).pct : 0;

  const kpis = [
    { key: 'revenue', label: REVENUE_LABEL[mode], value: fmtWon(agg.netRevenue), change: revenueGrowth, sub: '전기 대비' },
    { key: 'discount', label: '할인 / 혜택 비용', value: fmtWon(agg.discountCost), change: 0, sub: `매출 대비 ${fmtDiscountRate(agg.grossAmount, agg.discountCost)}`, noChange: true },
    { key: 'orders', label: ORDER_LABEL[mode], value: fmtCount(agg.promoOrders), change: 0, sub: `전체의 ${fmtPct(promoShare)}`, noChange: true },
    { key: 'aov', label: '평균 주문금액', value: fmtWon(agg.avgOrderValue), change: aovDiff, sub: '비프로모션 대비' },
  ];

  const dimensionRowsFor = (dim: Dimension): (PromotionRow | DimensionRow)[] => {
    if (dim === 'promotion') return promoRowsFiltered;
    if (dim === 'product') return productDimRows;
    if (dim === 'category') return categoryDimRows;
    return audienceDimRows;
  };
  const rows = dimensionRowsFor(dimension);

  const dimensionLabel = dimension === 'promotion' ? '프로모션' : dimension === 'product' ? '상품' : dimension === 'category' ? '카테고리' : AUDIENCE_DIMENSION[mode].replace('별', '');

  const columns: GridColumn[] = [
    { label: dimensionLabel },
    { label: '주문', align: 'right' },
    { label: '원 상품금액', align: 'right' },
    { label: '혜택비용', align: 'right' },
    { label: '순매출', align: 'right' },
    { label: '평균 주문금액', align: 'right' },
    { label: '효율', align: 'right' },
    { label: '취소·환불률', align: 'right' },
    { label: '전기 대비', align: 'right' },
  ];

  const gridRows: GridRow[] = rows.map((row) => {
    const efficiency = row.discountCost ? row.netRevenue / row.discountCost : 0;
    const change = row.prevNetRevenue ? delta(row.netRevenue, row.prevNetRevenue).pct : 0;
    const isPromo = 'code' in row;
    const cells: Cell[] = [
      { kind: 'stack', title: row.name, subtitle: isPromo ? `${(row as PromotionRow).code} · ${(row as PromotionRow).period}` : (row as DimensionRow).subtitle },
      { kind: 'text', text: fmtCount(row.orders), align: 'right', numeric: true },
      { kind: 'text', text: fmtWon(row.grossAmount), align: 'right', numeric: true },
      { kind: 'text', text: fmtWon(row.discountCost), align: 'right', numeric: true, color: '#c2410c' },
      { kind: 'text', text: fmtWon(row.netRevenue), align: 'right', numeric: true, weight: 700 },
      { kind: 'text', text: fmtWon(row.avgOrderValue), align: 'right', numeric: true },
      { kind: 'text', text: fmtEfficiency(efficiency), align: 'right', numeric: true, color: efficiency >= 5 ? '#059669' : undefined, weight: 700 },
      { kind: 'text', text: fmtPct(row.refundRate * 100), align: 'right', numeric: true, color: row.refundRate > 0.1 ? '#dc2626' : undefined, weight: row.refundRate > 0.1 ? 700 : undefined },
      { kind: 'text', text: fmtSignedPct(change), align: 'right', numeric: true, color: change >= 0 ? '#059669' : '#dc2626' },
    ];
    return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
  });

  const exportFields = [
    { key: 'name', label: dimensionLabel, value: (row: PromotionRow | DimensionRow) => row.name },
    { key: 'type', label: '유형', value: (row: PromotionRow | DimensionRow) => 'type' in row ? row.type : '-' },
    { key: 'orders', label: '주문', value: (row: PromotionRow | DimensionRow) => row.orders },
    { key: 'gross', label: '원 상품금액', value: (row: PromotionRow | DimensionRow) => row.grossAmount },
    { key: 'discount', label: '혜택비용', value: (row: PromotionRow | DimensionRow) => row.discountCost },
    { key: 'net', label: '순매출', value: (row: PromotionRow | DimensionRow) => row.netRevenue },
    { key: 'aov', label: '평균 주문금액', value: (row: PromotionRow | DimensionRow) => row.avgOrderValue },
    { key: 'rate', label: '혜택비용률', value: (row: PromotionRow | DimensionRow) => fmtDiscountRate(row.grossAmount, row.discountCost) },
    { key: 'efficiency', label: '효율', value: (row: PromotionRow | DimensionRow) => fmtEfficiency(row.discountCost ? row.netRevenue / row.discountCost : 0) },
    { key: 'refund', label: '취소/환불률', value: (row: PromotionRow | DimensionRow) => fmtPct(row.refundRate * 100) },
    { key: 'change', label: '이전 기간 대비', value: (row: PromotionRow | DimensionRow) => row.prevNetRevenue ? fmtSignedPct(delta(row.netRevenue, row.prevNetRevenue).pct) : '-' },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string, values: Array<PromotionRow | DimensionRow>) => ({ name, headers: fields.map((field) => field.label), rows: values.map((row) => fields.map((field) => field.value(row))) });
    downloadStatisticsReport({
      reportName: '프로모션 분석', mode: MODE_LABELS[mode], period: `${start}~${end}`, comparisonPeriod: compare === '비교 없음' ? undefined : `${prevStart}~${prevEnd}`,
      filters: [['프로모션 유형', typeFilter], ['비교', compare], ['현재 분석', dimensionLabel]],
      summary: [
        { label: REVENUE_LABEL[mode], current: agg.netRevenue, previous: compare === '비교 없음' ? undefined : prevAgg.netRevenue, change: compare === '비교 없음' ? undefined : agg.netRevenue - prevAgg.netRevenue, changeRate: compare === '비교 없음' ? undefined : `${revenueGrowth.toFixed(1)}%` },
        { label: '할인/혜택 비용', current: agg.discountCost, previous: compare === '비교 없음' ? undefined : prevAgg.discountCost },
        { label: ORDER_LABEL[mode], current: agg.promoOrders, previous: compare === '비교 없음' ? undefined : prevAgg.promoOrders },
        { label: '평균 주문금액', current: agg.avgOrderValue, previous: compare === '비교 없음' ? undefined : prevAgg.avgOrderValue, changeRate: `${aovDiff.toFixed(1)}%` },
      ],
      trend: { name: '02_성과추이', headers: ['일자', '순매출', '프로모션 주문', '혜택비용'], rows: trendDays.map((row) => [row.date, row.netRevenue, row.promoOrders, row.discountCost]) },
      dimensions: [dimensionSheet('프로모션별', promoRowsFiltered), dimensionSheet('상품별', productDimRows), dimensionSheet('카테고리별', categoryDimRows), dimensionSheet('고객군별', audienceDimRows)],
      definitions: [{ term: '순매출', description: '원 상품금액에서 할인·혜택 비용 및 취소·환불을 반영한 매출' }, { term: '혜택비용', description: '쿠폰·할인·포인트 등 프로모션으로 제공한 금액' }, { term: '효율', description: '혜택비용 1원당 발생한 순매출' }],
      dataAsOf: refreshedAt,
    });
    setDownloadOpen(false);
    flash('프로모션 전체 분석 리포트를 다운로드했습니다.');
  }

  const isPromoRow = (row: PromotionRow | DimensionRow): row is PromotionRow => 'code' in row;

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}>
        <div><h1 className={shared.title}>프로모션 분석</h1><p className={shared.subtitle}>혜택을 제공한 만큼 실제 거래·매출 성과가 있었는지 분석합니다.</p></div>
        <div className={layout.headerActions}>
          <button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((v) => !v)}><Info size={15} /> 집계 기준</button>
          <button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 프로모션 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button>
          <button type="button" className={layout.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button>
        </div>
      </div>

      <div className={layout.modeSwitch}>
        {MODES.map((m) => (
          <button key={m} type="button" className={mode === m ? layout.modeActive : ''} onClick={() => { setMode(m); setDimension('promotion'); setSelected(null); }}>
            <strong>{MODE_LABELS[m]}</strong>
            <span>{m === 'all' ? '전체 채널 통합' : m === 'b2c' ? '회원 대상 프로모션' : m === 'c2c' ? '판매자·구매자 혜택' : '거래처 전용 혜택'}</span>
          </button>
        ))}
      </div>

      <div className={layout.filterCard}>
        <div className={layout.filterGrid}>
          <label className={layout.filterField}><span>기간</span><CommonSelect className={layout.analysisSelect} size="sm" value={range} options={QUICK_RANGES.map((value) => ({ label: value, value }))} onChange={(value) => setRange(value as QuickRange)} /></label>
          <label className={layout.filterField}><span>비교</span><CommonSelect className={layout.analysisSelect} size="sm" value={compare} options={COMPARE_OPTIONS.map((value) => ({ label: value, value }))} onChange={(value) => setCompare(value as typeof COMPARE_OPTIONS[number])} /></label>
          <label className={layout.filterField}><span>프로모션 유형</span><CommonSelect className={layout.analysisSelect} size="sm" value={typeFilter} options={['전체', ...PROMOTION_TYPES].map((value) => ({ label: value, value }))} onChange={(value) => setTypeFilter(String(value))} /></label>
          <div className={layout.filterActions}><button type="button" className={layout.resetButton} onClick={reset}>초기화</button><button type="button" className={layout.applyButton} onClick={() => flash('조회 조건을 적용했습니다.')}>조회</button></div>
        </div>
        <div className={layout.periodSummary}>조회기간 <strong>{fmtDate(start)} ~ {fmtDate(end)}</strong> · 비교 <strong>{compare === '비교 없음' ? '없음' : `${fmtDate(prevStart)} ~ ${fmtDate(prevEnd)}`}</strong> · 최근 집계 <strong>{refreshedAt}</strong></div>
      </div>

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>프로모션 분석 집계 기준</strong><p>프로모션 매출은 조회 기간 동안 하나 이상의 프로모션이 적용된 주문의 순매출(원 상품금액 - 혜택비용)이며, 주문 단위로 중복 없이 집계합니다. 혜택비용은 상품 할인·쿠폰·배송비 면제 등 프로모션으로 제공된 혜택의 합계입니다. 프로모션별 값은 하나의 주문이 여러 프로모션에 포함될 수 있어 합산값이 상단 KPI와 다를 수 있습니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
    </div>

    <div className={layout.body}>
      <div className={layout.kpiGrid}>
        {kpis.map((item) => {
          const good = item.change >= 0;
          return (
            <article key={item.key} className={layout.kpiCard}>
              <div className={layout.kpiLabel}>{item.label}</div>
              <strong>{item.value}</strong>
              {item.noChange ? <div><span style={{ color: '#8b8b93', fontSize: '11.5px' }}>{item.sub}</span></div> : (
                <div className={good ? layout.changeUp : layout.changeDown}>{good ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(item.change).toFixed(1)}% <span>· {item.sub}</span></div>
              )}
            </article>
          );
        })}
      </div>

      <div className={styles.dedupNote}>프로모션별 매출은 하나의 주문에 여러 프로모션이 함께 적용될 수 있어 합산값이 전체 프로모션 매출과 다를 수 있습니다.</div>

      <section className={layout.card}>
        <div className={layout.cardHead}>
          <div><h2>프로모션 성과 추이</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div>
          <div className={layout.legend}><span><i className={layout.legendCurrent} />{metricLabels[trendMetric]}</span>{compare !== '비교 없음' && <span><i className={layout.legendPrevious} />비교 기간</span>}</div>
        </div>
        <div className={layout.chartToolbar}>
          <label><span>지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={trendMetric} options={Object.entries(metricLabels).map(([value, label]) => ({ label, value }))} onChange={(value) => setTrendMetric(value as typeof trendMetric)} /></label>
        </div>
        {primaryTrend.length ? <TrendChart primary={primaryTrend} secondary={secondaryTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 프로모션 데이터가 없습니다.</strong><span>기간 또는 조건을 변경해 주세요.</span><button type="button" onClick={reset}>필터 초기화</button></div>}
      </section>

      <div className={layout.insightGrid}>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>프로모션 유형별 성과</h2><p>순매출 기준 상위 유형입니다.</p></div></div>
          <div className={styles.typeList}>
            {typeRows.map((item) => {
              const max = typeRows[0]?.netRevenue || 1;
              return (
                <div key={item.type}>
                  <span className={styles.typeBadge} style={{ background: TYPE_META[item.type].bg, color: TYPE_META[item.type].fg }}>{item.type}</span>
                  <span className={styles.typeBar}><b style={{ width: `${(item.netRevenue / max) * 100}%` }} /></span>
                  <span className={styles.typeValue}>{fmtWon(item.netRevenue)}<span>효율 {fmtEfficiency(item.efficiency)}</span></span>
                </div>
              );
            })}
          </div>
        </section>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>성과 요약</h2><p>프로모션이 만든 전반적 효과입니다.</p></div></div>
          <div className={styles.summaryList}>{summary.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
        </section>
      </div>

      <section className={layout.card}>
        <div className={layout.analysisHead}>
          <div><h2>상세 분석</h2><p>분석 결과에서 프로모션을 직접 수정하지 않고 프로모션 관리·적용 이력으로 이동합니다.</p></div>
          <button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button>
        </div>
        <div className={layout.dimensionTabs}>
          <button type="button" className={dimension === 'promotion' ? layout.dimensionActive : ''} onClick={() => setDimension('promotion')}>프로모션별</button>
          <button type="button" className={dimension === 'product' ? layout.dimensionActive : ''} onClick={() => setDimension('product')}>상품별</button>
          <button type="button" className={dimension === 'category' ? layout.dimensionActive : ''} onClick={() => setDimension('category')}>카테고리별</button>
          <button type="button" className={dimension === 'audience' ? layout.dimensionActive : ''} onClick={() => setDimension('audience')}>{AUDIENCE_DIMENSION[mode]}</button>
        </div>
        <DataGrid columns={columns} rows={gridRows} gridTemplate="minmax(190px,1.6fr) 56px 90px 82px 94px 102px 50px 88px 74px" minWidth="930px" empty={!rows.length} emptyText="현재 조건에 해당하는 프로모션 데이터가 없습니다." emptySubtext="기간, 유형 또는 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} />
      </section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="프로모션 분석 상세">
      <div className={layout.drawerHead}><div><span>{MODE_LABELS[mode]} · {dimensionLabel}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div>
      <div className={layout.drawerBody}>
        <div className={layout.drawerHero}><span>순매출</span><strong>{fmtWon(selected.netRevenue)}</strong></div>
        <div className={layout.drawerFacts}>
          <div><span>원 상품금액</span><strong>{fmtWon(selected.grossAmount)}</strong></div>
          <div><span>혜택 비용</span><strong>{fmtWon(selected.discountCost)}</strong></div>
          <div><span>주문</span><strong>{fmtCount(selected.orders)}</strong></div>
          <div><span>평균 주문금액</span><strong>{fmtWon(selected.avgOrderValue)}</strong></div>
          <div><span>효율</span><strong>{fmtEfficiency(selected.discountCost ? selected.netRevenue / selected.discountCost : 0)}</strong></div>
          <div><span>취소·환불률</span><strong className={selected.refundRate > 0.1 ? styles.refundWarn : undefined}>{fmtPct(selected.refundRate * 100)}</strong></div>
        </div>
        <div className={layout.drawerSection}>
          <h3>매출 근거</h3>
          <div className={layout.amountFlow}><span>원 상품금액 <b>{fmtWon(selected.grossAmount)}</b></span><span>혜택비용 <b>-{fmtWon(selected.discountCost)}</b></span><span>순매출 <b>{fmtWon(selected.netRevenue)}</b></span></div>
        </div>
        {isPromoRow(selected) && <div className={layout.drawerSection}><h3>적용 대상</h3><p>{selected.target} · 적용기간 {selected.period}</p></div>}
        <div className={layout.drawerSection}><h3>분석 기준</h3><p>{fmtDate(start)} ~ {fmtDate(end)} · {MODE_LABELS[mode]} · 이전 기간 대비 {selected.prevNetRevenue ? fmtSignedPct(delta(selected.netRevenue, selected.prevNetRevenue).pct) : '데이터 없음'}</p></div>
      </div>
      <div className={layout.drawerFooter}>
        {isPromoRow(selected) && <button type="button" className={layout.secondaryButton} onClick={() => navigate(`/promotions/applications?code=${encodeURIComponent(selected.code)}`)}>적용 이력 보기</button>}
        {isPromoRow(selected) && <button type="button" className={layout.primaryButton} onClick={() => navigate(`/promotions/list?code=${encodeURIComponent(selected.code)}`)}>프로모션 상세 보기</button>}
      </div>
    </aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}>
      <div className={layout.dialog}>
        <div className={layout.dialogHead}><div><span>프로모션 분석 다운로드</span><h2>{MODE_LABELS[mode]} · {dimensionLabel}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className={layout.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>Mode <b>{MODE_LABELS[mode]}</b></span><span>분석 기준 <b>{dimensionLabel}</b></span></div>
        <StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} />
        <div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div>
      </div>
    </div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
