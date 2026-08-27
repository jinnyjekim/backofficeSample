import { DatePicker } from '../../components/forms/DatePicker';
import { useRef, useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { DEDUCT_REASONS, GRANT_REASONS, TODAY, fmtPoint, type DeductReason, type GrantReason, type MemberPointBalance } from './pointsData';

export type GrantMode = 'grant' | 'deduct';

export interface GrantFormData {
  amount: number;
  reason: GrantReason;
  detail: string;
  immediate: boolean;
  confirmAt: string | null;
}

export interface DeductFormData {
  amount: number;
  reason: DeductReason;
  detail: string;
}

interface Props {
  mode: GrantMode;
  balance: MemberPointBalance;
  onCancel: () => void;
  onSubmitGrant: (form: GrantFormData) => void;
  onSubmitDeduct: (form: DeductFormData) => void;
}

export function PointGrantDrawer({ mode, balance: b, onCancel, onSubmitGrant, onSubmitDeduct }: Props) {
  const [amount, setAmount] = useState('1000');
  const [grantReason, setGrantReason] = useState<GrantReason>('CS 보상');
  const [deductReason, setDeductReason] = useState<DeductReason>('오지급 회수');
  const [detail, setDetail] = useState('');
  const [timing, setTiming] = useState<'즉시' | '지정'>('즉시');
  const [confirmAt, setConfirmAt] = useState(TODAY);
  const [error, setError] = useState('');

  function submit() {
    const amt = Math.max(0, Number(amount) || 0);
    if (amt <= 0) return setError('지급/차감할 포인트를 입력해 주세요.');
    if (!detail.trim()) return setError('상세 사유를 입력해 주세요.');

    if (mode === 'deduct' && amt > b.available) {
      return setError(`사용 가능한 포인트(${fmtPoint(b.available)})보다 많이 차감할 수 없습니다.`);
    }

    setError('');
    if (mode === 'grant') {
      onSubmitGrant({ amount: amt, reason: grantReason, detail: detail.trim(), immediate: timing === '즉시', confirmAt: timing === '지정' ? confirmAt : null });
    } else {
      onSubmitDeduct({ amount: amt, reason: deductReason, detail: detail.trim() });
    }
  }

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onCancel);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>포인트 / 적립금 관리 · 보유 현황</div>
            <div className={styles.titleRow}><span className={styles.title}>{mode === 'grant' ? '포인트 지급' : '포인트 차감'}</span></div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.fieldBox}>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>회원</span><span className={styles.fieldValue}>{b.member}</span></div>
          <div className={styles.fieldRow}><span className={styles.fieldLabel}>현재 사용 가능</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtPoint(b.available)}</span></div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{mode === 'grant' ? '지급' : '차감'} 포인트 *</label>
          <input className={styles.formInput} type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{mode === 'grant' ? '지급' : '차감'} 사유 *</label>
          {mode === 'grant' ? (
            <select className={styles.formSelect} value={grantReason} onChange={(e) => setGrantReason(e.target.value as GrantReason)}>
              {GRANT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          ) : (
            <select className={styles.formSelect} value={deductReason} onChange={(e) => setDeductReason(e.target.value as DeductReason)}>
              {DEDUCT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>상세 사유 *</label>
          <input className={styles.formInput} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="상세 사유를 입력하세요" />
        </div>

        {mode === 'grant' && (
          <>
            <div className={styles.sectionTitleLoose}>사용 가능 시점</div>
            <div className={styles.radioRow}>
              <label className={styles.radioOption}><input type="radio" checked={timing === '즉시'} onChange={() => setTiming('즉시')} />즉시</label>
              <label className={styles.radioOption}><input type="radio" checked={timing === '지정'} onChange={() => setTiming('지정')} />날짜 지정</label>
            </div>
            {timing === '지정' && (
              <div className={styles.formGroup}>
                <DatePicker className={styles.dateInput} style={{ width: '100%' }} value={confirmAt} onChange={(e) => setConfirmAt(e.target.value)} />
              </div>
            )}
          </>
        )}

        {mode === 'deduct' && (
          <div className={styles.emptyInline}>사용 가능한 포인트보다 많이 차감할 수 없습니다. 마이너스 잔액은 허용되지 않습니다.</div>
        )}

        {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 12 }}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.editCancel} onClick={onCancel}>취소</button>
        <button type="button" className={styles.editConfirm} onClick={submit}>{mode === 'grant' ? '지급' : '차감'}</button>
      </div>
    </aside>
  );
}
