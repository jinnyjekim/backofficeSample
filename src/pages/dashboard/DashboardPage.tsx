import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';
import { ALERTS, CHART, CHART_INQ, CHART_JOIN, CHART_ORDER, FEED, KPIS_MAIN, LEGEND, MEMBER_MIX } from './dashboardData';

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <span className={styles.title}>오늘 현황</span>
        <span className={styles.titleSub}>2026.08.12 기준 · 5분 전 갱신</span>
      </div>

      <div className={`${styles.card} ${styles.alertsCard}`}>
        <div className={styles.alertsHead}>
          <span className={styles.alertsBadge}>!</span>
          <span className={styles.alertsTitle}>지금 확인할 것</span>
          <span className={styles.alertsHint}>방치하면 고객 영향이 커지는 항목만 모았습니다</span>
        </div>
        {ALERTS.map((a) => (
          <div className={styles.alertRow} key={a.title}>
            <span className={styles.alertDot} style={{ background: a.dot }} />
            <div className={styles.alertBody}>
              <div className={styles.alertTitle}>{a.title}</div>
              <div className={styles.alertSub}>{a.sub}</div>
            </div>
            <span className={styles.alertWhen}>{a.when}</span>
            <button type="button" className={styles.alertCta}>{a.cta}</button>
          </div>
        ))}
      </div>

      <div className={styles.kpiRow}>
        {KPIS_MAIN.map((k) => (
          <div className={`${styles.card} ${styles.kpiCard}`} key={k.label}>
            <div className={styles.kpiLabel}>{k.label}</div>
            <div className={styles.kpiValueRow}>
              <span className={styles.kpiValue}>{k.value}</span>
              <span className={styles.kpiDelta} style={{ color: k.deltaFg }}>{k.delta}</span>
            </div>
            <div className={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className={styles.bottomRow}>
        <div className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.cardHeadRow}>
            <span className={styles.cardHeadTitle}>주간 추이</span>
            <span className={styles.cardHeadHint}>최근 7일 가입 · 주문 · 문의</span>
          </div>
          <div className={styles.chartArea}>
            {CHART.map((c) => (
              <div className={styles.chartCol} key={c.day}>
                <div className={styles.chartBars}>
                  <div className={styles.bar} style={{ background: CHART_JOIN, height: `${c.join}%` }} />
                  <div className={styles.bar} style={{ background: CHART_ORDER, height: `${c.order}%` }} />
                  <div className={styles.bar} style={{ background: CHART_INQ, height: `${c.inq}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.chartDays}>
            {CHART.map((c) => (
              <span className={styles.chartDay} key={c.day}>{c.day}</span>
            ))}
          </div>
          <div className={styles.legendRow}>
            {LEGEND.map((l) => (
              <div className={styles.legendItem} key={l.label}>
                <span className={styles.legendSwatch} style={{ background: l.color }} />
                <span className={styles.legendLabel}>{l.label}</span>
                <span className={styles.legendTotal}>{l.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.card} ${styles.mixCard}`}>
          <div className={styles.mixHeadRow}>
            <span className={styles.cardHeadTitle}>회원 현황</span>
            <button type="button" className={styles.mixLink} onClick={() => navigate('/members')}>
              목록에서 보기 →
            </button>
          </div>
          {MEMBER_MIX.map((m) => (
            <button
              type="button"
              className={styles.mixItem}
              key={m.label}
              onClick={() => navigate(`/members?view=${m.view}`)}
            >
              <div className={styles.mixTopRow}>
                <span className={styles.mixLabel}>{m.label}</span>
                <span className={styles.mixValue}>{m.value}</span>
              </div>
              <span className={styles.mixTrack}>
                <span className={styles.mixFill} style={{ width: m.pct, background: m.color }} />
              </span>
            </button>
          ))}
        </div>

        <div className={`${styles.card} ${styles.feedCard}`}>
          <div className={styles.feedHeadRow}>
            <span className={styles.cardHeadTitle}>최근 활동</span>
            <span className={styles.feedLive}>실시간</span>
          </div>
          {FEED.map((f, i) => (
            <div className={styles.feedRow} key={i}>
              <span className={styles.feedDot} style={{ background: f.dot }} />
              <span className={styles.feedText}>
                <span className={styles.feedWho}>{f.who}</span> {f.what}
              </span>
              <span className={styles.feedWhen}>{f.when}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
