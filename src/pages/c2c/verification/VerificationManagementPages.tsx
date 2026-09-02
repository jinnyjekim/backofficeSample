import { CommonDatePicker, CommonSelect } from '../../../components/common';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../sales/SalesActivity.module.css';
import styles from './VerificationManagement.module.css';
import { DetailDrawer, GridArea, PageHeading } from '../sales/SalesActivityShared';
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
type PolicyQuick='전체'|VerificationPolicy['status'];
const POLICY_QUICKS:PolicyQuick[]=['전체','사용','검토 필요','중지'];
type HistoryQuick='전체'|'성공'|'보류'|'실패';
const HISTORY_QUICKS:HistoryQuick[]=['전체','성공','보류','실패'];
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

function checkGridTone(result:VerificationCase['checks'][number]['result']) {
  if(result==='일치')return 'success' as const;
  if(result==='불일치')return 'error' as const;
  if(result==='확인 필요')return 'warning' as const;
  return 'muted' as const;
}

function shortCheckLabel(label:string) {
  return label
    .replace('휴대폰 명의','휴대폰')
    .replace('신분증 진위','신분증')
    .replace('출금계좌 예금주','계좌')
    .replace('얼굴 유사도','얼굴')
    .replace('제재 계정 중복','중복')
    .replace('기존 명의 비교','명의 비교')
    .replace('보안 로그','보안로그');
}

