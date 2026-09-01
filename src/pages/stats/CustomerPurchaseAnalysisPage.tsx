import { ArrowRight, Download, Info, RefreshCw, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Fragment, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { CommonSelect } from '../../components/common';
import { downloadStatisticsReport } from '../../lib/statisticsReport';
import { useOutsideClose } from '../../lib/useOutsideClose';
import shared from '../ops/opsShared.module.css';
import layout from './SalesAnalysisPage.module.css';
import styles from './CustomerPurchaseAnalysisPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import {
  AOV_LABEL,
  AUDIENCE_TAB_LABEL,
  AUDIENCE_UNIT,
  CUSTOMER_LABEL,
  MODES,
  MODE_LABELS,
  NEW_CUSTOMER_LABEL,
  REPURCHASE_LABEL,
  SEGMENT_META,
  aggregate,
  audienceRows,
  categoryPreferenceRows,
  cycleRows,
  delta,
  dormancyBreakdown,
  fmtCount,
  fmtDate,
  fmtOrders,
  fmtPct,
  fmtSignedPct,
  fmtWon,
  frequencyBreakdown,
  newVsExisting,
  previousPeriod,
  productPreferenceRows,
  quickRangeDates,
  repeatPurchaseFunnel,
  segmentRows,
  trendSeries,
  type DimensionRow,
  type Mode,
  type QuickRange,
  type Segment,
} from './customerPurchaseStatsData';

