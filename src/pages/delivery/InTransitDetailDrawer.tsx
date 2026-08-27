import { useRef } from 'react';
import styles from './deliveryShared.module.css';
import { buildTabs } from './deliverySharedData';
import { calcTransit, statusMeta, type TransitShipment } from './inTransitData';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface Props {
  shipment: TransitShipment;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  onUpdate: (updater: (sh: TransitShipment) => TransitShipment) => void;
}

const TABS: [string, string][] = [
  ['summary', '배송요약'],
  ['tracking', 'Tracking'],
  ['items', '상품/배송지'],
  ['issue', '배송이슈'],
  ['history', '메모/이력'],
];

export function InTransitDetailDrawer({ shipment: sh, activeTab, onTabChange, onClose, onUpdate }: Props) {
  const c = calcTransit(sh);
  const sm = statusMeta(sh.carrierStatus);
  const itemsLabel = `${sh.items.length}종 / 총 ${sh.items.reduce((a, it) => a + it.qty, 0)}개`;
  const tabs = buildTabs(TABS, activeTab, onTabChange);
  const lastAtLabel = sh.lastAt.slice(0, 16).replace('T', ' ');
  const etaLabel = sh.eta === '2026.08.20' ? '오늘' : sh.eta;

  function refetch() {
    onUpdate((s) => ({ ...s, history: [{ when: '방금', title: '상태 재조회 · 변경 없음', by: 'system' }, ...s.history] }));
  }

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{sh.id}</span>
              <span className={styles.badgePill} style={{ background: '#eef2ff', color: '#4338ca' }}>{sh.internalStatus}</span>
            </div>
            <div className={styles.subLine}>주문 {sh.order} · {itemsLabel}</div>
            <div className={styles.amountLine}>{sh.carrierStatus}</div>
            <div className={styles.dueLine}>{sh.carrier} · {sh.invoiceNo} · 예상 도착 {etaLabel}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {c.issues.length > 0 && <div className={styles.bannerAmber}>⚠ {c.issues.join(' · ')}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.linkBtn}>주문 보기</button>
          <button type="button" className={styles.linkBtn}>송장 조회</button>
          <div className={styles.rowSpacer} />
          <button type="button" className={styles.secondaryBtn} onClick={refetch}>상태 재조회</button>
        </div>

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
            <div className={styles.sectionLabel}>배송 요약</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '배송번호', value: sh.id, weight: 600, color: '#18181b' },
                { label: '주문번호', value: sh.order, weight: 500, color: '#3f3f46' },
                { label: '택배사', value: sh.carrier, weight: 500, color: '#3f3f46' },
                { label: '송장번호', value: sh.invoiceNo, weight: 500, color: '#3f3f46' },
                { label: '내부 배송상태', value: sh.internalStatus, weight: 600, color: '#4338ca' },
                { label: '택배사 상세상태', value: sh.carrierStatus, weight: 600, color: sm.fg },
                { label: '최근 갱신', value: lastAtLabel, weight: 500, color: '#3f3f46' },
                { label: '예상 도착', value: etaLabel, weight: c.overdue ? 700 : 500, color: c.overdue ? '#dc2626' : '#18181b' },
                { label: '배송 이슈', value: c.issues.length ? c.issues.length + '건' : '없음', weight: 600, color: c.issues.length ? '#d97706' : '#3f3f46' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {sh.mismatch && (
              <div className={styles.bannerRed}>⚠ 내부 상태와 택배사 상태가 일치하지 않습니다. <button type="button" className={styles.linkBtn}>배송상태 동기화</button></div>
            )}
          </div>
        )}

        {activeTab === 'tracking' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>배송 Tracking</div>
            {sh.tracking.map((tk, i) => (
              <div className={styles.trackingItem} key={i}>
                <div className={styles.trackingDot} style={{ background: tk.dot }} />
                <div className={styles.trackingBody}>
                  <div className={styles.trackingTopRow}>
                    <span className={styles.trackingTitle}>{tk.title}</span>
                    <span className={styles.trackingWhen}>{tk.when}</span>
                  </div>
                  {tk.loc && <div className={styles.trackingLoc}>{tk.loc}</div>}
                  <div className={styles.trackingSource}>{tk.source}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'items' && (
          <div>
            <div className={styles.sectionLabel}>배송 상품</div>
            <div className={styles.fieldsBox}>
              {sh.items.map((it) => (
                <div className={styles.fieldRow} key={it.name}>
                  <span className={styles.gridCellStrong}>{it.name}</span>
                  <span className={styles.gridCellNormal}>{it.qty}개</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>수령인 / 배송지</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '수령인', value: sh.receiver },
                { label: '배송지', value: sh.address },
                { label: '배송 요청사항', value: sh.reqNote },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ color: '#3f3f46' }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.emptyNote} style={{ marginTop: 10, color: '#a1a1aa' }}>배송중 상태에서는 배송지를 직접 변경할 수 없습니다.</div>
          </div>
        )}

        {activeTab === 'issue' && (
          <div>
            <div className={styles.sectionLabel}>배송 이슈</div>
            {c.issues.length > 0 ? (
              <>
                {c.issues.map((ix, i) => <div className={styles.bannerAmber} style={{ marginTop: i === 0 ? 0 : 8 }} key={i}>⚠ {ix}</div>)}
                <div className={styles.smallBtnRow}>
                  <button type="button" className={styles.smallOutlineBtn} style={{ marginTop: 0 }}>배송사 문의 기록</button>
                  <button type="button" className={styles.smallOutlineBtn} style={{ marginTop: 0 }}>배송 실패 처리</button>
                </div>
              </>
            ) : (
              <div className={styles.emptyNote}>현재 확인이 필요한 배송 이슈가 없습니다.</div>
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
