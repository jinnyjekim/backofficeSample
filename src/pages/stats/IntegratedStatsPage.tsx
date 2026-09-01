import { useMemo, useState } from 'react';
import { downloadStatisticsReport } from '../../lib/statisticsReport';
import shared from '../ops/opsShared.module.css';
import txStyles from './TransactionStatsPage.module.css';
import styles from './IntegratedStatsPage.module.css';
import { TransactionStatsPage } from './TransactionStatsPage';
import { MemberStatsPage } from './MemberStatsPage';
import { ContentStatsPage } from './ContentStatsPage';
import { TrafficStatsPage } from './TrafficStatsPage';
import { ActivityStatsPage } from './ActivityStatsPage';

import {
  TODAY,
  aggregate as txAggregate,
  bucketSeries as txBucketSeries,
  delta,
  fmtDate,
  fmtSignedPct,
  fmtWon as txFmtWon,
  previousPeriod,
  quickRangeDates,
  type QuickRange,
} from './transactionStatsData';
import { aggregate as memberAggregate, fmtCount as fmtMembers } from './memberStatsData';
import { aggregate as contentAggregate, fmtCount as fmtContent, fmtViews } from './contentStatsData';
import { aggregate as trafficAggregate, fmtCases, fmtPct as fmtTrafficPct, fmtUsers as fmtVisitors } from './trafficStatsData';
import { aggregate as activityAggregate, fmtEvents, fmtUsers as fmtActiveUsers } from './activityStatsData';

type Domain = 'overview' | 'tx' | 'member' | 'content' | 'traffic' | 'activity';
const DOMAIN_TABS: [Domain, string][] = [
  ['overview', '종합'],
  ['tx', '거래'],
  ['member', '회원'],
  ['content', '콘텐츠'],
  ['traffic', '유입 / 전환'],
  ['activity', '활동'],
];
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];

function MiniStat({ label, value, deltaValue, hasPrevious }: { label: string; value: string; deltaValue?: number; hasPrevious?: boolean }) {
  const deltaClass = deltaValue == null ? undefined : Math.abs(deltaValue) < 0.05 ? txStyles.deltaFlat : txStyles.deltaUp;
  return (
    <div className={txStyles.statCard}>
      <div className={txStyles.statLabel}>{label}</div>
      <div className={txStyles.statValue}>{value}</div>
      {deltaValue != null && (
        <div className={`${txStyles.statDelta} ${deltaClass}`}>{hasPrevious ? fmtSignedPct(deltaValue) : '비교 없음'} <span style={{ color: '#c4c4c8' }}>vs 이전 기간</span></div>
      )}
    </div>
  );
}

