import { useState } from 'react';
import styles from './CreditTermsDetailDrawer.module.css';
import { CREDIT_STATUS_META, fmtWon, statusOf, type CreditCompany } from './creditTermsData';

const TABS: { key: string; label: string }[] = [
  { key: 'credit', label: '신용 조건' },
  { key: 'terms', label: '거래 조건' },
  { key: 'history', label: '변경 이력' },
];

interface Props {
  company: CreditCompany;
  onClose: () => void;
  onChangeLimit: (code: string, newLimit: number, reason: string) => void;
  onAddMemo: (code: string, text: string) => void;
}

export function CreditTermsDetailDrawer({ company, onClose, onChangeLimit, onAddMemo }: Props) {
  const [activeTab, setActiveTab] = useState('credit');
  const [showEdit, setShowEdit] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [reason, setReason] = useState('거래 규모 확대');
  const [memoText, setMemoText] = useState('');

  const st = statusOf(company);
  const sm = CREDIT_STATUS_META[st];
  const remain = company.limit - company.used;
  const pct = company.limit > 0 ? Math.min(100, Math.round((company.used / company.limit) * 100)) : 0;
  const barColor = st === '초과' ? '#dc2626' : st === '임박' ? '#d97706' : 'oklch(0.52 0.16 258)';
  const overLimit = st === '초과';
  const nearLimit = st === '임박';
  const overAmount = Math.max(0, company.used - company.limit);

  const creditFields = [
    { label: '신용거래', value: company.credit ? '사용' : '미사용' },
    { label: '신용한도', value: fmtWon(company.limit) },
    { label: '현재 사용금액', value: fmtWon(company.used) },
    { label: '잔여한도', value: fmtWon(remain) },
    { label: '미수 허용한도', value: fmtWon(company.arLimit) },
    { label: '연체 허용기간', value: company.overduePeriod },
    { label: '한도 초과 시', value: company.overAction },
  ];
  const receivableSummary = [
    { label: '현재 미수금', value: fmtWon(company.receivable), color: company.receivable > 0 ? '#dc2626' : '#18181b' },
    { label: '연체 금액', value: fmtWon(company.overdue), color: company.overdue > 0 ? '#dc2626' : '#18181b' },
    { label: '최장 연체', value: company.overdue > 0 ? '18일' : '-', color: '#18181b' },
  ];

  const termsSummary = `${company.method}${company.cutoff !== '-' ? ' · ' + company.cutoff : ''}${company.collectDay !== '-' ? ' · ' + company.collectDay + ' 지급' : ''}`;
  const termsFields = [
    { label: '결제 방식', value: company.method },
    { label: '결제 기한', value: company.dueDays },
    { label: '마감 기준', value: company.cutoff },
    { label: '수금 예정일', value: company.collectDay },
    { label: '최소 주문금액', value: company.minOrder ? fmtWon(company.minOrder) : '-' },
    { label: '거래 통화', value: company.currency },
    { label: '세금', value: company.tax },
    { label: '가격 적용 기준', value: company.priceBasis },
  ];

  function applyLimitChange() {
    const parsed = Number(limitInput.replace(/[^0-9]/g, ''));
    if (!parsed) return;
    onChangeLimit(company.code, parsed, reason);
    setShowEdit(false);
    setLimitInput('');
  }

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(company.code, memoText.trim());
    setMemoText('');
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.eyebrow}>신용 / 거래 조건 상세 · {company.code}</div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{company.name}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{st}</span>
            </div>
            <div className={styles.sub}>거래중 · 신용거래 {company.credit ? '사용' : '미사용'}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.actionRow}>
          <a href="#" className={styles.actionLink} onClick={(e) => e.preventDefault()}>회사 상세 보기</a>
          <div className={styles.spacer} />
          <button type="button" className={styles.editBtn} onClick={() => setShowEdit((v) => !v)}>조건 변경</button>
        </div>

        <div className={styles.limitCard}>
          <div className={styles.limitTop}>
            <span>신용한도 {fmtWon(company.limit)}</span>
            <span>사용률 {pct}%</span>
          </div>
          <div className={styles.limitTrack}>
            <div className={styles.limitFill} style={{ width: `${pct}%`, background: barColor }} />
          </div>
          <div className={styles.limitBottom}>
            <span>사용 <b>{fmtWon(company.used)}</b></span>
            <span>잔여 <b style={{ color: remain < 0 ? '#dc2626' : '#18181b' }}>{fmtWon(remain)}</b></span>
            <span>미수금 <b style={{ color: company.receivable > 0 ? '#dc2626' : '#18181b' }}>{fmtWon(company.receivable)}</b></span>
          </div>
          {overLimit && <div className={styles.overWarn}>⚠ 신용한도를 {fmtWon(overAmount)} 초과했습니다.</div>}
          {nearLimit && <div className={styles.nearWarn}>⚠ 한도 사용률 {pct}% — 임박 상태입니다.</div>}
        </div>

        {showEdit && (
          <div className={styles.editPanel}>
            <div className={styles.editTitle}>신용 한도 변경</div>
            <div className={styles.editRow}>
              <span>{fmtWon(company.limit)}</span>
              <span className={styles.arrow}>→</span>
              <input
                className={styles.editInput}
                placeholder="변경 한도"
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
              />
            </div>
            <div className={styles.editLabel}>변경 사유 *</div>
            <select className={styles.editSelect} value={reason} onChange={(e) => setReason(e.target.value)}>
              <option>거래 규모 확대</option>
              <option>거래 규모 축소</option>
              <option>신용 평가 변경</option>
              <option>계약 조건 변경</option>
              <option>기타</option>
            </select>
            <div className={styles.editActions}>
              <button type="button" className={styles.editCancel} onClick={() => setShowEdit(false)}>취소</button>
              <button type="button" className={styles.editConfirm} onClick={applyLimitChange}>한도 변경</button>
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
        {activeTab === 'credit' && (
          <div>
            <div className={styles.sectionTitle}>신용 조건</div>
            <div className={styles.fieldBox}>
              {creditFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.sectionTitle}>채권 현황</div>
            <div className={styles.receivableGrid}>
              {receivableSummary.map((r) => (
                <div className={styles.receivableCell} key={r.label}>
                  <div className={styles.summaryLabel}>{r.label}</div>
                  <div className={styles.summaryValue} style={{ color: r.color }}>{r.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.linksRow}>
              <a href="#" onClick={(e) => e.preventDefault()}>수금 관리 보기</a>
              <a href="#" onClick={(e) => e.preventDefault()}>미수금 관리 보기</a>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div>
            <div className={styles.termsSummaryBanner}>{termsSummary}</div>
            <div className={styles.sectionTitle}>거래 조건</div>
            <div className={styles.fieldBox}>
              {termsFields.map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>
            {company.hasConflict && (
              <div className={styles.conflictBanner}>
                ⚠ 현재 계약 조건이 회사 기본 조건보다 우선 적용되고 있습니다.
                <br />
                회사 기본 {termsSummary} · 계약 {company.conflictContract}{' '}
                <a href="#" onClick={(e) => e.preventDefault()}>{company.conflictTerms}</a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>변경 이력</div>
            <div className={styles.sectionSub}>신용한도 · 결제조건 변경을 추적합니다</div>
            {company.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.field}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineChange}>{h.from} → {h.to}</div>
                  <div className={styles.timelineAdmin}>사유: {h.reason} · {h.admin}</div>
                </div>
              </div>
            ))}

            <div className={styles.sectionTitleLoose}>관리자 메모</div>
            <div className={styles.memoInputRow}>
              <input className={styles.memoInput} placeholder="메모를 입력하세요" value={memoText} onChange={(e) => setMemoText(e.target.value)} />
              <button type="button" className={styles.memoSubmit} onClick={submitMemo}>등록</button>
            </div>
            {company.memos.map((m, i) => (
              <div className={styles.memoItem} key={i}>
                <div className={styles.memoWhen}>{m.when} · {m.admin}</div>
                <div className={styles.memoText}>{m.text}</div>
              </div>
            ))}
            {company.memos.length === 0 && <div className={styles.emptyInline}>등록된 메모가 없습니다</div>}
          </div>
        )}
      </div>
    </aside>
  );
}
