import { useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './RegionalShippingFeePage.module.css';
import {
  DELIVERY_METHODS,
  SIDO_OPTIONS,
  computeStatus,
  fmtWon,
  type DeliveryMethod,
  type FreeShippingTreatment,
  type RegionalFeePolicy,
  type RegionType,
} from './regionalShippingFeeData';

type Tab = 'basic' | 'region' | 'fee' | 'history';

interface Props {
  initial: RegionalFeePolicy;
  isNew: boolean;
  startEditing?: boolean;
  issues: string[];
  onClose: () => void;
  onSave: (item: RegionalFeePolicy) => void;
  onToggleActive: (item: RegionalFeePolicy) => void;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  '적용중': { bg: '#ecfdf5', fg: '#047857' },
  '적용 예정': { bg: '#eff6ff', fg: '#1d4ed8' },
  '종료': { bg: '#f4f4f5', fg: '#71717a' },
  '비활성': { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export function RegionalFeeDrawer({ initial, isNew, startEditing = false, issues, onClose, onSave, onToggleActive }: Props) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(isNew || startEditing);
  const [tab, setTab] = useState<Tab>('basic');
  const [error, setError] = useState('');
  const [postalInput, setPostalInput] = useState('');
  const set = <K extends keyof RegionalFeePolicy>(key: K, value: RegionalFeePolicy[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const status = computeStatus(draft);
  const statusColor = STATUS_COLOR[status];

  const addPostal = () => {
    const code = postalInput.trim();
    if (!code) return;
    if (!draft.postalCodes.includes(code)) set('postalCodes', [...draft.postalCodes, code]);
    setPostalInput('');
  };
  const removePostal = (code: string) => set('postalCodes', draft.postalCodes.filter((c) => c !== code));

  const save = () => {
    if (!draft.name.trim() || !draft.code.trim()) return setError('정책명과 정책 코드는 필수입니다.');
    if (draft.regionType === '행정구역' && !draft.sido) return setError('시/도를 선택해 주세요.');
    if (draft.regionType === '우편번호' && draft.postalCodes.length === 0) return setError('우편번호를 1개 이상 등록해 주세요.');
    if (draft.extraFee < 0) return setError('추가 배송비는 0원 이상이어야 합니다.');
    if (draft.endDate && draft.endDate < draft.startDate) return setError('적용 종료일은 시작일보다 빠를 수 없습니다.');
    onSave({ ...draft, name: draft.name.trim(), code: draft.code.trim().toUpperCase().replace(/\s+/g, '_') });
  };

  return (
    <aside className={`${drawer.aside} ${styles.feeDrawer}`} aria-label="지역별 추가 배송비 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{isNew ? '신규 지역 추가배송비' : draft.code}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{isNew ? '지역 추가배송비 등록' : draft.name}</h2>
              {!isNew && <span className={drawer.badge} style={{ background: statusColor.bg, color: statusColor.fg }}>{status}</span>}
              {!isNew && issues.length > 0 && <span className={drawer.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 설정 확인</span>}
            </div>
            {!isNew && <div className={drawer.sub}>+{fmtWon(draft.extraFee)} · 사용 {draft.usageCount.toLocaleString()}건 · 최근 수정 {draft.updatedAt} · {draft.updatedBy}</div>}
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
          {([['basic', '기본 정보'], ['region', '지역 조건'], ['fee', '배송비 조건'], ['history', '변경 이력']] as [Tab, string][]).map(([key, label]) => (
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
                <input disabled={!editing} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 제주 지역 추가배송비" />
              </label>
              <label className={styles.formField}>
                <span>정책 코드 *</span><small>{!isNew ? '생성 후 변경할 수 없습니다.' : '영문 대문자와 밑줄 사용'}</small>
                <input disabled={!editing || !isNew} value={draft.code} onChange={(e) => set('code', e.target.value)} placeholder="JEJU_SURCHARGE" />
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
                  <input type="date" disabled={!editing} value={draft.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>적용 종료일</span><small>비워두면 상시 적용</small>
                  <input type="date" disabled={!editing} value={draft.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || null)} />
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

        {tab === 'region' && (
          <section className={styles.formSection}>
            <h3>지역 지정</h3>
            <label className={styles.formField}>
              <span>지역 지정 방식 *</span>
              <div className={styles.radioGroup}>
                {(['행정구역', '우편번호'] as RegionType[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.regionType === v} onChange={() => set('regionType', v)} />{v}</label>
                ))}
              </div>
            </label>
            {draft.regionType === '행정구역' ? (
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>시/도 *</span>
                  <select disabled={!editing} value={draft.sido} onChange={(e) => set('sido', e.target.value)}>
                    {SIDO_OPTIONS.map((v) => <option key={v}>{v}</option>)}
                  </select>
                </label>
                <label className={styles.formField}>
                  <span>시/군/구</span>
                  <input disabled={!editing} value={draft.sigungu} onChange={(e) => set('sigungu', e.target.value)} placeholder="전체 (비워두면 전체)" />
                </label>
              </div>
            ) : (
              <label className={styles.formField}>
                <span>우편번호 목록 *</span>
                <div className={styles.postalTags}>
                  {draft.postalCodes.map((code) => (
                    <span key={code} className={styles.postalTag}>{code}{editing && <button type="button" onClick={() => removePostal(code)}>✕</button>}</span>
                  ))}
                  {draft.postalCodes.length === 0 && <span style={{ color: '#a1a1aa', fontSize: 11.5 }}>등록된 우편번호가 없습니다.</span>}
                </div>
                {editing && (
                  <div className={styles.postalAddRow}>
                    <input value={postalInput} onChange={(e) => setPostalInput(e.target.value)} placeholder="우편번호 입력 후 추가" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPostal())} />
                    <button type="button" className={styles.smallBtn} onClick={addPostal}>추가</button>
                  </div>
                )}
              </label>
            )}
            <div className={styles.infoNote}>동일 시/도라도 시/군/구를 지정한 정책, 우편번호로 지정한 정책이 함께 매칭되면 더 구체적인 지역 조건(우편번호 &gt; 시/군/구 &gt; 시/도)이 우선 적용됩니다.</div>
          </section>
        )}

        {tab === 'fee' && (
          <section className={styles.formSection}>
            <h3>추가 배송비</h3>
            <label className={styles.formField}>
              <span>추가 배송비 * (원)</span>
              <input type="number" min={0} disabled={!editing} value={draft.extraFee} onChange={(e) => set('extraFee', Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <label className={styles.formField}>
              <span>적용 배송방법</span>
              <div className={styles.radioGroup}>
                {DELIVERY_METHODS.map((v: DeliveryMethod) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.deliveryMethod === v} onChange={() => set('deliveryMethod', v)} />{v}</label>
                ))}
              </div>
            </label>
            <label className={styles.formField}>
              <span>무료배송 주문</span>
              <div className={styles.radioGroup}>
                {(['지역 추가비 부과', '지역 추가비 면제'] as FreeShippingTreatment[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.freeShippingTreatment === v} onChange={() => set('freeShippingTreatment', v)} />{v}</label>
                ))}
              </div>
            </label>
            <div className={styles.infoNote}>기본 배송비 무료배송 조건은 <b>배송 정책 &gt; 기본 배송비</b>에서 관리합니다. 이 설정은 무료배송이 적용된 주문에서 이 지역 추가비까지 함께 면제할지만 결정합니다.</div>
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
