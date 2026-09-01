import { useMemo, useRef, useState } from 'react';
import styles from './quoteShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';
import { QUOTES, QUICK_FILTER_KEYS, STATUS_META, fmt, issuesOf, type Quote } from './quotesData';
import { buildQuoteDetail } from './quoteDetail';
import { QuoteDetailDrawer } from './QuoteDetailDrawer';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '96px 1fr 1fr 120px 84px 100px 84px 78px 60px';
const GRID_MIN_WIDTH = '1160px';

const GRID_COLUMNS: GridColumn[] = [
  { label: '견적번호' },
  { label: '거래처' },
  { label: '견적내용' },
  { label: '견적금액', align: 'right' },
  { label: '유효기간' },
  { label: '상태' },
  { label: '담당자' },
  { label: '작성일' },
  { label: '관리' },
];

export function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(QUOTES);
  const [statusFilter, setStatusFilter] = useState<(typeof QUICK_FILTER_KEYS)[number]>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showRegister, setShowRegister] = useState(false);
  const registerAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(registerAsideRef, () => setShowRegister(false), showRegister);
  const [showApprovePanel, setShowApprovePanel] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: quotes.length };
    QUICK_FILTER_KEYS.slice(1).forEach((st) => {
      c[st] = quotes.filter((r) => r.status === st).length;
    });
    return c;
  }, [quotes]);

  const filtered = useMemo(() => {
    return quotes.filter((r) => {
      if (statusFilter !== '전체' && r.status !== statusFilter) return false;
      if (q && !(r.id.includes(q) || r.partner.includes(q))) return false;
      return true;
    });
  }, [quotes, statusFilter, q]);

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('info');
    setShowRegister(false);
    setShowApprovePanel(false);
  }

  function updateSelected(fn: (r: Quote) => Quote) {
    setQuotes((prev) => prev.map((r) => (r.id === selectedId ? fn(r) : r)));
  }

  const rows: GridRow[] = filtered.map((r) => {
    const sm = STATUS_META[r.status];
    const iss = issuesOf(r);
    const summary = r.items.length > 1 ? `${r.items[0].name} 외 ${r.items.length - 1}건` : r.items[0].name;
    const cells: Cell[] = [
      { kind: 'noWarn', no: r.id, hasIssue: iss.length > 0, issueTitle: iss.join(', ') },
      { kind: 'text', text: r.partner, color: '#18181b', size: '13px', weight: 600 },
      { kind: 'text', text: summary, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: fmt(r.amount), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
      { kind: 'text', text: r.validUntil.slice(5).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'badge', text: r.status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: r.owner, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: r.created, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: r.id, cells, onClick: () => openDetail(r.id) };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === 1 }));

  const selected = selectedId ? quotes.find((r) => r.id === selectedId) ?? null : null;
  const detail =
    selected && !showRegister
      ? buildQuoteDetail(
          selected,
          { activeTab, showApprovePanel },
          {
            onClose: () => setSelectedId(null),
            onTabChange: setActiveTab,
            onRequestApproval: () => {
              updateSelected((r) => ({
                ...r,
                status: '승인대기',
                history: [...r.history, { when: '방금', action: '승인 요청', by: r.owner }],
              }));
            },
            onApprove: () => {
              updateSelected((r) => ({
                ...r,
                status: '발송대기',
                history: [...r.history, { when: '방금', action: '승인 완료', by: 'admin03' }],
              }));
            },
            onSend: () => {
              updateSelected((r) => ({
                ...r,
                status: '발송완료',
                sendLogs: [...r.sendLogs, { title: '견적서 발송', when: '방금', to: r.contact, by: r.owner }],
              }));
            },
            onMarkAccept: () => {
              updateSelected((r) => ({
                ...r,
                status: '수락',
                history: [...r.history, { when: '방금', action: '견적 수락', by: '거래처' }],
              }));
            },
            onMarkReject: () => {
              updateSelected((r) => ({
                ...r,
                status: '거절',
                history: [...r.history, { when: '방금', action: '견적 거절', by: '거래처' }],
              }));
            },
            onReQuote: () => {
              updateSelected((r) => ({
                ...r,
                history: [...r.history, { when: '방금', action: '재견적 작성 시작', by: r.owner }],
              }));
            },
            onToggleApprovePanel: () => setShowApprovePanel((v) => !v),
            onReject: () => {
              updateSelected((r) => ({
                ...r,
                status: '작성중',
                history: [...r.history, { when: '방금', action: '견적 반려', by: 'admin03' }],
              }));
              setShowApprovePanel(false);
            },
          },
        )
      : null;

  return (
    <div className={styles.page}>
      <div className={styles.scrollArea}>
        <div className={styles.headTop}>
          <div className={styles.headRow}>
            <div>
              <div className={styles.title}>견적서 관리</div>
              <div className={styles.subtitle}>작성된 견적서의 가격, 조건, 발송 및 확정 상태를 관리합니다.</div>
            </div>
            <button type="button" className={styles.registerBtn} onClick={() => { setShowRegister(true); setSelectedId(null); }}>
              ＋ 견적서 작성
            </button>
          </div>

          <div className={styles.quickFilters}>
            {QUICK_FILTER_KEYS.map((st) => {
              const active = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  className={styles.qfBtn}
                  style={{ borderColor: active ? ACCENT : 'rgba(0,0,0,.1)', background: active ? ACCENT : '#fff' }}
                  onClick={() => setStatusFilter(st)}
                >
                  <span className={styles.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{st}</span>
                  <span className={styles.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[st] || 0}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.filterBox}>
            <div className={styles.filterRow1}>
              <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm}>
                <option>전체</option>
                <option>견적번호</option>
                <option>거래처명</option>
                <option>상품명</option>
                <option>내부 담당자</option>
              </select></label>
              <input
                className={styles.searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="견적번호 또는 거래처명"
              />
              <button type="button" className={styles.searchBtn}>검색</button>
            </div>
            <div className={styles.filterRow2}>
              <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectXs}>
                <option>거래처 전체</option>
                <option>회사 01</option>
                <option>회사 02</option>
                <option>㈜한빛물산</option>
              </select></label>
              <label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={styles.selectXs}>
                <option>담당자 전체</option>
                <option>admin01</option>
                <option>admin02</option>
                <option>admin03</option>
              </select></label>
              <label className="globalFilterField"><span>요청 연결</span><select aria-label="요청 연결" className={styles.selectXs}>
                <option>요청 연결 전체</option>
                <option>요청에서 생성</option>
                <option>직접 생성</option>
              </select></label>
              <div className={styles.rowSpacer} />
              <button type="button" className={styles.resetBtn} onClick={() => { setStatusFilter('전체'); setQ(''); }}>초기화</button>
            </div>
          </div>

          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>총 {filtered.length}건</span>
            <div className={styles.resultActions}>
              <ExcelDownloadButton type="button" data-grid-download />
              <select className={styles.pageSizeSelect}>
                <option>20개씩 보기</option>
                <option>50개씩 보기</option>
                <option>100개씩 보기</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.gridWrap}>
          <DataGrid
            columns={GRID_COLUMNS}
            rows={rows}
            gridTemplate={GRID_TEMPLATE}
            minWidth={GRID_MIN_WIDTH}
            showPagination
            pages={pages}
            empty={rows.length === 0}
            emptyText="작성된 견적서가 없습니다"
            emptySubtext="거래처에 제안할 견적서를 작성해 주세요."
            emptyActionLabel="＋ 견적서 작성"
            emptyActionClick={() => { setShowRegister(true); setSelectedId(null); }}
          />
        </div>

        {detail && <QuoteDetailDrawer detail={detail} onTabChange={setActiveTab} />}

        {showRegister && (
          <aside ref={registerAsideRef} className={styles.registerAside}>
            <div className={styles.registerHead}>
              <span className={styles.registerTitle}>견적서 작성</span>
              <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
            </div>
            <div className={styles.registerBody}>
              <div className={styles.formSectionLabel}>1. 기본정보</div>
              <label className={styles.formLabel}>
                거래처 *
                <input className={styles.formInput} placeholder="거래처 검색" />
              </label>
              <label className={styles.formLabel}>
                거래처 담당자 *
                <select className={styles.formSelect}>
                  <option>담당자 선택</option>
                  <option>김OO · 구매팀</option>
                </select>
              </label>
              <label className={styles.formLabel}>
                연결 견적 요청
                <select className={styles.formSelect}>
                  <option>없음</option>
                  <option>RFQ-1028</option>
                  <option>RFQ-1027</option>
                </select>
              </label>
              <div className={styles.formRow2}>
                <label className={styles.formLabel}>
                  견적일 *
                  <input className={styles.formInput} placeholder="2026.08.14" />
                </label>
                <label className={styles.formLabel}>
                  유효기간 *
                  <input className={styles.formInput} placeholder="2026.08.31" />
                </label>
              </div>

              <div className={styles.formSectionLabel}>2. 견적 항목</div>
              <div className={styles.fieldsBox} style={{ marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px', gap: 8, padding: '8px 11px', background: '#fbfbfc', borderBottom: '1px solid rgba(0,0,0,.07)', fontSize: 11, color: '#71717a', fontWeight: 600 }}>
                  <span>상품</span><span>수량</span><span style={{ textAlign: 'right' }}>단가</span><span style={{ textAlign: 'right' }}>금액</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 90px', gap: 8, alignItems: 'center', padding: '9px 11px' }}>
                  <input placeholder="상품 검색" style={{ height: 30, border: '1px solid rgba(0,0,0,.1)', borderRadius: 7, padding: '0 8px', fontSize: 12, boxSizing: 'border-box' }} />
                  <input placeholder="100" style={{ height: 30, border: '1px solid rgba(0,0,0,.1)', borderRadius: 7, padding: '0 8px', fontSize: 12, boxSizing: 'border-box' }} />
                  <input placeholder="29,000" style={{ height: 30, border: '1px solid rgba(0,0,0,.1)', borderRadius: 7, padding: '0 8px', fontSize: 12, textAlign: 'right', boxSizing: 'border-box' }} />
                  <span style={{ fontSize: 12, color: '#71717a', textAlign: 'right' }}>2,900,000</span>
                </div>
              </div>
              <button type="button" className={styles.formOutlineBtn} style={{ marginBottom: 20 }}>＋ 항목 추가</button>

              <div className={styles.formSectionLabel}>3. 금액</div>
              <div style={{ background: '#fafafa', borderRadius: 10, padding: 12, fontSize: 12.5, color: '#3f3f46', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>공급가액<span>2,900,000원</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>할인<span>-50,000원</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>세금<span>285,000원</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', borderTop: '1px solid rgba(0,0,0,.08)', marginTop: 6, fontWeight: 700, fontSize: 13.5 }}>최종 견적금액<span>3,135,000원</span></div>
              </div>

              <div className={styles.formSectionLabel}>4. 거래 조건</div>
              <label className={styles.formLabel}>
                납기
                <input className={styles.formInput} />
              </label>
              <label className={styles.formLabel}>
                결제조건
                <select className={styles.formSelect}>
                  <option>후불 30일</option>
                  <option>후불 45일</option>
                  <option>선불</option>
                </select>
              </label>
              <label className={styles.formLabel}>
                특이사항
                <textarea className={styles.formTextarea} />
              </label>

              <div className={styles.formSectionLabel}>5. 내부 정보</div>
              <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                내부 담당자
                <select className={styles.formSelect}>
                  <option>admin01</option>
                  <option>admin02</option>
                </select>
              </label>
            </div>
            <div className={styles.registerFooter}>
              <button type="button" className={styles.formOutlineBtn} onClick={() => setShowRegister(false)}>임시저장</button>
              <button type="button" className={styles.formPrimaryBtn} onClick={() => setShowRegister(false)}>견적 저장</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
