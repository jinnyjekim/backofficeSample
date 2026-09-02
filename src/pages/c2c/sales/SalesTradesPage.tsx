import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import styles from './SalesActivity.module.css';
import { CommonButton } from '../../../components/common';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from './SalesActivityShared';
import { SALE_TRADES, TRADE_STATUS_META, formatWon, productById, sellerById, type TradeStatus } from './salesActivityData';
import { downloadCsv, pages } from './salesActivityUtils';

const QUICK: Array<'전체' | TradeStatus | '이슈 있음'> = ['전체','결제완료','배송중','구매확정','취소','분쟁','이슈 있음'];

export function SalesTradesPage() {
  const [trades, setTrades] = useState(SALE_TRADES);
  const [quick,setQuick] = useState<(typeof QUICK)[number]>('전체'); const [keyword,setKeyword] = useState(''); const [search,setSearch] = useState(''); const [payment,setPayment] = useState(''); const [amount,setAmount] = useState('');
  const [selectedId,setSelectedId] = useState<string|null>(null); const [toast,setToast] = useState('');
  const filtered = useMemo(()=>trades.filter((trade)=>{
    if(quick==='이슈 있음'? !trade.issue : quick!=='전체'&&trade.status!==quick)return false;
    if(payment&&trade.paymentMethod!==payment)return false; if(amount==='100만 이상'&&trade.amount<1000000)return false; if(amount==='10만 미만'&&trade.amount>=100000)return false;
    const product=productById(trade.productId); const seller=sellerById(trade.sellerId); return !search||`${trade.id} ${product?.title??''} ${seller?.nickname??''} ${trade.buyer}`.toLowerCase().includes(search.toLowerCase());
  }),[amount,payment,quick,search,trades]);
  const selected=trades.find((trade)=>trade.id===selectedId)??null; const selectedProduct=selected?productById(selected.productId):null; const selectedSeller=selected?sellerById(selected.sellerId):null;
  const total=trades.reduce((sum,trade)=>sum+trade.amount,0); const fees=trades.reduce((sum,trade)=>sum+trade.fee,0);
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),2200);};
  const update=(status:TradeStatus,issue='')=>{if(!selected)return;setTrades((items)=>items.map((trade)=>trade.id===selected.id?{...trade,status,issue,updatedAt:'2026-08-26 15:40'}:trade));notify(`${selected.id} 거래를 ${status}(으)로 변경했습니다.`);};
  const rows:GridRow[]=filtered.map((trade)=>{const product=productById(trade.productId);const seller=sellerById(trade.sellerId);return{id:trade.id,onClick:()=>setSelectedId(trade.id),cells:[
    {kind:'stack',title:trade.id,subtitle:`결제 ${trade.paidAt}`},{kind:'stack',title:product?.title??trade.productId,subtitle:trade.productId},{kind:'stack',title:seller?.nickname??trade.sellerId,subtitle:`구매자 ${trade.buyer}`},
    {kind:'text',text:formatWon(trade.amount),align:'right',numeric:true,weight:600},{kind:'text',text:formatWon(trade.fee),align:'right',numeric:true},{kind:'badge',text:trade.status,...TRADE_STATUS_META[trade.status]},
    {kind:'stack',title:trade.delivery,subtitle:trade.issue||'이슈 없음'},{kind:'text',text:trade.updatedAt,numeric:true},{kind:'link',text:'상세'}
  ]};});
  return <section className={shared.page}>
    <PageHeading title="판매 거래" subtitle="C2C 안전결제 이후 결제·배송·구매확정·취소·분쟁 상태를 거래 단위로 추적합니다." action={<button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('C2C-판매거래.csv',['거래번호','상품','판매자','구매자','거래액','수수료','상태','결제일'],filtered.map((trade)=>[trade.id,productById(trade.productId)?.title??trade.productId,sellerById(trade.sellerId)?.nickname??trade.sellerId,trade.buyer,trade.amount,trade.fee,trade.status,trade.paidAt]))}>다운로드</button>}/>
    <Metrics items={[{label:'거래 금액',value:formatWon(total),note:'조회 기간 총 결제액',tone:'up',dot:'#4f7bd9'},{label:'구매 확정',value:`${trades.filter((t)=>t.status==='구매확정').length}건`,note:`확정률 ${((trades.filter((t)=>t.status==='구매확정').length/trades.length)*100).toFixed(1)}%`,dot:'#10b981'},{label:'취소 / 분쟁',value:`${trades.filter((t)=>t.status==='취소'||t.status==='분쟁').length}건`,note:'운영 확인이 필요한 거래',tone:'down',dot:'#ef4444'},{label:'예상 수수료',value:formatWon(fees),note:'거래액 기준 3.5%',dot:'#8b5cf6'}]}/>
    <ControlArea><div className={shared.quickFilters}>{QUICK.map((item) => {
      const active = quick === item;
      return (
        <CommonButton
          type="button"
          key={item}
          variant={active ? 'primary-light' : 'secondary'}
          size="md"
          className={`${shared.qfBtn} ${active ? styles.quickActive : ''}`}
          onClick={() => setQuick(item)}
        >
          <span className={shared.qfLabel}>{item}</span>
          <span className={shared.qfCount}>{trades.filter((trade) => item === '전체' || (item === '이슈 있음' ? !trade.issue : trade.status === item)).length}</span>
        </CommonButton>
      );
    })}</div><FilterBox><form className={shared.filterRow1} onSubmit={(e)=>{e.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>거래번호</option><option>상품명</option><option>판매자</option><option>구매자</option></select></label><input className={shared.searchInput} value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="거래번호 / 상품 / 판매자 / 구매자"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>결제수단</span><select aria-label="결제수단" className={shared.selectSm} value={payment} onChange={(e)=>setPayment(e.target.value)}><option value="">전체 결제수단</option><option>안전결제</option><option>카드</option><option>간편결제</option></select></label><label className="globalFilterField"><span>거래금액</span><select aria-label="거래금액" className={shared.selectSm} value={amount} onChange={(e)=>setAmount(e.target.value)}><option value="">전체 거래금액</option><option>10만 미만</option><option>100만 이상</option></select></label><span>결제일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-01"/><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-26"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={()=>{setKeyword('');setSearch('');setPayment('');setAmount('');}}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><select className={shared.pageSizeSelect}><option>20개씩</option><option>50개씩</option></select></ResultBar><DataGrid columns={[{label:'거래번호'},{label:'상품'},{label:'판매자 / 구매자'},{label:'거래액',align:'right'},{label:'수수료',align:'right'},{label:'거래 상태'},{label:'배송 / 이슈'},{label:'최근 변경'},{label:'관리'}]} rows={rows} gridTemplate="132px minmax(180px,1.35fr) 114px 92px 66px 82px minmax(145px,1fr) 125px 55px" minWidth="1075px" empty={!filtered.length} emptyText="조건에 맞는 판매 거래가 없습니다." showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></GridArea>
    {selected&&selectedProduct&&selectedSeller&&<DetailDrawer eyebrow={`판매 거래 상세 · ${selected.id}`} title={selectedProduct.title} status={selected.status} statusMeta={TRADE_STATUS_META[selected.status]} subtitle={`${selectedSeller.nickname} → ${selected.buyer}`} onClose={()=>setSelectedId(null)} actions={<>{selected.status==='결제완료'&&<button type="button" className={drawer.primaryBtn} onClick={()=>update('배송중')}>배송 처리</button>}{selected.status==='배송중'&&<button type="button" className={drawer.primaryBtn} onClick={()=>update('구매확정')}>구매 확정</button>}<span className={drawer.spacer}/>{!['취소','구매확정'].includes(selected.status)&&<button type="button" className={drawer.dangerBtn} onClick={()=>update('분쟁','운영자 수동 분쟁 전환')}>분쟁 전환</button>}</>} stats={[{label:'거래 금액',value:formatWon(selected.amount)},{label:'수수료',value:formatWon(selected.fee)},{label:'판매자 정산',value:formatWon(selected.amount-selected.fee)}]} fields={[{label:'상품번호',value:selected.productId},{label:'판매자',value:`${selectedSeller.nickname} (${selected.sellerId})`},{label:'구매자',value:selected.buyer},{label:'결제수단',value:selected.paymentMethod},{label:'결제일',value:selected.paidAt},{label:'배송 상태',value:selected.delivery},{label:'최근 변경',value:selected.updatedAt}]}><div className={drawer.sectionTitleLoose}>거래 이슈</div><div className={selected.issue?styles.warningBox:drawer.bodyText}>{selected.issue||'현재 등록된 거래 이슈가 없습니다.'}</div><div className={drawer.sectionTitleLoose}>처리 흐름</div><div className={styles.timeline}>{['결제 완료','판매자 확인','배송 처리',selected.status].map((item,index)=><div key={`${item}-${index}`} className={styles.timelineItem}><strong>{item}</strong><p>{index===3?selected.issue||'현재 거래 상태':'정상 처리'}</p><time>2026-08-{String(20+index).padStart(2,'0')} {10+index}:20</time></div>)}</div></DetailDrawer>}
    {toast&&<div className={styles.toast}>{toast}</div>}
  </section>;
}