export function IntegratedStatsPage() {
  const [domain, setDomain] = useState<Domain>('overview');
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState(TODAY);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [compare, setCompare] = useState(true);

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s); setEnd(e); setDraftStart(s); setDraftEnd(e);
  };
  const applyCustom = () => { setStart(draftStart); setEnd(draftEnd); };

  const [prevStart, prevEnd] = useMemo(() => previousPeriod(start, end), [start, end]);

  const tx = useMemo(() => txAggregate(start, end), [start, end]);
  const txPrev = useMemo(() => txAggregate(prevStart, prevEnd), [prevStart, prevEnd]);
  const member = useMemo(() => memberAggregate(start, end), [start, end]);
  const memberPrev = useMemo(() => memberAggregate(prevStart, prevEnd), [prevStart, prevEnd]);
  const content = useMemo(() => contentAggregate(start, end), [start, end]);
  const contentPrev = useMemo(() => contentAggregate(prevStart, prevEnd), [prevStart, prevEnd]);
  const traffic = useMemo(() => trafficAggregate(start, end, '회원 가입'), [start, end]);
  const trafficPrev = useMemo(() => trafficAggregate(prevStart, prevEnd, '회원 가입'), [prevStart, prevEnd]);
  const activity = useMemo(() => activityAggregate(start, end), [start, end]);
  const activityPrev = useMemo(() => activityAggregate(prevStart, prevEnd), [prevStart, prevEnd]);

  const d = (cur: number, prev: number) => (compare ? delta(cur, prev) : undefined);

  const issues: string[] = [];
  const visitorDelta = compare ? delta(traffic.visitors, trafficPrev.visitors) : null;
  const rateDeltaPoint = compare ? traffic.conversionRate - trafficPrev.conversionRate : 0;
  if (visitorDelta && visitorDelta.pct > 5 && rateDeltaPoint < -0.3) {
    issues.push(`방문 사용자는 ${fmtSignedPct(visitorDelta.pct)} 늘었지만 전환율은 ${rateDeltaPoint.toFixed(2)}p 하락했습니다.`);
  }
  const churnDeltaPoint = compare ? member.churnRate - memberPrev.churnRate : 0;
  if (churnDeltaPoint > 0.03) issues.push(`회원 탈퇴율이 이전 기간 대비 ${churnDeltaPoint.toFixed(2)}p 상승했습니다. (${memberPrev.churnRate.toFixed(2)}% → ${member.churnRate.toFixed(2)}%)`);
  const refundDeltaPct = compare ? delta(tx.refundAmount, txPrev.refundAmount).pct : 0;
  if (refundDeltaPct > 15) issues.push(`거래 환불금액이 이전 기간 대비 ${fmtSignedPct(refundDeltaPct)} 증가했습니다.`);

  const highlights: string[] = [];
  if (compare) {
    highlights.push(`주문 건수는 이전 기간 대비 ${fmtSignedPct(delta(tx.orderCount, txPrev.orderCount).pct)} ${delta(tx.orderCount, txPrev.orderCount).pct >= 0 ? '증가' : '감소'}했습니다.`);
    highlights.push(`신규 가입은 ${fmtSignedPct(delta(member.newSignups, memberPrev.newSignups).pct)} ${delta(member.newSignups, memberPrev.newSignups).pct >= 0 ? '증가' : '감소'}했습니다.`);
    highlights.push(`콘텐츠 조회는 ${fmtSignedPct(delta(content.views, contentPrev.views).pct)} ${delta(content.views, contentPrev.views).pct >= 0 ? '증가' : '감소'}했습니다.`);
    highlights.push(`사용자당 활동은 ${fmtSignedPct(delta(activity.avgEventsPerUser, activityPrev.avgEventsPerUser).pct)} ${delta(activity.avgEventsPerUser, activityPrev.avgEventsPerUser).pct >= 0 ? '증가' : '감소'}했습니다.`);
  } else {
    highlights.push('비교 기간이 설정되지 않아 변화율을 계산할 수 없습니다. 상단에서 "이전 기간과 비교"를 켜주세요.');
  }

  const toastDownload = () => {
    const txTrend = txBucketSeries(start, end, '일별');
    const metric = (label: string, current: number, previous: number) => {
      const change = compare ? delta(current, previous) : undefined;
      return { label, current, previous: compare ? previous : undefined, change: change?.abs, changeRate: change ? `${change.pct.toFixed(1)}%` : undefined };
    };
    downloadStatisticsReport({
      reportName: '통합 통계', mode: '통합', period: `${start}~${end}`, comparisonPeriod: compare ? `${prevStart}~${prevEnd}` : undefined,
      filters: [['현재 영역', DOMAIN_TABS.find(([key]) => key === domain)?.[1] ?? domain], ['비교 사용', compare ? '사용' : '미사용']],
      summary: [metric('주문 건수', tx.orderCount, txPrev.orderCount), metric('순거래금액', tx.netAmount, txPrev.netAmount), metric('신규 가입', member.newSignups, memberPrev.newSignups), metric('콘텐츠 조회', content.views, contentPrev.views), metric('방문 사용자', traffic.visitors, trafficPrev.visitors), metric('활동 사용자', activity.activeUsers, activityPrev.activeUsers)],
      trend: { name: '02_거래추이', headers: ['일자', '주문금액', '결제금액', '환불금액', '순거래금액', '주문건수'], rows: txTrend.map((row) => [row.label, row.orderAmount, row.paymentAmount, row.refundAmount, row.netAmount, row.orderCount]) },
      dimensions: [
        { name: '영역별핵심지표', headers: ['영역', '지표', '현재값', '비교값'], rows: [['거래', '순거래금액', tx.netAmount, compare ? txPrev.netAmount : '-'], ['회원', '활성 회원', member.activeMembers, compare ? memberPrev.activeMembers : '-'], ['콘텐츠', '조회수', content.views, compare ? contentPrev.views : '-'], ['유입', '전환수', traffic.conversions, compare ? trafficPrev.conversions : '-'], ['활동', '전체 활동', activity.events, compare ? activityPrev.events : '-']] },
        { name: '주요변화', headers: ['구분', '내용'], rows: highlights.map((value, index) => [index + 1, value]) },
        { name: '확인필요', headers: ['구분', '내용'], rows: (issues.length ? issues : ['현재 확인이 필요한 이슈가 없습니다.']).map((value, index) => [index + 1, value]) },
      ],
      definitions: [{ term: '순거래금액', description: '결제 완료 금액에서 환불 금액을 제외한 금액' }, { term: '활성 회원', description: '조회 기간 중 로그인 또는 주요 서비스 활동이 1회 이상인 고유 회원' }, { term: '전환', description: '회원 가입 목표를 완료한 사용자 수' }, { term: '활동 사용자', description: '서비스 이벤트를 1회 이상 발생시킨 고유 사용자' }],
      dataAsOf: TODAY,
    });
  };

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>통합 통계</h1>
            <p className={shared.subtitle}>서비스의 거래, 회원, 콘텐츠, 유입 및 활동 현황을 분석합니다.</p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.dataAsOf}>데이터 기준 {fmtDate(TODAY)} 기준</span>
          <button type="button" className={styles.reportBtn} data-grid-download onClick={toastDownload}>리포트 다운로드</button>
          </div>
        </div>
      </div>

      <div className={styles.domainTabs}>
        {DOMAIN_TABS.map(([key, label]) => (
          <button key={key} type="button" className={`${styles.domainTabBtn} ${domain === key ? styles.domainTabActive : ''}`} onClick={() => setDomain(key)}>{label}</button>
        ))}
      </div>

      {domain === 'overview' && (
        <>
          <div className={txStyles.filterBar} style={{ margin: '0 24px 18px' }}>
            <div className={txStyles.filterRow}>
              <input type="date" className={txStyles.dateInput} value={draftStart} onChange={(e) => setDraftStart(e.target.value)} />
              <span className={txStyles.tilde}>~</span>
              <input type="date" className={txStyles.dateInput} value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} />
              <button type="button" className={txStyles.applyBtn} onClick={applyCustom}>조회</button>
              <label className={txStyles.compareCheck}>
                <input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> 이전 기간과 비교
              </label>
            </div>
            <div className={txStyles.filterRow}>
              {QUICK_RANGES.map((r) => {
                const [qs, qe] = quickRangeDates(r);
                const active = qs === start && qe === end;
                return <button key={r} type="button" className={`${txStyles.quickBtn} ${active ? txStyles.quickBtnActive : ''}`} onClick={() => applyQuick(r)}>{r}</button>;
              })}
            </div>
            <div className={txStyles.periodInfo}>
              조회 기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b> ({tx.days}일){compare && <> · 비교 기간 <b>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</b></>} · 각 탭에서는 탭별 기간을 별도로 조회할 수 있습니다.
            </div>
          </div>

          <div className={styles.domainSection}>
            <div className={styles.domainHead}><span className={styles.domainTitle}>거래</span><button type="button" className={styles.detailLink} onClick={() => setDomain('tx')}>자세히 보기 →</button></div>
            <div className={txStyles.statGrid}>
              <MiniStat label="주문" value={`${tx.orderCount.toLocaleString('ko-KR')}건`} deltaValue={d(tx.orderCount, txPrev.orderCount)?.pct} hasPrevious={d(tx.orderCount, txPrev.orderCount)?.hasPrevious} />
              <MiniStat label="결제금액" value={txFmtWon(tx.paymentAmount)} deltaValue={d(tx.paymentAmount, txPrev.paymentAmount)?.pct} hasPrevious={d(tx.paymentAmount, txPrev.paymentAmount)?.hasPrevious} />
              <MiniStat label="환불금액" value={txFmtWon(tx.refundAmount)} deltaValue={d(tx.refundAmount, txPrev.refundAmount)?.pct} hasPrevious={d(tx.refundAmount, txPrev.refundAmount)?.hasPrevious} />
              <MiniStat label="순거래금액" value={txFmtWon(tx.netAmount)} deltaValue={d(tx.netAmount, txPrev.netAmount)?.pct} hasPrevious={d(tx.netAmount, txPrev.netAmount)?.hasPrevious} />
            </div>
          </div>

          <div className={styles.domainSection}>
            <div className={styles.domainHead}><span className={styles.domainTitle}>회원</span><button type="button" className={styles.detailLink} onClick={() => setDomain('member')}>자세히 보기 →</button></div>
            <div className={txStyles.statGrid}>
              <MiniStat label="전체 회원" value={fmtMembers(member.totalMembersAtEnd)} />
              <MiniStat label="신규 가입" value={fmtMembers(member.newSignups)} deltaValue={d(member.newSignups, memberPrev.newSignups)?.pct} hasPrevious={d(member.newSignups, memberPrev.newSignups)?.hasPrevious} />
              <MiniStat label="활성 회원" value={fmtMembers(member.activeMembers)} deltaValue={d(member.activeMembers, memberPrev.activeMembers)?.pct} hasPrevious={d(member.activeMembers, memberPrev.activeMembers)?.hasPrevious} />
              <MiniStat label="탈퇴" value={fmtMembers(member.churned)} deltaValue={d(member.churned, memberPrev.churned)?.pct} hasPrevious={d(member.churned, memberPrev.churned)?.hasPrevious} />
            </div>
          </div>

          <div className={styles.domainSection}>
            <div className={styles.domainHead}><span className={styles.domainTitle}>콘텐츠</span><button type="button" className={styles.detailLink} onClick={() => setDomain('content')}>자세히 보기 →</button></div>
            <div className={txStyles.statGrid}>
              <MiniStat label="신규 등록" value={fmtContent(content.newContent)} deltaValue={d(content.newContent, contentPrev.newContent)?.pct} hasPrevious={d(content.newContent, contentPrev.newContent)?.hasPrevious} />
              <MiniStat label="게시" value={fmtContent(content.published)} deltaValue={d(content.published, contentPrev.published)?.pct} hasPrevious={d(content.published, contentPrev.published)?.hasPrevious} />
              <MiniStat label="조회수" value={fmtViews(content.views)} deltaValue={d(content.views, contentPrev.views)?.pct} hasPrevious={d(content.views, contentPrev.views)?.hasPrevious} />
              <MiniStat label="조회 사용자" value={fmtMembers(content.viewingUsers)} deltaValue={d(content.viewingUsers, contentPrev.viewingUsers)?.pct} hasPrevious={d(content.viewingUsers, contentPrev.viewingUsers)?.hasPrevious} />
            </div>
          </div>

          <div className={styles.domainSection}>
            <div className={styles.domainHead}><span className={styles.domainTitle}>유입 / 전환</span><span style={{ fontSize: 11, color: '#a1a1aa', marginRight: 'auto', marginLeft: 8 }}>전환 목표: 회원 가입</span><button type="button" className={styles.detailLink} onClick={() => setDomain('traffic')}>자세히 보기 →</button></div>
            <div className={txStyles.statGrid}>
              <MiniStat label="방문 사용자" value={fmtVisitors(traffic.visitors)} deltaValue={d(traffic.visitors, trafficPrev.visitors)?.pct} hasPrevious={d(traffic.visitors, trafficPrev.visitors)?.hasPrevious} />
              <MiniStat label="세션" value={`${traffic.sessions.toLocaleString('ko-KR')}회`} deltaValue={d(traffic.sessions, trafficPrev.sessions)?.pct} hasPrevious={d(traffic.sessions, trafficPrev.sessions)?.hasPrevious} />
              <MiniStat label="전환" value={fmtCases(traffic.conversions)} deltaValue={d(traffic.conversions, trafficPrev.conversions)?.pct} hasPrevious={d(traffic.conversions, trafficPrev.conversions)?.hasPrevious} />
              <MiniStat label="전환율" value={fmtTrafficPct(traffic.conversionRate)} />
            </div>
          </div>

          <div className={styles.domainSection}>
            <div className={styles.domainHead}><span className={styles.domainTitle}>활동</span><button type="button" className={styles.detailLink} onClick={() => setDomain('activity')}>자세히 보기 →</button></div>
            <div className={txStyles.statGrid}>
              <MiniStat label="활동 사용자" value={fmtActiveUsers(activity.activeUsers)} deltaValue={d(activity.activeUsers, activityPrev.activeUsers)?.pct} hasPrevious={d(activity.activeUsers, activityPrev.activeUsers)?.hasPrevious} />
              <MiniStat label="전체 활동" value={fmtEvents(activity.events)} deltaValue={d(activity.events, activityPrev.events)?.pct} hasPrevious={d(activity.events, activityPrev.events)?.hasPrevious} />
              <MiniStat label="사용자당 활동" value={`${activity.avgEventsPerUser.toFixed(1)}회`} />
            </div>
          </div>

          <div className={txStyles.twoCol} style={{ margin: '0 24px 16px' }}>
            <div className={txStyles.section} style={{ margin: 0 }}>
              <div className={txStyles.sectionHead}><span className={txStyles.sectionTitle}>주요 변화</span></div>
              <ul className={txStyles.bulletList}>{highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
            </div>
            <div className={txStyles.section} style={{ margin: 0 }}>
              <div className={txStyles.sectionHead}><span className={txStyles.sectionTitle}>확인 필요</span></div>
              {issues.length === 0 ? (
                <div className={`${txStyles.issueBanner} ${txStyles.issueOk}`}>현재 확인이 필요한 이슈가 없습니다.</div>
              ) : (
                issues.map((iss, i) => <div key={i} className={txStyles.issueBanner}>⚠ {iss}</div>)
              )}
            </div>
          </div>
        </>
      )}

      {domain === 'tx' && <div className={styles.embedWrap}><TransactionStatsPage /></div>}
      {domain === 'member' && <div className={styles.embedWrap}><MemberStatsPage /></div>}
      {domain === 'content' && <div className={styles.embedWrap}><ContentStatsPage /></div>}
      {domain === 'traffic' && <div className={styles.embedWrap}><TrafficStatsPage /></div>}
      {domain === 'activity' && <div className={styles.embedWrap}><ActivityStatsPage /></div>}
    </section>
  );
}
