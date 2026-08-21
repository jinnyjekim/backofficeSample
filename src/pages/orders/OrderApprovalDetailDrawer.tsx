import styles from './ordersShared.module.css';
import { fmt, STATUS_META, type Approval } from './orderApprovalData';

const TABS: [string, string][] = [
  ['items', '주문 항목'],
  ['compare', '견적/계약'],
  ['moq', 'MOQ'],
  ['credit', '신용/미수'],
  ['supply', '공급/납기'],
  ['chain', '승인선/의견'],
  ['history', '승인 이력'],
];

interface Props {
  approval: Approval;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showApprovePanel: boolean;
  showRejectPanel: boolean;
  onToggleApprove: () => void;
  onToggleReject: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function OrderApprovalDetailDrawer({
  approval: a,
  activeTab,
  onTabChange,
  onClose,
  showApprovePanel,
  showRejectPanel,
  onToggleApprove,
  onToggleReject,
  onApprove,
  onReject,
}: Props) {
  const sm = STATUS_META[a.status];
  const canAct = a.status === '대기';
  const expectedCredit = a.credit.used + a.amount;
  const totalQty = a.items.reduce((sum, it) => sum + it.qty, 0);

  const summary = [
    { label: '주문금액', value: fmt(a.amount), color: '#18181b' },
    { label: '주문 항목', value: `${a.items.length}건`, color: '#3f3f46' },
    { label: '요청 납기', value: a.dueRequested, color: '#3f3f46' },
    { label: '확정 예정 납기', value: a.dueConfirmed, color: a.dueRequested !== a.dueConfirmed ? '#d97706' : '#3f3f46' },
    { label: '승인 필요 사유', value: `${a.reasons.length}건`, color: a.reasons.length ? '#dc2626' : '#059669' },
  ];

  const compareRows = a.quoteAmount
    ? [
        { label: '총 수량', from: String(totalQty - 10), to: String(totalQty), weight: 700, fg: '#d97706' },
        { label: '총 금액', from: fmt(a.quoteAmount), to: fmt(a.amount), weight: 700, fg: a.amount !== a.quoteAmount ? '#d97706' : '#3f3f46' },
        { label: '납기', from: a.dueRequested, to: a.dueConfirmed, weight: a.dueRequested !== a.dueConfirmed ? 700 : 500, fg: a.dueRequested !== a.dueConfirmed ? '#d97706' : '#3f3f46' },
      ]
    : [{ label: '연결 견적', from: '-', to: '없음 (직접 발주)', weight: 500, fg: '#71717a' }];

  const contractFields = a.contract
    ? [
        { label: '계약번호', value: a.contract.no, weight: 500, color: '#3f3f46' },
        { label: '계약 단가', value: fmt(a.contract.unitPrice), weight: 500, color: '#3f3f46' },
        { label: '주문 단가', value: fmt(a.contract.orderPrice), weight: a.contract.unitPrice !== a.contract.orderPrice ? 700 : 500, color: a.contract.unitPrice !== a.contract.orderPrice ? '#d97706' : '#3f3f46' },
        { label: '계약 잔여수량', value: `${a.contract.remainQty - a.contract.orderQty}개`, weight: a.contract.orderQty > a.contract.remainQty ? 700 : 500, color: a.contract.orderQty > a.contract.remainQty ? '#dc2626' : '#3f3f46' },
      ]
    : [{ label: '연결 계약', value: '없음', weight: 500, color: '#71717a' }];

  const creditFields = [
    { label: '신용한도', value: fmt(a.credit.limit), weight: 500, color: '#3f3f46' },
    { label: '현재 사용', value: fmt(a.credit.used), weight: 500, color: '#3f3f46' },
    { label: '이번 주문', value: fmt(a.amount), weight: 500, color: '#3f3f46' },
    { label: '승인 후 예상', value: fmt(expectedCredit), weight: 700, color: expectedCredit > a.credit.limit ? '#dc2626' : '#18181b' },
    { label: '연체금액', value: a.overdue ? fmt(a.overdue) : '없음', weight: a.overdue ? 700 : 500, color: a.overdue ? '#dc2626' : '#059669' },
  ];

  const supplyFields = [
    ...a.supplyChecks.map((sc) => ({ label: sc.name, value: sc.status, weight: sc.status !== '공급가능' ? 700 : 500, color: sc.status !== '공급가능' ? '#dc2626' : '#059669' })),
    { label: '요청 납기', value: a.dueRequested, weight: 500, color: '#3f3f46' },
    { label: '확정 예정 납기', value: a.dueConfirmed, weight: a.dueRequested !== a.dueConfirmed ? 700 : 500, color: a.dueRequested !== a.dueConfirmed ? '#d97706' : '#3f3f46' },
  ];

  return (
    <aside className={styles.aside}>
      <div className={styles.asideTop}>
        <div className={styles.headRowD}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{a.id}</span>
              <span className={styles.badgePill} style={{ background: sm.bg, color: sm.fg }}>{a.status}</span>
              <span className={styles.stageText}>{a.stageLabel}</span>
            </div>
            <div className={styles.partnerLine}>{a.partner} · 발주 {a.poNo}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.summaryBox}>
          <div className={styles.reasonsTitle}>승인 검토 요약</div>
          <div className={styles.summaryGrid}>
            {summary.map((s) => (
              <div className={styles.summaryRow} key={s.label}>
                <span className={styles.summaryRowLabel}>{s.label}</span>
                <span className={styles.summaryRowValue} style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {a.reasons.length > 0 && (
          <div className={styles.reasonsBanner}>
            <div className={styles.reasonsTitle}>승인 필요 사유</div>
            {a.reasons.map((r) => (
              <div className={styles.reasonLine} key={r}>⚠ {r}</div>
            ))}
          </div>
        )}

        <div className={styles.linksRow}>
          <a href="#">주문 상세</a>
          <a href="#">발주 보기</a>
          <div className={styles.rowSpacer} />
          {canAct && (
            <>
              <button type="button" className={styles.dangerOutlineBtn} onClick={onToggleReject}>반려</button>
              <button type="button" className={styles.primaryBtn} onClick={onToggleApprove}>승인</button>
            </>
          )}
        </div>

        {showApprovePanel && (
          <div className={styles.panelNeutral}>
            <div className={styles.panelTitle}>주문을 승인하시겠습니까?</div>
            {a.reasons.length > 0 && <div className={styles.panelWarnNote}>⚠ 예외 조건이 포함된 승인입니다.</div>}
            <textarea className={styles.panelTextarea} placeholder="승인 의견을 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleApprove}>취소</button>
              <button type="button" className={styles.panelConfirmAccent} onClick={onApprove}>주문 승인</button>
            </div>
          </div>
        )}

        {showRejectPanel && (
          <div className={styles.panelRed}>
            <div className={styles.panelTitleRed}>주문 반려</div>
            <select className={styles.panelSelect} defaultValue="가격 조건 재검토">
              <option>가격 조건 재검토</option><option>수량 조건 미충족</option><option>신용 조건 미충족</option>
              <option>계약 조건 불일치</option><option>공급 불가</option><option>납기 조정 필요</option>
              <option>거래처 상태 문제</option><option>기타</option>
            </select>
            <textarea className={styles.panelTextarea} placeholder="상세 사유를 입력하세요" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleReject}>취소</button>
              <button type="button" className={styles.panelConfirmRed} onClick={onReject}>주문 반려</button>
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
        {activeTab === 'items' && (
          <div>
            <div className={styles.sectionLabel}>주문 항목</div>
            {a.items.map((it) => (
              <div className={styles.itemCard} key={it.name}>
                <div className={styles.itemHeadRow}>
                  <span className={styles.itemName}>{it.name}</span>
                  <span className={styles.itemQty}>{fmt(it.qty * it.unitPrice)}</span>
                </div>
                <div className={styles.itemGrid3}>
                  <div>
                    <div className={styles.itemGridCellLabel}>수량 / 단가</div>
                    <div className={styles.itemGridCellValue}>{it.qty}개 · {fmt(it.unitPrice)}</div>
                  </div>
                  <div>
                    <div className={styles.itemGridCellLabel}>가격 조건</div>
                    <div className={styles.itemGridCellValue}>{it.priceBasis}</div>
                  </div>
                  <div>
                    <div className={styles.itemGridCellLabel}>검증</div>
                    <div className={styles.itemGridCellValueBold} style={{ color: it.verifyOk ? '#059669' : '#dc2626' }}>
                      {it.verifyOk ? '정상' : '⚠ 확인 필요'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'compare' && (
          <div>
            <div className={styles.sectionLabel}>견적 대비 주문</div>
            <div className={styles.compareBox}>
              <div className={styles.compareGridHead}>
                <span>항목</span><span>견적</span><span>주문</span>
              </div>
              {compareRows.map((cr) => (
                <div className={styles.compareGridRow} key={cr.label}>
                  <span className={styles.compareCellLabel}>{cr.label}</span>
                  <span className={styles.compareCellValue}>{cr.from}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: cr.weight, color: cr.fg }}>{cr.to}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>계약 검증</div>
            <div className={styles.compareBox} style={{ marginBottom: 0 }}>
              {contractFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'moq' && (
          <div>
            <div className={styles.sectionLabel}>수량 / MOQ 검증</div>
            {a.moqChecks.map((mc) => (
              <div className={styles.checkRow} key={mc.name}>
                <span className={styles.checkLabel}>{mc.name} · 주문 {mc.qty} / MOQ {mc.moq}</span>
                <span className={styles.checkValue} style={{ color: mc.ok ? '#059669' : '#dc2626' }}>{mc.ok ? '✓ 정상' : '⚠ 미충족'}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'credit' && (
          <div>
            <div className={styles.sectionLabel}>신용 / 미수 현황</div>
            <div className={styles.fieldsBox}>
              {creditFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>거래처 상태</div>
            <div className={styles.checkRow}>
              <span className={styles.checkLabel}>{a.tradeStatus}</span>
            </div>
          </div>
        )}

        {activeTab === 'supply' && (
          <div>
            <div className={styles.sectionLabel}>공급 / 납기 검토</div>
            <div className={styles.fieldsBox}>
              {supplyFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chain' && (
          <div>
            <div className={styles.sectionLabel}>승인선</div>
            {a.chain.map((c) => {
              const bg = c.status === '완료' ? '#ecfdf5' : c.status === '반려' ? '#fef2f2' : '#fffbeb';
              const fg = c.status === '완료' ? '#059669' : c.status === '반려' ? '#dc2626' : '#d97706';
              return (
                <div className={styles.linkedCard} key={c.stage}>
                  <div>
                    <div className={styles.linkedTitle}>{c.stage} · {c.admin}</div>
                    <div className={styles.linkedSub}>{c.when}</div>
                  </div>
                  <span className={styles.linkedStatus} style={{ background: bg, color: fg }}>{c.status}</span>
                </div>
              );
            })}
            <div className={styles.sectionLabel} style={{ marginTop: 16 }}>승인 요청 의견</div>
            <div className={styles.fieldsBox}>
              <div style={{ fontSize: '12.5px', color: '#3f3f46', lineHeight: 1.6, marginBottom: 8 }}>{a.opinion}</div>
              <div style={{ fontSize: '11.5px', color: '#a1a1aa' }}>{a.requester} · {a.requestedAt}</div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>승인 이력</div>
            {a.history.map((h, i) => (
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
