import { DatePicker } from '../../components/forms/DatePicker';
import { useRef, useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './FreeShippingConditionPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  COMPARISON_BASES,
  DELIVERY_METHODS,
  computeStatus,
  fmtWon,
  type Compare,
  type ComparisonBasis,
  type ExemptionScope,
  type FreeShippingPolicy,
  type RegionalFeeTreatment,
} from './freeShippingConditionData';

type Tab = 'basic' | 'condition' | 'scope' | 'history';

interface Props {
  initial: FreeShippingPolicy;
  isNew: boolean;
  startEditing?: boolean;
  issues: string[];
  onClose: () => void;
  onSave: (item: FreeShippingPolicy) => void;
  onToggleActive: (item: FreeShippingPolicy) => void;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  '적용중': { bg: '#ecfdf5', fg: '#047857' },
  '적용 예정': { bg: '#eff6ff', fg: '#1d4ed8' },
  '종료': { bg: '#f4f4f5', fg: '#71717a' },
  '비활성': { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export function FreeShippingConditionDrawer({ initial, isNew, startEditing = false, issues, onClose, onSave, onToggleActive }: Props) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(isNew || startEditing);
  const [tab, setTab] = useState<Tab>('basic');
  const [error, setError] = useState('');
  const set = <K extends keyof FreeShippingPolicy>(key: K, value: FreeShippingPolicy[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const status = computeStatus(draft);
  const statusColor = STATUS_COLOR[status];

  const save = () => {
    if (!draft.name.trim() || !draft.code.trim()) return setError('정책명과 정책 코드는 필수입니다.');
    if (draft.threshold <= 0) return setError('무료배송 기준금액은 0원보다 커야 합니다.');
    if (draft.endDate && draft.endDate < draft.startDate) return setError('적용 종료일은 시작일보다 빠를 수 없습니다.');
    onSave({ ...draft, name: draft.name.trim(), code: draft.code.trim().toUpperCase().replace(/\s+/g, '_') });
  };

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={`${drawer.aside} ${styles.feeDrawer}`} aria-label="무료 배송 조건 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{isNew ? '신규 무료배송 조건' : draft.code}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{isNew ? '무료배송 조건 등록' : draft.name}</h2>
              {!isNew && <span className={drawer.badge} style={{ background: statusColor.bg, color: statusColor.fg }}>{status}</span>}
              {!isNew && issues.length > 0 && <span className={drawer.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 설정 확인</span>}
            </div>
            {!isNew && <div className={drawer.sub}>{fmtWon(draft.threshold)} {draft.compare} · 사용 {draft.usageCount.toLocaleString()}건 · 최근 수정 {draft.updatedAt} · {draft.updatedBy}</div>}
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
        </div>
        {!isNew && (
          <div className={drawer.actionRow}>
            <button type="button" className={drawer.actionLink} onClick={() => setEditing((current) => !current)}>{editing ? '수정 취소' : '수정'}</button>
            <span className={drawer.spacer} />
            <button type="button" className={drawer.dangerBtn} onClick={() => onToggleActive(draft)}>{draft.active ? '비활성화' : '활성화'}</button>
          </div>
        )}
        <div className={drawer.tabs}>
          {([['basic', '기본 정보'], ['condition', '무료배송 조건'], ['scope', '면제 범위'], ['history', '변경 이력']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className={drawer.scroll}>
        {tab === 'basic' && (
          <>
            {!isNew && issues.length > 0 && (
              <div className={styles.errorBanner}>
                <strong>설정 확인 필요</strong>
                {issues.map((item) => <span key={item}>⚠ {item}</span>)}
              </div>
            )}
            <section className={styles.formSection}>
              <h3>기본 정보</h3>
              <label className={styles.formField}>
                <span>정책명 *</span>
                <input disabled={!editing} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 기본 무료배송" />
              </label>
              <label className={styles.formField}>
                <span>정책 코드 *</span><small>{!isNew ? '생성 후 변경할 수 없습니다.' : '영문 대문자와 밑줄 사용'}</small>
                <input disabled={!editing || !isNew} value={draft.code} onChange={(e) => set('code', e.target.value)} placeholder="DEFAULT_FREE_SHIPPING" />
              </label>
              <label className={styles.formField}>
                <span>설명</span>
                <textarea disabled={!editing} value={draft.description} onChange={(e) => set('description', e.target.value)} />
              </label>
            </section>
            <section className={styles.formSection}>
              <h3>적용 기간 · 우선순위</h3>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>적용 시작일 *</span>
                  <DatePicker disabled={!editing} value={draft.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>적용 종료일</span><small>비워두면 상시 적용</small>
                  <DatePicker disabled={!editing} value={draft.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || null)} />
                </label>
              </div>
              <label className={styles.formField}>
                <span>우선순위</span><small>숫자가 작을수록 우선 적용됩니다</small>
                <input type="number" min={1} disabled={!editing} value={draft.priority} onChange={(e) => set('priority', Math.max(1, Number(e.target.value) || 1))} />
              </label>
              <label className={styles.toggleField}>
                <span>정책 사용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draft.active ? styles.switchOn : ''}`} onClick={() => set('active', !draft.active)}><i /></button>
              </label>
            </section>
            <section className={styles.formSection}>
              <h3>관리자 메모</h3>
              <textarea disabled={!editing} value={draft.adminMemo} onChange={(e) => set('adminMemo', e.target.value)} placeholder="내부 참고 메모" />
            </section>
          </>
        )}

        {tab === 'condition' && (
          <section className={styles.formSection}>
            <h3>무료배송 조건</h3>
            <div className={styles.formGrid}>
              <label className={styles.formField}>
                <span>기준금액 * (원)</span>
                <input type="number" min={0} disabled={!editing} value={draft.threshold} onChange={(e) => set('threshold', Math.max(0, Number(e.target.value) || 0))} />
              </label>
              <label className={styles.formField}>
                <span>비교 방식</span>
                <div className={styles.radioGroup}>
                  {(['이상', '초과'] as Compare[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draft.compare === v} onChange={() => set('compare', v)} />{v}</label>
                  ))}
                </div>
              </label>
            </div>
            <label className={styles.formField}>
              <span>판정 기준금액 *</span>
              <div className={styles.radioGroup}>
                {(COMPARISON_BASES as ComparisonBasis[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.basis === v} onChange={() => set('basis', v)} />{v}</label>
                ))}
              </div>
            </label>
            <label className={styles.formField}>
              <span>적용 배송방법</span>
              <div className={styles.radioGroup}>
                {DELIVERY_METHODS.map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.deliveryMethod === v} onChange={() => set('deliveryMethod', v)} />{v}</label>
                ))}
              </div>
            </label>
            <div className={styles.infoNote}>포인트 사용액은 '최종 결제대상 상품금액' 기준을 선택했을 때만 기준금액에서 차감됩니다. 할인 전/후 기준을 선택하면 포인트 사용 여부와 무관하게 계산됩니다.</div>
          </section>
        )}

        {tab === 'scope' && (
          <section className={styles.formSection}>
            <h3>면제 범위</h3>
            <label className={styles.formField}>
              <span>면제 대상 *</span>
              <div className={styles.radioGroup}>
                {(['기본 배송비', '전체 배송비'] as ExemptionScope[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.exemptionScope === v} onChange={() => set('exemptionScope', v)} />{v}</label>
                ))}
              </div>
            </label>
            <label className={styles.formField}>
              <span>지역 추가배송비</span>
              <div className={styles.radioGroup}>
                {(['별도 부과', '무료배송에 포함'] as RegionalFeeTreatment[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.regionalFeeTreatment === v} onChange={() => set('regionalFeeTreatment', v)} />{v}</label>
                ))}
              </div>
            </label>
            <div className={styles.infoNote}>여러 무료배송 정책이 동시에 조건을 충족하면 우선순위가 가장 높은(숫자가 작은) 정책 1개의 면제 범위만 적용됩니다. 혜택을 합산하지 않습니다.</div>
          </section>
        )}

        {tab === 'history' && (
          <>
            {draft.history.length ? draft.history.slice().reverse().map((item) => (
              <div key={item.id} className={drawer.timelineItem}>
                <span className={drawer.timelineDot} />
                <div className={drawer.timelineBody}>
                  <div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{item.action}</strong><span className={drawer.timelineWhen}>{item.at}</span></div>
                  <div className={drawer.timelineDetail}>{item.by}{item.before && item.after ? ` · ${item.before} → ${item.after}` : ''}</div>
                </div>
              </div>
            )) : <div className={styles.infoNote}>저장 후 변경 이력이 기록됩니다.</div>}
          </>
        )}
        {error && <div className={styles.formError}>{error}</div>}
      </div>

      {editing && (
        <div className={drawer.footer}>
          <button type="button" className={styles.cancelButton} onClick={isNew ? onClose : () => { setDraft(initial); setEditing(false); setError(''); }}>취소</button>
          <button type="button" className={styles.primaryButton} onClick={save}>저장</button>
        </div>
      )}
    </aside>
  );
}
