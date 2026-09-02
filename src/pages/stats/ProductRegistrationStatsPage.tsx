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
import styles from './ProductRegistrationStatsPage.module.css';
import { StatisticsDownloadFields } from './StatisticsDownloadFields';
import {
  ACTIVE_LABEL,
  INACTIVE_LABEL,
  MODES,
  MODE_LABELS,
  REGISTER_LABEL,
  SECOND_DIMENSION_LABEL,
  STATUS_META,
  TOTAL_LABEL,
  aggregate,
  categoryRows,
  delta,
  fmtDate,
  fmtPct,
  fmtSignedPct,
  previousPeriod,
  quickRangeDates,
  registrationComposition,
  secondDimensionRows,
  sellerMetrics,
  statusComposition,
  statusRows,
  trendSeries,
  type DimensionRow,
  type Mode,
  type QuickRange,
  type StatusGroup,
} from './productRegistrationStatsData';

type Dimension = 'category' | 'second' | 'status';
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type TrendMetric = 'newRegistrations' | 'saleStarted' | 'saleEnded' | 'activeTotal';

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
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="상품 등록 추이 차트">
        {[.25, .5, .75, 1].map((ratio) => <line key={ratio} x1={px} x2={width - px} y1={height - py - ratio * (height - py * 2)} y2={height - py - ratio * (height - py * 2)} className={layout.gridLine} />)}
        {secondary && <polyline points={points(secondary)} className={layout.previousLine} />}
        <polyline points={points(primary)} className={layout.currentLine} />
      </svg>
      <div className={layout.chartLabels}>{labels.map((label, index) => <span key={`${label}-${index}`}>{index % step === 0 || index === labels.length - 1 ? label : ''}</span>)}</div>
    </div>
  );
}

