import { useMemo, useState } from 'react';
import styles from './quoteShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';
import { QUOTE_RECORDS, STATUSES, STATUS_META, fmt } from './quoteHistoryData';
import { buildHistoryDetail } from './quoteHistoryDetail';
import { QuoteHistoryDetailDrawer } from './QuoteHistoryDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '96px 1fr 110px 110px 76px 84px 84px 78px 78px 60px';
const GRID_MIN_WIDTH = '1180px';

const GRID_COLUMNS: GridColumn[] = [
  { label: '견적번호' },
  { label: '거래처' },
  { label: '최초금액', align: 'right' },
  { label: '최종금액', align: 'right' },
  { label: 'Version' },
  { label: '최종상태' },
  { label: '담당자' },
  { label: '최초작성' },
  { label: '최종처리' },
  { label: '관리' },
];

export function QuoteHistoryPage() {
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [compareFrom, setCompareFrom] = useState('V1');
  const [compareTo, setCompareTo] = useState('V1');

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: QUOTE_RECORDS.length };
    STATUSES.slice(1).forEach((st) => {
      c[st] = QUOTE_RECORDS.filter((r) => r.status === st).length;
    });
    return c;
  }, []);

  const filtered = useMemo(() => {
    return QUOTE_RECORDS.filter((r) => {
      if (filter !== '전체' && r.status !== filter) return false;
      if (q && !(r.id.includes(q) || r.partner.includes(q))) return false;
      return true;
    });
  }, [filter, q]);

  function openDetail(id: string) {
    const rec = QUOTE_RECORDS.find((r) => r.id === id);
    setSelectedId(id);
    setActiveTab('summary');
    setCompareFrom('V1');
    setCompareTo(rec ? rec.versions[rec.versions.length - 1].label : 'V1');
  }

  const rows: GridRow[] = filtered.map((r) => {
    const sm = STATUS_META[r.status];
    const cells: Cell[] = [
      { kind: 'text', text: r.id, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
      { kind: 'text', text: r.partner, color: '#18181b', size: '13px', weight: 600 },
      { kind: 'text', text: fmt(r.firstAmount), color: '#71717a', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: fmt(r.finalAmount), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
      { kind: 'text', text: r.versions.length + '개', color: '#52525b', size: '12px', weight: 500, numeric: true },
      { kind: 'badge', text: r.status, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: r.owner, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: r.created, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: r.finalized, color: '#8b8b93', size: '11.5px', weight: 500, numeric: true },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: r.id, cells, onClick: () => openDetail(r.id) };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === 1 }));

  const selected = selectedId ? QUOTE_RECORDS.find((r) => r.id === selectedId) ?? null : null;
  const detail = selected
    ? buildHistoryDetail(
        selected,
        { activeTab, compareFrom, compareTo },
        {
          onClose: () => setSelectedId(null),
          onTabChange: setActiveTab,
          onCompareFrom: setCompareFrom,
          onCompareTo: setCompareTo,
        },
      )
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.scrollArea}>
        <div className={styles.headTop}>
          <div className={styles.headRow}>
            <div>
              <div className={styles.title}>견적 이력</div>
              <div className={styles.subtitle}>과거 견적과 Version별 변경사항 및 처리 결과를 조회합니다.</div>
            </div>
          </div>

          <div className={styles.quickFilters}>
            {STATUSES.map((st) => {
              const active = filter === st;
              return (
                <button
                  key={st}
                  type="button"
                  className={styles.qfBtn}
                  style={{ borderColor: active ? ACCENT : 'rgba(0,0,0,.1)', background: active ? ACCENT : '#fff' }}
                  onClick={() => setFilter(st)}
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
                <option>주문번호</option>
              </select></label>
              <input
                className={styles.searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="견적번호, 거래처 또는 상품명"
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
              <label className="globalFilterField"><span>견적 버전</span><select aria-label="견적 버전" className={styles.selectXs}>
                <option>Version 전체</option>
                <option>1회 작성</option>
                <option>재견적 있음</option>
              </select></label>
              <div className={styles.rowSpacer} />
              <button type="button" className={styles.resetBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
            </div>
          </div>

          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>총 {filtered.length}건</span>
            <div className={styles.resultActions}>
              <ExcelDownloadButton type="button" data-grid-download />
              <select className={styles.pageSizeSelect}>
                <option>20개씩 보기</option>
                <option>50개씩 보기</option>
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
            emptyText="검색 결과가 없습니다"
          />
        </div>

        {detail && <QuoteHistoryDetailDrawer detail={detail} onTabChange={setActiveTab} />}
      </div>
    </div>
  );
}
