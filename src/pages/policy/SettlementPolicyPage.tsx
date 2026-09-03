import { useMemo, useState } from 'react';
import shared from '../ops/opsShared.module.css';
import timeline from '../ops/opsDrawerShared.module.css';
import styles from './SettlementPolicyPage.module.css';
import { CommonButton } from '../../components/common';
import {
  INITIAL_HISTORY,
  INITIAL_LAST_MODIFIED,
  INITIAL_POLICY,
  TEST_TARGETS,
  computeSettlementBreakdown,
  computeWarnings,
  describePolicyChanges,
  fmtWon,
  signed,
  type ConfirmMode,
  type FieldDiff,
  type HolidayPolicy,
  type LastModified,
  type NegativeSettlementPolicy,
  type PayMethod,
  type PolicyHistoryEntry,
  type PostConfirmRefundPolicy,
  type PreCloseCancelPolicy,
  type SettlementAmountBasis,
  type SettlementCreationTiming,
  type SettlementCycle,
  type SettlementDateBasis,
  type SettlementPolicy,
  type SettlementTargetBasis,
  type ShortfallPolicy,
} from './settlementPolicyData';

type Tab = 'basic' | 'cycle' | 'amount' | 'confirm' | 'preview' | 'history';
const TABS: [Tab, string][] = [
  ['basic', '기본 정책'],
  ['cycle', '주기 · 마감'],
  ['amount', '정산 금액'],
  ['confirm', '확정 · 이월'],
  ['preview', '정책 Preview'],
  ['history', '변경 이력'],
];

