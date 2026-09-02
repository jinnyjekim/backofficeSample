import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from './shared.module.css';
import styles from './PaymentAuditPage.module.css';
import { PaymentAuditDetailDrawer } from './PaymentAuditDetailDrawer';
import {
  PAYMENT_AUDIT_LOGS,
  QUICK_FILTERS,
  actorColor,
  actorLabel,
  categoryColor,
  matchesQuickFilter,
  resultColor,
  splitAt,
  type ActorType,
  type AuditCategory,
  type AuditResult,
  type AuditSource,
  type QuickFilter,
} from './paymentAuditData';
import { CommonButton, ExcelDownloadButton } from '../../components/common';

const COLUMNS = [
  { label: '처리일시' },
  { label: '결제번호' },
  { label: '작업유형' },
  { label: '변경 / 처리 내용' },
  { label: '처리자' },
  { label: 'Source' },
  { label: '결과' },
  { label: '상세', align: 'right' as const },
];

const CATEGORIES: AuditCategory[] = ['상태 변경', '상태 재조회', '외부 매칭', '취소·환불', '수동 처리'];
const SOURCES: AuditSource[] = ['Backoffice', 'PG API', 'PG Webhook'];
const RESULTS: AuditResult[] = ['성공', '실패', '변경 없음'];

