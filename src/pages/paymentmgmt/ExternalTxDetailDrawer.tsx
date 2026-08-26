import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './ExternalTransactionPage.module.css';
import { STATUS_LABEL, computeIssues, computeMatchStatus, fmtWon, splitAt, type ExternalTransaction } from './externalTransactionData';
import type { PaymentEntry } from './paymentListData';

interface Props {
  tx: ExternalTransaction;
  all: ExternalTransaction[];
  payments: PaymentEntry[];
  onClose: () => void;
  onAddMemo: (id: string, text: string) => void;
  onRequestRecheck: (tx: ExternalTransaction) => void;
}

const MATCH_COLOR: Record<string, string> = {
  '정상': 'matchOk',
  '미매칭': 'matchNone',
  '상태 불일치': 'matchWarn',
  '금액 불일치': 'matchWarn',
  '중복 의심': 'matchWarn',
};

export function ExternalTxDetailDrawer({ tx, all, payments, onClose, onAddMemo, onRequestRecheck }: Props) {
  const navigate = useNavigate();
  const [memoText, setMemoText] = useState('');

  const [date, time] = splitAt(tx.occurredAt);
  const match = computeMatchStatus(tx, all, payments);
  const issues = computeIssues(tx, all, payments);
  const payment = tx.linkedPaymentId ? payments.find((p) => p.id === tx.linkedPaymentId) : undefined;
  const matchClass = styles[MATCH_COLOR[match] as keyof typeof styles];

  const submitMemo = () => {
    if (!memoText.trim()) return;
    onAddMemo(tx.id, memoText.trim());
    setMemoText('');
  };

  const goToPayment = () => {
    if (!payment) return;
    navigate('/payment-mgmt/list', { state: { openPaymentId: payment.id } });
  };

  return (
    <aside className={`${drawer.aside} ${styles.txDrawer}`} aria-label="외부 거래 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{tx.pg}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{tx.id}</h2>
              <span className={drawer.badge} style={{ background: '#f4f4f5', color: '#52525b' }}>{STATUS_LABEL[tx.externalStatus]}</span>
              <span className={`${styles.matchTag} ${matchClass}`}>{match}</span>
            </div>
            <div className={drawer.sub}>{tx.method} · {fmtWon(tx.amount)} · {date} {time}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={drawer.actionRow}>
          {payment && <button type="button" className={drawer.actionLink} onClick={goToPayment}>내부 결제 보기 ↗</button>}
          {match !== '정상' && (
            <button type="button" className={drawer.actionLink} onClick={() => onRequestRecheck(tx)}>상태 재조회</button>
          )}
        </div>
      </div>

      <div className={drawer.scroll}>
        {issues.length > 0 && (
          <div className={styles.issueBanner}>
            <strong>확인 필요</strong>
            {issues.map((issue) => <span key={issue}>⚠ {issue}</span>)}
          </div>
        )}

        <div className={drawer.sectionTitle}>외부 거래 정보</div>
        <div className={drawer.fieldBox}>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>외부 거래번호</span><span className={drawer.fieldValue}>{tx.id}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>연동 시스템</span><span className={drawer.fieldValue}>{tx.pg}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>결제수단</span><span className={drawer.fieldValue}>{tx.method}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>거래일시</span><span className={drawer.fieldValue}>{tx.occurredAt}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>내부 수신일시</span><span className={drawer.fieldValue}>{tx.receivedAt}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>외부 상태 (Raw)</span><span className={drawer.fieldValue}>{tx.externalStatus} · {STATUS_LABEL[tx.externalStatus]}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>마지막 조회</span><span className={drawer.fieldValue}>{tx.lastSyncedAt}</span></div>
        </div>

        <div className={drawer.sectionTitle}>내부 매칭</div>
        <div className={drawer.fieldBox}>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>내부 결제번호</span><span className={drawer.fieldValue}>{payment?.id ?? '연결된 결제 없음'}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>고객 / 거래처</span><span className={drawer.fieldValue}>{payment?.customerName ?? '-'}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>주문번호</span><span className={drawer.fieldValue}>{payment?.orderId ?? '-'}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>내부 결제상태</span><span className={drawer.fieldValue}>{payment?.status ?? '-'}</span></div>
        </div>

        <div className={drawer.sectionTitle}>정합성 비교</div>
        <div className={styles.amountTable}>
          <div className={styles.amountRow}><span>외부 거래금액</span><span>{fmtWon(tx.amount)}</span></div>
          <div className={styles.amountRow}>
            <span>내부 결제금액</span>
            <span className={payment && payment.amount !== tx.amount ? styles.amountRowDiff : undefined}>{payment ? fmtWon(payment.amount) : '-'}</span>
          </div>
          <div className={styles.amountRow}><span>외부 상태</span><span>{STATUS_LABEL[tx.externalStatus]}</span></div>
          <div className={styles.amountRow}><span>내부 상태</span><span>{payment?.status ?? '-'}</span></div>
        </div>

        <div className={drawer.sectionTitleLoose}>관리자 메모</div>
        <div className={drawer.memoInputRow}>
          <input className={drawer.memoInput} value={memoText} onChange={(e) => setMemoText(e.target.value)} placeholder="내부 확인용 메모를 남겨주세요" onKeyDown={(e) => e.key === 'Enter' && submitMemo()} />
          <button type="button" className={drawer.memoSubmit} onClick={submitMemo}>등록</button>
        </div>
        {tx.memos.length > 0 ? tx.memos.slice().reverse().map((m) => (
          <div key={m.id} className={drawer.memoItem}>
            <div className={drawer.memoWhen}>{m.at} · {m.by}</div>
            <div className={drawer.memoText}>{m.text}</div>
          </div>
        )) : <div className={drawer.emptyInline}>등록된 메모가 없습니다.</div>}

        <div className={drawer.sectionTitleLoose}>처리 이력</div>
        {tx.history.slice().reverse().map((h) => (
          <div key={h.id} className={drawer.timelineItem}>
            <span className={drawer.timelineDot} />
            <div className={drawer.timelineBody}>
              <div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{h.action}</strong><span className={drawer.timelineWhen}>{h.at}</span></div>
              <div className={drawer.timelineDetail}>{h.by}{h.detail ? ` · ${h.detail}` : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
