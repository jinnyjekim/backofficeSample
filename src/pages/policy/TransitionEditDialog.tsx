import { useState } from 'react';
import shared from '../ops/opsShared.module.css';
import styles from './OrderStatusPage.module.css';
import { CHANGE_MODES, REASON_RULES, ROLE_OPTIONS, type ChangeMode, type ReasonRule, type TransitionEntry } from './orderStatusData';

interface Props {
  fromLabel: string;
  toLabel: string;
  initial: TransitionEntry | null;
  onClose: () => void;
  onSave: (fields: { mode: ChangeMode; condition: string; reasonRule: ReasonRule; allowedRoles: string[] }) => void;
  onDelete?: () => void;
}

export function TransitionEditDialog({ fromLabel, toLabel, initial, onClose, onSave, onDelete }: Props) {
  const [mode, setMode] = useState<ChangeMode>(initial?.mode ?? '수동');
  const [condition, setCondition] = useState(initial?.condition ?? '');
  const [reasonRule, setReasonRule] = useState<ReasonRule>(initial?.reasonRule ?? '없음');
  const [allowedRoles, setAllowedRoles] = useState<string[]>(initial?.allowedRoles ?? ['주문 관리자']);

  const toggleRole = (role: string) => {
    setAllowedRoles((current) => (current.includes(role) ? current.filter((r) => r !== role) : [...current, role]));
  };

  return (
    <div className={shared.dialogOverlay}>
      <div className={`${shared.dialogBox} ${styles.transitionDialog}`}>
        <h2 className={shared.dialogTitle}>상태 전환 설정</h2>
        <p className={shared.dialogBody}><strong>{fromLabel}</strong> → <strong>{toLabel}</strong></p>

        <label className={styles.formField}>
          <span>변경 방식</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as ChangeMode)}>
            {CHANGE_MODES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        {mode !== '수동' && (
          <label className={styles.formField}>
            <span>자동 전환 조건</span>
            <input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="예: 결제 완료, 출고 검수 완료" />
          </label>
        )}
        <label className={styles.formField}>
          <span>상태 변경 사유</span>
          <select value={reasonRule} onChange={(e) => setReasonRule(e.target.value as ReasonRule)}>
            {REASON_RULES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </label>
        <label className={styles.formField}>
          <span>허용 역할</span>
          <div className={styles.roleCheckRow}>
            {ROLE_OPTIONS.map((role) => (
              <label key={role}>
                <input type="checkbox" checked={allowedRoles.includes(role)} onChange={() => toggleRole(role)} />
                {role}
              </label>
            ))}
          </div>
        </label>

        <div className={shared.dialogActions}>
          {initial && onDelete && <button type="button" className={styles.dangerButton} onClick={onDelete} style={{ marginRight: 'auto' }}>전환 삭제</button>}
          <button type="button" className={styles.cancelButton} onClick={onClose}>취소</button>
          <button type="button" className={styles.primaryButton} onClick={() => onSave({ mode, condition: condition.trim(), reasonRule, allowedRoles })}>저장</button>
        </div>
      </div>
    </div>
  );
}
