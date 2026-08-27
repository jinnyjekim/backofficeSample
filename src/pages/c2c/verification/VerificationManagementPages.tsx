import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../sales/SalesActivity.module.css';
import styles from './VerificationManagement.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from '../sales/SalesActivityShared';
import { downloadCsv, pages } from '../sales/salesActivityUtils';
import {
  VERIFICATION_AUDIT_LOGS,
  VERIFICATION_CASES,
  VERIFICATION_POLICIES,
  VERIFICATION_RISK_META,
  VERIFICATION_STATUS_META,
  type VerificationCase,
  type VerificationPolicy,
  type VerificationPurpose,
  type VerificationRisk,
  type VerificationStatus,
} from './verificationData';

type VerificationQuick='전체'|'심사 필요'|'자동 검증'|'보완 요청'|'실패'|'승인';
const QUICKS:VerificationQuick[]=['전체','심사 필요','자동 검증','보완 요청','실패','승인'];
const PURPOSES:VerificationPurpose[]=['기본 회원','판매자 등록','고액 거래','재인증','계정 복구'];
const PURPOSE_BY_PARAM:Record<string,VerificationPurpose>={basic:'기본 회원',seller:'판매자 등록',high_value:'고액 거래',reverification:'재인증',recovery:'계정 복구'};
const PARAM_BY_PURPOSE:Record<VerificationPurpose,string>={'기본 회원':'basic','판매자 등록':'seller','고액 거래':'high_value',재인증:'reverification','계정 복구':'recovery'};

function quickFromParam(value:string|null):VerificationQuick {
  if(value==='pending')return '심사 필요';
  if(value==='automatic')return '자동 검증';
  if(value==='supplement')return '보완 요청';
  if(value==='failed')return '실패';
  if(value==='approved')return '승인';
  return '전체';
}

function matchesQuick(item:VerificationCase,quick:VerificationQuick) {
  if(quick==='전체')return true;
  if(quick==='심사 필요')return item.status==='접수'||item.status==='수동심사';
  if(quick==='자동 검증')return item.status==='자동검증중';
  if(quick==='보완 요청')return item.status==='보완요청';
  return item.status===quick;
}

function checkTone(result:VerificationCase['checks'][number]['result']) {
  if(result==='일치')return styles.checkOk;
  if(result==='불일치')return styles.checkFail;
  return styles.checkWarn;
}

