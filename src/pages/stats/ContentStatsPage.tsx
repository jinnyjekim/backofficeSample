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
  authorTypeBreakdown,
  bucketSeries,
  categoryContentBreakdown,
  categoryViewBreakdown,
  delta,
  fmtCount,
  fmtDate,
  fmtPct,
  fmtSignedPct,
  fmtUsers,
  fmtViews,
  previousPeriod,
  quickRangeDates,
  statusBreakdown,
  topContent,
  type ContentPeriodAggregate,
  type Granularity,
  type QuickRange,
  type WeightedRow,
} from './contentStatsData';

type Tab = 'overview' | 'publish' | 'views' | 'analysis' | 'category' | 'report';
const TABS: [Tab, string][] = [
  ['overview', '종합'],
  ['publish', '등록 / 게시'],
  ['views', '조회'],
  ['analysis', '콘텐츠 분석'],
  ['category', '카테고리'],
  ['report', '콘텐츠 리포트'],
];
const QUICK_RANGES: QuickRange[] = ['오늘', '어제', '최근 7일', '최근 30일', '이번 달', '지난 달'];
type Metric = 'newContent' | 'published' | 'views';
const METRIC_LABEL: Record<Metric, string> = { newContent: '신규 등록', published: '게시', views: '조회수' };

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

