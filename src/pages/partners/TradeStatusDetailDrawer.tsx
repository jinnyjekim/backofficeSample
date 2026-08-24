import { useState } from 'react';
import styles from './TradeStatusDetailDrawer.module.css';
import {
  ALLOWED_TRANSITIONS,
  REASONS_BY_TARGET,
  TRADE_STATUS_META,
  fmtWon,
  type TradeStatus,
  type TradeStatusRecord,
} from './tradeStatusData';

const TABS: { key: string; label: string }[] = [
  { key: 'summary', label: '현재 상태' },
  { key: 'contract', label: '계약 · 주문' },
  { key: 'credit', label: '신용 · 미수금' },
  { key: 'history', label: '메모 · 이력' },
];

interface Props {
  record: TradeStatusRecord;
  onClose: () => void;
  onChangeStatus: (
    code: string,
    target: TradeStatus,
    mode: '즉시' | '예약',
    applyDate: string,
    reason: string,
    detail: string,
  ) => void;
  onCancelPending: (code: string) => void;
  onAddMemo: (code: string, text: string) => void;
}

export function TradeStatusDetailDrawer({ record, onClose, onChangeStatus, onCancelPending, onAddMemo }: Props) {
  const [activeTab, setActiveTab] = useState('summary');
  const [showChange, setShowChange] = useState(false);
  const [target, setTarget] = useState<TradeStatus | ''>('');
  const [mode, setMode] = useState<'즉시' | '예약'>('즉시');
  const [applyDate, setApplyDate] = useState('');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [memoText, setMemoText] = useState('');

  const sm = TRADE_STATUS_META[record.status];
  const allowed = ALLOWED_TRANSITIONS[record.status];

  function openChangePanel() {
    const first = allowed[0] ?? '';
    setTarget(first);
    setReason(first ? (REASONS_BY_TARGET[first][0] ?? '') : '');
    setMode('즉시');
    setApplyDate('');
    setDetail('');
    setConfirmEnd(false);
    setShowChange(true);
  }

  function pickTarget(t: TradeStatus) {
    setTarget(t);
    setReason(REASONS_BY_TARGET[t][0] ?? '');
    setConfirmEnd(false);
  }

  function submitChange() {
    if (!target) return;
    if (mode === '예약' && !applyDate) return;
    if (target === '거래종료' && !confirmEnd) return;
    onChangeStatus(record.code, target, mode, mode === '예약' ? applyDate : '즉시 적용', reason, detail);
    setShowChange(false);
  }

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(record.code, memoText.trim());
    setMemoText('');
  }

  const summaryFields = [
    { label: '거래 상태', value: record.status },
    { label: '상태 적용일', value: record.statusChangedAt },
    { label: '거래 시작일', value: record.tradeStartDate },
    { label: '최근 거래일', value: record.lastDealDate },
    { label: '담당자', value: record.manager },
    { label: '최근 변경 사유', value: record.statusReason },
  ];

  const remain = record.creditLimit - record.creditUsed;

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>거래처 관리 · 거래 상태 상세 · {record.code}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{record.name}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{record.status}</span>
            </div>
            <div className={styles.sub}>거래 시작 {record.tradeStartDate} · 최근 거래 {record.lastDealDate}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {record.issues.length > 0 && (
          <div className={styles.issueBanner}>⚠ {record.issues.join(' · ')}</div>
        )}

        {record.pendingChange && (
          <div className={styles.pendingBanner}>
            <span>예정 변경 · {record.pendingChange.toStatus} · 적용일 {record.pendingChange.applyDate} · {record.pendingChange.reason}</span>
            <button type="button" className={styles.pendingCancelBtn} onClick={() => onCancelPending(record.code)}>예약 취소</button>
          </div>
        )}

        <div className={styles.actionRow}>
          <a href="#" className={styles.actionLink} onClick={(e) => e.preventDefault()}>회사 상세 보기</a>
          <div className={styles.spacer} />
          {allowed.length > 0 ? (
            <button type="button" className={styles.primaryBtn} onClick={openChangePanel}>거래 상태 변경</button>
          ) : (
            <span className={styles.endedNote}>거래 종료됨 · 상태 변경 불가</span>
          )}
        </div>

        {showChange && target && (
          <div className={styles.changePanel}>
            <div className={styles.changeTitle}>거래 상태 변경</div>

            <div className={styles.transitionRow}>
              <span>{record.status}</span>
              <span className={styles.transitionArrow}>→</span>
              <select
                className={styles.changeSelect}
                style={{ marginBottom: 0, width: 'auto' }}
                value={target}
                onChange={(e) => pickTarget(e.target.value as TradeStatus)}
              >
                {allowed.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className={styles.impactBox}>
              <div className={styles.impactTitle}>변경 전 확인 — 현재 거래 현황</div>
              <div className={styles.impactGrid}>
                <div className={styles.impactCell}>
                  <div className={styles.impactLabel}>진행중 계약</div>
                  <div className={styles.impactValue}>{record.impact.activeContracts}건</div>
                </div>
                <div className={styles.impactCell}>
                  <div className={styles.impactLabel}>진행중 주문</div>
                  <div className={styles.impactValue}>{record.impact.activeOrders}건</div>
                </div>
                <div className={styles.impactCell}>
                  <div className={styles.impactLabel}>배송중</div>
                  <div className={styles.impactValue}>{record.impact.shippingInProgress}건</div>
                </div>
                <div className={styles.impactCell}>
                  <div className={styles.impactLabel}>미수금</div>
                  <div className={styles.impactValue}>{fmtWon(record.impact.receivable)}</div>
                </div>
                <div className={styles.impactCell}>
                  <div className={styles.impactLabel}>연체</div>
                  <div className={styles.impactValue}>{fmtWon(record.impact.overdue)}</div>
                </div>
                <div className={styles.impactCell}>
                  <div className={styles.impactLabel}>미정산</div>
                  <div className={styles.impactValue}>{fmtWon(record.impact.unsettled)}</div>
                </div>
              </div>
            </div>

            <div className={styles.radioRow}>
              <label className={styles.radioOption}>
                <input type="radio" checked={mode === '즉시'} onChange={() => setMode('즉시')} />
                즉시 적용
              </label>
              <label className={styles.radioOption}>
                <input type="radio" checked={mode === '예약'} onChange={() => setMode('예약')} />
                예약 적용
              </label>
            </div>
            {mode === '예약' && (
              <input
                type="date"
                className={styles.dateInput}
                value={applyDate}
                onChange={(e) => setApplyDate(e.target.value)}
              />
            )}

            <div className={styles.changeLabel}>변경 사유 *</div>
            <select className={styles.changeSelect} value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS_BY_TARGET[target].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>

            <div className={styles.changeLabel}>상세 사유</div>
            <textarea
              className={styles.changeTextarea}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="상세 사유를 입력하세요"
            />

            {target === '거래종료' && (
              <label className={styles.confirmCheckRow}>
                <input type="checkbox" checked={confirmEnd} onChange={(e) => setConfirmEnd(e.target.checked)} />
                종료 후 신규 주문/계약이 제한되는 것을 확인했습니다.
              </label>
            )}

            <div className={styles.changeActions}>
              <button type="button" className={styles.changeCancel} onClick={() => setShowChange(false)}>취소</button>
              <button
                type="button"
                className={styles.changeConfirm}
                disabled={(mode === '예약' && !applyDate) || (target === '거래종료' && !confirmEnd)}
                onClick={submitChange}
              >
                {mode === '예약' ? '변경 예약' : '상태 변경'}
              </button>
            </div>
          </div>
        )}

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tabBtn} ${activeTab === t.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {activeTab === 'summary' && (
          <div>
            <div className={styles.sectionTitle}>현재 상태</div>
            <div className={styles.fieldBox}>
              {summaryFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionTitle}>거래 현황</div>
            <div className={styles.statGrid}>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>진행중 계약</div>
                <div className={styles.statValue}>{record.impact.activeContracts}건</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>진행중 주문</div>
                <div className={styles.statValue}>{record.impact.activeOrders}건</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>배송중</div>
                <div className={styles.statValue}>{record.impact.shippingInProgress}건</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>미수금</div>
                <div className={styles.statValue} style={{ color: record.impact.receivable > 0 ? '#dc2626' : '#18181b' }}>{fmtWon(record.impact.receivable)}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>연체</div>
                <div className={styles.statValue} style={{ color: record.impact.overdue > 0 ? '#dc2626' : '#18181b' }}>{fmtWon(record.impact.overdue)}</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statLabel}>미정산</div>
                <div className={styles.statValue}>{fmtWon(record.impact.unsettled)}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div>
            <div className={styles.sectionTitle}>계약 · 주문 현황</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>진행중 계약</span>
                <span className={styles.fieldValue}>{record.impact.activeContracts}건</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>진행중 주문</span>
                <span className={styles.fieldValue}>{record.impact.activeOrders}건</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>배송중</span>
                <span className={styles.fieldValue}>{record.impact.shippingInProgress}건</span>
              </div>
            </div>
            <div className={styles.linksRow}>
              <a href="#" onClick={(e) => e.preventDefault()}>계약 보기</a>
              <a href="#" onClick={(e) => e.preventDefault()}>주문 보기</a>
            </div>
          </div>
        )}

        {activeTab === 'credit' && (
          <div>
            <div className={styles.sectionTitle}>신용 · 미수금</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>신용한도</span>
                <span className={styles.fieldValue}>{fmtWon(record.creditLimit)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>사용금액</span>
                <span className={styles.fieldValue}>{fmtWon(record.creditUsed)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>잔여한도</span>
                <span className={styles.fieldValue} style={{ color: remain < 0 ? '#dc2626' : '#18181b' }}>{fmtWon(remain)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>미수금</span>
                <span className={styles.fieldValue} style={{ color: record.impact.receivable > 0 ? '#dc2626' : '#18181b' }}>{fmtWon(record.impact.receivable)}</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>연체 금액</span>
                <span className={styles.fieldValue} style={{ color: record.impact.overdue > 0 ? '#dc2626' : '#18181b' }}>{fmtWon(record.impact.overdue)}</span>
              </div>
            </div>
            <div className={styles.linksRow}>
              <a href="#" onClick={(e) => e.preventDefault()}>신용 / 거래조건 보기</a>
              <a href="#" onClick={(e) => e.preventDefault()}>미수금 보기</a>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {record.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            {record.memos.length === 0 && <div className={styles.emptyInline}>등록된 메모가 없습니다</div>}

            <div className={styles.sectionTitleLoose}>상태 변경 이력</div>
            {record.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.reason}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineChange}>{h.from} → {h.to}</div>
                  {h.detail && <div className={styles.timelineDetail}>{h.detail}</div>}
                  <div className={styles.timelineAdmin}>{h.by}</div>
                  <div className={styles.timelineSnapshot}>
                    변경 당시 · 미수금 {fmtWon(h.snapshot.receivable)} · 연체 {fmtWon(h.snapshot.overdue)} · 진행중 주문 {h.snapshot.activeOrders}건
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
