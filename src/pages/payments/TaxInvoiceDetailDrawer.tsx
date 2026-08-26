import { useRef } from 'react';
import styles from './drawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { TaxDetail } from './taxInvoiceDetail';

interface Props {
  detail: TaxDetail;
  onTabChange: (tab: string) => void;
}

export function TaxInvoiceDetailDrawer({ detail: d, onTabChange }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, d.close);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.titleRow}>
              <span className={styles.titleText}>{d.id}</span>
              <span className={styles.badge} style={{ background: d.calcBg, color: d.calcFg }}>{d.calcLabel}</span>
              <span className={styles.badge} style={{ background: d.issueBg, color: d.issueFg }}>{d.issueBadge}</span>
            </div>
            <div className={styles.subLine}>{d.partner} · {d.invoice}</div>
            <div className={styles.amountLine}>{d.total}</div>
            <div className={styles.metaLine}>공급가액 {d.supply} · 세액 {d.vat} · {d.taxType} {d.rate}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.actionLink}>청구 보기</button>
          <button type="button" className={styles.actionLink}>주문 보기</button>
          <div className={styles.spacer} />
          <button type="button" className={styles.btnGhost} onClick={d.recalc}>세금 재계산</button>
          {d.canConfirm && (
            <button type="button" className={styles.btnPrimary} onClick={d.confirmCalc}>계산 확정</button>
          )}
          {d.canIssue && (
            <button type="button" className={styles.btnPrimary} onClick={d.issueTaxInvoice}>세금계산서 발행</button>
          )}
        </div>

        <div className={styles.tabsRow}>
          {d.tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tabBtn} ${t.active ? styles.active : ''}`}
              style={{ fontWeight: t.weight, color: t.fg, boxShadow: t.mark }}
              onClick={() => onTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {d.isSummary && (
          <div>
            <div className={styles.sectionLabel}>계산 요약</div>
            <div className={styles.infoBox}>
              {d.summaryFields.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <span className={styles.infoValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isItems && (
          <div>
            <div className={styles.sectionLabel}>거래 항목</div>
            {d.items.map((it, i) => (
              <div className={styles.card} key={i}>
                <div className={styles.cardHeadRowCenter}>
                  <span className={styles.cardTitle}>{it.name}</span>
                  <span className={styles.pillSm} style={{ background: it.bg, color: it.fg }}>{it.taxType}</span>
                </div>
                <div className={styles.gridStatsRow} style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                  <div>
                    <div className={styles.gridStatLabel}>수량·단가</div>
                    <div className={styles.gridStatValue}>{it.qty} · {it.unitPrice}</div>
                  </div>
                  <div>
                    <div className={styles.gridStatLabel}>공급가액</div>
                    <div className={styles.gridStatValue}>{it.supply}</div>
                  </div>
                  <div>
                    <div className={styles.gridStatLabel}>세율</div>
                    <div className={styles.gridStatValue}>{it.rate}</div>
                  </div>
                  <div>
                    <div className={styles.gridStatLabel}>세액</div>
                    <div className={styles.gridStatValueStrong}>{it.vat}</div>
                  </div>
                </div>
              </div>
            ))}
            <div className={styles.infoBox}>
              {d.itemsSummary.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: f.weight, color: f.color, fontVariantNumeric: 'tabular-nums' }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isPartnerTax && (
          <div>
            <div className={styles.sectionLabel}>거래처 세금정보</div>
            <div className={styles.infoBox} style={{ marginBottom: 16 }}>
              {d.partnerTaxFields.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <span className={styles.infoValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {d.missingInfo && (
              <div className={styles.panelDanger} style={{ marginTop: 0 }}>
                ⚠ 세금계산서 발행 정보가 부족합니다: {d.missingLabel}
              </div>
            )}
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>적용 근거</div>
            <div className={styles.plainNote}>{d.taxBasis}</div>
          </div>
        )}

        {d.isIssuance && (
          <div>
            <div className={styles.sectionLabel}>발행 정보</div>
            <div className={styles.infoBox}>
              {d.issuanceFields.map((f) => (
                <div className={styles.infoRow} key={f.label}>
                  <span className={styles.infoLabel}>{f.label}</span>
                  <span className={styles.infoValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {d.hasCorrection && (
              <div className={styles.issueBanner}>
                ⚠ 발행 후 거래금액이 변경되어 수정세금계산서 처리가 필요합니다. (원본 {d.correctionFrom} → {d.correctionTo})
              </div>
            )}
          </div>
        )}

        {d.isAdjust && (
          <div>
            <div className={styles.sectionLabel}>조정 / 수정</div>
            {d.hasAdjustment && (
              <div className={styles.card}>
                <div style={{ fontSize: 12.5, color: '#3f3f46', lineHeight: 1.7 }}>{d.adjustmentNote}</div>
              </div>
            )}
            {d.noAdjustment && <div className={styles.emptyNote}>조정 또는 수정 내역이 없습니다.</div>}
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>Version</div>
            {d.versions.map((v) => (
              <div className={styles.flexRowCard} key={v.label}>
                <div>
                  <div className={styles.cardTitle}>{v.label}</div>
                  <div className={styles.cardSub}>{v.note}</div>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46', fontVariantNumeric: 'tabular-nums' }}>{v.total}</span>
              </div>
            ))}
          </div>
        )}

        {d.isHistory && (
          <div>
            <div className={styles.sectionLabel}>관리자 메모</div>
            <div className={styles.memoAddRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" />
              <button type="button" className={styles.memoAddBtn}>등록</button>
            </div>
            {d.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.admin}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            <div className={styles.timelineTitle} style={{ marginTop: 16 }}>처리 이력</div>
            {d.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} style={{ background: 'var(--accent)' }} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineActionTitle}>{h.action}</span>
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
