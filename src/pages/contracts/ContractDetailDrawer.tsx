import { useRef } from 'react';
import styles from './ContractDetailDrawer.module.css';
import { ACCENT_MARK, CONTRACT_TABS } from './contractsData';
import type { ContractDetail } from './contractDetail';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface Props {
  detail: ContractDetail;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showTerminatePanel: boolean;
  onToggleTerminatePanel: () => void;
  onConfirmTerminate: () => void;
}

export function ContractDetailDrawer({
  detail: d,
  activeTab,
  onTabChange,
  onClose,
  showTerminatePanel,
  onToggleTerminatePanel,
  onConfirmTerminate,
}: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.headTitleRow}>
              <span className={styles.no}>{d.no}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>
                {d.statusLabel}
              </span>
            </div>
            <div className={styles.name}>{d.name}</div>
            <div className={styles.subLine}>
              {d.partner} · {d.period}
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        <div className={styles.actionsRow}>
          <a href="#" className={styles.linkAction} onClick={(e) => e.preventDefault()}>회사 상세</a>
          <a href="#" className={styles.linkAction} onClick={(e) => e.preventDefault()}>견적 보기</a>
          <div className={styles.actionsSpacer} />
          {d.canEdit && <button type="button" className={styles.secondaryBtn}>수정</button>}
          {d.canChange && <button type="button" className={styles.secondaryBtn}>계약 변경</button>}
          {d.canRenew && <button type="button" className={styles.secondaryBtn}>계약 갱신</button>}
          {d.canTerminate && (
            <button type="button" className={styles.dangerBtn} onClick={onToggleTerminatePanel}>계약 해지</button>
          )}
        </div>

        {showTerminatePanel && (
          <div className={styles.terminatePanel}>
            <div className={styles.terminatePanelTitle}>계약 해지 영향도</div>
            <div className={styles.terminateGrid}>
              <div className={styles.terminateItem}><span className={styles.terminateItemMuted}>진행중 발주</span> · {d.impactOrders}건</div>
              <div className={styles.terminateItem}><span className={styles.terminateItemMuted}>미수금</span> · {d.impactAr}</div>
            </div>
            <input className={styles.terminateInput} placeholder="해지 효력일" />
            <textarea className={styles.terminateTextarea} placeholder="해지 사유를 입력하세요" />
            <div className={styles.terminateActions}>
              <button type="button" className={styles.terminateCancelBtn} onClick={onToggleTerminatePanel}>취소</button>
              <button type="button" className={styles.terminateConfirmBtn} onClick={onConfirmTerminate}>해지 검토</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {CONTRACT_TABS.map(([key, label]) => {
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
        {activeTab === 'summary' && (
          <div>
            <div className={styles.sectionLabel}>계약 요약</div>
            <div className={styles.fieldsBox}>
              {d.summaryFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            <div className={styles.sectionLabel}>계약 항목</div>
            {d.items.map((it) => (
              <div className={styles.itemCard} key={it.name}>
                <div className={styles.itemTopRow}>
                  <span className={styles.itemName}>{it.name}</span>
                  <span className={styles.itemAmount}>{it.amount}</span>
                </div>
                <div className={styles.itemStatsGrid}>
                  <div><div className={styles.itemStatLabel}>계약수량</div><div className={styles.itemStatValue}>{it.qty}</div></div>
                  <div><div className={styles.itemStatLabel}>계약단가</div><div className={styles.itemStatValue}>{it.unitPrice}</div></div>
                  <div><div className={styles.itemStatLabel}>조건</div><div className={styles.itemStatValue}>{it.moq}</div></div>
                </div>
                <div className={styles.itemProgressRow}>
                  <span className={styles.itemProgressTrack}><span className={styles.itemProgressFill} style={{ width: `${it.pct}%` }} /></span>
                  <span className={styles.itemProgressLabel}>이행 {it.used} / {it.qty}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'price' && (
          <div>
            <div className={styles.sectionLabel}>가격 / 단가</div>
            {d.priceRows.map((pr) => (
              <div className={styles.priceCard} key={pr.name}>
                <div className={styles.priceCardName}>{pr.name}</div>
                <div className={styles.priceGrid}>
                  <div><div className={styles.itemStatLabel}>기본 공급가</div><div className={styles.priceBase}>{pr.base}</div></div>
                  <div><div className={styles.itemStatLabel}>거래처별 가격</div><div className={styles.pricePartner}>{pr.partner}</div></div>
                  <div><div className={styles.itemStatLabel}>계약 단가</div><div className={styles.priceContract}>{pr.contract}</div></div>
                </div>
              </div>
            ))}
            <div className={styles.sectionLabel} style={{ margin: '14px 0 8px' }}>단가 적용 이력</div>
            {d.priceHistory.map((ph) => (
              <div className={styles.priceHistoryRow} key={ph.period}>
                <span className={styles.priceHistoryPeriod}>{ph.period}</span>
                <span className={styles.priceHistoryPrice}>{ph.price}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'terms' && (
          <div>
            <div className={styles.sectionLabel}>조건 비교 (기본 대비 계약)</div>
            <div className={styles.termsBox}>
              <div className={styles.termsHeadRow}>
                <span>항목</span><span>거래처 기본</span><span>계약</span>
              </div>
              {d.termRows.map((tr) => (
                <div className={styles.termsRow} key={tr.label}>
                  <span className={styles.termsLabel}>{tr.label}</span>
                  <span className={styles.termsBase}>{tr.base}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: tr.weight, color: tr.fg }}>{tr.override}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>특약사항</div>
            <div className={styles.specialTerms}>{d.specialTerms}</div>
          </div>
        )}

        {activeTab === 'fulfill' && (
          <div>
            <div className={styles.sectionLabel}>계약 이행 현황</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 14 }}>
              {d.fulfillFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.fulfillBarRow}>
              <span className={styles.fulfillTrack}><span className={styles.fulfillFill} style={{ width: `${d.fulfillPct}%`, background: d.fulfillBarColor }} /></span>
              <span className={styles.fulfillPct}>{d.fulfillPct}%</span>
            </div>
            {d.showFulfillWarning && <div className={styles.fulfillWarning}>⚠ 계약 금액 사용률이 90%를 초과했습니다.</div>}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <div className={styles.sectionLabel}>발주 / 주문</div>
            <div className={styles.ordersBox}>
              <div className={styles.ordersHeadRow}>
                <span>발주</span><span>주문</span><span>금액</span><span>상태</span>
              </div>
              {d.orderRows.map((or) => (
                <div className={styles.ordersRow} key={or.po}>
                  <a href="#" className={styles.ordersLink} onClick={(e) => e.preventDefault()}>{or.po}</a>
                  <a href="#" className={styles.ordersLink} onClick={(e) => e.preventDefault()}>{or.order}</a>
                  <span className={styles.ordersAmount}>{or.amount}</span>
                  <span className={styles.ordersStatus} style={{ background: or.bg, color: or.fg }}>{or.status}</span>
                </div>
              ))}
              {d.orderRows.length === 0 && <div className={styles.ordersEmpty}>연결된 발주 / 주문이 없습니다.</div>}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div>
            <div className={styles.sectionLabel}>계약 문서</div>
            {d.docs.map((doc) => (
              <div className={styles.docRow} key={doc}>
                <span className={styles.docName}>{doc}</span>
                <a href="#" className={styles.docLink} onClick={(e) => e.preventDefault()}>보기</a>
              </div>
            ))}
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>연결 견적</div>
            <div className={styles.linkedQuoteBox}>
              <span className={styles.linkedQuoteText}>{d.linkedQuote}</span>
              <a href="#" className={styles.linkedQuoteLink} onClick={(e) => e.preventDefault()}>견적서 보기 →</a>
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
                  <div className={styles.versionNote}>{v.note} · {v.appliedAt}</div>
                </div>
                <span className={styles.versionAmount}>{v.amount}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'memo' && (
          <div>
            <div className={styles.sectionLabel}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" />
              <button type="button" className={styles.memoAddBtn}>등록</button>
            </div>
            {d.memos.map((m, i) => (
              <div className={styles.memoRow} key={i}>
                <div className={styles.memoMeta}>{m.when} · {m.admin}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>계약 이력</div>
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
