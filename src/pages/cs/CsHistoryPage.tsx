import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid/DataGrid';
import type { GridRow } from '../../components/DataGrid/types';
import shared from '../ops/opsShared.module.css';
import styles from './CsHistoryPage.module.css';
import { CsHistoryDetailDrawer } from './CsHistoryDetailDrawer';
import {
  ACTION_LABELS,
  AUDIT_ADMINS,
  AUDIT_TEAMS,
  CS_AUDIT_LOGS,
  QUICK_FILTERS,
  RESULT_TYPES,
  SOURCE_TYPES,
  TARGET_TYPES,
  actorColor,
  actorLabel,
  categoryColor,
  matchesQuickFilter,
  resultColor,
  splitAt,
  type AuditResult,
  type AuditSource,
  type AuditTargetType,
  type QuickFilterKey,
} from './csHistoryData';

const COLUMNS = [
  { label: '처리일시' },
  { label: '대상' },
  { label: '작업 유형' },
  { label: '변경 내용' },
  { label: '처리자' },
  { label: '담당팀' },
  { label: 'Source' },
  { label: '결과' },
  { label: '상세', align: 'right' as const },
];

export function CsHistoryPage() {
  const [quickFilter, setQuickFilter] = useState<QuickFilterKey>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetType, setTargetType] = useState<AuditTargetType | ''>('');
  const [actor, setActor] = useState('');
  const [result, setResult] = useState<AuditResult | ''>('');
  const [team, setTeam] = useState('');
  const [source, setSource] = useState<AuditSource | ''>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [toast, setToast] = useState('');

  const filtered = useMemo(
    () =>
      CS_AUDIT_LOGS.filter((log) => {
        if (!matchesQuickFilter(log, quickFilter)) return false;
        if (search) {
          const haystack = `${log.targetId} ${log.customerId ?? ''} ${log.customerName ?? ''} ${log.actorId} ${log.id}`.toLowerCase();
          if (!haystack.includes(search.toLowerCase())) return false;
        }
        if (actionFilter && log.actionLabel !== actionFilter) return false;
        if (targetType && log.targetType !== targetType) return false;
        if (actor && log.actorId !== actor) return false;
        if (result && log.result !== result) return false;
        if (team && log.team !== team) return false;
        if (source && log.source !== source) return false;
        if (dateFrom && log.at.slice(0, 10) < dateFrom) return false;
        if (dateTo && log.at.slice(0, 10) > dateTo) return false;
        return true;
      }).sort((a, b) => b.at.localeCompare(a.at)),
    [quickFilter, search, actionFilter, targetType, actor, result, team, source, dateFrom, dateTo],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const reset = () => {
    setKeyword('');
    setSearch('');
    setActionFilter('');
    setTargetType('');
    setActor('');
    setResult('');
    setTeam('');
    setSource('');
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
      onToggleSelect: () =>
        setSelected((current) => (current.includes(log.id) ? current.filter((id) => id !== log.id) : [...current, log.id])),
      onClick: () => setSelectedLogId(log.id),
      cells: [
        { kind: 'stack', title: date, subtitle: time },
        { kind: 'stack', title: log.targetId, subtitle: log.targetType },
        { kind: 'badge', text: log.actionLabel, bg: cc.bg, fg: cc.fg },
        { kind: 'titleWarn', title: log.summary, hasIssue: log.important, issueTitle: '중요 변경 항목입니다' },
        { kind: 'pillText', text: log.actorId, sub: actorLabel(log.actorType), bg: ac.bg, fg: ac.fg },
        { kind: 'text', text: log.team ?? '-', size: '12px', color: log.team ? '#52525b' : '#a1a1aa' },
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
            ...(log.relatedInquiryId ? [{ label: '관련 문의 보기', click: () => window.location.assign('/cs/inquiries') }] : []),
            ...(log.relatedConsultationId ? [{ label: '관련 상담 보기', click: () => window.location.assign('/cs/consultations') }] : []),
          ],
        },
      ],
    };
  });

  return (
    <section className={shared.page} onClick={() => openMenu && setOpenMenu(null)}>
      <div className={shared.headTop}>
        <div className={shared.headRow}>
          <div>
            <h1 className={shared.title}>CS 처리 이력</h1>
            <p className={shared.subtitle}>고객센터에서 발생한 관리자 및 시스템 처리 내역을 조회합니다.</p>
          </div>
        </div>

        <div className={shared.quickFilters}>
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${shared.qfBtn} ${quickFilter === filter ? styles.quickActive : ''}`}
              onClick={() => {
                setQuickFilter(filter);
                setSelected([]);
              }}
            >
              <span className={shared.qfLabel}>{filter}</span>
              <span className={shared.qfCount}>{CS_AUDIT_LOGS.filter((log) => matchesQuickFilter(log, filter)).length}</span>
            </button>
          ))}
        </div>

        <div className={shared.filterBox}>
          <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
            <input
              className={shared.searchInput}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="문의/상담번호, 회원 ID, 관리자 ID, 이력번호 검색"
            />
            <button type="submit" className={shared.searchBtn}>검색</button>
          </form>
          <div className={shared.filterRow2}>
            <label className="globalFilterField"><span>대상 유형</span><select aria-label="대상 유형" className={shared.selectSm} value={targetType} onChange={(e) => setTargetType(e.target.value as AuditTargetType | '')}>
              <option value="">전체 대상 유형</option>
              {TARGET_TYPES.map((value) => <option key={value}>{value}</option>)}
            </select></label>
            <label className="globalFilterField"><span>작업 유형</span><select aria-label="작업 유형" className={shared.selectSm} value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
              <option value="">전체 작업 유형</option>
              {ACTION_LABELS.map((value) => <option key={value}>{value}</option>)}
            </select></label>
            <label className="globalFilterField"><span>처리자</span><select aria-label="처리자" className={shared.selectSm} value={actor} onChange={(e) => setActor(e.target.value)}>
              <option value="">전체 처리자</option>
              {AUDIT_ADMINS.map((value) => <option key={value}>{value}</option>)}
              <option value="SYSTEM">SYSTEM</option>
            </select></label>
            <label className="globalFilterField"><span>결과</span><select aria-label="결과" className={shared.selectSm} value={result} onChange={(e) => setResult(e.target.value as AuditResult | '')}>
              <option value="">전체 결과</option>
              {RESULT_TYPES.map((value) => <option key={value}>{value}</option>)}
            </select></label>
            <button type="button" className={shared.detailFilterBtn} onClick={() => setShowAdvanced((current) => !current)}>
              {showAdvanced ? '상세 필터 −' : '상세 필터 +'}
            </button>
            <span className={shared.rowSpacer} />
            <button type="button" className={shared.resetBtn} onClick={reset}>필터 초기화</button>
          </div>
          {showAdvanced && (
            <div className={styles.advancedFilters}>
              <label className="globalFilterField"><span>담당팀</span><select aria-label="담당팀" className={shared.selectSm} value={team} onChange={(e) => setTeam(e.target.value)}>
                <option value="">전체 담당팀</option>
                {AUDIT_TEAMS.map((value) => <option key={value}>{value}</option>)}
              </select></label>
              <label className="globalFilterField"><span>유입 경로</span><select aria-label="유입 경로" className={shared.selectSm} value={source} onChange={(e) => setSource(e.target.value as AuditSource | '')}>
                <option value="">전체 Source</option>
                {SOURCE_TYPES.map((value) => <option key={value}>{value}</option>)}
              </select></label>
              <label>처리일 <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
              <label>~ <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
            </div>
          )}
        </div>
      </div>

      {selected.length > 0 && (
        <div className={shared.bulkBar}>
          <span className={shared.bulkLabel}>{selected.length}건 선택</span>
          <button type="button" className={shared.bulkBtn} onClick={() => setDownloadOpen(true)}>다운로드</button>
        </div>
      )}

      <div className={shared.gridWrap}>
        <div className={shared.resultRow}>
          <span className={shared.resultLabel}>총 {filtered.length.toLocaleString()}건</span>
          <div className={shared.resultActions}>
            <button type="button" className={shared.downloadBtn} onClick={() => setDownloadOpen(true)}>다운로드</button>
          </div>
        </div>
        <DataGrid
          columns={COLUMNS}
          rows={rows}
          gridTemplate="88px 110px 132px 1fr 80px 68px 96px 72px 84px"
          minWidth="1150px"
          selectable
          allSelected={filtered.length > 0 && filtered.every((log) => selected.includes(log.id))}
          onToggleAll={() => setSelected(filtered.every((log) => selected.includes(log.id)) ? [] : filtered.map((log) => log.id))}
          empty={filtered.length === 0}
          emptyText={
            quickFilter === '내 작업'
              ? '해당 기간에 처리한 CS 작업 이력이 없습니다.'
              : search || dateFrom || dateTo
                ? '검색 조건에 해당하는 처리 이력이 없습니다.'
                : '등록된 CS 처리 이력이 없습니다.'
          }
          emptySubtext={
            search || dateFrom || dateTo
              ? '검색어나 기간, 필터 조건을 변경해 주세요.'
              : '고객 문의 처리 과정에서 발생한 관리자 및 시스템 작업이 이곳에 기록됩니다.'
          }
          emptyActionLabel={search || dateFrom || dateTo ? '필터 초기화' : undefined}
          emptyActionClick={search || dateFrom || dateTo ? reset : undefined}
          showPagination
          pages={[{ label: '‹' }, { label: '1', active: true }, { label: '›' }]}
          rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'}
        />
      </div>

      {selectedLogId &&
        (() => {
          const log = CS_AUDIT_LOGS.find((item) => item.id === selectedLogId);
          return log ? (
            <CsHistoryDetailDrawer key={log.id} log={log} all={CS_AUDIT_LOGS} onClose={() => setSelectedLogId(null)} onJump={setSelectedLogId} />
          ) : null;
        })()}

      {downloadOpen && (
        <div className={shared.dialogOverlay} onMouseDown={(e) => { if (e.target === e.currentTarget) setDownloadOpen(false); }}>
          <div className={shared.dialogBox}>
            <h2 className={shared.dialogTitle}>CS 처리 이력 다운로드</h2>
            <p className={shared.dialogBody}>
              {selected.length > 0 ? `선택한 ${selected.length}건을 다운로드합니다.` : `현재 검색 결과 ${filtered.length}건을 다운로드합니다.`}
            </p>
            <div className={shared.dialogSummary}>
              <div className={shared.dialogSummaryRow}>
                <span>포함 항목</span>
                <strong>처리일시 · 대상 · 작업유형 · 변경내용 · 처리자 · 담당팀 · Source · 결과</strong>
              </div>
            </div>
            <p className={styles.privacyNote}>CS 처리 이력 다운로드는 별도 작업 이력으로 기록됩니다.</p>
            <div className={shared.dialogActions}>
              <button type="button" className={styles.cancelButton} onClick={() => setDownloadOpen(false)}>취소</button>
              <button
                type="button"
                className={styles.primaryButton}
                data-grid-download
                onClick={() => {
                  setDownloadOpen(false);
                  toastBriefly('CS 처리 이력을 다운로드했습니다.');
                }}
              >
                다운로드
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className={styles.toast}>{toast}</div>}
    </section>
  );
}
