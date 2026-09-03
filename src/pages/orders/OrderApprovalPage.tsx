import { useMemo, useState } from 'react';
import styles from './ordersShared.module.css';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { OrderApprovalDetailDrawer } from './OrderApprovalDetailDrawer';
import {
  APPROVALS,
  FILTER_KEYS,
  fmt,
  STATUS_META,
  type Approval,
  type FilterKey,
} from './orderApprovalData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = '70px 72px 1fr 100px 1fr 52px 64px 64px 52px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '주문번호' }, { label: '발주번호' }, { label: '거래처' }, { label: '주문금액', align: 'right' },
  { label: '승인 필요 사유' }, { label: '승인단계' }, { label: '요청자' }, { label: '승인자' }, { label: '상태' }, { label: '관리' },
];
const PAGE_LABELS = ['1', '2'];

function reasonSummary(reasons: string[]): string {
  if (!reasons.length) return '-';
  return reasons.length > 1 ? `${reasons[0]} 외 ${reasons.length - 1}건` : reasons[0];
}

export function OrderApprovalPage() {
  const [approvals, setApprovals] = useState<Approval[]>(APPROVALS);
  const [filter, setFilter] = useState<FilterKey>('승인대기');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('items');
  const [showApprovePanel, setShowApprovePanel] = useState(false);
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [page, setPage] = useState('1');

  const counts = useMemo(() => {
    return {
      승인대기: approvals.filter((a) => a.status === '대기').length,
      '내 승인대기': approvals.filter((a) => a.status === '대기' && a.mine).length,
      승인완료: approvals.filter((a) => a.status === '완료').length,
      반려: approvals.filter((a) => a.status === '반려').length,
      전체: approvals.length,
    } as Record<FilterKey, number>;
  }, [approvals]);

  const filtered = useMemo(() => {
    return approvals.filter((a) => {
      if (filter === '승인대기' && a.status !== '대기') return false;
      if (filter === '내 승인대기' && !(a.status === '대기' && a.mine)) return false;
      if (filter === '승인완료' && a.status !== '완료') return false;
      if (filter === '반려' && a.status !== '반려') return false;
      if (q && !(a.id.includes(q) || a.poNo.includes(q) || a.partner.includes(q))) return false;
      return true;
    });
  }, [approvals, filter, q]);

  const selected = selectedId ? approvals.find((a) => a.id === selectedId) ?? null : null;

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('items');
    setShowApprovePanel(false);
    setShowRejectPanel(false);
  }

  function updateApproval(id: string, updater: (a: Approval) => Approval) {
    setApprovals((prev) => prev.map((a) => (a.id === id ? updater(a) : a)));
  }

  function approve() {
    if (!selected) return;
    updateApproval(selected.id, (a) => ({
      ...a,
      status: '완료',
      history: [...a.history, { when: '방금', action: '승인', by: 'admin03' }],
    }));
    setShowApprovePanel(false);
  }

  function reject() {
    if (!selected) return;
    updateApproval(selected.id, (a) => ({
      ...a,
      status: '반려',
      history: [...a.history, { when: '방금', action: '반려', by: 'admin03' }],
    }));
    setShowRejectPanel(false);
  }

  const rows: GridRow[] = filtered.map((a) => {
    const sm = STATUS_META[a.status];
    return {
      id: a.id,
      onClick: () => openDetail(a.id),
      cells: [
        { kind: 'text', text: a.id, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
        { kind: 'text', text: a.poNo, color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'text', text: a.partner, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: fmt(a.amount), color: '#18181b', size: '12.5px', weight: 600, align: 'right', numeric: true },
        { kind: 'text', text: reasonSummary(a.reasons), color: '#d97706', size: '11.5px', weight: 500 },
        { kind: 'text', text: a.stage, color: '#52525b', size: '12px', weight: 500, numeric: true },
        { kind: 'text', text: a.requester, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'text', text: a.approver, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'badge', text: a.status, bg: sm.bg, fg: sm.fg },
        { kind: 'link', text: '검토', size: '12px' },
      ],
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
          <div className={styles.headRow}>
            <div>
              <div className={styles.title}>주문 승인</div>
              <div className={styles.subtitle}>승인 요청된 주문을 검토하고 승인 또는 반려합니다.</div>
            </div>
          </div>

          <div className={styles.quickFilters}>
            {FILTER_KEYS.map((k) => {
              const active = filter === k;
              return (
                <CommonButton
                  key={k}
                  variant={active ? 'primary-light' : 'secondary'}
                  size="md"
                  className={`${styles.qfBtn} ${active ? styles.active : ''}`}
                  onClick={() => setFilter(k)}
                >
                  <span className={styles.qfLabel}>{k}</span>
                  <span className={styles.qfCount}>{counts[k] || 0}</span>
                </CommonButton>
              );
            })}
          </div>

          <div className={styles.filterBox}>
            <div className={styles.filterRow1}>
              <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm} defaultValue="전체">
                <option>전체</option><option>주문번호</option><option>발주번호</option><option>거래처명</option><option>요청자</option>
              </select></label>
              <input
                className={styles.searchInput}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="주문번호 또는 거래처명"
              />
              <button type="button" className={styles.searchBtn}>검색</button>
            </div>
            <div className={styles.filterRow2}>
              <label className="globalFilterField"><span>요청자</span><select aria-label="요청자" className={styles.selectXs} defaultValue="요청자 전체">
                <option>요청자 전체</option><option>admin01</option><option>admin02</option>
              </select></label>
              <label className="globalFilterField"><span>승인자</span><select aria-label="승인자" className={styles.selectXs} defaultValue="승인자 전체">
                <option>승인자 전체</option><option>admin03</option><option>admin05</option>
              </select></label>
              <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectXs} defaultValue="거래처 전체">
                <option>거래처 전체</option><option>회사 01</option><option>회사 02</option>
              </select></label>
              <div className={styles.rowSpacer} />
              <button type="button" className={styles.resetBtn} onClick={() => { setFilter('승인대기'); setQ(''); }}>초기화</button>
            </div>
          </div>

          <div className={styles.resultRow}>
            <span className={styles.resultLabel}>총 {filtered.length}건</span>
            <div className={styles.resultActions}>
              <ExcelDownloadButton type="button" data-grid-download />
              <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
                <option>20개씩 보기</option><option>50개씩 보기</option>
              </select>
            </div>
          </div>
        </div>

      <div className={styles.splitRow}>
        <div className={styles.splitListCol}>
          <div className={styles.gridWrap}>
            <DataGrid
              columns={GRID_COLUMNS}
              rows={rows}
              gridTemplate={GRID_TEMPLATE}
              minWidth="1050px"
              showPagination
              pages={PAGE_LABELS.map((label) => ({ label, active: page === label, onClick: () => setPage(label) }))}
              empty={rows.length === 0}
              emptyText="현재 처리해야 할 주문 승인 요청이 없습니다"
            />
          </div>
        </div>

        <div className={styles.splitDetailCol}>
          {selected ? (
            <OrderApprovalDetailDrawer
              approval={selected}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => setSelectedId(null)}
              showApprovePanel={showApprovePanel}
              showRejectPanel={showRejectPanel}
              onToggleApprove={() => { setShowApprovePanel((v) => !v); setShowRejectPanel(false); }}
              onToggleReject={() => { setShowRejectPanel((v) => !v); setShowApprovePanel(false); }}
              onApprove={approve}
              onReject={reject}
            />
          ) : (
            <div className={styles.splitEmpty}>왼쪽 목록에서 건을 선택하면<br />승인 검토 상세가 여기에 표시됩니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