export function SettlementPolicyPage() {
  const [policy, setPolicy] = useState(INITIAL_POLICY);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [lastModified, setLastModified] = useState<LastModified>(INITIAL_LAST_MODIFIED);

  const [tab, setTab] = useState<Tab>('basic');
  const [editing, setEditing] = useState(false);
  const [draftPolicy, setDraftPolicy] = useState(policy);
  const [confirmSave, setConfirmSave] = useState<FieldDiff[] | null>(null);
  const [reason, setReason] = useState('');
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState('');

  const [previewTargetId, setPreviewTargetId] = useState(TEST_TARGETS[0].id);

  const warnings = useMemo(() => computeWarnings(editing ? draftPolicy : policy), [editing, draftPolicy, policy]);

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const set = <K extends keyof SettlementPolicy>(key: K, value: SettlementPolicy[K]) => {
    if (!editing) {
      setDraftPolicy({ ...policy, [key]: value });
      setEditing(true);
      toastBriefly('정산 정책 수정 모드로 전환되었습니다.');
      return;
    }
    setDraftPolicy((current) => ({ ...current, [key]: value }));
  };

  const startEdit = () => {
    setDraftPolicy(policy);
    setEditing(true);
    toastBriefly('정산 정책 수정 모드입니다. 변경 후 상단의 [변경 사항 저장]을 클릭하세요.');
  };
  const cancelEdit = () => {
    setEditing(false);
    setDraftPolicy(policy);
    toastBriefly('수정을 취소했습니다.');
  };
  const requestSave = () => {
    const diffs = describePolicyChanges(policy, draftPolicy);
    if (diffs.length === 0) {
      setEditing(false);
      toastBriefly('변경된 내용이 없어 수정 모드를 종료합니다.');
      return;
    }
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
    setLastModified({ at: '2026-08-31', by: '운영 관리자' });
    setConfirmSave(null);
    setEditing(false);
    toastBriefly('정산 정책을 저장했습니다.');
  };

  const previewTarget = TEST_TARGETS.find((t) => t.id === previewTargetId)!;
  const previewBreakdown = computeSettlementBreakdown(previewTarget, policy);

  const heroClass = previewBreakdown.status === '지급 대상'
    ? styles.resultHero
    : previewBreakdown.status.startsWith('마이너스')
      ? `${styles.resultHero} ${styles.resultHeroNeg}`
      : `${styles.resultHero} ${styles.resultHeroWarn}`;

  return (
    <section className={shared.page}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <div className={styles.eyebrow}>거래 정책</div>
            <h1 className={shared.title}>정산 정책</h1>
            <p className={shared.subtitle}>어떤 거래를 언제 정산 대상으로 잡고, 어떤 기준으로 확정·지급할지 설정합니다.</p>
          </div>
          <div className={styles.headMeta}>
            {!editing && <span className={styles.headMetaText}>최종 수정 {lastModified.at} · {lastModified.by}</span>}
            {!editing ? (
              <>
                <button type="button" className={styles.outlineBtn} onClick={() => setTab('history')}>변경 이력</button>
                <button type="button" className={styles.darkBtn} onClick={startEdit}>✏️ 정책 수정</button>
              </>
            ) : (
              <>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>수정 취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>💾 변경 사항 저장</button>
              </>
            )}
          </div>
        </div>

        <div className={`${styles.modeBanner} ${editing ? styles.modeBannerEdit : styles.modeBannerRead}`}>
          <div className={styles.modeBannerLeft}>
            <span className={`${styles.modeTag} ${editing ? styles.modeTagEdit : styles.modeTagRead}`}>
              {editing ? '수정 모드' : '조회 모드'}
            </span>
            <span>
              {editing
                ? '정책을 편집 중입니다. 변경을 마치면 [변경 사항 저장] 버튼을 눌러 확정하세요.'
                : '현재 적용 중인 정책입니다. 버튼이나 스위치를 클릭하면 즉시 수정 모드로 전환됩니다.'}
            </span>
          </div>
          {!editing && (
            <button type="button" className={styles.modeActionBtn} onClick={startEdit}>
              정책 수정 시작
            </button>
          )}
        </div>

        <div className={shared.quickFilters}>
          {TABS.map(([key, label]) => {
            const active = tab === key;
            return (
              <CommonButton
                key={key}
                type="button"
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${shared.qfBtn} ${active ? shared.quickActive : ''}`}
                onClick={() => setTab(key)}
              >
                <span className={shared.qfLabel}>{label}</span>
              </CommonButton>
            );
          })}
        </div>
      </div>

      <div className={styles.body}>
        {warnings.length > 0 && (
          <div className={styles.warningBanner}>
            <span className={styles.warningIcon}>!</span>
            <div className={styles.warningBody}>
              <div className={styles.warningTitle}>설정 확인 필요 · {warnings.length}건</div>
              <div className={styles.warningList}>
                {warnings.map((w) => <div key={w.id} className={styles.warningItem}>{w.message}</div>)}
              </div>
            </div>
            <button type="button" className={styles.warningActionBtn} onClick={() => setTab('confirm')}>확정 탭에서 확인</button>
          </div>
        )}

        {/* ── 기본 정책 ── */}
        {tab === 'basic' && (
          <>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHead}><h2>현재 정책 요약</h2></div>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>정산 사용</div><div className={styles.summaryTileValue}>{policy.settlementEnabled ? '사용' : '사용 안 함'}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>정산 대상 기준</div><div className={styles.summaryTileValue}>{policy.targetBasis}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>정산 주기</div><div className={styles.summaryTileValue}>{policy.cycle}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>정산 마감</div><div className={styles.summaryTileValue}>{policy.closingDayOfMonth === 0 ? '매월 말일' : `매월 ${policy.closingDayOfMonth}일`}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>지급 예정</div><div className={styles.summaryTileValue}>{policy.payDayOfMonth === 0 ? '익월 말일' : `익월 ${policy.payDayOfMonth}일`}</div></div>
                <div className={styles.summaryTile}><div className={styles.summaryTileLabel}>정산 확정</div><div className={styles.summaryTileValue}>{policy.confirmMode}</div></div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>정산 사용</div>
                <div className={styles.cardDesc}>정산 기능 사용 여부와 자동 생성 설정입니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.settlementEnabled ? styles.switchOn : ''}`} onClick={() => set('settlementEnabled', !draftPolicy.settlementEnabled)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>정산 기능 사용</div>
                  </div>
                </div>
                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.autoCreateEnabled ? styles.switchOn : ''}`} onClick={() => set('autoCreateEnabled', !draftPolicy.autoCreateEnabled)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>정산 자동 생성</div>
                    <div className={styles.toggleRowDesc}>마감된 정산 기간에 대해 시스템이 자동으로 정산건을 생성합니다</div>
                  </div>
                </div>
                <div className={styles.dividerTop}>
                  <div className={styles.fieldLabel}>정산 생성 시점</div>
                  <div className={styles.pillGroup}>
                    {(['마감일 이후 자동 생성', '지급 예정일 기준 자동 생성', '관리자 직접 생성'] as SettlementCreationTiming[]).map((v) => (
                      <button key={v} type="button" disabled={!draftPolicy.autoCreateEnabled} className={`${styles.pillBtn} ${draftPolicy.creationTiming === v ? styles.pillBtnOn : ''}`} onClick={() => set('creationTiming', v)}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>정산 대상 기준</div>
                <div className={styles.cardDesc}>어떤 시점을 지나야 정산 가능한 매출로 인정하는지와, 기간 계산에 사용할 날짜를 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.fieldLabel}>정산 대상 기준 <span className={styles.fieldLabelHint}>이 시점을 지나야 정산 대상</span></div>
                    <div className={styles.pillGroup}>
                      {(['결제 완료', '주문 완료', '배송 완료', '거래 확정', '구매 확정'] as SettlementTargetBasis[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.targetBasis === v ? styles.pillBtnOn : ''}`} onClick={() => set('targetBasis', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>정산 기준일 <span className={styles.fieldLabelHint}>기간 계산에 사용하는 날짜</span></div>
                    <div className={styles.pillGroup}>
                      {(['정산 대상 확정일', '주문일', '결제일', '배송 완료일', '구매 확정일'] as SettlementDateBasis[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.dateBasis === v ? styles.pillBtnOn : ''}`} onClick={() => set('dateBasis', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.lockedNote}>정산 대상 여부와 정산 상태는 별개입니다. '배송 완료 = 정산 완료'가 아니라, 배송 완료 이후 정산 기간에 포함되어야 정산건이 생성됩니다.</div>
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 다음 정산 기간부터 적용되며, 이미 생성·확정된 정산은 영향 없습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {/* ── 주기 · 마감 ── */}
        {tab === 'cycle' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>정산 주기</div>
                <div className={styles.cardDesc}>정산을 얼마 간격으로 마감하고, 지급 예정일을 어떻게 계산할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>정산 주기</div>
                  <div className={styles.pillGroup}>
                    {(['매일', '주 1회', '월 1회', '직접 설정'] as SettlementCycle[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.cycle === v ? styles.pillBtnOn : ''}`} onClick={() => set('cycle', v)}>{v}</button>
                    ))}
                  </div>
                </div>

                {draftPolicy.cycle === '월 1회' ? (
                  <div className={styles.cardGrid}>
                    <div>
                      <div className={styles.fieldLabel}>정산 마감일 <span className={styles.fieldLabelHint}>0 = 말일</span></div>
                      <input type="number" min={0} max={31} className={styles.textField} style={{ width: 120 }} value={draftPolicy.closingDayOfMonth} onChange={(e) => set('closingDayOfMonth', Math.max(0, Math.min(31, Number(e.target.value) || 0)))} />
                    </div>
                    <div>
                      <div className={styles.fieldLabel}>지급 예정일 (익월) <span className={styles.fieldLabelHint}>0 = 말일</span></div>
                      <input type="number" min={0} max={31} className={styles.textField} style={{ width: 120 }} value={draftPolicy.payDayOfMonth} onChange={(e) => set('payDayOfMonth', Math.max(0, Math.min(31, Number(e.target.value) || 0)))} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={styles.fieldLabel}>지급 예정일 <span className={styles.fieldLabelHint}>마감 후 N영업일</span></div>
                    <input type="number" min={0} className={styles.textField} style={{ width: 120 }} value={draftPolicy.payOffsetDays} onChange={(e) => set('payOffsetDays', Math.max(0, Number(e.target.value) || 0))} />
                  </div>
                )}

                <div className={styles.dividerTop}>
                  <div className={styles.fieldLabel}>지급 예정일이 휴일인 경우</div>
                  <div className={styles.pillGroup}>
                    {(['이전 영업일', '다음 영업일', '날짜 유지'] as HolidayPolicy[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.holidayPolicy === v ? styles.pillBtnOn : ''}`} onClick={() => set('holidayPolicy', v)}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.lockedNote}>실제 공휴일 계산은 공통 Calendar를 참조합니다. 이 페이지의 Preview는 토요일·일요일 기준으로 간단히 계산합니다.</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>지급 방법</div>
                <div className={styles.cardDesc}>정산금을 어떤 방식으로 지급할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>지급 방법</div>
                  <div className={styles.pillGroup}>
                    {(['계좌이체', '외부 지급시스템', '수동 지급'] as PayMethod[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.payMethod === v ? styles.pillBtnOn : ''}`} onClick={() => set('payMethod', v)}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.lockedNote}>지급 대상별 계좌 정보는 거래처/정산 대상 마스터에서 관리합니다.</div>
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 다음 정산 기간부터 적용되며, 이미 생성·확정된 정산은 영향 없습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {/* ── 정산 금액 ── */}
        {tab === 'amount' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>정산금액 구성</div>
                <div className={styles.cardDesc}>정산금액에 포함하거나 차감할 항목을 설정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.includeShippingFee ? styles.switchOn : ''}`} onClick={() => set('includeShippingFee', !draftPolicy.includeShippingFee)}><i /></button>
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>배송비 포함</div></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.includeOtherServiceAmount ? styles.switchOn : ''}`} onClick={() => set('includeOtherServiceAmount', !draftPolicy.includeOtherServiceAmount)}><i /></button>
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>기타 서비스금액 포함</div></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.deductCancel ? styles.switchOn : ''}`} onClick={() => set('deductCancel', !draftPolicy.deductCancel)}><i /></button>
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>취소 차감</div></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.deductRefund ? styles.switchOn : ''}`} onClick={() => set('deductRefund', !draftPolicy.deductRefund)}><i /></button>
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>환불 차감</div></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.deductFee ? styles.switchOn : ''}`} onClick={() => set('deductFee', !draftPolicy.deductFee)}><i /></button>
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>수수료 차감</div></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.deductDiscountShare ? styles.switchOn : ''}`} onClick={() => set('deductDiscountShare', !draftPolicy.deductDiscountShare)}><i /></button>
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>할인 분담액 차감</div></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.includeAdjustment ? styles.switchOn : ''}`} onClick={() => set('includeAdjustment', !draftPolicy.includeAdjustment)}><i /></button>
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>조정금액 반영</div></div>
                  </div>
                  <div className={styles.toggleRow}>
                    <button type="button" className={`${styles.switch} ${draftPolicy.includeCarryOver ? styles.switchOn : ''}`} onClick={() => set('includeCarryOver', !draftPolicy.includeCarryOver)}><i /></button>
                    <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>이전 정산 이월금 반영</div></div>
                  </div>
                </div>

                <div className={styles.dividerTop}>
                  <div className={styles.fieldLabel}>정산 기준금액</div>
                  <div className={styles.pillGroup}>
                    {(['공급가액', '공급가액 + 세액'] as SettlementAmountBasis[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.amountBasis === v ? styles.pillBtnOn : ''}`} onClick={() => set('amountBasis', v)}>{v}</button>
                    ))}
                  </div>
                </div>

                <div className={styles.lockedNote}>수수료율·세율 등 각 금액의 계산식은 수수료 정책·세금 정책을 참조합니다. 이 화면에서는 어떤 항목을 정산에 포함할지만 결정합니다.</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>정산금액 계산식</div>
                <div className={styles.cardDesc}>최종 정산금액은 아래 순서로 계산됩니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.formulaNote}>
                  <span>거래금액</span><em>−</em><span>취소·환불</span><em>−</em><span>수수료</span><em>±</em><span>조정·이월</span><em>=</em><span>최종 정산금액</span>
                </div>
                <div className={styles.lockedNote}>계산 결과와 적용 당시 정책은 정산 생성 시 Snapshot으로 함께 보존됩니다. 이후 정책이 변경되어도 이미 생성된 정산금액은 다시 계산되지 않습니다.</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>취소 · 환불 반영 시점</div>
                <div className={styles.cardDesc}>정산 마감 전후에 발생한 취소·환불을 어떻게 처리할지 정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardGrid}>
                  <div>
                    <div className={styles.fieldLabel}>정산 마감 전 취소</div>
                    <div className={styles.pillGroup}>
                      {(['해당 정산에서 제외', '다음 정산에서 차감'] as PreCloseCancelPolicy[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.preCloseCancelPolicy === v ? styles.pillBtnOn : ''}`} onClick={() => set('preCloseCancelPolicy', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className={styles.fieldLabel}>정산 확정 후 발생한 환불</div>
                    <div className={styles.pillGroup}>
                      {(['다음 정산에서 자동 차감', '별도 조정 승인 후 반영'] as PostConfirmRefundPolicy[]).map((v) => (
                        <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.postConfirmRefundPolicy === v ? styles.pillBtnOn : ''}`} onClick={() => set('postConfirmRefundPolicy', v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 다음 정산 기간부터 적용되며, 이미 생성·확정된 정산은 영향 없습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {/* ── 확정 · 이월 ── */}
        {tab === 'confirm' && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>정산 확정</div>
                <div className={styles.cardDesc}>정산 확정 방식과 확정 조건을 설정합니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>확정 방식</div>
                  <div className={styles.pillGroup}>
                    {(['관리자 수동 확정', '조건 충족 시 자동 확정'] as ConfirmMode[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.confirmMode === v ? styles.pillBtnOn : ''}`} onClick={() => set('confirmMode', v)}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.dividerTop}>
                  <div className={styles.fieldLabel}>확정 조건</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className={styles.toggleRow}>
                      <button type="button" className={`${styles.switch} ${draftPolicy.requireNoUnsettledTx ? styles.switchOn : ''}`} onClick={() => set('requireNoUnsettledTx', !draftPolicy.requireNoUnsettledTx)}><i /></button>
                      <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>미확정 거래 없음</div></div>
                    </div>
                    <div className={styles.toggleRow}>
                      <button type="button" className={`${styles.switch} ${draftPolicy.requireNoUnprocessedRefund ? styles.switchOn : ''}`} onClick={() => set('requireNoUnprocessedRefund', !draftPolicy.requireNoUnprocessedRefund)}><i /></button>
                      <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>미처리 환불 없음</div></div>
                    </div>
                    <div className={styles.toggleRow}>
                      <button type="button" className={`${styles.switch} ${draftPolicy.requireNoUnapprovedAdjustment ? styles.switchOn : ''}`} onClick={() => set('requireNoUnapprovedAdjustment', !draftPolicy.requireNoUnapprovedAdjustment)}><i /></button>
                      <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>미승인 조정 없음</div></div>
                    </div>
                    <div className={styles.toggleRow}>
                      <button type="button" className={`${styles.switch} ${draftPolicy.requirePayoutInfo ? styles.switchOn : ''}`} onClick={() => set('requirePayoutInfo', !draftPolicy.requirePayoutInfo)}><i /></button>
                      <div className={styles.toggleRowText}><div className={styles.toggleRowTitle}>지급정보 존재</div></div>
                    </div>
                  </div>
                </div>
                <div className={styles.lockedNote}>정산 확정 이후에는 금액이 재계산되지 않습니다. 확정 후 발생하는 취소·환불·조정은 다음 정산에 반영됩니다.</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>최소 지급금액 · 이월</div>
                <div className={styles.cardDesc}>정산금액이 최소 기준에 미달할 때의 처리 방식입니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>최소 지급금액</div>
                  <input type="number" min={0} className={styles.textField} style={{ width: 160 }} value={draftPolicy.minPayoutAmount} onChange={(e) => set('minPayoutAmount', Math.max(0, Number(e.target.value) || 0))} />
                </div>
                <div>
                  <div className={styles.fieldLabel}>미달 시 처리</div>
                  <div className={styles.pillGroup}>
                    {(['다음 정산으로 이월', '그대로 지급', '관리자 확인'] as ShortfallPolicy[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.shortfallPolicy === v ? styles.pillBtnOn : ''}`} onClick={() => set('shortfallPolicy', v)}>{v}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>마이너스 정산</div>
                <div className={styles.cardDesc}>환불이 매출보다 커서 정산금액이 음수가 되는 경우의 처리 방식입니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div>
                  <div className={styles.fieldLabel}>마이너스 정산 처리</div>
                  <div className={styles.pillGroup}>
                    {(['다음 정산으로 이월', '지급 보류', '관리자 확인'] as NegativeSettlementPolicy[]).map((v) => (
                      <button key={v} type="button" className={`${styles.pillBtn} ${draftPolicy.negativeSettlementPolicy === v ? styles.pillBtnOn : ''}`} onClick={() => set('negativeSettlementPolicy', v)}>{v}</button>
                    ))}
                  </div>
                </div>
                <div className={styles.lockedNote}>이월된 금액은 다음 정산 Breakdown에 별도 항목으로 표시됩니다.</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>지급 실패 처리</div>
                <div className={styles.cardDesc}>지급 요청 실패 시 재시도 허용 여부와 자동 재시도 설정입니다.</div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.toggleRow}>
                  <button type="button" className={`${styles.switch} ${draftPolicy.failureRetryEnabled ? styles.switchOn : ''}`} onClick={() => set('failureRetryEnabled', !draftPolicy.failureRetryEnabled)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>지급 실패 재시도 허용</div>
                  </div>
                </div>
                <div className={styles.toggleRow}>
                  <button type="button" disabled={!draftPolicy.failureRetryEnabled} className={`${styles.switch} ${draftPolicy.autoRetryEnabled ? styles.switchOn : ''}`} onClick={() => set('autoRetryEnabled', !draftPolicy.autoRetryEnabled)}><i /></button>
                  <div className={styles.toggleRowText}>
                    <div className={styles.toggleRowTitle}>자동 재시도</div>
                    <div className={styles.toggleRowDesc}>실패 시 시스템이 자동으로 재요청합니다</div>
                  </div>
                </div>
                {draftPolicy.autoRetryEnabled && (
                  <div>
                    <div className={styles.fieldLabel}>최대 자동 재시도</div>
                    <input type="number" min={1} className={styles.textField} style={{ width: 120 }} value={draftPolicy.maxRetryCount} onChange={(e) => set('maxRetryCount', Math.max(1, Number(e.target.value) || 1))} />
                  </div>
                )}
                <div className={styles.lockedNote}>정산 확정 상태와 지급 상태는 분리되어 관리됩니다. 지급이 실패해도 확정된 정산금액은 유지되며, 중복 지급 방지는 시스템 기본 안전장치로 항상 적용됩니다.</div>
              </div>
            </div>

            {editing && (
              <div className={styles.footerBar}>
                <span className={styles.footerNote}>저장하면 다음 정산 기간부터 적용되며, 이미 생성·확정된 정산은 영향 없습니다.</span>
                <button type="button" className={styles.outlineBtn} onClick={cancelEdit}>취소</button>
                <button type="button" className={styles.darkBtn} onClick={requestSave}>저장</button>
              </div>
            )}
          </>
        )}

        {/* ── 정책 Preview ── */}
        {tab === 'preview' && (
          <div className={styles.previewGrid}>
            <div className={styles.previewCard}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>테스트 정산 대상 선택</div>
                <div className={styles.cardDesc}>현재 저장된(적용중인) 정책 기준으로 계산합니다.</div>
              </div>
              <div className={styles.previewCardBody}>
                <div className={styles.orderPick}>
                  {TEST_TARGETS.map((t) => (
                    <button key={t.id} type="button" className={`${styles.orderOption} ${previewTargetId === t.id ? styles.orderOptionActive : ''}`} onClick={() => setPreviewTargetId(t.id)}>
                      <span><strong>{t.name}</strong> · {t.period}</span>
                      <span>{t.txCount}건</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.previewCard}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>정산 예상 결과</div>
              </div>
              <div className={styles.previewCardBody}>
                <div className={heroClass}>
                  <span>{previewTarget.id} · {previewTarget.name} · {previewTarget.period}</span>
                  <strong>{previewBreakdown.status}</strong>
                </div>
                <div className={styles.breakdownTable}>
                  {previewBreakdown.items.map((item, i) => (
                    <div key={i} className={styles.breakdownRow}>
                      <span>{item.label}</span>
                      <span className={item.amount < 0 ? styles.breakdownNeg : styles.breakdownPos}>{signed(item.amount)}</span>
                    </div>
                  ))}
                  <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}>
                    <span>지급 예정 금액</span>
                    <span>{fmtWon(previewBreakdown.payoutAmount)}</span>
                  </div>
                </div>
                {previewBreakdown.carryOverToNext !== 0 && (
                  <div className={styles.noteList}>
                    <div>⚠ {signed(previewBreakdown.carryOverToNext)}이(가) 다음 정산으로 이월됩니다.</div>
                  </div>
                )}
                <div className={styles.resultRow}><span>지급 예정일</span><strong>{previewBreakdown.payDate}{previewBreakdown.payDateShifted ? ' (휴일 조정됨)' : ''}</strong></div>
                <div className={styles.resultRow}><span>대상 거래</span><strong>{previewTarget.txCount}건</strong></div>
                {previewTarget.excluded.length > 0 && (
                  <div className={styles.excludedList}>
                    <h4>정산 제외 ({previewTarget.excluded.reduce((s, e) => s + e.count, 0)}건)</h4>
                    {previewTarget.excluded.map((e) => (
                      <div key={e.label} className={styles.excludedRow}><span>{e.label}</span><span>{e.count}건</span></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 변경 이력 ── */}
        {tab === 'history' && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.cardTitle}>변경 이력</div>
              <div className={styles.cardDesc}>정산 정책 설정 변경 기록입니다.</div>
            </div>
            <div className={styles.cardBody}>
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
            </div>
          </div>
        )}
      </div>

      {confirmSave && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmSave(null); }}>
          <div className={`${shared.dialogBox} ${styles.saveDialog}`}>
            <h2 className={shared.dialogTitle}>정산 정책 변경 확인</h2>
            <p className={shared.dialogBody}>변경 사항은 다음 정산 기간부터 적용됩니다. 이미 생성·확정된 정산은 생성 당시 정책 Snapshot 기준으로 유지됩니다.</p>
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
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 정산 검토 기간 확보를 위한 지급일 조정" />
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
