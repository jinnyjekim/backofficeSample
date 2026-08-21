import styles from './quoteShared.module.css';
import type { HistoryDetail } from './quoteHistoryDetail';

interface Props {
  detail: HistoryDetail;
  onTabChange: (tab: string) => void;
}

export function QuoteHistoryDetailDrawer({ detail: d, onTabChange }: Props) {
  return (
    <aside className={styles.aside}>
      <div className={styles.asideTop}>
        <div className={styles.headRowD}>
          <div className={styles.headMain}>
            <div className={styles.titleLine}>
              <span className={styles.noText}>{d.no}</span>
              <span className={styles.badgePill} style={{ background: d.statusBg, color: d.statusFg }}>{d.statusLabel}</span>
            </div>
            <div className={styles.partnerLine}>{d.partner}</div>
            <div className={styles.metaLine}>최초 {d.firstAmount} → 최종 <b style={{ color: '#18181b' }}>{d.finalAmount}</b> · {d.versionCount}개 Version</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={d.close}>×</button>
        </div>

        <div className={styles.linksRow}>
          <button type="button" className={styles.linkBtn}>거래처 상세</button>
          <button type="button" className={styles.linkBtn}>최종 견적서 보기</button>
          <button type="button" className={styles.pdfBtn}>PDF</button>
          <div className={styles.rowSpacer} />
          <button type="button" className={styles.secondaryBtn}>이 견적으로 재견적 작성</button>
        </div>

        <div className={styles.tabsRow}>
          {d.tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tabBtn} ${t.active ? styles.active : ''}`}
              style={{ fontWeight: t.weight, color: t.fg, boxShadow: t.mark }}
              onClick={() => onTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.scrollBody}>
        {d.isSummary && (
          <div>
            <div className={styles.sectionLabel}>견적 요약</div>
            <div className={styles.fieldsBox}>
              {d.summaryFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isVersions && (
          <div>
            <div className={styles.sectionLabel}>Version 이력</div>
            {d.versions.map((v) => (
              <div key={v.label} style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, padding: 12, marginBottom: 10, background: v.bg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{v.label}</span>
                    <span style={{ fontSize: 11, color: '#a1a1aa', marginLeft: 6 }}>{v.tag}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{v.amount}</span>
                </div>
                <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 6 }}>{v.date} · {v.admin}</div>
                <div style={{ fontSize: 12, color: '#3f3f46', lineHeight: 1.7 }}>{v.changes}</div>
              </div>
            ))}
          </div>
        )}

        {d.isCompare && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 11.5, color: '#71717a', fontWeight: 600 }}>Version 비교</span>
              <select className={styles.selectXs} value={d.compareFrom} onChange={(e) => d.onCompareFrom(e.target.value)}>
                {d.versionOptions.map((vo) => (
                  <option key={vo} value={vo}>{vo}</option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: '#a1a1aa' }}>↔</span>
              <select className={styles.selectXs} value={d.compareTo} onChange={(e) => d.onCompareTo(e.target.value)}>
                {d.versionOptions.map((vo) => (
                  <option key={vo} value={vo}>{vo}</option>
                ))}
              </select>
            </div>
            <div style={{ border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '8px 12px', background: '#fbfbfc', borderBottom: '1px solid rgba(0,0,0,.07)', fontSize: 11, color: '#71717a', fontWeight: 600 }}>
                <span>항목</span><span>{d.compareFrom}</span><span>{d.compareTo}</span>
              </div>
              {d.compareRows.map((cr) => (
                <div key={cr.label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid rgba(0,0,0,.05)' }}>
                  <span style={{ fontSize: 12, color: '#71717a' }}>{cr.label}</span>
                  <span style={{ fontSize: 12.5, color: '#3f3f46' }}>{cr.from}</span>
                  <span style={{ fontSize: 12.5, fontWeight: cr.weight, color: cr.fg }}>{cr.to}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isApproval && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>승인 이력 (Version별)</div>
            {d.approvalGroups.map((ag) => (
              <div key={ag.version} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#18181b', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid rgba(0,0,0,.06)' }}>{ag.version}</div>
                {ag.events.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 11, paddingBottom: 12 }}>
                    <div className={styles.historyDot} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#18181b' }}>{h.action}</span>
                        <span style={{ fontSize: 11, color: '#8b8b93', flex: 'none' }}>{h.when}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#71717a', marginTop: 2 }}>{h.by}</div>
                      {h.note && <div style={{ fontSize: 11.5, color: '#3f3f46', marginTop: 2 }}>"{h.note}"</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {d.isSend && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>발송 이력</div>
            {d.sendLogs.map((sl, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} />
                <div className={styles.historyBody}>
                  <div className={styles.historyTopRow}>
                    <span className={styles.historyAction}>{sl.title}</span>
                    <span className={styles.historyWhen}>{sl.when}</span>
                  </div>
                  <div className={styles.historyBy}>{sl.to} · {sl.by}</div>
                </div>
              </div>
            ))}
            <div className={styles.sectionLabel} style={{ margin: '16px 0 8px' }}>견적 문서 (Version별 PDF)</div>
            {d.versions.map((pv) => (
              <div key={pv.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#fafafa', borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: '#3f3f46' }}>📄 견적서_{d.no}_{pv.label}.pdf</span>
                <a href="#" onClick={(e) => e.preventDefault()}>보기</a>
              </div>
            ))}
          </div>
        )}

        {d.isResult && (
          <div>
            <div className={styles.sectionLabel}>최종 결과</div>
            <div className={styles.fieldsBox} style={{ marginBottom: 20 }}>
              {d.resultFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionLabel}>연결 업무</div>
            <div className={styles.fieldsBox}>
              {d.linkFields.map((lf) => (
                <div className={styles.fieldRow} key={lf.label}>
                  <span className={styles.fieldLabel}>{lf.label}</span>
                  <span className={styles.fieldValue} style={{ color: lf.color }}>{lf.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {d.isTimeline && (
          <div>
            <div className={styles.sectionLabel} style={{ marginBottom: 14 }}>전체 처리 Timeline</div>
            {d.timeline.map((h, i) => (
              <div className={styles.historyItem} key={i}>
                <div className={styles.historyDot} />
                <div className={styles.historyBody}>
                  <div className={styles.historyTopRow}>
                    <span className={styles.historyAction}>{h.action}</span>
                    <span className={styles.historyWhen}>{h.when}</span>
                  </div>
                  <div className={styles.historyBy}>{h.by}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
