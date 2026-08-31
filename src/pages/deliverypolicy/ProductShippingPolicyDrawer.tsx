import { useRef, useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './ProductShippingPolicyPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  BASE_SHIPPING_POLICY,
  CALC_SCENARIOS,
  DELIVERY_METHODS,
  REGIONS,
  WAREHOUSES,
  computeProductShippingFee,
  fmtWon,
  type BundleShipping,
  type DeliveryMethod,
  type FeeType,
  type Product,
  type ProductShippingOverride,
  type Region,
  type RegionalFeePolicyMode,
  type ReturnFeePolicyMode,
} from './productShippingOverrideData';

type Tab = 'basic' | 'fee' | 'bundle' | 'preview' | 'history';

interface Props {
  product: Product;
  initial: ProductShippingOverride;
  startEditing?: boolean;
  issues: string[];
  onClose: () => void;
  onSave: (item: ProductShippingOverride) => void;
}

export function ProductShippingPolicyDrawer({ product, initial, startEditing = false, issues, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(startEditing);
  const [tab, setTab] = useState<Tab>('basic');
  const [error, setError] = useState('');
  const [scenarioId, setScenarioId] = useState(CALC_SCENARIOS[0].id);
  const set = <K extends keyof ProductShippingOverride>(key: K, value: ProductShippingOverride[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const toggleRegion = (region: Region) => {
    set('unavailableRegions', draft.unavailableRegions.includes(region) ? draft.unavailableRegions.filter((r) => r !== region) : [...draft.unavailableRegions, region]);
  };

  const save = () => {
    if (draft.usesOverride) {
      if (!draft.warehouse) return setError('출고지를 선택해 주세요.');
      if ((draft.feeType === '고정 배송비' || draft.feeType === '조건부 무료배송') && draft.fixedFee <= 0) return setError('배송비를 입력해 주세요.');
      if (draft.feeType === '조건부 무료배송' && draft.freeShippingThreshold <= 0) return setError('무료배송 기준금액을 입력해 주세요.');
      if (draft.endDate && draft.endDate < draft.startDate) return setError('적용 종료일은 시작일보다 빠를 수 없습니다.');
    }
    onSave(draft);
  };

  const scenario = CALC_SCENARIOS.find((s) => s.id === scenarioId)!;
  const result = computeProductShippingFee(draft, scenario);

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={`${drawer.aside} ${styles.feeDrawer}`} aria-label="상품별 배송 정책 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{product.code} · {product.category}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{product.name}</h2>
              <span className={drawer.badge} style={{ background: draft.usesOverride ? '#eef2ff' : '#f4f4f5', color: draft.usesOverride ? '#4338ca' : '#71717a' }}>{draft.usesOverride ? '별도 정책' : '기본 정책'}</span>
              {issues.length > 0 && <span className={drawer.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 설정 확인</span>}
            </div>
            <div className={drawer.sub}>{fmtWon(product.price)} · 최근 수정 {draft.updatedAt} · {draft.updatedBy}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={drawer.actionRow}>
          <button type="button" className={drawer.actionLink} onClick={() => setEditing((current) => !current)}>{editing ? '수정 취소' : '수정'}</button>
        </div>
        <div className={drawer.tabs}>
          {([['basic', '기본 정보'], ['fee', '배송비 · 지역'], ['bundle', '묶음 · 반품/교환'], ['preview', '계산 Preview'], ['history', '변경 이력']] as [Tab, string][]).map(([key, label]) => (
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
              <h3>정책 적용</h3>
              <div className={styles.radioGroup}>
                <label><input type="radio" disabled={!editing} checked={!draft.usesOverride} onChange={() => set('usesOverride', false)} />기본 배송 정책 사용</label>
                <label><input type="radio" disabled={!editing} checked={draft.usesOverride} onChange={() => set('usesOverride', true)} />상품별 배송 정책 사용</label>
              </div>
              <div className={styles.infoNote}>기본 배송 정책 사용 시 이 상품은 배송 정책 &gt; 기본 배송비의 현재 설정(기본 배송비 {fmtWon(BASE_SHIPPING_POLICY.baseFee)})을 그대로 따릅니다.</div>
            </section>
            {draft.usesOverride && (
              <section className={styles.formSection}>
                <h3>배송 방식 · 출고지</h3>
                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>배송 방식 *</span>
                    <select disabled={!editing} value={draft.deliveryMethod} onChange={(e) => set('deliveryMethod', e.target.value as DeliveryMethod)}>
                      {DELIVERY_METHODS.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </label>
                  <label className={styles.formField}>
                    <span>출고지 *</span>
                    <select disabled={!editing} value={draft.warehouse} onChange={(e) => set('warehouse', e.target.value)}>
                      <option value="">선택 안 함</option>
                      {WAREHOUSES.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </label>
                </div>
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
                <label className={styles.toggleField}>
                  <span>정책 사용</span>
                  <button type="button" disabled={!editing} className={`${styles.switch} ${draft.active ? styles.switchOn : ''}`} onClick={() => set('active', !draft.active)}><i /></button>
                </label>
              </section>
            )}
            <section className={styles.formSection}>
              <h3>관리자 메모</h3>
              <textarea disabled={!editing} value={draft.adminMemo} onChange={(e) => set('adminMemo', e.target.value)} placeholder="내부 참고 메모" />
            </section>
          </>
        )}

        {tab === 'fee' && (
          draft.usesOverride ? (
            <>
              <section className={styles.formSection}>
                <h3>배송비</h3>
                <label className={styles.formField}>
                  <span>배송비 유형 *</span>
                  <div className={styles.radioGroup}>
                    {(['무료배송', '고정 배송비', '조건부 무료배송'] as FeeType[]).map((v) => (
                      <label key={v}><input type="radio" disabled={!editing} checked={draft.feeType === v} onChange={() => set('feeType', v)} />{v}</label>
                    ))}
                  </div>
                </label>
                {draft.feeType !== '무료배송' && (
                  <label className={styles.formField}>
                    <span>기본 배송비 * (원)</span>
                    <input type="number" min={0} disabled={!editing} value={draft.fixedFee} onChange={(e) => set('fixedFee', Math.max(0, Number(e.target.value) || 0))} />
                  </label>
                )}
                {draft.feeType === '조건부 무료배송' && (
                  <label className={styles.formField}>
                    <span>무료배송 기준금액 * (원)</span>
                    <input type="number" min={0} disabled={!editing} value={draft.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))} />
                  </label>
                )}
              </section>
              <section className={styles.formSection}>
                <h3>지역 추가 배송비</h3>
                <div className={styles.radioGroup}>
                  {(['기본 정책 사용', '상품별 별도 설정'] as RegionalFeePolicyMode[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draft.regionalFeePolicy === v} onChange={() => set('regionalFeePolicy', v)} />{v}</label>
                  ))}
                </div>
                {draft.regionalFeePolicy === '상품별 별도 설정' && (
                  <label className={styles.formField}>
                    <span>제주/도서산간 추가 배송비 (원)</span>
                    <input type="number" min={0} disabled={!editing} value={draft.regionalFeeOverrideAmount} onChange={(e) => set('regionalFeeOverrideAmount', Math.max(0, Number(e.target.value) || 0))} />
                  </label>
                )}
                <div className={styles.infoNote}>지역별 추가 배송비의 세부 정책(시/도, 우편번호 등)은 배송 정책 &gt; 지역별 추가 배송비에서 관리합니다. 여기서는 이 상품이 그 정책을 따를지, 별도 금액을 쓸지만 결정합니다.</div>
              </section>
            </>
          ) : <div className={styles.infoNote}>기본 배송 정책을 사용 중입니다. 배송비·지역비 설정을 변경하려면 '기본 정보' 탭에서 상품별 배송 정책 사용으로 전환해 주세요.</div>
        )}

        {tab === 'bundle' && (
          draft.usesOverride ? (
            <>
              <section className={styles.formSection}>
                <h3>묶음배송 · 배송 불가 지역</h3>
                <label className={styles.formField}>
                  <span>묶음배송</span>
                  <div className={styles.radioGroup}>
                    {(['가능', '불가'] as BundleShipping[]).map((v) => (
                      <label key={v}><input type="radio" disabled={!editing} checked={draft.bundleShipping === v} onChange={() => set('bundleShipping', v)} />{v}</label>
                    ))}
                  </div>
                </label>
                <label className={styles.formField}>
                  <span>배송 불가 지역</span>
                  <div className={styles.checkGroup}>
                    {REGIONS.filter((r) => r !== '일반').map((r) => (
                      <label key={r}><input type="checkbox" disabled={!editing} checked={draft.unavailableRegions.includes(r)} onChange={() => toggleRegion(r)} />{r}</label>
                    ))}
                  </div>
                </label>
              </section>
              <section className={styles.formSection}>
                <h3>반품 / 교환 배송비</h3>
                <div className={styles.radioGroup}>
                  {(['기본 정책 사용', '상품별 설정'] as ReturnFeePolicyMode[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draft.returnFeePolicy === v} onChange={() => set('returnFeePolicy', v)} />{v}</label>
                  ))}
                </div>
                {draft.returnFeePolicy === '상품별 설정' && (
                  <div className={styles.formGrid}>
                    <label className={styles.formField}>
                      <span>반품 배송비 (편도, 원)</span>
                      <input type="number" min={0} disabled={!editing} value={draft.returnFeeOverride} onChange={(e) => set('returnFeeOverride', Math.max(0, Number(e.target.value) || 0))} />
                    </label>
                    <label className={styles.formField}>
                      <span>교환 배송비 (왕복, 원)</span>
                      <input type="number" min={0} disabled={!editing} value={draft.exchangeFeeOverride} onChange={(e) => set('exchangeFeeOverride', Math.max(0, Number(e.target.value) || 0))} />
                    </label>
                  </div>
                )}
                <div className={styles.infoNote}>기본 반품/교환 배송비 기준은 배송 정책 &gt; 반품/교환 배송비에서 관리합니다.</div>
              </section>
            </>
          ) : <div className={styles.infoNote}>기본 배송 정책을 사용 중입니다.</div>
        )}

        {tab === 'preview' && (
          <section className={styles.formSection}>
            <h3>배송비 계산 Preview</h3>
            <div className={styles.orderPick}>
              {CALC_SCENARIOS.map((s) => (
                <button key={s.id} type="button" className={`${styles.orderOption} ${scenarioId === s.id ? styles.orderOptionActive : ''}`} onClick={() => setScenarioId(s.id)}>
                  <span><strong>{s.label}</strong> · {s.quantity}개</span>
                  <span>{fmtWon(s.orderAmount)}</span>
                </button>
              ))}
            </div>
            <div className={`${styles.resultHero} ${!result.deliverable ? styles.resultHeroWarn : ''}`}>
              <span>{scenario.label}</span>
              <strong>{result.deliverable ? fmtWon(result.finalFee) : '배송 불가'}</strong>
            </div>
            {result.deliverable && (
              <div className={styles.breakdownTable}>
                <div className={styles.breakdownRow}><span>기본 배송비</span><span>{fmtWon(result.baseFee)}</span></div>
                <div className={styles.breakdownRow}><span>지역 추가배송비</span><span>{fmtWon(result.regionFee)}</span></div>
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}><span>최종 배송비</span><span>{fmtWon(result.finalFee)}</span></div>
              </div>
            )}
            <div className={styles.resultRow}><span>적용 근거</span><strong>{result.source}</strong></div>
            <div className={styles.infoNote}>저장된(적용중인) 설정 기준으로 계산합니다. 이 화면에서 값을 바꾸는 것은 저장 전 미리보기용이 아니며, 실제 계산은 저장된 정책을 기준으로 합니다.</div>
          </section>
        )}

        {tab === 'history' && (
          <>
            {draft.history.length ? draft.history.slice().reverse().map((item) => (
              <div key={item.id} className={drawer.timelineItem}>
                <span className={drawer.timelineDot} />
                <div className={drawer.timelineBody}>
                  <div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{item.action}</strong><span className={drawer.timelineWhen}>{item.at}</span></div>
                  <div className={drawer.timelineDetail}>{item.by}{item.before && item.after ? ` · ${item.before} → ${item.after}` : item.after ? ` · ${item.after}` : ''}</div>
                </div>
              </div>
            )) : <div className={styles.infoNote}>저장 후 변경 이력이 기록됩니다.</div>}
          </>
        )}
        {error && <div className={styles.formError}>{error}</div>}
      </div>

      {editing && (
        <div className={drawer.footer}>
          <button type="button" className={styles.cancelButton} onClick={() => { setDraft(initial); setEditing(false); setError(''); }}>취소</button>
          <button type="button" className={styles.primaryButton} onClick={save}>저장</button>
        </div>
      )}
    </aside>
  );
}
