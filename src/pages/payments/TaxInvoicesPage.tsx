import { useMemo, useState } from 'react';
import styles from './shared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { ACCENT } from '../../lib/theme';
import { CALC_META, FILTER_KEYS, ISSUE_META, TAX_RECORDS, fmtWon, type FilterKey, type TaxRecord } from './taxInvoicesData';
import { buildTaxDetail } from './taxInvoiceDetail';
import { TaxInvoiceDetailDrawer } from './TaxInvoiceDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '96px 1fr 96px 88px 96px 76px 84px 100px 76px 60px';
const GRID_MIN_WIDTH = '1240px';

const GRID_COLUMNS: GridColumn[] = [
  { label: '청구번호' }, { label: '거래처' }, { label: '공급가액' }, { label: '세액' }, { label: '합계' },
  { label: '과세유형' }, { label: '계산상태' }, { label: '발행상태' }, { label: '거래일' }, { label: '관리' },
];

export function TaxInvoicesPage() {
  const [records, setRecords] = useState<TaxRecord[]>(TAX_RECORDS);
  const [filter, setFilter] = useState<FilterKey>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      전체: records.length,
      '계산 대기': records.filter((r) => r.calcStatus === '계산대기').length,
      '검토 필요': records.filter((r) => r.calcStatus === '검토필요').length,
      '계산 완료': records.filter((r) => r.calcStatus === '계산완료').length,
      '발행 대기': records.filter((r) => r.issueStatus === '발행대기').length,
      '조정 필요': records.filter((r) => r.calcStatus === '조정필요').length,
    };
    return c;
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filter === '계산 대기' && r.calcStatus !== '계산대기') return false;
      if (filter === '검토 필요' && r.calcStatus !== '검토필요') return false;
      if (filter === '계산 완료' && r.calcStatus !== '계산완료') return false;
      if (filter === '발행 대기' && r.issueStatus !== '발행대기') return false;
      if (filter === '조정 필요' && r.calcStatus !== '조정필요') return false;
      if (q && !(r.invoice.includes(q) || r.order.includes(q) || r.partner.includes(q))) return false;
      return true;
    });
  }, [records, filter, q]);

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('summary');
  }

  function updateSelected(fn: (r: TaxRecord) => TaxRecord) {
    setRecords((prev) => prev.map((r) => (r.id === selectedId ? fn(r) : r)));
  }

  const rows: GridRow[] = filtered.map((r) => {
    const cm = CALC_META[r.calcStatus];
    const im = ISSUE_META[r.issueStatus];
    const total = r.supply + r.vat;
    const cells: Cell[] = [
      { kind: 'text', text: r.invoice, color: '#18181b', size: '12.5px', weight: 600 },
      { kind: 'text', text: r.partner, color: '#18181b', size: '13px', weight: 600 },
      { kind: 'text', text: fmtWon(r.supply), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: fmtWon(r.vat), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: fmtWon(total), color: '#18181b', size: '12.5px', weight: 700, numeric: true },
      { kind: 'text', text: r.taxType, color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'badge', text: r.calcStatus, bg: cm.bg, fg: cm.fg },
      { kind: 'badge', text: r.issueStatus, bg: im.bg, fg: im.fg },
      { kind: 'text', text: r.txDate.slice(5), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: r.id, cells, onClick: () => openDetail(r.id) };
  });

  const pages: PageBtn[] = [1, 2].map((n) => ({ label: String(n), active: n === 1 }));

  const selected = selectedId ? records.find((r) => r.id === selectedId) ?? null : null;
  const detail = selected
    ? buildTaxDetail(
        selected,
        { activeTab },
        {
          onClose: () => setSelectedId(null),
          onTabChange: setActiveTab,
          onRecalc: () => {
            updateSelected((r) => ({
              ...r,
              history: [{ when: '방금', action: '세금 재계산 요청', by: 'admin01' }, ...r.history],
            }));
          },
          onConfirmCalc: () => {
            updateSelected((r) => ({
              ...r,
              calcStatus: '계산완료',
              issueStatus: r.taxType === '면세' ? '발행대상아님' : '발행대기',
              history: [{ when: '방금', action: '계산 확정', by: 'admin01' }, ...r.history],
            }));
          },
          onIssueTaxInvoice: () => {
            updateSelected((r) => ({
              ...r,
              issueStatus: '발행완료',
              history: [{ when: '방금', action: '세금계산서 발행 완료', by: 'admin01' }, ...r.history],
            }));
          },
        },
      )
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>세금 계산 / 세금계산서</div>
            <div className={styles.subtitle}>거래별 공급가액과 세액을 계산하고 증빙 발행 대상을 관리합니다.</div>
          </div>
          <button type="button" className={styles.primaryBtn}>+ 세금 계산 등록</button>
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
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm}>
              <option>전체</option>
              <option>청구번호</option>
              <option>주문번호</option>
              <option>거래처명</option>
            </select></label>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="청구번호 · 주문번호 · 거래처" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectXs}>
              <option>거래처 전체</option>
              <option>회사 01</option>
              <option>회사 02</option>
            </select></label>
            <label className="globalFilterField"><span>과세유형</span><select aria-label="과세유형" className={styles.selectXs}>
              <option>과세유형 전체</option>
              <option>과세</option>
              <option>면세</option>
              <option>영세율</option>
            </select></label>
            <label className="globalFilterField"><span>발행상태</span><select aria-label="발행상태" className={styles.selectXs}>
              <option>발행상태 전체</option>
              <option>발행대상아님</option>
              <option>발행대기</option>
              <option>발행완료</option>
            </select></label>
            <div className={styles.spacer} />
            <button type="button" className={styles.clearBtn} onClick={() => { setFilter('전체'); setQ(''); }}>초기화</button>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span className={styles.resultLabel}>총 {filtered.length}건</span>
          <div className={styles.resultActions}>
            <ExcelDownloadButton type="button" data-grid-download />
            <select className={styles.selectXs}>
              <option>20개씩 보기</option>
              <option>50개씩 보기</option>
            </select>
          </div>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <DataGrid
          columns={GRID_COLUMNS}
          rows={rows}
          gridTemplate={GRID_TEMPLATE}
          minWidth={GRID_MIN_WIDTH}
          showPagination
          pages={pages}
          empty={rows.length === 0}
          emptyText="세금 계산 대상 거래가 없습니다."
          emptySubtext="청구 또는 거래가 확정되면 세금 계산 내역이 생성됩니다."
        />
      </div>

      {detail && <TaxInvoiceDetailDrawer detail={detail} onTabChange={setActiveTab} />}
    </div>
  );
}
