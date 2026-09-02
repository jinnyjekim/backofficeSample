import { useMemo, useState } from 'react';
import styles from './CompaniesPage.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import {
  QUICK_FILTER_LABELS,
  TRADE_FILTERS,
  TRADE_STATUS_META,
  TRADE_STATUS_RECORDS,
  type TradeStatus,
  type TradeStatusRecord,
} from './tradeStatusData';
import { TradeStatusDetailDrawer } from './TradeStatusDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = 'minmax(150px,1.1fr) 76px 84px 84px 84px 88px 66px 136px 60px';
const COLUMN_LABELS = ['회사', '현재상태', '거래시작일', '최근거래일', '최근변경', '변경사유', '담당자', '이슈', '관리'];
const SEARCH_SCOPES = ['전체', '회사명', '회사코드', '사업자등록번호'];

export function TradeStatusPage() {
  const [data, setData] = useState<TradeStatusRecord[]>(TRADE_STATUS_RECORDS);
  const [statusFilter, setStatusFilter] = useState<(typeof QUICK_FILTER_LABELS)[number]>('전체');
  const [managerFilter, setManagerFilter] = useState('담당자 전체');
  const [q, setQ] = useState('');
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const managers = useMemo(() => Array.from(new Set(data.map((r) => r.manager))), [data]);

  const counts = useMemo(() => TRADE_FILTERS.map((f) => data.filter(f.match).length), [data]);

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const f = TRADE_FILTERS.find((x) => x.key === statusFilter);
      if (f && !f.match(r)) return false;
      if (managerFilter !== '담당자 전체' && r.manager !== managerFilter) return false;
      if (q && !(r.name.includes(q) || r.code.includes(q) || r.bizNo.includes(q))) return false;
      return true;
    });
  }, [data, statusFilter, managerFilter, q]);

  const quickFilters = TRADE_FILTERS.map((f, i) => ({
    label: f.key,
    count: counts[i],
    active: statusFilter === f.key,
  }));

  const gridColumns: GridColumn[] = COLUMN_LABELS.map((label) => ({ label }));

  function issueLabel(r: TradeStatusRecord): string {
    if (r.issues.length > 0) return `⚠ ${r.issues.join(', ')}`;
    if (r.pendingChange) return `예정 · ${r.pendingChange.toStatus} ${r.pendingChange.applyDate}`;
    return '-';
  }

  const rows: GridRow[] = filtered.map((r) => {
    const sm = TRADE_STATUS_META[r.status];
    const hasIssue = r.issues.length > 0;
    return {
      id: r.code,
      onClick: () => setOpenCode(r.code),
      cells: [
        { kind: 'stack', title: r.name, subtitle: r.code },
        { kind: 'badge', text: r.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: r.tradeStartDate, color: '#52525b', size: '12px', weight: 500, numeric: true },
        { kind: 'text', text: r.lastDealDate, color: '#52525b', size: '12px', weight: 500, numeric: true },
        { kind: 'text', text: r.statusChangedAt, color: '#52525b', size: '12px', weight: 500, numeric: true },
        { kind: 'text', text: r.statusReason, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: r.manager, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'text', text: issueLabel(r), color: hasIssue ? '#d97706' : r.pendingChange ? '#4338ca' : '#a1a1aa', size: '11.5px', weight: 500 },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });

  const pages: PageBtn[] = [1, 2].map((n) => ({ label: String(n), active: n === page, onClick: () => setPage(n) }));

  function clearAll() {
    setStatusFilter('전체');
    setManagerFilter('담당자 전체');
    setQ('');
  }

  function handleChangeStatus(
    code: string,
    target: TradeStatus,
    mode: '즉시' | '예약',
    applyDate: string,
    reason: string,
    detail: string,
  ) {
    setData((prev) =>
      prev.map((r) => {
        if (r.code !== code) return r;
        if (mode === '예약') {
          return { ...r, pendingChange: { toStatus: target, applyDate, reason } };
        }
        const entry = {
          when: '방금 전',
          from: r.status,
          to: target,
          reason,
          detail: detail || undefined,
          by: '관리자',
          snapshot: { receivable: r.impact.receivable, overdue: r.impact.overdue, activeOrders: r.impact.activeOrders },
        };
        return {
          ...r,
          status: target,
          statusChangedAt: '방금 전',
          statusReason: reason,
          issues: target === '거래중' ? [] : r.issues,
          pendingChange: null,
          history: [entry, ...r.history],
        };
      }),
    );
  }

  function handleCancelPending(code: string) {
    setData((prev) =>
      prev.map((r) => (r.code === code ? { ...r, pendingChange: null } : r)),
    );
  }

  function handleAddMemo(code: string, text: string) {
    setData((prev) =>
      prev.map((r) =>
        r.code === code ? { ...r, memos: [{ when: '방금 전', by: '관리자', text }, ...r.memos] } : r,
      ),
    );
  }

  const selected = openCode ? data.find((r) => r.code === openCode) ?? null : null;

  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.head}>
          <div>
            <div className={styles.title}>거래 상태</div>
            <div className={styles.subtitle}>거래처별 현재 거래 상태를 관리하고 상태 변경 사유와 이력을 추적합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {quickFilters.map((qf) => (
            <CommonButton
              key={qf.label}
              variant={qf.active ? 'primary-light' : 'secondary'}
              size="md"
              className={`${styles.quickFilterBtn} ${qf.active ? styles.active : ''}`}
              onClick={() => setStatusFilter(qf.label)}
            >
              <span className={styles.quickFilterLabel}>{qf.label}</span>
              <span className={styles.quickFilterCount}>{qf.count}</span>
            </CommonButton>
          ))}
        </div>

        <div className={styles.filterCard}>
          <div className={styles.searchRow}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.scopeSelect} defaultValue={SEARCH_SCOPES[0]}>
              {SEARCH_SCOPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select></label>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="회사명, 회사코드 또는 사업자등록번호"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow}>
            <label className="globalFilterField"><span>담당자</span><select aria-label="담당자" className={styles.smallSelect} value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}>
              <option>담당자 전체</option>
              {managers.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select></label>
            <label className="globalFilterField"><span>회사유형</span><select aria-label="회사유형" className={styles.smallSelect} defaultValue="회사유형 전체">
              <option>회사유형 전체</option>
              <option>법인</option>
              <option>개인사업자</option>
            </select></label>
            <div className={styles.spacer} />
            <button type="button" className={styles.clearBtn} onClick={clearAll}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}개 거래처</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={styles.pageSizeSelect} defaultValue="20개씩 보기">
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
              <option>100개씩 보기</option>
            </select>
          </div>
        </div>

        <div className={styles.gridWrap}>
          <DataGrid
            columns={gridColumns}
            rows={rows}
            gridTemplate={GRID_TEMPLATE}
            minWidth="880px"
            showPagination
            pages={pages}
            empty={rows.length === 0}
            emptyText="검색 결과가 없습니다"
            emptyActionLabel="필터 초기화"
            emptyActionClick={clearAll}
          />
        </div>
      </div>

      {selected && (
        <TradeStatusDetailDrawer
          key={selected.code}
          record={selected}
          onClose={() => setOpenCode(null)}
          onChangeStatus={handleChangeStatus}
          onCancelPending={handleCancelPending}
          onAddMemo={handleAddMemo}
        />
      )}
    </div>
  );
}
