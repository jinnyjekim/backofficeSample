import { useMemo, useState } from 'react';
import styles from './shared.module.css';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow, PageBtn } from '../../components/DataGrid/types';
import { FILTER_KEYS, MATCH_META, PAYMENTS, STATUS_META, fmtWon, type FilterKey, type Payment } from './paymentsData';
import { buildPaymentDetail } from './paymentDetail';
import { PaymentDetailDrawer } from './PaymentDetailDrawer';
import { PaymentRegisterDrawer, type PaymentRegisterValues } from './PaymentRegisterDrawer';
import { showToast, CommonButton } from '../../components/common';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';

const GRID_TEMPLATE = '86px minmax(150px,1fr) 70px 94px 68px 50px 76px 76px 66px 60px';
const GRID_MIN_WIDTH = '860px';

const GRID_COLUMNS: GridColumn[] = [
  { label: '결제번호' },
  { label: '거래처' },
  { label: '연결건' },
  { label: '결제금액', align: 'right' },
  { label: '결제수단' },
  { label: '결제일' },
  { label: '상태' },
  { label: '매칭' },
  { label: '담당자' },
  { label: '관리' },
];

function nextPaymentId(payments: Payment[]) {
  const max = payments.reduce((current, payment) => Math.max(current, Number(payment.id.replace(/\D/g, '')) || 0), 0);
  return `PAY-${String(max + 1).padStart(5, '0')}`;
}

