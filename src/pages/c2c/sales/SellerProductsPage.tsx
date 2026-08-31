import { useMemo, useState } from 'react';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import styles from './SalesActivity.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from './SalesActivityShared';
import { PRODUCT_STATUS_META, SALE_PRODUCTS, formatWon, sellerById, type ProductStatus } from './salesActivityData';
import { downloadCsv, pages } from './salesActivityUtils';

const QUICK: Array<'전체' | ProductStatus | '신고 상품'> = ['전체','판매중','예약중','검수중','판매완료','숨김','신고 상품'];

export function SellerProductsPage() {
  const [products, setProducts] = useState(SALE_PRODUCTS);
  const [quick, setQuick] = useState<(typeof QUICK)[number]>('전체');
  const [keyword, setKeyword] = useState(''); const [search, setSearch] = useState(''); const [category, setCategory] = useState(''); const [condition, setCondition] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null); const [toast, setToast] = useState('');
  const categories = [...new Set(products.map((product) => product.category.split(' > ')[0]))];
  const filtered = useMemo(() => products.filter((product) => {
    if (quick === '신고 상품' ? product.reportCount === 0 : quick !== '전체' && product.status !== quick) return false;
    if (category && !product.category.startsWith(category)) return false; if (condition && product.condition !== condition) return false;
    const seller = sellerById(product.sellerId); return !search || `${product.id} ${product.title} ${product.category} ${seller?.nickname ?? ''}`.toLowerCase().includes(search.toLowerCase());
  }), [category, condition, products, quick, search]);
  const selected = products.find((product) => product.id === selectedId) ?? null; const selectedSeller = selected ? sellerById(selected.sellerId) : null;
  const notify = (message:string) => { setToast(message); window.setTimeout(() => setToast(''),2200); };
  const updateStatus = (status: ProductStatus, exposure = status === '숨김' ? '비노출' as const : '노출' as const) => { if (!selected) return; setProducts((items) => items.map((product) => product.id === selected.id ? { ...product, status, exposure, updatedAt:'2026-08-26 15:40' } : product)); notify(`${selected.title} 상태를 ${status}(으)로 변경했습니다.`); };
  const rows: GridRow[] = filtered.map((product) => { const seller = sellerById(product.sellerId); return { id:product.id, onClick:() => setSelectedId(product.id), cells:[
    { kind:'thumbTitle', thumb:product.status === '숨김' ? '#fecaca' : '#e0e7ff', title:product.title, id:product.id, onClick:() => setSelectedId(product.id) },
    { kind:'stack', title:seller?.nickname ?? '-', subtitle:product.sellerId },
    { kind:'text', text:product.category }, { kind:'text', text:formatWon(product.price), align:'right', numeric:true, weight:600 },
    { kind:'badge', text:product.status, ...PRODUCT_STATUS_META[product.status] }, { kind:'text', text:product.condition },
    { kind:'text', text:product.views.toLocaleString(), align:'right', numeric:true }, { kind:'text', text:product.wishes.toLocaleString(), align:'right', numeric:true },
    { kind:'text', text:String(product.reportCount), align:'right', numeric:true, color:product.reportCount ? '#dc2626':'#71717a' }, { kind:'link', text:'상세' },
  ]}; });
  return <section className={shared.page}>
    <PageHeading title="사용자 상품 목록" subtitle="C2C 판매자가 등록한 전체 상품을 판매 상태, 노출 상태와 신고 현황으로 조회합니다." action={<button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('C2C-사용자상품.csv',['상품 ID','상품명','판매자','카테고리','가격','상태','신고'],filtered.map((p) => [p.id,p.title,sellerById(p.sellerId)?.nickname ?? p.sellerId,p.category,p.price,p.status,p.reportCount]))}>다운로드</button>}/>
    <Metrics items={[{label:'전체 등록 상품',value:`${products.length}개`,note:'오늘 신규 38개',tone:'up',dot:'#4f7bd9'},{label:'현재 판매중',value:`${products.filter((p)=>p.status==='판매중').length}개`,note:'전체의 40.0%',dot:'#10b981'},{label:'검수 필요',value:`${products.filter((p)=>p.status==='검수중'||p.reportCount>0).length}개`,note:'검수중 또는 신고 접수',tone:'down',dot:'#f59e0b'},{label:'총 상품 가치',value:formatWon(products.reduce((sum,p)=>sum+p.price,0)),note:'등록가 합계',dot:'#8b5cf6'}]}/>
    <ControlArea><div className={shared.quickFilters}>{QUICK.map((item)=><button type="button" key={item} className={`${shared.qfBtn} ${quick===item?styles.quickActive:''}`} onClick={()=>setQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{products.filter((product)=>item==='전체'||(item==='신고 상품'?product.reportCount>0:product.status===item)).length}</span></button>)}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>상품 ID</option><option>상품명</option><option>판매자</option></select></label><input className={shared.searchInput} value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="상품 ID / 상품명 / 판매자 닉네임"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>카테고리</span><select aria-label="카테고리" className={shared.selectSm} value={category} onChange={(e)=>setCategory(e.target.value)}><option value="">전체 카테고리</option>{categories.map((item)=><option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>상품 상태</span><select aria-label="상품 상태" className={shared.selectSm} value={condition} onChange={(e)=>setCondition(e.target.value)}><option value="">전체 상품 상태</option><option>새상품</option><option>사용감 없음</option><option>사용감 적음</option><option>사용감 많음</option></select></label><input type="number" className={shared.selectSm} placeholder="최소 가격"/><span>~</span><input type="number" className={shared.selectSm} placeholder="최대 가격"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={()=>{setKeyword('');setSearch('');setCategory('');setCondition('');}}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="개"><select className={shared.pageSizeSelect}><option>20개씩</option><option>50개씩</option></select></ResultBar><DataGrid columns={[{label:'상품'},{label:'판매자'},{label:'카테고리'},{label:'판매가',align:'right'},{label:'판매 상태'},{label:'상품 상태'},{label:'조회',align:'right'},{label:'관심',align:'right'},{label:'신고',align:'right'},{label:'관리'}]} rows={rows} gridTemplate="minmax(220px,1.6fr) 115px 115px 90px 80px 82px 55px 55px 48px 55px" minWidth="1120px" empty={!filtered.length} emptyText="조건에 맞는 판매 상품이 없습니다." showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0개'}/></GridArea>
    {selected && selectedSeller && <DetailDrawer eyebrow={`판매 상품 상세 · ${selected.id}`} title={selected.title} status={selected.status} statusMeta={PRODUCT_STATUS_META[selected.status]} subtitle={`${selectedSeller.nickname} · ${selected.category}`} onClose={()=>setSelectedId(null)} actions={<><button type="button" className={drawer.actionLink} onClick={()=>updateStatus(selected.status==='판매중'?'예약중':'판매중')}>{selected.status==='판매중'?'예약 처리':'판매 재개'}</button><span className={drawer.spacer}/>{selected.status!=='숨김'&&<button type="button" className={drawer.dangerBtn} onClick={()=>updateStatus('숨김')}>상품 숨김</button>}{selected.status==='숨김'&&<button type="button" className={drawer.primaryBtn} onClick={()=>updateStatus('검수중')}>재검수 요청</button>}</>} stats={[{label:'조회',value:selected.views.toLocaleString()},{label:'관심',value:selected.wishes.toLocaleString()},{label:'채팅',value:selected.chats.toLocaleString()}]} fields={[{label:'판매자',value:`${selectedSeller.nickname} (${selected.sellerId})`},{label:'판매가',value:formatWon(selected.price)},{label:'상품 상태',value:selected.condition},{label:'노출 상태',value:selected.exposure},{label:'등록일',value:selected.registeredAt},{label:'최근 수정',value:selected.updatedAt},{label:'신고',value:`${selected.reportCount}건`}]}><div className={drawer.sectionTitleLoose}>검수 참고</div><div className={drawer.bodyText}>{selected.reportCount ? `신고 ${selected.reportCount}건이 접수되었습니다. 상품 설명, 이미지와 판매자의 소명 자료를 확인하세요.` : '현재 접수된 신고가 없습니다. 상품 정보와 카테고리 적합성을 확인할 수 있습니다.'}</div></DetailDrawer>}
    {toast&&<div className={styles.toast}>{toast}</div>}
  </section>;
}
