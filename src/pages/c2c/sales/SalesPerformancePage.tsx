import { useMemo, useState } from 'react';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import styles from './SalesActivity.module.css';
import { GridArea, Metrics, PageHeading, ResultBar } from './SalesActivityShared';
import { SALE_PRODUCTS, SALE_TRADES, SELLERS, formatWon } from './salesActivityData';
import { downloadCsv, pages } from './salesActivityUtils';

const MONTHLY = [
  {month:'3월',amount:61,count:218},{month:'4월',amount:72,count:246},{month:'5월',amount:69,count:238},{month:'6월',amount:84,count:281},{month:'7월',amount:93,count:304},{month:'8월',amount:108,count:337},
];

export function SalesPerformancePage(){
  const [range,setRange]=useState('최근 6개월'); const [metric,setMetric]=useState('거래액'); const [grade,setGrade]=useState('');
  const ranked=useMemo(()=>SELLERS.filter((seller)=>!grade||seller.grade===grade).sort((a,b)=>b.salesAmount-a.salesAmount),[grade]);
  const tradeAmount=SALE_TRADES.reduce((sum,trade)=>sum+trade.amount,0); const confirmed=SALE_TRADES.filter((trade)=>trade.status==='구매확정');
  const rows:GridRow[]=ranked.map((seller,index)=>({id:seller.id,cells:[{kind:'text',text:String(index+1),weight:700,align:'right'},{kind:'avatarText',title:seller.nickname,subtitle:`${seller.name} · ${seller.grade}`,avatarChar:seller.nickname[0],avatarBg:'#eef2ff',avatarFg:'#4338ca'},{kind:'text',text:seller.tradeCount.toLocaleString(),align:'right',numeric:true},{kind:'text',text:formatWon(seller.salesAmount),align:'right',numeric:true,weight:600},{kind:'text',text:formatWon(Math.round(seller.salesAmount*.035)),align:'right',numeric:true},{kind:'text',text:`${seller.cancelRate.toFixed(1)}%`,align:'right',numeric:true,color:seller.cancelRate>=5?'#dc2626':undefined},{kind:'progress',pct:Math.round((seller.salesAmount/ranked[0].salesAmount)*100),label:`${Math.round((seller.salesAmount/ranked[0].salesAmount)*100)}%`}] }));
  const categoryTotals=[...new Set(SALE_PRODUCTS.map((p)=>p.category.split(' > ')[0]))].map((category)=>({category,value:SALE_PRODUCTS.filter((p)=>p.category.startsWith(category)).reduce((sum,p)=>sum+p.price,0)})).sort((a,b)=>b.value-a.value);
  const categorySum=categoryTotals.reduce((sum,item)=>sum+item.value,0);
  return <section className={shared.page}>
    <PageHeading title="판매 실적" subtitle="C2C 판매 거래의 매출, 거래 성사율, 수수료와 판매자별 성과를 분석합니다." action={<><select className={shared.selectSm} value={range} onChange={(e)=>setRange(e.target.value)}><option>최근 30일</option><option>최근 3개월</option><option>최근 6개월</option><option>올해</option></select><button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('C2C-판매실적.csv',['순위','판매자','거래수','누적 판매액','취소율'],ranked.map((seller,index)=>[index+1,seller.nickname,seller.tradeCount,seller.salesAmount,seller.cancelRate]))}>리포트 다운로드</button></>}/>
    <Metrics items={[{label:'총 거래액',value:formatWon(tradeAmount),note:'이전 기간 대비 +14.2%',tone:'up',dot:'#4f7bd9'},{label:'거래 성사율',value:`${((confirmed.length/SALE_TRADES.length)*100).toFixed(1)}%`,note:'구매확정 기준 +2.8%p',tone:'up',dot:'#10b981'},{label:'평균 객단가',value:formatWon(Math.round(tradeAmount/SALE_TRADES.length)),note:'이전 기간 대비 +6.1%',tone:'up',dot:'#8b5cf6'},{label:'취소·분쟁률',value:`${((SALE_TRADES.filter((t)=>t.status==='취소'||t.status==='분쟁').length/SALE_TRADES.length)*100).toFixed(1)}%`,note:'목표 5.0% 이하',tone:'down',dot:'#ef4444'}]}/>
    <div className={styles.sectionGrid}><div className={styles.panel}><div className={styles.panelHead}><div><h2>{range} 판매 추이</h2><p>월별 {metric==='거래액'?'거래액(백만원)':'거래 건수'} 변화</p></div><select className={shared.selectXs} value={metric} onChange={(e)=>setMetric(e.target.value)}><option>거래액</option><option>거래 건수</option></select></div><div className={styles.chart}>{MONTHLY.map((item)=>{const value=metric==='거래액'?item.amount:item.count;const max=metric==='거래액'?110:340;return <div key={item.month} className={styles.barCol}><em>{value.toLocaleString()}</em><span style={{height:`${Math.round((value/max)*145)}px`}}/><small>{item.month}</small></div>;})}</div></div><div className={styles.panel}><div className={styles.panelHead}><div><h2>카테고리 거래 구성</h2><p>등록 상품가 기준 구성비</p></div></div><div className={styles.donutWrap}><div className={styles.donut}><div className={styles.donutCenter}><strong>{SALE_PRODUCTS.length}</strong><span>상품</span></div></div><div className={styles.donutLegend}>{categoryTotals.slice(0,4).map((item,index)=><div key={item.category}><i style={{background:['#4f7bd9','#8b5cf6','#f59e0b','#ef4444'][index]}}/><span>{item.category}</span><strong>{((item.value/categorySum)*100).toFixed(1)}%</strong></div>)}</div></div></div></div>
    <GridArea><ResultBar count={ranked.length} unit="명"><select className={shared.selectSm} value={grade} onChange={(e)=>setGrade(e.target.value)}><option value="">전체 판매자 등급</option><option>일반</option><option>우수</option><option>파워</option></select></ResultBar><DataGrid columns={[{label:'순위',align:'right'},{label:'판매자'},{label:'거래수',align:'right'},{label:'누적 판매액',align:'right'},{label:'예상 수수료',align:'right'},{label:'취소율',align:'right'},{label:'상대 실적'}]} rows={rows} gridTemplate="52px minmax(180px,1.2fr) 75px 120px 110px 72px minmax(155px,1fr)" minWidth="850px" showPagination pages={pages} rangeLabel={`1–${ranked.length} / ${ranked.length}`}/></GridArea>
  </section>;
}