type Dimension = 'segment' | 'cycle' | 'product' | 'category' | 'audience';
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
const COMPARE_OPTIONS = ['이전 기간', '전년 동기', '비교 없음'] as const;
type TrendMetric = 'customers' | 'newCustomers' | 'repeatCustomers' | 'amount';

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
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="구매 고객 추이 차트">
        {[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}
        {secondary && <polyline points={points(secondary)} className={layout.previousLine} />}
        <polyline points={points(primary)} className={layout.currentLine} />
      </svg>
      <div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

export function CustomerPurchaseAnalysisPage({ defaultMode = 'all' }: { defaultMode?: Mode } = {}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [range, setRange] = useState<QuickRange>('최근 30일');
  const [compare, setCompare] = useState<typeof COMPARE_OPTIONS[number]>('이전 기간');
  const [customerType, setCustomerType] = useState('전체');
  const [dimension, setDimension] = useState<Dimension>('segment');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('customers');
  const [selected, setSelected] = useState<DimensionRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.09.01 09:20');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['name', 'customers', 'orders', 'amount', 'aov', 'repurchase', 'share', 'change']));

  const [start, end] = quickRangeDates(range);
  const [prevStart, prevEnd] = previousPeriod(start, end);

  const agg = useMemo(() => aggregate(mode, start, end), [mode, start, end]);
  const prevAgg = useMemo(() => aggregate(mode, prevStart, prevEnd), [mode, prevStart, prevEnd]);

  const composition = useMemo(() => newVsExisting(agg), [agg]);
  const frequency = useMemo(() => frequencyBreakdown(agg), [agg]);
  const repeatFunnel = useMemo(() => repeatPurchaseFunnel(agg), [agg]);
  const dormancy = useMemo(() => dormancyBreakdown(agg), [agg]);

  const segRows = useMemo(() => segmentRows(mode, start, end), [mode, start, end]);
  const cycRows = useMemo(() => cycleRows(mode, start, end), [mode, start, end]);
  const prodRows = useMemo(() => productPreferenceRows(mode, start, end), [mode, start, end]);
  const catRows = useMemo(() => categoryPreferenceRows(mode, start, end), [mode, start, end]);
  const audRows = useMemo(() => audienceRows(mode, start, end), [mode, start, end]);

  const trendDays = trendSeries(mode, start, end);
  const trendLabels = trendDays.map((r) => r.date.slice(5).replace('-', '.'));
  const trendValue = (metric: TrendMetric) => trendDays.map((r) => metric === 'customers' ? r.customers : metric === 'newCustomers' ? r.newCustomers : metric === 'repeatCustomers' ? r.repeatCustomers : r.amount);
  const primaryTrend = trendValue(trendMetric);
  const prevTrendDays = trendSeries(mode, prevStart, prevEnd);
  const secondaryTrend = compare === '비교 없음' ? undefined : prevTrendDays.map((r) => trendMetric === 'customers' ? r.customers : trendMetric === 'newCustomers' ? r.newCustomers : trendMetric === 'repeatCustomers' ? r.repeatCustomers : r.amount).slice(0, trendLabels.length);
  const metricLabels: Record<TrendMetric, string> = { customers: CUSTOMER_LABEL[mode], newCustomers: NEW_CUSTOMER_LABEL[mode], repeatCustomers: '재구매 고객', amount: '구매금액' };

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }
  function reset() {
    setRange('최근 30일'); setCompare('이전 기간'); setCustomerType('전체'); setDimension('segment');
  }

  const customerGrowth = prevAgg.customers ? delta(agg.customers, prevAgg.customers).pct : 0;
  const newShare = agg.customers ? (agg.newCustomers / agg.customers) * 100 : 0;
  const repurchaseChange = prevAgg.repurchaseRate ? agg.repurchaseRate - prevAgg.repurchaseRate : 0;
  const aovChange = prevAgg.amountPerCustomer ? delta(agg.amountPerCustomer, prevAgg.amountPerCustomer).pct : 0;
  const avgFrequency = agg.customers ? agg.orders / agg.customers : 0;
  const prevAvgFrequency = prevAgg.customers ? prevAgg.orders / prevAgg.customers : 0;
  const frequencyChange = prevAvgFrequency ? delta(avgFrequency, prevAvgFrequency).pct : 0;

  const kpis = [
    { key: 'customers', label: CUSTOMER_LABEL[mode], value: `${fmtCount(agg.customers).replace('건', AUDIENCE_UNIT[mode])}`, change: customerGrowth, sub: '전기 대비' },
    { key: 'new', label: NEW_CUSTOMER_LABEL[mode], value: `${agg.newCustomers.toLocaleString('ko-KR')}${AUDIENCE_UNIT[mode]}`, change: 0, sub: `전체의 ${fmtPct(newShare)}`, noChange: true },
    { key: 'repurchase', label: REPURCHASE_LABEL[mode], value: fmtPct(agg.repurchaseRate), change: repurchaseChange, sub: '전기 대비', isPoint: true },
    { key: 'aov', label: AOV_LABEL[mode], value: fmtWon(agg.amountPerCustomer), change: aovChange, sub: '전기 대비' },
  ];

  const dimensionRowsFor = (dim: Dimension): DimensionRow[] => {
    if (dim === 'segment') return segRows;
    if (dim === 'cycle') return cycRows;
    if (dim === 'product') return prodRows;
    if (dim === 'category') return catRows;
    return audRows;
  };
  const rows = dimensionRowsFor(dimension);
  const dimensionLabel = dimension === 'segment' ? '세그먼트' : dimension === 'cycle' ? '구매 주기' : dimension === 'product' ? '상품' : dimension === 'category' ? '카테고리' : AUDIENCE_TAB_LABEL[mode].replace('별', '');

  const columns: GridColumn[] = [
    { label: dimensionLabel },
    { label: '고객수', align: 'right' },
    { label: '구매횟수', align: 'right' },
    { label: '구매금액', align: 'right' },
    { label: '객단가', align: 'right' },
    { label: REPURCHASE_LABEL[mode], align: 'right' },
    { label: '비중', align: 'right' },
  ];

  const gridRows: GridRow[] = rows.map((row) => {
    const change = row.prevAmount ? delta(row.amount, row.prevAmount).pct : 0;
    const segmentMeta = dimension === 'segment' ? SEGMENT_META[row.name as Segment] : undefined;
    const cells: Cell[] = [
      segmentMeta
        ? { kind: 'badgeSub', text: row.name, subText: row.subtitle, bg: segmentMeta.bg, fg: segmentMeta.fg }
        : { kind: 'stack', title: row.name, subtitle: row.subtitle },
      { kind: 'text', text: `${row.customers.toLocaleString('ko-KR')}${AUDIENCE_UNIT[mode]}`, align: 'right', numeric: true },
      { kind: 'text', text: fmtCount(row.orders), align: 'right', numeric: true },
      { kind: 'text', text: fmtWon(row.amount), align: 'right', numeric: true, weight: 700 },
      { kind: 'text', text: fmtWon(row.avgOrderValue), align: 'right', numeric: true },
      { kind: 'text', text: fmtPct(row.repurchaseRate), align: 'right', numeric: true, color: row.repurchaseRate < 20 ? '#dc2626' : row.repurchaseRate > 60 ? '#059669' : undefined, weight: 700 },
      { kind: 'text', text: fmtSignedPct(change), align: 'right', numeric: true, color: change >= 0 ? '#059669' : '#dc2626' },
    ];
    return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
  });

  const exportFields = [
    { key: 'name', label: dimensionLabel, value: (row: DimensionRow) => row.name },
    { key: 'customers', label: '고객수', value: (row: DimensionRow) => row.customers },
    { key: 'orders', label: '구매횟수', value: (row: DimensionRow) => row.orders },
    { key: 'amount', label: '구매금액', value: (row: DimensionRow) => row.amount },
    { key: 'aov', label: '객단가', value: (row: DimensionRow) => row.avgOrderValue },
    { key: 'repurchase', label: REPURCHASE_LABEL[mode], value: (row: DimensionRow) => fmtPct(row.repurchaseRate) },
    { key: 'share', label: '매출 비중', value: (row: DimensionRow) => fmtPct(row.share) },
    { key: 'change', label: '이전 기간 대비', value: (row: DimensionRow) => row.prevAmount ? fmtSignedPct(delta(row.amount, row.prevAmount).pct) : '-' },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string, values: DimensionRow[]) => ({ name, headers: fields.map((field) => field.label), rows: values.map((row) => fields.map((field) => field.value(row))) });
    downloadStatisticsReport({
      reportName: mode === 'b2b' ? '거래처 구매 분석' : '고객 구매 분석', mode: MODE_LABELS[mode], period: `${start}~${end}`, comparisonPeriod: compare === '비교 없음' ? undefined : `${prevStart}~${prevEnd}`,
      filters: [['고객 유형', customerType], ['비교', compare], ['현재 분석', dimensionLabel]],
      summary: [
        { label: CUSTOMER_LABEL[mode], current: agg.customers, previous: compare === '비교 없음' ? undefined : prevAgg.customers, change: compare === '비교 없음' ? undefined : agg.customers - prevAgg.customers, changeRate: compare === '비교 없음' ? undefined : `${customerGrowth.toFixed(1)}%` },
        { label: NEW_CUSTOMER_LABEL[mode], current: agg.newCustomers, previous: compare === '비교 없음' ? undefined : prevAgg.newCustomers },
        { label: REPURCHASE_LABEL[mode], current: `${agg.repurchaseRate.toFixed(2)}%`, previous: compare === '비교 없음' ? undefined : `${prevAgg.repurchaseRate.toFixed(2)}%`, change: compare === '비교 없음' ? undefined : `${repurchaseChange.toFixed(2)}%p` },
        { label: AOV_LABEL[mode], current: agg.amountPerCustomer, previous: compare === '비교 없음' ? undefined : prevAgg.amountPerCustomer, changeRate: compare === '비교 없음' ? undefined : `${aovChange.toFixed(1)}%` },
        { label: '평균 구매 빈도', current: Number(avgFrequency.toFixed(2)), previous: compare === '비교 없음' ? undefined : Number(prevAvgFrequency.toFixed(2)), changeRate: compare === '비교 없음' ? undefined : `${frequencyChange.toFixed(1)}%` },
      ],
      trend: { name: '02_구매추이', headers: ['일자', '구매 고객', '신규 고객', '재구매 고객', '구매금액'], rows: trendDays.map((row) => [row.date, row.customers, row.newCustomers, row.repeatCustomers, row.amount]) },
      dimensions: [
        { name: '반복구매Funnel', headers: ['단계', '고객 수', '첫 구매 대비(%)', '이전 단계 대비(%)'], rows: repeatFunnel.map((row) => [row.label, row.count, Number(row.pctOfStart.toFixed(2)), row.stepRate == null ? '-' : Number(row.stepRate.toFixed(2))]) },
        { name: '구매이탈징후', headers: ['구분', `${CUSTOMER_LABEL[mode]} 수`], rows: dormancy.map((row) => [row.label, row.count]) },
        dimensionSheet('RFM', segRows), dimensionSheet('구매주기', cycRows), dimensionSheet('상품선호', prodRows), dimensionSheet('카테고리선호', catRows), dimensionSheet('고객군별', audRows),
        { name: '신규기존', headers: ['구분', '고객 수', '비중(%)'], rows: composition.map((row) => [row.label, row.count, Number(row.pct.toFixed(2))]) },
        { name: '구매빈도', headers: ['구분', '고객 수', '비중(%)'], rows: frequency.map((row) => [row.label, row.count, Number(row.pct.toFixed(2))]) },
      ],
      definitions: [{ term: '구매 고객', description: '조회 기간 내 유효 구매가 1건 이상 존재하는 고유 고객' }, { term: '재구매율', description: '조회 기간 내 2회 이상 구매한 고객의 비율' }, { term: '고객당 구매금액', description: '전체 구매금액을 구매 고객 수로 나눈 금액' }, { term: '평균 구매 빈도', description: '조회 기간의 유효 주문건수를 구매 고객 수로 나눈 값' }, { term: '구매 이탈 징후', description: '과거 구매 경험이 있으나 기준 일수 동안 추가 구매가 없는 고객 수(누적 추정치)' }, { term: 'RFM', description: '최근 구매일·구매 빈도·구매 금액을 이용한 고객 세그먼트' }],
    });
    setDownloadOpen(false);
    flash('고객 구매 전체 분석 리포트를 다운로드했습니다.');
  }

  function goToMemberList(row: DimensionRow) {
    if (mode === 'b2b') return navigate(`/partners/companies?name=${encodeURIComponent(row.name)}`);
    return navigate(`/members?segment=${encodeURIComponent(row.name)}`);
  }

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}>
        <div><h1 className={shared.title}>{mode === 'b2b' ? '거래처 구매 분석' : '고객 구매 분석'}</h1><p className={shared.subtitle}>어떤 고객이 얼마나 자주, 얼마나 많이 구매하고 다시 구매하는지 분석합니다.</p></div>
        <div className={layout.headerActions}>
          <button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((v) => !v)}><Info size={15} /> 집계 기준</button>
          <button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 구매 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button>
          <button type="button" className={layout.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button>
        </div>
      </div>

      <div className={layout.modeSwitch}>
        {MODES.map((m) => (
          <button key={m} type="button" className={mode === m ? layout.modeActive : ''} onClick={() => { setMode(m); setDimension('segment'); setSelected(null); }}>
            <strong>{MODE_LABELS[m]}</strong>
            <span>{m === 'all' ? '전체 채널 통합' : m === 'b2c' ? '회원 구매 행동' : m === 'c2c' ? '구매자 거래 행동' : '거래처 발주 행동'}</span>
          </button>
        ))}
      </div>

      <div className={layout.filterCard}>
        <div className={layout.filterGrid}>
          <label className={layout.filterField}><span>기간</span><CommonSelect className={layout.analysisSelect} size="sm" value={range} options={QUICK_RANGES.map((value) => ({ label: value, value }))} onChange={(value) => setRange(value as QuickRange)} /></label>
          <label className={layout.filterField}><span>비교</span><CommonSelect className={layout.analysisSelect} size="sm" value={compare} options={COMPARE_OPTIONS.map((value) => ({ label: value, value }))} onChange={(value) => setCompare(value as typeof COMPARE_OPTIONS[number])} /></label>
          <label className={layout.filterField}><span>고객 유형</span><CommonSelect className={layout.analysisSelect} size="sm" value={customerType} options={['전체', '신규', '기존'].map((value) => ({ label: value, value }))} onChange={(value) => setCustomerType(value as string)} /></label>
          <div className={layout.filterActions}><button type="button" className={layout.resetButton} onClick={reset}>초기화</button><button type="button" className={layout.applyButton} onClick={() => flash('조회 조건을 적용했습니다.')}>조회</button></div>
        </div>
        <div className={layout.periodSummary}>조회기간 <strong>{fmtDate(start)} ~ {fmtDate(end)}</strong> · 비교 <strong>{compare === '비교 없음' ? '없음' : `${fmtDate(prevStart)} ~ ${fmtDate(prevEnd)}`}</strong> · 최근 집계 <strong>{refreshedAt}</strong></div>
      </div>

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>고객 구매 분석 집계 기준</strong><p>{CUSTOMER_LABEL[mode]}은 조회기간 동안 유효 구매가 1건 이상 있는 고유 고객입니다. {NEW_CUSTOMER_LABEL[mode]}은 조회기간에 생애 첫 유효 구매가 발생한 고객이며, {REPURCHASE_LABEL[mode]}은 분석 대상 중 누적 구매 2회 이상인 고객 비율입니다. {AOV_LABEL[mode]}은 순매출을 {CUSTOMER_LABEL[mode]} 수로 나눈 값입니다. 평균 구매 빈도는 유효 주문건수를 {CUSTOMER_LABEL[mode]} 수로 나눈 값이며, 구매 이탈 징후는 과거 구매 경험이 있으나 기준 일수 동안 추가 구매가 없는 고객 규모의 누적 추정치입니다. 전체 취소·환불된 주문은 유효 구매에서 제외합니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
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
                <div className={good ? layout.changeUp : layout.changeDown}>{good ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(item.change).toFixed(1)}{item.isPoint ? 'p' : '%'} <span>· {item.sub}</span></div>
              )}
            </article>
          );
        })}
      </div>

      <div className={layout.secondaryMetrics}>
        <div><span>평균 구매 빈도</span><strong>{fmtOrders(avgFrequency)}</strong><em className={frequencyChange >= 0 ? layout.changeUp : layout.changeDown}>전기 대비 {fmtSignedPct(frequencyChange)}</em></div>
        <div><span>90일 이상 미구매</span><strong>{(dormancy.find((d) => d.label.startsWith('90일'))?.count ?? 0).toLocaleString('ko-KR')}{AUDIENCE_UNIT[mode]}</strong><em>구매 경험 보유자 기준</em></div>
        <div><span>180일 이상 미구매</span><strong>{(dormancy.find((d) => d.label.startsWith('180일'))?.count ?? 0).toLocaleString('ko-KR')}{AUDIENCE_UNIT[mode]}</strong><em className={layout.changeDown}>장기 이탈 가능성</em></div>
      </div>

      <section className={layout.card}>
        <div className={layout.cardHead}><div><h2>반복 구매 Funnel</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div></div>
        <div className={styles.funnelRow}>
          {repeatFunnel.map((step, index) => (
            <Fragment key={step.label}>
              {index > 0 && (
                <div className={styles.funnelArrow}>
                  <ArrowRight size={16} />
                  <span className={styles.funnelArrowRate}>{step.stepRate?.toFixed(1)}%</span>
                </div>
              )}
              <div className={`${styles.funnelStep} ${index === repeatFunnel.length - 1 ? styles.funnelStepFinal : ''}`}>
                <span className={styles.funnelStepLabel}>{step.label}</span>
                <span className={styles.funnelStepCount}>{step.count.toLocaleString('ko-KR')}</span>
                <span className={styles.funnelStepPct}>{fmtPct(step.pctOfStart)}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <section className={layout.card}>
        <div className={layout.cardHead}><div><h2>구매 이탈 징후</h2><p>구매 경험이 있으나 오랫동안 재구매가 없는 {CUSTOMER_LABEL[mode]} 수입니다.</p></div></div>
        <div className={styles.dormancyList}>
          {dormancy.map((row) => <div key={row.label}><span>{row.label}</span><strong>{row.count.toLocaleString('ko-KR')}{AUDIENCE_UNIT[mode]}</strong></div>)}
        </div>
      </section>

      <section className={layout.card}>
        <div className={layout.cardHead}>
          <div><h2>구매 고객 / 매출 추이</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div>
          <div className={layout.legend}><span><i className={layout.legendCurrent} />{metricLabels[trendMetric]}</span>{compare !== '비교 없음' && <span><i className={layout.legendPrevious} />비교 기간</span>}</div>
        </div>
        <div className={layout.chartToolbar}>
          <label><span>지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={trendMetric} options={Object.entries(metricLabels).map(([value, label]) => ({ label, value }))} onChange={(value) => setTrendMetric(value as TrendMetric)} /></label>
        </div>
        {primaryTrend.length ? <TrendChart primary={primaryTrend} secondary={secondaryTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 구매 데이터가 없습니다.</strong><span>기간 또는 조건을 변경해 주세요.</span><button type="button" onClick={reset}>필터 초기화</button></div>}
      </section>

      <div className={layout.insightGrid}>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>신규 / 기존 구성</h2><p>{CUSTOMER_LABEL[mode]} 중 신규·기존 비중입니다.</p></div></div>
          <div className={styles.compositionList}>
            {composition.map((item) => (
              <div key={item.label}>
                <span className={styles.compositionLabel}>{item.label}</span>
                <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
                <span className={styles.compositionValue}>{fmtPct(item.pct)}<span>{item.count.toLocaleString('ko-KR')}{AUDIENCE_UNIT[mode]}</span></span>
              </div>
            ))}
          </div>
        </section>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>구매 빈도</h2><p>조회기간 내 구매 횟수 구간별 비중입니다.</p></div></div>
          <div className={styles.compositionList}>
            {frequency.map((item) => (
              <div key={item.label}>
                <span className={styles.compositionLabel}>{item.label}</span>
                <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
                <span className={styles.compositionValue}>{fmtPct(item.pct)}<span>{item.count.toLocaleString('ko-KR')}{AUDIENCE_UNIT[mode]}</span></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={layout.card}>
        <div className={layout.analysisHead}>
          <div><h2>상세 분석</h2><p>분석 결과에서 바로 수정하지 않고 회원·거래처 원본 화면으로 이동합니다.</p></div>
          <button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button>
        </div>
        <div className={layout.dimensionTabs}>
          <button type="button" className={dimension === 'segment' ? layout.dimensionActive : ''} onClick={() => setDimension('segment')}>고객 세그먼트</button>
          <button type="button" className={dimension === 'cycle' ? layout.dimensionActive : ''} onClick={() => setDimension('cycle')}>구매 주기</button>
          <button type="button" className={dimension === 'product' ? layout.dimensionActive : ''} onClick={() => setDimension('product')}>상품 선호</button>
          <button type="button" className={dimension === 'category' ? layout.dimensionActive : ''} onClick={() => setDimension('category')}>카테고리별</button>
          <button type="button" className={dimension === 'audience' ? layout.dimensionActive : ''} onClick={() => setDimension('audience')}>{AUDIENCE_TAB_LABEL[mode]}</button>
        </div>
        <DataGrid columns={columns} rows={gridRows} gridTemplate="minmax(190px,1.6fr) 100px 100px 130px 110px 100px 90px" minWidth="1080px" empty={!rows.length} emptyText="현재 조건에 해당하는 구매 데이터가 없습니다." emptySubtext="기간, 고객 유형 또는 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} />
      </section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="고객 구매 분석 상세">
      <div className={layout.drawerHead}><div><span>{MODE_LABELS[mode]} · {dimensionLabel}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div>
      <div className={layout.drawerBody}>
        <div className={layout.drawerHero}><span>구매금액</span><strong>{fmtWon(selected.amount)}</strong></div>
        <div className={layout.drawerFacts}>
          <div><span>고객수</span><strong>{selected.customers.toLocaleString('ko-KR')}{AUDIENCE_UNIT[mode]}</strong></div>
          <div><span>구매횟수</span><strong>{fmtCount(selected.orders)}</strong></div>
          <div><span>객단가</span><strong>{fmtWon(selected.avgOrderValue)}</strong></div>
          <div><span>{REPURCHASE_LABEL[mode]}</span><strong className={selected.repurchaseRate < 20 ? styles.warnValue : undefined}>{fmtPct(selected.repurchaseRate)}</strong></div>
          <div><span>매출 비중</span><strong>{fmtPct(selected.share)}</strong></div>
          <div><span>이전 기간 대비</span><strong>{selected.prevAmount ? fmtSignedPct(delta(selected.amount, selected.prevAmount).pct) : '데이터 없음'}</strong></div>
        </div>
        <div className={layout.drawerSection}><h3>비고</h3><p>{selected.subtitle}</p></div>
        <div className={layout.drawerSection}><h3>분석 기준</h3><p>{fmtDate(start)} ~ {fmtDate(end)} · {MODE_LABELS[mode]}</p></div>
      </div>
      <div className={layout.drawerFooter}>
        <button type="button" className={layout.primaryButton} onClick={() => goToMemberList(selected)}>{mode === 'b2b' ? '거래처 목록에서 보기' : '회원 목록에서 보기'}</button>
      </div>
    </aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}>
      <div className={layout.dialog}>
        <div className={layout.dialogHead}><div><span>고객 구매 분석 다운로드</span><h2>{MODE_LABELS[mode]} · {dimensionLabel}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className={layout.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>Mode <b>{MODE_LABELS[mode]}</b></span><span>분석 기준 <b>{dimensionLabel}</b></span></div>
        <StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} />
        <div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div>
      </div>
    </div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
