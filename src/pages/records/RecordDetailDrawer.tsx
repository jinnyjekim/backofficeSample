import styles from './RecordDetailDrawer.module.css';
import type { RecDetail } from './recordDetail';

interface Props {
  detail: RecDetail;
  onClose: () => void;
}

export function RecordDetailDrawer({ detail: d, onClose }: Props) {
  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headBody}>
          <div className={styles.title}>{d.title}</div>
          <div className={styles.sub}>{d.sub}</div>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      <div className={styles.scroll}>
        {d.sections.map((sec) => (
          <div className={styles.section} key={sec.title}>
            <div className={styles.sectionTitle}>{sec.title}</div>
            {sec.fields.map((f) => (
              <div className={styles.fieldRow} key={f.label}>
                <span className={styles.fieldLabel}>{f.label}</span>
                <span
                  className={`${styles.fieldValue} ${f.pill ? styles.pill : ''}`}
                  style={{ background: f.pill?.bg, color: f.pill?.fg ?? f.color ?? '#18181b' }}
                >
                  {f.value}
                </span>
              </div>
            ))}
            {sec.note && <div className={styles.note}>{sec.note}</div>}
          </div>
        ))}

        {d.evidence && d.evidence.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>제재 근거</div>
            {d.evidence.map((e) => (
              <div className={styles.evidenceRow} key={e.text}>
                <span className={styles.evidenceText}>{e.text}</span>
                <button type="button" className={styles.evidenceLink}>{e.linkLabel}</button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.timelineWrap}>
          <div className={styles.timelineTitle}>이력</div>
          {d.timeline.map((t, i) => (
            <div className={styles.timelineItem} key={i}>
              <div className={styles.timelineDot} style={{ background: t.dot }} />
              <div className={styles.timelineBody}>
                <div className={styles.timelineItemTitle}>{t.title}</div>
                <div className={styles.timelineWhen}>{t.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText}>{d.footer}</span>
        <button type="button" className={styles.footerAction}>{d.action}</button>
      </div>
    </aside>
  );
}
