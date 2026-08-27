import { useRef } from 'react';
import styles from './ordersShared.module.css';
import { fmt, STATUS_META, type PurchaseOrder } from './purchaseOrdersData';
import { useOutsideClose } from '../../lib/useOutsideClose';

const TABS: [string, string][] = [
  ['info', '발주정보'],
  ['items', '발주항목'],
  ['cond', '가격/조건'],
  ['delivery', '납품정보'],
  ['verify', '검증결과'],
  ['links', '연결업무'],
  ['files', '첨부파일'],
  ['memo', '관리자메모'],
  ['history', '처리이력'],
];

interface Props {
  order: PurchaseOrder;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showConfirmPanel: boolean;
  showRejectPanel: boolean;
  onToggleConfirm: () => void;
  onToggleReject: () => void;
  onStartReview: () => void;
  onConfirmOrder: () => void;
  onReject: () => void;
}

export function PurchaseOrderDetailDrawer({
  order: o,
  activeTab,
  onTabChange,
  onClose,
  showConfirmPanel,
  showRejectPanel,
  onToggleConfirm,
  onToggleReject,
  onStartReview,
  onConfirmOrder,
  onReject,
}: Props) {
  const sm = STATUS_META[o.status];
  const canReview = o.status === '접수';
  const canAct = o.status === '검토중';
  const canCancel = o.status === '확정' || o.status === '처리중';
  const expectedCredit = o.credit.used + o.amount;

  const checks = [
    { label: '가격 정상', icon: o.priceMismatch ? '⚠' : '✓', fg: o.priceMismatch ? '#d97706' : '#059669' },
    { label: 'MOQ 정상', icon: o.moqOk ? '✓' : '⚠', fg: o.moqOk ? '#059669' : '#dc2626' },
    { label: '신용한도 정상', icon: expectedCredit <= o.credit.limit ? '✓' : '⚠', fg: expectedCredit <= o.credit.limit ? '#059669' : '#dc2626' },
    { label: '공급 가능', icon: o.supplyOk ? '✓' : '⚠', fg: o.supplyOk ? '#059669' : '#dc2626' },
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
            <div className={styles.partnerLine}>{o.partner} · {o.contact}</div>
            <div className={styles.metaLine}>발주금액 <b style={{ color: '#18181b' }}>{fmt(o.amount)}</b> · 요청납기 {o.dueDate} · 담당자 {o.owner}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.linksRow}>
          <a href="#">거래처 상세</a>
          {o.rfq && <a href="#">견적 보기</a>}
          {o.contract && <a href="#">계약 보기</a>}
          <div className={styles.rowSpacer} />
          {canReview && (
            <button type="button" className={styles.primaryBtn} onClick={onStartReview}>검토 시작</button>
          )}
          {canAct && (
            <>
              <button type="button" className={styles.dangerOutlineBtn} onClick={onToggleReject}>반려</button>
              <button type="button" className={styles.primaryBtn} onClick={onToggleConfirm}>발주 확정</button>
            </>
          )}
          {canCancel && (
            <button type="button" className={styles.secondaryBtn}>발주 취소</button>
          )}
        </div>

        {showConfirmPanel && (
          <div className={styles.panelNeutral}>
            <div className={styles.panelTitle}>발주를 확정하시겠습니까?</div>
            <div className={styles.panelNote}>발주금액 {fmt(o.amount)} · 항목 {o.items.length}건</div>
            <div className={styles.panelCheckList}>
              {checks.map((c) => (
                <div className={styles.panelCheckLine} style={{ color: c.fg }} key={c.label}>{c.icon} {c.label}</div>
              ))}
            </div>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleConfirm}>취소</button>
              <button type="button" className={styles.panelConfirmAccent} onClick={onConfirmOrder}>발주 확정</button>
            </div>
          </div>
        )}

        {showRejectPanel && (
          <div className={styles.panelRed}>
            <div className={styles.panelTitleRed}>발주 반려</div>
            <select className={styles.panelSelect} defaultValue="거래조건 미충족">
              <option>거래조건 미충족</option><option>가격 확인 필요</option><option>상품 공급 불가</option>
              <option>수량 조건 미충족</option><option>신용조건 문제</option><option>계약 조건 불일치</option>
              <option>정보 부족</option><option>기타</option>
            </select>
            <textarea className={styles.panelTextarea} placeholder="상세 사유를 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleReject}>취소</button>
              <button type="button" className={styles.panelConfirmRed} onClick={onReject}>발주 반려</button>
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
        {activeTab === 'info' && (
          <div>
            <div className={styles.sectionLabel}>발주정보</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '발주번호', value: o.id },
                { label: '거래처', value: o.partner },
                { label: '거래처 담당자', value: o.contact },
                { label: '발주일', value: o.created },
                { label: '발주 기준', value: o.basis },
                { label: '현재 상태', value: o.status },
                { label: '내부 담당자', value: o.owner },
              ].map((f) => (
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
            <div className={styles.sectionLabel}>발주 항목 · 총 {o.items.length}건</div>
            {o.items.map((it) => (
              <div className={styles.itemCard} key={it.code}>
                <div className={styles.itemHeadRow}>
                  <div>
                    <div className={styles.itemName}>{it.name}</div>
                    <div className={styles.itemCode}>{it.code}</div>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.itemQty}>{fmt(it.qty * it.unitPrice)}</div>
                    <div className={styles.itemSub}>{it.qty} {it.unit} · 납기 {it.due}</div>
                  </div>
                </div>
                <div className={styles.itemGrid3}>
                  <div>
                    <div className={styles.itemGridCellLabel}>적용 단가</div>
                    <div className={styles.itemGridCellValueBold}>{fmt(it.unitPrice)}</div>
                  </div>
                  <div>
                    <div className={styles.itemGridCellLabel}>적용 근거</div>
                    <div className={styles.itemGridCellValue}>{it.priceBasis}</div>
                  </div>
                  <div>
                    <div className={styles.itemGridCellLabel}>최소 주문수량</div>
                    <div className={styles.itemGridCellValue}>{it.moq}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cond' && (
          <div>
            <div className={styles.sectionLabel}>가격 / 조건</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '결제조건', value: o.paymentTerm },
                { label: '발주 기준', value: o.basis },
                { label: '연결 견적', value: o.quote || '없음' },
                { label: '연결 계약', value: o.contract || '없음' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            {o.priceMismatch && (
              <div className={styles.bannerAmber} style={{ marginTop: 0 }}>⚠ 발주서 단가가 현재 시스템 적용 단가와 다릅니다.</div>
            )}
          </div>
        )}

        {activeTab === 'delivery' && (
          <div>
            <div className={styles.sectionLabel}>납품 정보</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '납품처', value: o.deliveryPlace },
                { label: '수령 담당자', value: o.deliveryContact },
                { label: '요청 납기', value: o.dueDate },
                { label: '요청사항', value: o.remark || '-' },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'verify' && (
          <div>
            <div className={styles.sectionLabel}>검증 결과</div>
            {[
              { label: '가격 일치 여부', status: o.priceMismatch ? '⚠ 불일치' : '✓ 정상', fg: o.priceMismatch ? '#d97706' : '#059669' },
              { label: '최소 주문수량(MOQ)', status: o.moqOk ? '✓ 충족' : '⚠ 미충족', fg: o.moqOk ? '#059669' : '#dc2626' },
              { label: '신용한도', status: expectedCredit <= o.credit.limit ? `✓ 한도 내 (${Math.round((expectedCredit / o.credit.limit) * 100)}%)` : '⚠ 한도 초과', fg: expectedCredit <= o.credit.limit ? '#059669' : '#dc2626' },
              { label: '계약 조건', status: o.contractOk ? '✓ 정상' : '⚠ 확인 필요', fg: o.contractOk ? '#059669' : '#dc2626' },
              { label: '공급 가능 여부', status: o.supplyOk ? '✓ 공급 가능' : '⚠ 공급 불가', fg: o.supplyOk ? '#059669' : '#dc2626' },
            ].map((v) => (
              <div className={styles.checkRow} key={v.label}>
                <span className={styles.checkLabel}>{v.label}</span>
                <span className={styles.checkValue} style={{ color: v.fg }}>{v.status}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'links' && (
          <div>
            <div className={styles.sectionLabel}>연결 업무</div>
            <div className={styles.fieldsBox}>
              {[
                { label: '견적 요청', value: o.rfq || '없음', color: o.rfq ? 'var(--accent)' : '#71717a' },
                { label: '견적서', value: o.quote || '없음', color: o.quote ? 'var(--accent)' : '#71717a' },
                { label: '계약', value: o.contract || '없음', color: o.contract ? 'var(--accent)' : '#71717a' },
                { label: '주문', value: o.order || '없음', color: o.order ? 'var(--accent)' : '#71717a' },
              ].map((lf) => (
                <div className={styles.fieldRow} key={lf.label}>
                  <span className={styles.fieldLabel}>{lf.label}</span>
                  <span className={styles.fieldValue} style={{ color: lf.color }}>{lf.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div>
            <div className={styles.sectionLabel}>첨부파일</div>
            {o.files.map((f) => (
              <div className={styles.fileRow} key={f.name}>
                <span className={styles.fileName}>📎 {f.name}</span>
                <span className={styles.fileMeta}>{f.meta}</span>
              </div>
            ))}
            {o.files.length === 0 && <div className={styles.emptyNote}>첨부된 파일이 없습니다.</div>}
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
