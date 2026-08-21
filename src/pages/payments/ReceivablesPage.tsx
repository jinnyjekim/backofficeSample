import { useMemo, useState } from 'react';
import styles from './shared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';
import { FILTER_KEYS, PARTNERS, STATUS_META, computePartner, fmtWon, type Activity, type FilterKey, type Partner, type PartnerCalc } from './receivablesData';
import { buildReceivableDetail } from './receivableDetail';
import { ReceivableDetailDrawer } from './ReceivableDetailDrawer';

const GRID_TEMPLATE = '1fr 84px 96px 96px 96px 84px 96px 84px 78px 60px';
const GRID_MIN_WIDTH = '1240px';

const PARTNER_COLUMNS: GridColumn[] = [
  { label: '거래처' }, { label: '미수 청구건' }, { label: '총 청구' }, { label: '수금' }, { label: '미수금' },
  { label: '최장연체' }, { label: '지급예정' }, { label: '상태' }, { label: '담당자' }, { label: '관리' },
];

const INVOICE_COLUMNS: GridColumn[] = [
  { label: '청구번호' }, { label: '거래처' }, { label: '청구금액' }, { label: '수금액' }, { label: '미수금' },
  { label: '연체일' }, { label: '지급예정일' }, { label: '상태' }, { label: '담당자' }, { label: '관리' },
];

