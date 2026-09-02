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
import styles from './SellerProceedsStatsPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import {
  aggregate,
  categoryRows,
  delta,
  fmtCount,
  fmtDate,
  fmtPct,
  fmtSignedPct,
  fmtWon,
  payoutBreakdown,
  previousPeriod,
  quickRangeDates,
  sellerRows,
  statusBreakdown,
  statusRows,
  trendSeries,
  type DimensionRow,
  type QuickRange,
} from './sellerProceedsStatsData';

type Dimension = 'seller' | 'status' | 'category';
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type TrendMetric = 'gmv' | 'settlementFinal' | 'payoutDone';

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
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="판매대금 추이 차트">
        {[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}
        <polyline points={points(primary)} className={layout.currentLine} />
      </svg>
      <div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

export function SellerProceedsStatsPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<QuickRange>('최근 30일');
  const [dimension, setDimension] = useState<Dimension>('seller');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('gmv');
  const [selected, setSelected] = useState<DimensionRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.09.01 09:20');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['name', 'dealCount', 'gmv', 'fee', 'settlementFinal', 'payoutDone', 'change']));

  const [start, end] = quickRangeDates(range);
  const [prevStart, prevEnd] = previousPeriod(start, end);

  const agg = useMemo(() => aggregate(start, end), [start, end]);
  const prevAgg = useMemo(() => aggregate(prevStart, prevEnd), [prevStart, prevEnd]);
  const statusComp = useMemo(() => statusBreakdown(agg), [agg]);
  const payoutComp = useMemo(() => payoutBreakdown(agg), [agg]);

  const sellerTabRows = useMemo(() => sellerRows(start, end), [start, end]);
  const statusTabRows = useMemo(() => statusRows(start, end), [start, end]);
  const categoryTabRows = useMemo(() => categoryRows(start, end), [start, end]);

  const trendDays = trendSeries(start, end);
  const trendLabels = trendDays.map((r) => r.date.slice(5).replace('-', '.'));
  const primaryTrend = trendDays.map((r) => r[trendMetric]);
  const metricLabels: Record<TrendMetric, string> = { gmv: '판매대금', settlementFinal: '정산 확정금액', payoutDone: '지급 완료금액' };

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }
  function reset() {
    setRange('최근 30일'); setDimension('seller');
  }

  const gmvGrowth = prevAgg.gmv ? delta(agg.gmv, prevAgg.gmv).pct : 0;
  const settlementGrowth = prevAgg.settlementFinal ? delta(agg.settlementFinal, prevAgg.settlementFinal).pct : 0;
  const feeGrowth = prevAgg.fee ? delta(agg.fee, prevAgg.fee).pct : 0;
  const payoutGrowth = prevAgg.payoutDone ? delta(agg.payoutDone, prevAgg.payoutDone).pct : 0;

  const kpis = [
    { key: 'gmv', label: '판매대금', value: fmtWon(agg.gmv), change: gmvGrowth, sub: '전기 대비' },
    { key: 'settlement', label: '정산 대상금액', value: fmtWon(agg.settlementTarget), change: settlementGrowth, sub: '전기 대비' },
    { key: 'fee', label: '플랫폼 수수료', value: fmtWon(agg.fee), change: feeGrowth, sub: `전기 대비 · 수수료율 ${fmtPct(agg.feeRate)}` },
    { key: 'payout', label: '출금 완료금액', value: fmtWon(agg.payoutDone), change: payoutGrowth, sub: '전기 대비' },
  ];

  const dimensionRowsFor = (dim: Dimension): DimensionRow[] => {
    if (dim === 'seller') return sellerTabRows;
    if (dim === 'status') return statusTabRows;
    return categoryTabRows;
  };
  const rows = dimensionRowsFor(dimension);
  const dimensionLabel = dimension === 'seller' ? '판매자' : dimension === 'status' ? '정산 상태' : '카테고리';

  const columns: GridColumn[] = [
    { label: dimensionLabel },
    { label: '거래건수', align: 'right' },
    { label: '판매대금', align: 'right' },
    { label: '수수료', align: 'right' },
    { label: '정산금액', align: 'right' },
    { label: '전기 대비', align: 'right' },
  ];

  const gridRows: GridRow[] = rows.map((row) => {
    const change = row.prevGmv ? delta(row.gmv, row.prevGmv).pct : 0;
    const cells: Cell[] = [
      { kind: 'stack', title: row.name, subtitle: row.subtitle },
      { kind: 'text', text: fmtCount(row.dealCount), align: 'right', numeric: true },
      { kind: 'text', text: fmtWon(row.gmv), align: 'right', numeric: true, weight: 700 },
      { kind: 'text', text: fmtWon(row.fee), align: 'right', numeric: true, color: '#a1a1aa' },
      { kind: 'text', text: fmtWon(row.settlementFinal), align: 'right', numeric: true },
      { kind: 'text', text: fmtSignedPct(change), align: 'right', numeric: true, color: change >= 0 ? '#059669' : '#dc2626' },
    ];
    return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
  });

  const exportFields = [
    { key: 'name', label: dimensionLabel, value: (row: DimensionRow) => row.name },
    { key: 'dealCount', label: '거래건수', value: (row: DimensionRow) => row.dealCount },
    { key: 'gmv', label: '판매대금', value: (row: DimensionRow) => row.gmv },
    { key: 'fee', label: '수수료', value: (row: DimensionRow) => row.fee },
    { key: 'settlementFinal', label: '정산금액', value: (row: DimensionRow) => row.settlementFinal },
    { key: 'payoutDone', label: '지급 완료', value: (row: DimensionRow) => row.payoutDone },
    { key: 'change', label: '전기 대비', value: (row: DimensionRow) => row.prevGmv ? fmtSignedPct(delta(row.gmv, row.prevGmv).pct) : '-' },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string, values: DimensionRow[]) => ({ name, headers: fields.map((field) => field.label), rows: values.map((row) => fields.map((field) => field.value(row))) });
    downloadStatisticsReport({
      reportName: '판매대금 통계', mode: 'C2C', period: `${start}~${end}`, comparisonPeriod: `${prevStart}~${prevEnd}`,
      filters: [['조회 범위', range], ['현재 분석', dimensionLabel]],
      summary: [
        { label: '판매대금', current: agg.gmv, previous: prevAgg.gmv, change: agg.gmv - prevAgg.gmv, changeRate: `${gmvGrowth.toFixed(1)}%` },
        { label: '정산 대상금액', current: agg.settlementTarget, previous: prevAgg.settlementTarget, changeRate: `${settlementGrowth.toFixed(1)}%` },
        { label: '플랫폼 수수료', current: agg.fee, previous: prevAgg.fee, changeRate: `${feeGrowth.toFixed(1)}%` },
        { label: '출금 완료금액', current: agg.payoutDone, previous: prevAgg.payoutDone, changeRate: `${payoutGrowth.toFixed(1)}%` },
        { label: '출금 예정금액', current: agg.payoutPending, previous: prevAgg.payoutPending },
      ],
      trend: { name: '02_판매대금추이', headers: ['일자', '판매대금', '정산 확정금액', '지급 완료금액'], rows: trendDays.map((row) => [row.date, row.gmv, row.settlementFinal, row.payoutDone]) },
      dimensions: [
        dimensionSheet('판매자별', sellerTabRows), dimensionSheet('정산상태별', statusTabRows), dimensionSheet('카테고리별', categoryTabRows),
        { name: '정산상태구성', headers: ['상태', '금액', '비중(%)'], rows: statusComp.map((row) => [row.label, row.amount, Number(row.pct.toFixed(2))]) },
        { name: '지급현황', headers: ['구분', '금액', '비중(%)'], rows: payoutComp.map((row) => [row.label, row.amount, Number(row.pct.toFixed(2))]) },
      ],
      definitions: [
        { term: '판매대금', description: '조회기간 완료된 거래의 총 판매금액(GMV)' },
        { term: '정산 대상금액', description: '판매대금에서 환불 등을 제외하고 정산 대상이 되는 금액' },
        { term: '플랫폼 수수료', description: '정산 대상금액에 수수료율을 적용해 차감하는 금액' },
        { term: '출금 완료금액', description: '판매자에게 실제로 지급이 완료된 금액' },
      ],
      dataAsOf: refreshedAt,
    });
    setDownloadOpen(false);
    flash('판매대금 통계 리포트를 다운로드했습니다.');
  }

  function goToProceeds(row: DimensionRow) {
    navigate(`/c2c/proceeds/overview?keyword=${encodeURIComponent(row.name)}`);
  }

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}>
        <div><h1 className={shared.title}>판매대금 통계</h1><p className={shared.subtitle}>판매자 판매대금이 얼마나 발생하고, 수수료 차감 후 정산·출금이 어떻게 이뤄지는지 분석합니다.</p></div>
        <div className={layout.headerActions}>
          <button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((v) => !v)}><Info size={15} /> 집계 기준</button>
          <button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 판매대금 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button>
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

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>판매대금 통계 집계 기준</strong><p>판매대금은 조회기간 완료된 거래의 총 판매금액(GMV)입니다. 정산 대상금액은 판매대금에서 환불분을 제외한 금액이며, 플랫폼 수수료를 차감한 나머지가 정산 확정금액입니다. 출금 완료금액은 판매자에게 실제 지급이 끝난 금액이고, 나머지는 출금 예정으로 분류합니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
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
        <div><span>정산 확정금액</span><strong>{fmtWon(agg.settlementFinal)}</strong><em>수수료 차감 후</em></div>
        <div><span>출금 예정금액</span><strong>{fmtWon(agg.payoutPending)}</strong><em>아직 지급되지 않음</em></div>
        <div><span>평균 거래단가</span><strong>{fmtWon(agg.avgDealValue)}</strong><em>판매대금 ÷ 거래건수</em></div>
      </div>

      <section className={layout.card}>
        <div className={layout.cardHead}>
          <div><h2>판매대금 추이</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div>
          <div className={layout.legend}><span><i className={layout.legendCurrent} />{metricLabels[trendMetric]}</span></div>
        </div>
        <div className={layout.chartToolbar}>
          <label><span>지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={trendMetric} options={Object.entries(metricLabels).map(([value, label]) => ({ label, value }))} onChange={(value) => setTrendMetric(value as TrendMetric)} /></label>
        </div>
        {primaryTrend.length ? <TrendChart primary={primaryTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 판매대금 데이터가 없습니다.</strong><span>기간을 변경해 주세요.</span><button type="button" onClick={reset}>필터 초기화</button></div>}
      </section>

      <div className={layout.insightGrid}>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>정산 상태 구성</h2><p>정산 확정금액 기준입니다.</p></div></div>
          <div className={styles.compositionList}>
            {statusComp.map((item) => (
              <div key={item.label}>
                <span className={styles.compositionLabel}>{item.label}</span>
                <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
                <span className={styles.compositionValue}>{fmtPct(item.pct)}<span>{fmtWon(item.amount)}</span></span>
              </div>
            ))}
          </div>
        </section>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>지급 현황</h2><p>확정 금액 중 지급 완료·예정 비중입니다.</p></div></div>
          <div className={styles.compositionList}>
            {payoutComp.map((item) => (
              <div key={item.label}>
                <span className={styles.compositionLabel}>{item.label}</span>
                <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
                <span className={styles.compositionValue}>{fmtPct(item.pct)}<span>{fmtWon(item.amount)}</span></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={layout.card}>
        <div className={layout.analysisHead}>
          <div><h2>상세 분석</h2><p>분석 결과에서 바로 처리하지 않고 판매대금 관리 화면으로 이동합니다.</p></div>
          <button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button>
        </div>
        <div className={layout.dimensionTabs}>
          <button type="button" className={dimension === 'seller' ? layout.dimensionActive : ''} onClick={() => setDimension('seller')}>판매자별</button>
          <button type="button" className={dimension === 'status' ? layout.dimensionActive : ''} onClick={() => setDimension('status')}>정산 상태별</button>
          <button type="button" className={dimension === 'category' ? layout.dimensionActive : ''} onClick={() => setDimension('category')}>카테고리별</button>
        </div>
        <DataGrid columns={columns} rows={gridRows} gridTemplate="minmax(190px,1.5fr) 70px 114px 90px 98px 74px" minWidth="740px" empty={!rows.length} emptyText="현재 조건에 해당하는 판매대금 데이터가 없습니다." emptySubtext="기간 또는 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} />
      </section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="판매대금 통계 상세">
      <div className={layout.drawerHead}><div><span>{dimensionLabel}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div>
      <div className={layout.drawerBody}>
        <div className={layout.drawerHero}><span>판매대금</span><strong>{fmtWon(selected.gmv)}</strong></div>
        <div className={layout.drawerFacts}>
          <div><span>거래건수</span><strong>{fmtCount(selected.dealCount)}</strong></div>
          <div><span>수수료</span><strong>{fmtWon(selected.fee)}</strong></div>
          <div><span>정산금액</span><strong>{fmtWon(selected.settlementFinal)}</strong></div>
          <div><span>지급 완료</span><strong>{fmtWon(selected.payoutDone)}</strong></div>
          <div><span>이전 기간 대비</span><strong>{selected.prevGmv ? fmtSignedPct(delta(selected.gmv, selected.prevGmv).pct) : '데이터 없음'}</strong></div>
        </div>
        <div className={layout.drawerSection}><h3>비고</h3><p>{selected.subtitle}</p></div>
        <div className={layout.drawerSection}><h3>분석 기준</h3><p>{fmtDate(start)} ~ {fmtDate(end)}</p></div>
      </div>
      <div className={layout.drawerFooter}>
        <button type="button" className={layout.primaryButton} onClick={() => goToProceeds(selected)}>판매대금 현황에서 보기</button>
      </div>
    </aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}>
      <div className={layout.dialog}>
        <div className={layout.dialogHead}><div><span>판매대금 통계 다운로드</span><h2>{dimensionLabel}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className={layout.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>분석 기준 <b>{dimensionLabel}</b></span></div>
        <StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} />
        <div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div>
      </div>
    </div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
