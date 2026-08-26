import { useState } from 'react';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './FeePolicyPage.module.css';
import {
  CALC_BASES,
  CALC_UNITS,
  FEE_TYPES,
  ROUNDING_UNITS,
  computeFeePreview,
  computeStatus,
  fmtCalc,
  type ApplyScope,
  type CalcBasis,
  type CalcMethod,
  type CalcUnit,
  type CancelFeePolicy,
  type FeeBearer,
  type FeePolicy,
  type FeeType,
  type RefundFeePolicy,
  type RoundingRule,
  type TaxTreatment,
} from './feePolicyData';

type Tab = 'basic' | 'calc' | 'cancelRefund' | 'preview' | 'history';

interface Props {
  initial: FeePolicy;
  isNew: boolean;
  startEditing?: boolean;
  issues: string[];
  onClose: () => void;
  onSave: (item: FeePolicy) => void;
  onToggleActive: (item: FeePolicy) => void;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  '적용중': { bg: '#ecfdf5', fg: '#047857' },
  '적용 예정': { bg: '#eff6ff', fg: '#1d4ed8' },
  '종료': { bg: '#f4f4f5', fg: '#71717a' },
  '비활성': { bg: '#f4f4f5', fg: '#a1a1aa' },
};

export function FeePolicyDrawer({ initial, isNew, startEditing = false, issues, onClose, onSave, onToggleActive }: Props) {
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(isNew || startEditing);
  const [tab, setTab] = useState<Tab>('basic');
  const [error, setError] = useState('');
  const [testAmount, setTestAmount] = useState(1000000);
  const set = <K extends keyof FeePolicy>(key: K, value: FeePolicy[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const status = computeStatus(draft);
  const statusColor = STATUS_COLOR[status];

  const save = () => {
    if (!draft.name.trim() || !draft.code.trim()) return setError('정책명과 정책 코드는 필수입니다.');
    if (draft.applyScope === '특정 대상' && !draft.applyTarget.trim()) return setError('적용 대상을 입력해 주세요.');
    if (draft.calcMethod === '정률' && draft.rate <= 0) return setError('수수료율을 입력해 주세요.');
    if (draft.calcMethod === '정액' && draft.fixedAmount <= 0) return setError('정액 수수료 금액을 입력해 주세요.');
    if (draft.maxFee !== null && draft.maxFee < draft.minFee) return setError('최대 수수료는 최소 수수료보다 크거나 같아야 합니다.');
    if (draft.endDate && draft.endDate < draft.startDate) return setError('적용 종료일은 시작일보다 빠를 수 없습니다.');
    onSave({ ...draft, name: draft.name.trim(), code: draft.code.trim().toUpperCase().replace(/\s+/g, '_') });
  };

  const preview = computeFeePreview(draft, testAmount);

  return (
    <aside className={`${drawer.aside} ${styles.feeDrawer}`} aria-label="수수료 정책 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{isNew ? '신규 수수료 정책' : draft.code}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{isNew ? '수수료 정책 등록' : draft.name}</h2>
              {!isNew && <span className={drawer.badge} style={{ background: statusColor.bg, color: statusColor.fg }}>{status}</span>}
              {!isNew && issues.length > 0 && <span className={drawer.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 설정 확인</span>}
            </div>
            {!isNew && <div className={drawer.sub}>{draft.feeType} · {fmtCalc(draft)} · 사용 {draft.usageCount.toLocaleString()}건 · 최근 수정 {draft.updatedAt} · {draft.updatedBy}</div>}
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
          {([['basic', '기본 정보'], ['calc', '계산 방식'], ['cancelRefund', '취소 · 환불'], ['preview', '계산 Preview'], ['history', '변경 이력']] as [Tab, string][]).map(([key, label]) => (
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
            <Section title="기본 정보">
              <FormField label="정책명 *"><input disabled={!editing} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 기본 거래 수수료" /></FormField>
              <FormField label="정책 코드 *" hint={!isNew ? '생성 후 변경할 수 없습니다.' : '영문 대문자와 밑줄 사용'}>
                <input disabled={!editing || !isNew} value={draft.code} onChange={(e) => set('code', e.target.value)} placeholder="BASE_TRANSACTION_FEE" />
              </FormField>
              <FormField label="수수료 유형 *">
                <select disabled={!editing} value={draft.feeType} onChange={(e) => set('feeType', e.target.value as FeeType)}>
                  {FEE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="설명"><textarea disabled={!editing} value={draft.description} onChange={(e) => set('description', e.target.value)} /></FormField>
            </Section>

            <Section title="적용 대상 · 부담 주체">
              <FormField label="적용 범위 *">
                <div className={styles.radioGroup}>
                  {(['전체 거래', '특정 대상'] as ApplyScope[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draft.applyScope === v} onChange={() => set('applyScope', v)} />{v}</label>
                  ))}
                </div>
              </FormField>
              {draft.applyScope === '특정 대상' && (
                <FormField label="적용 대상 *" hint="예: 카드 결제, 설치 서비스 상품">
                  <input disabled={!editing} value={draft.applyTarget} onChange={(e) => set('applyTarget', e.target.value)} />
                </FormField>
              )}
              <FormField label="부담 주체 *">
                <div className={styles.radioGroup}>
                  {(['구매자', '판매자 / 공급자', '플랫폼'] as FeeBearer[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draft.bearer === v} onChange={() => set('bearer', v)} />{v}</label>
                  ))}
                </div>
              </FormField>
            </Section>

            <Section title="적용 기간 · 우선순위">
              <div className={styles.formGrid}>
                <FormField label="적용 시작일 *"><input type="date" disabled={!editing} value={draft.startDate} onChange={(e) => set('startDate', e.target.value)} /></FormField>
                <FormField label="적용 종료일" hint="비워두면 상시 적용"><input type="date" disabled={!editing} value={draft.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || null)} /></FormField>
              </div>
              <FormField label="적용 우선순위" hint="숫자가 작을수록 우선 적용됩니다 (기본 정책 권장값: 6)">
                <input type="number" min={1} disabled={!editing} value={draft.priority} onChange={(e) => set('priority', Math.max(1, Number(e.target.value) || 1))} />
              </FormField>
              <label className={styles.toggleField}>
                <span>정책 사용</span>
                <button type="button" disabled={!editing} className={`${styles.switch} ${draft.active ? styles.switchOn : ''}`} onClick={() => set('active', !draft.active)}><i /></button>
              </label>
            </Section>

            <Section title="관리자 메모">
              <FormField label=""><textarea disabled={!editing} value={draft.adminMemo} onChange={(e) => set('adminMemo', e.target.value)} placeholder="내부 참고 메모" /></FormField>
            </Section>
          </>
        )}

        {tab === 'calc' && (
          <>
            <Section title="계산 방식">
              <div className={styles.radioGroup}>
                {(['정률', '정액'] as CalcMethod[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.calcMethod === v} onChange={() => set('calcMethod', v)} />{v}</label>
                ))}
              </div>
              {draft.calcMethod === '정률' ? (
                <div className={styles.formGrid}>
                  <FormField label="수수료율 * (%)"><input type="number" min={0} step={0.1} disabled={!editing} value={draft.rate} onChange={(e) => set('rate', Math.max(0, Number(e.target.value) || 0))} /></FormField>
                  <FormField label="계산 기준금액 *">
                    <select disabled={!editing} value={draft.calcBasis} onChange={(e) => set('calcBasis', e.target.value as CalcBasis)}>
                      {CALC_BASES.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </FormField>
                </div>
              ) : (
                <div className={styles.formGrid}>
                  <FormField label="정액 수수료 * (원)"><input type="number" min={0} disabled={!editing} value={draft.fixedAmount} onChange={(e) => set('fixedAmount', Math.max(0, Number(e.target.value) || 0))} /></FormField>
                  <FormField label="계산 단위 *">
                    <select disabled={!editing} value={draft.calcUnit} onChange={(e) => set('calcUnit', e.target.value as CalcUnit)}>
                      {CALC_UNITS.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  </FormField>
                </div>
              )}
            </Section>

            <Section title="최소 · 최대 수수료">
              <div className={styles.formGrid}>
                <FormField label="최소 수수료 (원)"><input type="number" min={0} disabled={!editing} value={draft.minFee} onChange={(e) => set('minFee', Math.max(0, Number(e.target.value) || 0))} /></FormField>
                <FormField label="최대 수수료 (원)" hint="비워두면 제한 없음">
                  <input type="number" min={0} disabled={!editing} value={draft.maxFee ?? ''} onChange={(e) => set('maxFee', e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} />
                </FormField>
              </div>
            </Section>

            <Section title="반올림 · 세금">
              <FormField label="수수료 금액 처리">
                <div className={styles.radioGroup}>
                  {(['절사', '반올림', '올림'] as RoundingRule[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draft.roundingRule === v} onChange={() => set('roundingRule', v)} />{v}</label>
                  ))}
                </div>
              </FormField>
              <FormField label="처리 단위">
                <select disabled={!editing} value={draft.roundingUnit} onChange={(e) => set('roundingUnit', Number(e.target.value))}>
                  {ROUNDING_UNITS.map((u) => <option key={u} value={u}>{u}원</option>)}
                </select>
              </FormField>
              <FormField label="수수료 부가세">
                <div className={styles.radioGroup}>
                  {(['포함', '별도', '비과세'] as TaxTreatment[]).map((v) => (
                    <label key={v}><input type="radio" disabled={!editing} checked={draft.taxTreatment === v} onChange={() => set('taxTreatment', v)} />{v}</label>
                  ))}
                </div>
              </FormField>
              <div className={styles.infoNote}>실제 세율 계산은 세금 정책을 참조합니다. 여기서는 수수료율에 부가세가 포함되어 있는지, 별도로 계산할지만 결정합니다.</div>
            </Section>
          </>
        )}

        {tab === 'cancelRefund' && (
          <>
            <Section title="취소 시 수수료">
              <div className={styles.radioGroup}>
                {(['전액 취소', '수수료 유지', '취소 정책 참조'] as CancelFeePolicy[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.cancelFeePolicy === v} onChange={() => set('cancelFeePolicy', v)} />{v}</label>
                ))}
              </div>
            </Section>
            <Section title="환불 시 수수료">
              <div className={styles.radioGroup}>
                {(['환불 비율만큼 감소', '유지', '전액 반환'] as RefundFeePolicy[]).map((v) => (
                  <label key={v}><input type="radio" disabled={!editing} checked={draft.refundFeePolicy === v} onChange={() => set('refundFeePolicy', v)} />{v}</label>
                ))}
              </div>
              <div className={styles.infoNote}>결제 수수료는 PG 정책상 환불 후에도 유지되는 경우가 많고, 판매 수수료는 환불 비율만큼 재계산하는 것이 일반적입니다. 이미 정산에 반영된 수수료는 직접 수정하지 않고 다음 정산에 조정으로 반영됩니다.</div>
            </Section>
          </>
        )}

        {tab === 'preview' && (
          <>
            <Section title="계산 Preview">
              <FormField label="테스트 기준금액 (원)"><input type="number" min={0} value={testAmount} onChange={(e) => setTestAmount(Math.max(0, Number(e.target.value) || 0))} /></FormField>
              <div className={styles.breakdownTable}>
                <div className={styles.breakdownRow}><span>기준금액</span><span>{preview.baseAmount.toLocaleString()}원</span></div>
                <div className={styles.breakdownRow}>
                  <span>{draft.calcMethod === '정률' ? `× 수수료율 ${draft.rate}%` : `정액 (${draft.calcUnit})`}</span>
                  <span>{Math.round(preview.rawFee).toLocaleString()}원</span>
                </div>
                {preview.clampedFee !== preview.rawFee && (
                  <div className={styles.breakdownRow}><span>최소/최대 수수료 적용</span><span>{Math.round(preview.clampedFee).toLocaleString()}원</span></div>
                )}
                <div className={styles.breakdownRow}><span>{draft.roundingRule} ({draft.roundingUnit}원 단위)</span><span>{preview.roundedFee.toLocaleString()}원</span></div>
                {draft.taxTreatment === '별도' && (
                  <div className={styles.breakdownRow}><span>+ 부가세 (10%)</span><span>{preview.taxAmount.toLocaleString()}원</span></div>
                )}
                <div className={`${styles.breakdownRow} ${styles.breakdownRowTotal}`}><span>총 수수료</span><span>{preview.totalFee.toLocaleString()}원</span></div>
              </div>
              <div className={styles.infoNote}>현재 저장된(적용중인) 정책 기준으로 계산합니다. 실제 거래에서는 계산 당시 정책 Snapshot과 계산 Breakdown이 함께 보존됩니다.</div>
            </Section>
          </>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={styles.formSection}><h3>{title}</h3>{children}</section>;
}
function FormField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className={styles.formField}><span>{label}{hint && <small>{hint}</small>}</span>{children}</label>;
}
