import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../sales/SalesActivity.module.css';
import styles from './Proceeds.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from '../sales/SalesActivityShared';
import { downloadCsv, pages } from '../sales/salesActivityUtils';
import {
  BALANCE_STATUS_META,
  C2C_SETTLEMENTS,
  PROCEEDS_LEDGER,
  SELLER_BALANCES,
  SETTLEMENT_STATUS_META,
  WITHDRAWALS,
  WITHDRAWAL_STATUS_META,
  formatMoney,
  type C2CSettlement,
  type C2CSettlementStatus,
  type LedgerType,
  type SellerBalance,
  type Withdrawal,
  type WithdrawalStatus,
} from './proceedsData';

type BalanceQuick = '전체' | '정산 예정' | '출금 가능' | '지급 보류' | '계좌 확인';

const balanceQuickFromQuery = (value: string | null): BalanceQuick => value === 'scheduled' ? '정산 예정' : value === 'available' ? '출금 가능' : value === 'held' ? '지급 보류' : '전체';

function matchesBalanceQuick(item: SellerBalance, quick: BalanceQuick) {
  if (quick === '전체') return true;
  if (quick === '정산 예정') return item.scheduled > 0;
  if (quick === '출금 가능') return item.available > 0 && item.status === '정상';
  if (quick === '지급 보류') return item.held > 0 || item.status === '지급보류';
  return item.status === '계좌확인';
}

