import { useMemo, useState, type ReactNode } from 'react';
import { CommonButton } from '../../components/common';
import { downloadStatisticsReport } from '../../lib/statisticsReport';
import shared from '../ops/opsShared.module.css';
import styles from './IntegratedStatsPage.module.css';
import { TransactionStatsPage } from './TransactionStatsPage';
import { MemberStatsPage } from './MemberStatsPage';
import { ContentStatsPage } from './ContentStatsPage';
import { TrafficStatsPage } from './TrafficStatsPage';
import { ActivityStatsPage } from './ActivityStatsPage';
import { StatisticsFilterToolbar } from './StatisticsFilterToolbar';

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
import { aggregate as memberAggregate } from './memberStatsData';
import { aggregate as contentAggregate } from './contentStatsData';
import { aggregate as trafficAggregate, fmtPct as fmtTrafficPct } from './trafficStatsData';
import { aggregate as activityAggregate, fmtUsers as fmtActiveUsers } from './activityStatsData';
import { aggregate as sellerActivityAggregate } from './sellerActivityStatsData';
import { aggregate as productRegistrationAggregate } from './productRegistrationStatsData';
import { aggregate as deliveryClaimsAggregate } from './deliveryClaimsStatsData';
import { aggregate as disputeAggregate } from './disputeRateStatsData';
import { aggregate as promotionAggregate } from './promotionStatsData';
import { aggregate as sellerProceedsAggregate } from './sellerProceedsStatsData';

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

const SPARK_BARS = [42, 58, 73, 48, 66, 39, 61, 52, 79, 46, 68, 55];

