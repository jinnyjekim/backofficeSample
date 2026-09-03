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
  categoryBreakdown,
  delta,
  featureBreakdown,
  fmtDate,
  fmtEvents,
  fmtPct,
  fmtSignedPct,
  fmtUsers,
  josaIGa,
  memberTypeActivityBreakdown,
  previousPeriod,
  quickRangeDates,
  type ActivityPeriodAggregate,
  type Granularity,
  type QuickRange,
} from './activityStatsData';

type Tab = 'overview' | 'users' | 'features' | 'category' | 'report';
const TABS: [Tab, string][] = [
  ['overview', '종합'],
  ['users', '사용자 활동'],
  ['features', '기능 사용'],
  ['category', '활동 유형'],
  ['report', '활동 리포트'],
];
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type Metric = 'activeUsers' | 'events';
const METRIC_LABEL: Record<Metric, string> = { activeUsers: '활동 사용자', events: '전체 활동' };

function StatCard({ label, value, def, deltaValue, hasPrevious, sub }: {
  label: string; value: string; def?: string; deltaValue?: number; hasPrevious?: boolean; sub?: string;
}) {
  const deltaClass = deltaValue == null ? undefined : Math.abs(deltaValue) < 0.05 ? styles.deltaFlat : styles.deltaUp;
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

function BarChart({ buckets, metricLabel }: { buckets: { label: string; value: number }[]; metricLabel: string }) {
  const max = Math.max(...buckets.map((b) => b.value), 1);
  if (buckets.every((b) => b.value === 0)) return <div className={styles.emptyNote}>선택한 기간에 활동 데이터가 없습니다.</div>;
  return (
    <>
      <div className={styles.chartArea}>
        {buckets.map((b) => (
          <div key={b.label} className={styles.chartBarWrap} title={`${b.label} · ${metricLabel} ${b.value.toLocaleString('ko-KR')}`}>
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

export function ActivityStatsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState(TODAY);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [compare, setCompare] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>('일별');
  const [metric, setMetric] = useState<Metric>('events');

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s); setEnd(e); setDraftStart(s); setDraftEnd(e);
  };
  const applyCustom = () => { setStart(draftStart); setEnd(draftEnd); };

  const agg: ActivityPeriodAggregate = useMemo(() => aggregate(start, end), [start, end]);
  const [prevStart, prevEnd] = useMemo(() => previousPeriod(start, end), [start, end]);
  const prevAgg: ActivityPeriodAggregate = useMemo(() => aggregate(prevStart, prevEnd), [prevStart, prevEnd]);

  const d = (key: keyof ActivityPeriodAggregate) => (compare ? delta(agg[key] as number, prevAgg[key] as number) : undefined);

  const buckets = useMemo(() => bucketSeries(start, end, granularity), [start, end, granularity]);
  const chartData = buckets.map((b) => ({ label: b.label, value: b[metric] }));

  const features = useMemo(() => featureBreakdown(agg), [agg]);
  const categories = useMemo(() => categoryBreakdown(agg), [agg]);
  const memberTypes = useMemo(() => memberTypeActivityBreakdown(agg), [agg]);
  const topFeature = features[0];

  const issues: string[] = [];
  const prevFeatures = useMemo(() => featureBreakdown(prevAgg), [prevAgg]);
  features.forEach((f) => {
    const prev = prevFeatures.find((p) => p.name === f.name);
    if (!prev || prev.users === 0) return;
    const chg = delta(f.users, prev.users);
    if (chg.pct <= -25) issues.push(`'${f.name}' 사용자 수가 이전 기간 대비 ${fmtPct(Math.abs(chg.pct))} 감소했습니다. (${fmtUsers(prev.users)} → ${fmtUsers(f.users)})`);
  });

  const highlights: string[] = [];
  if (compare) {
    const uD = delta(agg.activeUsers, prevAgg.activeUsers);
    highlights.push(`활동 사용자는 이전 기간 대비 ${fmtSignedPct(uD.pct)} ${uD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const eD = delta(agg.events, prevAgg.events);
    highlights.push(`전체 활동은 ${fmtSignedPct(eD.pct)} ${eD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const avgD = delta(agg.avgEventsPerUser, prevAgg.avgEventsPerUser);
    highlights.push(`사용자당 활동 횟수는 ${fmtSignedPct(avgD.pct)} ${avgD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    if (topFeature) highlights.push(`${topFeature.name}${josaIGa(topFeature.name)} 가장 많이 사용된 기능입니다.`);
  } else {
    highlights.push('비교 기간이 설정되지 않아 변화율을 계산할 수 없습니다. 상단에서 "이전 기간과 비교"를 켜주세요.');
  }

  const toastDownload = () => {
    const metricRow = (label: string, key: keyof ActivityPeriodAggregate) => {
      const change = d(key);
      return { label, current: agg[key] as number, previous: compare ? prevAgg[key] as number : undefined, change: change?.abs, changeRate: change ? `${change.pct.toFixed(1)}%` : undefined };
    };
    downloadStatisticsReport({
      reportName: '활동 통계', mode: '통합', period: `${start}~${end}`, comparisonPeriod: compare ? `${prevStart}~${prevEnd}` : undefined,
      filters: [['집계 단위', granularity], ['현재 탭', TABS.find(([key]) => key === tab)?.[1] ?? tab]],
      summary: [metricRow('활동 사용자', 'activeUsers'), metricRow('전체 활동', 'events'), metricRow('사용자당 활동', 'avgEventsPerUser')],
      trend: { name: '02_활동추이', headers: ['기간', '활동 사용자', '전체 활동'], rows: buckets.map((row) => [row.label, row.activeUsers, row.events]) },
      dimensions: [
        { name: '기능별', headers: ['기능', '카테고리', '이벤트', '사용자', '사용자당 활동', '비중(%)'], rows: features.map((row) => [row.name, row.category, row.events, row.users, Number(row.avgPerUser.toFixed(2)), Number(row.share.toFixed(2))]) },
        { name: '활동유형별', headers: ['활동 유형', '사용자', '이벤트', '사용자당 활동', '비중(%)'], rows: categories.map((row) => [row.name, row.users, row.events, Number(row.avgPerUser.toFixed(2)), Number(row.share.toFixed(2))]) },
        { name: '회원유형별', headers: ['회원 유형', '사용자', '이벤트', '사용자당 활동'], rows: memberTypes.map((row) => [row.name, row.users, row.events, Number(row.avgPerUser.toFixed(2))]) },
      ],
      definitions: [{ term: '활동 사용자', description: '조회 기간 중 서비스 이벤트를 1회 이상 발생시킨 고유 사용자' }, { term: '전체 활동', description: '조회 기간 내 주요 서비스 이벤트의 총합' }, { term: '사용자당 활동', description: '전체 활동 수를 활동 사용자 수로 나눈 값' }],
    });
  };

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>활동 통계</h1>
            <p className={shared.subtitle}>서비스 내 사용자 활동과 기능 이용 현황을 조회합니다.</p>
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
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>핵심 지표</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/members')}>회원 목록에서 보기</button></div>
              <div className={styles.statGrid}>
                <StatCard label="활동 사용자" value={fmtUsers(agg.activeUsers)} def="조회 기간 내 1회 이상 활동한 Unique 사용자" deltaValue={d('activeUsers')?.pct} hasPrevious={d('activeUsers')?.hasPrevious} />
                <StatCard label="전체 활동" value={fmtEvents(agg.events)} def="전체 활동 Event 발생 건수" deltaValue={d('events')?.pct} hasPrevious={d('events')?.hasPrevious} />
                <StatCard label="사용자당 활동" value={`${agg.avgEventsPerUser.toFixed(1)}회`} def="전체 활동 / 활동 사용자" deltaValue={d('avgEventsPerUser')?.pct} hasPrevious={d('avgEventsPerUser')?.hasPrevious} />
                <StatCard label="주요 활동" value={topFeature?.name ?? '-'} sub={topFeature ? fmtEvents(topFeature.events) : undefined} />
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>활동 추이</span></div>
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

        {tab === 'users' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>사용자 활동 지표</span></div>
              <div className={styles.statGrid}>
                <StatCard label="활동 사용자" value={fmtUsers(agg.activeUsers)} deltaValue={d('activeUsers')?.pct} hasPrevious={d('activeUsers')?.hasPrevious} />
                <StatCard label="사용자당 평균 활동" value={`${agg.avgEventsPerUser.toFixed(1)}회`} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>회원 유형별 활동</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 100px 110px 100px' }}><span>회원 유형</span><span>사용자</span><span>활동수</span><span>사용자당</span></div>
                {memberTypes.map((r) => (
                  <div key={r.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 110px 100px' }}>
                    <span>{r.name}</span><span>{fmtUsers(r.users)}</span><span>{fmtEvents(r.events)}</span><span>{r.avgPerUser.toFixed(1)}회</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'features' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.sectionTitle}>기능별 사용량 (사용자 많은 순)</span></div>
            <div className={styles.table}>
              <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 90px 100px 110px 90px' }}><span>기능</span><span>분류</span><span>사용자</span><span>사용 횟수</span><span>사용자당</span></div>
              {[...features].sort((a, b) => b.users - a.users).map((f) => (
                <div key={f.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 90px 100px 110px 90px' }}>
                  <span>{f.name}</span><span>{f.category}</span><span>{fmtUsers(f.users)}</span><span>{fmtEvents(f.events)}</span><span>{f.avgPerUser.toFixed(1)}회</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'category' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.sectionTitle}>활동 유형별</span></div>
            <div className={styles.table}>
              <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 100px 110px 90px 1fr' }}><span>활동 유형</span><span>사용자</span><span>활동수</span><span>비중</span><span /></div>
              {categories.map((c) => {
                const max = Math.max(...categories.map((x) => x.events), 1);
                return (
                  <div key={c.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 100px 110px 90px 1fr' }}>
                    <span>{c.name}</span><span>{fmtUsers(c.users)}</span><span>{fmtEvents(c.events)}</span><span>{fmtPct(c.share)}</span>
                    <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${(c.events / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
            <div className={styles.sectionNote} style={{ marginTop: 10 }}>탐색(검색/목록조회/상세조회), 거래(장바구니/주문/결제), 고객지원(문의등록/FAQ조회/파일첨부), 계정(로그인/로그아웃/정보수정), 기타(다운로드/공유/설정변경)로 분류합니다.</div>
          </div>
        )}

        {tab === 'report' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>활동 리포트 · {fmtDate(start)} ~ {fmtDate(end)}</span>
          <button type="button" className={styles.downloadBtn} data-grid-download onClick={toastDownload}>리포트 다운로드</button>
              </div>
              {compare && <div className={styles.sectionNote} style={{ marginBottom: 10 }}>비교 기간 {fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</div>}
              <div className={styles.statGrid}>
                <StatCard label="활동 사용자" value={fmtUsers(agg.activeUsers)} deltaValue={d('activeUsers')?.pct} hasPrevious={d('activeUsers')?.hasPrevious} />
                <StatCard label="전체 활동" value={fmtEvents(agg.events)} deltaValue={d('events')?.pct} hasPrevious={d('events')?.hasPrevious} />
                <StatCard label="사용자당 활동" value={`${agg.avgEventsPerUser.toFixed(1)}회`} deltaValue={d('avgEventsPerUser')?.pct} hasPrevious={d('avgEventsPerUser')?.hasPrevious} />
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
                  <div className={`${styles.issueBanner} ${styles.issueOk}`}>현재 확인이 필요한 활동 변화가 없습니다.</div>
                ) : (
                  issues.map((iss, i) => <div key={i} className={styles.issueBanner}>⚠ {iss}</div>)
                )}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>주요 기능</span></div>
              <div className={styles.table}>
                <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 110px 100px' }}><span>기능</span><span>사용 횟수</span><span>사용자</span></div>
                {features.slice(0, 5).map((f) => (
                  <div key={f.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 110px 100px' }}><span>{f.name}</span><span>{fmtEvents(f.events)}</span><span>{fmtUsers(f.users)}</span></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
