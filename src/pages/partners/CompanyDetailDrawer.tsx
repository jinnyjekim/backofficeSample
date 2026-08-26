import { useRef, useState } from 'react';
import styles from './CompanyDetailDrawer.module.css';
import { ACCENT } from '../../lib/theme';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { STATUS_META, fmtWon, type Company, type CompanyStatus } from './companiesData';

const TABS: { key: string; label: string }[] = [
  { key: 'basic', label: '기본정보' },
  { key: 'contacts', label: '담당자' },
  { key: 'terms', label: '거래조건' },
  { key: 'contracts', label: '계약' },
  { key: 'orders', label: '주문/거래' },
  { key: 'collection', label: '수금/미수금' },
  { key: 'settlement', label: '정산' },
  { key: 'history', label: '이력' },
];

const STATUS_OPTIONS: CompanyStatus[] = ['거래중', '거래대기', '거래중지', '거래종료'];

interface Props {
  company: Company;
  onClose: () => void;
  onStatusChange: (code: string, status: CompanyStatus) => void;
  onAddMemo: (code: string, text: string) => void;
}

export function CompanyDetailDrawer({ company, onClose, onStatusChange, onAddMemo }: Props) {
  const [activeTab, setActiveTab] = useState('basic');
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CompanyStatus>(company.status);
  const [reason, setReason] = useState('');
  const [memoText, setMemoText] = useState('');

  const sm = STATUS_META[company.status];
  const over = company.terms.limit > 0 && company.terms.used > company.terms.limit;
  const actionLabel = company.status === '거래중' ? '거래중지' : '거래재개';
  const remain = Math.max(0, company.terms.limit - company.terms.used);
  const limitPct = company.terms.limit > 0 ? Math.min(100, Math.round((company.terms.used / company.terms.limit) * 100)) : 0;

  const asideRef = useRef<HTMLElement>(null);
  useOutsideClose(asideRef, onClose);

  function applyStatus() {
    onStatusChange(company.code, pendingStatus);
    setShowStatusPanel(false);
    setReason('');
  }

  function submitMemo() {
    if (!memoText.trim()) return;
    onAddMemo(company.code, memoText.trim());
    setMemoText('');
  }

  return (
    <aside ref={asideRef} className={styles.aside}>
      <div className={styles.head}>
        <div className={styles.headRow}>
          <div className={styles.headBody}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{company.name}</span>
              <span className={styles.badge} style={{ background: sm.bg, color: sm.fg }}>{company.status}</span>
              <span className={styles.badge} style={{ background: '#eef2ff', color: '#4338ca' }}>{company.grade}등급</span>
            </div>
            <div className={styles.sub}>회사코드 {company.code}</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {over && (
          <div className={styles.overLimitBanner}>
            <span>⚠</span>
            <span>신용 한도를 초과했습니다. 신규 주문 승인이 제한됩니다.</span>
          </div>
        )}

        <div className={styles.actionRow}>
          <button type="button" className={styles.actionBtn} onClick={() => setShowStatusPanel((v) => !v)}>{actionLabel}</button>
          <button type="button" className={styles.actionBtn}>수정</button>
        </div>

        {showStatusPanel && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>거래 상태 변경</div>
            <div className={styles.panelHint}>현재 상태 · {company.status}</div>
            <select
              className={styles.panelSelect}
              value={pendingStatus}
              onChange={(e) => setPendingStatus(e.target.value as CompanyStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input className={styles.panelInput} placeholder="변경 사유" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className={styles.panelActions}>
              <button type="button" className={styles.panelCancel} onClick={() => setShowStatusPanel(false)}>취소</button>
              <button type="button" className={styles.panelConfirm} onClick={applyStatus}>변경</button>
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
        {activeTab === 'basic' && (
          <div>
            {[
              { title: '기본정보', fields: [
                { label: '회사코드', value: company.code }, { label: '회사명', value: company.name },
                { label: '거래상태', value: company.status }, { label: '거래등급', value: company.grade },
                { label: '회사유형', value: company.type }, { label: '등록일', value: company.registered },
                { label: '최근 수정일', value: company.updated },
              ] },
              { title: '사업자 정보', fields: [
                { label: '사업자등록번호', value: company.bizNo }, { label: '대표자명', value: company.rep },
                { label: '사업자유형', value: company.bizType }, { label: '업태', value: company.upTae }, { label: '종목', value: company.jongMok },
              ] },
              { title: '연락처', fields: [
                { label: '대표전화', value: company.phone }, { label: '대표 이메일', value: company.email },
                { label: '홈페이지', value: company.homepage }, { label: '주소', value: company.address },
              ] },
            ].map((g) => (
              <div className={styles.section} key={g.title}>
                <div className={styles.sectionTitle}>{g.title}</div>
                <div className={styles.fieldBox}>
                  {g.fields.map((f) => (
                    <div className={styles.fieldRow} key={f.label}>
                      <span className={styles.fieldLabel}>{f.label}</span>
                      <span className={styles.fieldValue}>{f.value}</span>
                    </div>
                  ))}
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
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            <div className={styles.rowBetween}>
              <div className={styles.sectionTitle}>담당자</div>
              <button type="button" className={styles.smallBtn}>＋ 담당자 등록</button>
            </div>
            <div className={styles.tableBox}>
              <div className={styles.contactHeadRow}>
                <span>이름 · 부서 · 직책</span><span>이메일 · 연락처</span><span></span><span>구분</span>
              </div>
              {company.contacts.map((c, i) => (
                <div className={styles.contactRow} key={i}>
                  <span className={styles.tableCellMain}>{c.name} · {c.dept} {c.title}</span>
                  <span className={styles.tableCellSub}>{c.email}</span>
                  <span className={styles.tableCellSub} style={{ fontVariantNumeric: 'tabular-nums' }}>{c.phone}</span>
                  <span className={styles.roleTag} style={{ color: c.roleFg }}>{c.role}</span>
                </div>
              ))}
              {company.contacts.length === 0 && <div className={styles.emptyRow}>등록된 담당자가 없습니다</div>}
            </div>

            <div className={styles.sectionTitleLoose}>내부 담당자</div>
            {company.internalManagers.map((im, i) => (
              <div className={styles.internalRow} key={i}>
                <span className={styles.internalRole}>{im.role}</span>
                <span className={styles.internalName}>{im.name}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'terms' && (
          <div>
            <div className={styles.fieldBox}>
              {[
                { label: '결제 방식', value: company.terms.method },
                { label: '결제 조건', value: company.terms.condition },
                { label: '최소 주문금액', value: company.terms.minOrder ? fmtWon(company.terms.minOrder) : '-' },
                { label: '세금 처리', value: company.terms.tax },
              ].map((f) => (
                <div className={styles.fieldRow} key={f.label}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <span className={styles.fieldValue}>{f.value}</span>
                </div>
              ))}
            </div>

            <div className={styles.sectionTitleLoose}>신용 한도</div>
            <div className={styles.limitBox}>
              <div className={styles.limitRow}>
                <span>한도 {fmtWon(company.terms.limit)}</span>
                <span>사용 {fmtWon(company.terms.used)}</span>
                <span>잔여 {fmtWon(remain)}</span>
              </div>
              <div className={styles.limitTrack}>
                <div className={styles.limitFill} style={{ width: `${limitPct}%`, background: over ? '#dc2626' : ACCENT }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <div>
            <div className={styles.rowBetween}>
              <div className={styles.sectionTitle}>계약</div>
              <a href="#" onClick={(e) => e.preventDefault()}>전체 계약 보기</a>
            </div>
            <div className={styles.tableBox}>
              <div className={styles.contractHeadRow}>
                <span>계약번호</span><span>계약명</span><span>기간</span><span>상태</span>
              </div>
              {company.contracts.map((c, i) => (
                <div className={styles.contractRow} key={i}>
                  <span className={styles.linkCell}>{c.no}</span>
                  <span className={styles.tableCellMain}>{c.name}</span>
                  <span className={styles.tableCellSub}>{c.period}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: c.statusFg }}>{c.status}</span>
                </div>
              ))}
              {company.contracts.length === 0 && <div className={styles.emptyRow}>등록된 계약이 없습니다</div>}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <div className={styles.summaryRow}>
              {[
                { label: '누적 주문', value: `${company.orderSummary.count}건` },
                { label: '누적 거래액', value: fmtWon(company.orderSummary.total) },
                { label: '최근 거래', value: company.orderSummary.last },
              ].map((s) => (
                <div key={s.label}>
                  <div className={styles.summaryLabel}>{s.label}</div>
                  <div className={styles.summaryValue}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.rowBetween}>
              <div className={styles.sectionTitle}>최근 거래</div>
              <a href="#" onClick={(e) => e.preventDefault()}>전체 주문 보기</a>
            </div>
            <div className={styles.tableBox}>
              <div className={styles.orderHeadRow}>
                <span>주문번호</span><span>주문일</span><span style={{ textAlign: 'right' }}>금액</span><span style={{ textAlign: 'right' }}>상태</span>
              </div>
              {company.orders.map((o, i) => (
                <div className={styles.orderRow} key={i}>
                  <span className={styles.linkCell}>{o.no}</span>
                  <span className={styles.tableCellSub}>{o.date}</span>
                  <span className={styles.tableCellMain} style={{ textAlign: 'right' }}>{fmtWon(o.amount)}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: o.statusFg, textAlign: 'right' }}>{o.status}</span>
                </div>
              ))}
              {company.orders.length === 0 && <div className={styles.emptyRow}>거래 내역이 없습니다</div>}
            </div>
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            <div className={styles.collectionSummaryGrid}>
              {[
                { label: '청구금액', value: fmtWon(company.collection.billed), color: '#18181b' },
                { label: '수금완료', value: fmtWon(company.collection.collected), color: '#059669' },
                { label: '미수금', value: fmtWon(company.collection.receivable), color: company.collection.receivable > 0 ? '#dc2626' : '#18181b' },
                { label: '연체금액', value: fmtWon(company.collection.overdue), color: company.collection.overdue > 0 ? '#dc2626' : '#18181b' },
              ].map((s) => (
                <div className={styles.collectionCell} key={s.label}>
                  <div className={styles.summaryLabel}>{s.label}</div>
                  <div className={styles.summaryValue} style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className={styles.tableBox}>
              <div className={styles.collectionHeadRow}>
                <span>수금 예정일</span><span style={{ textAlign: 'right' }}>금액</span><span style={{ textAlign: 'right' }}>상태</span>
              </div>
              {company.collectionRows.map((c, i) => (
                <div className={styles.collectionRow} key={i}>
                  <span className={styles.tableCellSub}>{c.date}</span>
                  <span className={styles.tableCellMain} style={{ textAlign: 'right' }}>{fmtWon(c.amount)}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: c.statusFg, textAlign: 'right' }}>{c.status}</span>
                </div>
              ))}
              {company.collectionRows.length === 0 && <div className={styles.emptyRow}>수금 예정 내역이 없습니다</div>}
            </div>
            <a href="#" onClick={(e) => e.preventDefault()}>수금 관리 보기</a>
          </div>
        )}

        {activeTab === 'settlement' && (
          <div>
            <div className={styles.sectionTitle}>정산 내역</div>
            <div className={styles.tableBox}>
              <div className={styles.settlementHeadRow}>
                <span>정산번호</span><span>정산기간</span><span style={{ textAlign: 'right' }}>정산금액</span><span style={{ textAlign: 'right' }}>상태</span>
              </div>
              {company.settlements.map((s, i) => (
                <div className={styles.settlementRow} key={i}>
                  <span className={styles.linkCell}>{s.no}</span>
                  <span className={styles.tableCellSub}>{s.period}</span>
                  <span className={styles.tableCellMain} style={{ textAlign: 'right' }}>{fmtWon(s.amount)}</span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: s.statusFg, textAlign: 'right' }}>{s.status}</span>
                </div>
              ))}
              {company.settlements.length === 0 && <div className={styles.emptyRow}>정산 내역이 없습니다</div>}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <div className={styles.sectionTitle}>변경 이력</div>
            <div className={styles.sectionSub}>거래 상태 · 등급 · 조건 변경을 추적합니다</div>
            {company.history.map((h, i) => (
              <div className={styles.timelineItem} key={i}>
                <div className={styles.timelineDot} />
                <div className={styles.timelineBody}>
                  <div className={styles.timelineRow}>
                    <span className={styles.timelineTitle}>{h.change}</span>
                    <span className={styles.timelineWhen}>{h.when}</span>
                  </div>
                  <div className={styles.timelineAdmin}>{h.admin}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
