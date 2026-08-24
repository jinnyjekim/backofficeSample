import { useState } from 'react';
import shared from '../ops/opsShared.module.css';
import styles from './CancelPolicyPage.module.css';
import type { CancelReason } from './cancelPolicyData';

interface Props {
  initial: CancelReason;
  onClose: () => void;
  onSave: (reason: CancelReason) => void;
}

export function CancelReasonEditDialog({ initial, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const set = <K extends keyof CancelReason>(key: K, value: CancelReason[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (!draft.label.trim()) return setError('사유명을 입력해 주세요.');
    onSave({ ...draft, label: draft.label.trim() });
  };

  return (
    <div className={shared.dialogOverlay}>
      <div className={`${shared.dialogBox} ${styles.reasonDialog}`}>
        <h2 className={shared.dialogTitle}>{draft.audience}용 취소 사유</h2>
        <label className={styles.formField}>
          <span>사유명 *</span>
          <input value={draft.label} onChange={(e) => set('label', e.target.value)} placeholder="예: 단순 변심" />
        </label>
        <label className={styles.toggleField}>
          <span>노출 (활성)</span>
          <button type="button" className={`${styles.switch} ${draft.active ? styles.switchOn : ''}`} onClick={() => set('active', !draft.active)}><i /></button>
        </label>
        <label className={styles.toggleField}>
          <span>상세 사유 입력 필수<small>'기타' 등 자유 서술이 필요한 사유에 사용</small></span>
          <button type="button" className={`${styles.switch} ${draft.requiresDetail ? styles.switchOn : ''}`} onClick={() => set('requiresDetail', !draft.requiresDetail)}><i /></button>
        </label>
        {error && <div className={styles.formError}>{error}</div>}
        <div className={shared.dialogActions}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>취소</button>
          <button type="button" className={styles.primaryButton} onClick={save}>저장</button>
        </div>
      </div>
    </div>
  );
}
