import { useState } from 'react';
import styles from './MemberModals.module.css';
import { RED } from '../../lib/theme';
import type { BusinessMode } from './modeConfig';

interface StatusModalProps {
  mode: BusinessMode;
  memberName: string;
  currentStatus: string;
  onCancel: () => void;
  onSubmit: (to: string, reason: string, detail: string) => void;
}

const REASONS = ['이용약관 위반', '이상 거래 감지', '회원 요청', '관리자 판단', '기타'];

export function MemberStatusModal({ mode, memberName, currentStatus, onCancel, onSubmit }: StatusModalProps) {
  const choices = mode === 'B2B' ? ['정상', '승인대기', '사용중지'] : ['정상', '휴면', '정지'];
  const [to, setTo] = useState(choices.find((c) => c !== currentStatus) ?? choices[0]);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');

  function submit() {
    if (!detail.trim()) return setError('상세 사유를 입력해 주세요.');
    onSubmit(to, reason, detail.trim());
  }

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.box}>
        <div className={styles.title}>{mode === 'B2B' ? '계정 상태 변경' : '회원 상태 변경'}</div>
        <div className={styles.sub}>{memberName} · 현재 {currentStatus}</div>

        <div className={styles.body}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>변경할 상태 *</span>
            <div className={styles.choiceRow}>
              {choices.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={styles.choiceBtn}
                  style={to === c ? { borderColor: 'var(--accent)', background: 'var(--accent)', color: '#fff', fontWeight: 600 } : undefined}
                  onClick={() => setTo(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>사유 *</span>
            <select className={styles.select} value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>상세 사유 *</span>
            <textarea className={styles.textarea} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="변경 사유를 구체적으로 입력하세요" />
          </div>

          <div className={styles.warnBox}>
            <div className={styles.warnBoxBody}>변경 즉시 대상에게 알림이 발송되며, 처리 내역은 변경 이력에 기록됩니다.</div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button type="button" className={styles.applyBtn} style={{ background: RED }} onClick={submit}>상태 변경</button>
        </div>
      </div>
    </div>
  );
}

interface ExportModalProps {
  mode: BusinessMode;
  count: number;
  onCancel: () => void;
  onSubmit: () => void;
}

export function MemberExportModal({ mode, count, onCancel, onSubmit }: ExportModalProps) {
  const base = ['회원번호', '회원명', '이메일', '휴대폰', '상태', '가입일', '최근 접속'];
  const extra = mode === 'B2C'
    ? ['등급', '그룹', '주문수', '누적 구매금액']
    : mode === 'C2C'
      ? ['이용 역할', '판매자 상태', '거래 수', '신고/분쟁']
      : ['소속 회사', '사업장', '부서', '직책', '역할', '승인 상태'];
  const all = base.concat(extra);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    all.forEach((k, i) => { init[k] = i < 3 || (i > 3 && i < 7); });
    return init;
  });

  function toggle(k: string) {
    setChecked((prev) => ({ ...prev, [k]: !prev[k] }));
  }

  const checkedCount = all.filter((k) => checked[k]).length;

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.box}>
        <div className={styles.title}>내보내기</div>
        <div className={styles.sub}>조건에 맞는 {count}{mode === 'B2B' ? '개 계정' : '명'}을 CSV·Excel로 내려받습니다</div>

        <div className={styles.body}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>포함할 컬럼</span>
            <div className={styles.colGrid}>
              {all.map((k) => (
                <label key={k} className={styles.colCheck}>
                  <input type="checkbox" checked={!!checked[k]} onChange={() => toggle(k)} />
                  {k}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button type="button" className={styles.applyBtn} style={{ background: 'var(--accent)' }} disabled={checkedCount === 0} onClick={onSubmit}>
            {checkedCount}개 컬럼 내보내기
          </button>
        </div>
      </div>
    </div>
  );
}
