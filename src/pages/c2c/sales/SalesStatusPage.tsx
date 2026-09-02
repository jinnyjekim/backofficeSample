import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import styles from './SalesActivity.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, PageHeading, ResultBar } from './SalesActivityShared';
import { SELLERS, SELLER_STATUS_META, formatWon, type SellerStatus } from './salesActivityData';
import { pages } from './salesActivityUtils';

const STATUS_DESCRIPTIONS: Record<SellerStatus, string> = { 판매중: '상품 등록 및 거래 가능', 판매중지: '판매자가 직접 일시 중지', 판매제한: '운영 정책에 따라 판매 차단', 휴면: '90일 이상 판매 활동 없음' };

export function SalesStatusPage() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState(SELLERS);
  const [status, setStatus] = useState<SellerStatus | '전체'>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [reasonType, setReasonType] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const statuses: SellerStatus[] = ['판매중','판매중지','판매제한','휴면'];
  const filtered = useMemo(() => sellers.filter((seller) => (status === '전체' || seller.status === status) && (!reasonType || seller.statusReason.includes(reasonType)) && (!search || `${seller.id} ${seller.nickname} ${seller.name} ${seller.statusReason}`.toLowerCase().includes(search.toLowerCase()))), [reasonType, search, sellers, status]);
  const selected = sellers.find((seller) => seller.id === selectedId) ?? null;
  const riskSellers = [...sellers].sort((a,b) => (b.reportCount * 10 + b.cancelRate) - (a.reportCount * 10 + a.cancelRate)).slice(0,4);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2200); };
  const changeStatus = (next: SellerStatus, reason: string) => { if (!selected) return; setSellers((items) => items.map((seller) => seller.id === selected.id ? { ...seller, status: next, statusReason: reason, statusChangedAt: '2026-08-26 15:40' } : seller)); notify(`${selected.nickname} 상태를 ${next}(으)로 변경했습니다.`); };
  const rows: GridRow[] = filtered.map((seller) => ({ id: seller.id, onClick: () => setSelectedId(seller.id), cells: [
    { kind:'avatarText', title:seller.nickname, subtitle:`${seller.name} · ${seller.id}`, avatarChar:seller.nickname[0], avatarBg:'#f4f4f5', avatarFg:'#3f3f46' },
    { kind:'badge', text:seller.status, ...SELLER_STATUS_META[seller.status] },
    { kind:'stack', title:seller.statusReason, subtitle:`변경 ${seller.statusChangedAt}` },
    { kind:'text', text:seller.lastActiveAt, numeric:true },
    { kind:'text', text:String(seller.activeProducts), align:'right', numeric:true },
    { kind:'text', text:`${seller.cancelRate.toFixed(1)}%`, align:'right', numeric:true, color:seller.cancelRate >= 5 ? '#dc2626' : undefined },
    { kind:'text', text:`${seller.reportCount}건`, align:'right', numeric:true, color:seller.reportCount >= 3 ? '#dc2626' : undefined },
    { kind:'link', text:'검토' },
  ] }));
  return <section className={shared.page}>
    <PageHeading title="판매 상태" subtitle="판매 가능 여부와 상태 변경 사유를 확인하고 판매 재개·일시 중지를 처리합니다. 정책 제재는 제재 관리로 연계합니다."/>
    <div className={styles.sectionGrid}><div className={styles.panel}><div className={styles.panelHead}><div><h2>판매 상태 운영 큐</h2><p>상태 카드를 선택하면 해당 판매자만 표시됩니다.</p></div><span className={styles.rangeText}>2026.08.26 15:40 기준</span></div><div className={styles.statusFlow}>{statuses.map((item) => <button key={item} type="button" className={`${styles.flowCard} ${status === item ? styles.flowCardActive : ''}`} onClick={() => setStatus(status === item ? '전체' : item)}><span>{item}</span><strong>{sellers.filter((seller) => seller.status === item).length}명</strong><small>{STATUS_DESCRIPTIONS[item]}</small></button>)}</div></div><div className={styles.panel}><div className={styles.panelHead}><div><h2>우선 검토 판매자</h2><p>신고와 취소율을 합산한 위험 순위</p></div></div><div className={styles.riskList}>{riskSellers.map((seller,index) => <button type="button" key={seller.id} className={styles.riskItem} onClick={() => setSelectedId(seller.id)}><span className={styles.riskRank}>{index+1}</span><span className={styles.riskBody}><strong>{seller.nickname}</strong><span>신고 {seller.reportCount}건 · 취소 {seller.cancelRate.toFixed(1)}%</span></span><span className={styles.riskScore}>{seller.reportCount * 10 + Math.round(seller.cancelRate)}점</span></button>)}</div></div></div>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>판매자</option><option>변경 사유</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="판매자 ID / 닉네임 / 상태 변경 사유"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm} value={status} onChange={(event) => setStatus(event.target.value as SellerStatus | '전체')}><option>전체</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>변경 원인</span><select aria-label="변경 원인" className={shared.selectSm} value={reasonType} onChange={(event) => setReasonType(event.target.value)}><option value="">전체 변경 원인</option><option value="직접">판매자 직접</option><option value="신고">신고/정책</option><option value="활동 없음">장기 미활동</option><option value="승급">자동 승급</option></select></label><DatePicker className={shared.selectSm} defaultValue="2026-08-01"/><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-26"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={() => { setStatus('전체'); setReasonType(''); setSearch(''); setKeyword(''); }}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length}/><DataGrid columns={[{label:'판매자'},{label:'현재 상태'},{label:'상태 변경 사유'},{label:'최근 활동'},{label:'판매중 상품',align:'right'},{label:'취소율',align:'right'},{label:'신고',align:'right'},{label:'관리'}]} rows={rows} gridTemplate="minmax(175px,1.2fr) 82px minmax(220px,1.5fr) 126px 84px 64px 44px 55px" minWidth="1020px" empty={!filtered.length} emptyText="해당 상태의 판매자가 없습니다." showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0명'}/></GridArea>
    {selected && <DetailDrawer eyebrow={`판매 상태 검토 · ${selected.id}`} title={selected.nickname} status={selected.status} statusMeta={SELLER_STATUS_META[selected.status]} subtitle={`${selected.name} · 최근 활동 ${selected.lastActiveAt}`} onClose={() => setSelectedId(null)} actions={<>{selected.status !== '판매중' && selected.status !== '판매제한' && <button type="button" className={drawer.primaryBtn} onClick={() => changeStatus('판매중','운영자 검토 후 판매 재개')}>판매 재개</button>}{selected.status === '판매중' && <button type="button" className={drawer.actionLink} onClick={() => changeStatus('판매중지','운영자 모니터링 중지')}>판매 중지</button>}<span className={drawer.spacer}/><button type="button" className={drawer.dangerBtn} onClick={() => navigate(`/c2c/sanctions/processing?type=sales&member=${encodeURIComponent(selected.id)}`)}>제재 검토</button></>} stats={[{label:'판매중 상품',value:`${selected.activeProducts}개`},{label:'누적 판매',value:formatWon(selected.salesAmount)},{label:'위험 지표',value:`${selected.reportCount * 10 + Math.round(selected.cancelRate)}점`}]} fields={[{label:'현재 상태',value:selected.status},{label:'변경 시각',value:selected.statusChangedAt},{label:'변경 사유',value:selected.statusReason},{label:'본인 인증',value:selected.verification},{label:'취소율',value:`${selected.cancelRate.toFixed(1)}%`},{label:'누적 신고',value:`${selected.reportCount}건`}]}><div className={drawer.sectionTitleLoose}>상태 처리 기준</div><div className={styles.warningBox}>판매 중지·재개는 활동 상태 변경입니다. 정책 위반에 따른 판매 제한은 제재 관리에서 근거와 승인 절차를 거치며, 적용 후 이 화면에 결과 상태가 반영됩니다.</div></DetailDrawer>}
    {toast && <div className={styles.toast}>{toast}</div>}
  </section>;
}
