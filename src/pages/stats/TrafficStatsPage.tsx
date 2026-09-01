import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadStatisticsReport } from '../../lib/statisticsReport';
import shared from '../ops/opsShared.module.css';
import styles from './TransactionStatsPage.module.css';
import {
  CONVERSION_GOALS,
  TODAY,
  aggregate,
  bucketSeries,
  channelBreakdown,
  computeFunnel,
  delta,
  fmtCases,
  fmtDate,
  fmtPct,
  fmtSessions,
  fmtSignedPct,
  fmtUsers,
  landingBreakdown,
  previousPeriod,
  quickRangeDates,
  type ChannelRow,
  type ConversionGoal,
  type Granularity,
  type LandingRow,
  type QuickRange,
  type TrafficPeriodAggregate,
} from './trafficStatsData';

type Tab = 'overview' | 'acquisition' | 'landing' | 'conversion' | 'funnel' | 'report';
const TABS: [Tab, string][] = [
  ['overview', '종합'],
  ['acquisition', '유입'],
  ['landing', '랜딩'],
  ['conversion', '전환'],
  ['funnel', '퍼널'],
  ['report', '리포트'],
];
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type Metric = 'visitors' | 'sessions' | 'conversions' | 'conversionRate';
const METRIC_LABEL: Record<Metric, string> = { visitors: '방문 사용자', sessions: '세션', conversions: '전환', conversionRate: '전환율' };

const GOAL_DRILL_PATH: Record<ConversionGoal, string> = {
  '회원 가입': '/members?view=new',
  '주문 완료': '/orders/completed',
  '결제 완료': '/payment-mgmt/list',
  '문의 등록': '/cs/inquiries',
};

function StatCard({ label, value, def, deltaValue, deltaIsPoint, hasPrevious, sub, positiveIsBad }: {
  label: string; value: string; def?: string; deltaValue?: number; deltaIsPoint?: boolean; hasPrevious?: boolean; sub?: string; positiveIsBad?: boolean;
}) {
  const deltaClass = deltaValue == null ? undefined : Math.abs(deltaValue) < 0.05 ? styles.deltaFlat : (deltaValue > 0) === !positiveIsBad ? styles.deltaUp : styles.deltaDown;
  const deltaText = deltaValue == null ? '' : deltaIsPoint ? `${deltaValue > 0 ? '▲' : deltaValue < 0 ? '▼' : ''} ${Math.abs(deltaValue).toFixed(2)}p` : fmtSignedPct(deltaValue);
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}{def && <span className={styles.defIcon} title={def}>ⓘ</span>}</div>
      <div className={styles.statValue}>{value}</div>
      {deltaValue != null && (
        <div className={`${styles.statDelta} ${deltaClass}`}>{hasPrevious ? deltaText : '비교 데이터 없음'} <span style={{ color: '#c4c4c8' }}>vs 이전 기간</span></div>
      )}
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

