import { useRef } from 'react';
import styles from './SupplyPriceDetailDrawer.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { SupplyPriceDetail } from './supplyPriceDetail';

const TABS: [string, string][] = [
  ['basic', '기본정보'],
  ['cond', '적용 조건'],
  ['compare', '가격 비교'],
  ['contract', '연결 계약'],
  ['history', '변경 이력'],
];

interface Props {
  detail: SupplyPriceDetail;
  tab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showChangePanel: boolean;
  onToggleChange: () => void;
  newPrice: string;
  onNewPriceChange: (value: string) => void;
  diffLabel: string;
  diffFg: string;
  onConfirmChange: () => void;
  showEndPanel: boolean;
  onToggleEnd: () => void;
  onConfirmEnd: () => void;
}

export function SupplyPriceDetailDrawer({
  detail: d,
  tab,
  onTabChange,
  onClose,
  showChangePanel,
  onToggleChange,
  newPrice,
  onNewPriceChange,
  diffLabel,
  diffFg,
  onConfirmChange,
  showEndPanel,
  onToggleEnd,
  onConfirmEnd,
}: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.nameCol}>
            <div className={styles.eyebrow}>공급가 상세 · {d.priceId}</div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{d.name}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
              <span className={styles.badge} style={{ background: '#f4f4f5', color: '#52525b' }}>{d.priceType}</span>
            </div>
            <div className={styles.subLine}>적용대상 · {d.target}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {d.isContractLocked && (
          <div className={styles.lockedNote}>이 공급가는 계약에 의해 관리됩니다. 가격을 변경하려면 계약을 수정해 주세요.</div>
        )}

        <div className={styles.actionsRow}>
          {d.isContractLocked && (
            <button type="button" className={`${styles.secondaryBtn} ${styles.disabled}`} disabled>공급가 변경</button>
          )}
          {d.canEdit && (
            <button type="button" className={styles.secondaryBtn} onClick={onToggleChange}>공급가 변경</button>
          )}
          <div className={styles.actionsSpacer} />
          {d.canEdit && (
            <button type="button" className={styles.dangerBtn} onClick={onToggleEnd}>적용 종료</button>
          )}
        </div>

        {showChangePanel && (
          <div className={styles.changePanel}>
            <div className={styles.changeTitle}>공급가 변경</div>
            <div className={styles.changeRow}>
              <label className={styles.changeField}>
                변경 공급가
                <input
                  className={styles.changeInput}
                  value={newPrice}
                  onChange={(e) => onNewPriceChange(e.target.value)}
                />
              </label>
              <label className={styles.changeField}>
                적용 시작일
                <input className={styles.changeInput} defaultValue="" />
              </label>
            </div>
            <div className={styles.changeDiff}>
              변경폭 <b style={{ color: diffFg }}>{diffLabel}</b>
            </div>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.ghostBtn} onClick={onToggleChange}>취소</button>
              <button type="button" className={styles.confirmPrimaryBtn} onClick={onConfirmChange}>변경 적용</button>
            </div>
          </div>
        )}

        {showEndPanel && (
          <div className={styles.confirmPanel}>
            <div className={styles.confirmText}>
              공급가 적용을 종료하시겠습니까?
              <br />
              현재 공급가 {d.priceLabel} · 종료 후 다음 적용 가격이 없으면 기본 공급가가 사용됩니다.
            </div>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.ghostBtn} onClick={onToggleEnd}>취소</button>
              <button type="button" className={styles.confirmDangerBtn} onClick={onConfirmEnd}>적용 종료</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`${styles.tabBtn} ${tab === key ? styles.active : ''}`}
              onClick={() => onTabChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {tab === 'basic' && (
          <div>
            <div className={styles.sectionLabel}>기본정보</div>
            <div className={styles.fieldsBox}>
              {d.basicFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <a href="#">상품 상세 보기</a>
          </div>
        )}

        {tab === 'cond' && (
          <div>
            <div className={styles.sectionLabel}>적용 조건</div>
            <div className={styles.fieldsBox}>
              {d.condFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            {d.hasTiers && (
              <>
                <div className={styles.sectionLabel}>수량구간별 공급가</div>
                <div className={styles.miniTable}>
                  <div className={styles.miniHeadRow} style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <span>수량구간</span>
                    <span style={{ textAlign: 'right' }}>공급가</span>
                  </div>
                  {d.tiers.map((tr) => (
                    <div className={styles.miniRow} style={{ gridTemplateColumns: '1fr 1fr' }} key={tr.range}>
                      <span style={{ fontSize: '12.5px', color: '#3f3f46' }}>{tr.range}</span>
                      <span style={{ fontSize: '12.5px', color: '#18181b', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{tr.price}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {d.showsScheduled && (
              <div className={styles.scheduledBox}>
                <div className={styles.scheduledTitle}>변경 예정</div>
                <div className={styles.scheduledBody}>{d.scheduledPeriod} · {d.scheduledPrice}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'compare' && (
          <div>
            <div className={styles.sectionLabel}>가격 비교</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 14 }}>
              {d.compareFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {d.showDiscountWarning && (
              <div className={styles.warningBox}>⚠ 기본 공급가 대비 30% 이상 낮습니다.</div>
            )}
            {d.showBelowCost && (
              <div className={styles.dangerBox}>⚠ 공급가가 원가보다 낮습니다. (원가 {d.cost})</div>
            )}
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>가격 적용 우선순위</div>
            <div className={styles.priorityNote}>계약 공급가 → 거래처별 공급가 → 거래처 그룹 공급가 → 수량구간 공급가 → 기본 공급가</div>
          </div>
        )}

        {tab === 'contract' && (
          <div>
            <div className={styles.sectionLabel}>연결 계약</div>
            {d.hasContract ? (
              <>
                <div className={styles.fieldsBox} style={{ marginBottom: 12 }}>
                  {d.contractFields.map((f) => (
                    <div className={styles.fieldRow} key={f.label}>
                      <span className={styles.fieldLabel}>{f.label}</span>
                      <span className={styles.fieldValue}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <a href="#">계약 상세 보기</a>
              </>
            ) : (
              <div className={styles.mutedText}>연결된 계약이 없습니다.</div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 2 }}>변경 이력</div>
            <div className={styles.sectionSub}>이전 가격 · 변경 가격 · 적용일 · 사유를 추적합니다</div>
            {d.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineTitle}>{h.from} → {h.to}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineFrom}>적용일 {h.applyDate} · 사유 {h.reason}</div>
                  <div className={styles.timelineAdmin}>{h.admin}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
