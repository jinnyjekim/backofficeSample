import { useState, type ReactNode } from 'react';
import styles from './SanctionModal.module.css';
import type { BanMember } from '../../data/members';
import { ACCENT, RED } from '../../lib/theme';
import {
  addDaysISO,
  isoToDot,
  MODE_TITLE,
  SANCTION_REASONS,
  SANCTION_TYPES,
  todayISO,
  type SanctionMode,
  type SanctionReason,
  type SanctionType,
} from './sanctionOptions';

export interface SanctionSubmit {
  mode: SanctionMode;
  id?: number;
  name?: string;
  email?: string;
  type?: SanctionType;
  reason?: SanctionReason;
  detail?: string;
  start?: string;
  end?: string;
  memo: string;
}

interface Props {
  mode: SanctionMode;
  target: BanMember | null;
  onCancel: () => void;
  onSubmit: (result: SanctionSubmit) => void;
}

export function SanctionModal({ mode, target, onCancel, onSubmit }: Props) {
  const [memberId, setMemberId] = useState(target ? String(target.id) : '');
  const [name, setName] = useState(target?.name ?? '');
  const [email, setEmail] = useState(target?.email ?? '');
  const [type, setType] = useState<SanctionType>((mode === 'change' && target ? (target.type as SanctionType) : SANCTION_TYPES[0]));
  const [reason, setReason] = useState<SanctionReason>((mode === 'change' && target ? (target.reason as SanctionReason) : SANCTION_REASONS[0]));
  const [detail, setDetail] = useState(mode === 'change' ? target?.detail ?? '' : '');
  const [days, setDays] = useState(7);
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');

  const isSet = mode === 'add' || mode === 'change';
  const isRelease = mode === 'release';
  const hasPeriod = !isRelease && type !== '영구정지';
  const start = todayISO();
  const end = addDaysISO(start, days);
  const periodHint = type === '영구정지' ? '영구정지는 종료일이 없습니다' : '종료 시점에 상태가 자동으로 만료 처리됩니다';
  const memoLabel = isRelease ? '해제 사유 (필수)' : '관리자 메모';
  const warning = isRelease
    ? '해제해도 기존 제재 기록은 삭제되지 않고 "관리자 조기 해제"로 이력에 남습니다.'
    : '적용 즉시 회원에게 알림이 발송되며, 처리 내역은 감사 로그에 기록됩니다.';
  const applyLabel = isRelease ? '해제 적용' : mode === 'extend' ? '연장 적용' : '제재 적용';
  const applyBg = isRelease ? RED : ACCENT;
  const sub = target ? `#${target.id} · ${target.name} · 현재 ${target.type}` : '회원을 지정해 새 제재를 적용합니다';

  function submit() {
    if (mode === 'add') {
      if (!memberId.trim() || !name.trim()) return setError('대상 회원 정보를 입력해 주세요.');
      if (!detail.trim()) return setError('상세 사유를 입력해 주세요.');
    }
    if (mode === 'change' && !detail.trim()) return setError('상세 사유를 입력해 주세요.');
    if (isRelease && !memo.trim()) return setError('해제 사유를 입력해 주세요.');

    onSubmit({
      mode,
      id: mode === 'add' ? parseInt(memberId, 10) || Date.now() : undefined,
      name: mode === 'add' ? name.trim() : undefined,
      email: mode === 'add' ? email.trim() : undefined,
      type: isSet ? type : undefined,
      reason: isSet ? reason : undefined,
      detail: isSet ? detail.trim() : undefined,
      start: hasPeriod ? isoToDot(start) : undefined,
      end: hasPeriod ? isoToDot(end) : type === '영구정지' && isSet ? '—' : undefined,
      memo: memo.trim(),
    });
  }

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className={styles.box}>
        <div className={styles.title}>{MODE_TITLE[mode]}</div>
        <div className={styles.sub}>{sub}</div>

        <div className={styles.body}>
          {mode === 'add' && (
            <div className={styles.fieldRow3}>
              <Field label="회원번호 *">
                <input className={styles.input} value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="102384" />
              </Field>
              <Field label="이름 *">
                <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
              </Field>
              <Field label="이메일">
                <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ho***@naver.com" />
              </Field>
            </div>
          )}

          {isSet && (
            <div className={styles.fieldRow2}>
              <Field label="제재 유형 *">
                <select className={styles.select} value={type} onChange={(e) => setType(e.target.value as SanctionType)}>
                  {SANCTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="제재 사유 *">
                <select className={styles.select} value={reason} onChange={(e) => setReason(e.target.value as SanctionReason)}>
                  {SANCTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
            </div>
          )}

          {isSet && (
            <Field label="상세 사유 *">
              <textarea className={styles.textarea} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="구체적인 위반 내용을 입력하세요" />
            </Field>
          )}

          {hasPeriod && (
            <Field label="제재 기간">
              <div className={styles.periodRow}>
                <span className={styles.periodDate}>{isoToDot(start)}</span>
                <span className={styles.periodArrow}>→</span>
                <select className={styles.select} style={{ maxWidth: 120 }} value={days} onChange={(e) => setDays(parseInt(e.target.value, 10))}>
                  <option value={1}>1일 후</option>
                  <option value={3}>3일 후</option>
                  <option value={7}>7일 후</option>
                  <option value={14}>14일 후</option>
                  <option value={30}>30일 후</option>
                </select>
                <span className={styles.periodDate}>({isoToDot(end)})</span>
              </div>
              <div className={styles.hint}>{periodHint}</div>
            </Field>
          )}
          {isSet && type === '영구정지' && (
            <div className={styles.hint} style={{ marginTop: -4 }}>{periodHint}</div>
          )}

          <Field label={memoLabel}>
            <textarea className={styles.textarea} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder={isRelease ? '해제 사유를 입력하세요' : '내부 공유용 메모 (선택)'} />
          </Field>

          <div className={styles.warnBox}>
            <div className={styles.warnBoxBody}>{warning}</div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button type="button" className={styles.applyBtn} style={{ background: applyBg }} onClick={submit}>{applyLabel}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}
