import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CommonButton, CommonCheckbox } from '../../components/common';
import { DatePicker } from '../../components/forms/DatePicker';
import { downloadStatisticsReport } from '../../lib/statisticsReport';
import shared from '../ops/opsShared.module.css';
import styles from './TransactionStatsPage.module.css';
import {
  TODAY,
  aggregate,
  bucketSeries,
  channelBreakdown,
  delta,
  fmtCount,
  fmtDate,
  fmtPct,
  fmtSignedCount,
  fmtSignedPct,
  previousPeriod,
  quickRangeDates,
  seriesInRange,
  statusBreakdown,
  typeBreakdown,
  type Granularity,
  type MemberPeriodAggregate,
  type QuickRange,
  type WeightedRow,
} from './memberStatsData';

type Tab = 'overview' | 'signup' | 'status' | 'activity' | 'retention' | 'report';
const TABS: [Tab, string][] = [
  ['overview', '종합'],
  ['signup', '가입'],
  ['status', '회원 현황'],
  ['activity', '활동'],
  ['retention', '유지 / 이탈'],
  ['report', '회원 리포트'],
];
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type Metric = 'newSignups' | 'churned' | 'netGrowth' | 'totalMembers';
const METRIC_LABEL: Record<Metric, string> = { newSignups: '신규 가입', churned: '탈퇴', netGrowth: '순증', totalMembers: '전체 회원' };