export function ProductRegistrationStatsPage({ defaultMode = 'all' }: { defaultMode?: Mode } = {}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [range, setRange] = useState<QuickRange>('최근 30일');
  const [dimension, setDimension] = useState<Dimension>('category');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('newRegistrations');
  const [selected, setSelected] = useState<DimensionRow | null>(null);
  const [showBasis, setShowBasis] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState('2026.09.01 09:20');
  const [notice, setNotice] = useState('');
  const [downloadFields, setDownloadFields] = useState(() => new Set(['name', 'total', 'new', 'active', 'ended', 'change']));

  const [start, end] = quickRangeDates(range);
  const [prevStart, prevEnd] = previousPeriod(start, end);

  const agg = useMemo(() => aggregate(mode, start, end), [mode, start, end]);
  const prevAgg = useMemo(() => aggregate(mode, prevStart, prevEnd), [mode, prevStart, prevEnd]);

  const statusComp = useMemo(() => statusComposition(agg), [agg]);
  const regComp = useMemo(() => registrationComposition(agg), [agg]);

  const catRows = useMemo(() => categoryRows(mode, start, end), [mode, start, end]);
  const secRows = useMemo(() => secondDimensionRows(mode, start, end), [mode, start, end]);
  const statRows = useMemo(() => statusRows(mode, start, end), [mode, start, end]);

  const trendDays = trendSeries(mode, start, end);
  const trendLabels = trendDays.map((r) => r.date.slice(5).replace('-', '.'));
  const trendValue = (metric: TrendMetric) => trendDays.map((r) => r[metric]);
  const primaryTrend = trendValue(trendMetric);
  const metricLabels: Record<TrendMetric, string> = { newRegistrations: '신규 등록', saleStarted: '판매 시작', saleEnded: '판매 종료', activeTotal: '현재 판매중 상품' };

  const drawerRef = useRef<HTMLElement>(null);
  useOutsideClose(drawerRef, () => setSelected(null), !!selected);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1800);
  }
  function reset() {
    setRange('최근 30일'); setDimension('category');
  }

  const newGrowth = prevAgg.newRegistrations ? delta(agg.newRegistrations, prevAgg.newRegistrations).pct : 0;
  const activeShare = agg.totalRegistered ? (agg.activeNow / agg.totalRegistered) * 100 : 0;
  const inactiveShare = agg.totalRegistered ? (agg.inactiveNow / agg.totalRegistered) * 100 : 0;
  const seller = sellerMetrics(agg);

  const kpis = [
    { key: 'total', label: TOTAL_LABEL[mode], value: `${agg.totalRegistered.toLocaleString('ko-KR')}개`, sub: '현재 기준', noChange: true },
    { key: 'new', label: REGISTER_LABEL[mode], value: `${agg.newRegistrations.toLocaleString('ko-KR')}개`, change: newGrowth, sub: '전기 대비' },
    { key: 'active', label: ACTIVE_LABEL[mode], value: `${agg.activeNow.toLocaleString('ko-KR')}개`, sub: `전체의 ${fmtPct(activeShare)}`, noChange: true },
    { key: 'inactive', label: INACTIVE_LABEL[mode], value: `${agg.inactiveNow.toLocaleString('ko-KR')}개`, sub: `전체의 ${fmtPct(inactiveShare)}`, noChange: true },
  ];

  const dimensionRowsFor = (dim: Dimension): DimensionRow[] => {
    if (dim === 'category') return catRows;
    if (dim === 'second') return secRows;
    return statRows;
  };
  const rows = dimensionRowsFor(dimension);
  const dimensionLabel = dimension === 'category' ? '카테고리' : dimension === 'second' ? SECOND_DIMENSION_LABEL[mode].replace('별', '') : '상품 상태';

  const columns: GridColumn[] = [
    { label: dimensionLabel },
    { label: '누적 상품', align: 'right' },
    { label: '신규 등록', align: 'right' },
    { label: '판매중', align: 'right' },
    { label: '종료', align: 'right' },
    { label: '증감률', align: 'right' },
  ];

  const gridRows: GridRow[] = rows.map((row) => {
    const change = row.prevNewRegistrations ? delta(row.newRegistrations, row.prevNewRegistrations).pct : 0;
    const statusMeta = dimension === 'status' ? STATUS_META[row.name as StatusGroup] : undefined;
    const cells: Cell[] = [
      statusMeta
        ? { kind: 'badge', text: row.name, bg: statusMeta.bg, fg: statusMeta.fg }
        : { kind: 'stack', title: row.name, subtitle: row.subtitle },
      { kind: 'text', text: `${row.totalProducts.toLocaleString('ko-KR')}개`, align: 'right', numeric: true },
      { kind: 'text', text: `${row.newRegistrations.toLocaleString('ko-KR')}개`, align: 'right', numeric: true },
      { kind: 'text', text: `${row.activeProducts.toLocaleString('ko-KR')}개`, align: 'right', numeric: true, weight: 700 },
      { kind: 'text', text: `${row.endedProducts.toLocaleString('ko-KR')}개`, align: 'right', numeric: true, color: '#a1a1aa' },
      { kind: 'text', text: fmtSignedPct(change), align: 'right', numeric: true, color: change >= 0 ? '#059669' : '#dc2626' },
    ];
    return { id: row.id, cells, onClick: () => setSelected(row), bg: selected?.id === row.id ? '#f7f8ff' : undefined };
  });

  const exportFields = [
    { key: 'name', label: dimensionLabel, value: (row: DimensionRow) => row.name },
    { key: 'total', label: '누적 상품', value: (row: DimensionRow) => row.totalProducts },
    { key: 'new', label: '신규 등록', value: (row: DimensionRow) => row.newRegistrations },
    { key: 'active', label: '판매중', value: (row: DimensionRow) => row.activeProducts },
    { key: 'ended', label: '종료', value: (row: DimensionRow) => row.endedProducts },
    { key: 'change', label: '증감률', value: (row: DimensionRow) => row.prevNewRegistrations ? fmtSignedPct(delta(row.newRegistrations, row.prevNewRegistrations).pct) : '-' },
  ];

  function download() {
    const fields = exportFields.filter((field) => downloadFields.has(field.key));
    const dimensionSheet = (name: string, values: DimensionRow[]) => ({ name, headers: fields.map((field) => field.label), rows: values.map((row) => fields.map((field) => field.value(row))) });
    downloadStatisticsReport({
      reportName: '상품 등록 분석', mode: MODE_LABELS[mode], period: `${start}~${end}`, comparisonPeriod: `${prevStart}~${prevEnd}`,
      filters: [['조회 범위', range], ['현재 분석', dimensionLabel]],
      summary: [
        { label: TOTAL_LABEL[mode], current: agg.totalRegistered, previous: prevAgg.totalRegistered, change: agg.totalRegistered - prevAgg.totalRegistered },
        { label: REGISTER_LABEL[mode], current: agg.newRegistrations, previous: prevAgg.newRegistrations, change: agg.newRegistrations - prevAgg.newRegistrations, changeRate: `${newGrowth.toFixed(1)}%` },
        { label: ACTIVE_LABEL[mode], current: agg.activeNow, previous: prevAgg.activeNow },
        { label: INACTIVE_LABEL[mode], current: agg.inactiveNow, previous: prevAgg.inactiveNow },
      ],
      trend: { name: '02_등록추이', headers: ['일자', '신규 등록', '판매 시작', '판매 종료', '현재 판매중'], rows: trendDays.map((row) => [row.date, row.newRegistrations, row.saleStarted, row.saleEnded, row.activeTotal]) },
      dimensions: [dimensionSheet('카테고리별', catRows), dimensionSheet(SECOND_DIMENSION_LABEL[mode], secRows), dimensionSheet('상품상태별', statRows), { name: '상태구성', headers: ['상태', '상품 수', '비중(%)'], rows: statusComp.map((row) => [row.label, row.count, Number(row.pct.toFixed(2))]) }, { name: '등록구성', headers: ['구분', '상품 수', '비중(%)'], rows: regComp.map((row) => [row.label, row.count, Number(row.pct.toFixed(2))]) }],
      definitions: [{ term: '누적 등록 상품', description: '조회 종료일까지 등록된 상품의 누적 수' }, { term: '신규 등록', description: '조회 기간 내 최초 등록된 상품 수' }, { term: '판매중 상품', description: '현재 승인 및 노출 상태이며 구매 가능한 상품 수' }, { term: '판매 종료', description: '판매 완료·중지·삭제 등으로 판매가 종료된 상품 수' }],
      dataAsOf: refreshedAt,
    });
    setDownloadOpen(false);
    flash('상품 등록 전체 분석 리포트를 다운로드했습니다.');
  }

  function goToProductList(row: DimensionRow) {
    if (dimension === 'category') return navigate(`/products/list?category=${encodeURIComponent(row.name)}`);
    return navigate(`/products/list?keyword=${encodeURIComponent(row.name)}`);
  }

  return <section className={`${shared.page} ${layout.page}`}>
    <div className={shared.headTop}>
      <div className={shared.headRow}>
        <div><h1 className={shared.title}>상품 등록 분석</h1><p className={shared.subtitle}>상품이 얼마나 새로 등록되고, 현재 실제 판매 가능한 상품은 얼마나 되는지 분석합니다.</p></div>
        <div className={layout.headerActions}>
          <button type="button" className={layout.secondaryButton} onClick={() => setShowBasis((v) => !v)}><Info size={15} /> 집계 기준</button>
          <button type="button" className={layout.secondaryButton} onClick={() => { setRefreshedAt('방금 전'); flash('최신 상품 등록 집계를 불러왔습니다.'); }}><RefreshCw size={14} /> 새로고침</button>
          <button type="button" className={layout.primaryButton} onClick={() => setDownloadOpen(true)}><Download size={15} /> 리포트 다운로드</button>
        </div>
      </div>

      <div className={layout.modeSwitch}>
        {MODES.map((m) => (
          <button key={m} type="button" className={mode === m ? layout.modeActive : ''} onClick={() => { setMode(m); setDimension('category'); setSelected(null); }}>
            <strong>{MODE_LABELS[m]}</strong>
            <span>{m === 'all' ? '전체 채널 통합' : m === 'b2c' ? '자체 상품 Master' : m === 'c2c' ? '판매자 등록 매물' : '공급사 공급 상품'}</span>
          </button>
        ))}
      </div>

      <div className={layout.filterCard}>
        <div className={layout.filterGrid}>
          <label className={layout.filterField}><span>기간</span><CommonSelect className={layout.analysisSelect} size="sm" value={range} options={QUICK_RANGES.map((value) => ({ label: value, value }))} onChange={(value) => setRange(value as QuickRange)} /></label>
          <div className={layout.filterActions}><button type="button" className={layout.resetButton} onClick={reset}>초기화</button><button type="button" className={layout.applyButton} onClick={() => flash('조회 조건을 적용했습니다.')}>조회</button></div>
        </div>
        <div className={layout.periodSummary}>조회기간 <strong>{fmtDate(start)} ~ {fmtDate(end)}</strong> · 비교 <strong>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</strong> · 최근 집계 <strong>{refreshedAt}</strong></div>
      </div>

      {showBasis && <div className={layout.basisPanel}><Info size={16} /><div><strong>상품 등록 분석 집계 기준</strong><p>{TOTAL_LABEL[mode]}은 현재 존재하는 상품 Master 기준이며 삭제된 상품은 제외합니다. {REGISTER_LABEL[mode]}은 조회기간 동안 신규 생성된 상품 수로, 이후 삭제되어도 등록 통계에는 포함됩니다. {ACTIVE_LABEL[mode]}은 기준시점에 판매 가능한 상태의 상품이며, 순증은 신규 등록에서 판매 종료·삭제를 차감한 값입니다.</p></div><button type="button" onClick={() => setShowBasis(false)} aria-label="집계 기준 닫기"><X size={15} /></button></div>}
    </div>

    <div className={layout.body}>
      <div className={layout.kpiGrid}>
        {kpis.map((item) => {
          const good = (item.change ?? 0) >= 0;
          return (
            <article key={item.key} className={layout.kpiCard}>
              <div className={layout.kpiLabel}>{item.label}</div>
              <strong>{item.value}</strong>
              {item.noChange ? <div><span style={{ color: '#8b8b93', fontSize: '11.5px' }}>{item.sub}</span></div> : (
                <div className={good ? layout.changeUp : layout.changeDown}>{good ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{Math.abs(item.change ?? 0).toFixed(1)}% <span>· {item.sub}</span></div>
              )}
            </article>
          );
        })}
      </div>

      {mode === 'c2c' && (
        <div className={layout.secondaryMetrics}>
          <div><span>상품 등록 판매자</span><strong>{seller.sellerCount.toLocaleString('ko-KR')}명</strong><em>조회기간 신규 등록 기준</em></div>
          <div><span>판매자당 평균 등록</span><strong>{seller.avgPerSeller.toFixed(1)}개</strong><em>신규 등록 ÷ 등록 판매자</em></div>
          <div><span>등록 → 판매 전환율</span><strong>{fmtPct(seller.saleConversionRate)}</strong><em>신규 등록 중 판매를 시작한 비율</em></div>
        </div>
      )}

      <section className={layout.card}>
        <div className={layout.cardHead}>
          <div><h2>상품 등록 추이</h2><p>{range} · {fmtDate(start)} ~ {fmtDate(end)}</p></div>
          <div className={layout.legend}><span><i className={layout.legendCurrent} />{metricLabels[trendMetric]}</span></div>
        </div>
        <div className={layout.chartToolbar}>
          <label><span>지표</span><CommonSelect className={layout.analysisSelect} size="sm" value={trendMetric} options={Object.entries(metricLabels).map(([value, label]) => ({ label, value }))} onChange={(value) => setTrendMetric(value as TrendMetric)} /></label>
        </div>
        {primaryTrend.length ? <TrendChart primary={primaryTrend} labels={trendLabels} /> : <div className={layout.emptyState}><strong>분석할 상품 등록 데이터가 없습니다.</strong><span>기간 또는 조건을 변경해 주세요.</span><button type="button" onClick={reset}>필터 초기화</button></div>}
        <div className={layout.chartSummary}>
          <div><span>순증 상품</span><strong>{agg.netGrowth >= 0 ? '+' : ''}{agg.netGrowth.toLocaleString('ko-KR')}개</strong><em>신규 등록 - 판매종료 - 삭제</em></div>
          <div><span>판매 시작</span><strong>{agg.saleStarted.toLocaleString('ko-KR')}개</strong><em className={layout.changeUp}>등록 후 판매 개시</em></div>
          <div><span>판매 종료 / 삭제</span><strong>{(agg.saleEnded + agg.deleted).toLocaleString('ko-KR')}개</strong><em className={layout.changeDown}>운영 종료</em></div>
        </div>
      </section>

      <div className={layout.insightGrid}>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>상품 상태 구성</h2><p>누적 등록 상품 기준입니다.</p></div></div>
          <div className={styles.compositionList}>
            {statusComp.map((item) => (
              <div key={item.label}>
                <span className={styles.compositionLabel}>{item.label}</span>
                <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
                <span className={styles.compositionValue}>{fmtPct(item.pct)}<span>{item.count.toLocaleString('ko-KR')}개</span></span>
              </div>
            ))}
          </div>
        </section>
        <section className={layout.card}>
          <div className={layout.cardHead}><div><h2>등록 구성</h2><p>조회기간 내 상품 이벤트 구성입니다.</p></div></div>
          <div className={styles.compositionList}>
            {regComp.map((item) => (
              <div key={item.label}>
                <span className={styles.compositionLabel}>{item.label}</span>
                <span className={styles.compositionBar}><b style={{ width: `${item.pct}%` }} /></span>
                <span className={styles.compositionValue}>{item.count.toLocaleString('ko-KR')}개<span>{fmtPct(item.pct)}</span></span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={layout.card}>
        <div className={layout.analysisHead}>
          <div><h2>상세 분석</h2><p>분석 결과에서 바로 수정하지 않고 상품 목록으로 이동합니다.</p></div>
          <button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(true)}><Download size={14} /> 리포트 다운로드</button>
        </div>
        <div className={layout.dimensionTabs}>
          <button type="button" className={dimension === 'category' ? layout.dimensionActive : ''} onClick={() => setDimension('category')}>카테고리별</button>
          <button type="button" className={dimension === 'second' ? layout.dimensionActive : ''} onClick={() => setDimension('second')}>{SECOND_DIMENSION_LABEL[mode]}</button>
          <button type="button" className={dimension === 'status' ? layout.dimensionActive : ''} onClick={() => setDimension('status')}>상품 상태별</button>
        </div>
        <DataGrid columns={columns} rows={gridRows} gridTemplate="minmax(190px,1.6fr) 74px 74px 60px 42px 64px" minWidth="610px" empty={!rows.length} emptyText="현재 조건에 해당하는 상품 데이터가 없습니다." emptySubtext="기간 또는 조건을 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} />
      </section>
    </div>

    {selected && <aside ref={drawerRef} className={layout.drawer} aria-label="상품 등록 분석 상세">
      <div className={layout.drawerHead}><div><span>{MODE_LABELS[mode]} · {dimensionLabel}</span><h2>{selected.name}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="닫기"><X size={18} /></button></div>
      <div className={layout.drawerBody}>
        <div className={layout.drawerHero}><span>누적 상품</span><strong>{selected.totalProducts.toLocaleString('ko-KR')}개</strong></div>
        <div className={layout.drawerFacts}>
          <div><span>신규 등록</span><strong>{selected.newRegistrations.toLocaleString('ko-KR')}개</strong></div>
          <div><span>판매중</span><strong>{selected.activeProducts.toLocaleString('ko-KR')}개</strong></div>
          <div><span>종료</span><strong>{selected.endedProducts.toLocaleString('ko-KR')}개</strong></div>
          <div><span>이전 기간 대비</span><strong>{selected.prevNewRegistrations ? fmtSignedPct(delta(selected.newRegistrations, selected.prevNewRegistrations).pct) : '데이터 없음'}</strong></div>
        </div>
        <div className={layout.drawerSection}><h3>비고</h3><p>{selected.subtitle}</p></div>
        <div className={layout.drawerSection}><h3>분석 기준</h3><p>{fmtDate(start)} ~ {fmtDate(end)} · {MODE_LABELS[mode]}</p></div>
      </div>
      <div className={layout.drawerFooter}>
        <button type="button" className={layout.primaryButton} onClick={() => goToProductList(selected)}>상품 목록에서 보기</button>
      </div>
    </aside>}

    {downloadOpen && <div className={layout.dialogOverlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setDownloadOpen(false); }}>
      <div className={layout.dialog}>
        <div className={layout.dialogHead}><div><span>상품 등록 분석 다운로드</span><h2>{MODE_LABELS[mode]} · {dimensionLabel}</h2></div><button type="button" onClick={() => setDownloadOpen(false)} aria-label="닫기"><X size={18} /></button></div>
        <div className={layout.downloadSummary}><span>기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b></span><span>Mode <b>{MODE_LABELS[mode]}</b></span><span>분석 기준 <b>{dimensionLabel}</b></span></div>
        <StatisticsDownloadFields className={layout.downloadFields} fields={exportFields} selected={downloadFields} onChange={setDownloadFields} />
        <div className={layout.dialogActions}><button type="button" className={layout.secondaryButton} onClick={() => setDownloadOpen(false)}>취소</button><button type="button" className={layout.primaryButton} disabled={!downloadFields.size} onClick={download}><Download size={14} /> Excel 다운로드</button></div>
      </div>
    </div>}
    {notice && <div className={layout.toast}>{notice}</div>}
  </section>;
}
