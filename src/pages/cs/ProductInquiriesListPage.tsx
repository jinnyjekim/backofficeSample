import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import {
  INQUIRY_TYPES,
  PRODUCT_INQUIRIES,
  QUICK_FILTERS,
  STATUS_META,
  computeIssues,
  matchesQuickFilter,
  productName,
  type ProductInquiry,
  type QuickFilter,
} from './productInquiriesData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '84px minmax(120px,1fr) minmax(160px,1.6fr) 90px 90px 110px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '문의번호' }, { label: '상품' }, { label: '문의 제목' }, { label: '작성자' }, { label: '답변 상태' }, { label: '등록일' }, { label: '관리' },
];

const SEARCH_SCOPES = ['전체', '문의번호', '문의 제목', '작성자', '상품'] as const;
type SearchScope = (typeof SEARCH_SCOPES)[number];

function matchesSearch(q: ProductInquiry, scope: SearchScope, keyword: string): boolean {
  if (!keyword) return true;
  const k = keyword.toLowerCase();
  if (scope === '문의번호') return q.id.toLowerCase().includes(k);
  if (scope === '문의 제목') return q.title.toLowerCase().includes(k) || q.content.toLowerCase().includes(k);
  if (scope === '작성자') return q.member.toLowerCase().includes(k);
  if (scope === '상품') return q.productCode.toLowerCase().includes(k) || productName(q.productCode).toLowerCase().includes(k);
  return q.id.toLowerCase().includes(k) || q.title.toLowerCase().includes(k) || q.member.toLowerCase().includes(k) || q.productCode.toLowerCase().includes(k) || productName(q.productCode).toLowerCase().includes(k);
}

export function ProductInquiriesListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inquiries, setInquiries] = useState<ProductInquiry[]>(() => [...PRODUCT_INQUIRIES]);
  const statusParam = searchParams.get('status');
  const quickFilter: QuickFilter = statusParam === 'waiting' ? '답변 대기' : statusParam === 'answered' ? '답변 완료' : '전체';
  const [scope, setScope] = useState<SearchScope>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = inquiries.filter((q) => matchesQuickFilter(q, f) && !q.hidden).length; });
    return c;
  }, [inquiries]);

  const filtered = useMemo(
    () =>
      inquiries.filter((q) => {
        if (q.hidden) return false;
        if (!matchesQuickFilter(q, quickFilter)) return false;
        if (!matchesSearch(q, scope, search)) return false;
        if (typeFilter && q.inquiryType !== typeFilter) return false;
        if (visibilityFilter && q.visibility !== visibilityFilter) return false;
        if (startDate && q.createdAt.slice(0, 10) < startDate) return false;
        if (endDate && q.createdAt.slice(0, 10) > endDate) return false;
        return true;
      }),
    [inquiries, quickFilter, scope, search, typeFilter, visibilityFilter, startDate, endDate],
  );

  const resetFilters = () => {
    setScope('전체');
    setKeyword('');
    setSearch('');
    setTypeFilter('');
    setVisibilityFilter('');
    setStartDate('');
    setEndDate('');
  };

  const selectQuickFilter = (filter: QuickFilter) => {
    const next = new URLSearchParams(searchParams);
    if (filter === '답변 대기') next.set('status', 'waiting');
    else if (filter === '답변 완료') next.set('status', 'answered');
    else next.delete('status');
    setSearchParams(next, { replace: true });
  };

  function toggleHidden(q: ProductInquiry) {
    setInquiries((prev) => prev.map((x) => (x.id === q.id ? { ...x, hidden: !x.hidden } : x)));
    toastBriefly(q.hidden ? '문의를 복원했습니다.' : '문의를 숨김 처리했습니다.');
    setMenuId(null);
  }

  const rows: GridRow[] = filtered.map((q) => {
    const sm = STATUS_META[q.status];
    const issues = computeIssues(q);
    const cells: Cell[] = [
      { kind: 'text', text: q.id, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: productName(q.productCode), color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'titleWarn', title: `${q.visibility === '비공개' ? '🔒 ' : ''}${q.title}`, hasIssue: issues.length > 0, issueTitle: issues.join(' · ') },
      { kind: 'text', text: q.member, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'badge', text: q.status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: q.createdAt.slice(5, 10).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      {
        kind: 'rowMenu',
        align: 'right',
        detailLabel: '상세',
        onDetail: () => navigate(`/cs/product-inquiries/${q.id}`),
        open: menuId === q.id,
        onToggle: () => setMenuId(menuId === q.id ? null : q.id),
        items: [
          { label: '상세 보기', click: () => navigate(`/cs/product-inquiries/${q.id}`) },
          { sep: true },
          { label: '문의 숨김', fg: '#dc2626', click: () => toggleHidden(q) },
        ],
      },
    ];
    return { id: q.id, cells, onClick: () => navigate(`/cs/product-inquiries/${q.id}`) };
  });

  return (
    <div className={styles.page} onClick={() => menuId && setMenuId(null)}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>상품 문의 관리</div>
            <div className={styles.subtitle}>상품 문의를 하나의 업무 큐에서 조회하고 답변·노출 상태와 처리 기록을 관리합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((f) => (
            <button key={f} type="button" className={styles.qfBtn} style={{ borderColor: quickFilter === f ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: quickFilter === f ? 'var(--accent)' : '#fff' }} onClick={() => selectQuickFilter(f)}>
              <span className={styles.qfLabel} style={{ color: quickFilter === f ? '#fff' : '#3f3f46' }}>{f}</span>
              <span className={styles.qfCount} style={{ color: quickFilter === f ? '#fff' : '#3f3f46' }}>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className={styles.filterBox}>
          <form className={styles.filterRow1} onSubmit={(e) => { e.preventDefault(); setSearch(keyword.trim()); }}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm} value={scope} onChange={(e) => setScope(e.target.value as SearchScope)}>
              {SEARCH_SCOPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select></label>
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="검색어를 입력하세요" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>문의 유형</span><select aria-label="문의 유형" className={styles.selectSm} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">문의 유형 전체</option>
              {INQUIRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select></label>
            <label className="globalFilterField"><span>공개 여부</span><select aria-label="공개 여부" className={styles.selectSm} value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
              <option value="">공개 여부 전체</option>
              <option value="공개">공개</option>
              <option value="비공개">비공개</option>
            </select></label>
            <input type="date" className={styles.selectSm} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span style={{ color: '#a1a1aa', fontSize: 12 }}>~</span>
            <input type="date" className={styles.selectSm} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <span className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download onClick={() => toastBriefly('상품 문의 목록을 다운로드했습니다.')} />
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="920px"
          empty={rows.length === 0}
          emptyText={quickFilter === '답변 대기' ? '답변 대기 중인 문의가 없습니다.' : '조회된 상품 문의가 없습니다.'}
          emptySubtext="검색어나 필터 조건을 변경해 주세요."
          emptyActionLabel="필터 초기화"
          emptyActionClick={resetFilters}
        />
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