export function ProceedsOverviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [balances, setBalances] = useState<SellerBalance[]>(SELLER_BALANCES);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const quick = balanceQuickFromQuery(searchParams.get('balance'));
  const quicks: BalanceQuick[] = ['전체', '정산 예정', '출금 가능', '지급 보류', '계좌 확인'];
  const selected = balances.find((item) => item.sellerId === selectedId) ?? null;

  const filtered = useMemo(() => balances.filter((item) => matchesBalanceQuick(item, quick) && (!search || `${item.sellerId} ${item.sellerName} ${item.bankAccount} ${item.holdSource}`.toLowerCase().includes(search.toLowerCase()))), [balances, quick, search]);
  const totals = balances.reduce((result, item) => ({ scheduled: result.scheduled + item.scheduled, available: result.available + item.available, held: result.held + item.held, requested: result.requested + item.withdrawalRequested }), { scheduled: 0, available: 0, held: 0, requested: 0 });
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };

  const selectQuick = (value: BalanceQuick) => {
    const next = new URLSearchParams(searchParams);
    if (value === '정산 예정') next.set('balance', 'scheduled');
    else if (value === '출금 가능') next.set('balance', 'available');
    else if (value === '지급 보류') next.set('balance', 'held');
    else next.delete('balance');
    setSearchParams(next, { replace: true });
  };

  const verifyAccount = () => {
    if (!selected) return;
    setBalances((items) => items.map((item) => item.sellerId === selected.sellerId ? { ...item, status: '정상', bankAccount: '국민 **** 2088', holdSource: '-' } : item));
    notify(`${selected.sellerName}의 출금계좌를 확인했습니다.`);
  };

  const reset = () => { setKeyword(''); setSearch(''); selectQuick('전체'); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.sellerId, onClick: () => setSelectedId(item.sellerId), bg: item.status === '지급보류' ? '#fffafa' : undefined, cells: [
    { kind: 'stack', title: item.sellerName, subtitle: item.sellerId },
    { kind: 'text', text: formatMoney(item.scheduled), align: 'right', numeric: true, color: item.scheduled ? '#1d4ed8' : '#a1a1aa' },
    { kind: 'text', text: formatMoney(item.available), align: 'right', numeric: true, weight: 700, color: item.available ? '#047857' : '#a1a1aa' },
    { kind: 'text', text: formatMoney(item.held), align: 'right', numeric: true, weight: item.held ? 700 : 500, color: item.held ? '#dc2626' : '#a1a1aa' },
    { kind: 'text', text: formatMoney(item.withdrawalRequested), align: 'right', numeric: true },
    { kind: 'badge', text: item.status, ...BALANCE_STATUS_META[item.status] },
    { kind: 'stack', title: item.bankAccount, subtitle: item.lastSettlementAt },
    { kind: 'link', text: '상세' },
  ] }));

  return <section className={shared.page}>
    <PageHeading title="판매대금 현황" subtitle="판매자별 판매대금을 정산 예정·출금 가능·보류 잔액으로 구분해 조회합니다." />
    <Metrics items={[{ label: '정산 예정', value: formatMoney(totals.scheduled), note: '구매 확정 후 정산 대기', dot: '#4f7bd9' }, { label: '출금 가능', value: formatMoney(totals.available), note: '판매자 출금 가능 잔액', tone: 'up', dot: '#10b981' }, { label: '지급 보류', value: formatMoney(totals.held), note: '안전·정산 검토 원인 포함', tone: 'down', dot: '#ef4444' }, { label: '출금 요청중', value: formatMoney(totals.requested), note: '출금 처리 전 예약 금액', dot: '#f59e0b' }]} />
    <ControlArea><div className={shared.quickFilters}>{quicks.map((item) => <button type="button" key={item} className={`${shared.qfBtn} ${quick === item ? base.quickActive : ''}`} onClick={() => selectQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{balances.filter((balance) => matchesBalanceQuick(balance, item)).length}</span></button>)}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><select className={shared.selectSm}><option>통합 검색</option><option>판매자 ID</option><option>판매자명</option><option>보류 근거</option></select><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="판매자 ID / 판매자명 / 보류 근거" /><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><span>최근 정산일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20" /><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27" /><span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="명"><button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('c2c-proceeds-overview.csv', ['판매자', '정산 예정', '출금 가능', '지급 보류', '출금 요청', '상태'], filtered.map((item) => [item.sellerName, item.scheduled, item.available, item.held, item.withdrawalRequested, item.status]))}>다운로드</button></ResultBar><DataGrid columns={[{ label: '판매자' }, { label: '정산 예정', align: 'right' }, { label: '출금 가능', align: 'right' }, { label: '지급 보류', align: 'right' }, { label: '출금 요청', align: 'right' }, { label: '계정 상태' }, { label: '출금계좌 / 최근 정산' }, { label: '관리' }]} rows={rows} gridTemplate="145px 105px 105px 105px 105px 90px minmax(170px,1fr) 55px" minWidth="960px" empty={!filtered.length} emptyText="조건에 맞는 판매대금이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} /></GridArea>
    {selected && <DetailDrawer eyebrow={`판매대금 · ${selected.sellerId}`} title={selected.sellerName} status={selected.status} statusMeta={BALANCE_STATUS_META[selected.status]} subtitle={`최근 정산 ${selected.lastSettlementAt}`} onClose={() => setSelectedId(null)} actions={<>{selected.status === '계좌확인' && <button type="button" className={drawer.primaryBtn} onClick={verifyAccount}>계좌 확인 완료</button>}<span className={drawer.spacer} /><button type="button" className={drawer.actionLink} onClick={() => notify('판매대금 원장에서 해당 판매자를 조회합니다.')}>원장 조회</button></>} stats={[{ label: '정산 예정', value: formatMoney(selected.scheduled) }, { label: '출금 가능', value: formatMoney(selected.available) }, { label: '지급 보류', value: formatMoney(selected.held) }]} fields={[{ label: '출금 요청중', value: formatMoney(selected.withdrawalRequested) }, { label: '이번 달 출금', value: formatMoney(selected.withdrawnThisMonth) }, { label: '누적 판매대금', value: formatMoney(selected.lifetimeProceeds) }, { label: '출금계좌', value: selected.bankAccount }, { label: '보류 근거', value: selected.holdSource }]}><div className={drawer.sectionTitleLoose}>잔액 구성</div><div className={styles.balanceGrid}><div className={styles.balanceBox}><span>정산 예정</span><strong>{formatMoney(selected.scheduled)}</strong></div><div className={styles.balanceBox}><span>출금 가능</span><strong className={styles.moneyUp}>{formatMoney(selected.available)}</strong></div><div className={styles.balanceBox}><span>지급 보류</span><strong className={styles.moneyHold}>{formatMoney(selected.held)}</strong></div></div>{selected.holdSource !== '-' && <><div className={drawer.sectionTitleLoose}>지급 보류 출처</div><div className={styles.sourceNote}>{selected.holdSource}에서 생성된 보류입니다. 보류 해제는 원본 거래 안전 또는 정산 검토 건에서 처리합니다.</div></>}<div className={drawer.sectionTitleLoose}>최근 변동</div><div className={base.timeline}>{selected.history.map((item) => <div className={base.timelineItem} key={item.at}><strong>{item.action}</strong><p>{item.detail} · {item.actor}</p><time>{item.at}</time></div>)}</div></DetailDrawer>}
    {toast && <div className={base.toast}>{toast}</div>}
  </section>;
}

