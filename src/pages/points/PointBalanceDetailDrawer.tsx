import { useRef, useState } from 'react';
import styles from '../ops/opsDrawerShared.module.css';
import { useOutsideClose } from '../../lib/useOutsideClose';
import {
  STATUS_META,
  computeIssues,
  fmtPoint,
  type Memo,
  type MemberPointBalance,
} from './pointsData';

const TABS = [
  { key: 'summary', label: '잔액 요약' },
  { key: 'pending', label: '지급 예정' },
  { key: 'expiring', label: '소멸 예정' },
  { key: 'activity', label: '최근 변동' },
  { key: 'history', label: '메모 · 이력' },
] as const;

type Tab = (typeof TABS)[number]['key'];

interface Props {
  balance: MemberPointBalance;
  onClose: () => void;
  onGrant: () => void;
  onDeduct: () => void;
  onAddMemo: (text: string) => void;
}

export function PointBalanceDetailDrawer({ balance: b, onClose, onGrant, onDeduct, onAddMemo }: Props) {
  const [tab, setTab] = useState<Tab>('summary');
  const [memoText, setMemoText] = useState('');

  const sm = STATUS_META[b.memberStatus];
  const issues = computeIssues(b);

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
            <div className={styles.eyebrow}>포인트 / 적립금 관리 · 보유 현황</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{b.member}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{b.memberStatus}</span>
              {issues.length > 0 && <span className={styles.badge} style={{ background: '#fffbeb', color: '#b45309' }}>⚠ 확인 필요</span>}
            </div>
            <div className={styles.sub}>사용 가능 {fmtPoint(b.available)} · 총 보유 {fmtPoint(b.totalHeld)}</div>
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

        <div className={styles.actionRow}>
          <button type="button" className={styles.actionLink} onClick={onGrant}>+ 포인트 지급</button>
          {b.available > 0 && <button type="button" className={styles.dangerBtn} onClick={onDeduct}>포인트 차감</button>}
          <div className={styles.spacer} />
        </div>

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
            <div className={styles.sectionTitle}>잔액 요약</div>
            <div className={styles.fieldBox}>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>총 보유</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtPoint(b.totalHeld)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>사용 가능</span><span className={styles.fieldValue} style={{ fontWeight: 700 }}>{fmtPoint(b.available)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>지급 예정</span><span className={styles.fieldValue}>{fmtPoint(b.pending)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>30일 내 소멸 예정</span><span className={styles.fieldValue}>{fmtPoint(b.expiringSoon30)}</span></div>
              <div className={styles.fieldRow}><span className={styles.fieldLabel}>최근 변동</span><span className={styles.fieldValue}>{b.lastActivityAt}</span></div>
            </div>
            <div className={styles.emptyInline}>소멸 예정 금액은 사용 가능 잔액에 포함된 부분집합입니다 — 총 보유에 더하지 않습니다.</div>
          </div>
        )}

        {tab === 'pending' && (
          <div>
            <div className={styles.sectionTitle}>지급 예정</div>
            {b.pendingBatches.length === 0 ? (
              <div className={styles.emptyInline}>지급 예정 포인트가 없습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {b.pendingBatches.map((batch, i) => (
                  <div className={styles.fieldRow} key={i}>
                    <span className={styles.fieldLabel}>{batch.confirmAt} 확정 예정 · {batch.source}</span>
                    <span className={styles.fieldValue}>{fmtPoint(batch.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'expiring' && (
          <div>
            <div className={styles.sectionTitle}>소멸 예정</div>
            {b.expiringBatches.length === 0 ? (
              <div className={styles.emptyInline}>소멸 예정 포인트가 없습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {b.expiringBatches.map((batch, i) => (
                  <div className={styles.fieldRow} key={i}>
                    <span className={styles.fieldLabel}>{batch.expiresAt} 소멸</span>
                    <span className={styles.fieldValue}>{fmtPoint(batch.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div>
            <div className={styles.sectionTitle}>최근 변동</div>
            {b.recentActivity.length === 0 ? (
              <div className={styles.emptyInline}>변동 내역이 없습니다.</div>
            ) : (
              <div className={styles.fieldBox}>
                {b.recentActivity.map((a) => (
                  <div className={styles.fieldRow} key={a.id}>
                    <span className={styles.fieldLabel}>{a.at.slice(0, 10)} · {a.type} · {a.note}</span>
                    <span className={styles.fieldValue} style={{ color: a.amount < 0 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                      {a.amount > 0 ? '+' : ''}{fmtPoint(a.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.emptyInline}>전체 원장은 포인트 내역에서 확인할 수 있습니다.</div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {b.memos.length === 0 ? (
              <div className={styles.emptyInline}>등록된 메모가 없습니다.</div>
            ) : (
              b.memos.map((m: Memo) => (
                <div key={m.id} className={styles.memoItem}>
                  <div className={styles.memoWhen}>{m.at} · {m.by}</div>
                  <div className={styles.memoText}>{m.text}</div>
                </div>
              ))
            )}

            <div className={styles.sectionTitleLoose}>처리 이력</div>
            {b.history.slice().reverse().map((h) => (
              <div key={h.id} className={styles.timelineItem}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.at}</span>
                  </div>
                  {h.detail && <div className={styles.timelineDetail}>{h.detail}</div>}
                  <div className={styles.timelineDetail}>{h.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