export function ReceivablesPage() {
  const [partners, setPartners] = useState<Partner[]>(PARTNERS);
  const [filter, setFilter] = useState<FilterKey>('전체');
  const [q, setQ] = useState('');
  const [view, setView] = useState<'partner' | 'invoice'>('partner');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [showCollectPanel, setShowCollectPanel] = useState(false);
  const [showActivityPanel, setShowActivityPanel] = useState(false);

  const withCalc: PartnerCalc[] = useMemo(
    () => partners.map(computePartner).filter((p) => p.totalAr > 0),
    [partners],
  );

  const kpis = useMemo(() => {
    const grandTotal = withCalc.reduce((a, p) => a + p.totalAr, 0);
    const normalTotal = withCalc.reduce((a, p) => a + (p.totalAr - p.overdueAmount), 0);
    const overdueTotal = withCalc.reduce((a, p) => a + p.overdueAmount, 0);
    const over30Total = withCalc.reduce((a, p) => a + p.invoices.filter((i) => i.overdueDays > 30).reduce((b, i) => b + i.remaining, 0), 0);
    return [
      { label: '총 미수금', value: fmtWon(grandTotal), color: '#18181b' },
      { label: '정상 미수', value: fmtWon(normalTotal), color: '#059669' },
      { label: '연체 미수', value: fmtWon(overdueTotal), color: '#dc2626' },
      { label: '30일 이상 연체', value: fmtWon(over30Total), color: '#d97706' },
    ];
  }, [withCalc]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      전체: withCalc.length,
      '정상 미수': withCalc.filter((p) => p.status === '정상').length,
      연체: withCalc.filter((p) => p.status === '연체').length,
      '30일 이상': withCalc.filter((p) => p.invoices.some((i) => i.overdueDays > 30)).length,
      '60일 이상': withCalc.filter((p) => p.invoices.some((i) => i.overdueDays > 60)).length,
      '90일 이상': withCalc.filter((p) => p.invoices.some((i) => i.overdueDays > 90)).length,
      '수금 약속': withCalc.filter((p) => !!p.promise).length,
    };
    return c;
  }, [withCalc]);

  const filtered = useMemo(() => {
    return withCalc.filter((p) => {
      if (filter === '정상 미수' && p.status !== '정상') return false;
      if (filter === '연체' && p.status !== '연체') return false;
      if (filter === '30일 이상' && !p.invoices.some((i) => i.overdueDays > 30)) return false;
      if (filter === '60일 이상' && !p.invoices.some((i) => i.overdueDays > 60)) return false;
      if (filter === '90일 이상' && !p.invoices.some((i) => i.overdueDays > 90)) return false;
      if (filter === '수금 약속' && !p.promise) return false;
      if (q && !(p.name.includes(q) || p.invoices.some((i) => i.no.includes(q)))) return false;
      return true;
    });
  }, [withCalc, filter, q]);

  function openDetail(id: string, tab: string) {
    setSelectedId(id);
    setActiveTab(tab);
    setShowCollectPanel(false);
    setShowActivityPanel(false);
  }

  function updateSelected(fn: (p: Partner) => Partner) {
    setPartners((prev) => prev.map((p) => (p.id === selectedId ? fn(p) : p)));
  }

  let rows: GridRow[];
  if (view === 'partner') {
    rows = filtered.map((p) => {
      const sm = STATUS_META[p.status] ?? STATUS_META['정상'];
      const cells: Cell[] = [
        { kind: 'text', text: p.name, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: p.openCount + '건', color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: fmtWon(p.totalBilled), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'text', text: fmtWon(p.totalCollected), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'text', text: fmtWon(p.totalAr), color: '#18181b', size: '12.5px', weight: 700, numeric: true },
        { kind: 'text', text: p.maxOverdueDays > 0 ? p.maxOverdueDays + '일' : '-', color: p.maxOverdueDays > 0 ? '#dc2626' : '#a1a1aa', size: '11.5px', weight: 600, numeric: true },
        { kind: 'text', text: p.promise ? p.promise.date : '-', color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'badge', text: p.status, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: p.owner, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'link', text: '상세', size: '12px' },
      ];
      return { id: p.id, cells, onClick: () => openDetail(p.id, 'summary') };
    });
  } else {
    const invRows: { p: PartnerCalc; ivNo: string }[] = [];
    filtered.forEach((p) => p.invoices.filter((i) => i.remaining > 0).forEach((iv) => invRows.push({ p, ivNo: iv.no })));
    rows = invRows.map(({ p, ivNo }) => {
      const iv = p.invoices.find((i) => i.no === ivNo)!;
      const st = iv.overdueDays > 0 ? '연체' : '정상';
      const sm = STATUS_META[st];
      const cells: Cell[] = [
        { kind: 'text', text: iv.no, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: p.name, color: '#3f3f46', size: '12px', weight: 500 },
        { kind: 'text', text: fmtWon(iv.billed), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'text', text: fmtWon(iv.collected), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'text', text: fmtWon(iv.remaining), color: '#18181b', size: '12.5px', weight: 700, numeric: true },
        { kind: 'text', text: iv.overdueDays > 0 ? iv.overdueDays + '일' : '-', color: iv.overdueDays > 0 ? '#dc2626' : '#a1a1aa', size: '11.5px', weight: 600, numeric: true },
        { kind: 'text', text: iv.due, color: '#71717a', size: '11.5px', weight: 500, numeric: true },
        { kind: 'badge', text: st, bg: sm.bg, fg: sm.fg },
        { kind: 'text', text: p.owner, color: '#52525b', size: '12px', weight: 500 },
        { kind: 'link', text: '상세', size: '12px' },
      ];
      return { id: `${p.id}-${iv.no}`, cells, onClick: () => openDetail(p.id, 'invoices') };
    });
  }

  const pages: PageBtn[] = [1, 2].map((n) => ({ label: String(n), active: n === 1 }));

  const selected = selectedId ? withCalc.find((p) => p.id === selectedId) ?? null : null;
  const detail = selected
    ? buildReceivableDetail(
        selected,
        { activeTab, showCollectPanel, showActivityPanel },
        {
          onClose: () => setSelectedId(null),
          onTabChange: setActiveTab,
          onToggleCollectPanel: () => {
            setShowCollectPanel((v) => !v);
            setShowActivityPanel(false);
          },
          onToggleActivityPanel: () => {
            setShowActivityPanel((v) => !v);
            setShowCollectPanel(false);
          },
          onConfirmActivity: () => {
            updateSelected((p) => {
              const newActivity: Activity = { type: '전화', when: '방금', note: '활동 등록됨', by: 'admin01' };
              return { ...p, activities: [newActivity, ...p.activities] };
            });
            setShowActivityPanel(false);
          },
        },
      )
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div style={{ marginBottom: 16 }}>
          <div className={styles.title}>미수금 관리</div>
          <div className={styles.subtitle}>거래처별 미수 잔액과 연체 현황을 관리합니다.</div>
        </div>

        <div className={styles.kpiGrid}>
          {kpis.map((k) => (
            <div className={styles.kpiCard} key={k.label}>
              <div className={styles.kpiLabel}>{k.label}</div>
              <div className={styles.kpiValue} style={{ color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className={styles.quickFilters}>
          {FILTER_KEYS.map((k) => {
            const active = filter === k;
            return (
              <button
                key={k}
                type="button"
                className={styles.quickFilterBtn}
                style={{ borderColor: active ? ACCENT : 'rgba(0,0,0,.1)', background: active ? ACCENT : '#fff' }}
                onClick={() => setFilter(k)}
              >
                <span className={styles.quickFilterLabel} style={{ color: active ? '#fff' : '#3f3f46' }}>{k}</span>
                <span className={styles.quickFilterCount} style={{ color: active ? '#fff' : '#3f3f46' }}>{counts[k] || 0}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <select className={styles.selectSm}>
              <option>전체</option>
              <option>거래처명</option>
              <option>청구번호</option>
              <option>주문번호</option>
            </select>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="거래처 또는 청구번호" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <select className={styles.selectXs}>
              <option>연체기간 전체</option>
              <option>1~7일</option>
              <option>8~30일</option>
              <option>31~60일</option>
              <option>61~90일</option>
              <option>90일 초과</option>
            </select>
            <select className={styles.selectXs}>
              <option>담당자 전체</option>
              <option>admin01</option>
              <option>admin02</option>
            </select>
            <button type="button" className={styles.dashedBtn}>상세 필터 ＋</button>
            <div className={styles.spacer} />
            <button type="button" className={styles.clearBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <div className={styles.viewToggle}>
            <button type="button" className={`${styles.viewToggleBtn} ${view === 'partner' ? styles.active : ''}`} onClick={() => setView('partner')}>거래처 기준</button>
            <button type="button" className={`${styles.viewToggleBtn} ${view === 'invoice' ? styles.active : ''}`} onClick={() => setView('invoice')}>청구 기준</button>
          </div>
          <div className={styles.resultActions}>
            <button type="button" className={styles.downloadBtn}>↓ 다운로드</button>
            <select className={styles.selectXs}>
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
        <div className={styles.resultLabel} style={{ marginBottom: 9 }}>총 {rows.length}건</div>
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={view === 'partner' ? PARTNER_COLUMNS : INVOICE_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth={GRID_MIN_WIDTH}
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="현재 미수금이 없습니다."
          emptySubtext="모든 청구금액이 정상적으로 수금되었습니다."
        />
      </div>

      {detail && <ReceivableDetailDrawer detail={detail} onTabChange={setActiveTab} />}
    </div>
  );
}
