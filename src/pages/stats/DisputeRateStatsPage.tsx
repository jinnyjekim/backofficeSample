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
import styles from './DisputeRateStatsPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import {
  aggregate,
  categoryRows,
  delta,
  fmtCount,
  fmtDate,
  fmtPct,
  fmtSignedPct,
  previousPeriod,
  quickRangeDates,
  reasonBreakdown,
  reasonRows,
  sellerRows,
  trendSeries,
  type DimensionRow,
  type QuickRange,
} from './disputeRateStatsData';

type Dimension = 'reason' | 'seller' | 'category';
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type TrendMetric = 'disputeCount' | 'resolvedCount';

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
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="분쟁 추이 차트">
        {[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}
        <polyline points={points(primary)} className={layout.currentLine} />
      </svg>
      <div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

export function DisputeRateStatsPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<QuickRange>('최근 30일');
  const [dimension, setDimension] = useState<Dimension>('reason');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('disputeCount');
  const [selected, setSelected] = useState<DimensionRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.09.01 09:20');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['name', 'disputeCount', 'rate', 'resolved', 'resolveRate', 'change']));

  const [start, end] = quickRangeDates(range);
  const [prevStart, prevEnd] = previousPeriod(start, end);

  const agg = useMemo(() => aggregate(start, end), [start, end]);
  const prevAgg = useMemo(() => aggregate(prevStart, prevEnd), [prevStart, prevEnd]);
  const reasonComp = useMemo(() => reasonBreakdown(agg), [agg]);

  const reasonTabRows = useMemo(() => reasonRows(start, end), [start, end]);
  const sellerTabRows = useMemo(() => sellerRows(start, end), [start, end]);
  const categoryTabRows = useMemo(() => categoryRows(start, end), [start, end]);

  const trendDays = trendSeries(start, end);
  const trendLabels = trendDays.map((r) => r.date.slice(5).replace('-', '.'));
  const primaryTrend = trendDays.map((r) => r[trendMetric]);
  const metricLabels: Record<TrendMetric, string> = { disputeCount: '분쟁 발생', resolvedCount: '해결 완료' };

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }
  function reset() {
    setRange('최근 30일'); setDimension('reason');
  }

  const disputeGrowth = prevAgg.disputeCount ? delta(agg.disputeCount, prevAgg.disputeCount).pct : 0;
  const rateChange = prevAgg.disputeRate ? agg.disputeRate - prevAgg.disputeRate : 0;
  const resolveChange = prevAgg.resolveRate ? agg.resolveRate - prevAgg.resolveRate : 0;

  const kpis = [
    { key: 'disputes', label: '분쟁 발생 건수', value: fmtCount(agg.disputeCount), change: disputeGrowth, sub: '전기 대비', badIsGood: true },
    { key: 'rate', label: '분쟁률', value: fmtPct(agg.disputeRate), change: rateChange, sub: '전기 대비 · 거래 대비', isPoint: true, badIsGood: true },
    { key: 'resolve', label: '분쟁 해결율', value: fmtPct(agg.resolveRate), change: resolveChange, sub: '전기 대비', isPoint: true },
    { key: 'days', label: '평균 해결 소요', value: `${agg.avgResolveDays.toFixed(1)}일`, sub: '접수 → 해결 완료', noChange: true },
  ];

  const dimensionRowsFor = (dim: Dimension): DimensionRow[] => {
    if (dim === 'reason') return reasonTabRows;
    if (dim === 'seller') return sellerTabRows;
    return categoryTabRows;
  };
  const rows = dimensionRowsFor(dimension);
  const dimensionLabel = dimension === 'reason' ? '분쟁 사유' : dimension === 'seller' ? '판매자' : '카테고리';

  const columns: GridColumn[] = [
    { label: dimensionLabel },
    { label: '분쟁 건수', align: 'right' },
    { label: '분쟁률', align: 'right' },
    { label: '해결 완료', align: 'right' },
    { label: '해결율', align: 'right' },
    { label: '전기 대비', align: 'right' },
  ];

  const gridRows: GridRow[] = rows.map((row) => {
    const change = row.prevDisputeCount ? delta(row.disputeCount, row.prevDisputeCount).pct : 0;
    const cells: Cell[] = [
      { kind: 'stack', title: row.name, subtitle: row.subtitle },
      { kind: 'text', text: fmtCount(row.disputeCount), align: 'right', numeric: true, weight: 700 },
      { kind: 'text', text: fmtPct(row.disputeRate), align: 'right', numeric: true, color: row.disputeRate >= 2 ? '#dc2626' : undefined },
      { kind: 'text', text: fmtCount(row.resolvedCount), align: 'right', numeric: true },
      { kind: 'text', text: fmtPct(row.resolveRate), align: 'right', numeric: true, color: row.resolveRate < 50 ? '#dc2626' : '#059669' },
      { kind: 'text', text: fmtSignedPct(change), align: 'right', numeric: true, color: change >= 0 ? '#dc2626' : '#059669' },
    ];
    return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
  });

  const exportFields = [
    { key: 'name', label: dimensionLabel, value: (row: DimensionRow) => row.name },
    { key: 'disputeCount', label: '분쟁 건수', value: (row: DimensionRow) => row.disputeCount },
    { key: 'rate', label: '분쟁률', value: (row: DimensionRow) => fmtPct(row.disputeRate) },
    { key: 'resolved', label: '해결 완료', value: (row: DimensionRow) => row.resolvedCount },
    { key: 'resolveRate', label: '해결율', value: (row: DimensionRow) => fmtPct(row.resolveRate) },
    { key: 'change', label: '전기 대비', value: (row: DimensionRow) => row.prevDisputeCount ? fmtSignedPct(delta(row.disputeCount, row.prevDisputeCount).pct) : '-' },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string, values: DimensionRow[]) => ({ name, headers: fields.map((field) => field.label), rows: values.map((row) => fields.map((field) => field.value(row))) });
    downloadStatisticsReport({
      reportName: '분쟁률', mode: 'C2C', period: `${start}~${end}`, comparisonPeriod: `${prevStart}~${prevEnd}`,
      filters: [['조회 범위', range], ['현재 분석', dimensionLabel]],
      summary: [
        { label: '분쟁 발생 건수', current: agg.disputeCount, previous: prevAgg.disputeCount, change: agg.disputeCount - prevAgg.disputeCount, changeRate: `${disputeGrowth.toFixed(1)}%` },
        { label: '분쟁률(%)', current: Number(agg.disputeRate.toFixed(2)), previous: Number(prevAgg.disputeRate.toFixed(2)), change: `${rateChange.toFixed(2)}%p` },
        { label: '분쟁 해결율(%)', current: Number(agg.resolveRate.toFixed(2)), previous: Number(prevAgg.resolveRate.toFixed(2)), change: `${resolveChange.toFixed(2)}%p` },
        { label: '평균 해결 소요(일)', current: Number(agg.avgResolveDays.toFixed(1)), previous: Number(prevAgg.avgResolveDays.toFixed(1)) },
      ],
      trend: { name: '02_분쟁추이', headers: ['일자', '분쟁 발생', '해결 완료'], rows: trendDays.map((row) => [row.date, row.disputeCount, row.resolvedCount]) },
      dimensions: [
        dimensionSheet('사유별', reasonTabRows), dimensionSheet('판매자별', sellerTabRows), dimensionSheet('카테고리별', categoryTabRows),
        { name: '분쟁사유구성', headers: ['사유', '건수', '비중(%)'], rows: reasonComp.map((row) => [row.label, row.count, Number(row.pct.toFixed(2))]) },
      ],
      definitions: [
        { term: '분쟁률', description: '조회기간 완료 거래 대비 분쟁이 접수된 건의 비율' },
        { term: '분쟁 해결율', description: '접수된 분쟁 중 조정·환불·기각 등으로 해결이 끝난 건의 비율' },
        { term: '평균 해결 소요', description: '분쟁 접수부터 해결 완료까지 걸린 평균 일수' },
      ],
      dataAsOf: refreshedAt,
    });
    setDownloadOpen(false);
    flash('분쟁률 분석 리포트를 다운로드했습니다.');
  }

  function goToDisputes(row: DimensionRow) {
    navigate(`/c2c/disputes/processing?keyword=${encodeURIComponent(row.name)}`);
  }

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}>
        <div><h1 className={shared.title}>분쟁률</h1><p className={shared.subtitle}>거래 대비 분쟁이 얼마나 발생하고 있으며, 분쟁 해결은 얼마나 빠르게 이뤄지는지 분석합니다.</p></div>
        <div className={layout.headerActions}>
          <button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((v) => !v)}><Info size={15} /> 집계 기준</button>
          <button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 분쟁 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button>
          <button type="button" className={layout.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button>
        </div>
      </div>

      <div className={layout.filterCard}>
        <div className={layout.filterGrid}>
          <label className={layout.filterField}><span>기간</span><CommonSelect className={layout.analysisSelect} size="sm" value={range} options={QUICK_RANGES.map((value) => ({ label: value, value }))} onChange={(value) => setRange(value as QuickRange)} /></label>
          <div className={layout.filterActions}><button type="button" className={layout.resetButton} onClick={reset}>초기화</button><button type="button" className={layout.applyButton} onClick={() => flash('조회 조건을 적용했습니다.')}>조회</button></div>
        </div>
        <div className={layout.periodSummary}>조회기간 <strong>{fmtDate(start)} ~ {fmtDate(end)}</strong> · 비교 <strong>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</strong> · 최근 집계 <strong>{refreshedAt}</strong></div>
      </div>

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>분쟁률 집계 기준</strong><p>분쟁률은 조회기간 내 완료 거래 수 대비 분쟁이 접수된 건의 비율입니다. 분쟁 해결율은 접수된 분쟁 중 조정·환불·기각 등으로 처리가 끝난 건의 비율이며, 평균 해결 소요는 분쟁 접수부터 해결 완료까지 걸린 평균 일수입니다. 단순 신고와 달리 분쟁은 양측 주장이 상충하는 건만 집계합니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
    </div>

    <div className={layout.body}>
      <div className={layout.kpiGrid}>
        {kpis.map((item) => {
          const raw = item.change ?? 0;
          const good = item.badIsGood ? raw <= 0 : raw >= 0;
          return (
            <article key={item.key} className={layout.kpiCard}>
              <div className={layout.kpiLabel}>{item.label}</div>
              <strong>{item.value}</strong>
              {item.noChange ? <div><span style={{ color: '#8b8b93', fontSize: '11.5px' }}>{item.sub}</span></div> : (
                <div className={good ? layout.changeUp : layout.changeDown}>{raw >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(raw).toFixed(1)}{item.isPoint ? 'p' : '%'} <span>· {item.sub}</span></div>
              )}
            </article>
          );
        })}
      </div>

      <div className={layout.secondaryMetrics}>
        <div><span>해결 완료 건수</span><strong>{fmtCount(agg.resolvedCount)}</strong><em>조회기간 해결 완료</em></div>
        <div><span>미해결 건수</span><strong className={agg.pendingCount > 0 ? styles.warnValue : undefined}>{fmtCount(agg.pendingCount)}</strong><em>진행중인 분쟁</em></div>
      </div>

      <section className={layout.card}>
        <div className={layout.cardHead}>
          <div><h2>분쟁 추이</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div>
          <div className={layout.legend}><span><i className={layout.legendCurrent} />{metricLabels[trendMetric]}</span></div>
        </div>
        <div className={layout.chartToolbar}>
          <label><span>지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={trendMetric} options={Object.entries(metricLabels).map(([value, label]) => ({ label, value }))} onChange={(value) => setTrendMetric(value as TrendMetric)} /></label>
        </div>
        {primaryTrend.length ? <TrendChart primary={primaryTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 분쟁 데이터가 없습니다.</strong><span>기간을 변경해 주세요.</span><button type="button" onClick={reset}>필터 초기화</button></div>}
      </section>

      <section className={layout.card}>
        <div className={layout.cardHead}><div><h2>분쟁 사유 구성</h2><p>조회기간 분쟁 건 기준입니다.</p></div></div>
        <div className={styles.compositionList}>
          {reasonComp.map((item) => (
            <div key={item.label}>
              <span className={styles.compositionLabel}>{item.label}</span>
              <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
              <span className={styles.compositionValue}>{fmtPct(item.pct)}<span>{item.count.toLocaleString('ko-KR')}건</span></span>
            </div>
          ))}
        </div>
      </section>

      <section className={layout.card}>
        <div className={layout.analysisHead}>
          <div><h2>상세 분석</h2><p>분석 결과에서 바로 처리하지 않고 분쟁 관리 화면으로 이동합니다.</p></div>
          <button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button>
        </div>
        <div className={layout.dimensionTabs}>
          <button type="button" className={dimension === 'reason' ? layout.dimensionActive : ''} onClick={() => setDimension('reason')}>사유별</button>
          <button type="button" className={dimension === 'seller' ? layout.dimensionActive : ''} onClick={() => setDimension('seller')}>판매자별</button>
          <button type="button" className={dimension === 'category' ? layout.dimensionActive : ''} onClick={() => setDimension('category')}>카테고리별</button>
        </div>
        <DataGrid columns={columns} rows={gridRows} gridTemplate="minmax(190px,1.5fr) 74px 56px 74px 56px 74px" minWidth="620px" empty={!rows.length} emptyText="현재 조건에 해당하는 분쟁 데이터가 없습니다." emptySubtext="기간 또는 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} />
      </section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="분쟁률 분석 상세">
      <div className={layout.drawerHead}><div><span>{dimensionLabel}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div>
      <div className={layout.drawerBody}>
        <div className={layout.drawerHero}><span>분쟁 건수</span><strong>{fmtCount(selected.disputeCount)}</strong></div>
        <div className={layout.drawerFacts}>
          <div><span>분쟁률</span><strong className={selected.disputeRate >= 2 ? styles.warnValue : undefined}>{fmtPct(selected.disputeRate)}</strong></div>
          <div><span>해결 완료</span><strong>{fmtCount(selected.resolvedCount)}</strong></div>
          <div><span>해결율</span><strong>{fmtPct(selected.resolveRate)}</strong></div>
          <div><span>이전 기간 대비</span><strong>{selected.prevDisputeCount ? fmtSignedPct(delta(selected.disputeCount, selected.prevDisputeCount).pct) : '데이터 없음'}</strong></div>
        </div>
        <div className={layout.drawerSection}><h3>비고</h3><p>{selected.subtitle}</p></div>
        <div className={layout.drawerSection}><h3>분석 기준</h3><p>{fmtDate(start)} ~ {fmtDate(end)}</p></div>
      </div>
      <div className={layout.drawerFooter}>
        <button type="button" className={layout.primaryButton} onClick={() => goToDisputes(selected)}>분쟁 관리에서 보기</button>
      </div>
    </aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}>
      <div className={layout.dialog}>
        <div className={layout.dialogHead}><div><span>분쟁률 다운로드</span><h2>{dimensionLabel}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className={layout.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>분석 기준 <b>{dimensionLabel}</b></span></div>
        <StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} />
        <div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div>
      </div>
    </div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
