import drawer from '../ops/opsDrawerShared.module.css';
import styles from './CsHistoryPage.module.css';
import { actorColor, actorLabel, categoryColor, findAdjacent, resultColor, splitAt, type CsAuditLog } from './csHistoryData';

interface Props {
  log: CsAuditLog;
  all: CsAuditLog[];
  onClose: () => void;
  onJump: (id: string) => void;
}

export function CsHistoryDetailDrawer({ log, all, onClose, onJump }: Props) {
  const [date, time] = splitAt(log.at);
  const rc = resultColor(log.result);
  const cc = categoryColor(log.category);
  const ac = actorColor(log.actorType);
  const { prev, next } = findAdjacent(log, all);

  return (
    <aside className={drawer.aside}>
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{log.id}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{log.actionLabel}</h2>
              <span className={drawer.badge} style={{ background: rc.bg, color: rc.fg }}>{log.result}</span>
              {log.important && <span className={drawer.badge} style={{ background: '#fff7ed', color: '#c2410c' }}>중요 변경</span>}
            </div>
            <div className={drawer.sub}>{log.targetId} · {log.targetSummary} · {date} {time}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>×</button>
        </div>
        {(log.relatedInquiryId || log.relatedConsultationId) && (
          <div className={drawer.actionRow}>
            {log.relatedInquiryId && (
              <button type="button" className={drawer.actionLink} onClick={() => window.location.assign('/cs/inquiries')}>관련 문의 보기 ↗</button>
            )}
            {log.relatedConsultationId && (
              <button type="button" className={drawer.actionLink} onClick={() => window.location.assign('/cs/consultations')}>관련 상담 보기 ↗</button>
            )}
          </div>
        )}
      </div>

      <div className={drawer.scroll}>
        <div className={styles.readOnlyNotice}>이 화면은 조회 전용입니다. CS 처리 이력은 수정하거나 삭제할 수 없습니다.</div>

        <div className={drawer.sectionTitle}>처리 정보</div>
        <div className={drawer.fieldBox}>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>이력번호</span><span className={drawer.fieldValue}>{log.id}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>대상 유형</span><span className={drawer.fieldValue}>{log.targetType}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>대상</span><span className={drawer.fieldValue}>{log.targetId}</span></div>
          <div className={drawer.fieldRow}>
            <span className={drawer.fieldLabel}>작업 유형</span>
            <span className={drawer.fieldValue}><span className={drawer.badge} style={{ background: cc.bg, color: cc.fg }}>{log.actionLabel}</span></span>
          </div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>처리일시</span><span className={drawer.fieldValue}>{date} {time}</span></div>
          <div className={drawer.fieldRow}>
            <span className={drawer.fieldLabel}>처리자</span>
            <span className={drawer.fieldValue}><span className={drawer.badge} style={{ background: ac.bg, color: ac.fg }}>{actorLabel(log.actorType)}</span> {log.actorId}</span>
          </div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>담당팀</span><span className={drawer.fieldValue}>{log.team ?? '-'}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>Source</span><span className={drawer.fieldValue}>{log.source}</span></div>
          <div className={drawer.fieldRow}>
            <span className={drawer.fieldLabel}>처리 결과</span>
            <span className={drawer.fieldValue} style={{ color: rc.fg }}>{log.result}{log.resultDetail ? ` · ${log.resultDetail}` : ''}</span>
          </div>
        </div>

        <div className={drawer.sectionTitle}>변경 내용</div>
        {log.changes.length > 0 ? (
          <div className={styles.changeTable}>
            <div className={styles.changeHead}><span>항목</span><span>이전</span><span>변경</span></div>
            {log.changes.map((change) => (
              <div key={change.field} className={styles.changeRow}>
                <span>{change.field}</span>
                <span className={styles.changeBefore}>{change.before}</span>
                <span className={styles.changeAfter}>{change.after}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={drawer.bodyText}>{log.summary}</div>
        )}

        {log.reason && (
          <>
            <div className={drawer.sectionTitleLoose}>처리 사유</div>
            <div className={drawer.bodyText}>{log.reason}</div>
          </>
        )}

        {(prev || next) && (
          <>
            <div className={drawer.sectionTitleLoose}>같은 대상의 처리 흐름</div>
            {prev && (
              <div className={drawer.linkedItem}>
                <span>이전 처리 · {splitAt(prev.at)[1]} {prev.actionLabel}</span>
                <a href="#" onClick={(event) => { event.preventDefault(); onJump(prev.id); }}>보기 ↗</a>
              </div>
            )}
            {next && (
              <div className={drawer.linkedItem}>
                <span>다음 처리 · {splitAt(next.at)[1]} {next.actionLabel}</span>
                <a href="#" onClick={(event) => { event.preventDefault(); onJump(next.id); }}>보기 ↗</a>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
