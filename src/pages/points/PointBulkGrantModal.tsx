import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { GRANT_REASONS, TODAY, fmtPoint, type GrantReason, type MemberPointBalance } from './pointsData';
import styles from './PointGrantModal.module.css';
import bulkStyles from './PointBulkGrantModal.module.css';

export interface BulkGrantFormData {
  amount: number;
  reason: GrantReason;
  detail: string;
  immediate: boolean;
  confirmAt: string | null;
}

interface Props {
  members: MemberPointBalance[];   // 선택된 회원 목록
  onCancel: () => void;
  onSubmit: (form: BulkGrantFormData) => void;
}

export function PointBulkGrantModal({ members, onCancel, onSubmit }: Props) {
  const [amount, setAmount] = useState('1000');
  const [reason, setReason] = useState<GrantReason>('CS 보상');
  const [detail, setDetail] = useState('');
  const [timing, setTiming] = useState<'즉시' | '지정'>('즉시');
  const [confirmAt, setConfirmAt] = useState(TODAY);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  function submit() {
    const amt = Math.max(0, Number(amount) || 0);
    if (amt <= 0) return setError('지급할 포인트를 입력해 주세요.');
    if (!detail.trim()) return setError('상세 사유를 입력해 주세요.');
    setError('');
    onSubmit({
      amount: amt,
      reason,
      detail: detail.trim(),
      immediate: timing === '즉시',
      confirmAt: timing === '지정' ? confirmAt : null,
    });
  }

  const totalAmount = Math.max(0, Number(amount) || 0) * members.length;

  const modal = (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.modal} style={{ width: 480 }} role="dialog" aria-modal="true" aria-label="포인트 일괄 지급">
        {/* 헤더 */}
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>포인트 / 적립금 관리 · 보유 현황</div>
            <div className={styles.title}>포인트 일괄 지급</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="닫기">×</button>
        </div>

        {/* 본문 */}
        <div className={styles.body}>
          {/* 선택된 회원 목록 */}
          <div>
            <div className={bulkStyles.sectionLabel}>
              지급 대상 <span className={bulkStyles.countBadge}>{members.length}명</span>
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

          {/* 지급 포인트 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>1인당 지급 포인트 *</label>
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
                총 지급량: <strong>{fmtPoint(totalAmount)}</strong> ({members.length}명 × {fmtPoint(Number(amount))})
              </div>
            )}
          </div>

          {/* 지급 사유 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>지급 사유 *</label>
            <select
              className={styles.formSelect}
              value={reason}
              onChange={(e) => setReason(e.target.value as GrantReason)}
            >
              {GRANT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
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

          {/* 사용 가능 시점 */}
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

          {/* 에러 */}
          {error && <div className={styles.error}>{error}</div>}
        </div>

        {/* 푸터 */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button type="button" className={styles.confirmBtn} onClick={submit}>
            {members.length}명에게 지급
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
