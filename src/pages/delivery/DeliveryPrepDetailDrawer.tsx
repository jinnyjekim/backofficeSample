import styles from './deliveryShared.module.css';
import { buildTabs } from './deliverySharedData';
import { calcPrep, STATUS_META, type PrepItem, type PrepShipment } from './deliveryPrepData';

interface Props {
  shipment: PrepShipment;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showHoldPanel: boolean;
  onToggleHoldPanel: () => void;
  onUpdate: (updater: (sh: PrepShipment) => PrepShipment) => void;
  onConfirmedHold: () => void;
}

const TABS: [string, string][] = [
  ['summary', '준비요약'],
  ['items', '상품/재고'],
  ['receiver', '수령인/배송지'],
  ['shipping', '배송방식/포장'],
  ['invoice', '송장'],
  ['change', '변경/취소'],
  ['history', '메모/이력'],
];

export function DeliveryPrepDetailDrawer({
  shipment: sh,
  activeTab,
  onTabChange,
  onClose,
  showHoldPanel,
  onToggleHoldPanel,
  onUpdate,
  onConfirmedHold,
}: Props) {
  const sm = STATUS_META[sh.status];
  const c = calcPrep(sh);
  const readyQty = sh.items.reduce((a, it) => a + it.ready, 0);
  const totalQty = sh.items.reduce((a, it) => a + it.qty, 0);
  const tabs = buildTabs(TABS, activeTab, onTabChange);

  const blockers: string[] = [];
  if (c.stockIssue) sh.items.filter((it) => it.remain > 0).forEach((it) => blockers.push(`${it.name} 재고 ${it.remain}개 부족`));
  if (!sh.invoiceNo) blockers.push('송장번호 미등록');
  if (!sh.addrOk) blockers.push('배송지 확인 필요');
  if (sh.changeNote) blockers.push('주문 변경 확인 필요');

  const canHold = sh.status !== '준비완료' && sh.status !== '보류';
  const canResume = sh.status === '보류';
  const blockComplete = blockers.length > 0;

  function confirmReady() {
    if (blockers.length) return;
    onUpdate((s) => ({
      ...s,
      status: '준비완료',
      history: [...s.history, { when: '방금', title: '배송 준비 완료', by: 'admin01' }, { when: '방금', title: '출고 대기로 전환' }],
    }));
  }

  function resume() {
    onUpdate((s) => ({ ...s, status: '준비중', history: [...s.history, { when: '방금', title: '배송 준비 재개', by: 'admin01' }] }));
  }

  function confirmHold() {
    onUpdate((s) => ({ ...s, status: '보류', history: [...s.history, { when: '방금', title: '배송 보류', by: 'admin01' }] }));
    onConfirmedHold();
  }

  function prepItem(name: string) {
    onUpdate((s) => ({
      ...s,
      items: s.items.map((it) => (it.name === name ? { ...it, ready: it.qty, remain: 0 } : it)),
    }));
  }

  function registerInvoice() {
    onUpdate((s) => ({ ...s, invoiceNo: '1234567890', history: [...s.history, { when: '방금', title: '송장번호 등록', by: 'admin01' }] }));
  }

  function itemStatus(it: PrepItem) {
    const st = it.remain > 0 ? '부분 준비' : it.ready === 0 ? '준비 대기' : '준비 완료';
    const stMeta = st === '준비 완료' ? { bg: '#ecfdf5', fg: '#059669' } : st === '부분 준비' ? { bg: '#fffbeb', fg: '#d97706' } : { bg: '#f4f4f5', fg: '#71717a' };
    return { st, ...stMeta };
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{sh.id}</span>
              <span className={styles.badgePill} style={{ background: sm.bg, color: sm.fg }}>{sh.status}</span>
            </div>
            <div className={styles.subLine}>주문 {sh.order} · {sh.receiver}</div>
            <div className={styles.amountLine}>{`상품 ${c.readyCount}/${sh.items.length}종 · ${readyQty}/${totalQty}개 준비`}</div>
            <div className={styles.dueLine}>출고 예정 {sh.dueDate}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {c.issues.length > 0 && <div className={styles.bannerAmber}>⚠ {c.issues.join(' · ')}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.linkBtn}>주문 상세</button>
          <div className={styles.rowSpacer} />
          {canHold && (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={onToggleHoldPanel}>보류</button>
              <button type="button" className={styles.primaryBtn} onClick={confirmReady} disabled={blockComplete}>준비 완료</button>
            </>
          )}
          {canResume && (
            <button type="button" className={styles.primaryBtn} onClick={resume}>보류 해제</button>
          )}
        </div>

        {showHoldPanel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>배송 준비 보류</div>
            <select className={styles.panelSelect} defaultValue="재고 부족">
              <option>재고 부족</option>
              <option>배송지 확인 필요</option>
              <option>고객 요청</option>
              <option>결제 확인 필요</option>
              <option>추가 배송비 확인</option>
              <option>상품 검수 필요</option>
              <option>기타</option>
            </select>
            <input className={styles.panelInput} placeholder="재개 예정일" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.cancelBtn} onClick={onToggleHoldPanel}>취소</button>
              <button type="button" className={styles.confirmDarkBtn} onClick={confirmHold}>보류</button>
            </div>
          </div>
        )}

        {blockComplete && (
          <div className={styles.panelRed}>
            <div className={styles.panelTitleRed}>준비 완료 조건 미충족</div>
            {blockers.map((b, i) => <div className={styles.panelBlockerLine} key={i}>· {b}</div>)}
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
            <div className={styles.sectionLabel}>배송 준비 요약</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '배송번호', value: sh.id, weight: 600, color: '#18181b' },
                { label: '주문번호', value: sh.order, weight: 500, color: '#3f3f46' },
                { label: '배송상품', value: `${sh.items.length}종 / 총 ${totalQty}개`, weight: 500, color: '#3f3f46' },
                { label: '준비완료', value: `${c.readyCount}종 / ${readyQty}개`, weight: 600, color: '#059669' },
                { label: '미준비', value: `${sh.items.length - c.readyCount}종 / ${totalQty - readyQty}개`, weight: 600, color: totalQty - readyQty > 0 ? '#d97706' : '#3f3f46' },
                { label: '배송 방식', value: sh.method, weight: 500, color: '#3f3f46' },
                { label: '출고지', value: sh.outbase, weight: 500, color: '#3f3f46' },
              ].map((f) => (
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
            <div className={styles.sectionLabel}>배송 상품 · 재고/피킹</div>
            {sh.items.map((it) => {
              const { st, bg, fg } = itemStatus(it);
              return (
                <div className={styles.itemCard} key={it.name}>
                  <div className={styles.itemHeadRow}>
                    <span className={styles.itemName}>{it.name}</span>
                    <span className={styles.badgePill} style={{ background: bg, color: fg }}>{st}</span>
                  </div>
                  <div className={styles.itemGrid4}>
                    <div><div className={styles.itemGridCellLabel}>주문수량</div><div className={styles.itemGridCellValue}>{it.qty}</div></div>
                    <div><div className={styles.itemGridCellLabel}>준비수량</div><div className={styles.itemGridCellValue}>{it.ready}</div></div>
                    <div><div className={styles.itemGridCellLabel}>가용재고</div><div className={styles.itemGridCellValue} style={{ color: it.stock < it.qty ? '#dc2626' : '#3f3f46' }}>{it.stock}</div></div>
                    <div><div className={styles.itemGridCellLabel}>잔여</div><div className={styles.itemGridCellValue} style={{ fontWeight: 600, color: it.remain > 0 ? '#dc2626' : '#3f3f46' }}>{Math.max(it.remain, 0)}</div></div>
                  </div>
                  {st !== '준비 완료' && (
                    <button type="button" className={styles.smallOutlineBtn} onClick={() => prepItem(it.name)}>준비 처리</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'receiver' && (
          <div>
            <div className={styles.sectionLabel}>수령인 / 배송지</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '수령인', value: sh.receiver, weight: 600, color: '#18181b' },
                { label: '배송지', value: sh.address, weight: sh.addrOk ? 500 : 700, color: sh.addrOk ? '#3f3f46' : '#dc2626' },
                { label: '배송 방식', value: sh.method, weight: 500, color: '#3f3f46' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {!sh.addrOk && <div className={styles.bannerRed}>⚠ 배송지 확인 필요: 상세주소 또는 우편번호 확인 필요</div>}
            <div className={styles.sectionLabel} style={{ marginTop: 16 }}>배송 요청사항</div>
            <div className={styles.orderProgressNote}>{sh.reqNote}</div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <div className={styles.sectionLabel}>배송 방식 / 포장</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '배송 방식', value: sh.method, weight: 600, color: '#18181b' },
                { label: '택배사', value: sh.carrier, weight: sh.carrier === '미지정' ? 700 : 500, color: sh.carrier === '미지정' ? '#dc2626' : '#3f3f46' },
                { label: '출고지', value: sh.outbase, weight: 500, color: '#3f3f46' },
                { label: '포장 상태', value: '미포장', weight: 500, color: '#3f3f46' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.smallBtnRow}>
              <button type="button" className={styles.smallOutlineBtn} style={{ marginTop: 0 }}>택배사 지정</button>
              <button type="button" className={styles.smallOutlineBtn} style={{ marginTop: 0 }}>출고지 변경</button>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div>
            <div className={styles.sectionLabel}>송장</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '택배사', value: sh.carrier, weight: 500, color: '#3f3f46' },
                { label: '송장번호', value: sh.invoiceNo || '미등록', weight: sh.invoiceNo ? 600 : 700, color: sh.invoiceNo ? '#18181b' : '#dc2626' },
                { label: '송장 상태', value: sh.invoiceNo ? '등록 완료' : '미등록', weight: 600, color: sh.invoiceNo ? '#059669' : '#d97706' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {!sh.invoiceNo && (
              <div className={styles.inlineForm}>
                <input className={styles.inlineInput} placeholder="송장번호" />
                <button type="button" className={styles.inlineDarkBtn} onClick={registerInvoice}>등록</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'change' && (
          <div>
            <div className={styles.sectionLabel}>변경 / 취소</div>
            {sh.changeNote ? (
              <div className={styles.bannerAmber} style={{ marginTop: 0 }}>{sh.changeNote}</div>
            ) : (
              <div className={styles.emptyNote}>주문 변경 또는 취소 요청이 없습니다.</div>
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
            <div className={styles.historyLabel}>처리 이력</div>
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
