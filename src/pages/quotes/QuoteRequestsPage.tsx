import { useMemo, useRef, useState } from 'react';
import styles from './quoteShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';
import { QUOTE_REQUESTS, QUICK_FILTER_KEYS, STATUS_META, type QuoteRequest } from './quoteRequestsData';
import { buildRequestDetail } from './requestDetail';
import { QuoteRequestDetailDrawer } from './QuoteRequestDetailDrawer';
import { useOutsideClose } from '../../lib/useOutsideClose';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '104px 1fr 1.1fr 64px 64px 92px 66px 50px 60px';
const GRID_MIN_WIDTH = '1060px';

const GRID_COLUMNS: GridColumn[] = [
  { label: '요청번호' },
  { label: '거래처' },
  { label: '요청 내용' },
  { label: '요청수량', align: 'right' },
  { label: '희망납기' },
  { label: '상태' },
  { label: '담당자' },
  { label: '요청일' },
  { label: '관리' },
];

export function QuoteRequestsPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>(QUOTE_REQUESTS);
  const [statusFilter, setStatusFilter] = useState<(typeof QUICK_FILTER_KEYS)[number]>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showRegister, setShowRegister] = useState(false);
  const registerAsideRef = useRef<HTMLElement>(null);
  useOutsideClose(registerAsideRef, () => setShowRegister(false), showRegister);
  const [showSupplementPanel, setShowSupplementPanel] = useState(false);
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [showDraftPanel, setShowDraftPanel] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: requests.length };
    QUICK_FILTER_KEYS.slice(1).forEach((st) => {
      c[st] = requests.filter((r) => r.status === st).length;
    });
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== '전체' && r.status !== statusFilter) return false;
      if (q && !(r.id.includes(q) || r.partner.includes(q) || r.items.some((it) => it.name.includes(q)))) return false;
      return true;
    });
  }, [requests, statusFilter, q]);

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('info');
    setShowRegister(false);
    setShowSupplementPanel(false);
    setShowRejectPanel(false);
    setShowDraftPanel(false);
  }

  function updateSelected(fn: (r: QuoteRequest) => QuoteRequest) {
    setRequests((prev) => prev.map((r) => (r.id === selectedId ? fn(r) : r)));
  }

  const rows: GridRow[] = filtered.map((r) => {
    const sm = STATUS_META[r.status];
    const totalQty = r.items.reduce((a, it) => a + (it.qty || 0), 0);
    const summary = r.items.length > 1 ? `${r.items[0].name} 외 ${r.items.length - 1}건` : r.items[0].name;
    const cells: Cell[] = [
      { kind: 'noTag', no: r.id, hasTag: r.urgent, tagText: '긴급', tagBg: '#fef2f2', tagFg: '#dc2626' },
      { kind: 'stack', title: r.partner, subtitle: r.contact },
      { kind: 'text', text: summary, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: String(totalQty || '-'), color: '#52525b', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: r.due.slice(5).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'badge', text: r.status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: r.owner, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: r.requested, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: r.id, cells, onClick: () => openDetail(r.id) };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === 1 }));

  const selected = selectedId ? requests.find((r) => r.id === selectedId) ?? null : null;
  const detail =
    selected && !showRegister
      ? buildRequestDetail(
          selected,
          { activeTab, showSupplementPanel, showRejectPanel, showDraftPanel },
          {
            onClose: () => setSelectedId(null),
            onTabChange: setActiveTab,
            onStartReview: () => {
              updateSelected((r) => ({
                ...r,
                status: '검토중',
                owner: 'admin01',
                history: [...r.history, { when: '방금', action: '검토 시작', by: 'admin01' }],
              }));
            },
            onToggleSupplement: () => {
              setShowSupplementPanel((v) => !v);
              setShowRejectPanel(false);
              setShowDraftPanel(false);
            },
            onToggleReject: () => {
              setShowRejectPanel((v) => !v);
              setShowSupplementPanel(false);
              setShowDraftPanel(false);
            },
            onToggleDraft: () => {
              setShowDraftPanel((v) => !v);
              setShowSupplementPanel(false);
              setShowRejectPanel(false);
            },
            onConfirmSupplement: () => {
              updateSelected((r) => ({ ...r, status: '보완요청' }));
              setShowSupplementPanel(false);
            },
            onConfirmReject: () => {
              updateSelected((r) => ({ ...r, status: '종료' }));
              setShowRejectPanel(false);
            },
            onConfirmDraft: () => {
              updateSelected((r) => ({ ...r, status: '견적작성완료' }));
              setShowDraftPanel(false);
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
              <div className={styles.title}>견적 요청 관리</div>
              <div className={styles.subtitle}>거래처의 견적 요청을 접수하고 처리 상태를 관리합니다.</div>
            </div>
            <button type="button" className={styles.registerBtn} onClick={() => { setShowRegister(true); setSelectedId(null); }}>
              ＋ 견적 요청 등록
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
                <option>요청번호</option>
                <option>거래처명</option>
                <option>상품명</option>
                <option>내부 담당자</option>
              </select></label>
              <input
                className={styles.searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="요청번호, 거래처 또는 상품명"
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
                <option>미배정</option>
              </select></label>
              <label className="globalFilterField"><span>요청유형</span><select aria-label="요청유형" className={styles.selectXs}>
                <option>요청유형 전체</option>
                <option>신규 견적</option>
                <option>재견적</option>
                <option>조건 변경</option>
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
            emptyText="등록된 견적 요청이 없습니다"
            emptySubtext="거래처의 견적 요청이 접수되면 이곳에서 관리할 수 있습니다."
            emptyActionLabel="＋ 견적 요청 등록"
            emptyActionClick={() => { setShowRegister(true); setSelectedId(null); }}
          />
        </div>

        {detail && <QuoteRequestDetailDrawer detail={detail} onTabChange={setActiveTab} />}

        {showRegister && (
          <aside ref={registerAsideRef} className={styles.registerAside}>
            <div className={styles.registerHead}>
              <span className={styles.registerTitle}>견적 요청 등록</span>
              <button type="button" className={styles.closeBtn} onClick={() => setShowRegister(false)}>×</button>
            </div>
            <div className={styles.registerBody}>
              <label className={styles.formLabel}>
                거래처 *
                <input className={styles.formInput} placeholder="거래처 검색" />
              </label>
              <label className={styles.formLabel}>
                요청 담당자 *
                <select className={styles.formSelect}>
                  <option>담당자 선택</option>
                  <option>김OO · 구매팀</option>
                  <option>이OO · 자재팀</option>
                </select>
              </label>

              <div className={styles.formSectionLabel}>요청 항목</div>
              <div className={styles.fieldsBox} style={{ marginBottom: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px', gap: 8, padding: '8px 11px', background: '#fbfbfc', borderBottom: '1px solid rgba(0,0,0,.07)', fontSize: 11, color: '#71717a', fontWeight: 600 }}>
                  <span>상품</span><span>수량</span><span>단위</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px', gap: 8, alignItems: 'center', padding: '9px 11px' }}>
                  <input placeholder="상품 검색" style={{ height: 30, border: '1px solid rgba(0,0,0,.1)', borderRadius: 7, padding: '0 8px', fontSize: 12, boxSizing: 'border-box' }} />
                  <input placeholder="100" style={{ height: 30, border: '1px solid rgba(0,0,0,.1)', borderRadius: 7, padding: '0 8px', fontSize: 12, boxSizing: 'border-box' }} />
                  <select style={{ height: 30, border: '1px solid rgba(0,0,0,.1)', borderRadius: 7, padding: '0 6px', fontSize: 12 }}>
                    <option>EA</option>
                    <option>BOX</option>
                    <option>SET</option>
                  </select>
                </div>
              </div>
              <button type="button" className={styles.formOutlineBtn} style={{ marginBottom: 16 }}>＋ 항목 추가</button>

              <div className={styles.formRow2}>
                <label className={styles.formLabel}>
                  희망 납기
                  <input className={styles.formInput} />
                </label>
                <label className={styles.formLabel}>
                  희망 가격
                  <input className={styles.formInput} placeholder="원" />
                </label>
              </div>

              <div className={styles.formLabel}>요청사항</div>
              <textarea className={styles.formTextarea} placeholder="요청 내용을 입력하세요" />

              <button type="button" className={styles.formOutlineBtn} style={{ marginBottom: 14 }}>파일 추가</button>

              <label className={styles.formLabel} style={{ marginBottom: 0 }}>
                내부 담당자
                <select className={styles.formSelect}>
                  <option>미배정</option>
                  <option>admin01</option>
                  <option>admin02</option>
                </select>
              </label>
            </div>
            <div className={styles.registerFooter}>
              <button type="button" className={styles.formOutlineBtn} onClick={() => setShowRegister(false)}>취소</button>
              <button type="button" className={styles.formPrimaryBtn} onClick={() => setShowRegister(false)}>요청 등록</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
