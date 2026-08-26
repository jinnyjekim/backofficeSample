import { useRef, useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './BundleShippingPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  CALC_METHODS,
  DELIVERY_METHODS,
  PRODUCTS,
  WAREHOUSES,
  findOtherActiveGroupsContaining,
  productName,
  type BundleDeliveryMethod,
  type BundleGroup,
  type CalcMethod,
  type RegionalFeePolicyMode,
} from './bundleShippingData';

type Tab = 'basic' | 'fee' | 'products' | 'memo' | 'history';

interface Props {
  group: BundleGroup;
  allGroups: BundleGroup[];
  isNew: boolean;
  startEditing?: boolean;
  issues: string[];
  onClose: () => void;
  onSave: (item: BundleGroup) => void;
  onToggleStatus: (item: BundleGroup) => void;
  onDelete: (item: BundleGroup) => void;
  onAddMemo: (text: string) => void;
}

export function BundleGroupDrawer({ group, allGroups, isNew, startEditing = false, issues, onClose, onSave, onToggleStatus, onDelete, onAddMemo }: Props) {
  const [draft, setDraft] = useState(group);
  const [editing, setEditing] = useState(startEditing);
  const [tab, setTab] = useState<Tab>('basic');
  const [error, setError] = useState('');
  const [pickCode, setPickCode] = useState('');
  const [memoText, setMemoText] = useState('');

  const set = <K extends keyof BundleGroup>(key: K, value: BundleGroup[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const addProduct = () => {
    if (!pickCode || draft.productCodes.includes(pickCode)) return;
    set('productCodes', [...draft.productCodes, pickCode]);
    setPickCode('');
  };
  const removeProduct = (code: string) => set('productCodes', draft.productCodes.filter((c) => c !== code));

  const save = () => {
    if (!draft.name.trim()) return setError('그룹명을 입력해 주세요.');
    if (!draft.code.trim()) return setError('그룹코드를 입력해 주세요.');
    if (draft.calcMethod === '그룹당 고정 배송비' && draft.groupFee <= 0) return setError('그룹 배송비를 입력해 주세요.');
    if (draft.freeShippingEnabled && draft.freeShippingThreshold <= 0) return setError('무료배송 기준금액을 입력해 주세요.');
    if (draft.regionalFeePolicy === '별도 정책 설정' && draft.regionalFeeOverrideAmount < 0) return setError('지역 추가 배송비를 확인해 주세요.');
    if (draft.endDate && draft.endDate < draft.startDate) return setError('적용 종료일은 시작일보다 빠를 수 없습니다.');
    setError('');
    onSave(draft);
    setEditing(false);
  };

  const availableToAdd = PRODUCTS.filter((p) => !draft.productCodes.includes(p.code));
  const pickCrossWarning = pickCode ? findOtherActiveGroupsContaining(pickCode, allGroups, draft.id) : [];

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={`${drawer.aside} ${styles.feeDrawer}`} aria-label="묶음 배송 그룹 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{draft.code || '그룹코드 미입력'}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{draft.name || (isNew ? '새 묶음 배송 그룹' : draft.id)}</h2>
              <span className={drawer.badge} style={{ background: draft.status === '사용' ? '#ecfdf5' : '#f4f4f5', color: draft.status === '사용' ? '#047857' : '#71717a' }}>{draft.status}</span>
              {issues.length > 0 && <span className={drawer.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 설정 확인</span>}
            </div>
            <div className={drawer.sub}>연결 상품 {draft.productCodes.length}개 · 주문 적용 {group.orderUsageCount.toLocaleString()}건</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={drawer.actionRow}>
          <button type="button" className={drawer.actionLink} onClick={() => setEditing((current) => !current)}>{editing ? '수정 취소' : '수정'}</button>
          {!isNew && (
            <>
              <button type="button" className={drawer.actionLink} onClick={() => onToggleStatus(group)}>{group.status === '사용' ? '비활성화' : '활성화'}</button>
              {group.orderUsageCount === 0 && <button type="button" className={drawer.dangerBtn} onClick={() => onDelete(group)}>삭제</button>}
            </>
          )}
        </div>
        <div className={drawer.tabs}>
          {([['basic', '기본 정보'], ['fee', '배송비 계산'], ['products', '연결 상품'], ['memo', '관리자 메모'], ['history', '변경 이력']] as [Tab, string][]).map(([key, label]) => (
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
                  <span>그룹명 *</span>
                  <input disabled={!editing} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 일반 배송" />
                </label>
                <label className={styles.formField}>
                  <span>그룹코드 *</span>
                  <input disabled={!editing} value={draft.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="예: SHIPPING_NORMAL" />
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
              <h3>묶음 조건</h3>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>출고지 *</span>
                  <select disabled={!editing} value={draft.warehouse} onChange={(e) => set('warehouse', e.target.value)}>
                    {WAREHOUSES.map((w) => <option key={w}>{w}</option>)}
                  </select>
                </label>
                <label className={styles.formField}>
                  <span>배송 방식 *</span>
                  <select disabled={!editing} value={draft.deliveryMethod} onChange={(e) => set('deliveryMethod', e.target.value as BundleDeliveryMethod)}>
                    {DELIVERY_METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </label>
              </div>
              <div className={styles.infoNote}>같은 그룹에 속한 상품은 같은 출고지·배송 방식으로 함께 배송됩니다. 상품별 정책에서 묶음배송을 '불가'로 설정한 상품은 그룹에 포함되어도 항상 별도 배송으로 계산됩니다.</div>
            </section>
            <section className={styles.formSection}>
              <h3>적용기간</h3>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>적용 시작일 *</span>
                  <input type="date" disabled={!editing} value={draft.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </label>
                <label className={styles.formField}>
                  <span>적용 종료일</span><small>비워두면 상시</small>
                  <input type="date" disabled={!editing} value={draft.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || null)} />
                </label>
              </div>
            </section>
          </>
        )}

        {tab === 'fee' && (
          <>
            <section className={styles.formSection}>
              <h3>배송비 계산 방식</h3>
              <div className={styles.radioGroup}>
                {(CALC_METHODS as CalcMethod[]).map((m) => (
                  <label key={m}><input type="radio" disabled={!editing} checked={draft.calcMethod === m} onChange={() => set('calcMethod', m)} />{m}</label>
                ))}
              </div>
              {draft.calcMethod === '그룹당 고정 배송비' && (
                <label className={styles.formField}>
                  <span>그룹 배송비 * (원)</span>
                  <input type="number" min={0} disabled={!editing} value={draft.groupFee} onChange={(e) => set('groupFee', Math.max(0, Number(e.target.value) || 0))} />
                </label>
              )}
              {draft.calcMethod === '최고 배송비' && <div className={styles.infoNote}>그룹 내 상품(수량 무관)의 개별 배송비 중 가장 높은 금액을 1회 부과합니다.</div>}
              {draft.calcMethod === '배송비 합산' && <div className={styles.infoNote}>그룹 내 모든 상품의 개별 배송비를 합산해서 부과합니다.</div>}
            </section>
            <section className={styles.formSection}>
              <h3>무료배송</h3>
              <label className={styles.toggleField}>
                <span>그룹 무료배송 사용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draft.freeShippingEnabled ? styles.switchOn : ''}`} onClick={() => set('freeShippingEnabled', !draft.freeShippingEnabled)}><i /></button>
              </label>
              {draft.freeShippingEnabled && (
                <label className={styles.formField}>
                  <span>기준금액 (그룹 상품금액 합계, 원)</span>
                  <input type="number" min={0} disabled={!editing} value={draft.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))} />
                </label>
              )}
              <div className={styles.infoNote}>무료배송 상품이 포함되어도 해당 상품만 무료로 처리되며, 그룹 배송비 자체는 별도로 계산됩니다.</div>
            </section>
            <section className={styles.formSection}>
              <h3>지역 추가 배송비</h3>
              <div className={styles.radioGroup}>
                {(['기본 정책 사용', '별도 정책 설정'] as RegionalFeePolicyMode[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.regionalFeePolicy === v} onChange={() => set('regionalFeePolicy', v)} />{v}</label>
                ))}
              </div>
              {draft.regionalFeePolicy === '별도 정책 설정' && (
                <label className={styles.formField}>
                  <span>제주/도서산간 추가 배송비 (그룹당, 원)</span>
                  <input type="number" min={0} disabled={!editing} value={draft.regionalFeeOverrideAmount} onChange={(e) => set('regionalFeeOverrideAmount', Math.max(0, Number(e.target.value) || 0))} />
                </label>
              )}
              <div className={styles.infoNote}>지역 추가 배송비는 그룹당 1회만 부과됩니다.</div>
            </section>
          </>
        )}

        {tab === 'products' && (
          <section className={styles.formSection}>
            <h3>연결 상품 ({draft.productCodes.length}개)</h3>
            {editing && (
              <>
                <div className={styles.addProductRow}>
                  <select value={pickCode} onChange={(e) => setPickCode(e.target.value)}>
                    <option value="">상품 선택</option>
                    {availableToAdd.map((p) => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
                  </select>
                  <button type="button" className={styles.addProductBtn} onClick={addProduct} disabled={!pickCode}>+ 추가</button>
                </div>
                {pickCrossWarning.length > 0 && (
                  <div className={styles.crossGroupWarn}>⚠ {productName(pickCode)}은(는) 이미 '{pickCrossWarning[0].name}' 그룹에 포함되어 있습니다. 추가하면 두 그룹 모두에 연결됩니다.</div>
                )}
              </>
            )}
            {draft.productCodes.length === 0 ? (
              <div className={drawer.emptyInline}>연결된 상품이 없습니다.</div>
            ) : (
              <div className={styles.itemTable}>
                <div className={styles.itemTableHead}><span>상품</span><span>카테고리</span><span>묶음상태</span><span /></div>
                {draft.productCodes.map((code) => {
                  const product = PRODUCTS.find((p) => p.code === code);
                  return (
                    <div key={code} className={styles.itemTableRow}>
                      <span>{product?.name ?? code} · {code}</span>
                      <span>{product?.category ?? '-'}</span>
                      <span>{product?.code}</span>
                      {editing ? <button type="button" className={styles.itemRemove} onClick={() => removeProduct(code)}>✕</button> : <span />}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'memo' && (
          <>
            <div className={drawer.memoInputRow}>
              <input className={drawer.memoInput} value={memoText} onChange={(e) => setMemoText(e.target.value)} placeholder="관리자 메모 입력" />
              <button type="button" className={drawer.memoSubmit} onClick={() => { if (memoText.trim()) { onAddMemo(memoText.trim()); setMemoText(''); } }}>등록</button>
            </div>
            {group.memos.length === 0 ? (
              <div className={drawer.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              group.memos.slice().reverse().map((m) => (
                <div key={m.id} className={drawer.memoItem}>
                  <div className={drawer.memoWhen}>{m.at} · {m.by}</div>
                  <div className={drawer.memoText}>{m.text}</div>
                </div>
              ))
            )}
          </>
        )}

        {tab === 'history' && (
          group.history.length === 0 ? (
            <div className={drawer.emptyInline}>변경 이력이 없습니다.</div>
          ) : (
            group.history.slice().reverse().map((h) => (
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
          <button type="button" className={styles.cancelButton} onClick={() => { setDraft(group); setEditing(false); setError(''); }}>취소</button>
          <button type="button" className={styles.primaryButton} onClick={save}>저장</button>
        </div>
      )}
    </aside>
  );
}
