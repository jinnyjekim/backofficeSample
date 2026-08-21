import styles from './MinOrderQtyDetailDrawer.module.css';
import type { MoqDetail } from './minOrderQtyDetail';

const TABS: [string, string][] = [
  ['basic', '기본정보'],
  ['cond', '주문 조건'],
  ['compare', '기본조건 비교'],
  ['contract', '연결 계약'],
  ['history', '변경 이력'],
];

interface Props {
  detail: MoqDetail;
  tab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showChangePanel: boolean;
  onToggleChange: () => void;
  newMoq: string;
  onNewMoqChange: (value: string) => void;
  newMultiple: string;
  onNewMultipleChange: (value: string) => void;
  showMultipleWarning: boolean;
  onConfirmChange: () => void;
  showEndPanel: boolean;
  onToggleEnd: () => void;
  onConfirmEnd: () => void;
}

export function MinOrderQtyDetailDrawer({
  detail: d,
  tab,
  onTabChange,
  onClose,
  showChangePanel,
  onToggleChange,
  newMoq,
  onNewMoqChange,
  newMultiple,
  onNewMultipleChange,
  showMultipleWarning,
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
            <div className={styles.eyebrow}>최소수량 상세 · {d.id}</div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{d.name}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
              <span className={styles.badge} style={{ background: '#f4f4f5', color: '#52525b' }}>{d.typeLabel}</span>
            </div>
            <div className={styles.subLine}>적용대상 · {d.target}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {d.isContractLocked && (
          <div className={styles.lockedNote}>이 조건은 계약에 의해 적용되고 있습니다. 변경하려면 계약 정보를 수정해 주세요.</div>
        )}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.linkBtn}>상품 상세</button>
          <div className={styles.actionsSpacer} />
          {d.canEdit && (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={onToggleChange}>조건 변경</button>
              <button type="button" className={styles.dangerBtn} onClick={onToggleEnd}>적용 종료</button>
            </>
          )}
        </div>

        {showChangePanel && (
          <div className={styles.changePanel}>
            <div className={styles.changeTitle}>최소수량 변경</div>
            <div className={styles.changeRow}>
              <label className={styles.changeField}>
                최소 주문수량
                <input
                  className={styles.changeInput}
                  value={newMoq}
                  onChange={(e) => onNewMoqChange(e.target.value)}
                />
              </label>
              <label className={styles.changeField}>
                주문 단위
                <input
                  className={styles.changeInput}
                  value={newMultiple}
                  onChange={(e) => onNewMultipleChange(e.target.value)}
                />
              </label>
              <label className={styles.changeField}>
                적용 시작일
                <input className={styles.changeInput} defaultValue="" />
              </label>
            </div>
            {showMultipleWarning && (
              <div className={styles.changeWarning}>⚠ 최소수량은 주문단위 {newMultiple}개의 배수여야 합니다.</div>
            )}
            <div className={styles.confirmActions}>
              <button type="button" className={styles.ghostBtn} onClick={onToggleChange}>취소</button>
              <button type="button" className={styles.confirmPrimaryBtn} onClick={onConfirmChange}>변경 적용</button>
            </div>
          </div>
        )}

        {showEndPanel && (
          <div className={styles.confirmPanel}>
            <div className={styles.confirmText}>
              최소수량 조건 적용을 종료하시겠습니까?
              <br />
              현재 조건 {d.moqLabel} · 종료 후 상품 기본 조건 {d.baseMoqLabel}이 적용됩니다.
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
          </div>
        )}

        {tab === 'cond' && (
          <div>
            <div className={styles.sectionLabel}>주문 조건</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 14 }}>
              {d.condFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>주문 가능 수량</div>
            <div className={styles.possibleQtysBox}>{d.possibleQtys}</div>
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
            <div className={styles.sectionLabel}>기본조건 비교</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 14 }}>
              {d.compareFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>최소수량 적용 우선순위</div>
            <div className={styles.priorityNote}>계약 조건 → 거래처별 조건 → 거래처 그룹 조건 → 상품 기본 조건</div>
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
            <div className={styles.sectionSub}>최소수량 · 주문단위 변경을 추적합니다</div>
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
