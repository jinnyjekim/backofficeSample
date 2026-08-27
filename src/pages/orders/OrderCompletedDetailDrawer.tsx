import { useRef } from 'react';
import styles from './ordersShared.module.css';
import { fmt, fmtSigned, TYPE_META, type CompletedOrder } from './orderCompletedData';
import { useOutsideClose } from '../../lib/useOutsideClose';

const TABS: [string, string][] = [
  ['summary', '완료요약'],
  ['items', '최종항목'],
  ['process', '처리/납품'],
  ['payment', '금액/수금'],
  ['change', '변경/취소'],
  ['links', '연결업무'],
  ['memo', '관리자메모'],
  ['history', '전체이력'],
];

const ITEM_RESULT_META: Record<string, { bg: string; fg: string }> = {
  완료: { bg: '#ecfdf5', fg: '#059669' },
  부분취소: { bg: '#fffbeb', fg: '#d97706' },
  취소포함: { bg: '#f4f4f5', fg: '#52525b' },
};

function historyDot(action: string): string {
  if (action.includes('완료')) return 'var(--accent)';
  if (action.includes('재오픈')) return '#dc2626';
  return '#d4d4d8';
}

interface Props {
  order: CompletedOrder;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showReopenPanel: boolean;
  onToggleReopen: () => void;
  onReopen: () => void;
}

