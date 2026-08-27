import { useRef, useState } from 'react';
import styles from './MemberDetailDrawer.module.css';
import type { MemberDetail } from './memberDetail';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface MemoEntry {
  when: string;
  by: string;
  text: string;
}

interface Props {
  detail: MemberDetail;
  tab: number;
  onTabChange: (tab: number) => void;
  onClose: () => void;
  onToggleSuspend: () => void;
  onSecondary: () => void;
  memos: MemoEntry[];
  onAddMemo: (text: string) => void;
}

export function MemberDetailDrawer({ detail: d, tab, onTabChange, onClose, onToggleSuspend, onSecondary, memos, onAddMemo }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);
  const [memoText, setMemoText] = useState('');

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.avatar} style={{ background: d.avBg, color: d.avFg }}>{d.initial}</div>
          <div className={styles.nameCol}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{d.name}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
              <span className={styles.tierBadge}>{d.badgeLabel}</span>
            </div>
            <div className={styles.subLine}>{d.handle} · 회원번호 {d.id}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.actionsRow}>
          <button type="button" className={styles.secondaryBtn} onClick={onSecondary}>{d.secondaryLabel}</button>
          <div className={styles.actionsSpacer} />
          <button
            type="button"
            className={styles.suspendBtn}
            style={{ borderColor: d.actionBorder, background: d.actionBg, color: d.actionFg }}
            onClick={onToggleSuspend}
          >
            {d.actionLabel}
          </button>
        </div>

        <div className={styles.tabsRow}>
          {d.tabsDetail.map((label, i) => (
            <button
              key={label}
              type="button"
              className={`${styles.tabBtn} ${tab === i ? styles.active : ''}`}
              onClick={() => onTabChange(i)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scroll}>
        {tab === 0 && (
          <div>
            <div className={styles.sectionLabel}>기본 정보</div>
            <div className={styles.fieldsBox}>
              {d.fields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>

            <div className={styles.sectionLabel}>계정 설정</div>
            <div className={styles.settingsBox}>
              {d.toggles.map((g) => (
                <div className={styles.toggleRow} key={g.label}>
                  <span className={styles.toggleLabel}>{g.label}</span>
                  <span className={styles.toggleValue} style={{ color: g.color }}>{g.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && d.tab1Kind === 'orders' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 2 }}>결제 / 구매 내역</div>
            <div className={styles.sectionSub} style={{ fontVariantNumeric: 'tabular-nums' }}>{d.paySummary}</div>
            <div className={styles.orderTable}>
              <div className={styles.orderHeadRow}>
                <span>주문번호</span>
                <span>상품 · 일시</span>
                <span style={{ textAlign: 'right' }}>금액</span>
                <span style={{ textAlign: 'right' }}>상태</span>
              </div>
              {d.orders.map((o) => (
                <div className={styles.orderRow} key={o.no}>
                  <span className={styles.orderNo}>{o.no}</span>
                  <span style={{ minWidth: 0 }}>
                    <span className={styles.orderItem}>{o.item}</span>
                    <span className={styles.orderDate}>{o.date}</span>
                  </span>
                  <span className={styles.orderAmount}>{o.amount}</span>
                  <span className={styles.orderStatus} style={{ color: o.fg }}>{o.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 1 && d.tab1Kind === 'fields' && (
          <div>
            <div className={styles.sectionLabel}>{d.tabsDetail[1]}</div>
            <div className={styles.fieldsBox}>
              {d.tab1Fields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 2 }}>활동 기록</div>
            <div className={styles.sectionSub}>주문 · 문의 · 기타 행동 로그</div>
            {d.activity.map((a, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} style={{ background: a.dot }} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineTitle}>{a.title}</span>
                    <span className={styles.timelineWhen}>{a.when}</span>
                  </div>
                  <div className={styles.timelineSub}>{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 3 && (
          <div>
            <div className={styles.sectionLabel}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input
                className={styles.memoInput}
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="메모를 입력하세요"
              />
              <button
                type="button"
                className={styles.memoAddBtn}
                onClick={() => {
                  if (!memoText.trim()) return;
                  onAddMemo(memoText.trim());
                  setMemoText('');
                }}
              >
                등록
              </button>
            </div>
            {memos.length === 0 && <div className={styles.sectionSub}>등록된 메모가 없습니다.</div>}
            {memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.by}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