export function VerificationReviewPage() {
  const [searchParams,setSearchParams]=useSearchParams();
  const [cases,setCases]=useState<VerificationCase[]>(VERIFICATION_CASES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [risk,setRisk]=useState<VerificationRisk|''>('');
  const [assignee,setAssignee]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [decision,setDecision]=useState('');
  const [toast,setToast]=useState('');
  const purpose=PURPOSE_BY_PARAM[searchParams.get('purpose')??'']??'';
  const memberFilter=searchParams.get('member')??'';
  const quick=quickFromParam(searchParams.get('status'));
  const selected=cases.find((item)=>item.id===selectedId)??null;

  const filtered=useMemo(()=>cases.filter((item)=>matchesQuick(item,quick)&&(!purpose||item.purpose===purpose)&&(!memberFilter||item.memberId===memberFilter)&&(!risk||item.risk===risk)&&(!assignee||(assignee==='미배정'?item.assignee==='미배정':item.assignee!=='미배정'))&&(!search||`${item.id} ${item.memberId} ${item.nickname} ${item.purpose} ${item.providerTxnId} ${item.failureCode} ${item.reason}`.toLowerCase().includes(search.toLowerCase()))),[assignee,cases,memberFilter,purpose,quick,risk,search]);
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),2200);};
  const updateParams=(nextPurpose:VerificationPurpose|'',nextQuick:VerificationQuick)=>{const next=new URLSearchParams(searchParams);if(nextPurpose)next.set('purpose',PARAM_BY_PURPOSE[nextPurpose]);else next.delete('purpose');if(nextQuick==='심사 필요')next.set('status','pending');else if(nextQuick==='자동 검증')next.set('status','automatic');else if(nextQuick==='보완 요청')next.set('status','supplement');else if(nextQuick==='실패')next.set('status','failed');else if(nextQuick==='승인')next.set('status','approved');else next.delete('status');setSearchParams(next,{replace:true});};
  const reset=()=>{setKeyword('');setSearch('');setRisk('');setAssignee('');setSearchParams(new URLSearchParams(),{replace:true});};
  const patchSelected=(status:VerificationStatus,action:string,requireDecision=false)=>{if(!selected)return;if(requireDecision&&!decision.trim())return notify('심사 의견을 입력해 주세요.');setCases((items)=>items.map((item)=>item.id===selected.id?{...item,status,assignee:item.assignee==='미배정'?'admin01':item.assignee,reason:decision.trim()||action,verifiedAt:status==='승인'?'2026-08-27 13:45':item.verifiedAt,expiresAt:status==='승인'?'2027-08-27':item.expiresAt}:item));setDecision('');notify(`${selected.id} 인증을 ${action} 처리했습니다.`);};
  const retry=()=>{if(!selected)return;setCases((items)=>items.map((item)=>item.id===selected.id?{...item,purpose:'재인증',status:'접수',attempt:item.attempt+1,assignee:'미배정',failureCode:'-',reason:'회원에게 재인증 요청 발송'}:item));notify(`${selected.memberId} 회원에게 재인증 요청을 발송했습니다.`);};
  const rows:GridRow[]=filtered.map((item)=>{const issues=item.checks.filter((check)=>check.result!=='일치').length;return{id:item.id,onClick:()=>{setSelectedId(item.id);setDecision('');},bg:item.risk==='긴급'&&!['승인','만료'].includes(item.status)?'#fffafa':undefined,mark:item.risk==='긴급'&&!['승인','만료'].includes(item.status)?'inset 3px 0 #ef4444':undefined,cells:[{kind:'stack',title:item.id,subtitle:item.submittedAt},{kind:'avatarText',title:item.nickname,subtitle:`${item.memberId} · ${item.memberType}`,avatarChar:item.nickname[0],avatarBg:'#eef2ff',avatarFg:'#4338ca'},{kind:'pillText',text:item.purpose,bg:'#f4f4f5',fg:'#52525b'},{kind:'stack',title:item.methods.join(' · '),subtitle:item.provider},{kind:'badgeSub',text:item.risk,subText:`시도 ${item.attempt}회`,...VERIFICATION_RISK_META[item.risk]},{kind:'text',text:issues?`${issues}개 확인 필요`:'전체 일치',color:issues?'#dc2626':'#047857'},{kind:'badge',text:item.status,...VERIFICATION_STATUS_META[item.status]},{kind:'stack',title:item.assignee,subtitle:item.dueAt.slice(5)},{kind:'link',text:'심사'}]};});

  return <section className={shared.page}>
    <PageHeading title="인증 심사" subtitle="C2C 기본·판매자·고액 거래·재인증·계정 복구 인증을 하나의 심사 큐에서 자동 검증과 수동 판단으로 처리합니다." action={<button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-verification-cases.csv',['인증번호','회원','목적','방법','위험도','상태','시도','담당자','접수일','기한'],filtered.map((item)=>[item.id,item.memberId,item.purpose,item.methods.join('/'),item.risk,item.status,item.attempt,item.assignee,item.submittedAt,item.dueAt]))}>심사 목록 다운로드</button>}/>
    <Metrics items={[{label:'심사 필요',value:`${cases.filter((item)=>item.status==='접수'||item.status==='수동심사').length}건`,note:'배정·판단 필요',tone:'down',dot:'#f59e0b'},{label:'자동 검증중',value:`${cases.filter((item)=>item.status==='자동검증중').length}건`,note:'인증 사업자 응답 대기',dot:'#4f7bd9'},{label:'보완 요청',value:`${cases.filter((item)=>item.status==='보완요청').length}건`,note:'회원 자료 제출 대기',dot:'#06b6d4'},{label:'고위험',value:`${cases.filter((item)=>item.risk==='긴급'&&!['승인','만료'].includes(item.status)).length}건`,note:'계정 중복·명의 불일치',tone:'down',dot:'#ef4444'}]}/>
    <ControlArea><div className={shared.quickFilters}>{QUICKS.map((item)=><button type="button" key={item} className={`${shared.qfBtn} ${quick===item?base.quickActive:''}`} onClick={()=>updateParams(purpose,item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{cases.filter((entry)=>matchesQuick(entry,item)).length}</span></button>)}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><select className={shared.selectSm}><option>통합 검색</option><option>인증번호</option><option>회원</option><option>사업자 거래번호</option><option>실패 코드</option></select><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder={memberFilter?`${memberFilter} 회원의 인증만 표시 중`:'인증번호 / 회원 / 인증 사업자 거래번호 / 실패 사유'}/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><select className={shared.selectSm} value={purpose} onChange={(event)=>updateParams(event.target.value as VerificationPurpose|'',quick)}><option value="">전체 인증 목적</option>{PURPOSES.map((item)=><option key={item}>{item}</option>)}</select><select className={shared.selectSm} value={risk} onChange={(event)=>setRisk(event.target.value as VerificationRisk|'')}><option value="">전체 위험도</option><option>긴급</option><option>높음</option><option>주의</option><option>정상</option></select><select className={shared.selectSm} value={assignee} onChange={(event)=>setAssignee(event.target.value)}><option value="">전체 배정 상태</option><option>미배정</option><option value="배정">담당자 배정</option></select><span>접수일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20"/><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"/><DataGrid columns={[{label:'인증번호 / 접수일'},{label:'대상 회원'},{label:'인증 목적'},{label:'인증 방법 / 사업자'},{label:'위험 / 시도'},{label:'검증 결과'},{label:'처리 상태'},{label:'담당자 / 기한'},{label:'관리'}]} rows={rows} gridTemplate="150px 155px 100px minmax(175px,1.1fr) 90px 105px 85px 120px 55px" minWidth="1080px" empty={!filtered.length} emptyText="조건에 맞는 인증 심사 건이 없습니다." emptySubtext="인증 목적이나 처리 상태 필터를 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`본인 인증 심사 · ${selected.id}`} title={selected.nickname} status={selected.status} statusMeta={VERIFICATION_STATUS_META[selected.status]} subtitle={`${selected.purpose} · ${selected.memberId}`} onClose={()=>{setSelectedId(null);setDecision('');}} actions={<>{selected.status==='접수'&&<button type="button" className={drawer.primaryBtn} onClick={()=>patchSelected('자동검증중','자동 검증 시작')}>검증 시작</button>}{selected.status==='자동검증중'&&<button type="button" className={drawer.actionLink} onClick={()=>patchSelected('수동심사','수동 심사 전환')}>수동 심사</button>}{(selected.status==='실패'||selected.status==='만료')&&<button type="button" className={drawer.primaryBtn} onClick={retry}>재인증 요청</button>}<span className={drawer.spacer}/>{selected.status==='보완요청'&&<button type="button" className={drawer.actionLink} onClick={()=>patchSelected('수동심사','보완 자료 접수')}>보완 접수</button>}</>} stats={[{label:'위험도',value:selected.risk},{label:'인증 시도',value:`${selected.attempt}회`},{label:'처리 기한',value:selected.dueAt.slice(0,10)}]} fields={[{label:'회원 구분',value:selected.memberType},{label:'마스킹 성명',value:selected.maskedName},{label:'마스킹 휴대폰',value:selected.maskedPhone},{label:'마스킹 생년월일',value:selected.maskedBirth},{label:'인증 방법',value:selected.methods.join(' · ')},{label:'인증 사업자',value:selected.provider},{label:'사업자 거래번호',value:selected.providerTxnId},{label:'실패 코드',value:selected.failureCode},{label:'인증 유효기간',value:`${selected.verifiedAt} ~ ${selected.expiresAt}`},{label:'유입 사유',value:selected.source}]}><div className={drawer.sectionTitleLoose}>항목별 검증 결과</div><div className={styles.checkList}>{selected.checks.map((check)=><div key={check.label} className={styles.checkItem}><span>{check.label} · {check.detail}</span><strong className={checkTone(check.result)}>{check.result}</strong></div>)}</div>{selected.documents.length>0&&<><div className={drawer.sectionTitleLoose}>제출 자료</div><div className={styles.documentList}>{selected.documents.map((item)=><div key={item} className={styles.documentItem}>{item}</div>)}</div></>}<div className={drawer.sectionTitleLoose}>심사 의견</div><div className={styles.decisionBox}><textarea value={decision} onChange={(event)=>setDecision(event.target.value)} placeholder="판단 근거, 보완 항목 또는 실패 사유를 입력하세요."/><div className={styles.decisionActions}>{!['승인','실패','만료'].includes(selected.status)&&<><button type="button" className={drawer.editCancel} onClick={()=>patchSelected('보완요청','보완 요청',true)}>보완 요청</button><button type="button" className={drawer.dangerBtn} onClick={()=>patchSelected('실패','인증 실패',true)}>실패 처리</button><button type="button" className={drawer.editConfirm} onClick={()=>patchSelected('승인','인증 승인',true)}>승인</button></>}</div></div><div className={drawer.sectionTitleLoose}>개인정보 처리 원칙</div><div className={styles.boundaryNote}>원본 신분증·얼굴 이미지는 암호화 저장되며 이 화면에는 마스킹 정보만 표시합니다. 인증 결과는 판매·거래 가능 여부에 제공하되 원본 자료는 다른 운영 메뉴로 전달하지 않습니다.</div></DetailDrawer>}
    {toast&&<div className={base.toast}>{toast}</div>}
  </section>;
}

export function VerificationPolicyPage() {
  const [policies,setPolicies]=useState<VerificationPolicy[]>(VERIFICATION_POLICIES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [purpose,setPurpose]=useState<VerificationPurpose|''>('');
  const [status,setStatus]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [toast,setToast]=useState('');
  const selected=policies.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>policies.filter((item)=>(!purpose||item.purpose===purpose)&&(!status||item.status===status)&&(!search||`${item.id} ${item.name} ${item.purpose} ${item.provider} ${item.owner}`.toLowerCase().includes(search.toLowerCase()))),[policies,purpose,search,status]);
  const statusMeta:Record<VerificationPolicy['status'],{bg:string;fg:string}>={사용:{bg:'#ecfdf5',fg:'#047857'},'검토 필요':{bg:'#fff7ed',fg:'#c2410c'},중지:{bg:'#f4f4f5',fg:'#52525b'}};
  const reset=()=>{setKeyword('');setSearch('');setPurpose('');setStatus('');};
  const toggle=()=>{if(!selected)return;const next=selected.status==='중지'?'사용':'중지';setPolicies((items)=>items.map((item)=>item.id===selected.id?{...item,status:next,updatedAt:'2026-08-27'}:item));setToast(`${selected.id} 정책을 ${next} 상태로 변경했습니다.`);window.setTimeout(()=>setToast(''),2200);};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.id,subtitle:item.updatedAt},{kind:'stack',title:item.name,subtitle:item.purpose},{kind:'stack',title:item.requiredSteps.join(' · '),subtitle:item.provider},{kind:'text',text:item.validity},{kind:'text',text:item.retryLimit},{kind:'text',text:item.manualReview},{kind:'stack',title:item.retention,subtitle:item.owner},{kind:'badge',text:item.status,...statusMeta[item.status]},{kind:'link',text:'상세'}]}));
  return <section className={shared.page}>
    <PageHeading title="인증 정책" subtitle="인증 목적별 필수 단계, 인증 사업자, 유효기간, 재시도 제한, 수동 심사와 개인정보 보관 기준을 관리합니다."/>
    <Metrics items={[{label:'사용 정책',value:`${policies.filter((item)=>item.status==='사용').length}개`,note:'현재 인증 흐름 적용',tone:'up',dot:'#10b981'},{label:'수동 심사 포함',value:`${policies.filter((item)=>!item.manualReview.includes('없음')).length}개`,note:'예외·고위험 검토',dot:'#8b5cf6'},{label:'장기 보관',value:`${policies.filter((item)=>item.retention.includes('5년')).length}개`,note:'거래·복구 법정 기준',dot:'#4f7bd9'},{label:'검토 필요',value:`${policies.filter((item)=>item.status==='검토 필요').length}개`,note:'유효기간 기준 개정',tone:'down',dot:'#f59e0b'}]}/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><select className={shared.selectSm}><option>통합 검색</option><option>정책 ID</option><option>정책명</option><option>인증 사업자</option><option>담당 조직</option></select><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="정책 ID / 정책명 / 인증 사업자 / 담당 조직"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><select className={shared.selectSm} value={purpose} onChange={(event)=>setPurpose(event.target.value as VerificationPurpose|'')}><option value="">전체 인증 목적</option>{PURPOSES.map((item)=><option key={item}>{item}</option>)}</select><select className={shared.selectSm} value={status} onChange={(event)=>setStatus(event.target.value)}><option value="">전체 정책 상태</option><option>사용</option><option>검토 필요</option><option>중지</option></select><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="개"/><DataGrid columns={[{label:'정책 ID / 수정일'},{label:'정책 / 인증 목적'},{label:'필수 단계 / 사업자'},{label:'유효기간'},{label:'재시도'},{label:'수동 심사 기준'},{label:'보관 / 담당'},{label:'상태'},{label:'관리'}]} rows={rows} gridTemplate="125px 155px minmax(220px,1.3fr) 90px 95px minmax(175px,1fr) 155px 75px 55px" minWidth="1080px" empty={!filtered.length} emptyText="조건에 맞는 인증 정책이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0개'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`인증 정책 · ${selected.id}`} title={selected.name} status={selected.status} statusMeta={statusMeta[selected.status]} subtitle={`${selected.purpose} · ${selected.owner}`} onClose={()=>setSelectedId(null)} actions={<button type="button" className={selected.status==='중지'?drawer.primaryBtn:drawer.dangerBtn} onClick={toggle}>{selected.status==='중지'?'정책 사용':'정책 중지'}</button>} stats={[{label:'유효기간',value:selected.validity},{label:'재시도',value:selected.retryLimit},{label:'담당 조직',value:selected.owner}]} fields={[{label:'인증 사업자',value:selected.provider},{label:'수동 심사 기준',value:selected.manualReview},{label:'개인정보 보관',value:selected.retention},{label:'최종 수정일',value:selected.updatedAt}]}><div className={drawer.sectionTitleLoose}>필수 인증 단계</div><div className={styles.policySteps}>{selected.requiredSteps.map((item)=><span key={item} className={styles.policyStep}>{item}</span>)}</div><div className={drawer.sectionTitleLoose}>정책 적용 원칙</div><div className={styles.boundaryNote}>인증 정책 변경은 신규 요청부터 적용합니다. 진행 중이거나 완료된 인증 결과는 기존 정책 버전을 보존하며, 보관기간 단축은 개인정보·법무 검토 후 시행합니다.</div></DetailDrawer>}
    {toast&&<div className={base.toast}>{toast}</div>}
  </section>;
}

