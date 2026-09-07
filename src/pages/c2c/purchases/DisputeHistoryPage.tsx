import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../shared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import styles from './PurchaseActivity.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, PageHeading, ResultBar } from '../sales/SalesActivityShared';
import { downloadCsv, pages } from '../sales/salesActivityUtils';
import { DISPUTE_AUDIT_LOGS, buyerById, productById, purchaseById, sellerById } from './purchaseActivityData';

export function DisputeHistoryPage() {
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [action,setAction]=useState('');
  const [actor,setActor]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=DISPUTE_AUDIT_LOGS.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>DISPUTE_AUDIT_LOGS.filter((item)=>(!action||item.action===action)&&(!actor||(actor==='SYSTEM'?item.actor==='SYSTEM':item.actor!=='SYSTEM'))&&(!search||`${item.id} ${item.disputeId} ${item.purchaseId} ${item.action} ${item.reason} ${item.actor}`.toLowerCase().includes(search.toLowerCase()))),[action,actor,search]);
  const reset=()=>{setKeyword('');setSearch('');setAction('');setActor('');};
  const rows:GridRow[]=filtered.map((item)=>{const purchase=purchaseById(item.purchaseId);const buyer=buyerById(purchase?.buyerId??'');const seller=sellerById(purchase?.sellerId??'');return{id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.occurredAt,subtitle:item.id},{kind:'stack',title:item.disputeId,subtitle:item.purchaseId},{kind:'stack',title:buyer?.nickname??'-',subtitle:`판매자 ${seller?.nickname??'-'}`},{kind:'text',text:item.action,weight:600},{kind:'text',text:item.before,color:'#71717a'},{kind:'text',text:item.after,weight:600},{kind:'stack',title:item.actor,subtitle:item.evidenceChange},{kind:'titleWarn',title:item.reason}]};});
  const purchase=selected?purchaseById(selected.purchaseId):null;
  const buyer=purchase?buyerById(purchase.buyerId):null;
  const seller=purchase?sellerById(purchase.sellerId):null;
  const product=purchase?productById(purchase.productId):null;
  return <div className={shared.page}>
    <PageHeading title="분쟁 처리 이력" subtitle="분쟁 접수부터 증빙 요청·운영 판단·조정 완료까지 모든 상태와 근거 변경을 감사 로그로 조회합니다."/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>로그 ID</option><option>분쟁번호</option><option>구매번호</option><option>처리자</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="로그 / 분쟁 / 구매번호 또는 처리 사유"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>처리 유형</span><select aria-label="처리 유형" className={shared.selectSm} value={action} onChange={(event)=>setAction(event.target.value)}><option value="">전체 처리 유형</option>{[...new Set(DISPUTE_AUDIT_LOGS.map((item)=>item.action))].map((item)=><option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>처리 주체</span><select aria-label="처리 주체" className={shared.selectSm} value={actor} onChange={(event)=>setActor(event.target.value)}><option value="">전체 처리 주체</option><option value="관리자">관리자</option><option>SYSTEM</option></select></label><label className={shared.dateFilterField}><span>처리일</span><span className={shared.dateRange}><DatePicker defaultValue="2026-08-19"/><span className={shared.dateSeparator} aria-hidden="true">~</span><DatePicker defaultValue="2026-08-27"/></span></label><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-dispute-history.csv',['처리일','로그 ID','분쟁번호','구매번호','처리','변경 전','변경 후','처리자','증빙 변경','사유'],filtered.map((item)=>[item.occurredAt,item.id,item.disputeId,item.purchaseId,item.action,item.before,item.after,item.actor,item.evidenceChange,item.reason]))}>다운로드</button></ResultBar><DataGrid columns={[{label:'처리일 / 로그 ID'},{label:'분쟁 / 구매번호'},{label:'구매자 / 판매자'},{label:'처리'},{label:'변경 전'},{label:'변경 후'},{label:'처리자 / 증빙'},{label:'처리 사유'}]} rows={rows} gridTemplate="130px 126px 111px 94px 60px 60px 104px minmax(220px,1.4fr)" minWidth="855px" empty={!filtered.length} emptyText="조건에 맞는 분쟁 처리 이력이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></GridArea>
    {selected&&purchase&&buyer&&seller&&product&&<DetailDrawer eyebrow={`분쟁 감사 로그 · ${selected.id}`} title={selected.action} status="처리 이력" statusMeta={{bg:'#f4f4f5',fg:'#52525b'}} subtitle={`${selected.disputeId} · ${selected.occurredAt}`} onClose={()=>setSelectedId(null)} stats={[{label:'구매자',value:buyer.nickname},{label:'판매자',value:seller.nickname},{label:'처리자',value:selected.actor}]} fields={[{label:'분쟁번호',value:selected.disputeId},{label:'구매번호',value:selected.purchaseId},{label:'상품',value:product.title},{label:'증빙 변경',value:selected.evidenceChange},{label:'처리 사유',value:selected.reason}]}><div className={drawer.sectionTitleLoose}>상태 변경</div><div className={styles.reasonCard}>{selected.before} → {selected.after}</div><div className={drawer.sectionTitleLoose}>감사 원칙</div><div className={drawer.bodyText}>분쟁 처리 이력은 수정하거나 삭제하지 않습니다. 판정 변경이 필요한 경우 기존 로그를 보존하고 새로운 재검토 기록을 추가합니다.</div></DetailDrawer>}
  </div>;
}