function BarChart({ buckets, metricLabel, isPct = false }: { buckets: { label: string; value: number }[]; metricLabel: string; isPct?: boolean }) {
  const max = Math.max(...buckets.map((b) => b.value), 1);
  if (buckets.every((b) => b.value === 0)) return <div className={styles.emptyNote}>선택한 기간에 유입 데이터가 없습니다.</div>;
  return (
    <>
      <div className={styles.chartArea}>
        {buckets.map((b) => (
          <div key={b.label} className={styles.chartBarWrap} title={`${b.label} · ${metricLabel} ${isPct ? b.value.toFixed(2) + '%' : b.value.toLocaleString('ko-KR')}`}>
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

export function TrafficStatsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState(TODAY);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [compare, setCompare] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>('일별');
  const [metric, setMetric] = useState<Metric>('visitors');
  const [goal, setGoal] = useState<ConversionGoal>('회원 가입');

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s); setEnd(e); setDraftStart(s); setDraftEnd(e);
  };
  const applyCustom = () => { setStart(draftStart); setEnd(draftEnd); };

  const agg: TrafficPeriodAggregate = useMemo(() => aggregate(start, end, goal), [start, end, goal]);
  const [prevStart, prevEnd] = useMemo(() => previousPeriod(start, end), [start, end]);
  const prevAgg: TrafficPeriodAggregate = useMemo(() => aggregate(prevStart, prevEnd, goal), [prevStart, prevEnd, goal]);

  const d = (key: keyof TrafficPeriodAggregate) => (compare ? delta(agg[key] as number, prevAgg[key] as number) : undefined);

  const buckets = useMemo(() => bucketSeries(start, end, goal, granularity), [start, end, goal, granularity]);
  const chartData = buckets.map((b) => ({ label: b.label, value: b[metric] }));

  const channels: ChannelRow[] = useMemo(() => channelBreakdown(agg), [agg]);
  const landings: LandingRow[] = useMemo(() => landingBreakdown(agg), [agg]);
  const funnel = useMemo(() => computeFunnel(agg), [agg]);
  const topChannel = channels.length ? channels.reduce((best, c) => (c.visitors > best.visitors ? c : best), channels[0]) : null;
  const topConvChannel = channels.length ? channels.reduce((best, c) => (c.conversionRate > best.conversionRate ? c : best), channels[0]) : null;

  const issues: string[] = [];
  const visitorDelta = compare ? delta(agg.visitors, prevAgg.visitors) : null;
  const rateDeltaPoint = compare ? agg.conversionRate - prevAgg.conversionRate : 0;
  if (visitorDelta && visitorDelta.pct > 5 && rateDeltaPoint < -0.3) {
    issues.push(`방문 사용자는 ${fmtSignedPct(visitorDelta.pct)} 늘었지만 전환율은 ${rateDeltaPoint.toFixed(2)}p 하락했습니다. (${fmtPct(prevAgg.conversionRate)} → ${fmtPct(agg.conversionRate)})`);
  }
  const worstStep = funnel.slice(1).reduce((worst, s) => (s.pctOfPrev != null && (worst == null || s.pctOfPrev < worst.pctOfPrev!) ? s : worst), null as (typeof funnel)[number] | null);
  if (worstStep && worstStep.pctOfPrev != null && worstStep.pctOfPrev < 50) {
    issues.push(`퍼널에서 '${worstStep.label}' 단계의 이전 단계 대비 전환율이 ${fmtPct(worstStep.pctOfPrev)}로 가장 낮습니다.`);
  }

  const highlights: string[] = [];
  if (compare) {
    const vD = delta(agg.visitors, prevAgg.visitors);
    highlights.push(`방문 사용자는 이전 기간 대비 ${fmtSignedPct(vD.pct)} ${vD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const cD = delta(agg.conversions, prevAgg.conversions);
    highlights.push(`전환수는 ${fmtSignedPct(cD.pct)} ${cD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    highlights.push(`전환율은 ${fmtPct(prevAgg.conversionRate)}에서 ${fmtPct(agg.conversionRate)}로 ${rateDeltaPoint >= 0 ? '상승' : '하락'}했습니다.`);
    if (topConvChannel) highlights.push(`${topConvChannel.name}의 전환율이 ${fmtPct(topConvChannel.conversionRate)}로 가장 높았습니다.`);
  } else {
    highlights.push('비교 기간이 설정되지 않아 변화율을 계산할 수 없습니다. 상단에서 "이전 기간과 비교"를 켜주세요.');
  }

  const toastDownload = () => {
    const metricRow = (label: string, key: keyof TrafficPeriodAggregate) => {
      const change = d(key);
      return { label, current: agg[key] as number, previous: compare ? prevAgg[key] as number : undefined, change: change?.abs, changeRate: change ? `${change.pct.toFixed(1)}%` : undefined };
    };
    downloadStatisticsReport({
      reportName: '유입 전환 통계', mode: '통합', period: `${start}~${end}`, comparisonPeriod: compare ? `${prevStart}~${prevEnd}` : undefined,
      filters: [['전환 목표', goal], ['집계 단위', granularity], ['현재 탭', TABS.find(([key]) => key === tab)?.[1] ?? tab]],
      summary: [metricRow('방문 사용자', 'visitors'), metricRow('세션', 'sessions'), metricRow('전환', 'conversions'), metricRow('전환율', 'conversionRate')],
      trend: { name: '02_유입추이', headers: ['기간', '방문 사용자', '세션', '전환', '전환율(%)'], rows: buckets.map((row) => [row.label, row.visitors, row.sessions, row.conversions, Number(row.conversionRate.toFixed(2))]) },
      dimensions: [
        { name: '채널별', headers: ['채널', 'Source', 'Medium', '방문자', '세션', '전환', '전환율(%)', '비중(%)'], rows: channels.map((row) => [row.name, row.source, row.medium, row.visitors, row.sessions, row.conversions, Number(row.conversionRate.toFixed(2)), Number(row.share.toFixed(2))]) },
        { name: '랜딩별', headers: ['페이지', '세션', '방문자', '전환', '전환율(%)', '비중(%)'], rows: landings.map((row) => [row.page, row.sessions, row.visitors, row.conversions, Number(row.conversionRate.toFixed(2)), Number(row.share.toFixed(2))]) },
        { name: 'Funnel', headers: ['단계', '사용자', '이전 단계 대비(%)'], rows: funnel.map((row) => [row.label, row.count, row.pctOfPrev == null ? '-' : Number(row.pctOfPrev.toFixed(2))]) },
      ],
      definitions: [{ term: '방문 사용자', description: '조회 기간 중 서비스를 방문한 고유 사용자' }, { term: '전환', description: `선택한 목표(${goal})를 완료한 사용자 수` }, { term: '전환율', description: '방문 사용자 중 전환을 완료한 사용자의 비율' }],
    });
  };

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>유입 / 전환</h1>
            <p className={shared.subtitle}>서비스 유입 경로와 주요 전환 성과를 분석합니다.</p>
          </div>
        </div>
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
          <span style={{ fontSize: 12, color: '#52525b' }}>전환 목표</span>
          <label className="globalFilterField"><span>전환 목표</span><select aria-label="전환 목표" className={styles.selectSm} value={goal} onChange={(e) => setGoal(e.target.value as ConversionGoal)}>
            {CONVERSION_GOALS.map((g) => <option key={g}>{g}</option>)}
          </select></label>
        </div>
        <div className={styles.filterRow}>
          {QUICK_RANGES.map((r) => {
            const [qs, qe] = quickRangeDates(r);
            const active = qs === start && qe === end;
            return <button key={r} type="button" className={`${styles.quickBtn} ${active ? styles.quickBtnActive : ''}`} onClick={() => applyQuick(r)}>{r}</button>;
          })}
        </div>
        <div className={styles.periodInfo}>
          조회 기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b> ({agg.days}일){compare && <> · 비교 기간 <b>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</b> ({prevAgg.days}일)</>} · 전환 목표 <b>{goal}</b>
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
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>핵심 지표</span><span className={styles.sectionNote}>전환 목표: {goal}</span></div>
              <div className={styles.statGrid}>
                <StatCard label="방문 사용자" value={fmtUsers(agg.visitors)} def="조회 기간 내 Unique 방문 사용자" deltaValue={d('visitors')?.pct} hasPrevious={d('visitors')?.hasPrevious} />
                <StatCard label="세션" value={fmtSessions(agg.sessions)} def="방문 Session 수 (한 사용자가 여러 세션을 만들 수 있음)" deltaValue={d('sessions')?.pct} hasPrevious={d('sessions')?.hasPrevious} />
                <StatCard label="신규 사용자" value={fmtUsers(agg.newVisitors)} deltaValue={d('newVisitors')?.pct} hasPrevious={d('newVisitors')?.hasPrevious} />
                <StatCard label="전환" value={fmtCases(agg.conversions)} deltaValue={d('conversions')?.pct} hasPrevious={d('conversions')?.hasPrevious} />
                <StatCard label="전환율" value={fmtPct(agg.conversionRate)} def="전환 사용자 / 방문 사용자 × 100" deltaValue={compare ? agg.conversionRate - prevAgg.conversionRate : undefined} deltaIsPoint hasPrevious={compare} />
                <StatCard label="주요 유입 채널" value={topChannel?.name ?? '-'} sub={topChannel ? `${fmtUsers(topChannel.visitors)} · ${fmtPct(topChannel.share, 1)}` : undefined} />
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>유입 / 전환 추이</span></div>
              <div className={styles.chartToolbar}>
                {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
                  <button key={m} type="button" className={`${styles.chartTag} ${metric === m ? styles.chartTagActive : ''}`} onClick={() => setMetric(m)}>{METRIC_LABEL[m]}</button>
                ))}
                <span style={{ flex: 1 }} />
                {(['일별', '주별', '월별'] as Granularity[]).map((g) => (
                  <button key={g} type="button" className={`${styles.chartTag} ${granularity === g ? styles.chartTagActive : ''}`} onClick={() => setGranularity(g)}>{g}</button>
                ))}
              </div>
              <BarChart buckets={chartData} metricLabel={METRIC_LABEL[metric]} isPct={metric === 'conversionRate'} />
            </div>
          </>
        )}

        {tab === 'acquisition' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>유입 지표</span></div>
              <div className={styles.statGrid}>
                <StatCard label="방문 사용자" value={fmtUsers(agg.visitors)} deltaValue={d('visitors')?.pct} hasPrevious={d('visitors')?.hasPrevious} />
                <StatCard label="세션" value={fmtSessions(agg.sessions)} deltaValue={d('sessions')?.pct} hasPrevious={d('sessions')?.hasPrevious} />
                <StatCard label="신규 사용자" value={fmtUsers(agg.newVisitors)} deltaValue={d('newVisitors')?.pct} hasPrevious={d('newVisitors')?.hasPrevious} />
                <StatCard label="재방문 사용자" value={fmtUsers(agg.returningVisitors)} />
                <StatCard label="신규 비율" value={fmtPct(agg.visitors ? (agg.newVisitors / agg.visitors) * 100 : 0, 1)} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>채널별 유입 · Source / Medium</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 1.3fr 90px 90px 90px' }}><span>채널 (Source / Medium)</span><span /><span>사용자</span><span>세션</span><span>비중</span></div>
                {channels.map((c) => (
                  <div key={c.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 1.3fr 90px 90px 90px' }}>
                    <span>{c.name}</span>
                    <span style={{ color: '#a1a1aa', fontSize: 11 }}>{c.source} / {c.medium}</span>
                    <span>{fmtUsers(c.visitors)}</span>
                    <span>{fmtSessions(c.sessions)}</span>
                    <span>{fmtPct(c.share, 1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'landing' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.sectionTitle}>랜딩 페이지별</span><span className={styles.sectionNote}>ⓘ 랜딩 페이지는 세션에서 사용자가 처음 진입한 페이지입니다.</span></div>
            <div className={styles.table}>
              <div className={styles.tableHead} style={{ gridTemplateColumns: '1.2fr 100px 100px 90px 100px' }}><span>랜딩 페이지</span><span>세션</span><span>전환</span><span>전환율</span><span>비중</span></div>
              {landings.map((l) => (
                <div key={l.page} className={styles.tableRow} style={{ gridTemplateColumns: '1.2fr 100px 100px 90px 100px' }}>
                  <span>{l.page}</span><span>{fmtSessions(l.sessions)}</span><span>{fmtCases(l.conversions)}</span><span>{fmtPct(l.conversionRate)}</span><span>{fmtPct(l.share, 1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'conversion' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>전환 지표</span><button type="button" className={styles.downloadBtn} onClick={() => navigate(GOAL_DRILL_PATH[goal])}>전환 데이터에서 보기</button></div>
              <div className={styles.statGrid}>
                <StatCard label="전환" value={fmtCases(agg.conversions)} deltaValue={d('conversions')?.pct} hasPrevious={d('conversions')?.hasPrevious} />
                <StatCard label="전환 사용자" value={fmtUsers(agg.conversionUsers)} def="1회 이상 전환한 Unique 사용자" deltaValue={d('conversionUsers')?.pct} hasPrevious={d('conversionUsers')?.hasPrevious} />
                <StatCard label="전환율" value={fmtPct(agg.conversionRate)} deltaValue={compare ? agg.conversionRate - prevAgg.conversionRate : undefined} deltaIsPoint hasPrevious={compare} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>채널별 전환</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 100px 90px 90px' }}><span>채널</span><span>사용자</span><span>전환</span><span>전환율</span></div>
                {channels.map((c) => (
                  <div key={c.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 90px 90px' }}>
                    <span>{c.name}</span><span>{fmtUsers(c.visitors)}</span><span>{fmtCases(c.conversions)}</span><span>{fmtPct(c.conversionRate)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.sectionNote} style={{ marginTop: 10 }}>유입이 많다고 전환 효율이 높은 것은 아닙니다. 사용자 규모와 전환율을 함께 확인하세요.</div>
            </div>
          </>
        )}

        {tab === 'funnel' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.sectionTitle}>{goal} 퍼널</span><span className={styles.sectionNote}>{fmtDate(start)} ~ {fmtDate(end)}</span></div>
            <div className={styles.flowRow}>
              {funnel.flatMap((s, i) => {
                const nodes = [];
                if (i > 0) {
                  nodes.push(
                    <div key={`arrow-${s.label}`} className={styles.flowArrow}>
                      →<span className={styles.flowMinus}>{s.pctOfPrev != null ? fmtPct(s.pctOfPrev, 1) : ''}</span>
                    </div>,
                  );
                }
                nodes.push(
                  <div key={s.label} className={styles.flowStep}>
                    <div className={styles.statLabel}>{s.label}</div>
                    <div className={styles.statValue}>{fmtUsers(s.count)}</div>
                    <div className={styles.statSub}>전체 대비 {fmtPct(s.pctOfFirst, 1)}</div>
                  </div>,
                );
                return nodes;
              })}
            </div>
            <div className={styles.sectionNote} style={{ marginTop: 14 }}>화살표 아래 숫자는 직전 단계 대비 전환율입니다. 최초 방문 대비 최종 전환율은 {fmtPct(agg.conversionRate)}입니다.</div>
          </div>
        )}

        {tab === 'report' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>유입 / 전환 리포트 · {fmtDate(start)} ~ {fmtDate(end)}</span>
          <button type="button" className={styles.downloadBtn} data-grid-download onClick={toastDownload}>리포트 다운로드</button>
              </div>
              {compare && <div className={styles.sectionNote} style={{ marginBottom: 10 }}>비교 기간 {fmtDate(prevStart)} ~ {fmtDate(prevEnd)} · 전환 목표 {goal}</div>}
              <div className={styles.statGrid}>
                <StatCard label="방문 사용자" value={fmtUsers(agg.visitors)} deltaValue={d('visitors')?.pct} hasPrevious={d('visitors')?.hasPrevious} />
                <StatCard label="세션" value={fmtSessions(agg.sessions)} deltaValue={d('sessions')?.pct} hasPrevious={d('sessions')?.hasPrevious} />
                <StatCard label="신규 사용자" value={fmtUsers(agg.newVisitors)} deltaValue={d('newVisitors')?.pct} hasPrevious={d('newVisitors')?.hasPrevious} />
                <StatCard label="전환" value={fmtCases(agg.conversions)} deltaValue={d('conversions')?.pct} hasPrevious={d('conversions')?.hasPrevious} />
                <StatCard label="전환율" value={fmtPct(agg.conversionRate)} deltaValue={compare ? agg.conversionRate - prevAgg.conversionRate : undefined} deltaIsPoint hasPrevious={compare} />
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
                  issues.map((iss, i) => <div key={i} className={styles.issueBanner}>⚠ {iss}</div>)
                )}
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>TOP 유입 채널</span></div>
                <div className={styles.table}>
                  <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 110px 80px' }}><span>채널</span><span>사용자</span><span>비중</span></div>
                  {channels.slice(0, 5).map((c) => (
                    <div key={c.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 110px 80px' }}><span>{c.name}</span><span>{fmtUsers(c.visitors)}</span><span>{fmtPct(c.share, 1)}</span></div>
                  ))}
                </div>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>TOP 전환 채널 (전환율)</span></div>
                <div className={styles.table}>
                  <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 110px 80px' }}><span>채널</span><span>전환</span><span>전환율</span></div>
                  {[...channels].sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 5).map((c) => (
                    <div key={c.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 110px 80px' }}><span>{c.name}</span><span>{fmtCases(c.conversions)}</span><span>{fmtPct(c.conversionRate)}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