type SettlementQuick = '전체' | C2CSettlementStatus;

export function C2CSettlementManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const initialQuick: SettlementQuick = statusParam === 'held' ? '검토보류' : statusParam === 'confirmed' ? '정산확정' : '전체';
  const [settlements, setSettlements] = useState<C2CSettlement[]>(C2C_SETTLEMENTS);
  const [quick, setQuickState] = useState<SettlementQuick>(initialQuick);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const selected = settlements.find((item) => item.id === selectedId) ?? null;
  const quicks: SettlementQuick[] = ['전체', '정산대기', '검토중', '검토보류', '정산확정'];
  const filtered = useMemo(() => settlements.filter((item) => (quick === '전체' || item.status === quick) && (!search || `${item.id} ${item.sellerId} ${item.sellerName} ${item.issue}`.toLowerCase().includes(search.toLowerCase()))), [quick, search, settlements]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const setQuick = (value: SettlementQuick) => { setQuickState(value); const next = new URLSearchParams(searchParams); if (value === '검토보류') next.set('status', 'held'); else if (value === '정산확정') next.set('status', 'confirmed'); else next.delete('status'); setSearchParams(next, { replace: true }); };
  const patchSelected = (status: C2CSettlementStatus, action: string, detail: string) => { if (!selected) return; setSettlements((items) => items.map((item) => item.id === selected.id ? { ...item, status, assignee: item.assignee === '미배정' ? 'admin01' : item.assignee, confirmedAt: status === '정산확정' ? '2026-08-27 11:45' : item.confirmedAt, history: [{ at: '2026-08-27 11:45', actor: 'admin01', action, detail }, ...item.history] } : item)); notify(`${selected.id} 건을 ${action} 처리했습니다.`); };
  const reset = () => { setQuick('전체'); setKeyword(''); setSearch(''); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), bg: item.status === '검토보류' ? '#fffafa' : undefined, cells: [{ kind: 'stack', title: item.id, subtitle: item.period }, { kind: 'stack', title: item.sellerName, subtitle: item.sellerId }, { kind: 'text', text: `${item.tradeCount}건`, align: 'right', numeric: true }, { kind: 'text', text: formatMoney(item.gross), align: 'right', numeric: true }, { kind: 'text', text: formatMoney(item.cancelRefund + item.fee), align: 'right', numeric: true, color: '#dc2626' }, { kind: 'text', text: `${item.adjustment >= 0 ? '+' : ''}${formatMoney(item.adjustment)}`, align: 'right', numeric: true }, { kind: 'text', text: formatMoney(item.net), align: 'right', numeric: true, weight: 700 }, { kind: 'badge', text: item.status, ...SETTLEMENT_STATUS_META[item.status] }, { kind: 'stack', title: item.assignee, subtitle: item.holdType }, { kind: 'link', text: '검토' }] }));

  const pendingNet = settlements.filter((item) => item.status !== '정산확정').reduce((sum, item) => sum + item.net, 0);
  return <section className={shared.page}>
    <PageHeading title="C2C 정산 관리" subtitle="구매 확정 거래를 판매자별로 집계해 수수료·취소·조정을 검토하고 판매대금으로 확정합니다." />
    <Metrics items={[{ label: '정산 대기', value: `${settlements.filter((item) => item.status === '정산대기').length}건`, note: formatMoney(pendingNet), dot: '#f59e0b' }, { label: '검토중', value: `${settlements.filter((item) => item.status === '검토중').length}건`, note: '담당자 검토 진행', dot: '#4f7bd9' }, { label: '검토 보류', value: `${settlements.filter((item) => item.status === '검토보류').length}건`, note: '안전 보류와 계산 이슈 구분', tone: 'down', dot: '#ef4444' }, { label: '오늘 확정', value: formatMoney(settlements.filter((item) => item.status === '정산확정').reduce((sum, item) => sum + item.net, 0)), note: '판매대금 반영 완료', tone: 'up', dot: '#10b981' }]} />
    <ControlArea><div className={shared.quickFilters}>{quicks.map((item) => <button type="button" key={item} className={`${shared.qfBtn} ${quick === item ? base.quickActive : ''}`} onClick={() => setQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{settlements.filter((settlement) => item === '전체' || settlement.status === item).length}</span></button>)}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><select className={shared.selectSm}><option>통합 검색</option><option>정산번호</option><option>판매자</option><option>검토 이슈</option></select><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="정산번호 / 판매자 / 검토 이슈" /><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><span>정산 생성일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20" /><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27" /><span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('c2c-settlements.csv', ['정산번호', '판매자', '거래수', '거래금액', '차감', '조정', '최종금액', '상태'], filtered.map((item) => [item.id, item.sellerName, item.tradeCount, item.gross, item.cancelRefund + item.fee, item.adjustment, item.net, item.status]))}>다운로드</button></ResultBar><DataGrid columns={[{ label: '정산번호 / 기간' }, { label: '판매자' }, { label: '거래', align: 'right' }, { label: '거래금액', align: 'right' }, { label: '환불·수수료', align: 'right' }, { label: '조정', align: 'right' }, { label: '최종 정산', align: 'right' }, { label: '상태' }, { label: '담당자 / 보류 구분' }, { label: '관리' }]} rows={rows} gridTemplate="155px 125px 60px 105px 105px 90px 110px 90px 135px 55px" minWidth="1080px" empty={!filtered.length} emptyText="조건에 맞는 C2C 정산이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} /></GridArea>
    {selected && <DetailDrawer eyebrow={`C2C 정산 · ${selected.id}`} title={selected.sellerName} status={selected.status} statusMeta={SETTLEMENT_STATUS_META[selected.status]} subtitle={`${selected.period} · 거래 ${selected.tradeCount}건`} onClose={() => setSelectedId(null)} actions={<>{selected.status === '정산대기' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('검토중', '정산 검토 시작', '정산 구성 항목 확인')}>검토 시작</button>}{selected.status === '검토중' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('정산확정', '정산 확정', `판매대금 ${formatMoney(selected.net)} 반영`)}>정산 확정</button>}{selected.status === '검토중' && <button type="button" className={drawer.dangerBtn} onClick={() => patchSelected('검토보류', '정산 검토 보류', '금액 또는 거래 근거 재확인')}>검토 보류</button>}{selected.status === '검토보류' && selected.holdType === '정산 검토 보류' && <button type="button" className={drawer.actionLink} onClick={() => patchSelected('검토중', '정산 검토 재개', '보류 원인 확인 완료')}>검토 재개</button>}</>} stats={[{ label: '거래금액', value: formatMoney(selected.gross) }, { label: '차감 합계', value: formatMoney(selected.cancelRefund + selected.fee) }, { label: '최종 정산', value: formatMoney(selected.net) }]} fields={[{ label: '판매자', value: `${selected.sellerName} (${selected.sellerId})` }, { label: '담당자', value: selected.assignee }, { label: '생성일', value: selected.createdAt }, { label: '확정일', value: selected.confirmedAt }, { label: '보류 구분', value: selected.holdType }, { label: '검토 이슈', value: selected.issue || '-' }]}><div className={drawer.sectionTitleLoose}>정산금액 구성</div><div className={styles.breakdown}><div className={styles.breakdownRow}><span>거래금액</span><strong>{formatMoney(selected.gross)}</strong></div><div className={styles.breakdownRow}><span>취소·환불</span><strong className={styles.moneyDown}>− {formatMoney(selected.cancelRefund)}</strong></div><div className={styles.breakdownRow}><span>수수료</span><strong className={styles.moneyDown}>− {formatMoney(selected.fee)}</strong></div><div className={styles.breakdownRow}><span>조정</span><strong>{selected.adjustment >= 0 ? '+' : '−'} {formatMoney(Math.abs(selected.adjustment))}</strong></div><div className={`${styles.breakdownRow} ${styles.breakdownTotal}`}><span>최종 정산금액</span><strong>{formatMoney(selected.net)}</strong></div></div>{selected.holdType === '거래 안전 지급 보류' && <><div className={drawer.sectionTitleLoose}>보류 책임</div><div className={styles.sourceNote}>거래 안전에서 생성된 지급 보류입니다. 이 화면에서는 정산 반영 여부만 확인하며 보류 해제는 원본 안전 건에서 처리합니다.</div></>}<div className={drawer.sectionTitleLoose}>처리 이력</div><div className={base.timeline}>{selected.history.map((item) => <div className={base.timelineItem} key={item.at}><strong>{item.action}</strong><p>{item.detail} · {item.actor}</p><time>{item.at}</time></div>)}</div></DetailDrawer>}
    {toast && <div className={base.toast}>{toast}</div>}
  </section>;
}

