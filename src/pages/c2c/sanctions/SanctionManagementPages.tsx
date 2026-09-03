import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../sales/SalesActivity.module.css';
import styles from './SanctionManagement.module.css';
import { CommonButton } from '../../../components/common';
import { ControlArea, DetailDrawer, Field, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from '../sales/SalesActivityShared';
import { downloadCsv, pages } from '../sales/salesActivityUtils';
import {
  SANCTION_AUDIT_LOGS,
  SANCTION_CASES,
  SANCTION_POLICIES,
  SANCTION_SEVERITY_META,
  SANCTION_STATUS_META,
  SANCTION_TYPE_META,
  type SanctionCase,
  type SanctionDuration,
  type SanctionPolicy,
  type SanctionSeverity,
  type SanctionStatus,
  type SanctionType,
} from './sanctionData';

type SanctionQuick = '전체' | '검토 필요' | '적용중' | '예약' | '해제 검토' | '종료';

const TYPE_BY_PARAM: Record<string, SanctionType> = { warning:'경고', products:'상품 등록 제한', sales:'판매 제한', purchases:'구매 제한', chat:'채팅 제한', account:'계정 정지' };
const PARAM_BY_TYPE: Record<SanctionType,string> = { 경고:'warning', '상품 등록 제한':'products', '판매 제한':'sales', '구매 제한':'purchases', '채팅 제한':'chat', '계정 정지':'account' };
const TYPES: SanctionType[] = ['경고','상품 등록 제한','판매 제한','구매 제한','채팅 제한','계정 정지'];
const QUICKS: SanctionQuick[] = ['전체','검토 필요','적용중','예약','해제 검토','종료'];
const EFFECT_BY_TYPE: Record<SanctionType,string> = {
  경고:'회원 경고 안내 · 기능 차단 없음',
  '상품 등록 제한':'신규 상품 등록 및 게시 차단',
  '판매 제한':'판매 상품 비노출 · 신규 거래 차단',
  '구매 제한':'상품 구매·예약·결제 차단',
  '채팅 제한':'거래 채팅 발신 차단',
  '계정 정지':'로그인·판매·구매·채팅 전체 차단',
};
const END_BY_DURATION: Record<SanctionDuration,string> = { '1일':'2026-08-28 23:59','3일':'2026-08-30 23:59','7일':'2026-09-03 23:59','30일':'2026-09-25 23:59',영구:'영구','-':'-' };
const EMPTY_FORM = { memberId:'',nickname:'',memberRole:'공통' as SanctionCase['memberRole'],type:'경고' as SanctionType,duration:'-' as SanctionDuration,reason:'',source:'운영자 직접 등록',sourceId:'MANUAL',memo:'' };
const MEMBERS = [
  { id:'SEL-12438',nickname:'urbanpicker',role:'판매자' as const },
  { id:'SEL-13226',nickname:'태윤테크',role:'판매자' as const },
  { id:'buyer_8841',nickname:'quickdeal88',role:'구매자' as const },
  { id:'SEL-10813',nickname:'campplus',role:'판매자' as const },
];

function quickFromParam(value:string|null):SanctionQuick {
  if(value==='pending') return '검토 필요';
  if(value==='active') return '적용중';
  if(value==='scheduled') return '예약';
  if(value==='release') return '해제 검토';
  if(value==='closed') return '종료';
  return '전체';
}

function matchesQuick(item:SanctionCase,quick:SanctionQuick) {
  if(quick==='전체') return true;
  if(quick==='검토 필요') return item.status==='검토대기'||item.status==='승인대기';
  if(quick==='해제 검토') return item.status==='해제검토';
  if(quick==='종료') return item.status==='종료'||item.status==='철회';
  return item.status===quick;
}

export function SanctionProcessingPage() {
  const [searchParams,setSearchParams]=useSearchParams();
  const [cases,setCases]=useState<SanctionCase[]>(SANCTION_CASES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [severity,setSeverity]=useState<SanctionSeverity|''>('');
  const [assignee,setAssignee]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [editorOpen,setEditorOpen]=useState(false);
  const [form,setForm]=useState(EMPTY_FORM);
  const [toast,setToast]=useState('');
  const typeFilter=TYPE_BY_PARAM[searchParams.get('type')??'']??'';
  const termFilter=searchParams.get('term')??'';
  const memberFilter=searchParams.get('member')??'';
  const quick=quickFromParam(searchParams.get('status'));
  const selected=cases.find((item)=>item.id===selectedId)??null;

  const filtered=useMemo(()=>cases.filter((item)=>{
    if(!matchesQuick(item,quick)) return false;
    if(typeFilter&&item.type!==typeFilter) return false;
    if(memberFilter&&item.memberId!==memberFilter) return false;
    if(termFilter==='temporary'&&(item.duration==='영구'||item.duration==='-')) return false;
    if(termFilter==='permanent'&&item.duration!=='영구') return false;
    if(severity&&item.severity!==severity) return false;
    if(assignee&&(assignee==='미배정'?item.assignee!=='미배정':item.assignee==='미배정')) return false;
    if(search&&!`${item.id} ${item.memberId} ${item.nickname} ${item.violation} ${item.reason} ${item.sourceId}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[assignee,cases,memberFilter,quick,search,severity,termFilter,typeFilter]);

  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),2200);};
  const updateParams=(nextType:SanctionType|'',nextQuick:SanctionQuick,nextTerm=termFilter)=>{
    const next=new URLSearchParams(searchParams);
    if(nextType) next.set('type',PARAM_BY_TYPE[nextType]); else next.delete('type');
    if(nextQuick==='검토 필요') next.set('status','pending'); else if(nextQuick==='적용중') next.set('status','active'); else if(nextQuick==='예약') next.set('status','scheduled'); else if(nextQuick==='해제 검토') next.set('status','release'); else if(nextQuick==='종료') next.set('status','closed'); else next.delete('status');
    if(nextTerm) next.set('term',nextTerm); else next.delete('term');
    setSearchParams(next,{replace:true});
  };
  const patchSelected=(status:SanctionStatus,action:string)=>{
    if(!selected) return;
    setCases((items)=>items.map((item)=>item.id===selected.id?{...item,status,assignee:item.assignee==='미배정'?'admin01':item.assignee,startedAt:status==='적용중'&&item.startedAt==='-'?'2026-08-27 13:30':item.startedAt,endedAt:status==='종료'?'2026-08-27 13:30':item.endedAt}:item));
    notify(`${selected.id} 제재를 ${action} 처리했습니다.`);
  };
  const save=()=>{
    if(!form.memberId||!form.reason.trim()) return notify('대상 회원과 제재 사유를 입력해 주세요.');
    const approval=form.type==='계정 정지'||form.duration==='30일'||form.duration==='영구'?'상위 관리자 승인':form.type==='경고'?'자동 적용':'담당자 승인';
    const needsApproval=approval==='상위 관리자 승인';
    const item:SanctionCase={id:`SNC-260827-${String(cases.length+33).padStart(3,'0')}`,memberId:form.memberId,nickname:form.nickname,memberRole:form.memberRole,type:form.type,duration:form.duration,violation:'운영자 직접 판단',reason:form.reason.trim(),source:form.source,sourceId:form.sourceId||'MANUAL',status:needsApproval?'승인대기':'적용중',severity:needsApproval?'긴급':'보통',strike:1,startedAt:needsApproval?'-':'2026-08-27 13:30',endedAt:END_BY_DURATION[form.duration],assignee:'admin01',approval,effect:EFFECT_BY_TYPE[form.type],evidence:['운영자 입력 근거'],memo:form.memo};
    setCases((items)=>[item,...items]);setEditorOpen(false);setSelectedId(item.id);notify('회원 제재를 등록했습니다.');
  };
  const reset=()=>{setKeyword('');setSearch('');setSeverity('');setAssignee('');setSearchParams(new URLSearchParams(),{replace:true});};

  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),bg:item.severity==='긴급'&&!['종료','철회'].includes(item.status)?'#fffafa':undefined,mark:item.severity==='긴급'&&!['종료','철회'].includes(item.status)?'inset 3px 0 #ef4444':undefined,cells:[
    {kind:'stack',title:item.id,subtitle:`${item.source} · ${item.sourceId}`},
    {kind:'avatarText',title:item.nickname,subtitle:`${item.memberId} · ${item.memberRole}`,avatarChar:item.nickname[0],avatarBg:'#f4f4f5',avatarFg:'#52525b'},
    {kind:'pillText',text:item.type,...SANCTION_TYPE_META[item.type]},
    {kind:'stack',title:item.violation,subtitle:item.reason},
    {kind:'badgeSub',text:item.duration,subText:`누적 ${item.strike}회`,...SANCTION_SEVERITY_META[item.severity]},
    {kind:'stack',title:item.startedAt,subtitle:`~ ${item.endedAt}`},
    {kind:'badge',text:item.status,...SANCTION_STATUS_META[item.status]},
    {kind:'stack',title:item.assignee,subtitle:item.approval},
  ]}));

  return <section className={shared.page}>
    <PageHeading title="제재 처리" subtitle="C2C 회원의 경고·기능 제한·계정 정지를 하나의 업무 큐에서 검토하고 승인·적용·해제합니다." action={<><button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-sanctions.csv',['제재번호','회원','유형','위반','기간','상태','담당자','근거'],filtered.map((item)=>[item.id,item.memberId,item.type,item.violation,item.duration,item.status,item.assignee,item.sourceId]))}>다운로드</button><button type="button" className={shared.createBtn} onClick={()=>{setForm(EMPTY_FORM);setEditorOpen(true);}}>+ 회원 제재 등록</button></>}/>
    <Metrics items={[{label:'검토 필요',value:`${cases.filter((item)=>['검토대기','승인대기'].includes(item.status)).length}건`,note:'근거·승인 단계 확인',tone:'down',dot:'#f59e0b'},{label:'현재 적용중',value:`${cases.filter((item)=>item.status==='적용중').length}건`,note:'기능 영향 모니터링',dot:'#ef4444'},{label:'상위 승인 대기',value:`${cases.filter((item)=>item.status==='승인대기').length}건`,note:'장기·계정 제재',tone:'down',dot:'#8b5cf6'},{label:'해제 검토',value:`${cases.filter((item)=>item.status==='해제검토').length}건`,note:'소명·만료 조건 확인',dot:'#06b6d4'}]}/>
    <ControlArea><div className={shared.quickFilters}>{QUICKS.map((item) => {
      const active = quick === item;
      return (
        <CommonButton
          type="button"
          key={item}
          variant={active ? 'primary-light' : 'secondary'}
          size="md"
          className={`${shared.qfBtn} ${active ? base.quickActive : ''}`}
          onClick={() => updateParams(typeFilter, item)}
        >
          <span className={shared.qfLabel}>{item}</span>
          <span className={shared.qfCount}>{cases.filter((entry) => matchesQuick(entry, item)).length}</span>
        </CommonButton>
      );
    })}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>제재번호</option><option>회원</option><option>근거번호</option><option>제재 사유</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder={memberFilter?`${memberFilter} 회원의 제재만 표시 중`:'제재번호 / 회원 / 위반 사유 / 신고·분쟁·탐지 번호'}/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>제재 유형</span><select aria-label="제재 유형" className={shared.selectSm} value={typeFilter} onChange={(event)=>updateParams(event.target.value as SanctionType|'',quick,'')}><option value="">전체 제재 유형</option>{TYPES.map((item)=><option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>적용 기간</span><select aria-label="적용 기간" className={shared.selectSm} value={termFilter} onChange={(event)=>updateParams(typeFilter,quick,event.target.value)}><option value="">전체 적용 기간</option><option value="temporary">기간 제재</option><option value="permanent">영구 정지</option></select></label><label className="globalFilterField"><span>위험도</span><select aria-label="위험도" className={shared.selectSm} value={severity} onChange={(event)=>setSeverity(event.target.value as SanctionSeverity|'')}><option value="">전체 위험도</option><option>긴급</option><option>높음</option><option>보통</option><option>낮음</option></select></label><label className="globalFilterField"><span>배정 상태</span><select aria-label="배정 상태" className={shared.selectSm} value={assignee} onChange={(event)=>setAssignee(event.target.value)}><option value="">전체 배정 상태</option><option>미배정</option><option value="배정">담당자 배정</option></select></label><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"/><DataGrid columns={[{label:'제재번호 / 근거'},{label:'대상 회원'},{label:'제재 유형'},{label:'위반 / 제재 사유'},{label:'기간 / 누적'},{label:'적용 기간'},{label:'처리 상태'},{label:'담당자 / 승인'}]} rows={rows} gridTemplate="160px 220px 92px minmax(220px,1.4fr) 62px 128px 70px 88px" minWidth="1075px" empty={!filtered.length} emptyText="조건에 맞는 제재 건이 없습니다." emptySubtext="제재 유형이나 처리 상태 필터를 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`제재 처리 · ${selected.id}`} title={selected.nickname} status={selected.status} statusMeta={SANCTION_STATUS_META[selected.status]} subtitle={`${selected.type} · ${selected.memberId}`} onClose={()=>setSelectedId(null)} actions={<>{selected.status==='검토대기'&&<button type="button" className={drawer.primaryBtn} onClick={()=>patchSelected(selected.approval.includes('2인')?'승인대기':'적용중','검토 승인')}>검토 승인</button>}{selected.status==='승인대기'&&<button type="button" className={drawer.primaryBtn} onClick={()=>patchSelected('적용중','최종 승인')}>최종 승인</button>}{selected.status==='적용중'&&<button type="button" className={drawer.actionLink} onClick={()=>patchSelected('해제검토','해제 검토 요청')}>해제 검토</button>}{selected.status==='해제검토'&&<button type="button" className={drawer.primaryBtn} onClick={()=>patchSelected('종료','해제 승인')}>해제 승인</button>}{selected.status==='예약'&&<button type="button" className={drawer.dangerBtn} onClick={()=>patchSelected('철회','예약 철회')}>예약 철회</button>}<span className={drawer.spacer}/><button type="button" className={drawer.actionLink} onClick={()=>notify('회원에게 제재 안내를 재발송했습니다.')}>안내 재발송</button></>} stats={[{label:'누적 제재',value:`${selected.strike}회`},{label:'위험도',value:selected.severity},{label:'적용 기간',value:selected.duration}]} fields={[{label:'회원 구분',value:selected.memberRole},{label:'제재 유형',value:selected.type},{label:'위반 항목',value:selected.violation},{label:'제재 사유',value:selected.reason},{label:'적용 기간',value:`${selected.startedAt} ~ ${selected.endedAt}`},{label:'담당자',value:selected.assignee},{label:'승인 기준',value:selected.approval},{label:'연결 근거',value:`${selected.source} · ${selected.sourceId}`}]}><div className={drawer.sectionTitleLoose}>기능 영향 범위</div><div className={base.warningBox}>{selected.effect}</div><div className={drawer.sectionTitleLoose}>증빙 자료</div><div className={styles.evidenceList}>{selected.evidence.map((item)=><div key={item} className={styles.evidenceItem}>{item}</div>)}</div><div className={drawer.sectionTitleLoose}>운영 메모</div><div className={drawer.bodyText}>{selected.memo}</div>{selected.approval!=='자동 적용'&&<><div className={drawer.sectionTitleLoose}>승인 원칙</div><div className={styles.approvalBox}>{selected.approval}. 적용·해제 모두 처리 근거와 승인자를 이력에 남기며 기존 기록은 수정하지 않습니다.</div></>}</DetailDrawer>}
    {editorOpen&&<div className={shared.dialogOverlay} onMouseDown={(event)=>{if(event.target===event.currentTarget)setEditorOpen(false);}}><div className={`${shared.dialogBox} ${styles.dialogWide}`}><h2 className={shared.dialogTitle}>회원 제재 등록</h2><p className={shared.dialogBody}>대상 회원, 기능 영향 범위, 제재 기간과 근거를 확인한 후 등록합니다.</p><div className={base.formGrid}><Field label="대상 회원 *"><select value={form.memberId} onChange={(event)=>{const member=MEMBERS.find((item)=>item.id===event.target.value);setForm({...form,memberId:event.target.value,nickname:member?.nickname??'',memberRole:member?.role??'공통'});}}><option value="">회원 선택</option>{MEMBERS.map((item)=><option key={item.id} value={item.id}>{item.nickname} · {item.id}</option>)}</select></Field><Field label="제재 유형 *"><select value={form.type} onChange={(event)=>setForm({...form,type:event.target.value as SanctionType,duration:event.target.value==='경고'?'-':form.duration==='-'?'7일':form.duration})}>{TYPES.map((item)=><option key={item}>{item}</option>)}</select></Field><Field label="적용 기간"><select value={form.duration} onChange={(event)=>setForm({...form,duration:event.target.value as SanctionDuration})}><option>-</option><option>1일</option><option>3일</option><option>7일</option><option>30일</option><option>영구</option></select></Field><Field label="연결 근거 번호"><input value={form.sourceId} onChange={(event)=>setForm({...form,sourceId:event.target.value})} placeholder="신고 / 분쟁 / 탐지 번호"/></Field><Field label="제재 출처"><input value={form.source} onChange={(event)=>setForm({...form,source:event.target.value})}/></Field><Field label="제재 사유 *" wide><textarea value={form.reason} onChange={(event)=>setForm({...form,reason:event.target.value})} placeholder="회원에게 안내할 구체적인 정책 위반 내용"/></Field><Field label="운영 메모" wide><textarea value={form.memo} onChange={(event)=>setForm({...form,memo:event.target.value})} placeholder="내부 검토 내용, 해제 조건, 후속 확인 사항"/></Field></div><div className={styles.boundaryNote}>30일 또는 영구 계정 정지는 상위 관리자 승인 후 적용됩니다. 상품 숨김·삭제는 사용자 상품 관리에서 별도로 처리합니다.</div><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={()=>setEditorOpen(false)}>취소</button><button type="button" className={drawer.editConfirm} onClick={save}>제재 등록</button></div></div></div>}
    {toast&&<div className={base.toast}>{toast}</div>}
  </section>;
}

export function SanctionPolicyPage() {
  const [policies,setPolicies]=useState<SanctionPolicy[]>(SANCTION_POLICIES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [toast,setToast]=useState('');
  const selected=policies.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>policies.filter((item)=>(!status||item.status===status)&&(!search||`${item.id} ${item.name} ${item.violation} ${item.owner}`.toLowerCase().includes(search.toLowerCase()))),[policies,search,status]);
  const reset=()=>{setKeyword('');setSearch('');setStatus('');};
  const toggle=()=>{if(!selected)return;const next=selected.status==='중지'?'사용':'중지';setPolicies((items)=>items.map((item)=>item.id===selected.id?{...item,status:next,updatedAt:'2026-08-27'}:item));setToast(`${selected.id} 정책을 ${next} 상태로 변경했습니다.`);window.setTimeout(()=>setToast(''),2200);};
  const policyMeta:Record<SanctionPolicy['status'],{bg:string;fg:string}>={사용:{bg:'#ecfdf5',fg:'#047857'},'검토 필요':{bg:'#fff7ed',fg:'#c2410c'},중지:{bg:'#f4f4f5',fg:'#52525b'}};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.id,subtitle:item.updatedAt},{kind:'stack',title:item.name,subtitle:item.violation},{kind:'text',text:item.firstAction},{kind:'text',text:item.secondAction},{kind:'text',text:item.repeatAction,weight:600},{kind:'stack',title:item.approval,subtitle:`이의제기 ${item.appealDays}일`},{kind:'stack',title:item.owner,subtitle:item.automation},{kind:'badge',text:item.status,...policyMeta[item.status]}]}));
  return <section className={shared.page}>
    <PageHeading title="제재 정책" subtitle="정책 위반 단계별 제재 수위, 승인 기준, 이의제기 기간과 자동 연계 조건을 관리합니다."/>
    <Metrics items={[{label:'사용 정책',value:`${policies.filter((item)=>item.status==='사용').length}개`,note:'현재 운영 적용',tone:'up',dot:'#10b981'},{label:'검토 필요',value:`${policies.filter((item)=>item.status==='검토 필요').length}개`,note:'기준 개정 확인 필요',tone:'down',dot:'#f59e0b'},{label:'자동 연계',value:`${policies.filter((item)=>item.automation!=='없음').length}개`,note:'탐지·신고 연계',dot:'#4f7bd9'},{label:'중지 정책',value:`${policies.filter((item)=>item.status==='중지').length}개`,note:'신규 제재 미적용',dot:'#a1a1aa'}]}/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>정책 ID</option><option>정책명</option><option>위반 기준</option><option>담당 조직</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="정책 ID / 정책명 / 위반 기준 / 담당 조직"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>정책 상태</span><select aria-label="정책 상태" className={shared.selectSm} value={status} onChange={(event)=>setStatus(event.target.value)}><option value="">전체 정책 상태</option><option>사용</option><option>검토 필요</option><option>중지</option></select></label><span>기준일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="개"/><DataGrid columns={[{label:'정책 ID / 수정일'},{label:'정책 / 위반 기준'},{label:'1차 조치'},{label:'2차 조치'},{label:'반복 위반'},{label:'승인 / 이의제기'},{label:'담당 / 자동화'},{label:'상태'}]} rows={rows} gridTemplate="76px minmax(220px,1.35fr) 108px 90px 90px 150px 172px 75px" minWidth="1025px" empty={!filtered.length} emptyText="조건에 맞는 제재 정책이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0개'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`제재 정책 · ${selected.id}`} title={selected.name} status={selected.status} statusMeta={policyMeta[selected.status]} subtitle={`${selected.owner} · 최종 수정 ${selected.updatedAt}`} onClose={()=>setSelectedId(null)} actions={<><button type="button" className={selected.status==='중지'?drawer.primaryBtn:drawer.dangerBtn} onClick={toggle}>{selected.status==='중지'?'정책 사용':'정책 중지'}</button></>} stats={[{label:'이의제기',value:`${selected.appealDays}일`},{label:'승인 기준',value:selected.approval},{label:'담당 조직',value:selected.owner}]} fields={[{label:'위반 기준',value:selected.violation},{label:'자동 연계',value:selected.automation},{label:'최종 수정일',value:selected.updatedAt}]}><div className={drawer.sectionTitleLoose}>단계별 제재 수위</div><div className={styles.policyMatrix}><div className={styles.policyStep}><span>1차 위반</span><strong>{selected.firstAction}</strong></div><div className={styles.policyStep}><span>2차 위반</span><strong>{selected.secondAction}</strong></div><div className={styles.policyStep}><span>반복 위반</span><strong>{selected.repeatAction}</strong></div></div><div className={drawer.sectionTitleLoose}>운영 경계</div><div className={styles.boundaryNote}>정책은 제재 수위의 기본값을 제시합니다. 실제 적용 시 연결 근거와 회원 누적 이력을 확인하고, 장기·영구 제재는 별도 승인 절차를 거칩니다.</div></DetailDrawer>}
    {toast&&<div className={base.toast}>{toast}</div>}
  </section>;
}

export function SanctionHistoryPage() {
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [type,setType]=useState<SanctionType|''>('');
  const [action,setAction]=useState('');
  const [actor,setActor]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=SANCTION_AUDIT_LOGS.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>SANCTION_AUDIT_LOGS.filter((item)=>(!type||item.type===type)&&(!action||item.action===action)&&(!actor||(actor==='SYSTEM'?item.actor==='SYSTEM':item.actor!=='SYSTEM'))&&(!search||`${item.id} ${item.sanctionId} ${item.memberId} ${item.nickname} ${item.source} ${item.reason}`.toLowerCase().includes(search.toLowerCase()))),[action,actor,search,type]);
  const reset=()=>{setKeyword('');setSearch('');setType('');setAction('');setActor('');};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.occurredAt,subtitle:item.id},{kind:'stack',title:item.sanctionId,subtitle:item.source},{kind:'avatarText',title:item.nickname,subtitle:item.memberId,avatarChar:item.nickname[0],avatarBg:'#f4f4f5',avatarFg:'#52525b'},{kind:'pillText',text:item.type,...SANCTION_TYPE_META[item.type]},{kind:'text',text:item.action,weight:600},{kind:'text',text:item.before,color:'#71717a'},{kind:'text',text:item.after,weight:600},{kind:'stack',title:item.actor,subtitle:item.reason}]}));
  return <section className={shared.page}>
    <PageHeading title="제재 처리 이력" subtitle="제재 검토·승인·적용·해제의 변경 전후 값과 처리 근거를 수정 불가능한 감사 로그로 조회합니다."/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>로그 ID</option><option>제재번호</option><option>회원</option><option>근거번호</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="로그 / 제재번호 / 회원 / 신고·분쟁·탐지 번호"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>제재 유형</span><select aria-label="제재 유형" className={shared.selectSm} value={type} onChange={(event)=>setType(event.target.value as SanctionType|'')}><option value="">전체 제재 유형</option>{TYPES.map((item)=><option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>처리 유형</span><select aria-label="처리 유형" className={shared.selectSm} value={action} onChange={(event)=>setAction(event.target.value)}><option value="">전체 처리 유형</option>{[...new Set(SANCTION_AUDIT_LOGS.map((item)=>item.action))].map((item)=><option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>처리 주체</span><select aria-label="처리 주체" className={shared.selectSm} value={actor} onChange={(event)=>setActor(event.target.value)}><option value="">전체 처리 주체</option><option value="관리자">관리자</option><option>SYSTEM</option></select></label><span>처리일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-24"/><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-sanction-history.csv',['처리일','로그 ID','제재번호','회원','유형','처리','변경 전','변경 후','처리자','근거','사유'],filtered.map((item)=>[item.occurredAt,item.id,item.sanctionId,item.memberId,item.type,item.action,item.before,item.after,item.actor,item.source,item.reason]))}>다운로드</button></ResultBar><DataGrid columns={[{label:'처리일 / 로그 ID'},{label:'제재번호 / 근거'},{label:'대상 회원'},{label:'제재 유형'},{label:'처리'},{label:'변경 전'},{label:'변경 후'},{label:'처리자 / 사유'}]} rows={rows} gridTemplate="128px 124px 185px 92px 82px 58px 58px minmax(220px,1.35fr)" minWidth="995px" empty={!filtered.length} emptyText="조건에 맞는 제재 처리 이력이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`제재 감사 로그 · ${selected.id}`} title={selected.action} status="처리 이력" statusMeta={{bg:'#f4f4f5',fg:'#52525b'}} subtitle={`${selected.sanctionId} · ${selected.occurredAt}`} onClose={()=>setSelectedId(null)} stats={[{label:'회원',value:selected.nickname},{label:'제재 유형',value:selected.type},{label:'처리자',value:selected.actor}]} fields={[{label:'회원 ID',value:selected.memberId},{label:'연결 근거',value:selected.source},{label:'처리 사유',value:selected.reason}]}><div className={drawer.sectionTitleLoose}>상태 변경</div><div className={base.compare}><b>{selected.before}</b><span className={base.arrow}>→</span><span className={base.after}>{selected.after}</span></div><div className={drawer.sectionTitleLoose}>감사 원칙</div><div className={styles.boundaryNote}>제재 처리 이력은 수정하거나 삭제하지 않습니다. 오적용·정책 변경·이의제기 인용 시에도 기존 로그를 보존하고 철회 또는 해제 로그를 추가합니다.</div></DetailDrawer>}
  </section>;
}
