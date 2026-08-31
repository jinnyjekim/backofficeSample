import { useRef, useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  CATEGORIES,
  OWNERS,
  PRODUCTS,
  computeStatus,
  type Coupon,
  type CouponApplyUnit,
  type DiscountMethod,
  type IssueMethod,
  type StackOption,
  type TargetType,
  type ValidityType,
} from './couponsData';

export interface CouponFormData {
  name: string;
  code: string;
  active: boolean;
  applyUnit: CouponApplyUnit;
  discountMethod: DiscountMethod;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  targetType: TargetType;
  targetProductCodes: string[];
  targetCategories: string[];
  excludeProductCodes: string[];
  issueMethod: IssueMethod;
  issueStart: string;
  issueEnd: string | null;
  totalLimit: number;
  perMemberLimit: number;
  validityType: ValidityType;
  validityDays: number;
  validStart: string | null;
  validEnd: string | null;
  stackPromotion: StackOption;
  stackCoupon: StackOption;
  owner: string;
  adminMemo: string;
}

interface Props {
  coupon: Coupon | null;
  onCancel: () => void;
  onSubmit: (form: CouponFormData) => void;
}

export function CouponEditorDrawer({ coupon: c, onCancel, onSubmit }: Props) {
  const editing = !!c;
  const isIssuing = !!c && computeStatus(c) === '발급중';

  const [name, setName] = useState(c?.name ?? '');
  const [code, setCode] = useState(c?.code ?? '');
  const [active, setActive] = useState(c?.active ?? true);
  const [applyUnit, setApplyUnit] = useState<CouponApplyUnit>(c?.applyUnit ?? '상품');
  const [discountMethod, setDiscountMethod] = useState<DiscountMethod>(c?.discountMethod ?? '정률');
  const [discountValue, setDiscountValue] = useState(String(c?.discountValue ?? 10));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(String(c?.maxDiscountAmount ?? 0));
  const [minPurchaseAmount, setMinPurchaseAmount] = useState(String(c?.minPurchaseAmount ?? 0));

  const [targetType, setTargetType] = useState<TargetType>(c?.targetType ?? '전체');
  const [targetProductCodes, setTargetProductCodes] = useState<string[]>(c?.targetProductCodes ?? []);
  const [targetCategories, setTargetCategories] = useState<string[]>(c?.targetCategories ?? []);
  const [excludeProductCodes, setExcludeProductCodes] = useState<string[]>(c?.excludeProductCodes ?? []);
  const [pickTarget, setPickTarget] = useState('');
  const [pickExclude, setPickExclude] = useState('');

  const [issueMethod, setIssueMethod] = useState<IssueMethod>(c?.issueMethod ?? '관리자 발급');
  const [issueStart, setIssueStart] = useState(c?.issueStart ?? '2026-08-26');
  const [issueEndMode, setIssueEndMode] = useState<'없음' | '지정'>(c?.issueEnd ? '지정' : '없음');
  const [issueEnd, setIssueEnd] = useState(c?.issueEnd ?? c?.issueStart ?? '2026-08-26');

  const [limitMode, setLimitMode] = useState<'제한없음' | '수량제한'>(c && c.totalLimit > 0 ? '수량제한' : '제한없음');
  const [totalLimit, setTotalLimit] = useState(String(c?.totalLimit ?? 1000));
  const [perMemberLimit, setPerMemberLimit] = useState(String(c?.perMemberLimit ?? 1));

  const [validityType, setValidityType] = useState<ValidityType>(c?.validityType ?? '발급후N일');
  const [validityDays, setValidityDays] = useState(String(c?.validityDays ?? 30));
  const [validStart, setValidStart] = useState(c?.validStart ?? '2026-08-26');
  const [validEnd, setValidEnd] = useState(c?.validEnd ?? '2026-09-26');

  const [stackPromotion, setStackPromotion] = useState<StackOption>(c?.stackPromotion ?? '가능');
  const [stackCoupon, setStackCoupon] = useState<StackOption>(c?.stackCoupon ?? '불가');
  const [owner, setOwner] = useState(c?.owner ?? OWNERS[0]);
  const [adminMemo, setAdminMemo] = useState(c?.adminMemo ?? '');

  const [error, setError] = useState('');

  const availableTargets = PRODUCTS.filter((p) => !targetProductCodes.includes(p.code));
  const availableExcludes = PRODUCTS.filter((p) => !excludeProductCodes.includes(p.code));

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
    const limit = limitMode === '제한없음' ? 0 : Math.max(1, Number(totalLimit) || 0);
    const perMember = Math.max(1, Number(perMemberLimit) || 1);
    const days = Math.max(1, Number(validityDays) || 1);

    if (!name.trim()) return setError('쿠폰명을 입력해 주세요.');
    if (!code.trim()) return setError('쿠폰 코드를 입력해 주세요.');
    if (discountMethod === '정률' && (discount <= 0 || discount > 100)) return setError('정률 할인은 0보다 크고 100 이하여야 합니다.');
    if (discountMethod === '정액' && discount <= 0) return setError('정액 할인 금액을 입력해 주세요.');
    if (targetType === '특정 상품' && targetProductCodes.length === 0) return setError('사용 대상 상품을 1개 이상 선택해 주세요.');
    if (targetType === '특정 카테고리' && targetCategories.length === 0) return setError('사용 대상 카테고리를 1개 이상 선택해 주세요.');
    if (!issueStart) return setError('발급 시작일을 입력해 주세요.');
    if (issueEndMode === '지정' && issueEnd < issueStart) return setError('발급 종료일은 시작일보다 빠를 수 없습니다.');
    if (validityType === '날짜지정' && !validEnd) return setError('사용 유효기간 종료일을 입력해 주세요.');

    setError('');
    onSubmit({
      name: name.trim(),
      code: code.trim().toUpperCase(),
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
      issueMethod,
      issueStart,
      issueEnd: issueEndMode === '없음' ? null : issueEnd,
      totalLimit: limit,
      perMemberLimit: perMember,
      validityType,
      validityDays: days,
      validStart: validityType === '날짜지정' ? validStart : null,
      validEnd: validityType === '날짜지정' ? validEnd : null,
      stackPromotion,
      stackCoupon,
      owner,
      adminMemo: adminMemo.trim(),
    });
  }

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onCancel);

  return (
    <aside ref={asideRef} className={`${styles.aside} ${styles.wideAside}`}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>쿠폰 관리 · 쿠폰 목록</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{editing ? `쿠폰 수정 · ${c!.id}` : '쿠폰 등록'}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onCancel}>×</button>
        </div>
      </div>

      <div className={styles.scroll}>
        {isIssuing && (
          <div className={styles.editPanel} style={{ background: '#fffbeb', borderColor: '#fde68a', marginTop: 0, marginBottom: 16 }}>
            <div className={styles.editTitle} style={{ color: '#b45309' }}>⚠ 현재 발급중인 쿠폰입니다</div>
            <div style={{ fontSize: 12, color: '#92400e' }}>핵심 혜택을 변경하면 변경 이후 발급되는 쿠폰부터 새 조건이 적용됩니다. 이미 발급된 쿠폰의 혜택은 변경되지 않습니다.</div>
          </div>
        )}

        <div className={styles.sectionTitle}>기본 정보</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>쿠폰명 *</label>
          <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 신규회원 5천원 쿠폰" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>쿠폰 코드 *</label>
          <input className={styles.formInput} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="예: NEW5000" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            쿠폰 사용
          </label>
        </div>

        <div className={styles.sectionTitleLoose}>할인 혜택</div>
        <div className={styles.formRow} style={{ marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label className={styles.formLabel}>쿠폰 유형 *</label>
            <select className={styles.formSelect} value={applyUnit} onChange={(e) => setApplyUnit(e.target.value as CouponApplyUnit)}>
              <option value="상품">상품 쿠폰</option>
              <option value="주문">주문 쿠폰</option>
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
        <div className={styles.formGroup} style={{ marginTop: 10 }}>
          <label className={styles.formLabel}>최소 구매금액 (원)</label>
          <input className={styles.formInput} type="number" min={0} value={minPurchaseAmount} onChange={(e) => setMinPurchaseAmount(e.target.value)} placeholder="0 = 제한 없음" />
        </div>

        <div className={styles.sectionTitleLoose}>사용 대상</div>
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
                {availableTargets.map((p) => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
              </select>
              <button type="button" className={styles.editConfirm} style={{ height: 32 }} onClick={addTargetProduct} disabled={!pickTarget}>+ 추가</button>
            </div>
            {targetProductCodes.length === 0 ? (
              <div className={styles.emptyInline}>선택된 상품이 없습니다.</div>
            ) : (
              targetProductCodes.map((code2) => {
                const prod = PRODUCTS.find((x) => x.code === code2);
                return (
                  <div className={styles.linkedItem} key={code2}>
                    <span>{prod?.name ?? code2} · {code2}</span>
                    <button type="button" className={styles.attachRemove} onClick={() => setTargetProductCodes((prev) => prev.filter((x) => x !== code2))}>×</button>
                  </div>
                );
              })
            )}
          </>
        )}
        {targetType === '특정 카테고리' && (
          <div className={styles.radioRow} style={{ flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <label key={cat} className={styles.radioOption}>
                <input type="checkbox" checked={targetCategories.includes(cat)} onChange={(e) => (e.target.checked ? addTargetCategory(cat) : setTargetCategories((prev) => prev.filter((x) => x !== cat)))} />
                {cat}
              </label>
            ))}
          </div>
        )}

        <div className={styles.sectionTitleLoose}>제외 대상</div>
        <div className={styles.formRow} style={{ marginBottom: 8 }}>
          <select className={styles.formSelect} style={{ flex: 1 }} value={pickExclude} onChange={(e) => setPickExclude(e.target.value)}>
            <option value="">제외할 상품 선택</option>
            {availableExcludes.map((p) => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
          </select>
          <button type="button" className={styles.editConfirm} style={{ height: 32 }} onClick={addExcludeProduct} disabled={!pickExclude}>+ 추가</button>
        </div>
        {excludeProductCodes.length === 0 ? (
          <div className={styles.emptyInline}>제외된 상품이 없습니다.</div>
        ) : (
          excludeProductCodes.map((code2) => {
            const prod = PRODUCTS.find((x) => x.code === code2);
            return (
              <div className={styles.linkedItem} key={code2}>
                <span>{prod?.name ?? code2} · {code2}</span>
                <button type="button" className={styles.attachRemove} onClick={() => setExcludeProductCodes((prev) => prev.filter((x) => x !== code2))}>×</button>
              </div>
            );
          })
        )}

        <div className={styles.sectionTitleLoose}>발급 설정</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>발급 방식 *</label>
          <select className={styles.formSelect} value={issueMethod} onChange={(e) => setIssueMethod(e.target.value as IssueMethod)}>
            <option value="관리자 발급">관리자 발급</option>
            <option value="자동 발급">자동 발급</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>발급 시작일 *</label>
          <input type="date" className={styles.dateInput} style={{ width: '100%' }} value={issueStart} onChange={(e) => setIssueStart(e.target.value)} />
        </div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={issueEndMode === '없음'} onChange={() => setIssueEndMode('없음')} />발급 종료일 없음</label>
          <label className={styles.radioOption}><input type="radio" checked={issueEndMode === '지정'} onChange={() => setIssueEndMode('지정')} />발급 종료일 지정</label>
        </div>
        {issueEndMode === '지정' && (
          <div className={styles.formGroup}>
            <input type="date" className={styles.dateInput} style={{ width: '100%' }} value={issueEnd} onChange={(e) => setIssueEnd(e.target.value)} />
          </div>
        )}

        <div className={styles.sectionTitleLoose}>발급 한도</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={limitMode === '제한없음'} onChange={() => setLimitMode('제한없음')} />총 발급 제한 없음</label>
          <label className={styles.radioOption}><input type="radio" checked={limitMode === '수량제한'} onChange={() => setLimitMode('수량제한')} />총 발급 수량 제한</label>
        </div>
        {limitMode === '수량제한' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>총 발급 한도 (장)</label>
            <input className={styles.formInput} type="number" min={1} value={totalLimit} onChange={(e) => setTotalLimit(e.target.value)} />
          </div>
        )}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>회원당 발급 (장)</label>
          <input className={styles.formInput} type="number" min={1} value={perMemberLimit} onChange={(e) => setPerMemberLimit(e.target.value)} />
        </div>

        <div className={styles.sectionTitleLoose}>사용 유효기간</div>
        <div className={styles.radioRow}>
          <label className={styles.radioOption}><input type="radio" checked={validityType === '발급후N일'} onChange={() => setValidityType('발급후N일')} />발급일 기준</label>
          <label className={styles.radioOption}><input type="radio" checked={validityType === '날짜지정'} onChange={() => setValidityType('날짜지정')} />날짜 지정</label>
        </div>
        {validityType === '발급후N일' ? (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>발급 후 (일)</label>
            <input className={styles.formInput} type="number" min={1} value={validityDays} onChange={(e) => setValidityDays(e.target.value)} />
          </div>
        ) : (
          <div className={styles.formRow}>
            <div style={{ flex: 1 }}>
              <label className={styles.formLabel}>사용 시작일</label>
              <input type="date" className={styles.dateInput} style={{ width: '100%' }} value={validStart} onChange={(e) => setValidStart(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.formLabel}>사용 종료일 *</label>
              <input type="date" className={styles.dateInput} style={{ width: '100%' }} value={validEnd} onChange={(e) => setValidEnd(e.target.value)} />
            </div>
          </div>
        )}

        <div className={styles.sectionTitleLoose}>중복 사용</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} style={{ marginBottom: 6 }}>프로모션과 중복</label>
          <div className={styles.radioRow}>
            <label className={styles.radioOption}><input type="radio" checked={stackPromotion === '가능'} onChange={() => setStackPromotion('가능')} />중복 가능</label>
            <label className={styles.radioOption}><input type="radio" checked={stackPromotion === '불가'} onChange={() => setStackPromotion('불가')} />중복 불가</label>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel} style={{ marginBottom: 6 }}>다른 쿠폰과 중복</label>
          <div className={styles.radioRow}>
            <label className={styles.radioOption}><input type="radio" checked={stackCoupon === '불가'} onChange={() => setStackCoupon('불가')} />중복 불가</label>
            <label className={styles.radioOption}><input type="radio" checked={stackCoupon === '가능'} onChange={() => setStackCoupon('가능')} />중복 가능</label>
          </div>
        </div>

        <div className={styles.sectionTitleLoose}>내부 관리</div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>담당자</label>
          <select className={styles.formSelect} value={owner} onChange={(e) => setOwner(e.target.value)}>
            {OWNERS.map((o) => <option key={o}>{o}</option>)}
          </select>
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
