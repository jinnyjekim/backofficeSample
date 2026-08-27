import { useRef } from 'react';
import styles from './deliveryShared.module.css';
import { buildTabs } from './deliverySharedData';
import { calcComplete, fmtDur, TYPE_META, type CompleteShipment } from './deliveryCompleteData';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface Props {
  shipment: CompleteShipment;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
}

const TABS: [string, string][] = [
  ['summary', '완료요약'],
  ['items', '상품'],
  ['receipt', '수령결과'],
  ['tracking', 'Tracking'],
  ['aftercare', '사후이슈'],
  ['history', '메모/이력'],
];

export function DeliveryCompleteDetailDrawer({ shipment: sh, activeTab, onTabChange, onClose }: Props) {
  const tm = TYPE_META[sh.type];
  const c = calcComplete(sh);
  const itemsLabel = `${sh.items.length}종 / 총 ${sh.items.reduce((a, it) => a + it.delivered, 0)}개`;
  const tabs = buildTabs(TABS, activeTab, onTabChange);
  const delayDays = Math.max(
    0,
    Math.round(
      (new Date(sh.completedAt.split(' ')[0].replace(/\./g, '-')).getTime() - new Date(sh.plannedEta.replace(/\./g, '-')).getTime()) / 86400000,
    ),
  );
  const hasIssue = sh.type === '지연' || sh.aftercare.length > 0;
  const issueLabel = sh.type === '지연' ? `${delayDays}일 지연 완료` : sh.aftercare.length ? `${sh.aftercare[0].type} 진행중` : '';

  const compareRows = [
    { label: '배송 예정일', planned: sh.plannedEta, actual: sh.completedAt.split(' ')[0], actualColor: sh.type === '지연' ? '#dc2626' : '#18181b' },
    { label: '배송 소요', planned: '-', actual: fmtDur(c.durationH), actualColor: '#18181b' },
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
              <span className={styles.badgePill} style={{ background: tm.bg, color: tm.fg }}>{sh.type} 완료</span>
            </div>
            <div className={styles.subLine}>주문 {sh.order} · {itemsLabel}</div>
            <div className={styles.amountLine}>{`배송 완료 ${sh.completedAt}`}</div>
            <div className={styles.dueLine}>배송 소요 {fmtDur(c.durationH)}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {hasIssue && <div className={styles.bannerAmber}>⚠ {issueLabel}</div>}

        <div className={styles.actionsRow}>
          <button type="button" className={styles.linkBtn}>주문 보기</button>
          <button type="button" className={styles.linkBtn}>Tracking 보기</button>
          <div className={styles.rowSpacer} />
          <button type="button" className={styles.secondaryBtn}>배송 완료 정정</button>
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
            <div className={styles.sectionLabel}>배송 완료 정보</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '배송번호', value: sh.id, weight: 600, color: '#18181b' },
                { label: '주문번호', value: sh.order, weight: 500, color: '#3f3f46' },
                { label: '택배사', value: sh.carrier, weight: 500, color: '#3f3f46' },
                { label: '송장번호', value: sh.invoiceNo, weight: 500, color: '#3f3f46' },
                { label: '출고일', value: sh.outAt, weight: 500, color: '#3f3f46' },
                { label: '배송 완료일', value: sh.completedAt, weight: 700, color: '#18181b' },
                { label: '배송 소요', value: fmtDur(c.durationH), weight: 500, color: '#3f3f46' },
                { label: '완료 유형', value: sh.type + ' 완료', weight: 600, color: tm.fg },
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
            <div className={styles.sectionLabel}>배송 상품 (최종)</div>
            <div className={styles.gridTableBox}>
              <div className={styles.gridTableHead} style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }}>
                <span>상품</span><span>출고수량</span><span>배송완료</span><span>결과</span>
              </div>
              {sh.items.map((it) => (
                <div className={styles.gridTableRow} style={{ gridTemplateColumns: '1.4fr 1fr 1fr 1fr' }} key={it.name}>
                  <span className={styles.gridCellStrong}>{it.name}</span>
                  <span className={styles.gridCellNormal}>{it.out}</span>
                  <span className={styles.gridCellStrong}>{it.delivered}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#059669' }}>완료</span>
                </div>
              ))}
            </div>
            {sh.siblings.length > 0 && (
              <>
                <div className={styles.sectionLabel}>주문 배송 진행</div>
                <div className={styles.orderProgressNote}>{sh.orderProgress}</div>
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

        {activeTab === 'receipt' && (
          <div>
            <div className={styles.sectionLabel}>수령 결과</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '배송 완료일', value: sh.completedAt, weight: 600, color: '#18181b' },
                { label: '수령 방식', value: sh.method, weight: 500, color: '#3f3f46' },
                { label: '수령 결과', value: '정상 전달', weight: 500, color: '#3f3f46' },
                { label: '완료 처리', value: '택배사 API', weight: 500, color: '#3f3f46' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>배송 완료 증빙</div>
            {sh.proofs.length > 0 ? (
              sh.proofs.map((p) => (
                <div className={styles.proofRow} key={p}>
                  <span className={styles.proofLabel}>{p}</span>
                  <button type="button" className={styles.proofLink}>보기</button>
                </div>
              ))
            ) : (
              <div className={styles.emptyNote}>등록된 배송 완료 증빙이 없습니다.</div>
            )}
          </div>
        )}

        {activeTab === 'tracking' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>Tracking Timeline</div>
            {sh.tracking.map((tk, i) => (
              <div className={styles.trackingItem} key={i}>
                <div className={styles.trackingDot} style={{ background: tk.dot }} />
                <div className={styles.trackingBody}>
                  <div className={styles.trackingTopRow}>
                    <span className={styles.trackingTitle}>{tk.title}</span>
                    <span className={styles.trackingWhen}>{tk.when}</span>
                  </div>
                  <div className={styles.trackingSource}>{tk.source}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'aftercare' && (
          <div>
            <div className={styles.sectionLabel}>사후 이슈</div>
            {sh.aftercare.length > 0 ? (
              sh.aftercare.map((ac, i) => (
                <div className={styles.aftercareCard} key={i}>
                  <div>
                    <div className={styles.aftercareTitle}>{ac.type} · {ac.id}</div>
                    <div className={styles.aftercareNote}>{ac.note}</div>
                  </div>
                  <span className={styles.aftercareStatus} style={{ color: ac.fg }}>{ac.status}</span>
                </div>
              ))
            ) : (
              <div className={styles.emptyNote}>배송 완료 후 확인이 필요한 이슈가 없습니다.</div>
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
            <div className={styles.historyLabel}>전체 이력</div>
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
