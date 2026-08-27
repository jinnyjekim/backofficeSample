import { useRef } from 'react';
import styles from './UnitPriceDetailDrawer.module.css';
import { ACCENT_MARK, PRICE_TABS } from './unitPriceData';
import type { UnitPriceDetail } from './unitPriceDetail';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface Props {
  detail: UnitPriceDetail;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showChangePanel: boolean;
  onToggleChangePanel: () => void;
  onConfirmChange: () => void;
}

export function UnitPriceDetailDrawer({
  detail: d,
  activeTab,
  onTabChange,
  onClose,
  showChangePanel,
  onToggleChangePanel,
  onConfirmChange,
}: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.headTitleRow}>
              <span className={styles.no}>{d.id}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
            </div>
            <div className={styles.name}>{d.partner} · {d.product}</div>
            <div className={styles.priceLine}>{d.priceLabel}</div>
            <div className={styles.subLine}>적용 {d.period}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        <div className={styles.actionsRow}>
          <a href="#" className={styles.linkAction} onClick={(e) => e.preventDefault()}>계약 보기</a>
          <a href="#" className={styles.linkAction} onClick={(e) => e.preventDefault()}>상품 보기</a>
          <div className={styles.actionsSpacer} />
          <button type="button" className={styles.primaryBtn} onClick={onToggleChangePanel}>단가 변경</button>
        </div>

        {showChangePanel && (
          <div className={styles.panel}>
            <div className={styles.panelGrid3}>
              <input className={styles.panelInput} value={d.priceLabel} disabled />
              <input className={styles.panelInput} placeholder="변경 단가" />
              <input className={styles.panelInput} placeholder="적용 시작일" />
            </div>
            <select className={styles.panelSelect}>
              <option>연간 단가 재협의</option>
              <option>거래처 요청</option>
              <option>원가 변동</option>
              <option>기타</option>
            </select>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleChangePanel}>취소</button>
              <button type="button" className={styles.panelConfirmBtn} onClick={onConfirmChange}>변경 검토</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {PRICE_TABS.map(([key, label]) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                className={styles.tabBtn}
                style={{ fontWeight: active ? 700 : 500, color: active ? '#18181b' : '#8b8b93', boxShadow: active ? ACCENT_MARK : 'none' }}
                onClick={() => onTabChange(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.scroll}>
        {activeTab === 'info' && (
          <div>
            <div className={styles.sectionLabel}>기본 정보</div>
            <div className={styles.fieldsBox}>
              {d.infoFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div>
            <div className={styles.sectionLabel}>가격 비교</div>
            <div className={styles.fieldsBox}>
              {d.compareFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span
                    className={styles.fieldValue}
                    style={{ fontWeight: f.weight, color: f.color, textDecoration: f.strike }}
                  >
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
            {d.hasQuoteMismatch && (
              <div className={styles.mismatchNote}>견적 단가({d.quotePrice})와 계약 단가가 다릅니다.</div>
            )}
          </div>
        )}

        {activeTab === 'conditions' && (
          <div>
            <div className={styles.sectionLabel}>적용 조건</div>
            <div className={styles.fieldsBox}>
              {d.conditionFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {d.periodExceeds && <div className={styles.exceedsWarning}>⚠ 단가 적용기간이 계약기간을 초과합니다.</div>}
          </div>
        )}

        {activeTab === 'qty' && (
          <div>
            <div className={styles.sectionLabel}>수량 조건</div>
            <div className={styles.tiersBox}>
              {d.qtyTiers.map((t) => (
                <div className={styles.tierRow} key={t.range}>
                  <span className={styles.tierRange}>{t.range}</span>
                  <span className={styles.tierPrice}>{t.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div>
            <div className={styles.sectionLabel}>주문 적용</div>
            <div className={styles.fieldsBox}>
              {d.usageFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.usageNote}>기존 확정 주문에는 향후 단가 변경이 소급 적용되지 않습니다.</div>
          </div>
        )}

        {activeTab === 'version' && (
          <div>
            <div className={styles.sectionLabel}>Version</div>
            {d.versions.map((v) => (
              <div className={styles.versionCard} key={v.label}>
                <div>
                  <div className={styles.versionLabel}>{v.label}</div>
                  <div className={styles.versionNote}>{v.period}</div>
                </div>
                <span className={styles.versionAmount}>{v.price}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>변경 이력</div>
            {d.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineAction}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineBy}>{h.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
