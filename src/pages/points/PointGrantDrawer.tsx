import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { DEDUCT_REASONS, GRANT_REASONS, TODAY, fmtPoint, type DeductReason, type GrantReason, type MemberPointBalance } from './pointsData';
import modalStyles from './PointGrantModal.module.css';

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

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

  const modal = (
    <div className={modalStyles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={modalStyles.modal} role="dialog" aria-modal="true" aria-label={mode === 'grant' ? '포인트 지급' : '포인트 차감'} ref={dialogRef}>
        {/* 헤더 */}
        <div className={modalStyles.header}>
          <div>
            <div className={modalStyles.eyebrow}>포인트 / 적립금 관리 · 보유 현황</div>
            <div className={modalStyles.title}>{mode === 'grant' ? '포인트 지급' : '포인트 차감'}</div>
          </div>
          <button type="button" className={modalStyles.closeBtn} onClick={onCancel} aria-label="닫기">×</button>
        </div>

        {/* 본문 */}
        <div className={modalStyles.body}>
          {/* 회원 정보 */}
          <div className={modalStyles.infoBox}>
            <div className={modalStyles.infoRow}>
              <span className={modalStyles.infoLabel}>회원</span>
              <span className={modalStyles.infoValue}>{b.member}</span>
            </div>
            <div className={modalStyles.infoRow}>
              <span className={modalStyles.infoLabel}>현재 사용 가능</span>
              <span className={modalStyles.infoValue} style={{ fontWeight: 700, color: b.available < 0 ? '#dc2626' : undefined }}>
                {fmtPoint(b.available)}
              </span>
            </div>
          </div>

          {/* 포인트 입력 */}
          <div className={modalStyles.formGroup}>
            <label className={modalStyles.formLabel}>{mode === 'grant' ? '지급' : '차감'} 포인트 *</label>
            <input
              className={modalStyles.formInput}
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* 사유 선택 */}
          <div className={modalStyles.formGroup}>
            <label className={modalStyles.formLabel}>{mode === 'grant' ? '지급' : '차감'} 사유 *</label>
            {mode === 'grant' ? (
              <select className={modalStyles.formSelect} value={grantReason} onChange={(e) => setGrantReason(e.target.value as GrantReason)}>
                {GRANT_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            ) : (
              <select className={modalStyles.formSelect} value={deductReason} onChange={(e) => setDeductReason(e.target.value as DeductReason)}>
                {DEDUCT_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            )}
          </div>

          {/* 상세 사유 */}
          <div className={modalStyles.formGroup}>
            <label className={modalStyles.formLabel}>상세 사유 *</label>
            <input
              className={modalStyles.formInput}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="상세 사유를 입력하세요"
            />
          </div>

          {/* 지급 시점 (지급 모드만) */}
          {mode === 'grant' && (
            <>
              <div className={modalStyles.sectionTitle}>사용 가능 시점</div>
              <div className={modalStyles.radioRow}>
                <label className={modalStyles.radioOption}>
                  <input type="radio" checked={timing === '즉시'} onChange={() => setTiming('즉시')} /> 즉시
                </label>
                <label className={modalStyles.radioOption}>
                  <input type="radio" checked={timing === '지정'} onChange={() => setTiming('지정')} /> 날짜 지정
                </label>
              </div>
              {timing === '지정' && (
                <div className={modalStyles.formGroup}>
                  <input type="date" className={modalStyles.formInput} value={confirmAt} onChange={(e) => setConfirmAt(e.target.value)} />
                </div>
              )}
            </>
          )}

          {/* 차감 시 안내 */}
          {mode === 'deduct' && (
            <div className={modalStyles.notice}>
              사용 가능한 포인트보다 많이 차감할 수 없습니다. 마이너스 잔액은 허용되지 않습니다.
            </div>
          )}

          {/* 에러 */}
          {error && <div className={modalStyles.error}>{error}</div>}
        </div>

        {/* 푸터 */}
        <div className={modalStyles.footer}>
          <button type="button" className={modalStyles.cancelBtn} onClick={onCancel}>취소</button>
          <button type="button" className={modalStyles.confirmBtn} onClick={submit}>
            {mode === 'grant' ? '지급' : '차감'}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
