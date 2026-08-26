import { useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { STATUS_META, computeIssues, maskEmail, roleName, type AdminAccount, type Memo } from './adminData';

interface Props {
  admin: AdminAccount;
  all: AdminAccount[];
  onClose: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onUnlock: () => void;
  onToggleActive: () => void;
  onAddMemo: (text: string) => void;
}

export function AdminDetailDrawer({ admin: a, all, onClose, onEdit, onResetPassword, onUnlock, onToggleActive, onAddMemo }: Props) {
  const [memoText, setMemoText] = useState('');
  const sm = STATUS_META[a.status];
  const issues = computeIssues(a, all);

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(memoText.trim());
    setMemoText('');
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>관리자 관리 · {a.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{a.name}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{a.status}</span>
              {a.isSuperAdmin && <span className={styles.badge} style={{ background: '#eff6ff', color: '#1d4ed8' }}>최고 관리자</span>}
            </div>
            <div className={styles.sub}>{maskEmail(a.email)} · {a.roleIds.map(roleName).join(', ') || '역할 없음'}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {issues.length > 0 && (
          <div className={styles.editPanel} style={{ marginTop: 12, background: '#fffbeb', borderColor: '#fde68a' }}>
            <div className={styles.editTitle} style={{ color: '#b45309' }}>확인이 필요합니다</div>
            {issues.map((issue) => (
              <div key={issue} style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>⚠ {issue}</div>
            ))}
          </div>
        )}

        <div className={styles.actionRow}>
          <button type="button" className={styles.actionLink} onClick={onEdit}>정보 수정</button>
          <button type="button" className={styles.actionLink} onClick={onResetPassword}>비밀번호 초기화</button>
          {a.status === '잠금' && <button type="button" className={styles.actionLink} onClick={onUnlock}>로그인 잠금 해제</button>}
          <div className={styles.spacer} />
          {a.status === '비활성' ? (
            <button type="button" className={styles.actionLink} onClick={onToggleActive}>계정 활성화</button>
          ) : (
            !a.isSuperAdmin && (
              <button type="button" className={styles.dangerBtn} onClick={onToggleActive}>계정 비활성화</button>
            )
          )}
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.fieldBox}>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>관리자 ID</span><span className={styles.fieldValue}>{a.id}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>관리자명</span><span className={styles.fieldValue}>{a.name}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>이메일</span><span className={styles.fieldValue}>{a.email}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>연락처</span><span className={styles.fieldValue}>{a.phone ?? '-'}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>등록일</span><span className={styles.fieldValue}>{a.createdAt}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>최근 수정일</span><span className={styles.fieldValue}>{a.updatedAt}</span></div>
        </div>

        <div className={styles.sectionTitleLoose}>역할 및 권한</div>
        <div className={styles.fieldBox}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>역할</span>
            <span className={styles.fieldValue}>{a.roleIds.length > 0 ? a.roleIds.map(roleName).join(', ') : '없음'}</span>
          </div>
        </div>

        <div className={styles.sectionTitleLoose}>계정 상태</div>
        <div className={styles.fieldBox}>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>상태</span><span className={styles.fieldValue}>{a.status}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>최근 로그인</span><span className={styles.fieldValue}>{a.lastLoginAt ?? '로그인 이력 없음'}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>최근 로그인 IP</span><span className={styles.fieldValue}>{a.lastLoginIp ?? '-'}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>로그인 실패</span><span className={styles.fieldValue}>{a.loginFailCount}회</span></div>
        </div>

        <div className={styles.sectionTitleLoose}>관리자 메모</div>
        <div className={styles.memoInputRow}>
          <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
          <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
        </div>
        {a.memos.length === 0 ? (
          <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
        ) : (
          a.memos.map((m: Memo) => (
            <div key={m.id} className={styles.memoItem}>
              <div className={styles.memoWhen}>{m.at} · {m.by}</div>
              <div className={styles.memoText}>{m.text}</div>
            </div>
          ))
        )}

        <div className={styles.sectionTitleLoose}>최근 활동</div>
        {a.history.slice().reverse().map((h) => (
          <div key={h.id} className={styles.timelineItem}>
            <div className={styles.timelineDot} />
            <div className={styles.timelineBody}>
              <div className={styles.timelineRow}>
                <span className={styles.timelineTitle}>{h.action}</span>
                <span className={styles.timelineWhen}>{h.at}</span>
              </div>
              {h.detail && <div className={styles.timelineDetail}>{h.detail}</div>}
              <div className={styles.timelineDetail}>{h.by}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
