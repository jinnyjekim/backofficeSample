import { useNavigate } from 'react-router-dom';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './PaymentAuditPage.module.css';
import { actorColor, actorLabel, categoryColor, resultColor, splitAt, type PaymentAuditLog } from './paymentAuditData';

interface Props {
  log: PaymentAuditLog;
  onClose: () => void;
}

export function PaymentAuditDetailDrawer({ log, onClose }: Props) {
  const navigate = useNavigate();
  const [date, time] = splitAt(log.at);
  const rc = resultColor(log.result);
  const cc = categoryColor(log.category);
  const ac = actorColor(log.actorType);

  return (
    <aside className={drawer.aside}>
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{log.id}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{log.action}</h2>
              <span className={drawer.badge} style={{ background: rc.dot === '#ef4444' ? '#fef2f2' : rc.dot === '#a1a1aa' ? '#f4f4f5' : '#ecfdf5', color: rc.fg }}>{log.result}</span>
              {log.important && <span className={drawer.badge} style={{ background: '#fff7ed', color: '#c2410c' }}>중요 변경</span>}
            </div>
            <div className={drawer.sub}>{log.paymentId} · {date} {time}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={drawer.actionRow}>
          {log.paymentId !== '-' && (
            <button type="button" className={drawer.actionLink} onClick={() => navigate('/payment-mgmt/list', { state: { openPaymentId: log.paymentId } })}>결제 보기 ↗</button>
          )}
          {log.externalTxId && (
            <button type="button" className={drawer.actionLink} onClick={() => navigate('/payment-mgmt/external')}>외부 거래 보기 ↗</button>
          )}
        </div>
      </div>

      <div className={drawer.scroll}>
        <div className={styles.readOnlyNotice}>이 화면은 조회 전용입니다. 결제 처리 이력은 수정하거나 삭제할 수 없습니다.</div>

        <div className={drawer.sectionTitle}>처리 정보</div>
        <div className={drawer.fieldBox}>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>이력번호</span><span className={drawer.fieldValue}>{log.id}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>결제번호</span><span className={drawer.fieldValue}>{log.paymentId}</span></div>
          {log.orderId && <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>주문번호</span><span className={drawer.fieldValue}>{log.orderId}</span></div>}
          {log.externalTxId && <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>외부 거래번호</span><span className={drawer.fieldValue}>{log.externalTxId}</span></div>}
          <div className={drawer.fieldRow}>
            <span className={drawer.fieldLabel}>작업 유형</span>
            <span className={drawer.fieldValue}><span className={drawer.badge} style={{ background: cc.bg, color: cc.fg }}>{log.category}</span></span>
          </div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>처리일시</span><span className={drawer.fieldValue}>{date} {time}</span></div>
          <div className={drawer.fieldRow}>
            <span className={drawer.fieldLabel}>처리자</span>
            <span className={drawer.fieldValue}><span className={drawer.badge} style={{ background: ac.bg, color: ac.fg }}>{actorLabel(log.actorType)}</span> {log.actor}</span>
          </div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>Source</span><span className={drawer.fieldValue}>{log.source}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>처리 결과</span><span className={drawer.fieldValue} style={{ color: rc.fg }}>{log.result}</span></div>
        </div>

        <div className={drawer.sectionTitle}>변경 내용</div>
        {log.before || log.after ? (
          <div className={styles.changeTable}>
            <div className={styles.changeHead}><span>항목</span><span>이전</span><span>변경</span></div>
            <div className={styles.changeRow}>
              <span>{log.category}</span>
              <span className={styles.changeBefore}>{log.before ?? '-'}</span>
              <span className={styles.changeAfter}>{log.after ?? '-'}</span>
            </div>
          </div>
        ) : (
          <div className={drawer.bodyText}>{log.action}</div>
        )}
      </div>
    </aside>
  );
}
