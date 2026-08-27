import { DatePicker } from '../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import shared from '../ops/opsShared.module.css';
import styles from './TransactionStatsPage.module.css';
import {
  TODAY,
  aggregate,
  bucketSeries,
  companyBreakdown,
  companySettlementBreakdown,
  delta,
  fmtCount,
  fmtDate,
  fmtPct,
  fmtSignedPct,
  fmtWon,
  orderStatusBreakdown,
  paymentMethodBreakdown,
  previousPeriod,
  productBreakdown,
  quickRangeDates,
  refundReasonBreakdown,
  settlementStatusBreakdown,
  type Granularity,
  type PeriodAggregate,
  type QuickRange,
  type WeightedRow,
} from './transactionStatsData';

type Tab = 'overview' | 'orders' | 'payments' | 'refunds' | 'settlement' | 'amount' | 'report';
const TABS: [Tab, string][] = [
  ['overview', '종합'],
  ['orders', '주문'],
  ['payments', '결제'],
  ['refunds', '환불'],
  ['settlement', '정산'],
  ['amount', '거래금액'],
  ['report', '거래 리포트'],
];
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];

function StatCard({ label, value, def, deltaValue, hasPrevious, sub, positiveIsBad }: {
  label: string; value: string; def?: string; deltaValue?: number; hasPrevious?: boolean; sub?: string; positiveIsBad?: boolean;
}) {
  const deltaClass = deltaValue == null ? undefined : Math.abs(deltaValue) < 0.05 ? styles.deltaFlat : (deltaValue > 0) === !positiveIsBad ? styles.deltaUp : styles.deltaDown;
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}{def && <span className={styles.defIcon} title={def}>ⓘ</span>}</div>
      <div className={styles.statValue}>{value}</div>
      {deltaValue != null && (
        <div className={`${styles.statDelta} ${deltaClass}`}>{hasPrevious ? fmtSignedPct(deltaValue) : '비교 데이터 없음'} <span style={{ color: '#c4c4c8' }}>vs 이전 기간</span></div>
      )}
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