type WithdrawalQuick = '전체' | WithdrawalStatus;

export function WithdrawalManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const initialQuick: WithdrawalQuick = statusParam === 'requested' ? '출금요청' : statusParam === 'completed' ? '출금완료' : '전체';
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(WITHDRAWALS);
  const [quick, setQuickState] = useState<WithdrawalQuick>(initialQuick);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const selected = withdrawals.find((item) => item.id === selectedId) ?? null;
  const quicks: WithdrawalQuick[] = ['전체', '출금요청', '검토중', '출금완료', '출금실패', '반려'];
  const filtered = useMemo(() => withdrawals.filter((item) => (quick === '전체' || item.status === quick) && (!search || `${item.id} ${item.sellerId} ${item.sellerName} ${item.bankAccount}`.toLowerCase().includes(search.toLowerCase()))), [quick, search, withdrawals]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const setQuick = (value: WithdrawalQuick) => { setQuickState(value); const next = new URLSearchParams(searchParams); if (value === '출금요청') next.set('status', 'requested'); else if (value === '출금완료') next.set('status', 'completed'); else next.delete('status'); setSearchParams(next, { replace: true }); };
  const patchSelected = (status: WithdrawalStatus, action: string, reason = '') => { if (!selected) return; setWithdrawals((items) => items.map((item) => item.id === selected.id ? { ...item, status, handler: item.handler === '미배정' ? 'admin01' : item.handler, processedAt: status === '출금완료' || status === '반려' ? '2026-08-27 12:00' : item.processedAt, reason, history: [{ at: '2026-08-27 12:00', actor: 'admin01', action, detail: reason || formatMoney(item.amount) }, ...item.history] } : item)); notify(`${selected.id} 건을 ${action} 처리했습니다.`); };
  const reset = () => { setQuick('전체'); setKeyword(''); setSearch(''); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), bg: item.status === '출금실패' ? '#fffafa' : undefined, cells: [{ kind: 'stack', title: item.id, subtitle: item.requestedAt }, { kind: 'stack', title: item.sellerName, subtitle: item.sellerId }, { kind: 'text', text: formatMoney(item.amount), align: 'right', numeric: true, weight: 700 }, { kind: 'text', text: item.bankAccount }, { kind: 'badge', text: item.status, ...WITHDRAWAL_STATUS_META[item.status] }, { kind: 'text', text: item.handler, color: item.handler === '미배정' ? '#dc2626' : '#52525b' }, { kind: 'stack', title: item.processedAt, subtitle: item.reason || '-' }, { kind: 'link', text: '처리' }] }));
  return <section className={shared.page}>
    <PageHeading title="출금 관리" subtitle="판매자의 출금 요청을 계좌·가용 잔액 기준으로 검토하고 성공·실패·반려 상태를 관리합니다." />
    <Metrics items={[{ label: '신규 요청', value: `${withdrawals.filter((item) => item.status === '출금요청').length}건`, note: '담당자 배정 필요', tone: 'down', dot: '#f59e0b' }, { label: '처리중', value: `${withdrawals.filter((item) => item.status === '검토중').length}건`, note: '계좌 및 잔액 확인', dot: '#4f7bd9' }, { label: '오늘 출금 완료', value: formatMoney(withdrawals.filter((item) => item.status === '출금완료').reduce((sum, item) => sum + item.amount, 0)), note: '은행 이체 성공', tone: 'up', dot: '#10b981' }, { label: '실패 / 반려', value: `${withdrawals.filter((item) => item.status === '출금실패' || item.status === '반려').length}건`, note: '재처리 또는 안내 필요', tone: 'down', dot: '#ef4444' }]} />
    <ControlArea><div className={shared.quickFilters}>{quicks.map((item) => <button type="button" key={item} className={`${shared.qfBtn} ${quick === item ? base.quickActive : ''}`} onClick={() => setQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{withdrawals.filter((withdrawal) => item === '전체' || withdrawal.status === item).length}</span></button>)}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><select className={shared.selectSm}><option>통합 검색</option><option>출금번호</option><option>판매자</option><option>계좌</option></select><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="출금번호 / 판매자 / 계좌" /><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><span>요청일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20" /><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27" /><span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('c2c-withdrawals.csv', ['출금번호', '판매자', '금액', '계좌', '상태', '담당자'], filtered.map((item) => [item.id, item.sellerName, item.amount, item.bankAccount, item.status, item.handler]))}>다운로드</button></ResultBar><DataGrid columns={[{ label: '출금번호 / 요청일' }, { label: '판매자' }, { label: '출금 금액', align: 'right' }, { label: '출금계좌' }, { label: '상태' }, { label: '담당자' }, { label: '처리일 / 사유' }, { label: '관리' }]} rows={rows} gridTemplate="150px 130px 110px 155px 90px 75px minmax(175px,1fr) 55px" minWidth="970px" empty={!filtered.length} emptyText="조건에 맞는 출금 요청이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} /></GridArea>
    {selected && <DetailDrawer eyebrow={`출금 요청 · ${selected.id}`} title={selected.sellerName} status={selected.status} statusMeta={WITHDRAWAL_STATUS_META[selected.status]} subtitle={`${formatMoney(selected.amount)} · ${selected.requestedAt}`} onClose={() => setSelectedId(null)} actions={<>{selected.status === '출금요청' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('검토중', '출금 검토 시작')}>검토 시작</button>}{selected.status === '검토중' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('출금완료', '출금 완료')}>출금 실행</button>}{selected.status === '출금실패' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('검토중', '출금 재처리')}>재처리</button>}{(selected.status === '출금요청' || selected.status === '검토중') && <button type="button" className={drawer.dangerBtn} onClick={() => patchSelected('반려', '출금 요청 반려', '출금 조건 미충족')}>반려</button>}</>} stats={[{ label: '출금 금액', value: formatMoney(selected.amount) }, { label: '요청일', value: selected.requestedAt.slice(0, 10) }, { label: '담당자', value: selected.handler }]} fields={[{ label: '판매자', value: `${selected.sellerName} (${selected.sellerId})` }, { label: '출금계좌', value: selected.bankAccount }, { label: '처리일', value: selected.processedAt }, { label: '처리 사유', value: selected.reason || '-' }]}><div className={drawer.sectionTitleLoose}>검증 기준</div><div className={styles.policyNote}>출금 가능 잔액, 지급 보류 여부, 예금주 일치 여부를 모두 확인한 뒤 출금을 실행합니다. 정산 예정 금액은 출금 가능 잔액에 포함하지 않습니다.</div><div className={drawer.sectionTitleLoose}>처리 이력</div><div className={base.timeline}>{selected.history.map((item) => <div className={base.timelineItem} key={item.at}><strong>{item.action}</strong><p>{item.detail} · {item.actor}</p><time>{item.at}</time></div>)}</div></DetailDrawer>}
    {toast && <div className={base.toast}>{toast}</div>}
  </section>;
}

