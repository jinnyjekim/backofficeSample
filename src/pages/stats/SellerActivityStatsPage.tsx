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
import styles from './SellerActivityStatsPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import {
  ENTITY_LABEL,
  MODES,
  MODE_LABELS,
  QUALITY_META,
  SEGMENTS,
  SEGMENT_META,
  aggregate,
  delta,
  fmtDate,
  fmtPct,
  fmtWon,
  funnelSteps,
  previousPeriod,
  quickRangeDates,
  segmentSummary,
  sellerRows,
  trendSeries,
  type ActivitySegment,
  type Mode,
  type QuickRange,
  type SellerRow,
  type SellerStatus,
} from './sellerActivityStatsData';

type Dimension = 'sellers' | 'segment' | 'quality';
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type TrendMetric = 'activeSellers' | 'newSellers' | 'productRegSellers' | 'dealSellers' | 'saleCompleteSellers';

function TrendChart({ primary, labels }: { primary: number[]; labels: string[] }) {
  const max = Math.max(...primary, 1);
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
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="판매자 활동 추이 차트">
        {[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}
        <polyline points={points(primary)} className={layout.currentLine} />
      </svg>
      <div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

export function SellerActivityStatsPage({ defaultMode = 'c2c' }: { defaultMode?: Mode } = {}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [range, setRange] = useState<QuickRange>('최근 30일');
  const [segmentFilter, setSegmentFilter] = useState<'전체' | ActivitySegment>('전체');
  const [statusFilter, setStatusFilter] = useState<'전체' | SellerStatus>('전체');
  const [minDealsOnly, setMinDealsOnly] = useState(false);
  const [dimension, setDimension] = useState<Dimension>('sellers');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('activeSellers');
  const [selected, setSelected] = useState<SellerRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.09.01 09:20');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['name', 'segment', 'lastActive', 'products', 'deals', 'gmv', 'rate', 'quality']));

  const [start, end] = quickRangeDates(range);
  const [prevStart, prevEnd] = previousPeriod(start, end);

  const agg = useMemo(() => aggregate(mode, start, end), [mode, start, end]);
  const prevAgg = useMemo(() => aggregate(mode, prevStart, prevEnd), [mode, prevStart, prevEnd]);
  const steps = useMemo(() => funnelSteps(mode, agg), [mode, agg]);

  const allRows = useMemo(() => sellerRows(mode, start, end), [mode, start, end]);
  const segSummary = useMemo(() => segmentSummary(allRows), [allRows]);

  const filteredRows = useMemo(() => allRows
    .filter((row) => segmentFilter === '전체' || row.segment === segmentFilter)
    .filter((row) => statusFilter === '전체' || row.status === statusFilter)
    .filter((row) => !minDealsOnly || row.dealCount >= 30), [allRows, segmentFilter, statusFilter, minDealsOnly]);

  const sellerTabRows = useMemo(() => [...filteredRows].sort((a, b) => b.dealCount - a.dealCount), [filteredRows]);
  const qualityTabRows = useMemo(() => [...filteredRows].sort((a, b) => (b.disputeRate + b.cancelRate) - (a.disputeRate + a.cancelRate)), [filteredRows]);

  const trendDays = trendSeries(mode, start, end);
  const trendLabels = trendDays.map((r) => r.date.slice(5).replace('-', '.'));
  const primaryTrend = trendDays.map((r) => r[trendMetric]);
  const metricLabels: Record<TrendMetric, string> = { activeSellers: `활성 ${ENTITY_LABEL[mode]}`, newSellers: `신규 ${ENTITY_LABEL[mode]}`, productRegSellers: '상품 등록', dealSellers: '거래 발생', saleCompleteSellers: '판매 성사' };

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }
  function reset() {
    setRange('최근 30일'); setSegmentFilter('전체'); setStatusFilter('전체'); setMinDealsOnly(false); setDimension('sellers');
  }

  const activeGrowth = prevAgg.activeSellers ? delta(agg.activeSellers, prevAgg.activeSellers).pct : 0;
  const newGrowth = prevAgg.newSellers ? delta(agg.newSellers, prevAgg.newSellers).pct : 0;
  const productGrowth = prevAgg.productRegSellers ? delta(agg.productRegSellers, prevAgg.productRegSellers).pct : 0;
  const dealGrowth = prevAgg.dealSellers ? delta(agg.dealSellers, prevAgg.dealSellers).pct : 0;

  const kpis = [
    { key: 'active', label: `활성 ${ENTITY_LABEL[mode]}`, value: `${agg.activeSellers.toLocaleString('ko-KR')}명`, change: activeGrowth, sub: '전기 대비' },
    { key: 'new', label: `신규 ${ENTITY_LABEL[mode]}`, value: `${agg.newSellers.toLocaleString('ko-KR')}명`, change: newGrowth, sub: '전기 대비' },
    { key: 'product', label: '상품 등록', value: `${agg.productRegSellers.toLocaleString('ko-KR')}명`, sub: `활성의 ${fmtPct(agg.activeSellers ? (agg.productRegSellers / agg.activeSellers) * 100 : 0)}`, change: productGrowth },
    { key: 'deal', label: '거래 발생', value: `${agg.dealSellers.toLocaleString('ko-KR')}명`, sub: `활성의 ${fmtPct(agg.activeSellers ? (agg.dealSellers / agg.activeSellers) * 100 : 0)}`, change: dealGrowth },
  ];

  const churnRisk = allRows.filter((r) => r.segment === '휴면위험' || r.segment === '휴면').length;

  const columns: GridColumn[] = dimension === 'sellers'
    ? [{ label: ENTITY_LABEL[mode] }, { label: '세그먼트' }, { label: '최근 활동' }, { label: '등록 상품', align: 'right' }, { label: '거래 완료', align: 'right' }, { label: '판매금액', align: 'right' }, { label: '성사율', align: 'right' }, { label: '운영 품질' }]
    : dimension === 'quality'
    ? [{ label: ENTITY_LABEL[mode] }, { label: '거래', align: 'right' }, { label: '성사율', align: 'right' }, { label: '취소율', align: 'right' }, { label: '분쟁률', align: 'right' }, { label: '신고', align: 'right' }, { label: '평균 응답', align: 'right' }, { label: '운영 품질' }]
    : [{ label: '세그먼트' }, { label: `${ENTITY_LABEL[mode]} 수`, align: 'right' }, { label: '비중', align: 'right' }];

  function goToSellerDetail(row: SellerRow) {
    if (mode === 'b2b') return navigate(`/partners/companies?keyword=${encodeURIComponent(row.name)}`);
    return navigate(`/c2c/sales/sellers?keyword=${encodeURIComponent(row.name)}`);
  }

  const gridRows: GridRow[] = dimension === 'segment'
    ? segSummary.map((row) => {
        const cells: Cell[] = [
          { kind: 'badge', text: row.segment, bg: SEGMENT_META[row.segment].bg, fg: SEGMENT_META[row.segment].fg },
          { kind: 'text', text: `${row.count.toLocaleString('ko-KR')}명`, align: 'right', numeric: true },
          { kind: 'text', text: fmtPct(row.pct), align: 'right', numeric: true },
        ];
        return { id: row.segment, cells, onClick: () => { setSegmentFilter(row.segment); setDimension('sellers'); } };
      })
    : (dimension === 'sellers' ? sellerTabRows : qualityTabRows).map((row) => {
        const quality = QUALITY_META[row.qualityGrade];
        const cells: Cell[] = dimension === 'sellers'
          ? [
              { kind: 'stack', title: row.name, subtitle: row.status },
              { kind: 'badge', text: row.segment, bg: SEGMENT_META[row.segment].bg, fg: SEGMENT_META[row.segment].fg },
              { kind: 'text', text: fmtDate(row.lastActiveDate) },
              { kind: 'stack', title: `${row.cumulativeProducts.toLocaleString('ko-KR')}개`, subtitle: `신규 ${row.newProducts.toLocaleString('ko-KR')}개` },
              { kind: 'text', text: `${row.dealCompleted.toLocaleString('ko-KR')}건`, align: 'right', numeric: true, weight: 700 },
              { kind: 'text', text: fmtWon(row.gmv), align: 'right', numeric: true },
              { kind: 'text', text: fmtPct(row.successRate), align: 'right', numeric: true, color: row.successRate < 50 ? '#dc2626' : row.successRate > 85 ? '#059669' : undefined },
              { kind: 'badge', text: row.qualityGrade, bg: quality.bg, fg: quality.fg },
            ]
          : [
              { kind: 'stack', title: row.name, subtitle: row.status },
              { kind: 'text', text: `${row.dealCount.toLocaleString('ko-KR')}건`, align: 'right', numeric: true },
              { kind: 'text', text: fmtPct(row.successRate), align: 'right', numeric: true, color: row.successRate < 50 ? '#dc2626' : undefined },
              { kind: 'text', text: fmtPct(row.cancelRate), align: 'right', numeric: true, color: row.cancelRate >= 10 ? '#dc2626' : undefined },
              { kind: 'text', text: fmtPct(row.disputeRate), align: 'right', numeric: true, color: row.disputeRate >= 6 ? '#dc2626' : undefined },
              { kind: 'text', text: `${row.reportCount.toLocaleString('ko-KR')}건`, align: 'right', numeric: true, color: '#a1a1aa' },
              { kind: 'text', text: `${row.avgResponseMinutes >= 60 ? `${(row.avgResponseMinutes / 60).toFixed(1)}시간` : `${Math.round(row.avgResponseMinutes)}분`}`, align: 'right', numeric: true },
              { kind: 'badge', text: row.qualityGrade, bg: quality.bg, fg: quality.fg },
            ];
        return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
      });

  const gridTemplate = dimension === 'sellers'
    ? 'minmax(150px,1.3fr) 90px 100px 130px 90px 120px 90px 90px'
    : dimension === 'quality'
    ? 'minmax(150px,1.3fr) 80px 80px 80px 80px 70px 90px 90px'
    : 'minmax(140px,1fr) 120px 120px';

  const exportFields = [
    { key: 'name', label: ENTITY_LABEL[mode], value: (row: SellerRow) => row.name },
    { key: 'segment', label: '세그먼트', value: (row: SellerRow) => row.segment },
    { key: 'lastActive', label: '최근 활동', value: (row: SellerRow) => row.lastActiveDate },
    { key: 'products', label: '등록 상품', value: (row: SellerRow) => row.cumulativeProducts },
    { key: 'deals', label: '거래 완료', value: (row: SellerRow) => row.dealCompleted },
    { key: 'gmv', label: '판매금액', value: (row: SellerRow) => row.gmv },
    { key: 'rate', label: '성사율', value: (row: SellerRow) => fmtPct(row.successRate) },
    { key: 'quality', label: '운영 품질', value: (row: SellerRow) => row.qualityGrade },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    downloadStatisticsReport({
      reportName: '판매자 활동', mode: MODE_LABELS[mode], period: `${start}~${end}`, comparisonPeriod: `${prevStart}~${prevEnd}`,
      filters: [['조회 범위', range], ['세그먼트', segmentFilter], ['상태', statusFilter]],
      summary: [
        { label: `활성 ${ENTITY_LABEL[mode]}`, current: agg.activeSellers, previous: prevAgg.activeSellers, change: agg.activeSellers - prevAgg.activeSellers, changeRate: `${activeGrowth.toFixed(1)}%` },
        { label: `신규 ${ENTITY_LABEL[mode]}`, current: agg.newSellers, previous: prevAgg.newSellers, change: agg.newSellers - prevAgg.newSellers, changeRate: `${newGrowth.toFixed(1)}%` },
        { label: '상품 등록', current: agg.productRegSellers, previous: prevAgg.productRegSellers },
        { label: '거래 발생', current: agg.dealSellers, previous: prevAgg.dealSellers },
        { label: '평균 응답시간(분)', current: Number(agg.avgResponseMinutes.toFixed(1)), previous: Number(prevAgg.avgResponseMinutes.toFixed(1)) },
        { label: '취소율(%)', current: Number(agg.cancelRate.toFixed(2)), previous: Number(prevAgg.cancelRate.toFixed(2)) },
        { label: '분쟁률(%)', current: Number(agg.disputeRate.toFixed(2)), previous: Number(prevAgg.disputeRate.toFixed(2)) },
      ],
      trend: { name: '02_활동추이', headers: ['일자', ...Object.values(metricLabels)], rows: trendDays.map((row) => [row.date, row.activeSellers, row.newSellers, row.productRegSellers, row.dealSellers, row.saleCompleteSellers]) },
      dimensions: [
        { name: 'Funnel', headers: ['단계', '인원', '활성 대비(%)', '이전 단계 대비(%)'], rows: steps.map((row) => [row.label, row.count, Number(row.pctOfStart.toFixed(2)), row.stepRate == null ? '-' : Number(row.stepRate.toFixed(2))]) },
        { name: `${ENTITY_LABEL[mode]}별`, headers: fields.map((field) => field.label), rows: allRows.map((row) => fields.map((field) => field.value(row))) },
        { name: '활동 구간', headers: ['세그먼트', `${ENTITY_LABEL[mode]} 수`, '비중(%)'], rows: segSummary.map((row) => [row.segment, row.count, Number(row.pct.toFixed(2))]) },
      ],
      definitions: [
        { term: `활성 ${ENTITY_LABEL[mode]}`, description: '조회기간 동안 상품 등록·수정·거래 응답·판매 완료 등 판매 관련 유효 활동이 1건 이상 발생한 대상 수' },
        { term: `신규 ${ENTITY_LABEL[mode]}`, description: '조회기간에 판매 권한이 최초 활성화된 대상 수' },
        { term: '상품 등록', description: '조회기간 동안 신규 상품을 1건 이상 등록한 대상 수' },
        { term: '거래 발생', description: '조회기간 동안 거래가 1건 이상 발생한 대상 수' },
        { term: '평균 응답시간', description: '거래 요청부터 최초 유효 응답까지 걸린 평균 시간' },
        { term: '운영 품질', description: '취소율·분쟁률 기준 정상/주의/위험 3단계로 분류한 값' },
      ],
      dataAsOf: refreshedAt,
    });
    setDownloadOpen(false);
    flash('판매자 활동 분석 리포트를 다운로드했습니다.');
  }

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}>
        <div><h1 className={shared.title}>판매자 활동</h1><p className={shared.subtitle}>{ENTITY_LABEL[mode]}가 얼마나 활발하게 상품을 등록하고 거래에 응답하며 판매를 성사시키는지 분석합니다.</p></div>
        <div className={layout.headerActions}>
          <button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((v) => !v)}><Info size={15} /> 집계 기준</button>
          <button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 판매자 활동 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button>
          <button type="button" className={layout.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button>
        </div>
      </div>

      <div className={layout.modeSwitch}>
        {MODES.map((m) => (
          <button key={m} type="button" className={mode === m ? layout.modeActive : ''} onClick={() => { setMode(m); setDimension('sellers'); setSelected(null); setSegmentFilter('전체'); }}>
            <strong>{MODE_LABELS[m]}</strong>
            <span>{m === 'c2c' ? '개인 판매자 활동' : '공급사 활동'}</span>
          </button>
        ))}
      </div>

      <div className={layout.filterCard}>
        <div className={layout.filterGrid}>
          <label className={layout.filterField}><span>기간</span><CommonSelect className={layout.analysisSelect} size="sm" value={range} options={QUICK_RANGES.map((value) => ({ label: value, value }))} onChange={(value) => setRange(value as QuickRange)} /></label>
          <label className={layout.filterField}><span>세그먼트</span><CommonSelect className={layout.analysisSelect} size="sm" value={segmentFilter} options={['전체', ...SEGMENTS].map((value) => ({ label: value, value }))} onChange={(value) => setSegmentFilter(value as typeof segmentFilter)} /></label>
          <label className={layout.filterField}><span>상태</span><CommonSelect className={layout.analysisSelect} size="sm" value={statusFilter} options={['전체', '활동중', '휴면'].map((value) => ({ label: value, value }))} onChange={(value) => setStatusFilter(value as typeof statusFilter)} /></label>
          <label className={layout.filterField}><span>표본 조건</span><CommonSelect className={layout.analysisSelect} size="sm" value={minDealsOnly ? 'min' : 'all'} options={[{ label: `전체 ${ENTITY_LABEL[mode]}`, value: 'all' }, { label: '거래 30건 이상', value: 'min' }]} onChange={(value) => setMinDealsOnly(value === 'min')} /></label>
          <div className={layout.filterActions}><button type="button" className={layout.resetButton} onClick={reset}>초기화</button><button type="button" className={layout.applyButton} onClick={() => flash('조회 조건을 적용했습니다.')}>조회</button></div>
        </div>
        <div className={layout.periodSummary}>조회기간 <strong>{fmtDate(start)} ~ {fmtDate(end)}</strong> · 비교 <strong>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</strong> · 최근 집계 <strong>{refreshedAt}</strong></div>
      </div>

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>판매자 활동 집계 기준</strong><p>활성 {ENTITY_LABEL[mode]}은 조회기간 동안 상품 등록·수정·거래 응답·판매 완료 등 판매 관련 유효 활동이 1건 이상 발생한 대상이며, 단순 로그인만 한 경우는 포함하지 않습니다. 신규 {ENTITY_LABEL[mode]}은 조회기간에 판매 권한이 최초 활성화된 대상입니다. 운영 품질은 취소율·분쟁률을 기준으로 정상/주의/위험 3단계로 분류하며, Ranking에는 왜곡을 막기 위해 최소 거래건수 조건을 적용할 수 있습니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
    </div>

    <div className={layout.body}>
      <div className={layout.kpiGrid}>
        {kpis.map((item) => {
          const good = (item.change ?? 0) >= 0;
          return (
            <article key={item.key} className={layout.kpiCard}>
              <div className={layout.kpiLabel}>{item.label}</div>
              <strong>{item.value}</strong>
              <div className={good ? layout.changeUp : layout.changeDown}>{good ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(item.change ?? 0).toFixed(1)}% <span>· {item.sub}</span></div>
            </article>
          );
        })}
      </div>

      <div className={layout.secondaryMetrics}>
        <div><span>평균 응답시간</span><strong>{agg.avgResponseMinutes >= 60 ? `${(agg.avgResponseMinutes / 60).toFixed(1)}시간` : `${Math.round(agg.avgResponseMinutes)}분`}</strong><em>거래 요청 → 최초 응답</em></div>
        <div><span>거래 취소율</span><strong className={agg.cancelRate >= 10 ? styles.warnValue : undefined}>{fmtPct(agg.cancelRate)}</strong><em>거래 기준</em></div>
        <div><span>분쟁률</span><strong className={agg.disputeRate >= 6 ? styles.warnValue : undefined}>{fmtPct(agg.disputeRate)}</strong><em>거래 기준</em></div>
        <div><span>신고 발생 {ENTITY_LABEL[mode]}</span><strong>{agg.reportedSellers.toLocaleString('ko-KR')}명</strong><em>활성의 {fmtPct(agg.activeSellers ? (agg.reportedSellers / agg.activeSellers) * 100 : 0)}</em></div>
      </div>

      <section className={layout.card}>
        <div className={layout.cardHead}><div><h2>{ENTITY_LABEL[mode]} 활동 단계</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div></div>
        <div className={styles.funnelRow}>
          {steps.map((step, index) => (
            <Fragment key={step.label}>
              {index > 0 && (
                <div className={styles.funnelArrow}>
                  <ArrowRight size={16} />
                  <span className={styles.funnelArrowRate}>{step.stepRate?.toFixed(1)}%</span>
                </div>
              )}
              <div className={`${styles.funnelStep} ${index === steps.length - 1 ? styles.funnelStepFinal : ''}`}>
                <span className={styles.funnelStepLabel}>{step.label}</span>
                <span className={styles.funnelStepCount}>{step.count.toLocaleString('ko-KR')}</span>
                <span className={styles.funnelStepPct}>{fmtPct(step.pctOfStart)}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <section className={layout.card}>
        <div className={layout.cardHead}>
          <div><h2>{ENTITY_LABEL[mode]} 활동 추이</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div>
          <div className={layout.legend}><span><i className={layout.legendCurrent} />{metricLabels[trendMetric]}</span></div>
        </div>
        <div className={layout.chartToolbar}>
          <label><span>지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={trendMetric} options={Object.entries(metricLabels).map(([value, label]) => ({ label, value }))} onChange={(value) => setTrendMetric(value as TrendMetric)} /></label>
        </div>
        {primaryTrend.length ? <TrendChart primary={primaryTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 판매자 활동 데이터가 없습니다.</strong><span>기간 또는 조건을 변경해 주세요.</span><button type="button" onClick={reset}>필터 초기화</button></div>}
        <div className={layout.chartSummary}>
          <div><span>거래 건수</span><strong>{agg.dealCount.toLocaleString('ko-KR')}건</strong><em>조회기간 발생</em></div>
          <div><span>거래 완료</span><strong>{agg.dealCompletedCount.toLocaleString('ko-KR')}건</strong><em className={layout.changeUp}>{ENTITY_LABEL[mode]} 기준 성사율 {fmtPct(agg.dealSuccessRate)}</em></div>
          <div><span>판매 거래액</span><strong>{fmtWon(agg.gmv)}</strong><em>거래 완료 기준</em></div>
        </div>
      </section>

      <div className={layout.insightGrid}>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>활동 Segment 분포</h2><p>전체 {ENTITY_LABEL[mode]} 기준입니다. 클릭 시 해당 세그먼트로 필터링됩니다.</p></div></div>
          <div className={styles.segmentList}>
            {segSummary.map((item) => (
              <div key={item.segment} style={{ cursor: 'pointer' }} onClick={() => { setSegmentFilter(item.segment); setDimension('sellers'); }}>
                <span className={styles.segmentLabel}>{item.segment}</span>
                <span className={styles.segmentBar}><b style={{ width: `${item.pct}%`, background: SEGMENT_META[item.segment].fg }} /></span>
                <span className={styles.segmentValue}>{fmtPct(item.pct)}<span>{item.count.toLocaleString('ko-KR')}명</span></span>
              </div>
            ))}
          </div>
        </section>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>이탈 위험 {ENTITY_LABEL[mode]}</h2><p>최근 30일 이상 활동이 없는 대상입니다.</p></div></div>
          <div className={layout.drawerHero}><span>휴면위험 + 휴면</span><strong>{churnRisk.toLocaleString('ko-KR')}명</strong></div>
          <p style={{ fontSize: '12.5px', color: '#71717a', margin: '10px 0 14px' }}>과거 활동 이력이 있으나 최근 30일 이상 판매 관련 활동이 없는 {ENTITY_LABEL[mode]}입니다. 이탈 전 관리가 필요할 수 있습니다.</p>
          <button type="button" className={layout.secondaryButton} onClick={() => { setSegmentFilter('휴면위험'); setDimension('sellers'); }}>{ENTITY_LABEL[mode]} 목록에서 보기</button>
        </section>
      </div>

      <section className={layout.card}>
        <div className={layout.analysisHead}>
          <div><h2>상세 분석</h2><p>분석 결과에서 바로 제재하지 않고 {ENTITY_LABEL[mode]} 상세로 이동합니다.</p></div>
          <button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button>
        </div>
        <div className={layout.dimensionTabs}>
          <button type="button" className={dimension === 'sellers' ? layout.dimensionActive : ''} onClick={() => setDimension('sellers')}>{ENTITY_LABEL[mode]}별</button>
          <button type="button" className={dimension === 'segment' ? layout.dimensionActive : ''} onClick={() => setDimension('segment')}>활동 구간</button>
          <button type="button" className={dimension === 'quality' ? layout.dimensionActive : ''} onClick={() => setDimension('quality')}>운영 품질</button>
        </div>
        <DataGrid columns={columns} rows={gridRows} gridTemplate={gridTemplate} minWidth={dimension === 'segment' ? '480px' : '980px'} empty={!gridRows.length} emptyText={`현재 조건에 해당하는 ${ENTITY_LABEL[mode]} 데이터가 없습니다.`} emptySubtext="기간 또는 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} />
      </section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="판매자 활동 상세">
      <div className={layout.drawerHead}><div><span>{MODE_LABELS[mode]} · {selected.segment}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div>
      <div className={layout.drawerBody}>
        <div className={layout.drawerHero}><span>판매금액</span><strong>{fmtWon(selected.gmv)}</strong></div>
        <div className={layout.drawerFacts}>
          <div><span>등록 상품</span><strong>{selected.cumulativeProducts.toLocaleString('ko-KR')}개</strong></div>
          <div><span>거래 완료</span><strong>{selected.dealCompleted.toLocaleString('ko-KR')}건</strong></div>
          <div><span>성사율</span><strong className={selected.successRate < 50 ? styles.warnValue : undefined}>{fmtPct(selected.successRate)}</strong></div>
          <div><span>취소율</span><strong className={selected.cancelRate >= 10 ? styles.warnValue : undefined}>{fmtPct(selected.cancelRate)}</strong></div>
          <div><span>분쟁률</span><strong className={selected.disputeRate >= 6 ? styles.warnValue : undefined}>{fmtPct(selected.disputeRate)}</strong></div>
          <div><span>평균 응답</span><strong>{selected.avgResponseMinutes >= 60 ? `${(selected.avgResponseMinutes / 60).toFixed(1)}시간` : `${Math.round(selected.avgResponseMinutes)}분`}</strong></div>
          <div><span>신고 건수</span><strong>{selected.reportCount.toLocaleString('ko-KR')}건</strong></div>
          <div><span>최근 활동일</span><strong>{fmtDate(selected.lastActiveDate)}</strong></div>
        </div>
        <div className={layout.drawerSection}><h3>운영 품질</h3><p><span className={styles.qualityBadge} style={{ background: QUALITY_META[selected.qualityGrade].bg, color: QUALITY_META[selected.qualityGrade].fg }}>{selected.qualityGrade}</span> 취소율·분쟁률 기준으로 산정된 상태입니다.</p></div>
        <div className={layout.drawerSection}><h3>분석 기준</h3><p>{fmtDate(start)} ~ {fmtDate(end)} · {MODE_LABELS[mode]}</p></div>
      </div>
      <div className={layout.drawerFooter}>
        <button type="button" className={layout.primaryButton} onClick={() => goToSellerDetail(selected)}>{ENTITY_LABEL[mode]} 상세에서 보기</button>
      </div>
    </aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}>
      <div className={layout.dialog}>
        <div className={layout.dialogHead}><div><span>판매자 활동 다운로드</span><h2>{MODE_LABELS[mode]}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className={layout.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>Mode <b>{MODE_LABELS[mode]}</b></span></div>
        <StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} />
        <div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div>
      </div>
    </div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