export function VerificationReviewPage() {
  const [searchParams,setSearchParams]=useSearchParams();
  const [cases,setCases]=useState<VerificationCase[]>(VERIFICATION_CASES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [risk,setRisk]=useState<VerificationRisk|''>('');
  const [submittedRange,setSubmittedRange]=useState<[string|null,string|null]>(['2026-08-20','2026-08-27']);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [decision,setDecision]=useState('');
  const [toast,setToast]=useState('');
  const purpose=PURPOSE_BY_PARAM[searchParams.get('purpose')??'']??'';
  const memberFilter=searchParams.get('member')??'';
  const quick=quickFromParam(searchParams.get('status'));
  const selected=cases.find((item)=>item.id===selectedId)??null;

  const filtered=useMemo(()=>cases.filter((item)=>{
    const submittedDate=item.submittedAt.slice(0,10);
    const [from,to]=submittedRange;
    const searchTarget=`${item.id} ${item.memberId} ${item.nickname} ${item.purpose} ${item.providerTxnId} ${item.failureCode} ${item.reason}`;
    return matchesQuick(item,quick)&&(!purpose||item.purpose===purpose)&&(!memberFilter||item.memberId===memberFilter)&&(!risk||item.risk===risk)&&(!from||submittedDate>=from)&&(!to||submittedDate<=to)&&(!search||searchTarget.toLowerCase().includes(search.toLowerCase()));
  }),[cases,memberFilter,purpose,quick,risk,search,submittedRange]);
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),2200);};
  const updateParams=(nextPurpose:VerificationPurpose|'',nextQuick:VerificationQuick)=>{const next=new URLSearchParams(searchParams);if(nextPurpose)next.set('purpose',PARAM_BY_PURPOSE[nextPurpose]);else next.delete('purpose');if(nextQuick==='심사 필요')next.set('status','pending');else if(nextQuick==='자동 검증')next.set('status','automatic');else if(nextQuick==='보완 요청')next.set('status','supplement');else if(nextQuick==='실패')next.set('status','failed');else if(nextQuick==='승인')next.set('status','approved');else next.delete('status');setSearchParams(next,{replace:true});};
  const reset=()=>{setKeyword('');setSearch('');setRisk('');setSubmittedRange([null,null]);setSearchParams(new URLSearchParams(),{replace:true});};
  const autoAssign=()=>{const targets=cases.filter((item)=>item.assignee==='미배정'&&!['승인','실패','만료'].includes(item.status));if(!targets.length)return notify('자동 배정할 미배정 심사 건이 없습니다.');setCases((items)=>items.map((item)=>item.assignee==='미배정'&&!['승인','실패','만료'].includes(item.status)?{...item,assignee:'admin01'}:item));notify(`미배정 심사 ${targets.length}건을 자동 배정했습니다.`);};
  const patchSelected=(status:VerificationStatus,action:string,requireDecision=false)=>{if(!selected)return;if(requireDecision&&!decision.trim())return notify('심사 의견을 입력해 주세요.');setCases((items)=>items.map((item)=>item.id===selected.id?{...item,status,assignee:item.assignee==='미배정'?'admin01':item.assignee,reason:decision.trim()||action,verifiedAt:status==='승인'?'2026-08-27 13:45':item.verifiedAt,expiresAt:status==='승인'?'2027-08-27':item.expiresAt}:item));setDecision('');notify(`${selected.id} 인증을 ${action} 처리했습니다.`);};
  const retry=()=>{if(!selected)return;setCases((items)=>items.map((item)=>item.id===selected.id?{...item,purpose:'재인증',status:'접수',attempt:item.attempt+1,assignee:'미배정',failureCode:'-',reason:'회원에게 재인증 요청 발송'}:item));notify(`${selected.memberId} 회원에게 재인증 요청을 발송했습니다.`);};
  const slaExceeded=cases.filter((item)=>!['승인','만료'].includes(item.status)&&item.dueAt<='2026-08-27 14:00').length;
  const highRiskCount=cases.filter((item)=>item.risk==='긴급').length;
  const quickCount=(value:VerificationQuick)=>cases.filter((item)=>matchesQuick(item,value)).length;
  const downloadCases=()=>downloadCsv('c2c-verification-cases.csv',['인증번호','회원','목적','방법','검증 결과','위험도','상태','시도','담당자','접수일','기한'],filtered.map((item)=>[item.id,item.memberId,item.purpose,item.methods.join('/'),item.checks.map((check)=>`${check.label}:${check.result}`).join('/'),item.risk,item.status,item.attempt,item.assignee,item.submittedAt,item.dueAt]));
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>{setSelectedId(item.id);setDecision('');},cells:[{kind:'stack',title:item.id,subtitle:item.submittedAt},{kind:'avatarText',title:item.nickname,subtitle:item.memberId,avatarChar:item.nickname[0],avatarBg:'#f4f4f5',avatarFg:'#71717a'},{kind:'pillText',text:item.purpose,bg:'#f4f4f5',fg:'#52525b'},{kind:'stack',title:item.methods.join(' · '),subtitle:item.provider},{kind:'checkGroup',items:item.checks.map((check)=>({label:shortCheckLabel(check.label),tone:checkGridTone(check.result)}))},{kind:'badgeSub',text:item.risk,subText:`시도 ${item.attempt}회`,...VERIFICATION_RISK_META[item.risk]},{kind:'badge',text:item.status,...VERIFICATION_STATUS_META[item.status]},{kind:'stack',title:item.assignee,subtitle:item.dueAt.slice(5)}]}));

  return <section className={shared.page}>
    <PageHeading title="인증 심사" subtitle="기본·판매자·고액 거래·재인증·계정 복구 인증을 하나의 심사 큐에서 자동 검증과 수동 판단으로 처리합니다." action={<><span className={styles.slaText}>SLA 초과 {slaExceeded}건</span><button type="button" className={shared.downloadBtn} onClick={downloadCases}>심사 목록 다운로드</button><button type="button" className={styles.reviewPrimaryBtn} onClick={autoAssign}>미배정 자동 배정</button></>}/>
    <div className={styles.reviewAlert} role="status">
      <span className={styles.reviewAlertIcon} aria-hidden="true">!</span>
      <strong>고위험 {highRiskCount}건 · 즉시 판단 필요</strong>
      <span>계정 중복 의심 · 명의 불일치 신호가 감지된 건입니다.</span>
      <button type="button" onClick={()=>setRisk('긴급')}>고위험만 보기</button>
    </div>
    <form className={styles.reviewToolbar} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}>
      <div className={styles.reviewQuickFilters} aria-label="심사 처리 상태">
        {QUICKS.map((item)=><button key={item} type="button" aria-pressed={quick===item} className={quick===item?styles.reviewQuickActive:styles.reviewQuickButton} onClick={()=>updateParams(purpose,item)}>{item} <span>{quickCount(item)}</span></button>)}
      </div>
      <div className={styles.reviewFilterControls}>
        <input aria-label="인증 심사 검색" className={styles.reviewSearch} value={keyword} onChange={(event)=>{setKeyword(event.target.value);setSearch(event.target.value.trim());}} placeholder={memberFilter?`${memberFilter} 회원의 인증만 표시 중`:'인증번호 / 회원 / 사업자 / 실패 사유'}/>
        <CommonSelect aria-label="인증 목적" className={styles.reviewSelect} size="sm" value={purpose} placeholder="전체 인증 목적" options={[{label:'전체 인증 목적',value:''},...PURPOSES.map((value)=>({label:value,value}))]} onChange={(value)=>updateParams(value as VerificationPurpose|'',quick)}/>
        <CommonSelect aria-label="위험도" className={styles.reviewSelect} size="sm" value={risk} placeholder="전체 위험도" options={['','긴급','높음','주의','정상'].map((value)=>({label:value||'전체 위험도',value}))} onChange={(value)=>setRisk(value as VerificationRisk|'')}/>
        <CommonDatePicker aria-label="접수일" className={styles.reviewDateRange} mode="range" size="sm" clearable={false} value={submittedRange} onChange={(value)=>setSubmittedRange(value as [string|null,string|null])} placeholder={['시작일','종료일']}/>
        <button type="button" className={styles.reviewReset} onClick={reset}>초기화</button>
      </div>
    </form>
    <GridArea><div className={styles.queueCard}><div className={styles.queueHeader}><div><strong>심사 큐</strong><span>전체 {filtered.length}건</span></div><span>정렬 · 위험도순</span></div><DataGrid columns={[{label:'인증번호 / 접수일'},{label:'대상 회원'},{label:'인증 목적'},{label:'인증 방법 / 사업자'},{label:'항목별 검증'},{label:'위험 / 시도'},{label:'처리 상태'},{label:'담당자 / 기한'}]} rows={rows} gridTemplate="130px 185px 82px minmax(175px,1fr) minmax(260px,1.6fr) 72px 85px 84px" minWidth="1140px" empty={!filtered.length} emptyText="조건에 맞는 인증 심사 건이 없습니다." emptySubtext="인증 목적이나 처리 상태 필터를 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></div></GridArea>
    {selected&&<DetailDrawer eyebrow={`본인 인증 심사 · ${selected.id}`} title={selected.nickname} status={selected.status} statusMeta={VERIFICATION_STATUS_META[selected.status]} subtitle={`${selected.purpose} · ${selected.memberId}`} onClose={()=>{setSelectedId(null);setDecision('');}} actions={<>{selected.status==='접수'&&<button type="button" className={drawer.primaryBtn} onClick={()=>patchSelected('자동검증중','자동 검증 시작')}>검증 시작</button>}{selected.status==='자동검증중'&&<button type="button" className={drawer.actionLink} onClick={()=>patchSelected('수동심사','수동 심사 전환')}>수동 심사</button>}{(selected.status==='실패'||selected.status==='만료')&&<button type="button" className={drawer.primaryBtn} onClick={retry}>재인증 요청</button>}<span className={drawer.spacer}/>{selected.status==='보완요청'&&<button type="button" className={drawer.actionLink} onClick={()=>patchSelected('수동심사','보완 자료 접수')}>보완 접수</button>}</>} stats={[{label:'위험도',value:selected.risk},{label:'인증 시도',value:`${selected.attempt}회`},{label:'처리 기한',value:selected.dueAt.slice(0,10)}]} fields={[{label:'회원 구분',value:selected.memberType},{label:'마스킹 성명',value:selected.maskedName},{label:'마스킹 휴대폰',value:selected.maskedPhone},{label:'마스킹 생년월일',value:selected.maskedBirth},{label:'인증 방법',value:selected.methods.join(' · ')},{label:'인증 사업자',value:selected.provider},{label:'사업자 거래번호',value:selected.providerTxnId},{label:'실패 코드',value:selected.failureCode},{label:'인증 유효기간',value:`${selected.verifiedAt} ~ ${selected.expiresAt}`},{label:'유입 사유',value:selected.source}]}><div className={drawer.sectionTitleLoose}>항목별 검증 결과</div><div className={styles.checkList}>{selected.checks.map((check)=><div key={check.label} className={styles.checkItem}><span>{check.label} · {check.detail}</span><strong className={checkTone(check.result)}>{check.result}</strong></div>)}</div>{selected.documents.length>0&&<><div className={drawer.sectionTitleLoose}>제출 자료</div><div className={styles.documentList}>{selected.documents.map((item)=><div key={item} className={styles.documentItem}>{item}</div>)}</div></>}<div className={drawer.sectionTitleLoose}>심사 의견</div><div className={styles.decisionBox}><textarea value={decision} onChange={(event)=>setDecision(event.target.value)} placeholder="판단 근거, 보완 항목 또는 실패 사유를 입력하세요."/><div className={styles.decisionActions}>{!['승인','실패','만료'].includes(selected.status)&&<><button type="button" className={drawer.editCancel} onClick={()=>patchSelected('보완요청','보완 요청',true)}>보완 요청</button><button type="button" className={drawer.dangerBtn} onClick={()=>patchSelected('실패','인증 실패',true)}>실패 처리</button><button type="button" className={drawer.editConfirm} onClick={()=>patchSelected('승인','인증 승인',true)}>승인</button></>}</div></div><div className={drawer.sectionTitleLoose}>개인정보 처리 원칙</div><div className={styles.boundaryNote}>원본 신분증·얼굴 이미지는 암호화 저장되며 이 화면에는 마스킹 정보만 표시합니다. 인증 결과는 판매·거래 가능 여부에 제공하되 원본 자료는 다른 운영 메뉴로 전달하지 않습니다.</div></DetailDrawer>}
    {toast&&<div className={base.toast}>{toast}</div>}
  </section>;
}

