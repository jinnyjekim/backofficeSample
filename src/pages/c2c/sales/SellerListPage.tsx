import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import styles from './SalesActivity.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from './SalesActivityShared';
import { SELLERS, SELLER_STATUS_META, formatWon, type SellerStatus } from './salesActivityData';
import { downloadCsv, pages } from './salesActivityUtils';

const QUICK: Array<'전체' | SellerStatus | '신고 있음'> = ['전체', '판매중', '판매중지', '판매제한', '휴면', '신고 있음'];

export function SellerListPage() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState(SELLERS);
  const [quick, setQuick] = useState<(typeof QUICK)[number]>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [verification, setVerification] = useState('');
  const [region, setRegion] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => sellers.filter((seller) => {
    if (quick === '신고 있음' ? seller.reportCount === 0 : quick !== '전체' && seller.status !== quick) return false;
    if (grade && seller.grade !== grade) return false;
    if (verification && seller.verification !== verification) return false;
    if (region && seller.region !== region) return false;
    return !search || `${seller.id} ${seller.name} ${seller.nickname} ${seller.email} ${seller.phone}`.toLowerCase().includes(search.toLowerCase());
  }), [grade, quick, region, search, sellers, verification]);
  const selected = sellers.find((seller) => seller.id === selectedId) ?? null;
  const salesTotal = sellers.reduce((sum, seller) => sum + seller.salesAmount, 0);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2300); };
  const reset = () => { setKeyword(''); setSearch(''); setGrade(''); setVerification(''); setRegion(''); };
  const changeStatus = (status: SellerStatus, reason: string) => {
    if (!selected) return;
    setSellers((current) => current.map((seller) => seller.id === selected.id ? { ...seller, status, statusChangedAt: '2026-08-26 15:40', statusReason: reason } : seller));
    notify(`${selected.nickname} 판매 상태를 ${status}(으)로 변경했습니다.`);
  };
  const rows: GridRow[] = filtered.map((seller) => ({ id: seller.id, onClick: () => setSelectedId(seller.id), cells: [
    { kind: 'avatarText', title: seller.nickname, subtitle: `${seller.name} · ${seller.id}`, avatarChar: seller.nickname.slice(0, 1), avatarBg: '#eef2ff', avatarFg: '#4338ca' },
    { kind: 'pillText', text: seller.grade, bg: seller.grade === '파워' ? '#fef3c7' : seller.grade === '우수' ? '#eff6ff' : '#f4f4f5', fg: seller.grade === '파워' ? '#a16207' : seller.grade === '우수' ? '#1d4ed8' : '#52525b' },
    { kind: 'badge', text: seller.status, ...SELLER_STATUS_META[seller.status] },
    { kind: 'text', text: seller.verification, color: seller.verification === '완료' ? '#047857' : '#dc2626' },
    { kind: 'text', text: `${seller.activeProducts} / ${seller.soldProducts}`, numeric: true, align: 'right' },
    { kind: 'text', text: seller.tradeCount.toLocaleString(), numeric: true, align: 'right' },
    { kind: 'text', text: formatWon(seller.salesAmount), numeric: true, align: 'right', weight: 600 },
    { kind: 'text', text: `${seller.cancelRate.toFixed(1)}%`, numeric: true, align: 'right', color: seller.cancelRate >= 5 ? '#dc2626' : undefined },
    { kind: 'text', text: String(seller.reportCount), numeric: true, align: 'right', color: seller.reportCount ? '#dc2626' : '#71717a' },
    { kind: 'link', text: '상세' },
  ] }));

  return <section className={shared.page}>
    <PageHeading title="판매자 목록" subtitle="C2C 판매자의 인증, 등급, 판매 활동과 위험 지표를 통합 조회합니다." action={<button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('판매자-목록.csv', ['판매자 ID','닉네임','이름','등급','상태','거래수','누적 판매액','취소율','신고'], filtered.map((seller) => [seller.id,seller.nickname,seller.name,seller.grade,seller.status,seller.tradeCount,seller.salesAmount,seller.cancelRate,seller.reportCount]))}>다운로드</button>}/>
    <Metrics items={[{ label: '전체 판매자', value: `${sellers.length.toLocaleString()}명`, note: '최근 30일 신규 24명', tone: 'up', dot: '#4f7bd9' }, { label: '판매 활동중', value: `${sellers.filter((s) => s.status === '판매중').length}명`, note: '전체 판매자의 60.0%', dot: '#10b981' }, { label: '확인 필요', value: `${sellers.filter((s) => s.status === '판매제한' || s.reportCount >= 3).length}명`, note: '제한 또는 신고 3건 이상', tone: 'down', dot: '#ef4444' }, { label: '누적 판매액', value: `${Math.round(salesTotal / 1000000).toLocaleString()}백만원`, note: '전월 대비 +12.8%', tone: 'up', dot: '#8b5cf6' }]}/>
    <ControlArea><div className={shared.quickFilters}>{QUICK.map((item) => <button key={item} type="button" className={`${shared.qfBtn} ${quick === item ? styles.quickActive : ''}`} onClick={() => setQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{sellers.filter((seller) => item === '전체' || (item === '신고 있음' ? seller.reportCount > 0 : seller.status === item)).length}</span></button>)}</div>
      <FilterBox><form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>판매자 ID</option><option>닉네임</option><option>이름</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="판매자 ID / 닉네임 / 이름 / 연락처"/><button type="submit" className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>등급</span><select aria-label="등급" className={shared.selectSm} value={grade} onChange={(event) => setGrade(event.target.value)}><option value="">전체 등급</option><option>일반</option><option>우수</option><option>파워</option></select></label><label className="globalFilterField"><span>인증</span><select aria-label="인증" className={shared.selectSm} value={verification} onChange={(event) => setVerification(event.target.value)}><option value="">전체 인증</option><option>완료</option><option>미완료</option><option>재인증 필요</option></select></label><label className="globalFilterField"><span>지역</span><select aria-label="지역" className={shared.selectSm} value={region} onChange={(event) => setRegion(event.target.value)}><option value="">전체 지역</option>{[...new Set(sellers.map((seller) => seller.region))].map((item) => <option key={item}>{item}</option>)}</select></label><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length}><select className={shared.pageSizeSelect}><option>20개씩</option><option>50개씩</option></select></ResultBar><DataGrid columns={[{ label:'판매자'},{label:'등급'},{label:'판매 상태'},{label:'본인 인증'},{label:'상품(판매중/완료)',align:'right'},{label:'거래',align:'right'},{label:'누적 판매액',align:'right'},{label:'취소율',align:'right'},{label:'신고',align:'right'},{label:'관리'}]} rows={rows} gridTemplate="minmax(180px,1.5fr) 64px 82px 86px 115px 62px 108px 72px 52px 55px" minWidth="1050px" empty={!filtered.length} emptyText="조건에 맞는 판매자가 없습니다." showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0명'}/></GridArea>
    {selected && <DetailDrawer eyebrow={`판매자 상세 · ${selected.id}`} title={selected.nickname} status={selected.status} statusMeta={SELLER_STATUS_META[selected.status]} subtitle={`${selected.name} · ${selected.email}`} onClose={() => setSelectedId(null)} actions={<><button type="button" className={drawer.actionLink} onClick={() => changeStatus(selected.status === '판매중' ? '판매중지' : '판매중', selected.status === '판매중' ? '운영자 일시 중지' : '운영자 판매 재개')}>{selected.status === '판매중' ? '판매 중지' : '판매 재개'}</button><button type="button" className={drawer.actionLink} onClick={() => navigate(`/c2c/verification/review?purpose=seller&member=${encodeURIComponent(selected.id)}`)}>인증 검토</button><span className={drawer.spacer}/><button type="button" className={drawer.dangerBtn} onClick={() => navigate(`/c2c/sanctions/processing?type=sales&member=${encodeURIComponent(selected.id)}`)}>제재 검토</button></>} stats={[{label:'누적 거래',value:`${selected.tradeCount}건`},{label:'판매액',value:formatWon(selected.salesAmount)},{label:'매너 점수',value:`${selected.mannerScore}점`}]} fields={[{label:'본인 인증',value:selected.verification},{label:'판매자 등급',value:selected.grade},{label:'활동 지역',value:selected.region},{label:'가입일',value:selected.joinedAt},{label:'최근 활동',value:selected.lastActiveAt},{label:'연락처',value:selected.phone},{label:'판매 상품',value:`판매중 ${selected.activeProducts} · 완료 ${selected.soldProducts}`},{label:'취소율 / 신고',value:`${selected.cancelRate.toFixed(1)}% / ${selected.reportCount}건`}]}><div className={drawer.sectionTitleLoose}>최근 상태 변경</div><div className={drawer.bodyText}>{selected.statusReason}<br/>{selected.statusChangedAt} · admin01</div><div className={drawer.sectionTitleLoose}>운영 참고</div><div className={styles.warningBox}>판매 중지·재개는 판매 활동 상태에서 처리합니다. 본인 인증 검토는 인증 관리, 정책 위반에 따른 판매 제한은 제재 관리에서 각각 근거와 이력을 남깁니다.</div></DetailDrawer>}
    {toast && <div className={styles.toast}>{toast}</div>}
  </section>;
}
