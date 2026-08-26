import { useRef, useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './JejuRemotePolicyPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  REGION_KINDS,
  effectiveExtraFee,
  fmtWon,
  type BasePolicy,
  type DeliverableStatus,
  type PolicySource,
  type RegionKind,
  type SpecialRegion,
} from './jejuRemotePolicyData';

type Tab = 'basic' | 'policy' | 'memo' | 'history';

interface Props {
  region: SpecialRegion;
  basePolicy: BasePolicy;
  isNew: boolean;
  startEditing?: boolean;
  issues: string[];
  onClose: () => void;
  onSave: (item: SpecialRegion) => void;
  onToggleStatus: (item: SpecialRegion) => void;
  onAddMemo: (text: string) => void;
}

export function JejuRegionDrawer({ region, basePolicy, isNew, startEditing = false, issues, onClose, onSave, onToggleStatus, onAddMemo }: Props) {
  const [draft, setDraft] = useState(region);
  const [editing, setEditing] = useState(isNew || startEditing);
  const [tab, setTab] = useState<Tab>('basic');
  const [error, setError] = useState('');
  const [postalInput, setPostalInput] = useState('');
  const [memoText, setMemoText] = useState('');

  const set = <K extends keyof SpecialRegion>(key: K, value: SpecialRegion[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const addPostal = () => {
    const code = postalInput.trim();
    if (!code) return;
    if (!draft.postalCodes.includes(code)) set('postalCodes', [...draft.postalCodes, code]);
    setPostalInput('');
  };
  const removePostal = (code: string) => set('postalCodes', draft.postalCodes.filter((c) => c !== code));

  const save = () => {
    if (!draft.name.trim()) return setError('지역명을 입력해 주세요.');
    if (draft.postalCodes.length === 0) return setError('우편번호를 1개 이상 등록해 주세요.');
    if (draft.policySource === '지역 예외' && (draft.extraFeeOverride == null || draft.extraFeeOverride < 0)) return setError('지역 예외 추가 배송비를 입력해 주세요.');
    setError('');
    onSave({ ...draft, name: draft.name.trim() });
    setEditing(false);
  };

  const fee = effectiveExtraFee(draft, basePolicy);

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={`${drawer.aside} ${styles.feeDrawer}`} aria-label="특수지역 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{draft.id}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{draft.name || (isNew ? '새 특수지역' : draft.id)}</h2>
              <span className={drawer.badge} style={{ background: draft.status === '사용' ? '#ecfdf5' : '#f4f4f5', color: draft.status === '사용' ? '#047857' : '#71717a' }}>{draft.status}</span>
              <span className={drawer.badge} style={{ background: draft.deliverable === '가능' ? '#eff6ff' : '#fef2f2', color: draft.deliverable === '가능' ? '#2563eb' : '#dc2626' }}>{draft.deliverable === '가능' ? '배송 가능' : '배송 불가'}</span>
              {issues.length > 0 && <span className={drawer.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 설정 확인</span>}
            </div>
            <div className={drawer.sub}>{draft.kind} · 우편번호 {draft.postalCodes.length}건 · 추가배송비 +{fmtWon(fee)}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={drawer.actionRow}>
          <button type="button" className={drawer.actionLink} onClick={() => setEditing((current) => !current)}>{editing ? '수정 취소' : '수정'}</button>
          {!isNew && <button type="button" className={drawer.actionLink} onClick={() => onToggleStatus(region)}>{region.status === '사용' ? '비활성화' : '활성화'}</button>}
        </div>
        <div className={drawer.tabs}>
          {([['basic', '기본 정보'], ['policy', '배송 정책'], ['memo', '관리자 메모'], ['history', '변경 이력']] as [Tab, string][]).map(([key, label]) => (
            <button key={key} type="button" className={`${drawer.tabBtn} ${tab === key ? drawer.tabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className={drawer.scroll}>
        {tab === 'basic' && (
          <>
            {issues.length > 0 && (
              <div className={styles.errorBanner}>
                <strong>설정 확인 필요</strong>
                {issues.map((item) => <span key={item}>⚠ {item}</span>)}
              </div>
            )}
            <section className={styles.formSection}>
              <h3>기본 정보</h3>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>지역명 *</span>
                  <input disabled={!editing} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 지역01" />
                </label>
                <label className={styles.formField}>
                  <span>지역 유형 *</span>
                  <select disabled={!editing} value={draft.kind} onChange={(e) => set('kind', e.target.value as RegionKind)}>
                    {REGION_KINDS.map((k) => <option key={k}>{k}</option>)}
                  </select>
                </label>
              </div>
              <label className={styles.formField}>
                <span>상태</span>
                <div className={styles.radioGroup}>
                  <label><input type="radio" disabled={!editing} checked={draft.status === '사용'} onChange={() => set('status', '사용')} />사용</label>
                  <label><input type="radio" disabled={!editing} checked={draft.status === '비활성'} onChange={() => set('status', '비활성')} />비활성</label>
                </div>
              </label>
            </section>
            <section className={styles.formSection}>
              <h3>우편번호 (지역 판정 기준)</h3>
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
              <div className={styles.infoNote}>주문 배송지 우편번호가 여기 등록된 번호와 일치하면 이 지역 정책이 적용됩니다.</div>
            </section>
          </>
        )}

        {tab === 'policy' && (
          <>
            <section className={styles.formSection}>
              <h3>배송 가능 여부</h3>
              <div className={styles.radioGroup}>
                {(['가능', '불가'] as DeliverableStatus[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.deliverable === v} onChange={() => set('deliverable', v)} />{v}</label>
                ))}
              </div>
              <div className={styles.infoNote}>배송 불가로 설정하면 추가 배송비와 관계없이 이 지역으로는 주문을 진행할 수 없습니다.</div>
            </section>
            <section className={styles.formSection}>
              <h3>적용 정책</h3>
              <div className={styles.radioGroup}>
                {(['기본 정책', '지역 예외'] as PolicySource[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.policySource === v} onChange={() => set('policySource', v)} />{v}</label>
                ))}
              </div>
              {draft.policySource === '기본 정책' ? (
                <div className={styles.infoNote}>{draft.kind === '제주' ? '제주' : '도서산간'} 기본 정책의 추가 배송비(+{fmtWon(draft.kind === '제주' ? basePolicy.jejuExtraFee : basePolicy.remoteExtraFee)})를 그대로 상속합니다.</div>
              ) : (
                <label className={styles.formField}>
                  <span>지역 예외 추가 배송비 * (원)</span>
                  <input type="number" min={0} disabled={!editing} value={draft.extraFeeOverride ?? ''} onChange={(e) => set('extraFeeOverride', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} />
                </label>
              )}
              <div className={styles.resultRow}><span>현재 적용 추가 배송비</span><strong>+{fmtWon(fee)}</strong></div>
            </section>
          </>
        )}

        {tab === 'memo' && (
          <>
            <div className={drawer.memoInputRow}>
              <input className={drawer.memoInput} value={memoText} onChange={(e) => setMemoText(e.target.value)} placeholder="관리자 메모 입력" />
              <button type="button" className={drawer.memoSubmit} onClick={() => { if (memoText.trim()) { onAddMemo(memoText.trim()); setMemoText(''); } }}>등록</button>
            </div>
            {region.memos.length === 0 ? (
              <div className={drawer.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              region.memos.slice().reverse().map((m) => (
                <div key={m.id} className={drawer.memoItem}>
                  <div className={drawer.memoWhen}>{m.at} · {m.by}</div>
                  <div className={drawer.memoText}>{m.text}</div>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'history' && (
          region.history.length === 0 ? (
            <div className={drawer.emptyInline}>변경 이력이 없습니다.</div>
          ) : (
            region.history.slice().reverse().map((h) => (
              <div key={h.id} className={drawer.timelineItem}>
                <span className={drawer.timelineDot} />
                <div className={drawer.timelineBody}>
                  <div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{h.action}</strong><span className={drawer.timelineWhen}>{h.at}</span></div>
                  <div className={drawer.timelineDetail}>{h.by}{h.before && h.after ? ` · ${h.before} → ${h.after}` : h.after ? ` · ${h.after}` : ''}</div>
                </div>
              </div>
            ))
          )
        )}
        {error && <div className={styles.formError}>{error}</div>}
      </div>

      {editing && (
        <div className={drawer.footer}>
          <button type="button" className={styles.cancelButton} onClick={isNew ? onClose : () => { setDraft(region); setEditing(false); setError(''); }}>취소</button>
          <button type="button" className={styles.primaryButton} onClick={save}>저장</button>
        </div>
      )}
    </aside>
  );
}