export function ProceedsLedgerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryType = searchParams.get('type') === 'settlement' ? '정산확정' : '';
  const [type, setTypeState] = useState<LedgerType | ''>(queryType);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = PROCEEDS_LEDGER.find((item) => item.id === selectedId) ?? null;
  const types: LedgerType[] = ['정산예정', '정산확정', '출금', '지급보류', '보류해제', '조정'];
  const filtered = useMemo(() => PROCEEDS_LEDGER.filter((item) => (!type || item.type === type) && (!search || `${item.id} ${item.sellerId} ${item.sellerName} ${item.reference} ${item.note}`.toLowerCase().includes(search.toLowerCase()))), [search, type]);
  const setType = (value: LedgerType | '') => { setTypeState(value); const next = new URLSearchParams(searchParams); if (value === '정산확정') next.set('type', 'settlement'); else next.delete('type'); setSearchParams(next, { replace: true }); };
  const reset = () => { setType(''); setKeyword(''); setSearch(''); };
  const rows: GridRow[] = filtered.map((item) => ({ id: item.id, onClick: () => setSelectedId(item.id), cells: [{ kind: 'stack', title: item.occurredAt, subtitle: item.id }, { kind: 'stack', title: item.sellerName, subtitle: item.sellerId }, { kind: 'pillText', text: item.type, bg: item.type === '지급보류' ? '#fef2f2' : item.type === '정산확정' || item.type === '보류해제' ? '#ecfdf5' : '#f4f4f5', fg: item.type === '지급보류' ? '#dc2626' : item.type === '정산확정' || item.type === '보류해제' ? '#047857' : '#52525b' }, { kind: 'text', text: `${item.amount > 0 ? '+' : ''}${formatMoney(item.amount)}`, align: 'right', numeric: true, weight: 800, color: item.amount > 0 ? '#047857' : item.amount < 0 ? '#dc2626' : '#52525b' }, { kind: 'text', text: formatMoney(item.scheduledAfter), align: 'right', numeric: true }, { kind: 'text', text: formatMoney(item.availableAfter), align: 'right', numeric: true, weight: 700 }, { kind: 'text', text: formatMoney(item.heldAfter), align: 'right', numeric: true, color: item.heldAfter ? '#dc2626' : '#a1a1aa' }, { kind: 'stack', title: item.reference, subtitle: item.actor }, { kind: 'titleWarn', title: item.note }, { kind: 'link', text: '상세' }] }));
  return <section className={shared.page}>
    <PageHeading title="판매대금 원장" subtitle="정산 예정부터 확정·보류·출금까지 모든 판매대금 증감을 변경 불가능한 원장으로 조회합니다." />
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><select className={shared.selectSm}><option>통합 검색</option><option>원장 ID</option><option>판매자</option><option>연결 근거</option></select><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="원장 ID / 판매자 / 정산·출금·보류 번호" /><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><select className={shared.selectSm} value={type} onChange={(event) => setType(event.target.value as LedgerType | '')}><option value="">전체 변동 유형</option>{types.map((item) => <option key={item}>{item}</option>)}</select><span>발생일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20" /><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27" /><span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('c2c-proceeds-ledger.csv', ['발생일', '원장 ID', '판매자', '유형', '증감', '정산 예정 잔액', '출금 가능 잔액', '보류 잔액', '근거'], filtered.map((item) => [item.occurredAt, item.id, item.sellerName, item.type, item.amount, item.scheduledAfter, item.availableAfter, item.heldAfter, item.reference]))}>다운로드</button></ResultBar><DataGrid columns={[{ label: '발생일 / 원장 ID' }, { label: '판매자' }, { label: '변동 유형' }, { label: '증감', align: 'right' }, { label: '정산 예정 잔액', align: 'right' }, { label: '출금 가능 잔액', align: 'right' }, { label: '보류 잔액', align: 'right' }, { label: '연결 근거 / 처리자' }, { label: '사유' }, { label: '관리' }]} rows={rows} gridTemplate="155px 125px 90px 105px 110px 110px 100px 135px minmax(180px,1fr) 55px" minWidth="1160px" empty={!filtered.length} emptyText="조건에 맞는 판매대금 원장이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} /></GridArea>
    {selected && <DetailDrawer eyebrow={`판매대금 원장 · ${selected.id}`} title={selected.type} status="원장 기록" statusMeta={{ bg: '#f4f4f5', fg: '#52525b' }} subtitle={`${selected.sellerName} · ${selected.occurredAt}`} onClose={() => setSelectedId(null)} stats={[{ label: '증감', value: `${selected.amount > 0 ? '+' : ''}${formatMoney(selected.amount)}` }, { label: '출금 가능 잔액', value: formatMoney(selected.availableAfter) }, { label: '보류 잔액', value: formatMoney(selected.heldAfter) }]} fields={[{ label: '판매자', value: `${selected.sellerName} (${selected.sellerId})` }, { label: '정산 예정 잔액', value: formatMoney(selected.scheduledAfter) }, { label: '연결 근거', value: selected.reference }, { label: '처리자', value: selected.actor }, { label: '변동 사유', value: selected.note }]}><div className={drawer.sectionTitleLoose}>원장 원칙</div><div className={styles.policyNote}>원장 기록은 수정하거나 삭제하지 않습니다. 오입력 또는 취소가 필요한 경우 반대 방향의 조정 기록을 새로 생성해 잔액을 보정합니다.</div></DetailDrawer>}
  </section>;
}
