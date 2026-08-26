import { useNavigate } from 'react-router-dom';
import styles from '../ops/opsDrawerShared.module.css';
import { maskBody, SLOW_MS, type ApiLogEntry } from './systemLogData';

interface Props {
  entry: ApiLogEntry;
  onClose: () => void;
}

function JsonBlock({ value }: { value: Record<string, unknown> | null }) {
  if (!value) return <div className={styles.emptyInline}>본문 없음</div>;
  return <pre className={styles.bodyText} style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11.5, overflowX: 'auto' }}>{JSON.stringify(value, null, 2)}</pre>;
}

export function ApiLogDetailDrawer({ entry: e, onClose }: Props) {
  const navigate = useNavigate();
  const isSuccess = e.result === '성공';
  const isSlow = e.durationMs >= SLOW_MS;

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>API 로그 상세 · {e.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{e.method} {e.endpoint}</span>
              <span className={styles.badge} style={{ background: isSuccess ? '#ecfdf5' : '#fef2f2', color: isSuccess ? '#059669' : '#b91c1c' }}>{e.result}</span>
              {isSlow && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>느림</span>}
            </div>
            <div className={styles.sub}>{e.statusCode} · {e.at} · {e.durationMs}ms</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.fieldBox}>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>Request ID</span><span className={styles.fieldValue}>{e.id}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>요청 일시</span><span className={styles.fieldValue}>{e.at}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>Method</span><span className={styles.fieldValue}>{e.method}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>Endpoint</span><span className={styles.fieldValue}>{e.endpoint}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>Status</span><span className={styles.fieldValue}>{e.statusCode}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>처리 시간</span><span className={styles.fieldValue}>{e.durationMs}ms</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>서비스/모듈</span><span className={styles.fieldValue}>{e.module}</span></div>
        </div>

        <div className={styles.sectionTitleLoose}>요청 정보</div>
        <div className={styles.fieldBox}>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>요청자</span><span className={styles.fieldValue}>{e.requester}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>IP</span><span className={styles.fieldValue}>{e.ip}</span></div>
        </div>
        <div className={styles.sectionTitleLoose}>Request Body</div>
        <JsonBlock value={maskBody(e.requestBody)} />

        <div className={styles.sectionTitleLoose}>응답 정보</div>
        <JsonBlock value={maskBody(e.responseBody)} />
        {e.errorCode && (
          <div className={styles.fieldBox} style={{ marginTop: 10 }}>
            <div className={styles.fieldRow}><span className={styles.fieldLabel}>Error Code</span><span className={styles.fieldValue}>{e.errorCode}</span></div>
          </div>
        )}

        {(e.related.order || e.related.member || e.related.payment) && (
          <>
            <div className={styles.sectionTitleLoose}>관련 데이터</div>
            <div className={styles.fieldBox}>
              {e.related.order && (
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>주문</span>
                  <button type="button" className={styles.actionLink} style={{ height: 26, padding: '0 10px' }} onClick={() => navigate('/orders/purchase')}>{e.related.order} 보기</button>
                </div>
              )}
              {e.related.member && (
                <div className={styles.fieldRow}>
                  <span className={styles.fieldLabel}>회원</span>
                  <button type="button" className={styles.actionLink} style={{ height: 26, padding: '0 10px' }} onClick={() => navigate('/members')}>{e.related.member} 보기</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
