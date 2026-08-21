import styles from './deliveryShared.module.css';
import { buildTabs } from './deliverySharedData';
import { calcWaiting, STATUS_META, TODAY, type WaitingShipment } from './outboundWaitingData';

interface Props {
  shipment: WaitingShipment;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showHoldPanel: boolean;
  onToggleHoldPanel: () => void;
  onUpdate: (updater: (sh: WaitingShipment) => WaitingShipment) => void;
  onConfirmedHold: () => void;
}

const TABS: [string, string][] = [
  ['summary', '출고요약'],
  ['items', '출고상품'],
  ['place', '출고지/배송지'],
  ['invoice', '택배사/송장'],
  ['schedule', '예약/출고일'],
  ['change', '취소/변경'],
  ['history', '메모/이력'],
];

export function OutboundWaitingDetailDrawer({
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
  const c = calcWaiting(sh);
  const totalQty = sh.items.reduce((a, it) => a + it.qty, 0);
  const itemsLabel = `${sh.items.length}종 / 총 ${totalQty}개`;
  const tabs = buildTabs(TABS, activeTab, onTabChange);

  const blockers: string[] = [];
  if (sh.cancelReq) blockers.push('주문 취소 요청 확인 필요');
  if (sh.invoiceIssue) blockers.push(sh.invoiceIssue);
  if (c.qtyMismatch) blockers.push('출고수량이 준비수량과 다릅니다');
  if (sh.reserved && sh.reserveDate && TODAY < new Date(sh.reserveDate.replace(/\./g, '-'))) blockers.push(`예약 출고일(${sh.reserveDate}) 미도래`);

  const canHold = sh.status === '출고대기';
  const canResume = sh.status === '보류';
  const blockShip = blockers.length > 0;

  function confirmShip() {
    if (blockers.length) return;
    onUpdate((s) => ({ ...s, status: '출고완료', history: [...s.history, { when: '방금', title: '출고 확정', by: 'admin01' }, { when: '방금', title: '출고 완료' }] }));
  }

  function resume() {
    onUpdate((s) => ({ ...s, status: '출고대기', history: [...s.history, { when: '방금', title: '출고 재개', by: 'admin01' }] }));
  }

  function confirmHold() {
    onUpdate((s) => ({ ...s, status: '보류', history: [...s.history, { when: '방금', title: '출고 보류', by: 'admin01' }] }));
    onConfirmedHold();
  }

  function registerInvoice() {
    onUpdate((s) => ({ ...s, invoiceNo: '1234567890', invoiceIssue: null, history: [...s.history, { when: '방금', title: '송장번호 등록', by: 'admin01' }] }));
  }

  function changeDueDate() {
    onUpdate((s) => ({ ...s, history: [...s.history, { when: '방금', title: '출고 예정일 변경 요청', by: 'admin01' }] }));
  }

  const dueLine = sh.reserved ? `예약 ${sh.reserveDate}` : sh.dueDate;
  const dueNote = c.overdue ? '출고 예정일이 지났습니다' : sh.reserved ? '예약 출고일까지 대기' : '정상 출고 대상';
  const hasChange = sh.cancelReq || sh.addrChanged;
  const changeNote = sh.changeNote || (sh.addrChanged ? '배송지가 준비 완료 이후 변경되었습니다.' : '');

  return (
    <aside className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{sh.id}</span>
              <span className={styles.badgePill} style={{ background: sm.bg, color: sm.fg }}>{sh.status}</span>
            </div>
            <div className={styles.subLine}>주문 {sh.order} · {itemsLabel}</div>
            <div className={styles.amountLine}>{dueLine}</div>
            <div className={styles.dueLine}>{dueNote}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {c.issues.length > 0 && <div className={styles.bannerAmber}>⚠ {c.issues.join(' · ')}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.linkBtn}>배송 준비 보기</button>
          <button type="button" className={styles.linkBtn}>주문 보기</button>
          <div className={styles.rowSpacer} />
          {canHold && (
            <>
              <button type="button" className={styles.secondaryBtn} onClick={onToggleHoldPanel}>출고 보류</button>
              <button type="button" className={styles.primaryBtn} onClick={confirmShip} disabled={blockShip}>출고 확정</button>
            </>
          )}
          {canResume && (
            <button type="button" className={styles.primaryBtn} onClick={resume}>출고 재개</button>
          )}
        </div>

        {showHoldPanel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>출고 보류</div>
            <select className={styles.panelSelect} defaultValue="배송지 확인">
              <option>배송지 확인</option>
              <option>고객 요청</option>
              <option>주문 변경</option>
              <option>취소 요청</option>
              <option>송장 오류</option>
              <option>택배사 문제</option>
              <option>포장 재확인</option>
              <option>기타</option>
            </select>
            <input className={styles.panelInput} placeholder="재개 예정일" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.cancelBtn} onClick={onToggleHoldPanel}>취소</button>
              <button type="button" className={styles.confirmDarkBtn} onClick={confirmHold}>보류</button>
            </div>
          </div>
        )}

        {blockShip && (
          <div className={styles.panelRed}>
            <div className={styles.panelTitleRed}>출고 확정 조건 미충족</div>
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
            <div className={styles.sectionLabel}>출고 정보</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '배송번호', value: sh.id, weight: 600, color: '#18181b' },
                { label: '주문번호', value: sh.order, weight: 500, color: '#3f3f46' },
                { label: '배송상품', value: itemsLabel, weight: 500, color: '#3f3f46' },
                { label: '출고지', value: sh.outbase, weight: 500, color: '#3f3f46' },
                { label: '택배사', value: sh.carrier, weight: sh.carrier === '미지정' ? 700 : 500, color: sh.carrier === '미지정' ? '#dc2626' : '#3f3f46' },
                { label: '송장번호', value: sh.invoiceNo || '미등록', weight: sh.invoiceNo ? 500 : 700, color: sh.invoiceNo ? '#3f3f46' : '#dc2626' },
                { label: '출고 예정', value: dueLine, weight: 600, color: c.overdue ? '#dc2626' : '#18181b' },
                { label: '출고 담당자', value: 'admin01', weight: 500, color: '#3f3f46' },
                { label: '출고 상태', value: sh.status, weight: 600, color: sm.fg },
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
            <div className={styles.sectionLabel}>출고 상품 최종 확인</div>
            <div className={styles.gridTableBox}>
              <div className={styles.gridTableHead} style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }}>
                <span>상품</span><span>주문수량</span><span>출고예정</span><span>포장상태</span>
              </div>
              {sh.items.map((it) => (
                <div className={styles.gridTableRow} style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }} key={it.name}>
                  <span className={styles.gridCellStrong}>{it.name}</span>
                  <span className={styles.gridCellNormal}>{it.qty}</span>
                  <span className={styles.gridCellNormal} style={{ fontWeight: 600, color: it.qty !== it.shipQty ? '#dc2626' : '#18181b' }}>{it.shipQty}</span>
                  <span className={styles.gridCellNormal}>{it.packStatus}</span>
                </div>
              ))}
            </div>
            {c.qtyMismatch && <div className={styles.bannerRed} style={{ marginTop: 0 }}>⚠ 출고수량이 준비수량과 다릅니다. <button type="button" className={styles.linkBtn}>배송 준비 상태 확인</button></div>}
          </div>
        )}

        {activeTab === 'place' && (
          <div>
            <div className={styles.sectionLabel}>출고지 / 배송지</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '출고지', value: sh.outbase, weight: 600, color: '#18181b' },
                { label: '수령인', value: sh.receiver, weight: 600, color: '#18181b' },
                { label: '배송지', value: sh.address, weight: sh.addrChanged ? 700 : 500, color: sh.addrChanged ? '#d97706' : '#3f3f46' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {sh.addrChanged && <div className={styles.bannerAmber}>⚠ 배송지가 준비 완료 이후 변경되었습니다.</div>}
          </div>
        )}

        {activeTab === 'invoice' && (
          <div>
            <div className={styles.sectionLabel}>택배사 / 송장</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '택배사', value: sh.carrier, weight: 500, color: '#3f3f46' },
                { label: '송장번호', value: sh.invoiceNo || '미등록', weight: sh.invoiceNo ? 600 : 700, color: sh.invoiceNo ? '#18181b' : '#dc2626' },
                { label: '송장 상태', value: sh.invoiceNo ? '정상' : '미등록', weight: 600, color: sh.invoiceNo ? '#059669' : '#d97706' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {sh.invoiceIssue && <div className={styles.bannerRed} style={{ marginBottom: 12, marginTop: 0 }}>⚠ {sh.invoiceIssue}</div>}
            {!sh.invoiceNo && (
              <div className={styles.inlineForm}>
                <input className={styles.inlineInput} placeholder="송장번호" />
                <button type="button" className={styles.inlineDarkBtn} onClick={registerInvoice}>등록</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div>
            <div className={styles.sectionLabel}>예약 출고 / 출고일 변경</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '예약 출고', value: sh.reserved ? '예' : '아니오', weight: 600, color: sh.reserved ? '#2563eb' : '#3f3f46' },
                { label: '예약 출고일', value: sh.reserveDate || '-', weight: 500, color: '#3f3f46' },
                { label: '현재 출고 예정일', value: sh.dueDate, weight: 500, color: '#3f3f46' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.inlineForm}>
              <input className={styles.inlineInput} placeholder="출고 예정일 변경" />
              <button type="button" className={styles.inlineDarkBtn} onClick={changeDueDate}>변경</button>
            </div>
          </div>
        )}

        {activeTab === 'change' && (
          <div>
            <div className={styles.sectionLabel}>취소 요청 / 변경</div>
            {hasChange ? (
              <div className={styles.bannerRed} style={{ marginTop: 0 }}>{changeNote}</div>
            ) : (
              <div className={styles.emptyNote}>취소 요청 또는 변경 이력이 없습니다.</div>
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