export function VerificationPolicyPage() {
  const [policies,setPolicies]=useState<VerificationPolicy[]>(VERIFICATION_POLICIES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [purpose,setPurpose]=useState<VerificationPurpose|''>('');
  const [status,setStatus]=useState<PolicyQuick>('전체');
  const [updatedRange,setUpdatedRange]=useState<[string|null,string|null]>([null,null]);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [toast,setToast]=useState('');
  const selected=policies.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>policies.filter((item)=>{
    const [from,to]=updatedRange;
    return (!purpose||item.purpose===purpose)&&(status==='전체'||item.status===status)&&(!from||item.updatedAt>=from)&&(!to||item.updatedAt<=to)&&(!search||`${item.id} ${item.name} ${item.purpose} ${item.provider} ${item.owner}`.toLowerCase().includes(search.toLowerCase()));
  }).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),[policies,purpose,search,status,updatedRange]);
  const statusMeta:Record<VerificationPolicy['status'],{bg:string;fg:string}>={사용:{bg:'#ecfdf5',fg:'#047857'},'검토 필요':{bg:'#fff7ed',fg:'#c2410c'},중지:{bg:'#f4f4f5',fg:'#52525b'}};
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),2200);};
  const reset=()=>{setKeyword('');setSearch('');setPurpose('');setStatus('전체');setUpdatedRange([null,null]);};
  const toggle=()=>{if(!selected)return;const next=selected.status==='중지'?'사용':'중지';setPolicies((items)=>items.map((item)=>item.id===selected.id?{...item,status:next,updatedAt:'2026-08-27'}:item));setToast(`${selected.id} 정책을 ${next} 상태로 변경했습니다.`);window.setTimeout(()=>setToast(''),2200);};
  const createDraft=()=>{const nextNumber=Math.max(...policies.map((item)=>Number(item.id.replace('KYP-',''))||0))+1;const draft:VerificationPolicy={id:`KYP-${String(nextNumber).padStart(3,'0')}`,name:'신규 인증 정책 초안',purpose:'기본 회원',requiredSteps:['휴대폰 명의 확인'],provider:'사업자 미지정',validity:'1년',retryLimit:'일 3회',manualReview:'기준 설정 필요',retention:'검토 필요',status:'검토 필요',owner:'정책 관리',updatedAt:'2026-08-27'};setPolicies((items)=>[draft,...items]);setSelectedId(draft.id);notify(`${draft.id} 정책 초안을 생성했습니다.`);};
  const quickCount=(value:PolicyQuick)=>policies.filter((item)=>value==='전체'||item.status===value).length;
  const reviewCount=quickCount('검토 필요');
  const downloadPolicies=()=>downloadCsv('c2c-verification-policies.csv',['정책 ID','정책명','인증 목적','필수 단계','사업자','유효기간','재시도','수동 심사 기준','보관','담당','상태','수정일'],filtered.map((item)=>[item.id,item.name,item.purpose,item.requiredSteps.join('/'),item.provider,item.validity,item.retryLimit,item.manualReview,item.retention,item.owner,item.status,item.updatedAt]));
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.id,subtitle:item.updatedAt},{kind:'stack',title:item.name,subtitle:item.purpose},{kind:'stack',title:item.requiredSteps.join(' · '),subtitle:item.provider},{kind:'text',text:item.validity},{kind:'text',text:item.retryLimit},{kind:'text',text:item.manualReview},{kind:'stack',title:item.retention,subtitle:item.owner},{kind:'badge',text:item.status,...statusMeta[item.status]}]}));
  return <section className={shared.page}>
    <PageHeading title="인증 정책" subtitle="인증 목적별 필수 단계, 인증 사업자, 유효기간, 재시도 제한, 수동 심사와 개인정보 보관 기준을 관리합니다." action={<><button type="button" className={shared.downloadBtn} onClick={downloadPolicies}>정책 목록 다운로드</button><button type="button" className={styles.reviewPrimaryBtn} onClick={createDraft}>정책 초안 등록</button></>}/>
    <div className={`${styles.reviewAlert} ${styles.reviewAlertWarning}`} role="status">
      <span className={styles.reviewAlertIcon} aria-hidden="true">!</span>
      <strong>검토 필요 {reviewCount}건 · 정책 기준 확인 필요</strong>
      <span>유효기간, 수동 심사 또는 개인정보 보관 기준을 확정해야 하는 정책입니다.</span>
      <button type="button" onClick={()=>setStatus('검토 필요')}>검토 정책 보기</button>
    </div>
    <form className={styles.reviewToolbar} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}>
      <div className={styles.reviewQuickFilters} aria-label="인증 정책 상태">
        {POLICY_QUICKS.map((item)=><button key={item} type="button" aria-pressed={status===item} className={status===item?styles.reviewQuickActive:styles.reviewQuickButton} onClick={()=>setStatus(item)}>{item} <span>{quickCount(item)}</span></button>)}
      </div>
      <div className={styles.reviewFilterControls}>
        <input aria-label="인증 정책 검색" className={styles.reviewSearch} value={keyword} onChange={(event)=>{setKeyword(event.target.value);setSearch(event.target.value.trim());}} placeholder="정책 ID / 정책명 / 사업자 / 담당 조직"/>
        <CommonSelect aria-label="인증 목적" className={styles.reviewSelect} size="sm" value={purpose} placeholder="전체 인증 목적" options={[{label:'전체 인증 목적',value:''},...PURPOSES.map((value)=>({label:value,value}))]} onChange={(value)=>setPurpose(value as VerificationPurpose|'')}/>
        <CommonDatePicker aria-label="수정일" className={styles.reviewDateRange} mode="range" size="sm" clearable={false} value={updatedRange} onChange={(value)=>setUpdatedRange(value as [string|null,string|null])} placeholder={['수정 시작일','수정 종료일']}/>
        <button type="button" className={styles.reviewReset} onClick={reset}>초기화</button>
      </div>
    </form>
    <GridArea><div className={styles.queueCard}><div className={styles.queueHeader}><div><strong>인증 정책</strong><span>전체 {filtered.length}개</span></div><span>정렬 · 최근 수정순</span></div><DataGrid columns={[{label:'정책 ID / 수정일'},{label:'정책 / 인증 목적'},{label:'필수 단계 / 사업자'},{label:'유효기간'},{label:'재시도'},{label:'수동 심사 기준'},{label:'보관 / 담당'},{label:'상태'}]} rows={rows} gridTemplate="76px 124px minmax(220px,1.3fr) 60px 72px minmax(175px,1fr) 155px 75px" minWidth="1000px" empty={!filtered.length} emptyText="조건에 맞는 인증 정책이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0개'}/></div></GridArea>
    {selected&&<DetailDrawer eyebrow={`인증 정책 · ${selected.id}`} title={selected.name} status={selected.status} statusMeta={statusMeta[selected.status]} subtitle={`${selected.purpose} · ${selected.owner}`} onClose={()=>setSelectedId(null)} actions={<button type="button" className={selected.status==='중지'?drawer.primaryBtn:drawer.dangerBtn} onClick={toggle}>{selected.status==='중지'?'정책 사용':'정책 중지'}</button>} stats={[{label:'유효기간',value:selected.validity},{label:'재시도',value:selected.retryLimit},{label:'담당 조직',value:selected.owner}]} fields={[{label:'인증 사업자',value:selected.provider},{label:'수동 심사 기준',value:selected.manualReview},{label:'개인정보 보관',value:selected.retention},{label:'최종 수정일',value:selected.updatedAt}]}><div className={drawer.sectionTitleLoose}>필수 인증 단계</div><div className={styles.policySteps}>{selected.requiredSteps.map((item)=><span key={item} className={styles.policyStep}>{item}</span>)}</div><div className={drawer.sectionTitleLoose}>정책 적용 원칙</div><div className={styles.boundaryNote}>인증 정책 변경은 신규 요청부터 적용합니다. 진행 중이거나 완료된 인증 결과는 기존 정책 버전을 보존하며, 보관기간 단축은 개인정보·법무 검토 후 시행합니다.</div></DetailDrawer>}
    {toast&&<div className={base.toast}>{toast}</div>}
  </section>;
}

