import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import shared from '../ops/opsShared.module.css';
import styles from '../stats/TransactionStatsPage.module.css';
import extra from './cartConversionExtra.module.css';
import {
  CATEGORIES,
  CHANNELS,
  DROPOFF_THRESHOLDS,
  THRESHOLD_FACTOR,
  TODAY,
  aggregate,
  bucketSeries,
  delta,
  fmtCount,
  fmtDate,
  fmtItemCount,
  fmtPct,
  fmtSignedPct,
  fmtWon,
  funnelSteps,
  previousPeriod,
  productBreakdown,
  quickRangeDates,
  type Category,
  type Channel,
  type DropoffThreshold,
  type Granularity,
  type PeriodAggregate,
  type QuickRange,
} from './cartConversionData';

type Tab = 'overview' | 'dropoff' | 'funnel';
const TABS: [Tab, string][] = [['overview', '현황'], ['dropoff', '이탈 분석'], ['funnel', '구매 퍼널']];
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

function BarChart({ buckets, metric, fmt }: { buckets: { label: string; value: number }[]; metric: string; fmt: (n: number) => string }) {
  const max = Math.max(...buckets.map((b) => b.value), 1);
  if (buckets.every((b) => b.value === 0)) return <div className={styles.emptyNote}>선택한 기간에 데이터가 없습니다.</div>;
  return (
    <>
      <div className={styles.chartArea}>
        {buckets.map((b) => (
          <div key={b.label} className={styles.chartBarWrap} title={`${b.label} · ${metric} ${fmt(b.value)}`}>
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

export function CartConversionPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [start, setStart] = useState(quickRangeDates('최근 30일')[0]);
  const [end, setEnd] = useState(TODAY);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [compare, setCompare] = useState(true);
  const [channel, setChannel] = useState<Channel>('전체');
  const [category, setCategory] = useState<Category>('전체');
  const [granularity, setGranularity] = useState<Granularity>('일별');
  const [metric, setMetric] = useState<'cartUsers' | 'buyUsers' | 'conversionRate'>('cartUsers');
  const [threshold, setThreshold] = useState<DropoffThreshold>('24시간');

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s); setEnd(e); setDraftStart(s); setDraftEnd(e);
  };
  const applyCustom = () => { setStart(draftStart); setEnd(draftEnd); };
  const resetFilters = () => { setChannel('전체'); setCategory('전체'); applyQuick('최근 30일'); };

  const agg: PeriodAggregate = useMemo(() => aggregate(start, end, channel, category), [start, end, channel, category]);
  const [prevStart, prevEnd] = useMemo(() => previousPeriod(start, end), [start, end]);
  const prevAgg: PeriodAggregate = useMemo(() => aggregate(prevStart, prevEnd, channel, category), [prevStart, prevEnd, channel, category]);
  const d = (key: keyof PeriodAggregate) => (compare ? delta(agg[key] as number, prevAgg[key] as number) : undefined);

  const buckets = useMemo(() => bucketSeries(start, end, granularity, channel, category), [start, end, granularity, channel, category]);
  const chartData = buckets.map((b) => ({ label: b.label, value: b[metric] }));
  const metricLabel = { cartUsers: '장바구니 사용자', buyUsers: '구매 사용자', conversionRate: '구매 전환율' }[metric];
  const metricFmt = metric === 'conversionRate' ? (n: number) => fmtPct(n) : fmtCount;

  const products = useMemo(() => productBreakdown(agg), [agg]);
  const productsByDropoff = useMemo(() => [...products].sort((a, b) => b.dropoffRate - a.dropoffRate), [products]);

  const dropoffUsers = Math.round((agg.cartUsers - agg.buyUsers) * THRESHOLD_FACTOR[threshold]);
  const dropoffRate = agg.cartUsers ? Math.min(100, (dropoffUsers / agg.cartUsers) * 100) : 0;
  const dailyDropoff = useMemo(() => bucketSeries(start, end, '일별', channel, category).slice(-14).reverse(), [start, end, channel, category]);

  const steps = useMemo(() => funnelSteps(agg), [agg]);
  const prevSteps = useMemo(() => funnelSteps(prevAgg), [prevAgg]);
  const maxStep = Math.max(...steps.map((s) => s.count), 1);
  const finalConv = steps[0].count ? (steps[steps.length - 1].count / steps[0].count) * 100 : 0;
  const prevFinalConv = prevSteps[0].count ? (prevSteps[prevSteps.length - 1].count / prevSteps[0].count) * 100 : 0;

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>장바구니 / 구매 전환</h1>
            <p className={shared.subtitle}>장바구니 이용 현황과 구매 전환 흐름을 분석합니다.</p>
          </div>
        </div>
      </div>

      <div className={styles.viewTabs}>
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={`${styles.viewTabBtn} ${tab === key ? styles.viewTabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          <input type="date" className={styles.dateInput} value={draftStart} onChange={(e) => setDraftStart(e.target.value)} />
          <span className={styles.tilde}>~</span>
          <input type="date" className={styles.dateInput} value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} />
          <button type="button" className={styles.applyBtn} onClick={applyCustom}>조회</button>
          <label className={styles.compareCheck}>
            <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> 이전 기간과 비교
          </label>
          <span style={{ flex: 1 }} />
          <button type="button" className={styles.resetLink} onClick={resetFilters}>초기화</button>
        </div>
        <div className={styles.filterRow}>
          {QUICK_RANGES.map((r) => {
            const [qs, qe] = quickRangeDates(r);
            const active = qs === start && qe === end;
            return <button key={r} type="button" className={`${styles.quickBtn} ${active ? styles.quickBtnActive : ''}`} onClick={() => applyQuick(r)}>{r}</button>;
          })}
        </div>
        <div className={styles.filterRow}>
          <label className="globalFilterField"><span>채널</span><select aria-label="채널" className={styles.selectSm} value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
            {CHANNELS.map((c) => <option key={c} value={c}>{c === '전체' ? '채널 전체' : c}</option>)}
          </select></label>
          <label className="globalFilterField"><span>카테고리</span><select aria-label="카테고리" className={styles.selectSm} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c === '전체' ? '카테고리 전체' : c}</option>)}
          </select></label>
        </div>
        <div className={styles.periodInfo}>
          조회 기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b> ({agg.days}일){compare && <> · 비교 기간 <b>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</b> ({prevAgg.days}일)</>}
        </div>
      </div>

      <div className={styles.body}>
        {tab === 'overview' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>핵심 지표</span></div>
              <div className={styles.statGrid}>
                <StatCard label="장바구니 사용자" value={fmtCount(agg.cartUsers)} deltaValue={d('cartUsers')?.pct} hasPrevious={d('cartUsers')?.hasPrevious} />
                <StatCard label="장바구니 상품" value={fmtItemCount(agg.cartItems)} deltaValue={d('cartItems')?.pct} hasPrevious={d('cartItems')?.hasPrevious} />
                <StatCard label="구매 사용자" value={fmtCount(agg.buyUsers)} deltaValue={d('buyUsers')?.pct} hasPrevious={d('buyUsers')?.hasPrevious} />
                <StatCard label="구매 완료" value={fmtItemCount(agg.buyOrders)} deltaValue={d('buyOrders')?.pct} hasPrevious={d('buyOrders')?.hasPrevious} />
                <StatCard label="구매 전환율" value={fmtPct(agg.conversionRate)} def="구매 사용자 / 장바구니 사용자 × 100" deltaValue={compare ? agg.conversionRate - prevAgg.conversionRate : undefined} hasPrevious={compare} />
                <StatCard label="이탈률" value={fmtPct(agg.dropoffRate)} def="1 − (구매 사용자 / 장바구니 사용자)" deltaValue={compare ? agg.dropoffRate - prevAgg.dropoffRate : undefined} hasPrevious={compare} positiveIsBad />
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>장바구니 / 구매 추이</span></div>
              <div className={styles.chartToolbar}>
                {(['cartUsers', 'buyUsers', 'conversionRate'] as const).map((m) => (
                  <button key={m} type="button" className={`${styles.chartTag} ${metric === m ? styles.chartTagActive : ''}`} onClick={() => setMetric(m)}>{{ cartUsers: '장바구니 사용자', buyUsers: '구매 사용자', conversionRate: '전환율' }[m]}</button>
                ))}
                <span style={{ flex: 1 }} />
                {(['일별', '주별', '월별'] as Granularity[]).map((g) => (
                  <button key={g} type="button" className={`${styles.chartTag} ${granularity === g ? styles.chartTagActive : ''}`} onClick={() => setGranularity(g)}>{g}</button>
                ))}
              </div>
              <BarChart buckets={chartData} metric={metricLabel} fmt={metricFmt} />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>상품별 장바구니 현황</span><span className={styles.sectionNote}>ⓘ 장바구니 사용자 많은 순</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1.4fr 110px 100px 80px 80px' }}>
                  <span>상품</span><span>장바구니 사용자</span><span>구매 사용자</span><span>전환율</span><span>이탈률</span>
                </div>
                {products.map((p) => (
                  <div key={p.code} className={styles.tableRow} style={{ gridTemplateColumns: '1.4fr 110px 100px 80px 80px' }}>
                    <span style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--accent)' }} onClick={() => navigate('/products')}>{p.name}</span>
                    <span>{fmtCount(p.cartUsers)}</span>
                    <span>{fmtCount(p.buyUsers)}</span>
                    <span>{fmtPct(p.conversionRate)}</span>
                    <span>{fmtPct(p.dropoffRate)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'dropoff' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>이탈 지표</span></div>
              <div className={styles.statGrid}>
                <StatCard label="이탈 사용자" value={fmtCount(dropoffUsers)} />
                <StatCard label="이탈 상품" value={fmtItemCount(Math.round(agg.cartItems * (dropoffRate / 100)))} />
                <StatCard label="이탈률" value={fmtPct(dropoffRate)} positiveIsBad />
                <StatCard label="평균 장바구니 금액" value={fmtWon(agg.avgCartAmount)} />
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>이탈 기준</span></div>
              <select className={extra.thresholdSelect} value={threshold} onChange={(e) => setThreshold(e.target.value as DropoffThreshold)}>
                {DROPOFF_THRESHOLDS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className={extra.thresholdNote}>장바구니에 상품을 담은 후 선택한 시간 내 구매하지 않은 경우를 이탈로 집계합니다.</div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>장바구니 이탈 추이</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 120px 110px 90px' }}>
                  <span>날짜</span><span>장바구니 사용자</span><span>이탈 사용자</span><span>이탈률</span>
                </div>
                {dailyDropoff.map((b) => {
                  const du = Math.round((b.cartUsers - b.buyUsers) * THRESHOLD_FACTOR[threshold]);
                  const dr = b.cartUsers ? Math.min(100, (du / b.cartUsers) * 100) : 0;
                  return (
                    <div key={b.label} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 120px 110px 90px' }}>
                      <span style={{ textAlign: 'left' }}>{b.label}</span>
                      <span>{fmtCount(b.cartUsers)}</span>
                      <span>{fmtCount(du)}</span>
                      <span>{fmtPct(dr)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>상품별 이탈 분석</span><span className={styles.sectionNote}>ⓘ 이탈률 높은 순</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1.4fr 110px 100px 80px 110px' }}>
                  <span>상품</span><span>장바구니 사용자</span><span>이탈 사용자</span><span>이탈률</span><span>평균 장바구니 금액</span>
                </div>
                {productsByDropoff.map((p) => (
                  <div key={p.code} className={styles.tableRow} style={{ gridTemplateColumns: '1.4fr 110px 100px 80px 110px' }}>
                    <span style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--accent)' }} onClick={() => navigate('/products')}>{p.name}</span>
                    <span>{fmtCount(p.cartUsers)}</span>
                    <span>{fmtCount(p.cartUsers - p.buyUsers)}</span>
                    <span>{fmtPct(p.dropoffRate)}</span>
                    <span>{fmtWon(p.avgCartAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'funnel' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>구매 퍼널</span>
                {compare && (
                  <span className={styles.sectionNote}>
                    현재 기간 최종 전환율 {fmtPct(finalConv)} · 이전 기간 {fmtPct(prevFinalConv)} ({fmtSignedPct(finalConv - prevFinalConv)})
                  </span>
                )}
              </div>
              <div className={extra.funnelWrap}>
                {steps.map((s, i) => (
                  <div key={s.key} className={extra.funnelRow}>
                    {i > 0 && (
                      <div className={extra.funnelArrow}>
                        ↓ <b>{steps[i - 1].count ? fmtPct((s.count / steps[i - 1].count) * 100) : '-'}</b> 전환
                        <span className={extra.funnelDrop}>(이탈 {fmtCount(Math.max(0, steps[i - 1].count - s.count))})</span>
                      </div>
                    )}
                    <div className={extra.funnelBar} style={{ width: `${Math.max(28, (s.count / maxStep) * 100)}%` }}>
                      <div className={extra.funnelLabel}>{s.label}</div>
                      <div className={extra.funnelCount}>{fmtCount(s.count)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>단계별 전환·이탈</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 100px 110px 90px 80px 80px' }}>
                  <span>단계</span><span>진입 사용자</span><span>다음 단계 이동</span><span>이탈</span><span>전환율</span><span>이탈률</span>
                </div>
                {steps.map((s, i) => {
                  const next = steps[i + 1];
                  const moved = next ? next.count : s.count;
                  const dropped = s.count - moved;
                  const conv = s.count ? (moved / s.count) * 100 : 0;
                  return (
                    <div key={s.key} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 110px 90px 80px 80px' }}>
                      <span style={{ textAlign: 'left' }}>{s.label}</span>
                      <span>{fmtCount(s.count)}</span>
                      <span>{next ? fmtCount(moved) : '-'}</span>
                      <span>{next ? fmtCount(dropped) : '-'}</span>
                      <span>{next ? fmtPct(conv) : '-'}</span>
                      <span>{next ? fmtPct(100 - conv) : '-'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
