import { useState } from 'react';
import shared from '../ops/opsShared.module.css';
import styles from './PaymentPolicyPage.module.css';
import { PG_OPTIONS, type PaymentMethod } from './paymentPolicyData';

interface Props {
  initial: PaymentMethod;
  onClose: () => void;
  onSave: (method: PaymentMethod) => void;
}

export function PaymentMethodEditDialog({ initial, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState('');
  const set = <K extends keyof PaymentMethod>(key: K, value: PaymentMethod[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const save = () => {
    if (draft.maxAmount !== null && draft.maxAmount < draft.minAmount) return setError('최대 결제금액은 최소 결제금액보다 크거나 같아야 합니다.');
    onSave(draft);
  };

  return (
    <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`${shared.dialogBox} ${styles.methodDialog}`}>
        <h2 className={shared.dialogTitle}>{draft.name} 설정</h2>
        <p className={shared.dialogBody}>코드 {draft.code}</p>

        <label className={styles.toggleField}>
          <span>사용 여부</span>
          <button type="button" className={`${styles.switch} ${draft.active ? styles.switchOn : ''}`} onClick={() => set('active', !draft.active)}><i /></button>
        </label>
        <label className={styles.toggleField}>
          <span>기본 결제수단으로 지정</span>
          <button type="button" disabled={!draft.active} className={`${styles.switch} ${draft.isDefault ? styles.switchOn : ''}`} onClick={() => set('isDefault', !draft.isDefault)}><i /></button>
        </label>

        <div className={styles.formGrid}>
          <label className={styles.formField}>
            <span>최소 결제금액</span>
            <input type="number" min="0" value={draft.minAmount} onChange={(e) => set('minAmount', Number(e.target.value))} />
          </label>
          <label className={styles.formField}>
            <span>최대 결제금액 <small>비워두면 제한 없음</small></span>
            <input type="number" min="0" value={draft.maxAmount ?? ''} onChange={(e) => set('maxAmount', e.target.value ? Number(e.target.value) : null)} />
          </label>
        </div>

        <label className={styles.toggleField}>
          <span>부분결제 허용</span>
          <button type="button" className={`${styles.switch} ${draft.partialAllowed ? styles.switchOn : ''}`} onClick={() => set('partialAllowed', !draft.partialAllowed)}><i /></button>
        </label>
        <label className={styles.toggleField}>
          <span>자동 결제확정<small>PG 승인 시 즉시 완료 처리</small></span>
          <button type="button" className={`${styles.switch} ${draft.autoConfirm ? styles.switchOn : ''}`} onClick={() => set('autoConfirm', !draft.autoConfirm)}><i /></button>
        </label>

        <label className={styles.formField}>
          <span>PG 연결</span>
          <select value={draft.pg ?? '없음'} onChange={(e) => set('pg', e.target.value === '없음' ? null : e.target.value)}>
            {PG_OPTIONS.map((pg) => <option key={pg}>{pg}</option>)}
          </select>
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
