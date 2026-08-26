import { useRef } from 'react';
import styles from './ProductDetailDrawer.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import type { ProductDetail } from './productDetail';

const TABS: [string, string][] = [
  ['basic', '기본정보'],
  ['price', '가격'],
  ['options', '옵션/규격'],
  ['orderCond', '주문 조건'],
  ['supplyCond', '공급 조건'],
  ['partners', '거래처 설정'],
  ['inventory', '재고/공급 현황'],
  ['deals', '거래 내역'],
  ['history', '변경 이력'],
];

interface Props {
  detail: ProductDetail;
  tab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showSaleConfirm: boolean;
  onToggleSale: () => void;
  onConfirmSale: () => void;
}

export function ProductDetailDrawer({ detail: d, tab, onTabChange, onClose, showSaleConfirm, onToggleSale, onConfirmSale }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.nameCol}>
            <div className={styles.eyebrow}>상품 상세 · {d.code}</div>
            <div className={styles.nameRow}>
              <span className={styles.name}>{d.name}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
              <span className={styles.badge} style={{ background: '#f4f4f5', color: d.supplyFg }}>{d.supplyLabel}</span>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.actionsRow}>
          <button type="button" className={styles.secondaryBtn}>수정</button>
          <button type="button" className={styles.secondaryBtn}>복제</button>
          <div className={styles.actionsSpacer} />
          <button
            type="button"
            className={styles.dangerBtn}
            style={{ borderColor: d.saleBorder, background: d.saleBg, color: d.saleFg }}
            onClick={onToggleSale}
          >
            {d.saleActionLabel}
          </button>
        </div>

        {showSaleConfirm && (
          <div className={styles.confirmPanel}>
            <div className={styles.confirmText}>
              상품 판매를 중지하시겠습니까?
              <br />
              중지 후 신규 주문·견적에서 선택할 수 없습니다. 진행 중 주문 {d.openOrders}건은 유지됩니다.
            </div>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.ghostBtn} onClick={onToggleSale}>취소</button>
              <button type="button" className={styles.confirmDangerBtn} onClick={onConfirmSale}>판매 중지</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`${styles.tabBtn} ${tab === key ? styles.active : ''}`}
              onClick={() => onTabChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {tab === 'basic' && (
          <div>
            <div className={styles.sectionLabel}>기본정보</div>
            <div className={styles.fieldsBox}>
              {d.basicFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>상품 설명</div>
            <div className={styles.textBox}>{d.description}</div>
          </div>
        )}

        {tab === 'price' && (
          <div>
            <div className={styles.sectionLabel}>가격 정보</div>
            <div className={styles.fieldsBox}>
              {d.priceFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>연결된 가격 정책</div>
            {d.priceLinks.map((pl) => (
              <div className={styles.linkRow} key={pl.label}>
                <span className={styles.linkRowLabel}>{pl.label}</span>
                <span className={styles.linkRowRight}>
                  <span className={styles.linkRowValue}>{pl.value}</span>
                  <a href="#">{pl.action}</a>
                </span>
              </div>
            ))}
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>가격 적용 우선순위</div>
            <div className={styles.priorityNote}>계약 단가 → 거래처별 단가 → 수량별 단가 → 기본 가격</div>
          </div>
        )}

        {tab === 'options' && (
          <div>
            <div className={styles.sectionLabelRow}>
              <span className={styles.sectionLabel} style={{ marginBottom: 0 }}>옵션 / 규격</span>
              <button type="button" className={styles.smallBtn}>＋ 옵션 추가</button>
            </div>
            <div className={styles.miniTable}>
              <div className={styles.miniHeadRow} style={{ gridTemplateColumns: '1fr 90px 100px 66px' }}>
                <span>옵션명</span><span>옵션코드</span><span style={{ textAlign: 'right' }}>추가금액</span><span style={{ textAlign: 'right' }}>상태</span>
              </div>
              {d.options.map((o) => (
                <div className={styles.miniRow} style={{ gridTemplateColumns: '1fr 90px 100px 66px' }} key={o.code}>
                  <span style={{ fontSize: '12.5px', color: '#18181b' }}>{o.name}</span>
                  <span style={{ fontSize: '11.5px', color: '#71717a', fontVariantNumeric: 'tabular-nums' }}>{o.code}</span>
                  <span style={{ fontSize: '12px', color: '#3f3f46', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{o.extra}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, textAlign: 'right', color: o.statusFg }}>{o.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'orderCond' && (
          <div>
            <div className={styles.sectionLabel}>주문 조건</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 10 }}>
              {d.orderFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <a href="#">거래처별 주문 조건 보기</a>
          </div>
        )}

        {tab === 'supplyCond' && (
          <div>
            <div className={styles.sectionLabel}>공급 조건</div>
            <div className={styles.fieldsBox}>
              {d.supplyFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'partners' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 9 }}>판매 대상</div>
            <div className={styles.mutedText} style={{ marginBottom: 14 }}>{d.salesTarget}</div>
            <div className={styles.sectionLabel}>거래처별 설정</div>
            <div className={styles.miniTable}>
              <div className={styles.miniHeadRow} style={{ gridTemplateColumns: '1fr 66px 90px 56px 60px' }}>
                <span>거래처</span><span>판매</span><span style={{ textAlign: 'right' }}>개별단가</span><span style={{ textAlign: 'right' }}>MOQ</span><span style={{ textAlign: 'right' }}>상태</span>
              </div>
              {d.partnerRows.map((p) => (
                <div className={styles.miniRow} style={{ gridTemplateColumns: '1fr 66px 90px 56px 60px' }} key={p.name}>
                  <span style={{ fontSize: '12.5px', color: '#18181b' }}>{p.name}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: p.allowFg }}>{p.allow}</span>
                  <span style={{ fontSize: '12px', color: '#3f3f46', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.price}</span>
                  <span style={{ fontSize: '12px', color: '#3f3f46', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.moq}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, textAlign: 'right', color: p.statusFg }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'inventory' && (
          <div>
            {d.inventoryManaged ? (
              <>
                <div className={styles.fieldsBox} style={{ marginBottom: 12 }}>
                  {d.inventoryFields.map((f) => (
                    <div className={styles.fieldRow} key={f.label}>
                      <span className={styles.fieldLabel}>{f.label}</span>
                      <span className={styles.fieldValue} style={{ fontWeight: 600, color: f.color }}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <a href="#">재고 관리 보기</a>
              </>
            ) : (
              <div className={styles.mutedText}>재고 관리 미사용 상품입니다.</div>
            )}
          </div>
        )}

        {tab === 'deals' && (
          <div>
            <div className={styles.dealSummaryRow}>
              {d.dealSummary.map((s) => (
                <div key={s.label}>
                  <div className={styles.dealSummaryLabel}>{s.label}</div>
                  <div className={styles.dealSummaryValue}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.miniTable}>
              <div className={styles.miniHeadRow} style={{ gridTemplateColumns: '90px 1fr 64px 1fr 66px' }}>
                <span>주문번호</span><span>거래처</span><span style={{ textAlign: 'right' }}>수량</span><span style={{ textAlign: 'right' }}>금액</span><span style={{ textAlign: 'right' }}>주문일</span>
              </div>
              {d.deals.map((deal) => (
                <div className={styles.miniRow} style={{ gridTemplateColumns: '90px 1fr 64px 1fr 66px' }} key={deal.no}>
                  <span style={{ fontSize: '12px', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{deal.no}</span>
                  <span style={{ fontSize: '12.5px', color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.partner}</span>
                  <span style={{ fontSize: '12px', color: '#3f3f46', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{deal.qty}</span>
                  <span style={{ fontSize: '12px', color: '#3f3f46', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{deal.amount}</span>
                  <span style={{ fontSize: '11.5px', color: '#8b8b93', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{deal.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 2 }}>변경 이력</div>
            <div className={styles.sectionSub}>가격 · 판매상태 · 주문/공급조건 변경을 추적합니다</div>
            {d.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineTitle}>{h.field}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineFrom}>{h.from} → {h.to}</div>
                  <div className={styles.timelineAdmin}>{h.admin}</div>
                </div>
              </div>
            ))}

            <div className={styles.sectionLabel} style={{ margin: '18px 0 8px' }}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" />
              <button type="button" className={styles.memoAddBtn}>등록</button>
            </div>
            {d.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.admin}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
