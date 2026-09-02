import { useMemo, useState } from 'react';
import styles from './shared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { CONFIRM_META, DEPOSITS, FILTER_KEYS, MATCH_META, fmtWon, type Deposit, type DepositResult, type FilterKey } from './depositConfirmData';
import { buildDepositDetail } from './depositDetail';
import { DepositDetailDrawer } from './DepositDetailDrawer';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { CommonButton } from '../../components/common';

const GRID_TEMPLATE = '116px minmax(150px,1fr) 94px 74px 76px 76px 76px 66px 50px';
const GRID_MIN_WIDTH = '890px';

const GRID_COLUMNS: GridColumn[] = [
  { label: '입금일시' }, { label: '입금자' }, { label: '입금금액' }, { label: '예상거래처' }, { label: '매칭대상' },
  { label: '매칭상태' }, { label: '확인상태' }, { label: '담당자' }, { label: '관리' },
];

export function DepositConfirmPage() {
  const [deposits, setDeposits] = useState<Deposit[]>(DEPOSITS);
  const [filter, setFilter] = useState<FilterKey>('확인대기');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showHoldPanel, setShowHoldPanel] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      확인대기: deposits.filter((d) => d.confirmStatus === '확인대기').length,
      자동매칭: deposits.filter((d) => d.matchStatus === '자동매칭').length,
      확인필요: deposits.filter((d) => d.confirmStatus === '확인필요').length,
      미매칭: deposits.filter((d) => d.matchStatus === '미매칭').length,
      금액불일치: deposits.filter((d) => d.issue && d.issue.includes('불일치')).length,
      처리완료: deposits.filter((d) => d.confirmStatus === '확인완료').length,
    };
    return c;
  }, [deposits]);

  const filtered = useMemo(() => {
    return deposits.filter((d) => {
      if (filter === '확인대기' && d.confirmStatus !== '확인대기') return false;
      if (filter === '자동매칭' && d.matchStatus !== '자동매칭') return false;
      if (filter === '확인필요' && d.confirmStatus !== '확인필요') return false;
      if (filter === '미매칭' && d.matchStatus !== '미매칭') return false;
      if (filter === '금액불일치' && !(d.issue && d.issue.includes('불일치'))) return false;
      if (filter === '처리완료' && d.confirmStatus !== '확인완료') return false;
      if (q && !(d.depositor.includes(q) || (d.candidatePartner || '').includes(q) || d.txId.includes(q))) return false;
      return true;
    });
  }, [deposits, filter, q]);

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('info');
    setShowHoldPanel(false);
  }

  function updateSelected(fn: (d: Deposit) => Deposit) {
    setDeposits((prev) => prev.map((d) => (d.id === selectedId ? fn(d) : d)));
  }

  const rows: GridRow[] = filtered.map((d) => {
    const cm = CONFIRM_META[d.confirmStatus];
    const mm = MATCH_META[d.matchStatus];
    const cells: Cell[] = [
      { kind: 'text', text: d.depositedAt, color: '#3f3f46', size: '11.5px', weight: 500, numeric: true },
      { kind: 'text', text: d.depositor, color: '#18181b', size: '13px', weight: 600 },
      { kind: 'text', text: fmtWon(d.amount), color: '#18181b', size: '12.5px', weight: 700, numeric: true },
      { kind: 'text', text: d.candidatePartner || '미확인', color: d.candidatePartner ? '#3f3f46' : '#dc2626', size: '12px', weight: 500 },
      { kind: 'text', text: d.candidateInvoice || '-', color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'badge', text: d.matchStatus, bg: mm.bg, fg: mm.fg },
      { kind: 'badge', text: d.confirmStatus, bg: cm.bg, fg: cm.fg },
      { kind: 'text', text: d.owner, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'link', text: '확인', size: '12px' },
    ];
    return { id: d.id, cells, onClick: () => openDetail(d.id) };
  });

  const pages: PageBtn[] = [1, 2].map((n) => ({ label: String(n), active: n === 1 }));

  const selected = selectedId ? deposits.find((d) => d.id === selectedId) ?? null : null;
  const detail = selected
    ? buildDepositDetail(
        selected,
        { activeTab, showHoldPanel },
        {
          onClose: () => setSelectedId(null),
          onTabChange: setActiveTab,
          onConfirmDeposit: () => {
            updateSelected((d) => {
              const nextMatch = d.matchStatus === '자동매칭' ? '매칭완료' : d.matchStatus;
              const result: DepositResult = { payment: 'PAY-' + d.id.slice(4), invoice: d.candidateInvoice || '-', collection: 'COL-' + d.id.slice(4) };
              return {
                ...d,
                confirmStatus: '확인완료',
                matchStatus: nextMatch,
                result,
                history: [...d.history, { when: '방금', action: '입금 확인 완료', by: 'admin01' }],
              };
            });
          },
          onResume: () => {
            updateSelected((d) => ({
              ...d,
              confirmStatus: '확인대기',
              history: [...d.history, { when: '방금', action: '확인 재개', by: 'admin01' }],
            }));
          },
          onToggleHoldPanel: () => setShowHoldPanel((v) => !v),
          onConfirmHold: () => {
            updateSelected((d) => ({
              ...d,
              confirmStatus: '보류',
              history: [...d.history, { when: '방금', action: '확인 보류', by: 'admin01' }],
            }));
            setShowHoldPanel(false);
          },
        },
      )
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>입금 확인</div>
            <div className={styles.subtitle}>입금된 거래 내역을 확인하고 거래처 및 청구 건에 매칭합니다.</div>
          </div>
          <button type="button" className={styles.primaryBtn}>+ 입금 내역 등록</button>
        </div>

        <div className={styles.quickFilters}>
          {FILTER_KEYS.map((k) => {
            const active = filter === k;
            return (
              <CommonButton
                key={k}
                variant={active ? 'primary-light' : 'secondary'}
                size="md"
                className={`${styles.quickFilterBtn} ${active ? styles.active : ''}`}
                onClick={() => setFilter(k)}
              >
                <span className={styles.quickFilterLabel}>{k}</span>
                <span className={styles.quickFilterCount}>{counts[k] || 0}</span>
              </CommonButton>
            );
          })}
        </div>

        <div className={styles.filterCard}>
          <div className={styles.filterRow1}>
            <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={styles.selectSm}>
              <option>전체</option>
              <option>입금자명</option>
              <option>거래처명</option>
              <option>거래번호</option>
            </select></label>
            <input className={styles.searchInput} value={q} onChange={(e) => setQ(e.target.value)} placeholder="입금자 · 거래처 · 거래번호" />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>매칭상태</span><select aria-label="매칭상태" className={styles.selectXs}>
              <option>매칭상태 전체</option>
              <option>자동매칭</option>
              <option>수동매칭</option>
              <option>일부매칭</option>
              <option>미매칭</option>
            </select></label>
            <label className="globalFilterField"><span>입금계좌</span><select aria-label="입금계좌" className={styles.selectXs}>
              <option>입금계좌 전체</option>
              <option>은행01 · 운영계좌</option>
              <option>은행02 · B2B수금계좌</option>
            </select></label>
            <div className={styles.spacer} />
            <button type="button" className={styles.clearBtn} onClick={() => { setFilter('확인대기'); setQ(''); }}>초기화</button>
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
          emptyText="현재 확인 대기 중인 입금이 없습니다."
        />
      </div>

      {detail && <DepositDetailDrawer detail={detail} onTabChange={setActiveTab} />}
    </div>
  );
}