function ChangeLabel({ value, positiveIsBad = false, suffix = '%' }: { value?: number; positiveIsBad?: boolean; suffix?: string }) {
  if (value == null || !Number.isFinite(value)) return null;
  const up = value > 0.05;
  const down = value < -0.05;
  const bad = positiveIsBad ? up : down;
  return (
    <span className={`${styles.metricChange} ${bad ? styles.metricChangeBad : up || down ? styles.metricChangeGood : styles.metricChangeFlat}`}>
      {up ? '▲' : down ? '▼' : '—'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

function SparkBars({ warning = false }: { warning?: boolean }) {
  return (
    <div className={styles.sparkBars} aria-hidden="true">
      {SPARK_BARS.map((height, index) => (
        <i key={index} className={index === SPARK_BARS.length - 1 ? (warning ? styles.sparkWarning : styles.sparkActive) : undefined} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

interface DashboardMetricProps {
  label: string;
  value: string;
  change?: number;
  changeSuffix?: string;
  positiveIsBad?: boolean;
  footnote: string;
  grade?: 'B' | 'C';
}

function DashboardMetric({ label, value, change, changeSuffix, positiveIsBad, footnote, grade = 'B' }: DashboardMetricProps) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricLabelRow}><span>{label}</span><em className={grade === 'B' ? styles.gradeB : styles.gradeC}>{grade}</em></div>
      <div className={styles.metricValueRow}><strong>{value}</strong><ChangeLabel value={change} suffix={changeSuffix} positiveIsBad={positiveIsBad} /></div>
      <SparkBars warning={Boolean(positiveIsBad && change != null && change > 0)} />
      <div className={styles.metricFoot}><span>{footnote}</span><b>자세히 →</b></div>
    </div>
  );
}

function OverviewKpi({ label, badge, value, change, positiveIsBad }: { label: string; badge?: string; value: string; change?: number; positiveIsBad?: boolean }) {
  return (
    <div className={styles.overviewKpi}>
      <div className={styles.overviewKpiLabel}>{label}{badge && <span>{badge}</span>}</div>
      <strong>{value}</strong>
      <div className={styles.overviewKpiDelta}><ChangeLabel value={change} positiveIsBad={positiveIsBad} /><span>vs 이전 기간</span></div>
    </div>
  );
}

function DashboardSection({ title, description, issueCount, onDetail, children }: { title: string; description: string; issueCount?: number; onDetail: () => void; children: ReactNode }) {
  return (
    <section className={styles.metricSection}>
      <div className={styles.metricSectionHead}>
        <div><strong>{title}</strong><span>{description}</span></div>
        <div>{issueCount ? <em>확인 필요 {issueCount}건</em> : null}<button type="button" onClick={onDetail}>자세히 보기 →</button></div>
      </div>
      <div className={styles.metricGrid}>{children}</div>
    </section>
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
  const resetFilters = () => {
    const defaultStart = '2026-08-01';
    setStart(defaultStart);
    setEnd(TODAY);
    setDraftStart(defaultStart);
    setDraftEnd(TODAY);
    setCompare(true);
  };
  const activeQuickRange = QUICK_RANGES.find((range) => {
    const [rangeStart, rangeEnd] = quickRangeDates(range);
    return rangeStart === start && rangeEnd === end;
  });

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
  const sellerActivity = useMemo(() => sellerActivityAggregate('c2c', start, end), [start, end]);
  const sellerActivityPrev = useMemo(() => sellerActivityAggregate('c2c', prevStart, prevEnd), [prevStart, prevEnd]);
  const products = useMemo(() => productRegistrationAggregate('all', start, end), [start, end]);
  const productsPrev = useMemo(() => productRegistrationAggregate('all', prevStart, prevEnd), [prevStart, prevEnd]);
  const delivery = useMemo(() => deliveryClaimsAggregate('all', start, end), [start, end]);
  const deliveryPrev = useMemo(() => deliveryClaimsAggregate('all', prevStart, prevEnd), [prevStart, prevEnd]);
  const disputes = useMemo(() => disputeAggregate(start, end), [start, end]);
  const disputesPrev = useMemo(() => disputeAggregate(prevStart, prevEnd), [prevStart, prevEnd]);
  const promotion = useMemo(() => promotionAggregate('all', start, end), [start, end]);
  const promotionPrev = useMemo(() => promotionAggregate('all', prevStart, prevEnd), [prevStart, prevEnd]);
  const proceeds = useMemo(() => sellerProceedsAggregate(start, end), [start, end]);
  const proceedsPrev = useMemo(() => sellerProceedsAggregate(prevStart, prevEnd), [prevStart, prevEnd]);

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
        {DOMAIN_TABS.map(([key, label]) => {
          const active = domain === key;
          return (
            <CommonButton
              key={key}
              type="button"
              variant={active ? 'primary-light' : 'secondary'}
              size="md"
              className={`${styles.domainTabBtn} ${active ? styles.domainTabActive : ''}`}
              onClick={() => setDomain(key)}
            >
              {label}
            </CommonButton>
          );
        })}
      </div>

      {domain === 'overview' && (
        <>
          <StatisticsFilterToolbar
            range={activeQuickRange ?? '직접 설정'}
            ranges={QUICK_RANGES}
            onRangeChange={(value) => applyQuick(value as QuickRange)}
            startDate={draftStart}
            endDate={draftEnd}
            onStartDateChange={setDraftStart}
            onEndDateChange={setDraftEnd}
            dateAriaLabel="통합 통계 조회"
            compareChecked={compare}
            onCompareCheckedChange={setCompare}
            onReset={resetFilters}
            onApply={applyCustom}
            summary={<>조회 기간 <b>{fmtDate(start)} ~ {fmtDate(end)}</b> ({tx.days}일){compare && <> · 비교 기간 <b>{fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</b></>} · 각 탭에서는 탭별 기간을 별도로 조회할 수 있습니다.</>}
          />

          <div className={styles.overviewDashboard}>
            <div className={styles.overviewKpiGrid}>
              <OverviewKpi label="순거래액" badge="전체" value={txFmtWon(tx.netAmount)} change={d(tx.netAmount, txPrev.netAmount)?.pct} />
              <OverviewKpi label="활성 사용자" badge="B+C" value={fmtActiveUsers(activity.activeUsers)} change={d(activity.activeUsers, activityPrev.activeUsers)?.pct} />
              <OverviewKpi label="거래 성사율" badge="C2C" value={`${sellerActivity.dealSuccessRate.toFixed(2)}%`} change={compare ? sellerActivity.dealSuccessRate - sellerActivityPrev.dealSuccessRate : undefined} />
              <OverviewKpi label="분쟁률" badge="C2C" value={`${disputes.disputeRate.toFixed(2)}%`} change={compare ? disputes.disputeRate - disputesPrev.disputeRate : undefined} positiveIsBad />
            </div>

            <DashboardSection title="매출 · 정산" description="매출 분석 · 판매대금 · 거래 성사/취소" issueCount={tx.cancelRate > txPrev.cancelRate ? 1 : undefined} onDetail={() => setDomain('tx')}>
              <DashboardMetric label="매출 분석" value={txFmtWon(tx.orderAmount)} change={d(tx.orderAmount, txPrev.orderAmount)?.pct} footnote="결제금액 · 이전 기간 대비" />
              <DashboardMetric label="판매대금 통계" value={txFmtWon(proceeds.settlementFinal)} change={d(proceeds.settlementFinal, proceedsPrev.settlementFinal)?.pct} footnote="정산 예정액 · 이전 기간 대비" grade="C" />
              <DashboardMetric label="거래 성사율" value={`${sellerActivity.dealSuccessRate.toFixed(2)}%`} change={compare ? sellerActivity.dealSuccessRate - sellerActivityPrev.dealSuccessRate : undefined} changeSuffix="%p" footnote="성사율 · 이전 기간 대비" grade="C" />
              <DashboardMetric label="거래 취소율" value={`${tx.cancelRate.toFixed(2)}%`} change={compare ? tx.cancelRate - txPrev.cancelRate : undefined} changeSuffix="%p" positiveIsBad footnote="취소율 · 이전 기간 대비" grade="C" />
              <DashboardMetric label="거래 전환 분석" value={fmtTrafficPct(traffic.conversionRate)} change={compare ? traffic.conversionRate - trafficPrev.conversionRate : undefined} changeSuffix="%p" footnote="전환율 · 이전 기간 대비" />
            </DashboardSection>

            <DashboardSection title="상품 · 재고" description="재고 분석 · 등록 상품 · 상품 등록 추이" issueCount={products.netGrowth < 0 ? 1 : undefined} onDetail={() => setDomain('content')}>
              <DashboardMetric label="재고 분석" value={`${products.activeNow.toLocaleString('ko-KR')}개`} change={d(products.activeNow, productsPrev.activeNow)?.pct} positiveIsBad={false} footnote="판매중 재고 · 이전 기간 대비" />
              <DashboardMetric label="등록 상품 수" value={`${products.newRegistrations.toLocaleString('ko-KR')}개`} change={d(products.newRegistrations, productsPrev.newRegistrations)?.pct} footnote="전체 등록 · 이전 기간 대비" grade="C" />
              <DashboardMetric label="상품 등록 분석" value={`${products.saleStarted.toLocaleString('ko-KR')}개`} change={d(products.saleStarted, productsPrev.saleStarted)?.pct} footnote="판매 시작 · 이전 기간 대비" />
            </DashboardSection>

            <DashboardSection title="사용자 활동" description="판매자 · 구매자 활동과 구매 패턴" onDetail={() => setDomain('activity')}>
              <DashboardMetric label="판매자 활동" value={fmtActiveUsers(sellerActivity.activeSellers)} change={d(sellerActivity.activeSellers, sellerActivityPrev.activeSellers)?.pct} footnote="활성 판매자 · 이전 기간 대비" grade="C" />
              <DashboardMetric label="구매자 활동" value={fmtActiveUsers(activity.activeUsers)} change={d(activity.activeUsers, activityPrev.activeUsers)?.pct} footnote="활성 구매자 · 이전 기간 대비" grade="C" />
              <DashboardMetric label="고객 구매 분석" value={`${(tx.orderCount / Math.max(1, activity.activeUsers) * 100).toFixed(2)}%`} change={d(tx.orderCount / Math.max(1, activity.activeUsers), txPrev.orderCount / Math.max(1, activityPrev.activeUsers))?.pct} footnote="재구매 지표 · 이전 기간 대비" />
            </DashboardSection>

            <DashboardSection title="운영 리스크" description="배송/클레임 · 신고 · 분쟁" issueCount={3} onDetail={() => setDomain('tx')}>
              <DashboardMetric label="배송/클레임 분석" value={`${delivery.claimRate.toFixed(2)}%`} change={compare ? delivery.claimRate - deliveryPrev.claimRate : undefined} changeSuffix="%p" positiveIsBad footnote="클레임률 · 이전 기간 대비" />
              <DashboardMetric label="신고율" value={`${(disputes.disputeRate * 0.62).toFixed(2)}%`} change={compare ? (disputes.disputeRate - disputesPrev.disputeRate) * 0.62 : undefined} changeSuffix="%p" positiveIsBad footnote="신고율 · 이전 기간 대비" grade="C" />
              <DashboardMetric label="분쟁률" value={`${disputes.disputeRate.toFixed(2)}%`} change={compare ? disputes.disputeRate - disputesPrev.disputeRate : undefined} changeSuffix="%p" positiveIsBad footnote="분쟁률 · 이전 기간 대비" grade="C" />
            </DashboardSection>

            <DashboardSection title="마케팅" description="프로모션 성과" onDetail={() => setDomain('tx')}>
              <DashboardMetric label="프로모션 분석" value={txFmtWon(promotion.netRevenue)} change={d(promotion.netRevenue, promotionPrev.netRevenue)?.pct} footnote="쿠폰 사용액 · 이전 기간 대비" />
            </DashboardSection>

            <div className={styles.overviewBottomGrid}>
              <section className={styles.changePanel}>
                <div className={styles.bottomPanelHead}>주요 변화</div>
                <ul>{highlights.map((item, index) => <li key={index}>{item}</li>)}</ul>
              </section>
              <section className={styles.issuePanel}>
                <div className={styles.bottomPanelHead}>확인 필요 <span>3건</span></div>
                {[
                  { title: `거래 취소율 ▲ ${Math.abs(tx.cancelRate - txPrev.cancelRate).toFixed(1)}%p`, text: '지표 취소율 값이 악화 방향으로 움직였습니다. 상세 통계에서 기간·채널별로 분해해 확인하세요.' },
                  { title: `배송 클레임률 ${delivery.claimRate.toFixed(2)}%`, text: '배송 및 클레임 지표의 변동 폭을 확인하고 지역·배송사별 원인을 점검하세요.' },
                  { title: `분쟁률 ▲ ${Math.abs(disputes.disputeRate - disputesPrev.disputeRate).toFixed(1)}%p`, text: '분쟁 지표가 이전 기간보다 상승했습니다. 사유별 상세 내역을 확인하세요.' },
                ].map((item) => <div className={styles.issueItem} key={item.title}><i>!</i><div><strong>{item.title}</strong><span>{item.text}</span></div><button type="button" onClick={() => setDomain('tx')}>상세 보기 →</button></div>)}
              </section>
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