function nowText() {
  return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const [filter, setFilter] = useState<FilterKey>('전체');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showAllocatePanel, setShowAllocatePanel] = useState(false);
  const [showCancelPanel, setShowCancelPanel] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      전체: payments.length,
      결제완료: payments.filter((p) => p.status === '완료').length,
      확인대기: payments.filter((p) => p.status === '확인대기').length,
      부분결제: payments.filter((p) => p.status === '부분결제').length,
      실패: payments.filter((p) => p.status === '실패').length,
      취소: payments.filter((p) => p.status === '취소').length,
      미매칭: payments.filter((p) => p.match === '미매칭').length,
    };
    return c;
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filter === '미매칭') {
        if (p.match !== '미매칭') return false;
      } else if (filter === '결제완료') {
        if (p.status !== '완료') return false;
      } else if (filter !== '전체' && p.status !== filter) {
        return false;
      }
      if (q && !(p.id.includes(q) || p.partner.includes(q))) return false;
      return true;
    });
  }, [payments, filter, q]);

  function openDetail(id: string) {
    setSelectedId(id);
    setActiveTab('info');
    setShowAllocatePanel(false);
    setShowCancelPanel(false);
  }

  function updateSelected(fn: (p: Payment) => Payment) {
    setPayments((prev) => prev.map((p) => (p.id === selectedId ? fn(p) : p)));
  }

  function registerPayment(values: PaymentRegisterValues) {
    const id = nextPaymentId(payments);
    const registeredAt = nowText();
    const paidAt = values.paidAt.replace('T', ' ');
    const payment: Payment = {
      id,
      partner: values.partner,
      method: values.method,
      amount: values.amount,
      paidAt,
      confirmedAt: values.status === '완료' ? registeredAt : null,
      confirmedBy: values.status === '완료' ? values.owner : null,
      status: values.status,
      match: values.match,
      depositor: values.depositor,
      bank: values.bank,
      txId: values.txId || `MAN-${id.slice(4)}`,
      owner: values.owner,
      allocations: values.invoiceId && values.match !== '미매칭' ? [{ invoice: values.invoiceId, invoiceAmount: '-', allocated: fmtWon(values.amount) }] : [],
      links: [{ label: '주문', value: values.orderId || '-' }, { label: '발주', value: '-' }, { label: '계약', value: '-' }, { label: '청구', value: values.invoiceId || '-' }],
      docs: [],
      memos: values.memo ? [{ when: registeredAt.slice(0, 10), admin: values.owner, text: values.memo }] : [],
      history: [{ when: registeredAt, action: '관리자 수동 결제 등록', by: values.owner }],
      issue: values.match === '미매칭' ? '미매칭 · 연결할 주문 또는 청구 확인 필요' : values.match === '일부매칭' ? '일부 매칭 · 잔여 배분 확인 필요' : null,
    };
    setPayments((current) => [payment, ...current]);
    setFilter('전체');
    setQ('');
    setShowRegister(false);
    setSelectedId(id);
    setActiveTab('info');
    showToast({ message: `${id} 결제를 등록했습니다.`, description: `${values.partner} · ${fmtWon(values.amount)}`, type: 'success' });
  }

  const rows: GridRow[] = filtered.map((p) => {
    const sm = STATUS_META[p.status];
    const mm = MATCH_META[p.match];
    const linkedOrder = p.links.find((l) => l.label === '주문');
    const cells: Cell[] = [
      { kind: 'text', text: p.id, color: '#18181b', size: '12.5px', weight: 600, numeric: true },
      { kind: 'text', text: p.partner, color: '#18181b', size: '13px', weight: 600 },
      { kind: 'text', text: linkedOrder && linkedOrder.value !== '-' ? linkedOrder.value : '미지정', color: '#3f3f46', size: '12px', weight: 500 },
      { kind: 'text', text: fmtWon(p.amount), color: '#18181b', size: '12.5px', weight: 700, align: 'right', numeric: true },
      { kind: 'text', text: p.method, color: '#71717a', size: '11.5px', weight: 500 },
      { kind: 'text', text: p.paidAt.slice(5, 10), color: '#71717a', size: '11.5px', weight: 500, numeric: true },
      { kind: 'badge', text: p.status, bg: sm.bg, fg: sm.fg },
      { kind: 'badge', text: p.match, bg: mm.bg, fg: mm.fg },
      { kind: 'text', text: p.owner, color: '#52525b', size: '12px', weight: 500 },
      { kind: 'link', text: '상세', size: '12px' },
    ];
    return { id: p.id, cells, onClick: () => openDetail(p.id) };
  });

  const pages: PageBtn[] = [1, 2, 3].map((n) => ({ label: String(n), active: n === 1 }));

  const selected = selectedId ? payments.find((p) => p.id === selectedId) ?? null : null;
  const detail = selected
    ? buildPaymentDetail(
        selected,
        { activeTab, showAllocatePanel, showCancelPanel },
        {
          onClose: () => setSelectedId(null),
          onTabChange: setActiveTab,
          onConfirmPayment: () => {
            updateSelected((p) => ({
              ...p,
              status: '완료',
              match: p.allocations.length ? '매칭완료' : '미매칭',
              history: [...p.history, { when: '방금', action: '결제 확인 · 결제 완료', by: 'admin01' }],
            }));
          },
          onToggleAllocatePanel: () => {
            setShowAllocatePanel((v) => !v);
            setShowCancelPanel(false);
          },
          onToggleCancelPanel: () => {
            setShowCancelPanel((v) => !v);
            setShowAllocatePanel(false);
          },
          onConfirmCancel: () => {
            updateSelected((p) => ({
              ...p,
              status: '취소',
              history: [...p.history, { when: '방금', action: '결제 취소', by: 'admin01' }],
            }));
            setShowCancelPanel(false);
          },
        },
      )
    : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.title}>결제 관리</div>
            <div className={styles.subtitle}>거래처의 결제 및 입금 내역을 조회하고 주문·청구 건과 연결합니다.</div>
          </div>
          <button type="button" className={styles.primaryBtn} onClick={() => { setSelectedId(null); setShowRegister(true); }}>+ 결제 등록</button>
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
              <option>결제번호</option>
              <option>거래처명</option>
              <option>주문번호</option>
              <option>청구번호</option>
              <option>입금자명</option>
            </select></label>
            <input
              className={styles.searchInput}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="결제번호 · 거래처 · 주문번호"
            />
            <button type="button" className={styles.searchBtn}>검색</button>
          </div>
          <div className={styles.filterRow2}>
            <label className="globalFilterField"><span>거래처</span><select aria-label="거래처" className={styles.selectXs}>
              <option>거래처 전체</option>
              <option>회사 01</option>
              <option>회사 02</option>
            </select></label>
            <label className="globalFilterField"><span>결제수단</span><select aria-label="결제수단" className={styles.selectXs}>
              <option>결제수단 전체</option>
              <option>계좌이체</option>
              <option>무통장입금</option>
              <option>카드</option>
            </select></label>
            <label className="globalFilterField"><span>매칭상태</span><select aria-label="매칭상태" className={styles.selectXs}>
              <option>매칭상태 전체</option>
              <option>매칭완료</option>
              <option>일부매칭</option>
              <option>미매칭</option>
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
          emptyText="등록된 결제 내역이 없습니다."
          emptySubtext="결제가 발생하면 이곳에서 거래 내역을 확인할 수 있습니다."
        />
      </div>

      {detail && <PaymentDetailDrawer detail={detail} onTabChange={setActiveTab} />}
      {showRegister && <PaymentRegisterDrawer onClose={() => setShowRegister(false)} onSubmit={registerPayment} />}
    </div>
  );
}