function StatCard({ label, value, def, deltaValue, deltaIsPoint, hasPrevious, sub, positiveIsBad }: {
  label: string; value: string; def?: string; deltaValue?: number; deltaIsPoint?: boolean; hasPrevious?: boolean; sub?: string; positiveIsBad?: boolean;
}) {
  const deltaClass = deltaValue == null ? undefined : Math.abs(deltaValue) < 0.05 ? styles.deltaFlat : (deltaValue > 0) === !positiveIsBad ? styles.deltaUp : styles.deltaDown;
  const deltaText = deltaValue == null ? '' : deltaIsPoint
    ? `${deltaValue > 0 ? '▲' : deltaValue < 0 ? '▼' : ''} ${Math.abs(deltaValue).toFixed(1)}p`
    : fmtSignedPct(deltaValue);
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

function BreakdownTable({ rows, countLabel = '회원수' }: { rows: WeightedRow[]; countLabel?: string }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className={styles.table}>
      <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 110px 80px 1fr' }}><span>이름</span><span>{countLabel}</span><span>비중</span><span /></div>
      {rows.map((r) => (
        <div key={r.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 110px 80px 1fr' }}>
          <span>{r.name}</span>
          <span>{fmtCount(r.count)}</span>
          <span>{fmtPct(r.share)}</span>
          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${(r.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function BarChart({ buckets, metricLabel }: { buckets: { label: string; value: number }[]; metricLabel: string }) {
  const max = Math.max(...buckets.map((b) => Math.abs(b.value)), 1);
  if (buckets.every((b) => b.value === 0)) return <div className={styles.emptyNote}>선택한 기간에 회원 데이터가 없습니다.</div>;
  return (
    <>
      <div className={styles.chartArea}>
        {buckets.map((b) => (
          <div key={b.label} className={styles.chartBarWrap} title={`${b.label} · ${metricLabel} ${b.value.toLocaleString('ko-KR')}명`}>
            <div className={styles.chartBar} style={{ height: `${Math.max(2, (Math.abs(b.value) / max) * 100)}%`, background: b.value < 0 ? '#dc2626' : undefined }} />
          </div>
        ))}
      </div>
      <div className={styles.chartAxis}>
        {buckets.map((b, i) => (i % Math.ceil(buckets.length / 12 || 1) === 0 ? <span key={b.label} className={styles.chartAxisLabel}>{b.label}</span> : <span key={b.label} className={styles.chartAxisLabel} />))}
      </div>
    </>
  );
}

export function MemberStatsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState(TODAY);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [compare, setCompare] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>('일별');
  const [metric, setMetric] = useState<Metric>('newSignups');

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s); setEnd(e); setDraftStart(s); setDraftEnd(e);
  };
  const applyCustom = () => { setStart(draftStart); setEnd(draftEnd); };

  const agg: MemberPeriodAggregate = useMemo(() => aggregate(start, end), [start, end]);
  const [prevStart, prevEnd] = useMemo(() => previousPeriod(start, end), [start, end]);
  const prevAgg: MemberPeriodAggregate = useMemo(() => aggregate(prevStart, prevEnd), [prevStart, prevEnd]);

  const d = (key: keyof MemberPeriodAggregate) => (compare ? delta(agg[key] as number, prevAgg[key] as number) : undefined);

  const buckets = useMemo(() => bucketSeries(start, end, granularity), [start, end, granularity]);
  const chartData = buckets.map((b) => ({ label: b.label, value: b[metric] }));

  const statuses = useMemo(() => statusBreakdown(agg), [agg]);
  const types = useMemo(() => typeBreakdown(agg), [agg]);
  const channels = useMemo(() => channelBreakdown(agg), [agg]);
  const dailyActiveSeries = useMemo(
    () => seriesInRange(start, end).map((r) => ({ label: r.date.slice(5).replace('-', '.'), value: r.dailyActive })),
    [start, end],
  );

  const issues: string[] = [];
  const churnDeltaPoint = compare ? agg.churnRate - prevAgg.churnRate : 0;
  if (churnDeltaPoint > 0.03) issues.push(`탈퇴율이 이전 기간 대비 ${churnDeltaPoint.toFixed(2)}p 상승했습니다. (${fmtPct(prevAgg.churnRate, 2)} → ${fmtPct(agg.churnRate, 2)})`);
  const activeDeltaPoint = compare ? agg.activeRate - prevAgg.activeRate : 0;
  if (activeDeltaPoint < -0.5) issues.push(`활성률이 이전 기간 대비 ${Math.abs(activeDeltaPoint).toFixed(1)}p 하락했습니다. (${fmtPct(prevAgg.activeRate)} → ${fmtPct(agg.activeRate)})`);
  const signupDelta = compare ? delta(agg.newSignups, prevAgg.newSignups) : null;
  if (signupDelta && signupDelta.pct < -10) issues.push(`신규 가입이 이전 기간 대비 ${fmtPct(Math.abs(signupDelta.pct))} 감소했습니다.`);

  const highlights: string[] = [];
  if (compare) {
    const sD = delta(agg.newSignups, prevAgg.newSignups);
    highlights.push(`신규 가입 회원은 이전 기간 대비 ${fmtSignedPct(sD.pct)} ${sD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const cD = delta(agg.churned, prevAgg.churned);
    highlights.push(`탈퇴 회원은 ${fmtSignedPct(cD.pct)} ${cD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const nD = delta(agg.netGrowth, prevAgg.netGrowth);
    highlights.push(`순증 회원은 ${fmtSignedCount(agg.netGrowth)}으로, 이전 기간 대비 ${fmtSignedPct(nD.pct)} ${nD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const aD = delta(agg.activeMembers, prevAgg.activeMembers);
    highlights.push(`활성 회원은 ${fmtSignedPct(aD.pct)} ${aD.pct >= 0 ? '증가' : '감소'}했습니다.`);
  } else {
    highlights.push('비교 기간이 설정되지 않아 변화율을 계산할 수 없습니다. 상단에서 "이전 기간과 비교"를 켜주세요.');
  }

  const toastDownload = () => {
    const metricRow = (label: string, key: keyof MemberPeriodAggregate) => {
      const change = d(key);
      return { label, current: agg[key] as number, previous: compare ? prevAgg[key] as number : undefined, change: change?.abs, changeRate: change ? `${change.pct.toFixed(1)}%` : undefined };
    };
    const weightedSheet = (name: string, rows: WeightedRow[]) => ({ name, headers: ['구분', '회원 수', '비중(%)'], rows: rows.map((row) => [row.name, row.count, Number(row.share.toFixed(2))]) });
    downloadStatisticsReport({
      reportName: '회원 통계', mode: '통합', period: `${start}~${end}`, comparisonPeriod: compare ? `${prevStart}~${prevEnd}` : undefined,
      filters: [['집계 단위', granularity], ['현재 탭', TABS.find(([key]) => key === tab)?.[1] ?? tab]],
      summary: [metricRow('전체 회원', 'totalMembersAtEnd'), metricRow('신규 가입', 'newSignups'), metricRow('활성 회원', 'activeMembers'), metricRow('탈퇴 회원', 'churned'), metricRow('순증 회원', 'netGrowth')],
      trend: { name: '02_회원추이', headers: ['기간', '신규 가입', '탈퇴', '순증', '전체 회원'], rows: buckets.map((row) => [row.label, row.newSignups, row.churned, row.netGrowth, row.totalMembers]) },
      dimensions: [weightedSheet('상태별', statuses), weightedSheet('회원유형별', types), weightedSheet('가입채널별', channels), { name: '일별활성', headers: ['일자', '활성 회원'], rows: dailyActiveSeries.map((row) => [row.label, row.value]) }],
      definitions: [{ term: '활성 회원', description: '조회 기간 중 로그인 또는 주요 서비스 활동이 1회 이상인 고유 회원' }, { term: '순증 회원', description: '신규 가입 회원 수에서 탈퇴 회원 수를 차감한 값' }, { term: '탈퇴율', description: '조회 기간 시작 회원 대비 탈퇴 회원 비율' }],
    });
  };

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>회원 통계</h1>
            <p className={shared.subtitle}>회원 가입, 활동, 유지 및 이탈 현황을 조회합니다.</p>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterRow}>
          <DatePicker controlSize="sm" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} />
          <span className={styles.tilde}>~</span>
          <DatePicker controlSize="sm" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} />
          <button type="button" className={styles.applyBtn} onClick={applyCustom}>조회</button>
          <CommonCheckbox className={styles.compareCheck} size="sm" checked={compare} onChange={setCompare}>이전 기간과 비교</CommonCheckbox>
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
        {TABS.map(([key, label]) => {
          const active = tab === key;
          return (
            <CommonButton
              key={key}
              type="button"
              variant={active ? 'primary-light' : 'secondary'}
              size="md"
              className={`${styles.viewTabBtn} ${active ? styles.viewTabActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </CommonButton>
          );
        })}
      </div>

      <div className={styles.body}>
        {tab === 'overview' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>핵심 지표</span><span className={styles.sectionNote}>전체 회원은 {fmtDate(end)} 기준 Snapshot, 나머지는 조회 기간 집계입니다.</span></div>
              <div className={styles.statGrid}>
                <StatCard label="전체 회원" value={fmtCount(agg.totalMembersAtEnd)} def={`${fmtDate(end)} 기준 전체 회원 수 (Snapshot)`} />
                <StatCard label="신규 가입" value={fmtCount(agg.newSignups)} deltaValue={d('newSignups')?.pct} hasPrevious={d('newSignups')?.hasPrevious} />
                <StatCard label="순증 회원" value={fmtSignedCount(agg.netGrowth)} def="신규 가입 - 탈퇴" deltaValue={d('netGrowth')?.pct} hasPrevious={d('netGrowth')?.hasPrevious} />
                <StatCard label="활성 회원" value={fmtCount(agg.activeMembers)} def="조회 기간 내 로그인 또는 주요 활동이 1회 이상 발생한 회원 추정치" deltaValue={d('activeMembers')?.pct} hasPrevious={d('activeMembers')?.hasPrevious} />
                <StatCard label="탈퇴 회원" value={fmtCount(agg.churned)} deltaValue={d('churned')?.pct} hasPrevious={d('churned')?.hasPrevious} positiveIsBad />
                <StatCard label="탈퇴율" value={fmtPct(agg.churnRate, 2)} def="탈퇴 회원 수 / 기간 시작 시점 유효 회원 수 × 100" deltaValue={compare ? agg.churnRate - prevAgg.churnRate : undefined} deltaIsPoint hasPrevious={compare} positiveIsBad />
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>회원 증감 추이</span></div>
              <div className={styles.chartToolbar}>
                {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
                  <button key={m} type="button" className={`${styles.chartTag} ${metric === m ? styles.chartTagActive : ''}`} onClick={() => setMetric(m)}>{METRIC_LABEL[m]}</button>
                ))}
                <span style={{ flex: 1 }} />
                {(['일별', '주별', '월별'] as Granularity[]).map((g) => (
                  <button key={g} type="button" className={`${styles.chartTag} ${granularity === g ? styles.chartTagActive : ''}`} onClick={() => setGranularity(g)}>{g}</button>
                ))}
              </div>
              <BarChart buckets={chartData} metricLabel={METRIC_LABEL[metric]} />
            </div>
          </>
        )}

        {tab === 'signup' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>가입 지표</span><span className={styles.sectionNote}>ⓘ 가입 완료일 기준으로 집계됩니다.</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/members?view=new')}>신규 가입 회원 보기</button></div>
              <div className={styles.statGrid}>
                <StatCard label="신규 가입" value={fmtCount(agg.newSignups)} deltaValue={d('newSignups')?.pct} hasPrevious={d('newSignups')?.hasPrevious} />
                <StatCard label="일평균 가입" value={`${agg.avgDailySignups.toFixed(1)}명`} />
              </div>
            </div>
            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>가입 추이</span></div>
                <BarChart buckets={buckets.map((b) => ({ label: b.label, value: b.newSignups }))} metricLabel="신규 가입" />
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>가입 경로별</span></div>
                <BreakdownTable rows={channels} countLabel="가입수" />
              </div>
            </div>
          </>
        )}

        {tab === 'status' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>회원 현황</span><span className={styles.sectionNote}>데이터 기준 {fmtDate(end)} (Snapshot)</span></div>
              <div className={styles.statGrid}>
                <StatCard label="전체 회원" value={fmtCount(agg.totalMembersAtEnd)} />
                {statuses.map((s) => <StatCard key={s.name} label={s.name} value={fmtCount(s.count)} sub={fmtPct(s.share)} />)}
              </div>
            </div>
            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>회원 상태별</span></div>
                <BreakdownTable rows={statuses} />
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>회원 유형별</span></div>
                <BreakdownTable rows={types} />
              </div>
            </div>
          </>
        )}

        {tab === 'activity' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>활동 지표</span><span className={styles.sectionNote}>ⓘ 조회 기간 내 활동 발생 기준입니다.</span></div>
              <div className={styles.statGrid}>
                <StatCard label="활성 회원" value={fmtCount(agg.activeMembers)} deltaValue={d('activeMembers')?.pct} hasPrevious={d('activeMembers')?.hasPrevious} />
                <StatCard label="활성률" value={fmtPct(agg.activeRate)} def="활성 회원 수 / 전체 회원 수 × 100" deltaValue={compare ? agg.activeRate - prevAgg.activeRate : undefined} deltaIsPoint hasPrevious={compare} />
                <StatCard label="비활성 회원" value={fmtCount(Math.max(0, agg.totalMembersAtEnd - agg.activeMembers))} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>일별 활동 추이</span></div>
              <BarChart buckets={dailyActiveSeries} metricLabel="일일 활동" />
            </div>
          </>
        )}

        {tab === 'retention' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>유지 / 이탈 지표</span><span className={styles.sectionNote}>ⓘ 탈퇴 완료일 기준으로 집계됩니다.</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/members/left')}>탈퇴 회원 보기</button></div>
              <div className={styles.statGrid}>
                <StatCard label="탈퇴 회원" value={fmtCount(agg.churned)} deltaValue={d('churned')?.pct} hasPrevious={d('churned')?.hasPrevious} positiveIsBad />
                <StatCard label="탈퇴율" value={fmtPct(agg.churnRate, 2)} def="탈퇴 회원 수 / 기간 시작 시점 유효 회원 수 × 100" deltaValue={compare ? agg.churnRate - prevAgg.churnRate : undefined} deltaIsPoint hasPrevious={compare} positiveIsBad />
                <StatCard label="순증 회원" value={fmtSignedCount(agg.netGrowth)} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>탈퇴 추이</span></div>
              <BarChart buckets={buckets.map((b) => ({ label: b.label, value: b.churned }))} metricLabel="탈퇴" />
            </div>
          </>
        )}

        {tab === 'report' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>회원 리포트 · {fmtDate(start)} ~ {fmtDate(end)}</span>
          <button type="button" className={styles.downloadBtn} data-grid-download onClick={toastDownload}>리포트 다운로드</button>
              </div>
              {compare && <div className={styles.sectionNote} style={{ marginBottom: 10 }}>비교 기간 {fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</div>}
              <div className={styles.statGrid}>
                <StatCard label="신규 가입" value={fmtCount(agg.newSignups)} deltaValue={d('newSignups')?.pct} hasPrevious={d('newSignups')?.hasPrevious} />
                <StatCard label="탈퇴" value={fmtCount(agg.churned)} deltaValue={d('churned')?.pct} hasPrevious={d('churned')?.hasPrevious} positiveIsBad />
                <StatCard label="순증" value={fmtSignedCount(agg.netGrowth)} deltaValue={d('netGrowth')?.pct} hasPrevious={d('netGrowth')?.hasPrevious} />
                <StatCard label="활성 회원" value={fmtCount(agg.activeMembers)} deltaValue={d('activeMembers')?.pct} hasPrevious={d('activeMembers')?.hasPrevious} />
                <StatCard label="활성률" value={fmtPct(agg.activeRate)} deltaValue={compare ? agg.activeRate - prevAgg.activeRate : undefined} deltaIsPoint hasPrevious={compare} />
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

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>가입 경로별</span></div>
              <BreakdownTable rows={channels} countLabel="가입수" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
