import styles from './PartnerPricingDetailDrawer.module.css';
import type { PartnerPricingDetail } from './partnerPricingDetail';

const TABS: [string, string][] = [
  ['info', '가격 정보'],
  ['cond', '적용 조건'],
  ['compare', '가격 비교'],
  ['contract', '계약/정책'],
  ['history', '변경 이력'],
];

interface Props {
  detail: PartnerPricingDetail;
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

export function PartnerPricingDetailDrawer({
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
  return (
    <aside className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.nameCol}>
            <div className={styles.eyebrow}>거래처별 가격 상세 · {d.id}</div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{d.partner} × {d.name}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
            </div>
            <div className={styles.subLine}>
              최종 적용가 <b>{d.finalPriceLabel}</b> · 근거 {d.basisLabel}
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {d.isContractLocked && (
          <div className={styles.lockedNote}>이 거래는 계약 단가가 우선 적용됩니다. 가격을 변경하려면 계약을 수정해 주세요.</div>
        )}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.linkBtn}>회사 상세</button>
          <button type="button" className={styles.linkBtn}>상품 상세</button>
          <div className={styles.actionsSpacer} />
          {d.canEdit && (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={onToggleChange}>가격 변경</button>
              <button type="button" className={styles.dangerBtn} onClick={onToggleEnd}>적용 종료</button>
            </>
          )}
        </div>

        {showChangePanel && (
          <div className={styles.changePanel}>
            <div className={styles.changeTitle}>거래처 가격 변경</div>
            <div className={styles.changeRow}>
              <label className={styles.changeField}>
                변경 가격
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
              가격 적용을 종료하시겠습니까?
              <br />
              현재 가격 {d.priceLabel} · 종료 후 기본 공급가 {d.baseLabel}가 적용됩니다.
            </div>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.ghostBtn} onClick={onToggleEnd}>취소</button>
              <button type="button" className={styles.confirmDangerBtn} onClick={onConfirmEnd}>가격 적용 종료</button>
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
        {tab === 'info' && (
          <div>
            <div className={styles.sectionLabel}>가격 정보</div>
            <div className={styles.fieldsBox}>
              {d.infoFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
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
            {d.showsScheduled && (
              <div className={styles.scheduledBox}>
                <div className={styles.scheduledTitle}>변경 예정</div>
                <div className={styles.scheduledBody}>{d.scheduledLabel}</div>
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
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>현재 가격 적용 우선순위</div>
            <div className={styles.priorityNote}>계약 단가 → 거래처별 가격 → 거래처 그룹 가격 → 기본 공급가</div>
          </div>
        )}

        {tab === 'contract' && (
          <div>
            <div className={styles.sectionLabel}>계약 / 정책</div>
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
              <div className={styles.mutedText}>연결된 계약이 없습니다. 거래처별 가격이 그대로 적용됩니다.</div>
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
