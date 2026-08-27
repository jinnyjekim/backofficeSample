import { useRef } from 'react';
import styles from './MemberDetailDrawer.module.css';
import type { MemberDetail, Tier } from './memberDetail';
import { useOutsideClose } from '../../lib/useOutsideClose';

const TABS: [string, string][] = [
  ['basic', '기본정보'],
  ['activity', '활동'],
  ['pay', '결제'],
  ['inquiry', '문의'],
  ['log', '로그'],
];

const TIERS: Tier[] = ['일반', '우수회원', 'VIP'];

interface Props {
  detail: MemberDetail;
  tab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  onToggleSuspend: () => void;
  onTierChange: (tier: Tier) => void;
}

export function MemberDetailDrawer({ detail: d, tab, onTabChange, onClose, onToggleSuspend, onTierChange }: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.avatar} style={{ background: d.avBg, color: d.avFg }}>{d.initial}</div>
          <div className={styles.nameCol}>
            <div className={styles.nameRow}>
              <span className={styles.name}>{d.name}</span>
              <span className={styles.badge} style={{ background: d.statusBg, color: d.statusFg }}>{d.status}</span>
              <span className={styles.tierBadge}>{d.tier}</span>
            </div>
            <div className={styles.subLine}>{d.handle} · 회원번호 {d.id}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.actionsRow}>
          <button type="button" className={styles.secondaryBtn}>정보 수정</button>
          <button type="button" className={styles.secondaryBtn}>비밀번호 초기화</button>
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

              <div className={styles.tierLabel}>등급</div>
              <div className={styles.tierRow}>
                {TIERS.map((t) => {
                  const active = d.tier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      className={styles.tierBtn}
                      style={{
                        borderColor: active ? 'var(--accent)' : 'rgba(0,0,0,.12)',
                        background: active ? 'var(--accent)' : '#fff',
                        color: active ? '#fff' : '#52525b',
                        fontWeight: active ? 600 : 500,
                      }}
                      onClick={() => onTierChange(t)}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'activity' && (
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

        {tab === 'pay' && (
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

        {tab === 'inquiry' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 2 }}>문의 내역</div>
            <div className={styles.sectionSub}>{d.inquirySummary}</div>
            <div className={styles.inquiryBox}>
              {d.inquiries.map((q) => (
                <div className={styles.inquiryRow} key={q.no}>
                  <div className={styles.inquiryBody}>
                    <div className={styles.inquiryTitle}>{q.title}</div>
                    <div className={styles.inquiryMeta}>{q.no} · {q.type} · {q.date}</div>
                  </div>
                  <span className={styles.inquiryStatus} style={{ background: q.bg, color: q.fg }}>{q.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'log' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 2 }}>로그인 기록</div>
            <div className={styles.sectionSub}>접속 이력 및 인증 이벤트</div>
            {d.logs.map((l, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} style={{ background: l.dot }} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineTitle} style={{ color: l.titleFg }}>{l.title}</span>
                    <span className={styles.timelineWhen}>{l.when}</span>
                  </div>
                  <div className={styles.timelineSub} style={{ fontVariantNumeric: 'tabular-nums' }}>{l.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
