import { useMemo, useRef, useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { COUPONS, computeStatus as computeCouponStatus } from './couponsData';
import { validateIssue, type CouponIssue, type IssueMethod, type IssueReason } from './couponIssuesData';
import { ISSUE_REASONS } from './couponIssuesData';

export interface CouponIssueFormData {
  couponId: string;
  member: string;
  method: IssueMethod;
  reason: IssueReason;
  detail: string;
}

interface Props {
  existingHolders: CouponIssue[];
  onCancel: () => void;
  onSubmit: (form: CouponIssueFormData) => void;
}

export function CouponIssueFormDrawer({ existingHolders, onCancel, onSubmit }: Props) {
  const issuable = COUPONS.filter((c) => computeCouponStatus(c) === '발급중');

  const [couponId, setCouponId] = useState(issuable[0]?.id ?? '');
  const [member, setMember] = useState('');
  const [method, setMethod] = useState<IssueMethod>('관리자 발급');
  const [reason, setReason] = useState<IssueReason>('운영자 지급');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');

  const coupon = COUPONS.find((c) => c.id === couponId) ?? null;
  const validation = useMemo(() => {
    if (!coupon || !member.trim()) return null;
    return validateIssue(coupon, existingHolders, member.trim());
  }, [coupon, existingHolders, member]);

  function submit() {
    if (!coupon) return setError('발급할 쿠폰을 선택해 주세요.');
    if (!member.trim()) return setError('회원을 입력해 주세요.');
    const check = validateIssue(coupon, existingHolders, member.trim());
    if (!check.ok) return setError(check.reasons.join(' / '));

    setError('');
    onSubmit({ couponId: coupon.id, member: member.trim(), method, reason, detail: detail.trim() });
  }

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onCancel);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>쿠폰 관리 · 쿠폰 발급 관리</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>쿠폰 발급</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>쿠폰 *</label>
          <select className={styles.formSelect} value={couponId} onChange={(e) => setCouponId(e.target.value)}>
            {issuable.length === 0 && <option value="">발급중인 쿠폰이 없습니다</option>}
            {issuable.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>회원 *</label>
          <input className={styles.formInput} value={member} onChange={(e) => setMember(e.target.value)} placeholder="회원 ID를 입력하세요 (예: user01)" />
        </div>

        {validation && !validation.ok && (
          <div className={styles.editPanel} style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
            <div className={styles.editTitle} style={{ color: '#b91c1c' }}>발급할 수 없습니다</div>
            {validation.reasons.map((r) => (
              <div key={r} style={{ fontSize: 12, color: '#b91c1c', marginBottom: 4 }}>⚠ {r}</div>
            ))}
          </div>
        )}
        {validation && validation.ok && coupon && (
          <div className={styles.emptyInline} style={{ marginBottom: 12 }}>
            발급 가능합니다. (잔여 한도 {coupon.totalLimit > 0 ? `${(coupon.totalLimit - coupon.issuedCount).toLocaleString('ko-KR')}장` : '제한 없음'})
          </div>
        )}

        <div className={styles.sectionTitleLoose}>발급 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>발급 방식 *</label>
          <select className={styles.formSelect} value={method} onChange={(e) => setMethod(e.target.value as IssueMethod)}>
            <option value="관리자 발급">관리자 발급</option>
            <option value="자동 발급">자동 발급</option>
            <option value="회원 다운로드">회원 다운로드</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>발급 사유 *</label>
          <select className={styles.formSelect} value={reason} onChange={(e) => setReason(e.target.value as IssueReason)}>
            {ISSUE_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>상세 사유</label>
          <input className={styles.formInput} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="참고사항을 남겨보세요" />
        </div>

        {coupon && (
          <>
            <div className={styles.sectionTitleLoose}>유효기간</div>
            <div className={styles.emptyInline}>
              {coupon.validityType === '발급후N일' ? `쿠폰 기본 정책 사용 (발급 후 ${coupon.validityDays}일)` : `쿠폰 기본 정책 사용 (${coupon.validEnd ?? '-'}까지)`}
            </div>
          </>
        )}

        {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 12 }}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.editCancel} onClick={onCancel}>취소</button>
        <button type="button" className={styles.editConfirm} onClick={submit} disabled={!!validation && !validation.ok}>발급</button>
      </div>
    </aside>
  );
}
