import { useMemo, useState } from 'react';
import styles from '../ops/opsShared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { PointBalanceDetailDrawer } from './PointBalanceDetailDrawer';
import { PointGrantDrawer, type DeductFormData, type GrantFormData, type GrantMode } from './PointGrantDrawer';
import {
  MEMBER_BALANCES,
  QUICK_FILTERS,
  STATUS_META,
  computeIssues,
  deduct,
  fmtPoint,
  grant,
  matchesQuickFilter,
  type MemberPointBalance,
  type MemberStatus,
  type QuickFilter,
} from './pointsData';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '1fr 90px 110px 110px 100px 100px 100px 60px';
const GRID_COLUMNS: GridColumn[] = [
  { label: '회원' },
  { label: '회원 상태' },
  { label: '총 보유', align: 'right' },
  { label: '사용 가능', align: 'right' },
  { label: '지급 예정', align: 'right' },
  { label: '소멸 예정', align: 'right' },
  { label: '최근 변동' },
  { label: '관리' },
];

export function PointsBalancePage() {
  const [balances, setBalances] = useState<MemberPointBalance[]>(MEMBER_BALANCES);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | ''>('');
  const [drawerMember, setDrawerMember] = useState<string | null>(null);
  const [grantTarget, setGrantTarget] = useState<{ member: string; mode: GrantMode } | null>(null);
  const [toast, setToast] = useState('');

  const issuesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    balances.forEach((b) => { map[b.member] = computeIssues(b); });
    return map;
  }, [balances]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    QUICK_FILTERS.forEach((f) => { c[f] = balances.filter((b) => matchesQuickFilter(b, f)).length; });
    return c;
  }, [balances]);

  const filtered = useMemo(
    () =>
      balances.filter((b) => {
        if (!matchesQuickFilter(b, quickFilter)) return false;
        if (search && !b.member.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter && b.memberStatus !== statusFilter) return false;
        return true;
      }),
    [balances, quickFilter, search, statusFilter],
  );

  const toastBriefly = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };
  const resetFilters = () => {
    setKeyword('');
    setSearch('');
    setStatusFilter('');
  };

  function openDetail(member: string) {
    setDrawerMember(member);
    setGrantTarget(null);
  }

  const selected = drawerMember ? balances.find((b) => b.member === drawerMember) ?? null : null;
  const grantSubject = grantTarget ? balances.find((b) => b.member === grantTarget.member) ?? null : null;

  function addMemo(member: string, text: string) {
    setBalances((prev) => prev.map((b) => (b.member === member ? { ...b, memos: [...b.memos, { id: `M-${Date.now()}`, at: '2026-08-26 15:00', by: 'admin01', text }] } : b)));
  }

  function submitGrant(form: GrantFormData) {
    if (!grantTarget) return;
    setBalances((prev) => prev.map((b) => (b.member === grantTarget.member ? grant(b, form.amount, form.reason, form.detail, form.immediate, form.confirmAt) : b)));
    toastBriefly(`${grantTarget.member}에게 ${fmtPoint(form.amount)}를 지급했습니다.`);
    openDetail(grantTarget.member);
  }

  function submitDeduct(form: DeductFormData) {
    if (!grantTarget) return;
    setBalances((prev) => prev.map((b) => (b.member === grantTarget.member ? deduct(b, form.amount, form.reason, form.detail) : b)));
    toastBriefly(`${grantTarget.member}의 포인트 ${fmtPoint(form.amount)}를 차감했습니다.`);
    openDetail(grantTarget.member);
  }

  const rows: GridRow[] = filtered.map((b) => {
    const sm = STATUS_META[b.memberStatus];
    const issueList = issuesMap[b.member] ?? [];
    const cells: Cell[] = [
      { kind: 'titleWarn', title: b.member, hasIssue: issueList.length > 0, issueTitle: issueList.join(' · ') },
      { kind: 'badge', text: b.memberStatus, bg: sm.bg, fg: sm.fg },
      { kind: 'text', text: fmtPoint(b.totalHeld), color: b.totalHeld < 0 ? '#dc2626' : '#18181b', size: '12.5px', weight: 700, align: 'right', numeric: true },
      { kind: 'text', text: fmtPoint(b.available), color: b.available < 0 ? '#dc2626' : '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
      { kind: 'text', text: b.pending > 0 ? fmtPoint(b.pending) : '-', color: '#71717a', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: b.expiringSoon30 > 0 ? fmtPoint(b.expiringSoon30) : '-', color: b.expiringSoon30 > 0 ? '#c2410c' : '#71717a', size: '12px', weight: 500, align: 'right', numeric: true },
      { kind: 'text', text: b.lastActivityAt.slice(5).replace('-', '.'), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: b.member, cells, onClick: () => openDetail(b.member) };
  });

  return (
    <div className={styles.page}>
      <div className={styles.headTop}>
        <div className={styles.headRow}>
          <div>
            <div className={styles.title}>보유 현황</div>
            <div className={styles.subtitle}>회원별 포인트/적립금 보유 및 사용 가능 잔액을 조회합니다.</div>
          </div>
        </div>

        <div className={styles.quickFilters}>
          {QUICK_FILTERS.map((f) => (
            <button key={f} type="button" className={styles.qfBtn} style={{ borderColor: quickFilter === f ? 'var(--accent)' : 'rgba(0,0,0,.1)', background: quickFilter === f ? 'var(--accent)' : '#fff' }} onClick={() => setQuickFilter(f)}>
              <span className={styles.qfLabel} style={{ color: quickFilter === f ? '#fff' : '#3f3f46' }}>{f}</span>
              <span className={styles.qfCount} style={{ color: quickFilter === f ? '#fff' : '#3f3f46' }}>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className={styles.filterBox}>
          <form className={styles.filterRow1} onSubmit={(e) => { e.preventDefault(); setSearch(keyword.trim()); }}>
            <input className={styles.searchInput} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="회원번호 또는 회원명 검색" />
            <button type="submit" className={styles.searchBtn}>검색</button>
          </form>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>회원 상태</span><select aria-label="회원 상태" className={styles.selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MemberStatus | '')}>
              <option value="">회원 상태 전체</option>
              <option value="정상">정상</option>
              <option value="휴면">휴면</option>
              <option value="탈퇴">탈퇴</option>
            </select></label>
            <span className={styles.rowSpacer} />
            <button type="button" className={styles.resetBtn} onClick={resetFilters}>초기화</button>
          </div>
        </div>

        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>총 {filtered.length}명</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download onClick={() => toastBriefly('데이터 다운로드를 준비했습니다.')} />
          </div>
        </div>
      </div>

      <div className={styles.gridWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth="960px"
          empty={rows.length === 0}
          emptyText={balances.length === 0 ? '포인트/적립금 보유 정보가 없습니다.' : quickFilter === '확인 필요' ? '현재 확인이 필요한 포인트 보유 정보가 없습니다.' : '검색 조건에 해당하는 회원이 없습니다.'}
          emptySubtext={balances.length > 0 ? '검색어나 필터 조건을 변경해 주세요.' : undefined}
          emptyActionLabel={balances.length > 0 ? '필터 초기화' : undefined}
          emptyActionClick={balances.length > 0 ? resetFilters : undefined}
        />
      </div>

      {selected && (
        <PointBalanceDetailDrawer
          key={selected.member}
          balance={selected}
          onClose={() => setDrawerMember(null)}
          onGrant={() => setGrantTarget({ member: selected.member, mode: 'grant' })}
          onDeduct={() => setGrantTarget({ member: selected.member, mode: 'deduct' })}
          onAddMemo={(text) => addMemo(selected.member, text)}
        />
      )}

      {grantSubject && grantTarget && (
        <PointGrantDrawer
          key={`${grantTarget.member}-${grantTarget.mode}`}
          mode={grantTarget.mode}
          balance={grantSubject}
          onCancel={() => setGrantTarget(null)}
          onSubmitGrant={submitGrant}
          onSubmitDeduct={submitDeduct}
        />
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 9, fontSize: 12.5, zIndex: 40 }}>{toast}</div>}
    </div>
  );
}