export function PaymentAuditPage() {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | ''>('');
  const [actorTypeFilter, setActorTypeFilter] = useState<ActorType | ''>('');
  const [resultFilter, setResultFilter] = useState<AuditResult | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<AuditSource | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      PAYMENT_AUDIT_LOGS.filter((log) => {
        if (!matchesQuickFilter(log, quickFilter)) return false;
        if (search) {
          const haystack = `${log.paymentId} ${log.orderId ?? ''} ${log.externalTxId ?? ''} ${log.actor} ${log.id}`.toLowerCase();
          if (!haystack.includes(search.toLowerCase())) return false;
        }
        if (categoryFilter && log.category !== categoryFilter) return false;
        if (actorTypeFilter && log.actorType !== actorTypeFilter) return false;
        if (resultFilter && log.result !== resultFilter) return false;
        if (sourceFilter && log.source !== sourceFilter) return false;
        if (dateFrom && log.at.slice(0, 10) < dateFrom) return false;
        if (dateTo && log.at.slice(0, 10) > dateTo) return false;
        return true;
      }),
    [quickFilter, search, categoryFilter, actorTypeFilter, resultFilter, sourceFilter, dateFrom, dateTo],
  );

  const reset = () => {
    setKeyword('');
    setSearch('');
    setCategoryFilter('');
    setActorTypeFilter('');
    setResultFilter('');
    setSourceFilter('');
    setDateFrom('');
    setDateTo('');
    setSelected([]);
  };

  const rows: GridRow[] = filtered.map((log) => {
    const [date, time] = splitAt(log.at);
    const cc = categoryColor(log.category);
    const ac = actorColor(log.actorType);
    const rc = resultColor(log.result);
    return {
      id: log.id,
      selected: selected.includes(log.id),
      onToggleSelect: () => setSelected((current) => (current.includes(log.id) ? current.filter((id) => id !== log.id) : [...current, log.id])),
      onClick: () => setSelectedLogId(log.id),
      cells: [
        { kind: 'stack', title: date, subtitle: time },
        { kind: 'stack', title: log.paymentId, subtitle: log.orderId ?? (log.externalTxId ?? '') },
        { kind: 'badge', text: log.category, bg: cc.bg, fg: cc.fg },
        { kind: 'titleWarn', title: log.before && log.after ? `${log.before} → ${log.after}` : log.action, hasIssue: log.important, issueTitle: '중요 변경 항목입니다' },
        { kind: 'pillText', text: log.actor, sub: actorLabel(log.actorType), bg: ac.bg, fg: ac.fg },
        { kind: 'text', text: log.source, size: '11.5px', color: '#8b8b93' },
        { kind: 'statusDot', text: log.result, dot: rc.dot, fg: rc.fg },
        {
          kind: 'rowMenu',
          align: 'right',
          detailLabel: '상세',
          onDetail: () => setSelectedLogId(log.id),
          open: openMenu === log.id,
          onToggle: () => setOpenMenu(openMenu === log.id ? null : log.id),
          items: [
            { label: '상세 보기', click: () => setSelectedLogId(log.id) },
            ...(log.paymentId !== '-' ? [{ label: '결제 보기', click: () => window.location.assign('/payment-mgmt/list') }] : []),
            ...(log.externalTxId ? [{ label: '외부 거래 보기', click: () => window.location.assign('/payment-mgmt/external') }] : []),
          ],
        },
      ],
    };
  });

  return (
    <div className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <header className={shared.header}>
        <div className={shared.headerTop}>
          <div>
            <div className={shared.title}>결제 처리 이력</div>
            <div className={shared.subtitle}>결제와 관련하여 발생한 관리자 및 시스템 처리 내역을 조회합니다.</div>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((filter) => {
            const active = quickFilter === filter;
            return (
              <CommonButton
                key={filter}
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${shared.quickFilterBtn} ${active ? shared.active : ''}`}
                onClick={() => { setQuickFilter(filter); setSelected([]); }}
              >
                <span className={shared.quickFilterLabel}>{filter}</span>
                <span className={shared.quickFilterCount}>{PAYMENT_AUDIT_LOGS.filter((log) => matchesQuickFilter(log, filter)).length}</span>
              </CommonButton>
            );
          })}
        </div>

        <div className={shared.filterCard}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <input
              className={shared.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="결제번호, 주문번호, 외부거래번호, 처리자 검색"
            />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>작업유형</span><select aria-label="작업유형" className={shared.selectSm} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as AuditCategory | '')}>
              <option value="">전체 작업유형</option>
              {CATEGORIES.map((value) => <option key={value}>{value}</option>)}
            </select></label>
            <label className="globalFilterField"><span>처리주체</span><select aria-label="처리주체" className={shared.selectSm} value={actorTypeFilter} onChange={(e) => setActorTypeFilter(e.target.value as ActorType | '')}>
              <option value="">전체 처리주체</option>
              <option value="ADMIN">관리자</option>
              <option value="SYSTEM">자동</option>
            </select></label>
            <label className="globalFilterField"><span>결과</span><select aria-label="결과" className={shared.selectSm} value={resultFilter} onChange={(e) => setResultFilter(e.target.value as AuditResult | '')}>
              <option value="">전체 결과</option>
              {RESULTS.map((value) => <option key={value}>{value}</option>)}
            </select></label>
            <button type="button" className={shared.dashedBtn} onClick={() => setShowAdvanced((current) => !current)}>
              {showAdvanced ? '상세 필터 −' : '상세 필터 +'}
            </button>
            <span className={shared.spacer} />
            <button type="button" className={shared.clearBtn} onClick={reset}>필터 초기화</button>
          </div>
          {showAdvanced && (
            <div className={styles.advancedFilters}>
              <label className="globalFilterField"><span>원천 시스템</span><select aria-label="원천 시스템" className={shared.selectSm} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as AuditSource | '')}>
                <option value="">전체 Source</option>
                {SOURCES.map((value) => <option key={value}>{value}</option>)}
              </select></label>
              <label>처리일 <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
              <label>~ <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className={shared.bulkBar}>
            <span className={shared.bulkLabel}>{selected.length}건 선택</span>
            <ExcelDownloadButton data-grid-download />
          </div>
        )}

        <div className={shared.resultBar}>
          <span className={shared.resultLabel}>총 {filtered.length.toLocaleString()}건</span>
          <div className={shared.resultActions}>
            <ExcelDownloadButton data-grid-download />
          </div>
        </div>
        <p className={styles.readOnlyNotice}>결제 처리 이력은 금융 Audit 자료이며, 다운로드 자체도 처리 이력으로 기록됩니다.</p>
      </header>

      <div className={shared.tableWrap}>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="88px 88px 80px minmax(160px,1fr) 80px 84px 50px 76px"
          minWidth="810px"
          selectable
          allSelected={filtered.length > 0 && filtered.every((log) => selected.includes(log.id))}
          onToggleAll={() => setSelected(filtered.every((log) => selected.includes(log.id)) ? [] : filtered.map((log) => log.id))}
          empty={filtered.length === 0}
          emptyText={
            quickFilter === '수동 처리'
              ? '해당 조건의 관리자 수동 처리 이력이 없습니다.'
              : quickFilter === '실패'
                ? '해당 조건에 실패한 결제 처리 이력이 없습니다.'
                : search || dateFrom || dateTo
                  ? '검색 조건에 해당하는 처리 이력이 없습니다.'
                  : '등록된 결제 처리 이력이 없습니다.'
          }
          emptySubtext="검색어나 필터 조건을 변경해 주세요."
          emptyActionLabel={search || dateFrom || dateTo ? '필터 초기화' : undefined}
          emptyActionClick={search || dateFrom || dateTo ? reset : undefined}
        />
      </div>

      {selectedLogId && (() => {
        const log = PAYMENT_AUDIT_LOGS.find((item) => item.id === selectedLogId);
        return log ? <PaymentAuditDetailDrawer key={log.id} log={log} onClose={() => setSelectedLogId(null)} /> : null;
      })()}

    </div>
  );
}
