import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import {
  DEDUCT_REASONS, GRANT_REASONS, TODAY, fmtPoint,
  type DeductReason, type GrantReason, type MemberPointBalance,
} from './pointsData';
import styles from './PointGrantModal.module.css';
import bulkStyles from './PointBulkGrantModal.module.css';

export type BulkMode = 'grant' | 'deduct';

export type BulkGrantFormData =
  | {
      mode: 'grant';
      amount: number;
      reason: GrantReason;
      detail: string;
      immediate: boolean;
      confirmAt: string | null;
    }
  | {
      mode: 'deduct';
      amount: number;
      reason: DeductReason;
      detail: string;
    };

interface Props {
  members: MemberPointBalance[];
  onCancel: () => void;
  onSubmit: (form: BulkGrantFormData) => void;
}

export function PointBulkGrantModal({ members, onCancel, onSubmit }: Props) {
  const [mode, setMode] = useState<BulkMode>('grant');
  const [amount, setAmount] = useState('1000');
  const [grantReason, setGrantReason] = useState<GrantReason>('CS 보상');
  const [deductReason, setDeductReason] = useState<DeductReason>('오지급 회수');
  const [detail, setDetail] = useState('');
  const [timing, setTiming] = useState<'즉시' | '지정'>('즉시');
  const [confirmAt, setConfirmAt] = useState(TODAY);
  const [error, setError] = useState('');

  // 모드 전환 시 에러/상세 초기화
  function switchMode(m: BulkMode) {
    setMode(m);
    setError('');
    setDetail('');
    setAmount('1000');
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  function submit() {
    const amt = Math.max(0, Number(amount) || 0);
    if (amt <= 0) return setError(`${mode === 'grant' ? '지급' : '차감'}할 포인트를 입력해 주세요.`);
    if (!detail.trim()) return setError('상세 사유를 입력해 주세요.');

    if (mode === 'deduct') {
      const minAvailable = Math.min(...members.map((m) => m.available));
      if (amt > minAvailable) {
        return setError(`일부 회원의 사용 가능 포인트보다 많이 차감할 수 없습니다.`);
      }
    }

    setError('');
    if (mode === 'grant') {
      onSubmit({
        mode,
        amount: amt,
        reason: grantReason,
        detail: detail.trim(),
        immediate: timing === '즉시',
        confirmAt: timing === '지정' ? confirmAt : null,
      });
    } else {
      onSubmit({
        mode,
        amount: amt,
        reason: deductReason,
        detail: detail.trim(),
      });
    }
  }

  const totalAmount = Math.max(0, Number(amount) || 0) * members.length;
  const isGrant = mode === 'grant';

  const modal = (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.modal} style={{ width: 480 }} role="dialog" aria-modal="true" aria-label="포인트 관리">
        {/* 헤더 */}
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>포인트 / 적립금 관리 · 보유 현황</div>
            <div className={styles.title}>포인트 관리</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="닫기">×</button>
        </div>

        {/* 지급 / 차감 탭 */}
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${isGrant ? styles.modeTabActive : ''}`}
            aria-pressed={isGrant}
            onClick={() => switchMode('grant')}
          >
            포인트 지급
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${!isGrant ? styles.modeTabDeductActive : ''}`}
            aria-pressed={!isGrant}
            onClick={() => switchMode('deduct')}
          >
            포인트 차감
          </button>
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {/* 대상 회원 목록 */}
          <div>
            <div className={bulkStyles.sectionLabel}>
              {isGrant ? '지급' : '차감'} 대상&nbsp;
              <span className={`${bulkStyles.countBadge} ${!isGrant ? bulkStyles.countBadgeDeduct : ''}`}>
                {members.length}명
              </span>
            </div>
            <div className={bulkStyles.memberList}>
              {members.map((m) => (
                <div key={m.member} className={bulkStyles.memberRow}>
                  <span className={bulkStyles.memberName}>{m.member}</span>
                  <span className={bulkStyles.memberBalance}>보유 {fmtPoint(m.available)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 포인트 입력 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>1인당 {isGrant ? '지급' : '차감'} 포인트 *</label>
            <input
              className={styles.formInput}
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
            {Number(amount) > 0 && members.length > 1 && (
              <div className={bulkStyles.totalHint}>
                총 {isGrant ? '지급량' : '차감량'}:&nbsp;
                <strong style={{ color: isGrant ? '#059669' : '#dc2626' }}>
                  {fmtPoint(totalAmount)}
                </strong>
                &nbsp;({members.length}명 × {fmtPoint(Number(amount))})
              </div>
            )}
          </div>

          {/* 사유 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>{isGrant ? '지급' : '차감'} 사유 *</label>
            {isGrant ? (
              <select className={styles.formSelect} value={grantReason} onChange={(e) => setGrantReason(e.target.value as GrantReason)}>
                {GRANT_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            ) : (
              <select className={styles.formSelect} value={deductReason} onChange={(e) => setDeductReason(e.target.value as DeductReason)}>
                {DEDUCT_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            )}
          </div>

          {/* 상세 사유 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>상세 사유 *</label>
            <input
              className={styles.formInput}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="상세 사유를 입력하세요"
            />
          </div>

          {/* 사용 가능 시점 (지급 전용) */}
          {isGrant && (
            <>
              <div className={styles.sectionTitle}>사용 가능 시점</div>
              <div className={styles.radioRow}>
                <label className={styles.radioOption}>
                  <input type="radio" checked={timing === '즉시'} onChange={() => setTiming('즉시')} /> 즉시
                </label>
                <label className={styles.radioOption}>
                  <input type="radio" checked={timing === '지정'} onChange={() => setTiming('지정')} /> 날짜 지정
                </label>
              </div>
              {timing === '지정' && (
                <div className={styles.formGroup}>
                  <input type="date" className={styles.formInput} value={confirmAt} onChange={(e) => setConfirmAt(e.target.value)} />
                </div>
              )}
            </>
          )}

          {/* 차감 안내 */}
          {!isGrant && (
            <div className={styles.notice}>
              사용 가능한 포인트보다 많이 차감할 수 없습니다. 마이너스 잔액은 허용되지 않습니다.
            </div>
          )}

          {/* 에러 */}
          {error && <div className={styles.error}>{error}</div>}
        </div>

        {/* 푸터 */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button
            type="button"
            className={isGrant ? styles.confirmBtn : styles.deductConfirmBtn}
            onClick={submit}
          >
            {members.length}명 {isGrant ? '지급' : '차감'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
