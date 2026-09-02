import { useMemo, useState } from 'react';
import styles from './quoteShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';
import { APPROVALS, FILTER_KEYS, STATUS_META, fmt, type Approval, type FilterKey } from './quoteApprovalData';
import { buildApprovalDetail } from './quoteApprovalDetail';
import { QuoteApprovalDetailDrawer } from './QuoteApprovalDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '73px 1fr 92px 52px 55px 63px 66px 100px 56px';
const GRID_MIN_WIDTH = '1020px';

const GRID_COLUMNS: GridColumn[] = [
  { label: '견적번호' },
  { label: '거래처' },
  { label: '견적금액', align: 'right' },
  { label: '할인율', align: 'right' },
  { label: '마진', align: 'right' },
  { label: '승인단계' },
  { label: '요청자' },
  { label: '승인 필요 사유' },
  { label: '상태' },
];

export function QuoteApprovalPage() {
  const [approvals, setApprovals] = useState<Approval[]>(APPROVALS);
  const [filter, setFilter] = useState<FilterKey>('승인대기');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('items');
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [showRejectPanel, setShowRejectPanel] = useState(false);

  const counts = useMemo(() => {
    return {
      승인대기: approvals.filter((a) => a.status === '대기').length,
      '내 승인대기': approvals.filter((a) => a.status === '대기' && a.mine).length,
      승인완료: approvals.filter((a) => a.status === '완료').length,
      반려: approvals.filter((a) => a.status === '반려').length,
      전체: approvals.length,
    } satisfies Record<FilterKey, number>;
  }, [approvals]);

  const filtered = useMemo(() => {
    return approvals.filter((a) => {
      if (filter === '승인대기' && a.status !== '대기') return false;
      if (filter === '내 승인대기' && !(a.status === '대기' && a.mine)) return false;
      if (filter === '승인완료' && a.status !== '완료') return false;
      if (filter === '반려' && a.status !== '반려') return false;
      if (q && !(a.id.includes(q) || a.partner.includes(q))) return false;
      return true;
    });
  }, [approvals, filter, q]);

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('items');
    setShowApprovePanel(false);
    setShowRejectPanel(false);
  }

  function updateSelected(fn: (a: Approval) => Approval) {
    setApprovals((prev) => prev.map((a) => (a.id === selectedId ? fn(a) : a)));
  }

  const rows: GridRow[] = filtered.map((a) => {
    const sm = STATUS_META[a.status];
    const cells: Cell[] = [
      { kind: 'text', text: a.id, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
      { kind: 'text', text: a.partner, color: '#18181b', size: '13px', weight: 600 },
      { kind: 'text', text: fmt(a.amount), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
      { kind: 'text', text: `${a.discount}%`, color: a.discount <= -15 ? '#dc2626' : '#3f3f46', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: `${a.margin}%`, color: a.margin < a.minMargin ? '#dc2626' : '#059669', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: a.stage, color: '#52525b', size: '12px', weight: 500, numeric: true },
      { kind: 'text', text: a.requester, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'text', text: a.reasons.length ? `승인 사유 ${a.reasons.length}건` : '-', color: '#d97706', size: '11.5px', weight: 500 },
      { kind: 'badge', text: a.status, bg: sm.bg, fg: sm.fg },
    ];
    return { id: a.id, cells, onClick: () => openDetail(a.id) };
  });

  const pages: PageBtn[] = [1, 2].map((n) => ({ label: String(n), active: n === 1 }));

  const selected = selectedId ? approvals.find((a) => a.id === selectedId) ?? null : null;
  const detail = selected
    ? buildApprovalDetail(
        selected,
        { activeTab, showApprovePanel, showRejectPanel },
        {
          onClose: () => setSelectedId(null),
          onTabChange: setActiveTab,
          onToggleApprovePanel: () => {
            setShowApprovePanel((v) => !v);
            setShowRejectPanel(false);
          },
          onToggleRejectPanel: () => {
            setShowRejectPanel((v) => !v);
            setShowApprovePanel(false);
          },
          onApprove: () => {
            updateSelected((a) => ({
              ...a,
              status: '완료',
              history: [...a.history, { when: '방금', action: '승인', by: 'admin03' }],
            }));
            setShowApprovePanel(false);
          },
          onReject: () => {
            updateSelected((a) => ({
              ...a,
              status: '반려',
              history: [...a.history, { when: '방금', action: '반려', by: 'admin03' }],
            }));
            setShowRejectPanel(false);
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
              <div className={styles.title}>견적 승인</div>
              <div className={styles.subtitle}>승인 요청된 견적서를 검토하고 승인 또는 반려합니다.</div>
            </div>
          </div>

          <div className={styles.quickFilters}>
            {FILTER_KEYS.map((k) => {
              const active = filter === k;
              return (
                <button
                  key={k}
                  type="button"
                  className={styles.qfBtn}
                  style={{ borderColor: active ? ACCENT : 'rgba(0,0,0,.1)', background: active ? ACCENT : '#fff' }}
                  onClick={() => setFilter(k)}
                >
                  <span className={styles.qfLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{k}</span>
                  <span className={styles.qfCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[k] || 0}</span>
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
                <option>요청자</option>
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
              <label className="globalFilterField"><span>요청자</span><select aria-label="요청자" className={styles.selectXs}>
                <option>요청자 전체</option>
                <option>admin01</option>
                <option>admin02</option>
              </select></label>
              <label className="globalFilterField"><span>승인자</span><select aria-label="승인자" className={styles.selectXs}>
                <option>승인자 전체</option>
                <option>admin02</option>
                <option>admin03</option>
              </select></label>
              <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectXs}>
                <option>거래처 전체</option>
                <option>회사 01</option>
                <option>회사 02</option>
              </select></label>
              <div className={styles.rowSpacer} />
              <button type="button" className={styles.resetBtn} onClick={() => { setFilter('승인대기'); setQ(''); }}>초기화</button>
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
            emptyText="현재 처리해야 할 승인 요청이 없습니다."
          />
        </div>

        {detail && <QuoteApprovalDetailDrawer detail={detail} onTabChange={setActiveTab} />}
      </div>
    </div>
  );
}