export function OrderCompletedDetailDrawer({
  order: o,
  activeTab,
  onTabChange,
  onClose,
  showReopenPanel,
  onToggleReopen,
  onReopen,
}: Props) {
  const tm = TYPE_META[o.type];

  const summaryFields = [
    { label: '거래처', value: o.partner, weight: 500, color: '#18181b' },
    { label: '주문일', value: o.processStart, weight: 500, color: '#3f3f46' },
    { label: '완료일', value: o.completedAt, weight: 500, color: '#3f3f46' },
    { label: '주문 항목', value: `${o.items.length}건`, weight: 500, color: '#3f3f46' },
    { label: '최종 처리수량', value: `${o.finalQty} / ${o.origQty}`, weight: 500, color: '#3f3f46' },
    { label: '완료 유형', value: tm.label, weight: 600, color: tm.fg },
    { label: '완료 처리자', value: o.completedBy, weight: 500, color: '#3f3f46' },
    { label: '완료 방식', value: o.method, weight: 500, color: '#3f3f46' },
  ];

  const compareRows = [
    { label: '총 수량', from: String(o.origQty), to: String(o.finalQty), fg: o.origQty !== o.finalQty ? '#d97706' : '#18181b' },
    { label: '주문금액', from: fmt(o.origAmount), to: fmt(o.finalAmount), fg: o.origAmount !== o.finalAmount ? '#d97706' : '#18181b' },
    { label: '변경', from: '-', to: fmtSigned(o.changeAmount), fg: '#18181b' },
    { label: '취소', from: '-', to: fmtSigned(o.cancelAmount), fg: o.cancelAmount !== 0 ? '#dc2626' : '#18181b' },
  ];

  const processFields = [
    { label: '처리 시작', value: o.processStart, weight: 500, color: '#3f3f46' },
    { label: '처리 완료일', value: o.processDone, weight: 500, color: '#3f3f46' },
    { label: '최종 출고일', value: o.shipDone, weight: 500, color: '#3f3f46' },
    { label: '최종 납품일', value: o.deliverDone, weight: 500, color: '#3f3f46' },
    { label: '주문 완료일', value: o.completedAt, weight: 700, color: '#18181b' },
  ];

  const deliveryFields = [
    { label: '총 납품수량', value: String(o.finalQty), weight: 600, color: '#18181b' },
    { label: '납품 횟수', value: `${o.deliveryRounds.length}회`, weight: 500, color: '#3f3f46' },
    { label: '최종 납품일', value: o.deliverDone, weight: 500, color: '#3f3f46' },
  ];

  const unpaid = o.billed - o.collected;
  const paymentFields = [
    { label: '최종 주문금액', value: fmt(o.finalAmount), weight: 600, color: '#18181b' },
    { label: '청구금액', value: fmt(o.billed), weight: 500, color: '#3f3f46' },
    { label: '수금완료', value: fmt(o.collected), weight: 500, color: '#3f3f46' },
    { label: '미수금', value: fmt(unpaid), weight: unpaid > 0 ? 700 : 500, color: unpaid > 0 ? '#dc2626' : '#059669' },
    { label: '상태', value: o.paymentStatus, weight: 700, color: o.paymentStatus === '수금완료' ? '#059669' : '#dc2626' },
  ];

  const linkFields: [string, string][] = [
    ['견적 요청', o.links.rfq], ['견적서', o.links.quote], ['발주', o.links.po],
    ['계약', o.links.contract], ['납품', o.links.delivery], ['청구', o.links.invoice], ['수금', o.links.payment],
  ];

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.asideTop}>
        <div className={styles.headRowD}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{o.id}</span>
              <span className={styles.badgePill} style={{ background: tm.bg, color: tm.fg }}>{tm.label}</span>
            </div>
            <div className={styles.partnerLine}>{o.partner} · 최종 주문금액 {fmt(o.finalAmount)}</div>
            <div className={styles.metaLine}>완료일 {o.completedAt}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {o.issue && <div className={styles.bannerAmber}>⚠ {o.issue}</div>}

        <div className={styles.linksRow}>
          <a href="#">회사 상세</a>
          <a href="#">발주 보기</a>
          <a href="#">계약 보기</a>
          <div className={styles.rowSpacer} />
          <button type="button" className={styles.secondaryBtn}>이 주문으로 새 발주 작성</button>
          <button type="button" className={styles.secondaryBtnRed} onClick={onToggleReopen}>주문 재오픈</button>
        </div>

        <div className={styles.bannerGreen}>완료된 주문은 직접 수정할 수 없습니다. 정정이 필요하면 주문 재오픈을 사용하세요.</div>

        {showReopenPanel && (
          <div className={styles.panelRed}>
            <div className={styles.panelTitleRed}>주문 재오픈</div>
            <div className={styles.summaryRow} style={{ marginBottom: 8 }}>
              <span>현재 상태</span>
              <span style={{ fontWeight: 600 }}>완료</span>
            </div>
            <textarea className={styles.panelTextarea} placeholder="재오픈 사유를 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleReopen}>취소</button>
              <button type="button" className={styles.panelConfirmRed} onClick={onReopen}>주문 재오픈</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === key ? styles.active : ''}`}
              onClick={() => onTabChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scrollBody}>
        {activeTab === 'summary' && (
          <div>
            <div className={styles.sectionLabel}>완료 요약</div>
            <div className={styles.fieldsBox}>
              {summaryFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>최초 → 최종 비교</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 0 }}>
              {compareRows.map((cr) => (
                <div className={styles.fieldRow} key={cr.label}>
                  <span className={styles.fieldLabel}>{cr.label}</span>
                  <span className={styles.fieldValue}>
                    {cr.from} <span className={styles.compareArrow}>→</span>{' '}
                    <span style={{ fontWeight: 700, color: cr.fg }}>{cr.to}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            <div className={styles.sectionLabel}>최종 주문 항목</div>
            {o.items.map((it) => {
              const meta = ITEM_RESULT_META[it.result];
              return (
                <div className={styles.itemCard} key={it.name}>
                  <div className={styles.itemHeadRow}>
                    <span className={styles.itemName}>{it.name}</span>
                    <span className={styles.badgePill} style={{ background: meta.bg, color: meta.fg }}>{it.result}</span>
                  </div>
                  <div className={styles.itemGrid4}>
                    <div>
                      <div className={styles.itemGridCellLabel}>최초수량</div>
                      <div className={styles.itemGridCellValue}>{it.origQty}</div>
                    </div>
                    <div>
                      <div className={styles.itemGridCellLabel}>최종수량</div>
                      <div className={styles.itemGridCellValueBold}>{it.finalQty}</div>
                    </div>
                    <div>
                      <div className={styles.itemGridCellLabel}>단가</div>
                      <div className={styles.itemGridCellValue}>{fmt(it.unitPrice)}</div>
                    </div>
                    <div>
                      <div className={styles.itemGridCellLabel}>금액</div>
                      <div className={styles.itemGridCellValueBold}>{fmt(it.finalQty * it.unitPrice)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'process' && (
          <div>
            <div className={styles.sectionLabel}>처리 결과</div>
            <div className={styles.fieldsBox}>
              {processFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>납품 결과</div>
            <div className={styles.fieldsBox}>
              {deliveryFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {o.deliveryRounds.map((dr) => (
              <div className={styles.checkRow} key={dr.label}>
                <span className={styles.checkLabel}>{dr.label}</span>
                <span className={styles.checkValue} style={{ color: '#71717a', fontWeight: 500 }}>{dr.when} · {dr.qty}개</span>
              </div>
            ))}
            <a href="#" className={styles.linkBtn} style={{ display: 'inline-block', marginTop: 8 }}>납품 상세 보기 →</a>
          </div>
        )}

        {activeTab === 'payment' && (
          <div>
            <div className={styles.sectionLabel}>결제 / 수금</div>
            <div className={styles.fieldsBox}>
              {paymentFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <a href="#" className={styles.linkBtn}>수금 내역 보기 →</a>
          </div>
        )}

        {activeTab === 'change' && (
          <div>
            <div className={styles.sectionLabel}>변경 / 취소</div>
            {o.change
              ? <div className={styles.bannerAmber}>{o.change.note}</div>
              : <div className={styles.emptyNote}>변경 또는 취소 없이 정상 완료되었습니다.</div>}
            <div className={styles.sectionLabel} style={{ marginTop: 16 }}>Revision</div>
            {o.revisions.map((rv) => (
              <div className={styles.linkedCard} key={rv.label}>
                <div>
                  <div className={styles.linkedTitle}>{rv.label}</div>
                  <div className={styles.linkedSub}>{rv.note}</div>
                </div>
                <span className={styles.checkValue}>{rv.amount}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'links' && (
          <div>
            <div className={styles.sectionLabel}>연결 업무</div>
            <div className={styles.fieldsBox}>
              {linkFields.map(([label, value]) => (
                <div className={styles.fieldRow} key={label}>
                  <span className={styles.fieldLabel}>{label}</span>
                  <a href="#" className={styles.fieldValue}>{value}</a>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>관련 문서</div>
            {o.docs.map((d) => (
              <div className={styles.checkRow} key={d}>
                <span className={styles.checkLabel}>{d}</span>
                <a href="#" className={styles.linkBtn}>보기</a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'memo' && (
          <div>
            <div className={styles.sectionLabel}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" />
              <button type="button" className={styles.memoSubmitBtn}>등록</button>
            </div>
            {o.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.admin}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>전체 Timeline</div>
            {o.history.map((h, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} style={{ background: historyDot(h.action) }} />
                <div className={styles.historyBody}>
                  <div className={styles.historyTopRow}>
                    <span className={styles.historyAction}>{h.action}</span>
                    <span className={styles.historyWhen}>{h.when}</span>
                  </div>
                  <div className={styles.historyBy}>{h.by}</div>
                  {h.note && <div className={styles.historyNote}>"{h.note}"</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