function BreakdownTable({ rows, countLabel = '콘텐츠수', formatCount = fmtCount }: { rows: WeightedRow[]; countLabel?: string; formatCount?: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className={styles.table}>
      <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 110px 80px 1fr' }}><span>이름</span><span>{countLabel}</span><span>비중</span><span /></div>
      {rows.map((r) => (
        <div key={r.name} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 110px 80px 1fr' }}>
          <span>{r.name}</span>
          <span>{formatCount(r.count)}</span>
          <span>{fmtPct(r.share)}</span>
          <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${(r.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function BarChart({ buckets, metricLabel }: { buckets: { label: string; value: number }[]; metricLabel: string }) {
  const max = Math.max(...buckets.map((b) => b.value), 1);
  if (buckets.every((b) => b.value === 0)) return <div className={styles.emptyNote}>선택한 기간에 콘텐츠 데이터가 없습니다.</div>;
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

export function ContentStatsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [start, setStart] = useState('2026-08-01');
  const [end, setEnd] = useState(TODAY);
  const [draftStart, setDraftStart] = useState(start);
  const [draftEnd, setDraftEnd] = useState(end);
  const [compare, setCompare] = useState(true);
  const [granularity, setGranularity] = useState<Granularity>('일별');
  const [metric, setMetric] = useState<Metric>('newContent');

  const applyQuick = (range: QuickRange) => {
    const [s, e] = quickRangeDates(range);
    setStart(s); setEnd(e); setDraftStart(s); setDraftEnd(e);
  };
  const applyCustom = () => { setStart(draftStart); setEnd(draftEnd); };

  const agg: ContentPeriodAggregate = useMemo(() => aggregate(start, end), [start, end]);
  const [prevStart, prevEnd] = useMemo(() => previousPeriod(start, end), [start, end]);
  const prevAgg: ContentPeriodAggregate = useMemo(() => aggregate(prevStart, prevEnd), [prevStart, prevEnd]);

  const d = (key: keyof ContentPeriodAggregate) => (compare ? delta(agg[key] as number, prevAgg[key] as number) : undefined);

  const buckets = useMemo(() => bucketSeries(start, end, granularity), [start, end, granularity]);
  const chartData = buckets.map((b) => ({ label: b.label, value: b[metric] }));

  const statuses = useMemo(() => statusBreakdown(agg), [agg]);
  const authorTypes = useMemo(() => authorTypeBreakdown(agg), [agg]);
  const categoriesContent = useMemo(() => categoryContentBreakdown(agg), [agg]);
  const categoriesViews = useMemo(() => categoryViewBreakdown(agg), [agg]);
  const top = useMemo(() => topContent(agg), [agg]);

  const issues: string[] = [];
  const viewDelta = compare ? delta(agg.views, prevAgg.views) : null;
  const publishDelta = compare ? delta(agg.published, prevAgg.published) : null;
  if (viewDelta && publishDelta && publishDelta.pct > 5 && viewDelta.pct < publishDelta.pct - 10) {
    issues.push(`게시 콘텐츠는 ${fmtSignedPct(publishDelta.pct)} 늘었지만 조회수는 ${fmtSignedPct(viewDelta.pct)}에 그쳤습니다.`);
  }
  const signupContentDelta = compare ? delta(agg.newContent, prevAgg.newContent) : null;
  if (signupContentDelta && signupContentDelta.pct < -15) issues.push(`신규 등록이 이전 기간 대비 ${fmtPct(Math.abs(signupContentDelta.pct))} 감소했습니다.`);

  const highlights: string[] = [];
  if (compare) {
    const nD = delta(agg.newContent, prevAgg.newContent);
    highlights.push(`신규 콘텐츠 등록은 이전 기간 대비 ${fmtSignedPct(nD.pct)} ${nD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const pD = delta(agg.published, prevAgg.published);
    highlights.push(`게시 콘텐츠는 ${fmtSignedPct(pD.pct)} ${pD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    const vD = delta(agg.views, prevAgg.views);
    highlights.push(`전체 조회수는 ${fmtSignedPct(vD.pct)} ${vD.pct >= 0 ? '증가' : '감소'}했습니다.`);
    if (top.length) highlights.push(`${top[0].title}의 조회수가 가장 높았습니다.`);
  } else {
    highlights.push('비교 기간이 설정되지 않아 변화율을 계산할 수 없습니다. 상단에서 "이전 기간과 비교"를 켜주세요.');
  }

  const toastDownload = () => {
    const metricRow = (label: string, key: keyof ContentPeriodAggregate) => {
      const change = d(key);
      return { label, current: agg[key] as number, previous: compare ? prevAgg[key] as number : undefined, change: change?.abs, changeRate: change ? `${change.pct.toFixed(1)}%` : undefined };
    };
    const weightedSheet = (name: string, rows: WeightedRow[]) => ({ name, headers: ['구분', '건수', '비중(%)'], rows: rows.map((row) => [row.name, row.count, Number(row.share.toFixed(2))]) });
    downloadStatisticsReport({
      reportName: '콘텐츠 통계', mode: '통합', period: `${start}~${end}`, comparisonPeriod: compare ? `${prevStart}~${prevEnd}` : undefined,
      filters: [['집계 단위', granularity], ['현재 탭', TABS.find(([key]) => key === tab)?.[1] ?? tab]],
      summary: [metricRow('전체 콘텐츠', 'totalContentAtEnd'), metricRow('신규 등록', 'newContent'), metricRow('게시', 'published'), metricRow('조회수', 'views'), metricRow('조회 사용자', 'viewingUsers')],
      trend: { name: '02_콘텐츠추이', headers: ['기간', '신규 등록', '게시', '조회수'], rows: buckets.map((row) => [row.label, row.newContent, row.published, row.views]) },
      dimensions: [weightedSheet('상태별', statuses), weightedSheet('작성자유형별', authorTypes), weightedSheet('카테고리콘텐츠', categoriesContent), weightedSheet('카테고리조회', categoriesViews), { name: '인기콘텐츠', headers: ['콘텐츠 ID', '제목', '조회수', '비중(%)'], rows: top.map((row) => [row.id, row.title, row.views, Number(row.share.toFixed(2))]) }],
      definitions: [{ term: '게시 콘텐츠', description: '조회 기간 중 공개 상태로 게시된 콘텐츠' }, { term: '조회 사용자', description: '조회 기간 중 콘텐츠를 1회 이상 조회한 고유 사용자' }, { term: '조회수', description: '콘텐츠 상세 조회 이벤트의 총합' }],
    });
  };

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>콘텐츠 통계</h1>
            <p className={shared.subtitle}>콘텐츠 등록, 게시, 노출 및 이용 현황을 조회합니다.</p>
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
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>핵심 지표</span><span className={styles.sectionNote}>전체 콘텐츠는 {fmtDate(end)} 기준 Snapshot, 나머지는 조회 기간 집계입니다.</span></div>
              <div className={styles.statGrid}>
                <StatCard label="전체 콘텐츠" value={fmtCount(agg.totalContentAtEnd)} def={`${fmtDate(end)} 기준 전체 콘텐츠 수 (Snapshot)`} />
                <StatCard label="신규 등록" value={fmtCount(agg.newContent)} deltaValue={d('newContent')?.pct} hasPrevious={d('newContent')?.hasPrevious} />
                <StatCard label="게시" value={fmtCount(agg.published)} deltaValue={d('published')?.pct} hasPrevious={d('published')?.hasPrevious} />
                <StatCard label="조회수" value={fmtViews(agg.views)} deltaValue={d('views')?.pct} hasPrevious={d('views')?.hasPrevious} />
                <StatCard label="조회 사용자" value={fmtUsers(agg.viewingUsers)} deltaValue={d('viewingUsers')?.pct} hasPrevious={d('viewingUsers')?.hasPrevious} />
                <StatCard label="콘텐츠당 평균 조회" value={`${agg.avgViewsPerContent.toFixed(1)}회`} />
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>콘텐츠 추이</span></div>
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

        {tab === 'publish' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>등록 / 게시 지표</span><span className={styles.sectionNote}>ⓘ 등록은 최초 등록일, 게시는 최초 공개일 기준입니다.</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/content')}>콘텐츠 목록에서 보기</button></div>
              <div className={styles.statGrid}>
                <StatCard label="신규 등록" value={fmtCount(agg.newContent)} deltaValue={d('newContent')?.pct} hasPrevious={d('newContent')?.hasPrevious} />
                <StatCard label="게시" value={fmtCount(agg.published)} deltaValue={d('published')?.pct} hasPrevious={d('published')?.hasPrevious} />
                <StatCard label="비공개 전환" value={fmtCount(agg.unpublished)} deltaValue={d('unpublished')?.pct} hasPrevious={d('unpublished')?.hasPrevious} positiveIsBad />
              </div>
            </div>
            <div className={styles.twoCol}>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>콘텐츠 상태별 (현재 상태 Snapshot)</span></div>
                <BreakdownTable rows={statuses} />
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>등록자 유형별</span></div>
                <BreakdownTable rows={authorTypes} />
              </div>
            </div>
          </>
        )}

        {tab === 'views' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>조회 지표</span><span className={styles.sectionNote}>ⓘ 조회 발생일 기준으로 집계됩니다.</span></div>
              <div className={styles.statGrid}>
                <StatCard label="조회수" value={fmtViews(agg.views)} def="상세 페이지 진입 Event 전체 (동일 사용자 반복 조회 포함)" deltaValue={d('views')?.pct} hasPrevious={d('views')?.hasPrevious} />
                <StatCard label="조회 사용자" value={fmtUsers(agg.viewingUsers)} def="조회 기간 내 Unique 사용자" deltaValue={d('viewingUsers')?.pct} hasPrevious={d('viewingUsers')?.hasPrevious} />
                <StatCard label="사용자당 평균 조회" value={`${agg.avgViewsPerUser.toFixed(1)}회`} />
              </div>
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>조회 추이</span></div>
              <BarChart buckets={buckets.map((b) => ({ label: b.label, value: b.views }))} metricLabel="조회수" />
            </div>
          </>
        )}

        {tab === 'analysis' && (
          <div className={styles.section}>
            <div className={styles.sectionHead}><span className={styles.sectionTitle}>조회 TOP 콘텐츠</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/content')}>콘텐츠 목록에서 보기</button></div>
            <div className={styles.table}>
              <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 90px 110px 80px 1fr' }}><span>콘텐츠</span><span>ID</span><span>조회수</span><span>비중</span><span /></div>
              {top.map((r) => {
                const max = Math.max(...top.map((t) => t.views), 1);
                return (
                  <div key={r.id} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 90px 110px 80px 1fr' }}>
                    <span>{r.title}</span><span>{r.id}</span><span>{fmtViews(r.views)}</span><span>{fmtPct(r.share)}</span>
                    <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${(r.views / max) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
            <div className={styles.sectionNote} style={{ marginTop: 10 }}>현재 공개중인 콘텐츠를 조회수 기준으로 정렬한 목록입니다.</div>
          </div>
        )}

        {tab === 'category' && (
          <div className={styles.twoCol}>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>카테고리별 콘텐츠</span><button type="button" className={styles.downloadBtn} onClick={() => navigate('/content/categories')}>카테고리 관리에서 보기</button></div>
              <BreakdownTable rows={categoriesContent} />
            </div>
            <div className={styles.section}>
              <div className={styles.sectionHead}><span className={styles.sectionTitle}>카테고리별 조회수</span></div>
              <BreakdownTable rows={categoriesViews} countLabel="조회수" formatCount={fmtViews} />
            </div>
          </div>
        )}

        {tab === 'report' && (
          <>
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>콘텐츠 리포트 · {fmtDate(start)} ~ {fmtDate(end)}</span>
          <button type="button" className={styles.downloadBtn} data-grid-download onClick={toastDownload}>리포트 다운로드</button>
              </div>
              {compare && <div className={styles.sectionNote} style={{ marginBottom: 10 }}>비교 기간 {fmtDate(prevStart)} ~ {fmtDate(prevEnd)}</div>}
              <div className={styles.statGrid}>
                <StatCard label="신규 등록" value={fmtCount(agg.newContent)} deltaValue={d('newContent')?.pct} hasPrevious={d('newContent')?.hasPrevious} />
                <StatCard label="게시" value={fmtCount(agg.published)} deltaValue={d('published')?.pct} hasPrevious={d('published')?.hasPrevious} />
                <StatCard label="조회수" value={fmtViews(agg.views)} deltaValue={d('views')?.pct} hasPrevious={d('views')?.hasPrevious} />
                <StatCard label="조회 사용자" value={fmtUsers(agg.viewingUsers)} deltaValue={d('viewingUsers')?.pct} hasPrevious={d('viewingUsers')?.hasPrevious} />
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
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>TOP 콘텐츠</span></div>
                <div className={styles.table}>
                  <div className={styles.tableHead} style={{ gridTemplateColumns: '1fr 110px 80px 1fr' }}><span>콘텐츠</span><span>조회수</span><span>비중</span><span /></div>
                  {top.slice(0, 5).map((r) => {
                    const max = Math.max(...top.map((t) => t.views), 1);
                    return (
                      <div key={r.id} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 110px 80px 1fr' }}>
                        <span>{r.title}</span><span>{fmtViews(r.views)}</span><span>{fmtPct(r.share)}</span>
                        <div className={styles.miniBarTrack}><div className={styles.miniBarFill} style={{ width: `${(r.views / max) * 100}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={styles.section}>
                <div className={styles.sectionHead}><span className={styles.sectionTitle}>TOP 카테고리 (조회수)</span></div>
                <BreakdownTable rows={categoriesViews.slice(0, 5)} countLabel="조회수" formatCount={fmtViews} />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
