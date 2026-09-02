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
import styles from './DeliveryClaimsStatsPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import {
  CLAIM_TYPE_META,
  DELIVERY_STATUS_META,
  MODES,
  MODE_LABELS,
  aggregate,
  carrierRows,
  claimComposition,
  claimReasonRows,
  delta,
  fmtCount,
  fmtDate,
  fmtPct,
  fmtSignedPct,
  previousPeriod,
  quickRangeDates,
  regionRows,
  statusComposition,
  trendSeries,
  type ClaimType,
  type DeliveryStatus,
  type DimensionRow,
  type Mode,
  type QuickRange,
} from './deliveryClaimsStatsData';

type Dimension = 'region' | 'carrier' | 'reason';
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type TrendMetric = 'shipped' | 'delayed' | 'claimTotal';

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
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="배송/클레임 추이 차트">
        {[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}
        {secondary && <polyline points={points(secondary)} className={layout.previousLine} />}
        <polyline points={points(primary)} className={layout.currentLine} />
      </svg>
      <div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

export function DeliveryClaimsStatsPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('all');
  const [range, setRange] = useState<QuickRange>('최근 30일');
  const [compare, setCompare] = useState<'이전 기간' | '비교 없음'>('이전 기간');
  const [dimension, setDimension] = useState<Dimension>('region');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('shipped');
  const [selected, setSelected] = useState<DimensionRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.09.01 09:20');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['name', 'shipped', 'lead', 'delay', 'claim', 'claimRate', 'change']));

  const [start, end] = quickRangeDates(range);
  const [prevStart, prevEnd] = previousPeriod(start, end);

  const agg = useMemo(() => aggregate(mode, start, end), [mode, start, end]);
  const prevAgg = useMemo(() => aggregate(mode, prevStart, prevEnd), [mode, prevStart, prevEnd]);

  const statusComp = useMemo(() => statusComposition(agg), [agg]);
  const claimComp = useMemo(() => claimComposition(agg), [agg]);

  const regRows = useMemo(() => regionRows(mode, start, end), [mode, start, end]);
  const carRows = useMemo(() => carrierRows(mode, start, end), [mode, start, end]);
  const reasonRows = useMemo(() => claimReasonRows(mode, start, end), [mode, start, end]);

  const trendDays = trendSeries(mode, start, end);
  const trendLabels = trendDays.map((r) => r.date.slice(5).replace('-', '.'));
  const trendValue = (metric: TrendMetric) => trendDays.map((r) => metric === 'shipped' ? r.shipped : metric === 'delayed' ? r.delayed : r.claimCancel + r.claimReturn + r.claimExchange);
  const primaryTrend = trendValue(trendMetric);
  const prevTrendDays = trendSeries(mode, prevStart, prevEnd);
  const secondaryTrend = compare === '비교 없음' ? undefined : prevTrendDays.map((r) => trendMetric === 'shipped' ? r.shipped : trendMetric === 'delayed' ? r.delayed : r.claimCancel + r.claimReturn + r.claimExchange).slice(0, trendLabels.length);
  const metricLabels: Record<TrendMetric, string> = { shipped: '배송 완료', delayed: '배송 지연', claimTotal: '클레임 발생' };

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }
  function reset() {
    setRange('최근 30일'); setCompare('이전 기간'); setDimension('region');
  }

  const shippedGrowth = prevAgg.shipped ? delta(agg.shipped, prevAgg.shipped).pct : 0;
  const delayChange = prevAgg.delayRate ? agg.delayRate - prevAgg.delayRate : 0;
  const claimChange = prevAgg.claimRate ? agg.claimRate - prevAgg.claimRate : 0;
  const leadChange = prevAgg.avgLeadDays ? delta(agg.avgLeadDays, prevAgg.avgLeadDays).pct : 0;

  const kpis = [
    { key: 'shipped', label: '배송 완료 건수', value: fmtCount(agg.delivered), change: shippedGrowth, sub: '전기 대비' },
    { key: 'lead', label: '평균 배송 소요일', value: `${agg.avgLeadDays.toFixed(1)}일`, change: leadChange, sub: '전기 대비', badIsGood: true },
    { key: 'delay', label: '배송 지연율', value: fmtPct(agg.delayRate), change: delayChange, sub: '전기 대비', isPoint: true, badIsGood: true },
    { key: 'claim', label: '클레임 발생율', value: fmtPct(agg.claimRate), change: claimChange, sub: '전기 대비', isPoint: true, badIsGood: true },
  ];

  const dimensionRowsFor = (dim: Dimension): DimensionRow[] => {
    if (dim === 'region') return regRows;
    if (dim === 'carrier') return carRows;
    return reasonRows;
  };
  const rows = dimensionRowsFor(dimension);
  const dimensionLabel = dimension === 'region' ? '지역' : dimension === 'carrier' ? '배송사' : '클레임 사유';

  const columns: GridColumn[] = [
    { label: dimensionLabel },
    { label: '배송 건수', align: 'right' },
    { label: '평균 소요일', align: 'right' },
    { label: '지연율', align: 'right' },
    { label: '클레임 건수', align: 'right' },
    { label: '클레임율', align: 'right' },
    { label: '전기 대비', align: 'right' },
  ];

  const gridRows: GridRow[] = rows.map((row) => {
    const change = row.prevClaimCount ? delta(row.claimCount, row.prevClaimCount).pct : 0;
    const cells: Cell[] = [
      { kind: 'stack', title: row.name, subtitle: row.subtitle },
      { kind: 'text', text: fmtCount(row.shippedCount), align: 'right', numeric: true },
      { kind: 'text', text: `${row.avgLeadDays.toFixed(1)}일`, align: 'right', numeric: true },
      { kind: 'text', text: fmtPct(row.delayRate), align: 'right', numeric: true, color: row.delayRate > 8 ? '#dc2626' : undefined, weight: row.delayRate > 8 ? 700 : undefined },
      { kind: 'text', text: fmtCount(row.claimCount), align: 'right', numeric: true, weight: 700 },
      { kind: 'text', text: fmtPct(row.claimRate), align: 'right', numeric: true, color: row.claimRate > 5 ? '#dc2626' : undefined },
      { kind: 'text', text: fmtSignedPct(change), align: 'right', numeric: true, color: change <= 0 ? '#059669' : '#dc2626' },
    ];
    return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
  });

  const exportFields = [
    { key: 'name', label: dimensionLabel, value: (row: DimensionRow) => row.name },
    { key: 'shipped', label: '배송 건수', value: (row: DimensionRow) => row.shippedCount },
    { key: 'lead', label: '평균 소요일', value: (row: DimensionRow) => row.avgLeadDays.toFixed(1) },
    { key: 'delay', label: '지연율', value: (row: DimensionRow) => fmtPct(row.delayRate) },
    { key: 'claim', label: '클레임 건수', value: (row: DimensionRow) => row.claimCount },
    { key: 'claimRate', label: '클레임율', value: (row: DimensionRow) => fmtPct(row.claimRate) },
    { key: 'change', label: '이전 기간 대비', value: (row: DimensionRow) => row.prevClaimCount ? fmtSignedPct(delta(row.claimCount, row.prevClaimCount).pct) : '-' },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string, values: DimensionRow[]) => ({ name, headers: fields.map((field) => field.label), rows: values.map((row) => fields.map((field) => field.value(row))) });
    downloadStatisticsReport({
      reportName: '배송 클레임 분석', mode: MODE_LABELS[mode], period: `${start}~${end}`, comparisonPeriod: compare === '비교 없음' ? undefined : `${prevStart}~${prevEnd}`,
      filters: [['비교', compare], ['현재 분석', dimensionLabel], ['집계 기준', metricLabels[trendMetric]]],
      summary: [
        { label: '배송 완료 건수', current: agg.delivered, previous: compare === '비교 없음' ? undefined : prevAgg.delivered, change: compare === '비교 없음' ? undefined : agg.delivered - prevAgg.delivered, changeRate: compare === '비교 없음' ? undefined : `${shippedGrowth.toFixed(1)}%` },
        { label: '평균 배송 소요일', current: agg.avgLeadDays, previous: compare === '비교 없음' ? undefined : prevAgg.avgLeadDays, change: compare === '비교 없음' ? undefined : agg.avgLeadDays - prevAgg.avgLeadDays, changeRate: compare === '비교 없음' ? undefined : `${leadChange.toFixed(1)}%` },
        { label: '배송 지연율', current: `${agg.delayRate.toFixed(2)}%`, previous: compare === '비교 없음' ? undefined : `${prevAgg.delayRate.toFixed(2)}%`, change: compare === '비교 없음' ? undefined : `${delayChange.toFixed(2)}%p` },
        { label: '클레임 발생률', current: `${agg.claimRate.toFixed(2)}%`, previous: compare === '비교 없음' ? undefined : `${prevAgg.claimRate.toFixed(2)}%`, change: compare === '비교 없음' ? undefined : `${claimChange.toFixed(2)}%p` },
      ],
      trend: { name: '02_배송추이', headers: ['일자', '출고', '배송완료', '배송지연', '취소', '반품', '교환'], rows: trendDays.map((row) => [row.date, row.shipped, row.delivered, row.delayed, row.claimCancel, row.claimReturn, row.claimExchange]) },
      dimensions: [dimensionSheet('지역별', regRows), dimensionSheet('배송사별', carRows), dimensionSheet('클레임사유별', reasonRows)],
      definitions: [{ term: '배송 소요일', description: '출고 완료 시각부터 배송 완료 시각까지의 평균 일수' }, { term: '배송 지연율', description: '배송 완료 대상 중 정책상 기준 소요일을 초과한 배송의 비율' }, { term: '클레임 발생률', description: '배송 완료 거래 중 취소·반품·교환 클레임이 발생한 거래의 비율' }],
      dataAsOf: refreshedAt,
    });
    setDownloadOpen(false);
    flash('배송/클레임 전체 분석 리포트를 다운로드했습니다.');
  }

  function goToDeliveryList(row: DimensionRow) {
    if (dimension === 'reason') return navigate(`/cs/inquiries?reason=${encodeURIComponent(row.name)}`);
    return navigate(`/delivery?region=${encodeURIComponent(row.name)}`);
  }

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}>
        <div><h1 className={shared.title}>배송/클레임 분석</h1><p className={shared.subtitle}>거래 이행 과정의 배송 품질과 취소·반품·교환 클레임 발생을 분석합니다.</p></div>
        <div className={layout.headerActions}>
          <button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((v) => !v)}><Info size={15} /> 집계 기준</button>
          <button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 배송/클레임 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button>
          <button type="button" className={layout.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button>
        </div>
      </div>

      <div className={layout.modeSwitch}>
        {MODES.map((m) => (
          <button key={m} type="button" className={mode === m ? layout.modeActive : ''} onClick={() => { setMode(m); setDimension('region'); setSelected(null); }}>
            <strong>{MODE_LABELS[m]}</strong>
            <span>{m === 'all' ? '전체 채널 통합' : m === 'b2c' ? '일반 주문 배송' : m === 'c2c' ? '판매자 발송 배송' : '거래처 납품 배송'}</span>
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

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>배송/클레임 분석 집계 기준</strong><p>배송 완료 건수는 조회기간 내 배송이 최종 완료된 건입니다. 배송 지연율은 배송 건수 대비 기준 소요일을 초과한 건의 비율이며, 클레임 발생율은 조회기간 주문(취소 포함) 대비 취소·반품·교환이 발생한 비율입니다. 평균 배송 소요일은 출고부터 배송완료까지 걸린 평균 일수입니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
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

      <section className={layout.card}>
        <div className={layout.cardHead}>
          <div><h2>배송/클레임 추이</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div>
          <div className={layout.legend}><span><i className={layout.legendCurrent} />{metricLabels[trendMetric]}</span>{compare !== '비교 없음' && <span><i className={layout.legendPrevious} />비교 기간</span>}</div>
        </div>
        <div className={layout.chartToolbar}>
          <label><span>지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={trendMetric} options={Object.entries(metricLabels).map(([value, label]) => ({ label, value }))} onChange={(value) => setTrendMetric(value as TrendMetric)} /></label>
        </div>
        {primaryTrend.length ? <TrendChart primary={primaryTrend} secondary={secondaryTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 배송 데이터가 없습니다.</strong><span>기간 또는 조건을 변경해 주세요.</span><button type="button" onClick={reset}>필터 초기화</button></div>}
      </section>

      <div className={layout.insightGrid}>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>배송 상태 구성</h2><p>조회기간 배송 건수 기준입니다.</p></div></div>
          <div className={styles.compositionList}>
            {statusComp.map((item) => (
              <div key={item.label}>
                <span className={styles.compositionBadge} style={{ background: DELIVERY_STATUS_META[item.label as DeliveryStatus].bg, color: DELIVERY_STATUS_META[item.label as DeliveryStatus].fg }}>{item.label}</span>
                <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
                <span className={styles.compositionValue}>{fmtPct(item.pct)}<span>{item.count.toLocaleString('ko-KR')}건</span></span>
              </div>
            ))}
          </div>
        </section>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>클레임 유형별 구성</h2><p>취소·반품·교환 비중입니다.</p></div></div>
          <div className={styles.compositionList}>
            {claimComp.map((item) => (
              <div key={item.label}>
                <span className={styles.compositionBadge} style={{ background: CLAIM_TYPE_META[item.label as ClaimType].bg, color: CLAIM_TYPE_META[item.label as ClaimType].fg }}>{item.label}</span>
                <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
                <span className={styles.compositionValue}>{fmtPct(item.pct)}<span>{item.count.toLocaleString('ko-KR')}건</span></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={layout.card}>
        <div className={layout.analysisHead}>
          <div><h2>상세 분석</h2><p>분석 결과에서 바로 수정하지 않고 배송·CS 원본 화면으로 이동합니다.</p></div>
          <button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button>
        </div>
        <div className={layout.dimensionTabs}>
          <button type="button" className={dimension === 'region' ? layout.dimensionActive : ''} onClick={() => setDimension('region')}>지역별</button>
          <button type="button" className={dimension === 'carrier' ? layout.dimensionActive : ''} onClick={() => setDimension('carrier')}>배송사별</button>
          <button type="button" className={dimension === 'reason' ? layout.dimensionActive : ''} onClick={() => setDimension('reason')}>클레임 사유별</button>
        </div>
        <DataGrid columns={columns} rows={gridRows} gridTemplate="minmax(190px,1.6fr) 74px 88px 56px 88px 70px 74px" minWidth="740px" empty={!rows.length} emptyText="현재 조건에 해당하는 배송 데이터가 없습니다." emptySubtext="기간 또는 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} />
      </section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="배송/클레임 분석 상세">
      <div className={layout.drawerHead}><div><span>{MODE_LABELS[mode]} · {dimensionLabel}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div>
      <div className={layout.drawerBody}>
        <div className={layout.drawerHero}><span>배송 건수</span><strong>{fmtCount(selected.shippedCount)}</strong></div>
        <div className={layout.drawerFacts}>
          <div><span>평균 소요일</span><strong>{selected.avgLeadDays.toFixed(1)}일</strong></div>
          <div><span>지연율</span><strong className={selected.delayRate > 8 ? styles.warnValue : undefined}>{fmtPct(selected.delayRate)}</strong></div>
          <div><span>클레임 건수</span><strong>{fmtCount(selected.claimCount)}</strong></div>
          <div><span>클레임율</span><strong className={selected.claimRate > 5 ? styles.warnValue : undefined}>{fmtPct(selected.claimRate)}</strong></div>
          <div><span>이전 기간 대비</span><strong>{selected.prevClaimCount ? fmtSignedPct(delta(selected.claimCount, selected.prevClaimCount).pct) : '데이터 없음'}</strong></div>
        </div>
        <div className={layout.drawerSection}><h3>비고</h3><p>{selected.subtitle}</p></div>
        <div className={layout.drawerSection}><h3>분석 기준</h3><p>{fmtDate(start)} ~ {fmtDate(end)} · {MODE_LABELS[mode]}</p></div>
      </div>
      <div className={layout.drawerFooter}>
        <button type="button" className={layout.primaryButton} onClick={() => goToDeliveryList(selected)}>{dimension === 'reason' ? 'CS 문의에서 보기' : '배송 관리에서 보기'}</button>
      </div>
    </aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}>
      <div className={layout.dialog}>
        <div className={layout.dialogHead}><div><span>배송/클레임 분석 다운로드</span><h2>{MODE_LABELS[mode]} · {dimensionLabel}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className={layout.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>Mode <b>{MODE_LABELS[mode]}</b></span><span>분석 기준 <b>{dimensionLabel}</b></span></div>
        <StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} />
        <div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div>
      </div>
    </div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
