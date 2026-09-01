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
import styles from './TransactionConversionStatsPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import {
  CONVERTED_LABEL,
  FOURTH_DIMENSION_LABEL,
  MODES,
  MODE_LABELS,
  START_LABEL,
  aggregate,
  categoryRows,
  conversionRateTrend,
  delta,
  failureBreakdown,
  fmtCount,
  fmtDate,
  fmtPct,
  fmtSignedPct,
  fourthDimensionRows,
  funnelSteps,
  previousPeriod,
  productRows,
  quickRangeDates,
  transactionTypeRows,
  type DimensionRow,
  type Mode,
  type QuickRange,
} from './TransactionConversionStatsData';

type Dimension = 'product' | 'category' | 'type' | 'fourth';
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];

function RateTrendChart({ primary, secondary, labels }: { primary: number[]; secondary?: number[]; labels: string[] }) {
  const max = Math.max(...primary, ...(secondary ?? []), 10);
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
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="거래 성사율 추이 차트">
        {[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}
        {secondary && <polyline points={points(secondary)} className={layout.previousLine} />}
        <polyline points={points(primary)} className={layout.currentLine} />
      </svg>
      <div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

export function TransactionConversionStatsPage({ defaultMode = 'all' }: { defaultMode?: Mode } = {}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [range, setRange] = useState<QuickRange>('최근 30일');
  const [compare, setCompare] = useState<'이전 기간' | '비교 없음'>('이전 기간');
  const [dimension, setDimension] = useState<Dimension>('product');
  const [selected, setSelected] = useState<DimensionRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.09.01 09:20');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['name', 'started', 'converted', 'rate', 'failed', 'progress', 'lead', 'change']));

  const [start, end] = quickRangeDates(range);
  const [prevStart, prevEnd] = previousPeriod(start, end);

  const agg = useMemo(() => aggregate(mode, start, end), [mode, start, end]);
  const prevAgg = useMemo(() => aggregate(mode, prevStart, prevEnd), [mode, prevStart, prevEnd]);

  const steps = useMemo(() => funnelSteps(mode, agg), [mode, agg]);
  const reasons = useMemo(() => failureBreakdown(mode, agg), [mode, agg]);

  const prodRows = useMemo(() => productRows(mode, start, end), [mode, start, end]);
  const catRows = useMemo(() => categoryRows(mode, start, end), [mode, start, end]);
  const typeRows = useMemo(() => transactionTypeRows(mode, start, end), [mode, start, end]);
  const fourthRows = useMemo(() => fourthDimensionRows(mode, start, end), [mode, start, end]);

  const trendLabels = useMemo(() => {
    const totalDays = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(5, 10).replace('-', '.');
    });
  }, [start, end]);
  const primaryRateTrend = useMemo(() => conversionRateTrend(mode, start, end), [mode, start, end]);
  const prevRateTrend = useMemo(() => conversionRateTrend(mode, prevStart, prevEnd), [mode, prevStart, prevEnd]);
  const secondaryRateTrend = compare === '비교 없음' ? undefined : prevRateTrend.slice(0, primaryRateTrend.length);

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }
  function reset() {
    setRange('최근 30일'); setCompare('이전 기간'); setDimension('product');
  }

  const startGrowth = prevAgg.started ? delta(agg.started, prevAgg.started).pct : 0;
  const convertedGrowth = prevAgg.converted ? delta(agg.converted, prevAgg.converted).pct : 0;
  const rateChange = prevAgg.conversionRate ? agg.conversionRate - prevAgg.conversionRate : 0;
  const leadChange = prevAgg.avgLeadDays ? delta(agg.avgLeadDays, prevAgg.avgLeadDays).pct : 0;

  const kpis = [
    { key: 'started', label: START_LABEL[mode], value: fmtCount(agg.started), change: startGrowth, sub: '전기 대비' },
    { key: 'converted', label: CONVERTED_LABEL[mode], value: fmtCount(agg.converted), change: convertedGrowth, sub: '전기 대비' },
    { key: 'rate', label: '거래 성사율', value: fmtPct(agg.conversionRate), change: rateChange, sub: '전기 대비 · 확정 거래 기준', isPoint: true },
    { key: 'lead', label: '평균 성사 소요시간', value: `${agg.avgLeadDays.toFixed(1)}일`, change: leadChange, sub: '전기 대비', badIsGood: true },
  ];

  const dimensionRowsFor = (dim: Dimension): DimensionRow[] => {
    if (dim === 'product') return prodRows;
    if (dim === 'category') return catRows;
    if (dim === 'type') return typeRows;
    return fourthRows;
  };
  const rows = dimensionRowsFor(dimension);
  const dimensionLabel = dimension === 'product' ? '상품' : dimension === 'category' ? '카테고리' : dimension === 'type' ? '거래 유형' : FOURTH_DIMENSION_LABEL[mode].replace('별', '');

  const columns: GridColumn[] = [
    { label: dimensionLabel },
    { label: START_LABEL[mode], align: 'right' },
    { label: '성사', align: 'right' },
    { label: '성사율', align: 'right' },
    { label: '실패/취소', align: 'right' },
    { label: '진행중', align: 'right' },
    { label: '평균 소요', align: 'right' },
    { label: '전기 대비', align: 'right' },
  ];

  const gridRows: GridRow[] = rows.map((row) => {
    const change = row.prevConverted ? delta(row.converted, row.prevConverted).pct : 0;
    const cells: Cell[] = [
      { kind: 'stack', title: row.name, subtitle: row.subtitle },
      { kind: 'text', text: fmtCount(row.started), align: 'right', numeric: true },
      { kind: 'text', text: fmtCount(row.converted), align: 'right', numeric: true, weight: 700 },
      { kind: 'text', text: fmtPct(row.conversionRate), align: 'right', numeric: true, color: row.conversionRate < 50 ? '#dc2626' : row.conversionRate > 85 ? '#059669' : undefined, weight: 700 },
      { kind: 'text', text: fmtCount(row.failed), align: 'right', numeric: true, color: '#a1a1aa' },
      { kind: 'text', text: fmtCount(row.inProgress), align: 'right', numeric: true, color: '#a1a1aa' },
      { kind: 'text', text: `${row.avgLeadDays.toFixed(1)}일`, align: 'right', numeric: true },
      { kind: 'text', text: fmtSignedPct(change), align: 'right', numeric: true, color: change >= 0 ? '#059669' : '#dc2626' },
    ];
    return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
  });

  const exportFields = [
    { key: 'name', label: dimensionLabel, value: (row: DimensionRow) => row.name },
    { key: 'started', label: START_LABEL[mode], value: (row: DimensionRow) => row.started },
    { key: 'converted', label: '성사', value: (row: DimensionRow) => row.converted },
    { key: 'rate', label: '성사율', value: (row: DimensionRow) => fmtPct(row.conversionRate) },
    { key: 'failed', label: '실패/취소', value: (row: DimensionRow) => row.failed },
    { key: 'progress', label: '진행중', value: (row: DimensionRow) => row.inProgress },
    { key: 'lead', label: '평균 소요', value: (row: DimensionRow) => row.avgLeadDays.toFixed(1) },
    { key: 'change', label: '이전 기간 대비', value: (row: DimensionRow) => row.prevConverted ? fmtSignedPct(delta(row.converted, row.prevConverted).pct) : '-' },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string, values: DimensionRow[]) => ({ name, headers: fields.map((field) => field.label), rows: values.map((row) => fields.map((field) => field.value(row))) });
    downloadStatisticsReport({
      reportName: '거래 전환 분석', mode: MODE_LABELS[mode], period: `${start}~${end}`, comparisonPeriod: compare === '비교 없음' ? undefined : `${prevStart}~${prevEnd}`,
      filters: [['비교', compare], ['현재 분석', dimensionLabel]],
      summary: [
        { label: START_LABEL[mode], current: agg.started, previous: compare === '비교 없음' ? undefined : prevAgg.started, change: compare === '비교 없음' ? undefined : agg.started - prevAgg.started, changeRate: compare === '비교 없음' ? undefined : `${startGrowth.toFixed(1)}%` },
        { label: CONVERTED_LABEL[mode], current: agg.converted, previous: compare === '비교 없음' ? undefined : prevAgg.converted, change: compare === '비교 없음' ? undefined : agg.converted - prevAgg.converted, changeRate: compare === '비교 없음' ? undefined : `${convertedGrowth.toFixed(1)}%` },
        { label: '거래 성사율', current: `${agg.conversionRate.toFixed(2)}%`, previous: compare === '비교 없음' ? undefined : `${prevAgg.conversionRate.toFixed(2)}%`, change: compare === '비교 없음' ? undefined : `${rateChange.toFixed(2)}%p` },
        { label: '평균 성사 소요시간', current: agg.avgLeadDays, previous: compare === '비교 없음' ? undefined : prevAgg.avgLeadDays, changeRate: compare === '비교 없음' ? undefined : `${leadChange.toFixed(1)}%` },
      ],
      trend: { name: '02_성사율추이', headers: ['일자', '성사율(%)'], rows: trendLabels.map((label, index) => [label, Number((primaryRateTrend[index] ?? 0).toFixed(2))]) },
      dimensions: [
        { name: 'Funnel', headers: ['단계', '건수', '시작 대비(%)', '이전 단계 전환(%)'], rows: steps.map((row) => [row.label, row.count, Number(row.pctOfStart.toFixed(2)), row.dropRate == null ? '-' : Number(row.dropRate.toFixed(2))]) },
        { name: '이탈사유', headers: ['사유', '건수'], rows: reasons.map((row) => [row.label, row.count]) },
        dimensionSheet('상품별', prodRows), dimensionSheet('카테고리별', catRows), dimensionSheet('거래유형별', typeRows), dimensionSheet(FOURTH_DIMENSION_LABEL[mode], fourthRows),
      ],
      definitions: [{ term: '거래 성사율', description: '결과가 확정된 거래 중 최종 성사된 거래의 비율' }, { term: '진행중', description: '조회 종료일 기준 최종 결과가 확정되지 않은 거래' }, { term: '단계별 전환율', description: '바로 이전 Funnel 단계에 진입한 건 중 다음 단계로 이동한 비율' }, { term: '평균 성사 소요시간', description: '거래 시작부터 최종 성사까지 걸린 평균 일수' }],
      dataAsOf: refreshedAt,
    });
    setDownloadOpen(false);
    flash('거래 전환 전체 분석 리포트를 다운로드했습니다.');
  }

  function goToTransactionList(row: DimensionRow) {
    if (mode === 'b2b') return navigate(`/quotes/list?keyword=${encodeURIComponent(row.name)}`);
    if (mode === 'c2c') return navigate(`/c2c/sales/trades?keyword=${encodeURIComponent(row.name)}`);
    return navigate(`/orders?keyword=${encodeURIComponent(row.name)}`);
  }

  const stageRates = [
    { label: `${funnelSteps(mode, agg)[0].label} → ${funnelSteps(mode, agg)[1].label}`, value: agg.stageRate1 },
    { label: `${funnelSteps(mode, agg)[1].label} → ${funnelSteps(mode, agg)[2].label}`, value: agg.stageRate2 },
    { label: `${funnelSteps(mode, agg)[2].label} → ${funnelSteps(mode, agg)[3].label}`, value: agg.stageRate3 },
  ];

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}>
        <div><h1 className={shared.title}>거래 전환 분석</h1><p className={shared.subtitle}>거래가 시작된 뒤 실제 성사까지 얼마나 이어지고, 어느 단계에서 가장 많이 이탈하는지 분석합니다.</p></div>
        <div className={layout.headerActions}>
          <button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((v) => !v)}><Info size={15} /> 집계 기준</button>
          <button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 거래 전환 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button>
          <button type="button" className={layout.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button>
        </div>
      </div>

      <div className={layout.modeSwitch}>
        {MODES.map((m) => (
          <button key={m} type="button" className={mode === m ? layout.modeActive : ''} onClick={() => { setMode(m); setDimension('product'); setSelected(null); }}>
            <strong>{MODE_LABELS[m]}</strong>
            <span>{m === 'all' ? '전체 채널 통합' : m === 'b2c' ? '주문 → 결제 → 확정' : m === 'c2c' ? '거래요청 → 수락 → 완료' : '견적 → 승인 → 계약'}</span>
          </button>
        ))}
      </div>

      <div className={layout.filterCard}>
        <div className={layout.filterGrid}>
          <label className={layout.filterField}><span>기간</span><CommonSelect className={layout.analysisSelect} size="sm" value={range} options={QUICK_RANGES.map((value) => ({ label: value, value }))} onChange={(value) => setRange(value as QuickRange)} /></label>
          <label className={layout.filterField}><span>비교</span><CommonSelect className={layout.analysisSelect} size="sm" value={compare} options={['이전 기간', '비교 없음'].map((value) => ({ label: value, value }))} onChange={(value) => setCompare(value as typeof compare)} /></label>
          <div className={layout.filterActions}><button type="button" className={layout.resetButton} onClick={reset}>초기화</button><button type="button" className={layout.applyButton} onClick={() => flash('조회 조건을 적용했습니다.')}>조회</button></div>
        </div>
        <div className={layout.periodSummary}>조회기간 <strong>{fmtDate(start)} ~ {fmtDate(end)}</strong> · 비교 <strong>{compare === '비교 없음' ? '없음' : `${fmtDate(prevStart)} ~ ${fmtDate(prevEnd)}`}</strong> · 최근 집계 <strong>{refreshedAt}</strong></div>
      </div>

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>거래 전환 분석 집계 기준</strong><p>{START_LABEL[mode]}은 조회기간 동안 최초 거래 단계에 진입한 건이며, {CONVERTED_LABEL[mode]}은 Mode별 최종 성사 단계에 도달한 건입니다. 거래 성사율은 결과가 확정된 거래(성사 + 실패/취소) 중 성사된 거래의 비율이며, 아직 결과가 확정되지 않은 진행중 거래는 분모에서 제외합니다. 평균 성사 소요시간은 거래 시작부터 최종 성사까지 걸린 평균 일수입니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
    </div>

    <div className={layout.body}>
      <div className={layout.kpiGrid}>
        {kpis.map((item) => {
          const good = item.badIsGood ? item.change <= 0 : item.change >= 0;
          return (
            <article key={item.key} className={layout.kpiCard}>
              <div className={layout.kpiLabel}>{item.label}</div>
              <strong>{item.value}</strong>
              <div className={good ? layout.changeUp : layout.changeDown}>{item.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(item.change).toFixed(1)}{item.isPoint ? 'p' : '%'} <span>· {item.sub}</span></div>
            </article>
          );
        })}
      </div>

      <div className={layout.secondaryMetrics}>
        <div><span>확정 거래 (성사 + 실패)</span><strong>{fmtCount(agg.resolved)}</strong><em>전체 시작 기준 성사율 {fmtPct(agg.overallRate)}</em></div>
        <div><span>진행중 거래</span><strong>{fmtCount(agg.inProgress)}</strong><em>아직 결과가 확정되지 않음</em></div>
        <div><span>실패 / 취소</span><strong>{fmtCount(agg.failed)}</strong><em className={layout.changeDown}>거래 중단</em></div>
      </div>

      <section className={layout.card}>
        <div className={layout.cardHead}><div><h2>거래 Funnel</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div></div>
        <div className={styles.funnelRow}>
          {steps.map((step, index) => (
            <Fragment key={step.label}>
              {index > 0 && (
                <div className={styles.funnelArrow}>
                  <ArrowRight size={16} />
                  <span className={styles.funnelArrowRate}>{step.dropRate?.toFixed(1)}%</span>
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
          <div><h2>거래 성사율 추이</h2><p>확정 거래 기준 · 일별</p></div>
          <div className={layout.legend}><span><i className={layout.legendCurrent} />성사율</span>{compare !== '비교 없음' && <span><i className={layout.legendPrevious} />비교 기간</span>}</div>
        </div>
        {primaryRateTrend.length ? <RateTrendChart primary={primaryRateTrend} secondary={secondaryRateTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 거래 데이터가 없습니다.</strong><span>기간 또는 조건을 변경해 주세요.</span><button type="button" onClick={reset}>필터 초기화</button></div>}
      </section>

      <div className={layout.insightGrid}>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>단계별 전환율</h2><p>바로 앞 단계 대비 전환 비율입니다.</p></div></div>
          <div className={styles.stageRateList}>{stageRates.map((s) => <div key={s.label}><span>{s.label}</span><strong>{fmtPct(s.value)}</strong></div>)}</div>
        </section>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>주요 이탈 원인</h2><p>실패/취소 건수 기준 상위 사유입니다.</p></div></div>
          <div className={styles.reasonList}>
            {reasons.map((r) => {
              const max = reasons[0]?.count || 1;
              return (
                <div key={r.label}>
                  <span className={styles.reasonLabel}>{r.label}</span>
                  <span className={styles.reasonBar}><b style={{ width: `${(r.count / max) * 100}%` }} /></span>
                  <span className={styles.reasonValue}>{r.count.toLocaleString('ko-KR')}건</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className={layout.card}>
        <div className={layout.analysisHead}>
          <div><h2>상세 분석</h2><p>분석 결과에서 바로 처리하지 않고 원본 거래 화면으로 이동합니다.</p></div>
          <button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button>
        </div>
        <div className={layout.dimensionTabs}>
          <button type="button" className={dimension === 'product' ? layout.dimensionActive : ''} onClick={() => setDimension('product')}>상품별</button>
          <button type="button" className={dimension === 'category' ? layout.dimensionActive : ''} onClick={() => setDimension('category')}>카테고리별</button>
          <button type="button" className={dimension === 'type' ? layout.dimensionActive : ''} onClick={() => setDimension('type')}>거래 유형별</button>
          <button type="button" className={dimension === 'fourth' ? layout.dimensionActive : ''} onClick={() => setDimension('fourth')}>{FOURTH_DIMENSION_LABEL[mode]}</button>
        </div>
        <DataGrid columns={columns} rows={gridRows} gridTemplate="minmax(190px,1.5fr) 90px 90px 90px 90px 80px 90px 100px" minWidth="1080px" empty={!rows.length} emptyText="현재 조건에 해당하는 거래 데이터가 없습니다." emptySubtext="기간 또는 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} />
      </section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="거래 전환 분석 상세">
      <div className={layout.drawerHead}><div><span>{MODE_LABELS[mode]} · {dimensionLabel}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div>
      <div className={layout.drawerBody}>
        <div className={layout.drawerHero}><span>{START_LABEL[mode]}</span><strong>{fmtCount(selected.started)}</strong></div>
        <div className={layout.drawerFacts}>
          <div><span>성사</span><strong>{fmtCount(selected.converted)}</strong></div>
          <div><span>성사율</span><strong className={selected.conversionRate < 50 ? styles.warnValue : undefined}>{fmtPct(selected.conversionRate)}</strong></div>
          <div><span>실패/취소</span><strong>{fmtCount(selected.failed)}</strong></div>
          <div><span>진행중</span><strong>{fmtCount(selected.inProgress)}</strong></div>
          <div><span>평균 소요</span><strong>{selected.avgLeadDays.toFixed(1)}일</strong></div>
          <div><span>이전 기간 대비</span><strong>{selected.prevConverted ? fmtSignedPct(delta(selected.converted, selected.prevConverted).pct) : '데이터 없음'}</strong></div>
        </div>
        <div className={layout.drawerSection}><h3>비고</h3><p>{selected.subtitle}</p></div>
        <div className={layout.drawerSection}><h3>분석 기준</h3><p>{fmtDate(start)} ~ {fmtDate(end)} · {MODE_LABELS[mode]}</p></div>
      </div>
      <div className={layout.drawerFooter}>
        <button type="button" className={layout.primaryButton} onClick={() => goToTransactionList(selected)}>거래 목록에서 보기</button>
      </div>
    </aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}>
      <div className={layout.dialog}>
        <div className={layout.dialogHead}><div><span>거래 전환 분석 다운로드</span><h2>{MODE_LABELS[mode]} · {dimensionLabel}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className={layout.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>Mode <b>{MODE_LABELS[mode]}</b></span><span>분석 기준 <b>{dimensionLabel}</b></span></div>
        <StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} />
        <div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div>
      </div>
    </div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