export function VerificationHistoryPage() {
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [purpose,setPurpose]=useState<VerificationPurpose|''>('');
  const [result,setResult]=useState('');
  const [actor,setActor]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=VERIFICATION_AUDIT_LOGS.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>VERIFICATION_AUDIT_LOGS.filter((item)=>(!purpose||item.purpose===purpose)&&(!result||item.result===result)&&(!actor||(actor==='SYSTEM'?item.actor==='SYSTEM':item.actor!=='SYSTEM'))&&(!search||`${item.id} ${item.verificationId} ${item.memberId} ${item.nickname} ${item.providerTxnId} ${item.reason}`.toLowerCase().includes(search.toLowerCase()))),[actor,purpose,result,search]);
  const reset=()=>{setKeyword('');setSearch('');setPurpose('');setResult('');setActor('');};
  const resultMeta:Record<(typeof VERIFICATION_AUDIT_LOGS)[number]['result'],{bg:string;fg:string}>={성공:{bg:'#ecfdf5',fg:'#047857'},실패:{bg:'#fef2f2',fg:'#dc2626'},보류:{bg:'#fff7ed',fg:'#c2410c'}};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.occurredAt,subtitle:item.id},{kind:'stack',title:item.verificationId,subtitle:item.providerTxnId},{kind:'avatarText',title:item.nickname,subtitle:item.memberId,avatarChar:item.nickname[0],avatarBg:'#f4f4f5',avatarFg:'#52525b'},{kind:'pillText',text:item.purpose,bg:'#f4f4f5',fg:'#52525b'},{kind:'text',text:item.action,weight:600},{kind:'text',text:item.before,color:'#71717a'},{kind:'text',text:item.after,weight:600},{kind:'badge',text:item.result,...resultMeta[item.result]},{kind:'stack',title:item.actor,subtitle:item.reason},{kind:'link',text:'상세'}]}));
  return <section className={shared.page}>
    <PageHeading title="인증 처리 이력" subtitle="본인 인증 접수·자동 검증·수동 심사·보완·승인·실패의 상태 변경과 근거를 마스킹된 감사 로그로 조회합니다."/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><select className={shared.selectSm}><option>통합 검색</option><option>로그 ID</option><option>인증번호</option><option>회원</option><option>사업자 거래번호</option></select><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="로그 / 인증번호 / 회원 / 인증 사업자 거래번호"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><select className={shared.selectSm} value={purpose} onChange={(event)=>setPurpose(event.target.value as VerificationPurpose|'')}><option value="">전체 인증 목적</option>{PURPOSES.map((item)=><option key={item}>{item}</option>)}</select><select className={shared.selectSm} value={result} onChange={(event)=>setResult(event.target.value)}><option value="">전체 처리 결과</option><option>성공</option><option>실패</option><option>보류</option></select><select className={shared.selectSm} value={actor} onChange={(event)=>setActor(event.target.value)}><option value="">전체 처리 주체</option><option value="관리자">관리자</option><option>SYSTEM</option></select><span>처리일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-26"/><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-verification-history.csv',['처리일','로그 ID','인증번호','회원','목적','처리','변경 전','변경 후','결과','처리자','사업자 거래번호','사유'],filtered.map((item)=>[item.occurredAt,item.id,item.verificationId,item.memberId,item.purpose,item.action,item.before,item.after,item.result,item.actor,item.providerTxnId,item.reason]))}>감사 로그 다운로드</button></ResultBar><DataGrid columns={[{label:'처리일 / 로그 ID'},{label:'인증번호 / 사업자 거래'},{label:'대상 회원'},{label:'인증 목적'},{label:'처리'},{label:'변경 전'},{label:'변경 후'},{label:'결과'},{label:'처리자 / 사유'},{label:'관리'}]} rows={rows} gridTemplate="160px 165px 145px 100px 120px 85px 95px 70px minmax(210px,1.25fr) 55px" minWidth="1160px" empty={!filtered.length} emptyText="조건에 맞는 인증 처리 이력이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`인증 감사 로그 · ${selected.id}`} title={selected.action} status={selected.result} statusMeta={resultMeta[selected.result]} subtitle={`${selected.verificationId} · ${selected.occurredAt}`} onClose={()=>setSelectedId(null)} stats={[{label:'회원',value:selected.nickname},{label:'인증 목적',value:selected.purpose},{label:'처리자',value:selected.actor}]} fields={[{label:'회원 ID',value:selected.memberId},{label:'사업자 거래번호',value:selected.providerTxnId},{label:'처리 사유',value:selected.reason}]}><div className={drawer.sectionTitleLoose}>상태 변경</div><div className={styles.auditResult}><div><span>변경 전</span><strong>{selected.before}</strong></div><div><span>변경 후</span><strong>{selected.after}</strong></div></div><div className={drawer.sectionTitleLoose}>감사 원칙</div><div className={styles.boundaryNote}>인증 처리 이력에는 마스킹 식별자와 결과만 저장합니다. 원본 신분증·얼굴 이미지와 주민등록번호는 감사 로그 및 다운로드에 포함하지 않으며 기존 로그는 수정·삭제하지 않습니다.</div></DetailDrawer>}
  </section>;
}