function BreakdownTable({ rows, countLabel = '건수' }: { rows: WeightedRow[]; countLabel?: string }) {
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <div className={styles.table}>
      <div className={styles.tableHead}><span>이름</span><span>{countLabel}</span><span>금액</span><span>비중</span><span /></div>
      {rows.map((r) => (
        <div key={r.name} className={styles.tableRow}>
          <span>{r.name}</span>
          <span>{fmtCount(r.count)}</span>
          <span>{fmtWon(r.amount)}</span>
          <span>{fmtPct(r.share)}</span>
          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${(r.amount / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function BarChart({ buckets, metric }: { buckets: { label: string; value: number }[]; metric: string }) {
  const max = Math.max(...buckets.map((b) => b.value), 1);
  if (buckets.every((b) => b.value === 0)) return <div className={styles.emptyNote}>선택한 기간에 거래 데이터가 없습니다.</div>;
  return (
    <>
      <div className={styles.chartArea}>
        {buckets.map((b) => (
          <div key={b.label} className={styles.chartBarWrap} title={`${b.label} · ${metric} ${fmtWon(b.value)}`}>
            <div className={styles.chartBar} style={{ height: `${Math.max(2, (b.value / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className={styles.chartAxis}>
        {buckets.map((b, i) => (i % Math.ceil(buckets.length / 12 || 1) === 0 ? <span key={b.label} className={styles.chartAxisLabel}>{b.label}</span> : <span key={b.label} className={styles.chartAxisLabel} />))}
      </div>
    </>
  );
}

export function TransactionStatsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState(TODAY);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [compare, setCompare] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>('일별');
  const [metric, setMetric] = useState<'orderAmount' | 'paymentAmount' | 'refundAmount' | 'netAmount'>('paymentAmount');

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s); setEnd(e); setDraftStart(s); setDraftEnd(e);
  };
  const applyCustom = () => { setStart(draftStart); setEnd(draftEnd); };

  const agg: PeriodAggregate = useMemo(() => aggregate(start, end), [start, end]);
  const [prevStart, prevEnd] = useMemo(() => previousPeriod(start, end), [start, end]);
  const prevAgg: PeriodAggregate = useMemo(() => aggregate(prevStart, prevEnd), [prevStart, prevEnd]);

  const d = (key: keyof PeriodAggregate) => (compare ? delta(agg[key] as number, prevAgg[key] as number) : undefined);

  const buckets = useMemo(() => bucketSeries(start, end, granularity), [start, end, granularity]);
  const chartData = buckets.map((b) => ({ label: b.label, value: b[metric] }));
  const metricLabel = { orderAmount: '주문금액', paymentAmount: '결제금액', refundAmount: '환불금액', netAmount: '순거래금액' }[metric];

  const settlementBreak = useMemo(() => settlementStatusBreakdown(start, end), [start, end]);
  const companySettle = useMemo(() => companySettlementBreakdown(agg), [agg]);
  const orderStatus = useMemo(() => orderStatusBreakdown(agg), [agg]);
  const companies = useMemo(() => companyBreakdown(agg), [agg]);
  const products = useMemo(() => productBreakdown(agg), [agg]);
  const methods = useMemo(() => paymentMethodBreakdown(agg), [agg]);
  const reasons = useMemo(() => refundReasonBreakdown(agg), [agg]);

  const issues: { text: string; severity: 'warn' | 'ok' }[] = [];
  const successDelta = compare ? agg.paymentSuccessRate - prevAgg.paymentSuccessRate : 0;
  if (successDelta < -0.5) issues.push({ text: `결제 성공률이 이전 기간 대비 ${fmtPct(Math.abs(successDelta))}p 하락했습니다. (${fmtPct(prevAgg.paymentSuccessRate)} → ${fmtPct(agg.paymentSuccessRate)})`, severity: 'warn' });
  const refundDelta = compare ? agg.refundRateByAmount - prevAgg.refundRateByAmount : 0;
  if (refundDelta > 0.5) issues.push({ text: `환불률(금액 기준)이 이전 기간 대비 ${fmtPct(Math.abs(refundDelta))}p 상승했습니다. (${fmtPct(prevAgg.refundRateByAmount)} → ${fmtPct(agg.refundRateByAmount)})`, severity: 'warn' });
  if (agg.refundFailCount > 0) issues.push({ text: `환불 실패 ${fmtCount(agg.refundFailCount)}이 발생했습니다.`, severity: 'warn' });
  const cancelDelta = compare ? agg.cancelRate - prevAgg.cancelRate : 0;
  if (cancelDelta > 0.5) issues.push({ text: `주문 취소율이 이전 기간 대비 ${fmtPct(Math.abs(cancelDelta))}p 상승했습니다. (${fmtPct(prevAgg.cancelRate)} → ${fmtPct(agg.cancelRate)})`, severity: 'warn' });

  const highlights: string[] = [];
  if (compare) {
    const orderD = delta(agg.orderCount, prevAgg.orderCount);
    highlights.push(`주문 건수는 이전 기간 대비 ${fmtSignedPct(orderD.pct)} ${orderD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const payD = delta(agg.paymentAmount, prevAgg.paymentAmount);
    highlights.push(`결제금액은 ${fmtSignedPct(payD.pct)} ${payD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const refD = delta(agg.refundAmount, prevAgg.refundAmount);
    highlights.push(`환불금액은 ${fmtSignedPct(refD.pct)} ${refD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const settleD = delta(agg.settlementFinal, prevAgg.settlementFinal);
    highlights.push(`정산금액은 ${fmtSignedPct(settleD.pct)} ${settleD.pct >= 0 ? '증가' : '감소'}했습니다.`);
  } else {
    highlights.push('비교 기간이 설정되지 않아 변화율을 계산할 수 없습니다. 상단에서 "이전 기간과 비교"를 켜주세요.');
  }

  const toastDownload = () => window.alert('다운로드를 준비했습니다. (샘플 데이터에서는 실제 파일이 생성되지 않습니다.)');

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>거래 통계</h1>
            <p className={shared.subtitle}>주문, 결제, 환불, 정산 등 거래 관련 지표를 조회합니다.</p>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          <DatePicker className={styles.dateInput} value={draftStart} onChange={(e) => setDraftStart(e.target.value)} />
          <span className={styles.tilde}>~</span>
          <DatePicker className={styles.dateInput} value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} />
          <button type="button" className={styles.applyBtn} onClick={applyCustom}>조회</button>
          <label className={styles.compareCheck}>
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> 이전 기간과 비교
          </label>
        </div>
        <div className={styles.filterRow}>
          {QUICK_RANGES.map((r) => {
            const [qs, qe] = quickRangeDates(r);
            const active = qs === start && qe === end;
            return <button key={r} type="button" className={`${styles.quickBtn} ${active ? styles.quickBtnActive : ''}`} onClick={() => applyQuick(r)}>{r}</button>;
          })}
        </div>
        <div className={styles.periodInfo}>
          조회 기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b> ({agg.days}일){compare && <> · 비교 기간 <b>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</b> ({prevAgg.days}일)</>}
        </div>
      </div>

      <div className={styles.viewTabs}>
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={`${styles.viewTabBtn} ${tab === key ? styles.viewTabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className={styles.body}>
        {tab === 'overview' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>핵심 지표</span></div>
              <div className={styles.statGrid}>
                <StatCard label="주문" value={fmtCount(agg.orderCount)} deltaValue={d('orderCount')?.pct} hasPrevious={d('orderCount')?.hasPrevious} />
                <StatCard label="주문금액" value={fmtWon(agg.orderAmount)} deltaValue={d('orderAmount')?.pct} hasPrevious={d('orderAmount')?.hasPrevious} />
                <StatCard label="결제 완료" value={fmtCount(agg.paymentSuccess)} deltaValue={d('paymentSuccess')?.pct} hasPrevious={d('paymentSuccess')?.hasPrevious} />
                <StatCard label="결제금액" value={fmtWon(agg.paymentAmount)} deltaValue={d('paymentAmount')?.pct} hasPrevious={d('paymentAmount')?.hasPrevious} />
                <StatCard label="환불금액" value={fmtWon(agg.refundAmount)} deltaValue={d('refundAmount')?.pct} hasPrevious={d('refundAmount')?.hasPrevious} positiveIsBad />
                <StatCard label="순거래금액" value={fmtWon(agg.netAmount)} def="결제 완료금액 - 환불 완료금액 (결제 완료일/환불 완료일 기준)" />
                <StatCard label="정산금액" value={fmtWon(agg.settlementFinal)} def="정산 대상금액 - 공제 + 조정 (정산 확정일 기준)" />
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>거래 Flow</span><span className={styles.sectionNote}>※ 정산은 정산 확정일 기준으로 다른 항목과 시점이 다를 수 있습니다.</span></div>
              <div className={styles.flowRow}>
                <div className={styles.flowStep}><div className={styles.statLabel}>주문</div><div className={styles.statValue}>{fmtWon(agg.orderAmount)}</div><div className={styles.statSub}>{fmtCount(agg.orderCount)}</div></div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowStep}><div className={styles.statLabel}>결제 완료</div><div className={styles.statValue}>{fmtWon(agg.paymentAmount)}</div><div className={styles.statSub}>{fmtCount(agg.paymentSuccess)}</div></div>
                <div className={styles.flowArrow}>→<span className={styles.flowMinus}>−환불 {fmtWon(agg.refundAmount)}</span></div>
                <div className={styles.flowStep}><div className={styles.statLabel}>순거래</div><div className={styles.statValue}>{fmtWon(agg.netAmount)}</div></div>
                <div className={styles.flowArrow}>→<span className={styles.flowMinus}>−공제 {fmtWon(agg.settlementDeduction)}</span></div>
                <div className={styles.flowStep}><div className={styles.statLabel}>정산</div><div className={styles.statValue}>{fmtWon(agg.settlementFinal)}</div></div>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>기간별 거래 추이</span></div>
              <div className={styles.chartToolbar}>
                {(['orderAmount', 'paymentAmount', 'refundAmount', 'netAmount'] as const).map((m) => (
                  <button key={m} type="button" className={`${styles.chartTag} ${metric === m ? styles.chartTagActive : ''}`} onClick={() => setMetric(m)}>{{ orderAmount: '주문금액', paymentAmount: '결제금액', refundAmount: '환불금액', netAmount: '순거래금액' }[m]}</button>
                ))}
                <span style={{ flex: 1 }} />
                {(['일별', '주별', '월별'] as Granularity[]).map((g) => (
                  <button key={g} type="button" className={`${styles.chartTag} ${granularity === g ? styles.chartTagActive : ''}`} onClick={() => setGranularity(g)}>{g}</button>
                ))}
              </div>
              <BarChart buckets={chartData} metric={metricLabel} />
            </div>
          </>
        )}

        {tab === 'orders' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>주문 지표</span><span className={styles.sectionNote}>ⓘ 주문 생성일 기준으로 집계됩니다.</span></div>
              <div className={styles.statGrid}>
                <StatCard label="주문 건수" value={fmtCount(agg.orderCount)} deltaValue={d('orderCount')?.pct} hasPrevious={d('orderCount')?.hasPrevious} />
                <StatCard label="주문 금액" value={fmtWon(agg.orderAmount)} deltaValue={d('orderAmount')?.pct} hasPrevious={d('orderAmount')?.hasPrevious} />
                <StatCard label="평균 주문금액" value={fmtWon(agg.avgOrderValue)} />
                <StatCard label="취소 주문" value={fmtCount(agg.cancelCount)} deltaValue={d('cancelCount')?.pct} hasPrevious={d('cancelCount')?.hasPrevious} positiveIsBad />
                <StatCard label="주문 취소율" value={fmtPct(agg.cancelRate)} def="취소 주문 건수 / 전체 주문 건수" />
              </div>
            </div>
            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>주문 상태별 (현재 상태 분포)</span></div>
                <div className={styles.table}>
                  <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 100px 1fr' }}><span>상태</span><span>건수</span><span /></div>
                  {orderStatus.map((r) => (
                    <div key={r.label} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 1fr' }}>
                      <span>{r.label}</span><span>{fmtCount(r.count)}</span>
                      <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${(r.count / Math.max(...orderStatus.map((o) => o.count), 1)) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>거래처별 주문 TOP 5</span></div>
                <BreakdownTable rows={companies} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>상품별 주문 TOP 5</span></div>
              <BreakdownTable rows={products} countLabel="판매수량" />
            </div>
          </>
        )}

        {tab === 'payments' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>결제 지표</span><span className={styles.sectionNote}>ⓘ 결제 완료일 기준으로 집계됩니다.</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/payment-mgmt/list')}>결제 목록에서 보기</button></div>
              <div className={styles.statGrid}>
                <StatCard label="결제 요청" value={fmtCount(agg.paymentAttempt)} />
                <StatCard label="결제 성공" value={fmtCount(agg.paymentSuccess)} deltaValue={d('paymentSuccess')?.pct} hasPrevious={d('paymentSuccess')?.hasPrevious} />
                <StatCard label="결제 실패" value={fmtCount(agg.paymentFail)} deltaValue={d('paymentFail')?.pct} hasPrevious={d('paymentFail')?.hasPrevious} positiveIsBad />
                <StatCard label="결제 성공률" value={fmtPct(agg.paymentSuccessRate)} def="결제 성공 건수 / 결제 시도 건수 × 100" deltaValue={compare ? agg.paymentSuccessRate - prevAgg.paymentSuccessRate : undefined} hasPrevious={compare} />
                <StatCard label="결제금액" value={fmtWon(agg.paymentAmount)} deltaValue={d('paymentAmount')?.pct} hasPrevious={d('paymentAmount')?.hasPrevious} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>결제수단별</span></div>
              <BreakdownTable rows={methods} countLabel="결제건수" />
            </div>
          </>
        )}

        {tab === 'refunds' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>환불 지표</span><span className={styles.sectionNote}>ⓘ 환불 완료일 기준으로 집계됩니다.</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/orders/refunds')}>환불 관리에서 보기</button></div>
              <div className={styles.statGrid}>
                <StatCard label="환불 요청" value={fmtCount(agg.refundCount + agg.refundFailCount)} />
                <StatCard label="환불 완료" value={fmtCount(agg.refundCount)} deltaValue={d('refundCount')?.pct} hasPrevious={d('refundCount')?.hasPrevious} positiveIsBad />
                <StatCard label="환불 금액" value={fmtWon(agg.refundAmount)} deltaValue={d('refundAmount')?.pct} hasPrevious={d('refundAmount')?.hasPrevious} positiveIsBad />
                <StatCard label="환불률 (건수)" value={fmtPct(agg.refundRateByCount)} def="환불 완료 건수 / 결제 완료 건수" />
                <StatCard label="환불률 (금액)" value={fmtPct(agg.refundRateByAmount)} def="환불 금액 / 결제 금액" />
                <StatCard label="평균 환불금액" value={fmtWon(agg.refundCount ? agg.refundAmount / agg.refundCount : 0)} />
              </div>
            </div>
            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>환불 유형별</span></div>
                <div className={styles.table}>
                  <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 100px 1fr' }}><span>유형</span><span>건수</span><span /></div>
                  <div className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 1fr' }}><span>전체 환불</span><span>{fmtCount(agg.refundFullCount)}</span><div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${agg.refundCount ? (agg.refundFullCount / agg.refundCount) * 100 : 0}%` }} /></div></div>
                  <div className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 1fr' }}><span>부분 환불</span><span>{fmtCount(agg.refundPartialCount)}</span><div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${agg.refundCount ? (agg.refundPartialCount / agg.refundCount) * 100 : 0}%` }} /></div></div>
                </div>
                {agg.refundFailCount > 0 && <div className={styles.issueBanner} style={{ marginTop: 12 }}>⚠ 환불 실패 {fmtCount(agg.refundFailCount)}이 발생했습니다.</div>}
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>환불 사유별</span></div>
                <BreakdownTable rows={reasons} countLabel="건수" />
              </div>
            </div>
          </>
        )}

        {tab === 'settlement' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>정산 지표</span><span className={styles.sectionNote}>ⓘ 정산 확정일 기준으로 집계됩니다.</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/settlement')}>정산 관리에서 보기</button></div>
              <div className={styles.statGrid}>
                <StatCard label="정산 대상금액" value={fmtWon(agg.settlementTarget)} />
                <StatCard label="공제 금액" value={fmtWon(agg.settlementDeduction)} def="정산 대상금액 × 수수료율" />
                <StatCard label="조정 금액" value={`${agg.settlementAdjustment >= 0 ? '+' : ''}${fmtWon(agg.settlementAdjustment)}`} />
                <StatCard label="최종 정산금액" value={fmtWon(agg.settlementFinal)} deltaValue={d('settlementFinal')?.pct} hasPrevious={d('settlementFinal')?.hasPrevious} />
              </div>
            </div>
            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>정산 상태별</span></div>
                <div className={styles.table}>
                  <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 100px 130px' }}><span>상태</span><span>건수</span><span>금액</span></div>
                  {settlementBreak.statusRows.map((r) => (
                    <div key={r.label} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 130px' }}><span>{r.label}</span><span>{fmtCount(r.count)}</span><span>{fmtWon(r.amount)}</span></div>
                  ))}
                </div>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>지급 상태별</span></div>
                <div className={styles.table}>
                  <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 100px 130px' }}><span>상태</span><span>건수</span><span>금액</span></div>
                  {settlementBreak.payoutRows.map((r) => (
                    <div key={r.label} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 130px' }}><span>{r.label}</span><span>{fmtCount(r.count)}</span><span>{fmtWon(r.amount)}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>거래처별 정산</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 120px 100px 120px 90px' }}><span>거래처</span><span>정산대상</span><span>공제</span><span>최종정산</span><span>지급상태</span></div>
                {companySettle.map((r) => (
                  <div key={r.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 120px 100px 120px 90px' }}>
                    <span>{r.name}</span><span>{fmtWon(r.amount)}</span><span>{fmtWon(r.deduction)}</span><span>{fmtWon(r.final)}</span><span style={{ textAlign: 'left' }}>{r.payoutStatus}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'amount' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>거래금액 Summary</span></div>
              <div className={styles.statGrid}>
                <StatCard label="주문금액" value={fmtWon(agg.orderAmount)} deltaValue={d('orderAmount')?.pct} hasPrevious={d('orderAmount')?.hasPrevious} />
                <StatCard label="결제금액" value={fmtWon(agg.paymentAmount)} def="결제 성공 거래의 총 승인금액 (환불금액 차감 전)" deltaValue={d('paymentAmount')?.pct} hasPrevious={d('paymentAmount')?.hasPrevious} />
                <StatCard label="취소금액" value={fmtWon(agg.cancelCount * agg.avgOrderValue)} def="취소 주문 건수 × 평균 주문금액 추정치" positiveIsBad />
                <StatCard label="환불금액" value={fmtWon(agg.refundAmount)} deltaValue={d('refundAmount')?.pct} hasPrevious={d('refundAmount')?.hasPrevious} positiveIsBad />
                <StatCard label="순거래금액" value={fmtWon(agg.netAmount)} def="결제금액 - 환불금액" />
                <StatCard label="정산금액" value={fmtWon(agg.settlementFinal)} deltaValue={d('settlementFinal')?.pct} hasPrevious={d('settlementFinal')?.hasPrevious} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>금액 Flow</span></div>
              <div className={styles.flowRow}>
                <div className={styles.flowStep}><div className={styles.statLabel}>주문금액</div><div className={styles.statValue}>{fmtWon(agg.orderAmount)}</div></div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowStep}><div className={styles.statLabel}>결제금액</div><div className={styles.statValue}>{fmtWon(agg.paymentAmount)}</div></div>
                <div className={styles.flowArrow}>→<span className={styles.flowMinus}>−환불 {fmtWon(agg.refundAmount)}</span></div>
                <div className={styles.flowStep}><div className={styles.statLabel}>순거래금액</div><div className={styles.statValue}>{fmtWon(agg.netAmount)}</div></div>
                <div className={styles.flowArrow}>→<span className={styles.flowMinus}>−수수료/공제 {fmtWon(agg.settlementDeduction)}</span></div>
                <div className={styles.flowStep}><div className={styles.statLabel}>정산금액</div><div className={styles.statValue}>{fmtWon(agg.settlementFinal)}</div></div>
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>기간별 금액 추이</span></div>
              <div className={styles.chartToolbar}>
                {(['orderAmount', 'paymentAmount', 'refundAmount', 'netAmount'] as const).map((m) => (
                  <button key={m} type="button" className={`${styles.chartTag} ${metric === m ? styles.chartTagActive : ''}`} onClick={() => setMetric(m)}>{{ orderAmount: '주문금액', paymentAmount: '결제금액', refundAmount: '환불금액', netAmount: '순거래금액' }[m]}</button>
                ))}
                <span style={{ flex: 1 }} />
                {(['일별', '주별', '월별'] as Granularity[]).map((g) => (
                  <button key={g} type="button" className={`${styles.chartTag} ${granularity === g ? styles.chartTagActive : ''}`} onClick={() => setGranularity(g)}>{g}</button>
                ))}
              </div>
              <BarChart buckets={chartData} metric={metricLabel} />
            </div>
          </>
        )}

        {tab === 'report' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>거래 리포트 · {fmtDate(start)} ~ {fmtDate(end)}</span>
                <button type="button" className={styles.downloadBtn} onClick={toastDownload}>리포트 다운로드</button>
              </div>
              {compare && <div className={styles.sectionNote} style={{ marginBottom: 10 }}>비교 기간 {fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</div>}
              <div className={styles.statGrid}>
                <StatCard label="주문" value={fmtCount(agg.orderCount)} deltaValue={d('orderCount')?.pct} hasPrevious={d('orderCount')?.hasPrevious} />
                <StatCard label="결제금액" value={fmtWon(agg.paymentAmount)} deltaValue={d('paymentAmount')?.pct} hasPrevious={d('paymentAmount')?.hasPrevious} />
                <StatCard label="순거래금액" value={fmtWon(agg.netAmount)} deltaValue={d('netAmount')?.pct} hasPrevious={d('netAmount')?.hasPrevious} />
                <StatCard label="환불금액" value={fmtWon(agg.refundAmount)} deltaValue={d('refundAmount')?.pct} hasPrevious={d('refundAmount')?.hasPrevious} positiveIsBad />
                <StatCard label="정산금액" value={fmtWon(agg.settlementFinal)} deltaValue={d('settlementFinal')?.pct} hasPrevious={d('settlementFinal')?.hasPrevious} />
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>주요 변화</span></div>
                <ul className={styles.bulletList}>{highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>확인 필요</span></div>
                {issues.length === 0 ? (
                  <div className={`${styles.issueBanner} ${styles.issueOk}`}>현재 확인이 필요한 이슈가 없습니다.</div>
                ) : (
                  issues.map((iss, i) => <div key={i} className={styles.issueBanner}>⚠ {iss.text}</div>)
                )}
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>거래금액 TOP 거래처</span></div>
                <BreakdownTable rows={companies.slice(0, 5)} />
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>주문금액 TOP 상품</span></div>
                <BreakdownTable rows={products.slice(0, 5)} countLabel="판매수량" />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
