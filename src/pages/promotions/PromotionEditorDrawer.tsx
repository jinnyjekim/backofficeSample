import { useRef, useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  CATEGORIES,
  OWNERS,
  PRODUCTS,
  computeStatus,
  type ApplyUnit,
  type DiscountMethod,
  type Promotion,
  type StackOption,
  type TargetType,
} from './promotionsData';

export interface PromotionFormData {
  name: string;
  applyUnit: ApplyUnit;
  discountMethod: DiscountMethod;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  targetType: TargetType;
  targetProductCodes: string[];
  targetCategories: string[];
  excludeProductCodes: string[];
  startDate: string;
  endDate: string | null;
  stackPromotion: StackOption;
  stackCoupon: StackOption;
  priority: number;
  owner: string;
  adminMemo: string;
  active: boolean;
}

interface Props {
  promotion: Promotion | null;
  onCancel: () => void;
  onSubmit: (form: PromotionFormData) => void;
}

export function PromotionEditorDrawer({ promotion: p, onCancel, onSubmit }: Props) {
  const editing = !!p;
  const isOngoing = !!p && computeStatus(p) === '진행중';

  const [name, setName] = useState(p?.name ?? '');
  const [active, setActive] = useState(p?.active ?? true);
  const [applyUnit, setApplyUnit] = useState<ApplyUnit>(p?.applyUnit ?? '상품');
  const [discountMethod, setDiscountMethod] = useState<DiscountMethod>(p?.discountMethod ?? '정률');
  const [discountValue, setDiscountValue] = useState(String(p?.discountValue ?? 10));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(String(p?.maxDiscountAmount ?? 0));
  const [minPurchaseAmount, setMinPurchaseAmount] = useState(String(p?.minPurchaseAmount ?? 0));

  const [targetType, setTargetType] = useState<TargetType>(p?.targetType ?? '전체');
  const [targetProductCodes, setTargetProductCodes] = useState<string[]>(p?.targetProductCodes ?? []);
  const [targetCategories, setTargetCategories] = useState<string[]>(p?.targetCategories ?? []);
  const [excludeProductCodes, setExcludeProductCodes] = useState<string[]>(p?.excludeProductCodes ?? []);
  const [pickTarget, setPickTarget] = useState('');
  const [pickExclude, setPickExclude] = useState('');

  const [startDate, setStartDate] = useState(p?.startDate ?? '2026-08-26');
  const [endMode, setEndMode] = useState<'없음' | '지정'>(p?.endDate ? '지정' : '없음');
  const [endDate, setEndDate] = useState(p?.endDate ?? p?.startDate ?? '2026-08-26');

  const [stackPromotion, setStackPromotion] = useState<StackOption>(p?.stackPromotion ?? '불가');
  const [stackCoupon, setStackCoupon] = useState<StackOption>(p?.stackCoupon ?? '가능');
  const [priority, setPriority] = useState(String(p?.priority ?? 100));
  const [owner, setOwner] = useState(p?.owner ?? OWNERS[0]);
  const [adminMemo, setAdminMemo] = useState(p?.adminMemo ?? '');

  const [error, setError] = useState('');

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onCancel);

  const availableTargets = PRODUCTS.filter((prod) => !targetProductCodes.includes(prod.code));
  const availableExcludes = PRODUCTS.filter((prod) => !excludeProductCodes.includes(prod.code));

  function addTargetProduct() {
    if (!pickTarget) return;
    setTargetProductCodes((prev) => [...prev, pickTarget]);
    setPickTarget('');
  }
  function addTargetCategory(cat: string) {
    if (targetCategories.includes(cat)) return;
    setTargetCategories((prev) => [...prev, cat]);
  }
  function addExcludeProduct() {
    if (!pickExclude) return;
    setExcludeProductCodes((prev) => [...prev, pickExclude]);
    setPickExclude('');
  }

  function submit() {
    const discount = Number(discountValue) || 0;
    const maxDiscount = Math.max(0, Number(maxDiscountAmount) || 0);
    const minPurchase = Math.max(0, Number(minPurchaseAmount) || 0);
    const priorityNum = Math.max(1, Number(priority) || 100);

    if (!name.trim()) return setError('프로모션명을 입력해 주세요.');
    if (discountMethod === '정률' && (discount <= 0 || discount > 100)) return setError('정률 할인은 0보다 크고 100 이하여야 합니다.');
    if (discountMethod === '정액' && discount <= 0) return setError('정액 할인 금액을 입력해 주세요.');
    if (targetType === '특정 상품' && targetProductCodes.length === 0) return setError('적용 대상 상품을 1개 이상 선택해 주세요.');
    if (targetType === '특정 카테고리' && targetCategories.length === 0) return setError('적용 대상 카테고리를 1개 이상 선택해 주세요.');
    if (!startDate) return setError('적용 시작일을 입력해 주세요.');
    if (endMode === '지정' && endDate < startDate) return setError('적용 종료일은 시작일보다 빠를 수 없습니다.');

    setError('');
    onSubmit({
      name: name.trim(),
      active,
      applyUnit,
      discountMethod,
      discountValue: discount,
      maxDiscountAmount: maxDiscount,
      minPurchaseAmount: minPurchase,
      targetType,
      targetProductCodes: targetType === '특정 상품' ? targetProductCodes : [],
      targetCategories: targetType === '특정 카테고리' ? targetCategories : [],
      excludeProductCodes,
      startDate,
      endDate: endMode === '없음' ? null : endDate,
      stackPromotion,
      stackCoupon,
      priority: priorityNum,
      owner,
      adminMemo: adminMemo.trim(),
    });
  }

  return (
    <aside ref={asideRef} className={`${styles.aside} ${styles.wideAside}`}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>프로모션 관리 · 프로모션 목록</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{editing ? `프로모션 수정 · ${p!.code}` : '프로모션 등록'}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        {isOngoing && (
          <div className={styles.editPanel} style={{ background: '#fffbeb', borderColor: '#fde68a', marginTop: 0, marginBottom: 16 }}>
            <div className={styles.editTitle} style={{ color: '#b45309' }}>⚠ 현재 진행중인 프로모션입니다</div>
            <div style={{ fontSize: 12, color: '#92400e' }}>할인 조건을 변경하면 변경 이후 주문부터 새 조건이 적용됩니다. 기존 주문의 할인내역은 변경되지 않습니다.</div>
          </div>
        )}

        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>프로모션명 *</label>
          <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 9월 상품 할인" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            프로모션 사용
          </label>
        </div>

        <div className={styles.sectionTitleLoose}>할인 조건</div>
        <div className={styles.formRow} style={{ marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label className={styles.formLabel}>적용 단위 *</label>
            <select className={styles.formSelect} value={applyUnit} onChange={(e) => setApplyUnit(e.target.value as ApplyUnit)}>
              <option value="상품">상품 할인</option>
              <option value="주문">주문 할인</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className={styles.formLabel}>할인 방식 *</label>
            <select className={styles.formSelect} value={discountMethod} onChange={(e) => setDiscountMethod(e.target.value as DiscountMethod)}>
              <option value="정률">정률 할인</option>
              <option value="정액">정액 할인</option>
            </select>
          </div>
        </div>
        <div className={styles.formRow}>
          <div style={{ flex: 1 }}>
            <label className={styles.formLabel}>{discountMethod === '정률' ? '할인율 (%) *' : '할인 금액 (원) *'}</label>
            <input className={styles.formInput} type="number" min={0} max={discountMethod === '정률' ? 100 : undefined} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
          </div>
          {discountMethod === '정률' && (
            <div style={{ flex: 1 }}>
              <label className={styles.formLabel}>최대 할인금액 (원)</label>
              <input className={styles.formInput} type="number" min={0} value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} placeholder="0 = 제한 없음" />
            </div>
          )}
        </div>

        <div className={styles.sectionTitleLoose}>구매 조건</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>최소 구매금액 (원)</label>
          <input className={styles.formInput} type="number" min={0} value={minPurchaseAmount} onChange={(e) => setMinPurchaseAmount(e.target.value)} placeholder="0 = 제한 없음" />
        </div>

        <div className={styles.sectionTitleLoose}>적용 대상</div>
        <div className={styles.radioRow}>
          {(['전체', '특정 상품', '특정 카테고리'] as TargetType[]).map((t) => (
            <label key={t} className={styles.radioOption}><input type="radio" checked={targetType === t} onChange={() => setTargetType(t)} />{t}</label>
          ))}
        </div>
        {targetType === '특정 상품' && (
          <>
            <div className={styles.formRow} style={{ marginBottom: 8 }}>
              <select className={styles.formSelect} style={{ flex: 1 }} value={pickTarget} onChange={(e) => setPickTarget(e.target.value)}>
                <option value="">상품 선택</option>
                {availableTargets.map((prod) => <option key={prod.code} value={prod.code}>{prod.name} ({prod.code})</option>)}
              </select>
              <button type="button" className={styles.editConfirm} style={{ height: 32 }} onClick={addTargetProduct} disabled={!pickTarget}>+ 추가</button>
            </div>
            {targetProductCodes.length === 0 ? (
              <div className={styles.emptyInline}>선택된 상품이 없습니다.</div>
            ) : (
              targetProductCodes.map((code) => {
                const prod = PRODUCTS.find((x) => x.code === code);
                return (
                  <div className={styles.linkedItem} key={code}>
                    <span>{prod?.name ?? code} · {code}</span>
                    <button type="button" className={styles.attachRemove} onClick={() => setTargetProductCodes((prev) => prev.filter((c) => c !== code))}>×</button>
                  </div>
                );
              })
            )}
          </>
        )}
        {targetType === '특정 카테고리' && (
          <>
            <div className={styles.radioRow} style={{ flexWrap: 'wrap' }}>
              {CATEGORIES.map((cat) => (
                <label key={cat} className={styles.radioOption}>
                  <input type="checkbox" checked={targetCategories.includes(cat)} onChange={(e) => (e.target.checked ? addTargetCategory(cat) : setTargetCategories((prev) => prev.filter((c) => c !== cat)))} />
                  {cat}
                </label>
              ))}
            </div>
          </>
        )}

        <div className={styles.sectionTitleLoose}>제외 대상</div>
        <div className={styles.formRow} style={{ marginBottom: 8 }}>
          <select className={styles.formSelect} style={{ flex: 1 }} value={pickExclude} onChange={(e) => setPickExclude(e.target.value)}>
            <option value="">제외할 상품 선택</option>
            {availableExcludes.map((prod) => <option key={prod.code} value={prod.code}>{prod.name} ({prod.code})</option>)}
          </select>
          <button type="button" className={styles.editConfirm} style={{ height: 32 }} onClick={addExcludeProduct} disabled={!pickExclude}>+ 추가</button>
        </div>
        {excludeProductCodes.length === 0 ? (
          <div className={styles.emptyInline}>제외된 상품이 없습니다.</div>
        ) : (
          excludeProductCodes.map((code) => {
            const prod = PRODUCTS.find((x) => x.code === code);
            return (
              <div className={styles.linkedItem} key={code}>
                <span>{prod?.name ?? code} · {code}</span>
                <button type="button" className={styles.attachRemove} onClick={() => setExcludeProductCodes((prev) => prev.filter((c) => c !== code))}>×</button>
              </div>
            );
          })
        )}

        <div className={styles.sectionTitleLoose}>중복 적용</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} style={{ marginBottom: 6 }}>다른 프로모션과 중복</label>
          <div className={styles.radioRow}>
            <label className={styles.radioOption}><input type="radio" checked={stackPromotion === '불가'} onChange={() => setStackPromotion('불가')} />중복 불가</label>
            <label className={styles.radioOption}><input type="radio" checked={stackPromotion === '가능'} onChange={() => setStackPromotion('가능')} />중복 가능</label>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} style={{ marginBottom: 6 }}>쿠폰과 중복</label>
          <div className={styles.radioRow}>
            <label className={styles.radioOption}><input type="radio" checked={stackCoupon === '가능'} onChange={() => setStackCoupon('가능')} />중복 가능</label>
            <label className={styles.radioOption}><input type="radio" checked={stackCoupon === '불가'} onChange={() => setStackCoupon('불가')} />중복 불가</label>
          </div>
        </div>

        <div className={styles.sectionTitleLoose}>적용 기간</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>시작 *</label>
          <input type="date" className={styles.dateInput} style={{ width: '100%' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={endMode === '없음'} onChange={() => setEndMode('없음')} />종료일 없음</label>
          <label className={styles.radioOption}><input type="radio" checked={endMode === '지정'} onChange={() => setEndMode('지정')} />종료일 지정</label>
        </div>
        {endMode === '지정' && (
          <div className={styles.formGroup}>
            <input type="date" className={styles.dateInput} style={{ width: '100%' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}
        {endMode === '없음' && <div className={styles.emptyInline} style={{ marginBottom: 12 }}>⚠ 종료일이 없는 프로모션입니다.</div>}

        <div className={styles.sectionTitleLoose}>기타</div>
        <div className={styles.formRow} style={{ marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label className={styles.formLabel}>우선순위 <span style={{ color: '#a1a1aa' }}>(숫자가 작을수록 우선)</span></label>
            <input className={styles.formInput} type="number" min={1} value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label className={styles.formLabel}>담당자</label>
            <select className={styles.formSelect} value={owner} onChange={(e) => setOwner(e.target.value)}>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>관리자 메모</label>
          <input className={styles.formInput} value={adminMemo} onChange={(e) => setAdminMemo(e.target.value)} placeholder="참고사항을 남겨보세요" />
        </div>

        {error && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{error}</div>}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.editCancel} onClick={onCancel}>취소</button>
        <button type="button" className={styles.editConfirm} onClick={submit}>{editing ? '수정 저장' : '등록'}</button>
      </div>
    </aside>
  );
}
