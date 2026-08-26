import styles from '../ops/opsDrawerShared.module.css';
import { ADMINS } from './adminData';
import type { ActionLogEntry, LoginLogEntry } from './adminHistoryData';

function adminLabel(adminId: string): string {
  const a = ADMINS.find((x) => x.id === adminId);
  return a ? `${adminId} / ${a.name}` : adminId;
}

type Props =
  | { kind: 'login'; item: LoginLogEntry; onClose: () => void }
  | { kind: 'action'; item: ActionLogEntry; onClose: () => void };

export function AdminHistoryDetailDrawer(props: Props) {
  const { kind, item, onClose } = props;
  const isSuccess = item.result === '성공';

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>관리자 이력 · {item.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{kind === 'login' ? '로그인 이력 상세' : '작업 이력 상세'}</span>
              <span className={styles.badge} style={{ background: isSuccess ? '#ecfdf5' : '#fef2f2', color: isSuccess ? '#059669' : '#b91c1c' }}>{item.result}</span>
            </div>
            <div className={styles.sub}>{adminLabel(item.adminId)} · {item.at}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.sectionTitle}>관리자</div>
        <div className={styles.fieldBox}>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>관리자</span><span className={styles.fieldValue}>{adminLabel(item.adminId)}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>{kind === 'login' ? '로그인 일시' : '작업 일시'}</span><span className={styles.fieldValue}>{item.at}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>IP</span><span className={styles.fieldValue}>{item.ip}</span></div>
        </div>

        {kind === 'login' ? (
          <>
            <div className={styles.sectionTitleLoose}>접속 정보</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>결과</span><span className={styles.fieldValue}>{item.result}</span></div>
              {item.result === '실패' && item.failReason && (
                <div className={styles.fieldRow}><span className={styles.fieldLabel}>실패 사유</span><span className={styles.fieldValue}>{item.failReason}</span></div>
              )}
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>접속 환경</span><span className={styles.fieldValue}>{item.device}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>세션 종료</span><span className={styles.fieldValue}>{item.logoutAt ?? '세션 유지 중'}</span></div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.sectionTitleLoose}>작업 위치 / 대상</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>메뉴</span><span className={styles.fieldValue}>{item.menuPath}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>작업</span><span className={styles.fieldValue}>{item.actionType}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>대상</span><span className={styles.fieldValue}>{item.targetType} · {item.targetId}</span></div>
              {item.reason && <div className={styles.fieldRow}><span className={styles.fieldLabel}>작업 사유</span><span className={styles.fieldValue}>{item.reason}</span></div>}
            </div>

            <div className={styles.sectionTitleLoose}>결과</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>결과</span><span className={styles.fieldValue}>{item.result}</span></div>
              {item.result === '실패' && (
                <>
                  <div className={styles.fieldRow}><span className={styles.fieldLabel}>실패 사유</span><span className={styles.fieldValue}>{item.failReason}</span></div>
                  <div className={styles.fieldRow}><span className={styles.fieldLabel}>오류 코드</span><span className={styles.fieldValue}>{item.errorCode}</span></div>
                </>
              )}
            </div>

            {item.changes.length > 0 && (
              <>
                <div className={styles.sectionTitleLoose}>변경 항목</div>
                <div className={styles.fieldBox}>
                  {item.changes.map((c) => (
                    <div className={styles.fieldRow} key={c.field}>
                      <span className={styles.fieldLabel}>{c.field}</span>
                      <span className={styles.fieldValue}>{c.before} → {c.after}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
