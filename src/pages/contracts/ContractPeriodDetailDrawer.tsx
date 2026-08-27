import { useRef } from 'react';
import styles from './ContractPeriodDetailDrawer.module.css';
import { ACCENT_MARK, PERIOD_TABS } from './contractPeriodData';
import type { ContractPeriodDetail } from './contractPeriodDetail';
import { useOutsideClose } from '../../lib/useOutsideClose';

interface Props {
  detail: ContractPeriodDetail;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  showExtendPanel: boolean;
  showRenewPanel: boolean;
  onToggleExtendPanel: () => void;
  onToggleRenewPanel: () => void;
  onConfirmExtend: () => void;
  onConfirmRenew: () => void;
}

export function ContractPeriodDetailDrawer({
  detail: d,
  activeTab,
  onTabChange,
  onClose,
  showExtendPanel,
  showRenewPanel,
  onToggleExtendPanel,
  onToggleRenewPanel,
  onConfirmExtend,
  onConfirmRenew,
}: Props) {
  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.top}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.headTitleRow}>
              <span className={styles.no}>{d.no}</span>
              <span className={styles.badge} style={{ background: d.periodBg, color: d.periodFg }}>{d.periodLabel}</span>
              <span className={styles.contractStatusText}>계약상태 {d.contractStatus}</span>
            </div>
            <div className={styles.name}>{d.partner} · {d.name}</div>
            <div className={styles.subLine}>{d.start} ~ {d.end}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.timelineBar}>
          <div className={styles.timelineLabelsRow}>
            <span className={styles.timelineEndLabel}>{d.tlStart}</span>
            <span className={styles.timelineTodayLabel}>오늘</span>
            <span className={styles.timelineEndLabel}>{d.tlEnd}</span>
          </div>
          <div className={styles.timelineTrack}>
            <div className={styles.timelineFill} style={{ width: `${d.tlPct}%` }} />
          </div>
          <div className={styles.timelineStatsRow}>
            <span>경과 {d.elapsedDays}일</span>
            <span>잔여 {d.remainDays}일</span>
          </div>
        </div>

        {d.hasIssue && <div className={styles.issueBanner}>⚠ {d.issueLabel}</div>}

        <div className={styles.actionsRow}>
          <a href="#" className={styles.linkAction} onClick={(e) => e.preventDefault()}>계약 상세</a>
          <div className={styles.actionsSpacer} />
          <button type="button" className={styles.secondaryBtn} onClick={onToggleExtendPanel}>기간 변경</button>
          {d.canRenew && (
            <button type="button" className={styles.primaryBtn} onClick={onToggleRenewPanel}>갱신 검토 시작</button>
          )}
        </div>

        {showExtendPanel && (
          <div className={styles.panel}>
            <div className={styles.panelRow}>
              <input className={styles.panelInput} value={d.start} disabled />
              <span className={styles.panelTilde}>~</span>
              <input className={styles.panelInput} placeholder="변경 종료일" />
            </div>
            <select className={styles.panelSelect}>
              <option>계약 연장</option>
              <option>계약 조기 종료</option>
              <option>거래처 요청</option>
              <option>기타</option>
            </select>
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleExtendPanel}>취소</button>
              <button type="button" className={styles.panelConfirmBtn} onClick={onConfirmExtend}>변경 검토</button>
            </div>
          </div>
        )}

        {showRenewPanel && (
          <div className={styles.panel}>
            <select className={styles.panelSelect}>
              <option>기존 조건으로 연장</option>
              <option>조건 변경 후 갱신</option>
              <option>신규 계약 생성</option>
              <option>갱신하지 않음</option>
            </select>
            <textarea className={styles.panelTextarea} placeholder="검토 메모" />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancelBtn} onClick={onToggleRenewPanel}>취소</button>
              <button type="button" className={styles.panelConfirmBtn} onClick={onConfirmRenew}>검토 시작</button>
            </div>
          </div>
        )}

        <div className={styles.tabsRow}>
          {PERIOD_TABS.map(([key, label]) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                className={styles.tabBtn}
                style={{ fontWeight: active ? 700 : 500, color: active ? '#18181b' : '#8b8b93', boxShadow: active ? ACCENT_MARK : 'none' }}
                onClick={() => onTabChange(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.scroll}>
        {activeTab === 'summary' && (
          <div>
            <div className={styles.sectionLabel}>기간 요약</div>
            <div className={styles.fieldsBox}>
              {d.summaryFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'renewal' && (
          <div>
            <div className={styles.sectionLabel}>갱신 정보</div>
            <div className={styles.fieldsBox}>
              {d.renewalFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue} style={{ fontWeight: f.weight, color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
            {d.hasSuccessor && (
              <div className={styles.successorBox}>
                <span className={styles.successorLabel}>후속 계약</span>
                <a href="#" className={styles.successorLink} onClick={(e) => e.preventDefault()}>{d.successor}</a>
              </div>
            )}
            {d.hasGap && (
              <div className={styles.gapWarning}>⚠ 계약 공백 {d.gapDays}일 ({d.gapRange})</div>
            )}
          </div>
        )}

        {activeTab === 'linked' && (
          <div>
            <div className={styles.sectionLabel}>연결 업무</div>
            <div className={styles.fieldsBox}>
              {d.linkedFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <a href="#" className={styles.linkedValue} onClick={(e) => e.preventDefault()}>{f.value}</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>변경 이력</div>
            {d.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineTopRow}>
                    <span className={styles.timelineAction}>{h.action}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineBy}>{h.by}{h.note ? ` · ${h.note}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
