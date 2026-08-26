import { useRef, useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { computeIssues, fmtPoint, isIncrease, type Memo, type PointLedgerEntry } from './pointLedgerData';

const TABS = [
  { key: 'summary', label: '기본 정보' },
  { key: 'balance', label: '잔액 변화' },
  { key: 'source', label: 'Source' },
  { key: 'memo', label: '메모' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  entry: PointLedgerEntry;
  all: PointLedgerEntry[];
  onClose: () => void;
  onAddMemo: (text: string) => void;
}

export function PointLedgerDetailDrawer({ entry: e, all, onClose, onAddMemo }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [memoText, setMemoText] = useState('');

  const issues = computeIssues(e, all);
  const increase = isIncrease(e.type);

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(memoText.trim());
    setMemoText('');
  }

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>포인트 / 적립금 관리 · 포인트 내역 · {e.id}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{e.type}</span>
              {issues.length > 0 && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 확인 필요</span>}
            </div>
            <div className={styles.sub}>{e.member} · {e.at}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {issues.length > 0 && (
          <div className={styles.editPanel} style={{ marginTop: 12, background: '#fffbeb', borderColor: '#fde68a' }}>
            <div className={styles.editTitle} style={{ color: '#b45309' }}>확인이 필요합니다</div>
            {issues.map((issue) => (
              <div key={issue} style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>⚠ {issue}</div>
            ))}
          </div>
        )}

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button key={t.key} type="button" className={`${styles.tabBtn} ${tab === t.key ? styles.tabActive : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {tab === 'summary' && (
          <div>
            <div className={styles.sectionTitle}>기본 정보</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>내역번호</span><span className={styles.fieldValue}>{e.id}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>회원</span><span className={styles.fieldValue}>{e.member}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>변동 유형</span><span className={styles.fieldValue}>{e.type}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>발생일</span><span className={styles.fieldValue}>{e.at}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>처리자</span><span className={styles.fieldValue}>{e.by}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>비고</span><span className={styles.fieldValue}>{e.note}</span></div>
            </div>
            <div className={styles.emptyInline}>이 거래 직후 잔액은 아래 &apos;변동 후&apos; 값이며, 현재 잔액과 다를 수 있습니다 — 현재 잔액은 보유 현황에서 확인하세요.</div>
          </div>
        )}

        {tab === 'balance' && (
          <div>
            <div className={styles.sectionTitle}>잔액 변화</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>변동 전</span><span className={styles.fieldValue}>{fmtPoint(e.before)}</span></div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>증감</span>
                <span className={styles.fieldValue} style={{ fontWeight: 700, color: increase ? '#059669' : '#dc2626' }}>{e.delta > 0 ? '+' : ''}{fmtPoint(e.delta)}</span>
              </div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>변동 후</span><span className={styles.fieldValue} style={{ fontWeight: 700, color: e.after < 0 ? '#dc2626' : undefined }}>{fmtPoint(e.after)}</span></div>
            </div>
          </div>
        )}

        {tab === 'source' && (
          <div>
            <div className={styles.sectionTitle}>Source</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>Source 유형</span><span className={styles.fieldValue}>{e.sourceType}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>Source 번호</span><span className={styles.fieldValue}>{e.sourceId ?? '-'}</span></div>
            </div>
            {!e.sourceId && (e.sourceType === '주문' || e.sourceType === '취소' || e.sourceType === '반품' || e.sourceType === '환불') && (
              <div className={styles.emptyInline}>이 거래 유형은 통상 Source 번호가 필요합니다.</div>
            )}
          </div>
        )}

        {tab === 'memo' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(ev) => setMemoText(ev.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {e.memos.length === 0 ? (
              <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              e.memos.map((m: Memo) => (
                <div key={m.id} className={styles.memoItem}>
                  <div className={styles.memoWhen}>{m.at} · {m.by}</div>
                  <div className={styles.memoText}>{m.text}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
