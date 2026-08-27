import { useRef } from 'react';
import styles from './ordersShared.module.css';
import { fmt, isDelayed, STATUS_META, type ProcessingOrder } from './orderProcessingData';
import { useOutsideClose } from '../../lib/useOutsideClose';

const TABS: [string, string][] = [
  ['summary', '처리요약'],
  ['items', '주문항목'],
  ['supply', '공급/재고'],
  ['due', '납기'],
  ['ship', '출고/납품'],
  ['change', '변경/취소'],
  ['memo', '관리자메모'],
  ['history', '처리이력'],
];

const ITEM_STATUS_META: Record<string, { bg: string; fg: string }> = {
  완료: { bg: '#ecfdf5', fg: '#059669' },
  처리중: { bg: '#eef2ff', fg: '#4f46e5' },
  대기: { bg: '#f4f4f5', fg: '#71717a' },
};

interface Props {
  order: ProcessingOrder;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showHoldPanel: boolean;
  showCompletePanel: boolean;
  onToggleHold: () => void;
  onToggleComplete: () => void;
  onStartProcess: () => void;
  onResume: () => void;
  onConfirmHold: () => void;
  onConfirmComplete: () => void;
}

export function OrderProcessingDetailDrawer({
  order: o,
  activeTab,
  onTabChange,
  onClose,
  showHoldPanel,
  showCompletePanel,
  onToggleHold,
  onToggleComplete,
  onStartProcess,
  onResume,
  onConfirmHold,
  onConfirmComplete,
}: Props) {
  const sm = STATUS_META[o.status];
  const totalQty = o.items.reduce((a, i) => a + i.qty, 0);
  const doneQty = o.items.reduce((a, i) => a + i.done, 0);
  const pct = totalQty ? Math.round((doneQty / totalQty) * 100) : 0;
  const doneItems = o.items.filter((i) => i.done >= i.qty).length;
  const unfinished = o.items.filter((i) => i.done < i.qty);
  const delayed = isDelayed(o);

  const canStart = o.status === '처리 대기';
  const canHold = o.status === '처리중';
  const canResume = o.status === '보류';
  const completeLabel = unfinished.length > 0 ? '부분 처리 완료' : '처리 완료';

  const summaryFields = [
    { label: '처리 상태', value: o.status },
    { label: '총 항목', value: `${o.items.length}건` },
    { label: '완료 항목', value: `${doneItems}건` },
    { label: '미처리 항목', value: `${o.items.length - doneItems}건` },
    { label: '총 수량', value: String(totalQty) },
    { label: '처리 완료 수량', value: String(doneQty) },
    { label: '처리 예정일', value: o.planned },
    { label: '요청 납기', value: o.dueRequested },
    { label: '담당자', value: o.owner },
  ];

  const dueFields = [
    { label: '요청 납기', value: o.dueRequested, weight: 500, color: '#3f3f46' },
    { label: '처리 예정일', value: o.planned, weight: delayed ? 700 : 500, color: delayed ? '#dc2626' : '#3f3f46' },
    { label: '결제조건', value: o.paymentTerm, weight: 500, color: '#3f3f46' },
  ];

  const linkFields = [
    { label: '발주', value: 'PO-00182', color: 'var(--accent)' },
    { label: '견적서', value: 'Q-00182', color: 'var(--accent)' },
    { label: '출고', value: o.status === '처리 완료' ? 'SH-00382' : '없음', color: o.status === '처리 완료' ? 'var(--accent)' : '#71717a' },
    { label: '납품', value: o.status === '처리 완료' ? 'DL-00291' : '없음', color: o.status === '처리 완료' ? 'var(--accent)' : '#71717a' },
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
              <span className={styles.badgePill} style={{ background: sm.bg, color: sm.fg }}>{o.status}</span>
            </div>
            <div className={styles.partnerLine}>{o.partner} · 주문금액 {fmt(o.amount)}</div>
            <div className={styles.headerProgressRow}>
              <span className={styles.headerProgressTrack}>
                <span className={styles.headerProgressFill} style={{ width: `${pct}%` }} />
              </span>
              <span className={styles.headerProgressLabel}>{doneItems}/{o.items.length} 항목 · {doneQty}/{totalQty}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {o.status === '보류' && (
          <div className={styles.bannerRed}>보류 사유: {o.holdReason} · 재개 예정 {o.holdResume}</div>
        )}

        <div className={styles.linksRow}>
          <a href="#">주문 상세</a>
          <a href="#">발주 보기</a>
          <div className={styles.rowSpacer} />
          {canStart && <button type="button" className={styles.primaryBtn} onClick={onStartProcess}>처리 시작</button>}
          {canHold && (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={onToggleHold}>처리 보류</button>
              <button type="button" className={styles.primaryBtn} onClick={onToggleComplete}>처리 완료</button>
            </>
          )}
          {canResume && <button type="button" className={styles.primaryBtn} onClick={onResume}>처리 재개</button>}
        </div>

        {showHoldPanel && (
          <div className={styles.panelNeutral}>
            <div className={styles.panelTitle}>주문 처리 보류</div>
            <select className={styles.panelSelect} defaultValue="재고/공급 부족">
              <option>재고/공급 부족</option><option>거래처 확인 대기</option><option>결제/입금 확인 대기</option>
              <option>내부 승인 대기</option><option>상품 정보 확인</option><option>납기 협의</option>
              <option>주문 변경 대기</option><option>기타</option>
            </select>
            <div className={styles.panelInputRow}>
              <input className={styles.panelInput} placeholder="재개 예정일" />
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleHold}>취소</button>
              <button type="button" className={styles.panelConfirmDark} onClick={onConfirmHold}>처리 보류</button>
            </div>
          </div>
        )}

        {showCompletePanel && (
          <div className={styles.panelNeutral}>
            <div className={styles.panelTitle}>주문 처리를 완료하시겠습니까?</div>
            {unfinished.length > 0 && (
              <div className={styles.panelErrorNote}>⚠ 미처리 항목이 있습니다: {unfinished.map((u) => `${u.name} ${u.qty - u.done}개`).join(', ')}</div>
            )}
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleComplete}>취소</button>
              <button type="button" className={styles.panelConfirmAccent} onClick={onConfirmComplete}>{completeLabel}</button>
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
            <div className={styles.sectionLabel}>처리 요약</div>
            <div className={styles.fieldsBox}>
              {summaryFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            <div className={styles.sectionLabel}>주문 항목 처리 현황</div>
            {o.items.map((it) => {
              const iPct = it.qty ? Math.round((it.done / it.qty) * 100) : 0;
              const st = it.done >= it.qty ? '완료' : it.done > 0 ? '처리중' : '대기';
              const meta = ITEM_STATUS_META[st];
              return (
                <div className={styles.itemCard} key={it.name}>
                  <div className={styles.itemHeadRow}>
                    <div>
                      <div className={styles.itemName}>{it.name}</div>
                      <div className={styles.itemCode}>주문 {it.qty}개 · 예정일 {it.due}</div>
                    </div>
                    <span className={styles.badgePill} style={{ background: meta.bg, color: meta.fg }}>{st}</span>
                  </div>
                  <div className={styles.itemProgressRow}>
                    <span className={styles.itemProgressTrack}>
                      <span className={styles.itemProgressFill} style={{ width: `${iPct}%` }} />
                    </span>
                    <span className={styles.itemProgressLabel}>{it.done} / {it.qty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'supply' && (
          <div>
            <div className={styles.sectionLabel}>공급 / 재고 현황</div>
            {o.supply.map((sr) => (
              <div className={styles.checkRow} key={sr.name}>
                <span className={styles.checkLabel}>{sr.name} · 주문 {sr.qty} / 가용 {sr.avail}</span>
                <span className={styles.checkValue} style={{ color: sr.ok ? '#059669' : '#dc2626' }}>
                  {sr.ok ? '✓ 처리 가능' : `⚠ ${sr.qty - sr.avail}개 부족`}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'due' && (
          <div>
            <div className={styles.sectionLabel}>납기</div>
            <div className={styles.fieldsBox}>
              {dueFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {delayed && <div className={styles.bannerRed}>⚠ 처리 지연으로 요청 납기 준수가 어려울 수 있습니다.</div>}
          </div>
        )}

        {activeTab === 'ship' && (
          <div>
            <div className={styles.sectionLabel}>출고 / 납품 연결</div>
            <div className={styles.fieldsBox}>
              {linkFields.map((lf) => (
                <div className={styles.fieldRow} key={lf.label}>
                  <span className={styles.fieldLabel}>{lf.label}</span>
                  <span className={styles.fieldValue} style={{ color: lf.color }}>{lf.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'change' && (
          <div>
            <div className={styles.sectionLabel}>변경 / 취소</div>
            {o.change
              ? <div className={styles.bannerAmber}>{o.change.note}</div>
              : <div className={styles.emptyNote}>변경 또는 취소 요청이 없습니다.</div>}
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
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>처리 이력</div>
            {o.history.map((h, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} />
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
