import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { errorFirstAt, errorLastAt, LEVEL_META, type ErrorGroup } from './systemLogData';

interface Props {
  group: ErrorGroup;
  onClose: () => void;
}

export function ErrorGroupDetailDrawer({ group: g, onClose }: Props) {
  const navigate = useNavigate();
  const [showTech, setShowTech] = useState(false);
  const meta = LEVEL_META[g.level];

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>오류 로그 상세 · {g.errorCode}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{g.errorCode}</span>
              <span className={styles.badge} style={{ background: meta.bg, color: meta.fg }}>{g.level}</span>
            </div>
            <div className={styles.sub}>{g.module} · {g.occurrences.length}회 발생</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.sectionTitle}>오류 정보</div>
        <div className={styles.fieldBox}>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>오류 수준</span><span className={styles.fieldValue}>{g.level}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>오류 코드</span><span className={styles.fieldValue}>{g.errorCode}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>서비스/모듈</span><span className={styles.fieldValue}>{g.module}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>최초 발생</span><span className={styles.fieldValue}>{errorFirstAt(g)}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>마지막 발생</span><span className={styles.fieldValue}>{errorLastAt(g)}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>발생 횟수</span><span className={styles.fieldValue}>{g.occurrences.length}회</span></div>
        </div>
        <div className={styles.bodyText}>{g.message}</div>

        <div className={styles.sectionTitleLoose}>기술 정보</div>
        {!showTech ? (
          <button type="button" className={styles.actionLink} onClick={() => setShowTech(true)}>펼쳐보기</button>
        ) : (
          <>
            <button type="button" className={styles.actionLink} style={{ marginBottom: 8 }} onClick={() => setShowTech(false)}>접기</button>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>Exception</span><span className={styles.fieldValue}>{g.exception}</span></div>
            </div>
            <pre className={styles.bodyText} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11.5, overflowX: 'auto' }}>{g.stackTrace}</pre>
          </>
        )}

        <div className={styles.sectionTitleLoose}>발생 내역</div>
        {g.occurrences.slice().reverse().map((o) => (
          <div key={o.id} className={styles.timelineItem}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineBody}>
              <div className={styles.timelineRow}>
                <span className={styles.timelineTitle}>{o.at}</span>
                {o.requestId && <span className={styles.timelineWhen}>{o.requestId}</span>}
              </div>
              <div className={styles.timelineDetail} style={{ display: 'flex', gap: 8 }}>
                {o.member && <button type="button" className={styles.actionLink} style={{ height: 24, padding: '0 8px', fontSize: 11 }} onClick={() => navigate('/members')}>{o.member} 회원</button>}
                {o.order && <button type="button" className={styles.actionLink} style={{ height: 24, padding: '0 8px', fontSize: 11 }} onClick={() => navigate('/orders/purchase')}>{o.order} 주문</button>}
                {!o.member && !o.order && '관련 데이터 없음'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
