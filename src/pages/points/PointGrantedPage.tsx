import { useMemo, useState } from 'react';
import { DataGrid } from '../../components/DataGrid';
import type { Cell, GridColumn, GridRow } from '../../components/DataGrid/types';
import { ExcelDownloadButton } from '../../components/common/ExcelDownloadButton';
import { DatePicker } from '../../components/forms/DatePicker';
import { POINT_LEDGER, fmtPoint, type PointLedgerEntry } from './pointLedgerData';
import styles from './pointSubpages.module.css';

const ENTRIES = POINT_LEDGER.filter((entry) => ['구매 적립', '관리자 지급', '이벤트 지급', '적립 보정', '포인트 복원'].includes(entry.type));
const COLUMNS: GridColumn[] = [{ label: '지급 번호' },{ label: '지급일시' },{ label: '회원' },{ label: '지급 유형' },{ label: '지급 포인트', align: 'right' },{ label: '지급 후 잔액', align: 'right' },{ label: '지급 출처' },{ label: '처리자' }];

export function PointGrantedPage() {
  const [keyword,setKeyword]=useState(''); const [search,setSearch]=useState(''); const [type,setType]=useState(''); const [start,setStart]=useState(''); const [end,setEnd]=useState('');
  const rows=useMemo<GridRow[]>(()=>ENTRIES.filter((e)=>!search||`${e.id} ${e.member} ${e.sourceId??''}`.toLowerCase().includes(search.toLowerCase())).filter((e)=>!type||e.type===type).filter((e)=>(!start||e.at.slice(0,10)>=start)&&(!end||e.at.slice(0,10)<=end)).map((e:PointLedgerEntry)=>({id:e.id,cells:[
    {kind:'text',text:e.id,weight:650,numeric:true},{kind:'text',text:e.at,color:'#71717a',numeric:true},{kind:'text',text:e.member,weight:650},{kind:'badge',text:e.type,bg:'#ecfdf5',fg:'#047857'},{kind:'text',text:`+${fmtPoint(e.delta)}`,color:'#059669',weight:700,align:'right',numeric:true},{kind:'text',text:fmtPoint(e.after),weight:650,align:'right',numeric:true},{kind:'text',text:e.sourceId??e.sourceType,color:'#71717a'},{kind:'text',text:e.by,color:'#71717a'}] as Cell[]})),[search,type,start,end]);
  const total=ENTRIES.reduce((sum,e)=>sum+e.delta,0);
  const reset=()=>{setKeyword('');setSearch('');setType('');setStart('');setEnd('')};
  return <div className={styles.page}><header className={styles.header}><div className={styles.title}>지급 내역</div><div className={styles.subtitle}>회원에게 지급되거나 복원된 포인트/적립금 내역을 조회합니다.</div></header>
    <section className={styles.summary}><div className={styles.summaryCard}><span>총 지급 건수</span><strong>{ENTRIES.length}건</strong></div><div className={styles.summaryCard}><span>총 지급 포인트</span><strong>{fmtPoint(total)}</strong></div><div className={styles.summaryCard}><span>관리자 처리</span><strong>{ENTRIES.filter(e=>e.by!=='SYSTEM').length}건</strong></div></section>
    <section className={styles.filterBox}><form className={styles.filterRow} onSubmit={e=>{e.preventDefault();setSearch(keyword.trim())}}><label className={styles.field}><input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="지급 번호 / 회원 / 출처 번호" /></label><label className={styles.field}><span>지급 유형</span><select value={type} onChange={e=>setType(e.target.value)}><option value="">전체 지급 유형</option>{[...new Set(ENTRIES.map(e=>e.type))].map(v=><option key={v}>{v}</option>)}</select></label><label className={styles.dateField}><span>지급일</span><div className={styles.dateRange}><DatePicker value={start} onChange={e=>setStart(e.target.value)}/><span>~</span><DatePicker value={end} onChange={e=>setEnd(e.target.value)}/></div></label><button className={styles.searchButton}>조회</button><button type="button" className={styles.resetButton} onClick={reset}>초기화</button></form></section>
    <div className={styles.resultRow}><strong>총 {rows.length}건</strong><div className={styles.resultActions}><ExcelDownloadButton type="button" data-grid-download /><select className={styles.pageSizeSelect} defaultValue="20개씩 보기"><option>20개씩 보기</option><option>50개씩 보기</option></select></div></div><div className={styles.grid}><DataGrid columns={COLUMNS} rows={rows} gridTemplate="150px 130px 1fr 100px 110px 110px 120px 90px" minWidth="1000px" empty={rows.length===0} emptyText="검색 조건에 해당하는 지급 내역이 없습니다." /></div></div>;
}
