import styles from './TradeTermsDetailDrawer.module.css';
import { ACCENT_MARK, TERMS_TABS } from './tradeTermsData';
import type { TradeTermsDetail } from './tradeTermsDetail';

interface Props {
  detail: TradeTermsDetail;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showChangePanel: boolean;
  onToggleChangePanel: () => void;
  onConfirmChange: () => void;
}

export function TradeTermsDetailDrawer({
  detail: d,
  activeTab,
  onTabChange,
  onClose,
  showChangePanel,
  onToggleChangePanel,
  onConfirmChange,
}: Props) {
  return (
    <aside className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.headTitleRow}>
              <span className={styles.no}>{d.id}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
            </div>
            <div className={styles.name}>{d.contract} · {d.partner}</div>
            <div className={styles.summaryLine}>{d.summaryLine1}</div>
            <div className={styles.summaryLine}>{d.summaryLine2}</div>
            <div className={styles.subLine}>적용 {d.period}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        <div className={styles.actionsRow}>
          <a href="#" className={styles.linkAction} onClick={(e) => e.preventDefault()}>계약 보기</a>
          <div className={styles.actionsSpacer} />
          <button type="button" className={styles.secondaryBtn}>조건 복사</button>
          <button type="button" className={styles.primaryBtn} onClick={onToggleChangePanel}>조건 변경</button>
        </div>

        {showChangePanel && (
          <div className={styles.panel}>
            <div className={styles.panelGrid3}>
              <input className={styles.panelInput} placeholder="결제기한 (일)" />
              <input className={styles.panelInput} placeholder="MOQ" />
              <input className={styles.panelInput} placeholder="납기 (영업일)" />
            </div>
            <input className={styles.panelInput} placeholder="적용일" style={{ marginBottom: 8 }} />
            <select className={styles.panelSelect}>
              <option>계약 조건 재협의</option>
              <option>거래처 요청</option>
              <option>신용 재평가</option>
              <option>기타</option>
            </select>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleChangePanel}>취소</button>
              <button type="button" className={styles.panelConfirmBtn} onClick={onConfirmChange}>변경 검토</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {TERMS_TABS.map(([key, label]) => {
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
        {activeTab === 'compare' && (
          <div>
            <div className={styles.sectionLabel}>조건 비교 (거래처 기본 대비 계약)</div>
            <div className={styles.compareBox}>
              <div className={styles.compareHeadRow}>
                <span>항목</span><span>거래처 기본</span><span>계약 (최종 적용)</span>
              </div>
              {d.compareRows.map((r) => (
                <div className={styles.compareRow} key={r.label}>
                  <span className={styles.compareLabel}>{r.label}</span>
                  <span className={styles.compareBase}>{r.base}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: r.weight, color: r.fg }}>{r.override}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div>
            <div className={styles.sectionLabel}>결제</div>
            <div className={styles.fieldsBox}>
              {d.paymentFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orderCond' && (
          <div>
            <div className={styles.sectionLabel}>주문 / 납품</div>
            <div className={styles.fieldsBox}>
              {d.orderFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'credit' && (
          <div>
            <div className={styles.sectionLabel}>신용</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 14 }}>
              {d.creditFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>세금</div>
            <div className={styles.fieldsBox}>
              {d.taxFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
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
                <span className={styles.versionNote}>{v.summary}</span>
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
