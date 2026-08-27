import { useRef } from 'react';
import styles from './deliveryShared.module.css';
import { buildTabs } from './deliverySharedData';
import { calcOutbound, SHIP_META, type OutboundShipment } from './outboundCompleteData';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface Props {
  shipment: OutboundShipment;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showCancelPanel: boolean;
  onToggleCancelPanel: () => void;
  onUpdate: (updater: (sh: OutboundShipment) => OutboundShipment) => void;
  onConfirmedCancel: () => void;
}

const TABS: [string, string][] = [
  ['summary', '출고요약'],
  ['items', '출고상품'],
  ['carrier', '택배사/집하'],
  ['fulfill', '재고/이행'],
  ['history', '메모/이력'],
];

export function OutboundCompleteDetailDrawer({
  shipment: sh,
  activeTab,
  onTabChange,
  onClose,
  showCancelPanel,
  onToggleCancelPanel,
  onUpdate,
  onConfirmedCancel,
}: Props) {
  const sm = SHIP_META[sh.shipStatus];
  const c = calcOutbound(sh);
  const outQty = sh.items.reduce((a, it) => a + it.actual, 0);
  const readyQty = sh.items.reduce((a, it) => a + it.ready, 0);
  const itemsLabel = `${sh.items.length}종 / 총 ${outQty}개`;
  const tabs = buildTabs(TABS, activeTab, onTabChange);

  const canCancel = sh.pickup !== '완료';
  const cannotCancel = sh.pickup === '완료';

  function confirmCancel() {
    onUpdate((s) => ({ ...s, history: [...s.history, { when: '방금', title: '출고 완료 취소 · 출고 대기로 복귀', by: 'admin01' }] }));
    onConfirmedCancel();
  }

  const compareRows = [
    { label: '출고일', planned: sh.plannedDate, actual: sh.actualDate.slice(0, 10), actualColor: sh.plannedDate !== sh.actualDate.slice(0, 10) ? '#dc2626' : '#18181b' },
    { label: '출고수량', planned: String(readyQty), actual: String(outQty), actualColor: c.remain ? '#dc2626' : '#18181b' },
    { label: '출고지', planned: sh.outbase, actual: sh.outbase, actualColor: '#18181b' },
  ];

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{sh.id}</span>
              <span className={styles.badgePill} style={{ background: sm.bg, color: sm.fg }}>{sh.shipStatus}</span>
            </div>
            <div className={styles.subLine}>주문 {sh.order} · {itemsLabel}</div>
            <div className={styles.amountLine}>{`실제 출고 ${sh.actualDate}`}</div>
            <div className={styles.dueLine}>배송 상태 {sh.shipStatus}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {c.issues.length > 0 && <div className={styles.bannerAmber}>⚠ {c.issues.join(' · ')}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.linkBtn}>주문 보기</button>
          <button type="button" className={styles.linkBtn}>배송 추적</button>
          <div className={styles.rowSpacer} />
          {canCancel && <button type="button" className={styles.secondaryBtn} onClick={onToggleCancelPanel}>출고 완료 취소</button>}
          {cannotCancel && <span className={styles.mutedNote}>택배사 집하 완료 · 취소 불가</span>}
        </div>

        {showCancelPanel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>출고 완료 취소</div>
            <select className={styles.panelSelect} defaultValue="오처리">
              <option>오처리</option>
              <option>중복 출고</option>
              <option>상품 오류</option>
              <option>기타</option>
            </select>
            <textarea className={styles.panelTextarea} placeholder="상세 사유" />
            <div className={styles.panelNote}>취소 시 출고 상태가 출고 대기로 돌아가고, 출고일 기록은 이력에 보존됩니다.</div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.cancelBtn} onClick={onToggleCancelPanel}>돌아가기</button>
              <button type="button" className={styles.confirmRedBtn} onClick={confirmCancel}>출고 완료 취소</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {tabs.map((t) => (
            <button key={t.key} type="button" className={styles.tabBtn} style={{ fontWeight: t.weight, color: t.fg, boxShadow: t.mark }} onClick={t.pick}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {activeTab === 'summary' && (
          <div>
            <div className={styles.sectionLabel}>출고 요약</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '배송번호', value: sh.id, weight: 600, color: '#18181b' },
                { label: '주문번호', value: sh.order, weight: 500, color: '#3f3f46' },
                { label: '실제 출고일', value: sh.actualDate, weight: 700, color: '#18181b' },
                { label: '출고상품', value: itemsLabel, weight: 500, color: '#3f3f46' },
                { label: '출고지', value: sh.outbase, weight: 500, color: '#3f3f46' },
                { label: '택배사', value: sh.carrier, weight: 500, color: '#3f3f46' },
                { label: '송장번호', value: sh.invoiceNo, weight: 500, color: '#3f3f46' },
                { label: '집하 상태', value: sh.pickup, weight: 600, color: sh.pickup === '완료' ? '#059669' : '#d97706' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>예정 대비 실제</div>
            <div className={styles.gridTableBox}>
              <div className={styles.gridTableHead} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <span>항목</span><span>예정</span><span>실제</span>
              </div>
              {compareRows.map((r) => (
                <div className={styles.gridTableRow} style={{ gridTemplateColumns: '1fr 1fr 1fr' }} key={r.label}>
                  <span className={styles.gridCellNormal} style={{ color: '#8b8b93' }}>{r.label}</span>
                  <span className={styles.gridCellNormal} style={{ color: '#71717a' }}>{r.planned}</span>
                  <span className={styles.gridCellStrong} style={{ color: r.actualColor }}>{r.actual}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            <div className={styles.sectionLabel}>출고 상품</div>
            <div className={styles.gridTableBox}>
              <div className={styles.gridTableHead} style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr' }}>
                <span>상품</span><span>준비수량</span><span>실제출고</span><span>잔여</span><span>상태</span>
              </div>
              {sh.items.map((it) => {
                const remain = it.ready - it.actual;
                const status = remain > 0 ? '부분 출고' : '출고완료';
                const fg = remain > 0 ? '#d97706' : '#059669';
                return (
                  <div className={styles.gridTableRow} style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr' }} key={it.name}>
                    <span className={styles.gridCellStrong}>{it.name}</span>
                    <span className={styles.gridCellNormal}>{it.ready}</span>
                    <span className={styles.gridCellStrong}>{it.actual}</span>
                    <span className={styles.gridCellNormal} style={{ color: remain > 0 ? '#d97706' : '#3f3f46' }}>{remain}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: fg }}>{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'carrier' && (
          <div>
            <div className={styles.sectionLabel}>택배사 / 송장 / 집하</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '택배사', value: sh.carrier, weight: 600, color: '#18181b' },
                { label: '송장번호', value: sh.invoiceNo, weight: 600, color: '#18181b' },
                { label: '집하 상태', value: sh.pickup, weight: 600, color: sh.pickup === '완료' ? '#059669' : '#d97706' },
                { label: '집하 시각', value: sh.pickupAt || '-', weight: 500, color: '#3f3f46' },
                { label: '현재 배송 상태', value: sh.shipStatus, weight: 600, color: sm.fg },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {c.pickupDelay && <div className={styles.bannerAmber} style={{ marginTop: 0, marginBottom: 12 }}>⚠ 출고 후 집하 확인이 지연되고 있습니다.</div>}
            <div className={styles.sectionLabel}>배송 Tracking</div>
            {sh.tracking.map((tk, i) => (
              <div className={styles.trackingItem} key={i}>
                <div className={styles.trackingDot} style={{ background: 'var(--accent)' }} />
                <div className={styles.trackingBody}>
                  <div className={styles.trackingTopRow}>
                    <span className={styles.trackingTitle}>{tk.title}</span>
                    <span className={styles.trackingWhen}>{tk.when}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className={styles.smallBtnRow}>
              <button type="button" className={styles.smallOutlineBtn} style={{ marginTop: 0 }}>송장 정정</button>
              <button type="button" className={styles.smallOutlineBtn} style={{ marginTop: 0 }}>상태 재조회</button>
            </div>
          </div>
        )}

        {activeTab === 'fulfill' && (
          <div>
            <div className={styles.sectionLabel}>재고 처리 / 주문 이행</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '재고 반영', value: sh.stockError ? '실패' : '완료', weight: 600, color: sh.stockError ? '#dc2626' : '#059669' },
                { label: '출고 수량', value: `${outQty}개`, weight: 500, color: '#3f3f46' },
                { label: '주문 이행 상태', value: sh.partial ? '부분 이행' : '출고 완료', weight: 600, color: sh.partial ? '#d97706' : '#059669' },
                { label: '출고 처리자', value: 'admin01', weight: 500, color: '#3f3f46' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {sh.stockError && <div className={styles.bannerRed} style={{ marginTop: 0 }}>⚠ 출고는 완료됐으나 재고 처리가 실패했습니다.</div>}
            {sh.siblings.length > 0 && (
              <>
                <div className={styles.sectionLabel} style={{ marginTop: 14 }}>동일 주문의 다른 배송</div>
                {sh.siblings.map((sib) => (
                  <div className={styles.siblingRow} key={sib.id}>
                    <span className={styles.siblingLabel}>{sib.id} · {sib.item}</span>
                    <span className={styles.siblingStatus} style={{ color: sib.fg }}>{sib.status}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionLabel}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" />
              <button type="button" className={styles.memoSubmitBtn}>등록</button>
            </div>
            {sh.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            <div className={styles.historyLabel}>전체 Timeline</div>
            {sh.history.map((h, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} />
                <div className={styles.historyBody}>
                  <div className={styles.historyTopRow}>
                    <span className={styles.historyTitle}>{h.title}</span>
                    <span className={styles.historyWhen}>{h.when}</span>
                  </div>
                  {h.by && <div className={styles.historyBy}>{h.by}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
