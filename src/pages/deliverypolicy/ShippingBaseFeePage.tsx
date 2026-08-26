import { useMemo, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './ShippingBaseFeePage.module.css';
import {
  INITIAL_HISTORY,
  INITIAL_POLICY,
  TEST_ORDERS,
  computeShippingPreview,
  computeWarnings,
  describePolicyChanges,
  fmtWon,
  signed,
  type BundleCalc,
  type CalcUnit,
  type FieldDiff,
  type FreeShippingBasis,
  type FreeShippingCompare,
  type FreeShippingScope,
  type PolicyHistoryEntry,
  type ShippingBasePolicy,
  type ShippingUsage,
  type TaxTreatment,
} from './shippingBaseFeeData';

type Tab = 'basic' | 'free' | 'bundle' | 'preview' | 'history';
const TABS: [Tab, string][] = [
  ['basic', '기본 설정'],
  ['free', '무료배송'],
  ['bundle', '묶음 · 분할배송'],
  ['preview', '정책 Preview'],
  ['history', '변경 이력'],
];

export function ShippingBaseFeePage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [history, setHistory] = useState(INITIAL_HISTORY);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [previewOrderId, setPreviewOrderId] = useState(TEST_ORDERS[0].id);

  const warnings = useMemo(() => computeWarnings(editing ? draftPolicy : policy), [editing, draftPolicy, policy]);

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof ShippingBasePolicy>(key: K, value: ShippingBasePolicy[K]) => setDraftPolicy((current) => ({ ...current, [key]: value }));

  const startEdit = () => {
    setDraftPolicy(policy);
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
  };
  const requestSave = () => {
    const diffs = describePolicyChanges(policy, draftPolicy);
    if (diffs.length === 0) return setEditing(false);
    setReason('');
    setSaveError('');
    setConfirmSave(diffs);
  };
  const commitSave = () => {
    if (!reason.trim()) return setSaveError('변경 사유를 입력해 주세요.');
    if (!confirmSave) return;
    const entries: PolicyHistoryEntry[] = confirmSave.map((d, i) => ({
      id: `H-${Date.now()}-${i}`,
      at: '2026-08-25 14:00',
      by: 'admin01',
      field: d.field,
      before: d.before,
      after: d.after,
      reason: reason.trim(),
    }));
    setPolicy(draftPolicy);
    setHistory((current) => [...entries, ...current]);
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('기본 배송비 정책을 저장했습니다.');
  };

  const previewOrder = TEST_ORDERS.find((o) => o.id === previewOrderId)!;
  const previewResult = computeShippingPreview(previewOrder, policy);

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>기본 배송비</h1>
            <p className={shared.subtitle}>별도 상품·거래처·지역 배송비 조건이 없는 주문에 적용되는 기본 배송비와 무료배송 기준을 설정합니다.</p>
          </div>
          {!editing ? (
            <button type="button" className={shared.createBtn} onClick={startEdit}>정책 수정</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className={styles.cancelButton} onClick={cancelEdit}>수정 취소</button>
              <button type="button" className={styles.primaryButton} onClick={requestSave}>변경 사항 저장</button>
            </div>
          )}
        </div>
        <div className={styles.viewTabs}>
          {TABS.map(([key, label]) => (
            <button key={key} type="button" className={`${styles.viewTabBtn} ${tab === key ? styles.viewTabActive : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {warnings.length > 0 && (
          <div className={styles.warningBanner}>
            <strong>설정 확인 필요</strong>
            {warnings.map((w) => <span key={w.id}>⚠ {w.message}</span>)}
          </div>
        )}

        {tab === 'basic' && (
          <>
            <div className={styles.summaryCard}>
              <h2>현재 정책 요약</h2>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryRow}><span>배송비 사용</span><strong>{policy.usage}</strong></div>
                <div className={styles.summaryRow}><span>기본 배송비</span><strong>{fmtWon(policy.baseFee)}</strong></div>
                <div className={styles.summaryRow}><span>계산 단위</span><strong>{policy.calcUnit}</strong></div>
                <div className={styles.summaryRow}><span>무료배송 기준</span><strong>{policy.freeShippingEnabled ? `${fmtWon(policy.freeShippingThreshold)} ${policy.freeShippingCompare}` : '사용 안 함'}</strong></div>
                <div className={styles.summaryRow}><span>묶음배송 계산</span><strong>{policy.bundleCalc}</strong></div>
                <div className={styles.summaryRow}><span>적용 시작일</span><strong>{policy.startDate}</strong></div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3>기본 배송비 설정</h3>
              <label className={styles.formField}>
                <span>배송비 사용 여부 *</span>
                <div className={styles.radioGroup}>
                  {(['사용', '무료배송만 사용', '미사용'] as ShippingUsage[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.usage === v} onChange={() => set('usage', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>기본 배송비 * (원)</span>
                  <input type="number" min={0} disabled={!editing || draftPolicy.usage === '미사용'} value={draftPolicy.baseFee} onChange={(e) => set('baseFee', Math.max(0, Number(e.target.value) || 0))} />
                </label>
                <label className={styles.formField}>
                  <span>배송비 계산 단위 *</span>
                  <select disabled={!editing} value={draftPolicy.calcUnit} onChange={(e) => set('calcUnit', e.target.value as CalcUnit)}>
                    {(['배송건당', '주문당'] as CalcUnit[]).map((v) => <option key={v}>{v}</option>)}
                  </select>
                </label>
              </div>
              <div className={styles.formGrid}>
                <label className={styles.formField}>
                  <span>최소 배송비 (원)</span>
                  <input type="number" min={0} disabled={!editing} value={draftPolicy.minFee} onChange={(e) => set('minFee', Math.max(0, Number(e.target.value) || 0))} />
                </label>
                <label className={styles.formField}>
                  <span>최대 배송비 (원)</span><small>비워두면 제한 없음</small>
                  <input type="number" min={0} disabled={!editing} value={draftPolicy.maxFee ?? ''} onChange={(e) => set('maxFee', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} />
                </label>
              </div>
              <label className={styles.formField}>
                <span>배송비 과세 구분</span>
                <div className={styles.radioGroup}>
                  {(['과세', '비과세', '세금 정책에 따름'] as TaxTreatment[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.taxTreatment === v} onChange={() => set('taxTreatment', v)} />{v}</label>
                  ))}
                </div>
              </label>
              <label className={styles.formField}>
                <span>적용 시작일 *</span>
                <input type="date" disabled={!editing} value={draftPolicy.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </label>
              <div className={styles.infoNote}>
                지역별 추가 배송비, 상품별·거래처별 배송비 Override는 각각 <button type="button" className={styles.linkBtn} onClick={() => window.location.assign('/delivery-policy/region-fee')}>지역별 추가 배송비</button>, 상품/거래처 상세에서 별도로 관리합니다. 이 페이지의 값은 다른 조건이 없을 때 적용되는 전역 기본값입니다.
              </div>
            </div>
          </>
        )}

        {tab === 'free' && (
          <div className={styles.formSection}>
            <h3>무료배송</h3>
            <label className={styles.toggleField}>
              <span>무료배송 사용</span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.freeShippingEnabled ? styles.switchOn : ''}`} onClick={() => set('freeShippingEnabled', !draftPolicy.freeShippingEnabled)}><i /></button>
            </label>
            <label className={styles.formField}>
              <span>무료배송 기준금액 * (원)</span>
              <input type="number" min={0} disabled={!editing || !draftPolicy.freeShippingEnabled} value={draftPolicy.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <label className={styles.formField}>
              <span>기준금액 계산</span>
              <div className={styles.radioGroup}>
                {(['할인 후 상품금액', '할인 전 상품금액', '최종 결제금액', '배송비 제외 주문금액'] as FreeShippingBasis[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing || !draftPolicy.freeShippingEnabled} checked={draftPolicy.freeShippingBasis === v} onChange={() => set('freeShippingBasis', v)} />{v}</label>
                ))}
              </div>
            </label>
            <label className={styles.formField}>
              <span>무료배송 기준 비교</span>
              <div className={styles.radioGroup}>
                {(['이상', '초과'] as FreeShippingCompare[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing || !draftPolicy.freeShippingEnabled} checked={draftPolicy.freeShippingCompare === v} onChange={() => set('freeShippingCompare', v)} />{v}</label>
                ))}
              </div>
            </label>
            <label className={styles.formField}>
              <span>무료배송 적용 범위</span>
              <div className={styles.radioGroup}>
                {(['기본 배송비만 면제', '지역 추가배송비 포함 전체 면제'] as FreeShippingScope[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing || !draftPolicy.freeShippingEnabled} checked={draftPolicy.freeShippingScope === v} onChange={() => set('freeShippingScope', v)} />{v}</label>
                ))}
              </div>
            </label>
            <div className={styles.infoNote}>포인트 사용액은 결제수단으로 취급되어 '최종 결제금액' 기준을 선택했을 때만 무료배송 기준금액에서 차감됩니다. 할인 전/후 기준을 선택하면 포인트 사용 여부와 무관하게 계산됩니다.</div>
          </div>
        )}

        {tab === 'bundle' && (
          <div className={styles.formSection}>
            <h3>묶음배송</h3>
            <label className={styles.formField}>
              <span>묶음배송 시 배송비 계산</span>
              <div className={styles.radioGroup}>
                {(['배송비 1회만 부과', '가장 높은 배송비 1건 적용', '모든 배송비 합산'] as BundleCalc[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draftPolicy.bundleCalc === v} onChange={() => set('bundleCalc', v)} />{v}</label>
                ))}
              </div>
            </label>
            <div className={styles.infoNote}>개별배송 상품(상품 상세에서 별도 설정)은 묶음배송 대상에서 항상 제외되어 별도 배송비가 추가됩니다.</div>

            <h3 style={{ marginTop: 18 }}>분할배송</h3>
            <label className={styles.toggleField}>
              <span>운영상 분할배송 시 추가 배송비 부과<small>재고 문제 등으로 시스템이 배송을 나눈 경우</small></span>
              <button type="button" disabled={!editing} className={`${styles.switch} ${draftPolicy.splitShippingExtraFee ? styles.switchOn : ''}`} onClick={() => set('splitShippingExtraFee', !draftPolicy.splitShippingExtraFee)}><i /></button>
            </label>
            <div className={styles.infoNote}>고객이 결제한 배송비는 주문 확정 시점에 Snapshot으로 고정됩니다. 이후 운영 사정으로 배송이 나뉘어도 기본적으로 추가 배송비를 부과하지 않는 것을 권장합니다.</div>
          </div>
        )}

        {tab === 'preview' && (
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <h3>테스트 주문 선택</h3>
              <div className={styles.orderPick}>
                {TEST_ORDERS.map((o) => (
                  <button key={o.id} type="button" className={`${styles.orderOption} ${previewOrderId === o.id ? styles.orderOptionActive : ''}`} onClick={() => setPreviewOrderId(o.id)}>
                    <span><strong>{o.id}</strong> · {o.target}</span>
                    <span>{fmtWon(o.productAmount)}</span>
                  </button>
                ))}
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 계산합니다.</div>
            </div>
            <div className={styles.previewCard}>
              <h3>배송비 계산 결과</h3>
              <div className={`${styles.resultHero} ${previewResult.finalFee > 0 ? styles.resultHeroPaid : ''}`}>
                <span>{previewOrder.id} · {previewOrder.target}</span>
                <strong>{previewResult.finalFee > 0 ? fmtWon(previewResult.finalFee) : '무료배송'}</strong>
              </div>
              <div className={styles.breakdownTable}>
                {previewResult.items.map((item, i) => (
                  <div key={i} className={styles.breakdownRow}>
                    <span>{item.label}</span>
                    <span className={item.amount < 0 ? styles.breakdownNeg : styles.breakdownPos}>{signed(item.amount)}</span>
                  </div>
                ))}
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                  <span>최종 배송비</span>
                  <span>{fmtWon(previewResult.finalFee)}</span>
                </div>
              </div>
              <div className={styles.resultRow}><span>기준금액 ({policy.freeShippingBasis})</span><strong>{fmtWon(previewResult.basisAmount)}</strong></div>
              <div className={styles.resultRow}><span>무료배송 적용</span><strong>{previewResult.freeShippingApplied ? '적용' : '미적용'}</strong></div>
              {previewResult.clamped && <div className={styles.resultRow}><span>최소/최대 배송비 적용</span><strong>적용됨</strong></div>}
              <div className={styles.resultRow}><span>지역 추가배송비</span><strong>별도 정책 적용</strong></div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <>
            {history.length === 0 && <div className={styles.infoNote}>변경 이력이 없습니다.</div>}
            {history.map((h) => (
              <div key={h.id} className={timeline.timelineItem}>
                <span className={timeline.timelineDot} />
                <div className={timeline.timelineBody}>
                  <div className={timeline.timelineRow}><strong className={timeline.timelineTitle}>{h.field}</strong><span className={timeline.timelineWhen}>{h.at}</span></div>
                  <div className={timeline.timelineDetail}>{h.before} → {h.after} · {h.by}</div>
                  <div className={timeline.timelineDetail}>사유: {h.reason}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {confirmSave && (
        <div className={shared.dialogOverlay}>
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>기본 배송비 정책 변경 확인</h2>
            <p className={shared.dialogBody}>변경 사항은 적용 시작일부터 신규 주문에 적용됩니다. 이미 확정된 주문의 배송비 Snapshot은 유지됩니다.</p>
            <div className={styles.diffTable}>
              {confirmSave.map((d, i) => (
                <div key={i} className={styles.diffRow}>
                  <span className={styles.diffField}>{d.field}</span>
                  <span className={styles.diffBefore}>{d.before}</span>
                  <span className={styles.diffAfter}>{d.after}</span>
                </div>
              ))}
            </div>
            <label className={styles.formField}>
              <span>변경 사유 *</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 택배 기본 운임 변경" />
            </label>
            {saveError && <div className={styles.formError}>{saveError}</div>}
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmSave(null)}>취소</button>
              <button type="button" className={styles.primaryButton} onClick={commitSave}>변경 저장</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