export function VerificationHistoryPage() {
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [purpose,setPurpose]=useState<VerificationPurpose|''>('');
  const [result,setResult]=useState<HistoryQuick>('전체');
  const [actor,setActor]=useState('');
  const [occurredRange,setOccurredRange]=useState<[string|null,string|null]>(['2026-08-20','2026-08-27']);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=VERIFICATION_AUDIT_LOGS.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>VERIFICATION_AUDIT_LOGS.filter((item)=>{
    const occurredDate=item.occurredAt.slice(0,10);
    const [from,to]=occurredRange;
    return (!purpose||item.purpose===purpose)&&(result==='전체'||item.result===result)&&(!actor||(actor==='SYSTEM'?item.actor==='SYSTEM':item.actor!=='SYSTEM'))&&(!from||occurredDate>=from)&&(!to||occurredDate<=to)&&(!search||`${item.id} ${item.verificationId} ${item.memberId} ${item.nickname} ${item.providerTxnId} ${item.reason}`.toLowerCase().includes(search.toLowerCase()));
  }).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)),[actor,occurredRange,purpose,result,search]);
  const reset=()=>{setKeyword('');setSearch('');setPurpose('');setResult('전체');setActor('');setOccurredRange([null,null]);};
  const resultMeta:Record<(typeof VERIFICATION_AUDIT_LOGS)[number]['result'],{bg:string;fg:string}>={성공:{bg:'#ecfdf5',fg:'#047857'},실패:{bg:'#fef2f2',fg:'#dc2626'},보류:{bg:'#fff7ed',fg:'#c2410c'}};
  const quickCount=(value:HistoryQuick)=>VERIFICATION_AUDIT_LOGS.filter((item)=>value==='전체'||item.result===value).length;
  const failureCount=quickCount('실패');
  const downloadHistory=()=>downloadCsv('c2c-verification-history.csv',['처리일','로그 ID','인증번호','회원','목적','처리','변경 전','변경 후','결과','처리자','사업자 거래번호','사유'],filtered.map((item)=>[item.occurredAt,item.id,item.verificationId,item.memberId,item.purpose,item.action,item.before,item.after,item.result,item.actor,item.providerTxnId,item.reason]));
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.occurredAt,subtitle:item.id},{kind:'stack',title:item.verificationId,subtitle:item.providerTxnId},{kind:'avatarText',title:item.nickname,subtitle:item.memberId,avatarChar:item.nickname[0],avatarBg:'#f4f4f5',avatarFg:'#52525b'},{kind:'pillText',text:item.purpose,bg:'#f4f4f5',fg:'#52525b'},{kind:'text',text:item.action,weight:600},{kind:'text',text:item.before,color:'#71717a'},{kind:'text',text:item.after,weight:600},{kind:'badge',text:item.result,...resultMeta[item.result]},{kind:'stack',title:item.actor,subtitle:item.reason}]}));
  return <section className={shared.page}>
    <PageHeading title="인증 처리 이력" subtitle="본인 인증 접수·자동 검증·수동 심사·보완·승인·실패의 상태 변경과 근거를 마스킹된 감사 로그로 조회합니다." action={<button type="button" className={shared.downloadBtn} onClick={downloadHistory}>감사 로그 다운로드</button>}/>
    <div className={styles.reviewAlert} role="status">
      <span className={styles.reviewAlertIcon} aria-hidden="true">!</span>
      <strong>실패 이력 {failureCount}건 · 처리 근거 확인 필요</strong>
      <span>인증 실패 사유와 자동·수동 처리 주체를 감사 로그에서 확인할 수 있습니다.</span>
      <button type="button" onClick={()=>setResult('실패')}>실패 이력 보기</button>
    </div>
    <form className={styles.reviewToolbar} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}>
      <div className={styles.reviewQuickFilters} aria-label="인증 처리 결과">
        {HISTORY_QUICKS.map((item)=><button key={item} type="button" aria-pressed={result===item} className={result===item?styles.reviewQuickActive:styles.reviewQuickButton} onClick={()=>setResult(item)}>{item} <span>{quickCount(item)}</span></button>)}
      </div>
      <div className={styles.reviewFilterControls}>
        <input aria-label="인증 처리 이력 검색" className={styles.reviewSearch} value={keyword} onChange={(event)=>{setKeyword(event.target.value);setSearch(event.target.value.trim());}} placeholder="로그 ID / 인증번호 / 회원 / 사업자 거래번호"/>
        <CommonSelect aria-label="인증 목적" className={styles.reviewSelect} size="sm" value={purpose} placeholder="전체 인증 목적" options={[{label:'전체 인증 목적',value:''},...PURPOSES.map((value)=>({label:value,value}))]} onChange={(value)=>setPurpose(value as VerificationPurpose|'')}/>
        <CommonSelect aria-label="처리 주체" className={styles.reviewSelect} size="sm" value={actor} placeholder="전체 처리 주체" options={[{label:'전체 처리 주체',value:''},{label:'관리자',value:'관리자'},{label:'SYSTEM',value:'SYSTEM'}]} onChange={(value)=>setActor(String(value))}/>
        <CommonDatePicker aria-label="처리일" className={styles.reviewDateRange} mode="range" size="sm" clearable={false} value={occurredRange} onChange={(value)=>setOccurredRange(value as [string|null,string|null])} placeholder={['처리 시작일','처리 종료일']}/>
        <button type="button" className={styles.reviewReset} onClick={reset}>초기화</button>
      </div>
    </form>
    <GridArea><div className={styles.queueCard}><div className={styles.queueHeader}><div><strong>인증 처리 이력</strong><span>전체 {filtered.length}건</span></div><span>정렬 · 최신순</span></div><DataGrid columns={[{label:'처리일 / 로그 ID'},{label:'인증번호 / 사업자 거래'},{label:'대상 회원'},{label:'인증 목적'},{label:'처리'},{label:'변경 전'},{label:'변경 후'},{label:'결과'},{label:'처리자 / 사유'}]} rows={rows} gridTemplate="128px 124px 185px 78px 82px 68px 68px 54px minmax(210px,1.25fr)" minWidth="1040px" empty={!filtered.length} emptyText="조건에 맞는 인증 처리 이력이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></div></GridArea>
    {selected&&<DetailDrawer eyebrow={`인증 감사 로그 · ${selected.id}`} title={selected.action} status={selected.result} statusMeta={resultMeta[selected.result]} subtitle={`${selected.verificationId} · ${selected.occurredAt}`} onClose={()=>setSelectedId(null)} stats={[{label:'회원',value:selected.nickname},{label:'인증 목적',value:selected.purpose},{label:'처리자',value:selected.actor}]} fields={[{label:'회원 ID',value:selected.memberId},{label:'사업자 거래번호',value:selected.providerTxnId},{label:'처리 사유',value:selected.reason}]}><div className={drawer.sectionTitleLoose}>상태 변경</div><div className={styles.auditResult}><div><span>변경 전</span><strong>{selected.before}</strong></div><div><span>변경 후</span><strong>{selected.after}</strong></div></div><div className={drawer.sectionTitleLoose}>감사 원칙</div><div className={styles.boundaryNote}>인증 처리 이력에는 마스킹 식별자와 결과만 저장합니다. 원본 신분증·얼굴 이미지와 주민등록번호는 감사 로그 및 다운로드에 포함하지 않으며 기존 로그는 수정·삭제하지 않습니다.</div></DetailDrawer>}
  </section>;
}
