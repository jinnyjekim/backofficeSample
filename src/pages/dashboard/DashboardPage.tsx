import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BusinessScopeSwitch } from '../../components/business/BusinessScopeSwitch';
import { BUSINESS_SCOPES, type BusinessScope } from '../../lib/business';
import styles from './DashboardPage.module.css';
import { DASHBOARD_DATA, type DashboardTone } from './dashboardData';

const TONE_CLASS: Record<DashboardTone, string> = {
  critical: styles.toneCritical,
  warning: styles.toneWarning,
  info: styles.toneInfo,
  success: styles.toneSuccess,
  neutral: styles.toneNeutral,
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [scope, setScope] = useState<BusinessScope>('통합');
  const [updatedAt, setUpdatedAt] = useState('5분 전');
  const current = DASHBOARD_DATA[scope];

  return (
    <main className={styles.wrap}>
      <header className={styles.pageHeader}>
        <div className={styles.headingBlock}>
          <div className={styles.eyebrow}>2026.08.31 월요일</div>
          <h1 className={styles.title}>운영 대시보드</h1>
          <p className={styles.subtitle}>{current.overview}</p>
        </div>
        <div className={styles.headerTools}>
          <button type="button" className={styles.refreshButton} onClick={() => setUpdatedAt('방금 전')} aria-label="대시보드 새로고침">
            <RefreshCw size={15} />
            <span>{updatedAt} 갱신</span>
          </button>
          <BusinessScopeSwitch value={scope} options={BUSINESS_SCOPES} onChange={setScope} note={current.note} />
        </div>
      </header>

      <section className={styles.section} aria-labelledby="dashboard-kpi-title">
        <SectionHeading id="dashboard-kpi-title" title="오늘의 핵심 지표" description="자정부터 현재까지 · 취소와 환불 반영" />
        <div className={styles.kpiGrid}>
          {current.kpis.map((kpi) => (
            <button type="button" className={`${styles.card} ${styles.kpiCard}`} key={kpi.label} onClick={() => navigate(kpi.to)}>
              <span className={styles.kpiLabel}>{kpi.label}</span>
              <span className={styles.kpiValue}>{kpi.value}</span>
              <span className={styles.kpiComparison}>
                <em className={styles[`delta_${kpi.deltaTone}`]}>{kpi.delta}</em>
                <span>{kpi.comparison}</span>
              </span>
              <span className={styles.kpiDetail}>{kpi.detail}</span>
              <ArrowUpRight className={styles.cardArrow} size={15} />
            </button>
          ))}
        </div>
      </section>

      <div className={styles.primaryGrid}>
        <section className={`${styles.card} ${styles.alertCard}`} aria-labelledby="dashboard-alert-title">
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitleRow}><AlertTriangle size={16} /><h2 id="dashboard-alert-title">우선 확인 업무</h2></div>
              <p>고객 영향과 마감 시간을 기준으로 정렬했습니다.</p>
            </div>
            <span className={styles.headerCount}>{current.alerts.length}건</span>
          </div>
          <div className={styles.alertList}>
            {current.alerts.map((alert) => (
              <button type="button" className={styles.alertRow} key={alert.id} onClick={() => navigate(alert.to)}>
                <span className={`${styles.alertIndicator} ${TONE_CLASS[alert.tone]}`} />
                <span className={styles.alertContent}>
                  <span className={styles.alertMeta}><em className={`${styles.categoryBadge} ${TONE_CLASS[alert.tone]}`}>{alert.category}</em><span>{alert.when}</span></span>
                  <strong>{alert.title}</strong>
                  <span className={styles.alertDescription}>{alert.description}</span>
                </span>
                <span className={styles.alertAction}>{alert.action}<ArrowUpRight size={13} /></span>
              </button>
            ))}
          </div>
        </section>

        <section className={`${styles.card} ${styles.taskCard}`} aria-labelledby="dashboard-task-title">
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitleRow}><Clock3 size={16} /><h2 id="dashboard-task-title">처리 대기 큐</h2></div>
              <p>지금 운영자가 처리할 수 있는 업무입니다.</p>
            </div>
          </div>
          <div className={styles.taskGrid}>
            {current.tasks.map((task) => (
              <button type="button" className={styles.taskItem} key={task.label} onClick={() => navigate(task.to)}>
                <span className={`${styles.taskIcon} ${TONE_CLASS[task.tone]}`}><Clock3 size={14} /></span>
                <span className={styles.taskBody}><strong>{task.label}</strong><span>{task.description}</span></span>
                <span className={styles.taskCount}>{task.count.toLocaleString()}<small>{task.unit}</small></span>
                <ArrowUpRight size={13} className={styles.taskArrow} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className={styles.analyticsGrid}>
        <section className={`${styles.card} ${styles.trendCard}`} aria-labelledby="dashboard-trend-title">
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitleRow}><Activity size={16} /><h2 id="dashboard-trend-title">{current.trendTitle}</h2></div>
              <p>{current.trendHint}</p>
            </div>
            <button type="button" className={styles.textLink} onClick={() => navigate('/stats/overview')}>상세 통계<ArrowUpRight size={13} /></button>
          </div>
          <div className={styles.chartLegend}>
            {current.trendLegend.map((item) => <span key={item.key}><i style={{ background: item.color }} />{item.label}<strong>{item.total}</strong></span>)}
          </div>
          <div className={styles.chartPlot}>
            <div className={styles.gridLine} style={{ bottom: '25%' }} /><div className={styles.gridLine} style={{ bottom: '50%' }} /><div className={styles.gridLine} style={{ bottom: '75%' }} />
            {current.trend.map((point) => (
              <div className={styles.chartColumn} key={point.day}>
                <div className={styles.barGroup}>
                  {current.trendLegend.map((item) => <span key={item.key} className={styles.chartBar} style={{ height: `${point[item.key]}%`, background: item.color }} title={`${item.label} ${point[item.key]}`} />)}
                </div>
                <span className={styles.chartDay}>{point.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.card} ${styles.healthCard}`} aria-labelledby="dashboard-health-title">
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitleRow}><CheckCircle2 size={16} /><h2 id="dashboard-health-title">{current.healthTitle}</h2></div>
              <p>핵심 정상 처리 비율입니다.</p>
            </div>
          </div>
          <div className={styles.healthList}>
            {current.health.map((item) => (
              <button type="button" className={styles.healthItem} key={item.label} onClick={() => navigate(item.to)}>
                <span className={styles.healthTop}><strong>{item.label}</strong><em>{item.value}</em></span>
                <span className={styles.healthTrack}><i style={{ width: `${item.percent}%`, background: item.color }} /></span>
                <span className={styles.healthDetail}>{item.detail}<ArrowUpRight size={12} /></span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className={`${styles.card} ${styles.activityCard}`} aria-labelledby="dashboard-activity-title">
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitleRow}><Activity size={16} /><h2 id="dashboard-activity-title">최근 운영 활동</h2></div>
            <p>서비스 이벤트와 운영자 처리 내역을 시간순으로 표시합니다.</p>
          </div>
          <span className={styles.liveBadge}><i />실시간</span>
        </div>
        <div className={styles.activityList}>
          {current.activities.map((activity, index) => (
            <button type="button" className={styles.activityRow} key={`${activity.actor}-${index}`} onClick={() => navigate(activity.to)}>
              <span className={styles.activityDot} style={{ background: activity.color }} />
              <span className={styles.activityActor}>{activity.actor}</span>
              <span className={styles.activityAction}>{activity.action}</span>
              <span className={styles.activityMeta}>{activity.meta}</span>
              <span className={styles.activityWhen}>{activity.when}</span>
              <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return <div className={styles.sectionHeading}><h2 id={id}>{title}</h2><span>{description}</span></div>;
}
