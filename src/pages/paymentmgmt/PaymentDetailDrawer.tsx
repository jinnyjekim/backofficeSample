import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import drawer from '../ops/opsDrawerShared.module.css';
import styles from './PaymentListPage.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  computeExternalMatch,
  computeIssues,
  fmtWon,
  remainingAmount,
  splitAt,
  type PaymentEntry,
} from './paymentListData';

interface Props {
  payment: PaymentEntry;
  onClose: () => void;
  onAddMemo: (id: string, text: string) => void;
  onRequestRecheck: (payment: PaymentEntry) => void;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  '결제 대기': { bg: '#f4f4f5', fg: '#71717a' },
  '처리중': { bg: '#eff6ff', fg: '#1d4ed8' },
  '결제 완료': { bg: '#ecfdf5', fg: '#047857' },
  '결제 실패': { bg: '#fef2f2', fg: '#dc2626' },
  '결제 취소': { bg: '#f4f4f5', fg: '#52525b' },
};

export function PaymentDetailDrawer({ payment: p, onClose, onAddMemo, onRequestRecheck }: Props) {
  const navigate = useNavigate();
  const [memoText, setMemoText] = useState('');

  const [reqDate, reqTime] = splitAt(p.requestedAt);
  const statusColor = STATUS_COLOR[p.status];
  const issues = computeIssues(p);
  const match = computeExternalMatch(p);
  const matchColor = match === '정상' ? styles.matchOk : styles.matchWarn;

  const submitMemo = () => {
    if (!memoText.trim()) return;
    onAddMemo(p.id, memoText.trim());
    setMemoText('');
  };

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={`${drawer.aside} ${styles.paymentDrawer}`} aria-label="결제 상세">
      <div className={drawer.head}>
        <div className={drawer.headRow}>
          <div className={drawer.headBody}>
            <div className={drawer.eyebrow}>{p.id}</div>
            <div className={drawer.titleRow}>
              <h2 className={drawer.title}>{fmtWon(p.amount)}</h2>
              <span className={drawer.badge} style={{ background: statusColor.bg, color: statusColor.fg }}>{p.status}</span>
              {issues.length > 0 && <span className={drawer.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 확인 필요</span>}
            </div>
            <div className={drawer.sub}>{p.method} · {reqDate} {reqTime} · {p.customerName}</div>
          </div>
          <button type="button" className={drawer.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={drawer.actionRow}>
          <button type="button" className={drawer.actionLink} onClick={() => navigate('/orders/processing')}>주문 보기 ↗</button>
          {(p.status === '처리중' || match !== '정상') && (
            <button type="button" className={drawer.actionLink} onClick={() => onRequestRecheck(p)}>상태 재조회</button>
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

        <div className={drawer.sectionTitle}>결제 정보</div>
        <div className={drawer.fieldBox}>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>결제번호</span><span className={drawer.fieldValue}>{p.id}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>주문번호</span><span className={drawer.fieldValue}>{p.orderId}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>고객 / 거래처</span><span className={drawer.fieldValue}>{p.customerName}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>결제수단</span><span className={drawer.fieldValue}>{p.method}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>결제 요청일</span><span className={drawer.fieldValue}>{p.requestedAt}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>승인일</span><span className={drawer.fieldValue}>{p.approvedAt ?? '-'}</span></div>
        </div>

        <div className={drawer.sectionTitle}>금액</div>
        <div className={styles.amountTable}>
          <div className={styles.amountRow}><span>원 결제금액</span><span>{fmtWon(p.amount)}</span></div>
          <div className={styles.amountRow}><span>누적 환불</span><span>{fmtWon(p.refundedAmount)}</span></div>
          <div className={`${styles.amountRow} ${styles.amountRowTotal}`}><span>잔여금액</span><span>{fmtWon(remainingAmount(p))}</span></div>
        </div>

        <div className={drawer.sectionTitle}>외부 거래</div>
        <div className={drawer.fieldBox}>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>PG</span><span className={drawer.fieldValue}>{p.pg ?? '-'}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>외부 거래번호</span><span className={drawer.fieldValue}>{p.externalTxId ?? '-'}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>외부 상태</span><span className={drawer.fieldValue}>{p.externalStatus ?? '-'}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>마지막 동기화</span><span className={drawer.fieldValue}>{p.lastSyncedAt ?? '-'}</span></div>
          <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>매칭 상태</span><span className={drawer.fieldValue}><span className={`${styles.matchTag} ${matchColor}`}>{match}</span></span></div>
        </div>

        {p.status === '결제 실패' && (
          <>
            <div className={drawer.sectionTitle}>실패 정보</div>
            <div className={drawer.fieldBox}>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>외부 코드</span><span className={drawer.fieldValue}>{p.failureExternalCode}</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>내부 코드</span><span className={drawer.fieldValue}>{p.failureInternalCode}</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>사용자 메시지</span><span className={drawer.fieldValue}>{p.customerMessage}</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>관리자 메시지</span><span className={drawer.fieldValue}>{p.adminMessage}</span></div>
            </div>
          </>
        )}

        {p.cancelInfo && (
          <>
            <div className={drawer.sectionTitle}>취소 정보</div>
            <div className={drawer.fieldBox}>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>취소일</span><span className={drawer.fieldValue}>{p.cancelInfo.canceledAt}</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>취소 사유</span><span className={drawer.fieldValue}>{p.cancelInfo.reason}</span></div>
              <div className={drawer.fieldRow}><span className={drawer.fieldLabel}>외부 취소번호</span><span className={drawer.fieldValue}>{p.cancelInfo.externalCancelId}</span></div>
            </div>
          </>
        )}

        <div className={drawer.sectionTitleLoose}>환불 내역</div>
        {p.refunds.length > 0 ? p.refunds.map((r) => (
          <div key={r.id} className={styles.refundItem}>
            <span>{r.id} · {fmtWon(r.amount)}</span>
            <span className={styles.refundStatus} style={{ background: r.status === '완료' ? '#ecfdf5' : '#eff6ff', color: r.status === '완료' ? '#059669' : '#1d4ed8' }}>{r.status}</span>
          </div>
        )) : <div className={drawer.emptyInline}>연결된 환불 내역이 없습니다.</div>}

        <div className={drawer.sectionTitleLoose}>관리자 메모</div>
        <div className={drawer.memoInputRow}>
          <input className={drawer.memoInput} value={memoText} onChange={(e) => setMemoText(e.target.value)} placeholder="내부 확인용 메모를 남겨주세요" onKeyDown={(e) => e.key === 'Enter' && submitMemo()} />
          <button type="button" className={drawer.memoSubmit} onClick={submitMemo}>등록</button>
        </div>
        {p.memos.length > 0 ? p.memos.slice().reverse().map((m) => (
          <div key={m.id} className={drawer.memoItem}>
            <div className={drawer.memoWhen}>{m.at} · {m.by}</div>
            <div className={drawer.memoText}>{m.text}</div>
          </div>
        )) : <div className={drawer.emptyInline}>등록된 메모가 없습니다.</div>}

        <div className={drawer.sectionTitleLoose}>처리 이력</div>
        {p.history.slice().reverse().map((h) => (
          <div key={h.id} className={drawer.timelineItem}>
            <span className={drawer.timelineDot} />
            <div className={drawer.timelineBody}>
              <div className={drawer.timelineRow}><strong className={drawer.timelineTitle}>{h.action}</strong><span className={drawer.timelineWhen}>{h.at}</span></div>
              <div className={drawer.timelineDetail}>{h.by}{h.before && h.after ? ` · ${h.before} → ${h.after}` : h.after ? ` · ${h.after}` : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
