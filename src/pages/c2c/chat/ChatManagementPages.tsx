import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../../ops/opsShared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../sales/SalesActivity.module.css';
import styles from './ChatManagement.module.css';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from '../sales/SalesActivityShared';
import { downloadCsv, pages } from '../sales/salesActivityUtils';
import {
  CHAT_ACCESS_LOGS,
  CHAT_RISK_META,
  CHAT_ROOMS,
  CHAT_STATUS_META,
  MESSAGE_POLICIES,
  type ChatRisk,
  type ChatRoom,
  type MessagePolicy,
} from './chatData';

type ChatQuick = '전체' | '거래중' | '신고 있음' | '제한 감지' | '분쟁중';
const QUICKS:ChatQuick[]=['전체','거래중','신고 있음','제한 감지','분쟁중'];

function quickFromParam(value:string|null):ChatQuick {
  if(value==='active') return '거래중';
  if(value==='reported') return '신고 있음';
  if(value==='restricted') return '제한 감지';
  if(value==='dispute') return '분쟁중';
  return '전체';
}

function matchesQuick(room:ChatRoom,quick:ChatQuick) {
  if(quick==='전체') return true;
  if(quick==='신고 있음') return room.reportedCount>0;
  if(quick==='제한 감지') return room.restrictedCount>0||room.messages.some((message)=>message.status==='탐지');
  return room.status===quick;
}

export function ChatListPage() {
  const navigate=useNavigate();
  const [searchParams,setSearchParams]=useSearchParams();
  const [rooms,setRooms]=useState<ChatRoom[]>(CHAT_ROOMS);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [risk,setRisk]=useState<ChatRisk|''>('');
  const [participant,setParticipant]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [unlockedId,setUnlockedId]=useState<string|null>(null);
  const [accessDialog,setAccessDialog]=useState(false);
  const [accessReason,setAccessReason]=useState('');
  const [ticketId,setTicketId]=useState('');
  const [accessDetail,setAccessDetail]=useState('');
  const [toast,setToast]=useState('');
  const quick=quickFromParam(searchParams.get('status'));
  const selected=rooms.find((room)=>room.id===selectedId)??null;

  const filtered=useMemo(()=>rooms.filter((room)=>matchesQuick(room,quick)&&(!risk||room.risk===risk)&&(!participant||(participant==='구매자'?room.buyerId.includes(search):room.sellerId.includes(search)))&&(!search||`${room.id} ${room.tradeId} ${room.productTitle} ${room.buyerId} ${room.buyerNickname} ${room.sellerId} ${room.sellerNickname}`.toLowerCase().includes(search.toLowerCase()))),[participant,quick,risk,rooms,search]);
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),2200);};
  const selectQuick=(nextQuick:ChatQuick)=>{const next=new URLSearchParams(searchParams);if(nextQuick==='거래중')next.set('status','active');else if(nextQuick==='신고 있음')next.set('status','reported');else if(nextQuick==='제한 감지')next.set('status','restricted');else if(nextQuick==='분쟁중')next.set('status','dispute');else next.delete('status');setSearchParams(next,{replace:true});};
  const reset=()=>{setKeyword('');setSearch('');setRisk('');setParticipant('');setSearchParams(new URLSearchParams(),{replace:true});};
  const openRoom=(id:string)=>{setSelectedId(id);setUnlockedId(null);setAccessDialog(false);setAccessReason('');setTicketId('');setAccessDetail('');};
  const authorize=()=>{if(!selected)return;if(!accessReason||!ticketId.trim())return notify('열람 사유와 연결 업무 번호를 입력해 주세요.');setUnlockedId(selected.id);setAccessDialog(false);notify(`${selected.id} 대화 열람이 기록되었습니다.`);};
  const restrictMessage=(messageId:string)=>{if(!selected)return;setRooms((items)=>items.map((room)=>room.id===selected.id?{...room,restrictedCount:room.messages.some((message)=>message.id===messageId&&message.status==='제한')?room.restrictedCount:room.restrictedCount+1,messages:room.messages.map((message)=>message.id===messageId?{...message,status:'제한'}:message)}:room));notify(`${messageId} 메시지를 노출 제한 처리했습니다.`);};
  const rows:GridRow[]=filtered.map((room)=>({id:room.id,onClick:()=>openRoom(room.id),bg:room.risk==='긴급'?'#fffafa':undefined,mark:room.risk==='긴급'?'inset 3px 0 #ef4444':undefined,cells:[{kind:'stack',title:room.id,subtitle:room.tradeId},{kind:'stack',title:room.productTitle,subtitle:room.lastPreview},{kind:'stack',title:room.buyerNickname,subtitle:room.buyerId},{kind:'stack',title:room.sellerNickname,subtitle:room.sellerId},{kind:'text',text:room.messageCount.toLocaleString(),align:'right',numeric:true},{kind:'badgeSub',text:room.risk,subText:`신고 ${room.reportedCount} · 제한 ${room.restrictedCount}`,...CHAT_RISK_META[room.risk]},{kind:'badge',text:room.status,...CHAT_STATUS_META[room.status]},{kind:'text',text:room.lastAt,numeric:true},{kind:'link',text:'조회'}]}));

  return <section className={shared.page}>
    <PageHeading title="채팅 조회" subtitle="C2C 거래 대화의 메타데이터와 위험 신호를 조회하고, 승인된 업무 사유가 있을 때만 메시지 원문을 열람·조치합니다." action={<button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-chat-metadata.csv',['채팅방','거래번호','상품','구매자','판매자','상태','위험도','메시지 수','신고','제한','최근 메시지'],filtered.map((room)=>[room.id,room.tradeId,room.productTitle,room.buyerId,room.sellerId,room.status,room.risk,room.messageCount,room.reportedCount,room.restrictedCount,room.lastAt]))}>메타데이터 다운로드</button>}/>
    <Metrics items={[{label:'진행 거래 채팅',value:`${rooms.filter((room)=>room.status==='거래중').length}개`,note:'거래 완료 전 대화',dot:'#4f7bd9'},{label:'신고 연결',value:`${rooms.filter((room)=>room.reportedCount>0).length}개`,note:'신고 관리에서 판단',tone:'down',dot:'#f59e0b'},{label:'제한 메시지',value:`${rooms.reduce((sum,room)=>sum+room.restrictedCount,0)}건`,note:'마스킹·노출 제한',tone:'down',dot:'#ef4444'},{label:'분쟁 연결',value:`${rooms.filter((room)=>room.status==='분쟁중').length}개`,note:'증빙 보존 대상',dot:'#8b5cf6'}]}/>
    <ControlArea><div className={shared.quickFilters}>{QUICKS.map((item)=><button type="button" key={item} className={`${shared.qfBtn} ${quick===item?base.quickActive:''}`} onClick={()=>selectQuick(item)}><span className={shared.qfLabel}>{item}</span><span className={shared.qfCount}>{rooms.filter((room)=>matchesQuick(room,item)).length}</span></button>)}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><select className={shared.selectSm}><option>통합 검색</option><option>채팅방 ID</option><option>거래번호</option><option>상품</option><option>참여 회원</option></select><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="채팅방 / 거래번호 / 상품 / 구매자 / 판매자"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><select className={shared.selectSm} value={risk} onChange={(event)=>setRisk(event.target.value as ChatRisk|'')}><option value="">전체 위험도</option><option>긴급</option><option>높음</option><option>주의</option><option>정상</option></select><select className={shared.selectSm} value={participant} onChange={(event)=>setParticipant(event.target.value)}><option value="">전체 참여자</option><option>구매자</option><option>판매자</option></select><span>최근 메시지</span><input type="date" className={shared.selectSm} defaultValue="2026-08-20"/><span>~</span><input type="date" className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="개"/><DataGrid columns={[{label:'채팅방 / 거래번호'},{label:'상품 / 최근 메시지'},{label:'구매자'},{label:'판매자'},{label:'메시지',align:'right'},{label:'위험 / 신고·제한'},{label:'거래 상태'},{label:'최근 메시지'},{label:'관리'}]} rows={rows} gridTemplate="155px minmax(220px,1.35fr) 125px 125px 65px 105px 82px 130px 55px" minWidth="1080px" empty={!filtered.length} emptyText="조건에 맞는 거래 채팅이 없습니다." emptySubtext="상태나 위험도 필터를 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0개'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`거래 채팅 · ${selected.id}`} title={selected.productTitle} status={selected.status} statusMeta={CHAT_STATUS_META[selected.status]} subtitle={`${selected.tradeId} · 최근 메시지 ${selected.lastAt}`} onClose={()=>{setSelectedId(null);setUnlockedId(null);}} actions={<>{selected.reportedCount>0&&<button type="button" className={drawer.actionLink} onClick={()=>navigate('/c2c/reports/processing?target=messages')}>신고 처리</button>}{selected.restrictedCount>0&&<button type="button" className={drawer.actionLink} onClick={()=>navigate('/c2c/sanctions/processing?type=chat')}>회원 제재 검토</button>}<span className={drawer.spacer}/>{unlockedId!==selected.id&&<button type="button" className={drawer.primaryBtn} onClick={()=>setAccessDialog(true)}>대화 내용 열람</button>}</>} stats={[{label:'메시지',value:`${selected.messageCount}건`},{label:'신고',value:`${selected.reportedCount}건`},{label:'위험도',value:selected.risk}]} fields={[{label:'구매자',value:`${selected.buyerNickname} (${selected.buyerId})`},{label:'판매자',value:`${selected.sellerNickname} (${selected.sellerId})`},{label:'거래번호',value:selected.tradeId},{label:'분쟁번호',value:selected.disputeId},{label:'제한 메시지',value:`${selected.restrictedCount}건`},{label:'보존 기한',value:selected.retentionUntil}]}><div className={drawer.sectionTitleLoose}>대화 원문</div>{unlockedId===selected.id?<div className={styles.transcript}>{selected.messages.map((message)=><div key={message.id} className={`${styles.message} ${message.senderLabel==='구매자'?styles.buyer:message.senderLabel==='판매자'?styles.seller:styles.system} ${message.status==='제한'?styles.restricted:''} ${message.status==='삭제'?styles.deleted:''}`}><div className={styles.messageHead}><span>{message.senderLabel} · {message.senderId}</span><time>{message.sentAt}</time></div><p>{message.status==='삭제'?'[운영 정책에 따라 삭제된 메시지입니다]':message.status==='제한'?'[제한됨] '+message.content:message.content}</p>{message.status!=='정상'&&<div className={styles.messageFoot}><span>{message.detection} · {message.status}</span>{message.status==='탐지'&&<button type="button" className={styles.restrictButton} onClick={()=>restrictMessage(message.id)}>메시지 제한</button>}</div>}</div>)}</div>:<div className={styles.lockBox}><strong>메시지 원문은 보호 정보입니다.</strong><p>신고·분쟁·제재 등 승인된 업무 사유와 연결 번호를 남겨야 열람할 수 있으며 모든 접근은 감사 로그에 기록됩니다.</p><button type="button" className={styles.lockButton} onClick={()=>setAccessDialog(true)}>열람 사유 등록</button></div>}<div className={drawer.sectionTitleLoose}>업무 책임</div><div className={styles.boundaryNote}>메시지 원문 마스킹·삭제는 이 화면에서 실행합니다. 신고 사실 판단은 신고 관리, 회원의 채팅 기능 제한은 제재 관리에서 처리합니다.</div></DetailDrawer>}
    {accessDialog&&selected&&<div className={shared.dialogOverlay} onMouseDown={(event)=>{if(event.target===event.currentTarget)setAccessDialog(false);}}><div className={`${shared.dialogBox} ${styles.dialogWide}`}><h2 className={shared.dialogTitle}>대화 내용 열람 승인</h2><p className={shared.dialogBody}>{selected.id}의 메시지 원문 열람 사유와 연결 업무 번호를 기록합니다.</p><div className={styles.accessForm}><label><span>열람 사유 *</span><select value={accessReason} onChange={(event)=>setAccessReason(event.target.value)}><option value="">사유 선택</option><option>신고 메시지 확인</option><option>분쟁 증빙 확인</option><option>제재 근거 검토</option><option>보안 사고 조사</option></select></label><label><span>연결 업무 번호 *</span><input value={ticketId} onChange={(event)=>setTicketId(event.target.value)} placeholder="RPT / DSP / SNC / SEC 번호"/></label><label><span>상세 사유</span><textarea value={accessDetail} onChange={(event)=>setAccessDetail(event.target.value)} placeholder="열람 범위와 확인할 내용을 구체적으로 입력하세요."/></label></div><div className={styles.boundaryNote}>열람 권한은 현재 업무 세션에만 적용되며 화면 이탈 시 만료됩니다. 메시지 원문 다운로드는 별도 승인이 필요합니다.</div><div className={shared.dialogActions}><button type="button" className={drawer.editCancel} onClick={()=>setAccessDialog(false)}>취소</button><button type="button" className={drawer.editConfirm} onClick={authorize}>열람 및 기록</button></div></div></div>}
    {toast&&<div className={base.toast}>{toast}</div>}
  </section>;
}

export function MessagePolicyPage() {
  const [policies,setPolicies]=useState<MessagePolicy[]>(MESSAGE_POLICIES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('');
  const [action,setAction]=useState('');
  const [status,setStatus]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [toast,setToast]=useState('');
  const selected=policies.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>policies.filter((item)=>(!category||item.category===category)&&(!action||item.action===action)&&(!status||item.status===status)&&(!search||`${item.id} ${item.name} ${item.category} ${item.patterns.join(' ')} ${item.owner}`.toLowerCase().includes(search.toLowerCase()))),[action,category,policies,search,status]);
  const statusMeta:Record<MessagePolicy['status'],{bg:string;fg:string}>={사용:{bg:'#ecfdf5',fg:'#047857'},'검토 필요':{bg:'#fff7ed',fg:'#c2410c'},중지:{bg:'#f4f4f5',fg:'#52525b'}};
  const reset=()=>{setKeyword('');setSearch('');setCategory('');setAction('');setStatus('');};
  const toggle=()=>{if(!selected)return;const next=selected.status==='중지'?'사용':'중지';setPolicies((items)=>items.map((item)=>item.id===selected.id?{...item,status:next,updatedAt:'2026-08-27'}:item));setToast(`${selected.id} 정책을 ${next} 상태로 변경했습니다.`);window.setTimeout(()=>setToast(''),2200);};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.id,subtitle:item.updatedAt},{kind:'stack',title:item.name,subtitle:item.category},{kind:'stack',title:item.detection,subtitle:item.patterns.join(' · ')},{kind:'pillText',text:item.action,bg:item.action==='발송 차단'?'#fef2f2':item.action==='마스킹'?'#f5f3ff':'#eff6ff',fg:item.action==='발송 차단'?'#dc2626':item.action==='마스킹'?'#6d28d9':'#1d4ed8'},{kind:'badge',text:item.severity,...CHAT_RISK_META[item.severity]},{kind:'text',text:item.exceptions},{kind:'stack',title:item.owner,subtitle:item.updatedAt},{kind:'badge',text:item.status,...statusMeta[item.status]},{kind:'link',text:'상세'}]}));
  return <section className={shared.page}>
    <PageHeading title="메시지 정책" subtitle="거래 채팅의 외부 결제 유도·개인정보·스팸·유해 표현 탐지 기준과 표시·마스킹·발송 차단 동작을 관리합니다."/>
    <Metrics items={[{label:'사용 정책',value:`${policies.filter((item)=>item.status==='사용').length}개`,note:'실시간 탐지 적용',tone:'up',dot:'#10b981'},{label:'발송 차단',value:`${policies.filter((item)=>item.action==='발송 차단'&&item.status==='사용').length}개`,note:'메시지 전송 전 차단',dot:'#ef4444'},{label:'마스킹',value:`${policies.filter((item)=>item.action==='마스킹'&&item.status==='사용').length}개`,note:'개인정보 보호',dot:'#8b5cf6'},{label:'검토 필요',value:`${policies.filter((item)=>item.status==='검토 필요').length}개`,note:'오탐·정책 개정 확인',tone:'down',dot:'#f59e0b'}]}/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><select className={shared.selectSm}><option>통합 검색</option><option>정책 ID</option><option>정책명</option><option>탐지 패턴</option><option>담당 조직</option></select><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="정책 ID / 정책명 / 탐지 패턴 / 담당 조직"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><select className={shared.selectSm} value={category} onChange={(event)=>setCategory(event.target.value)}><option value="">전체 정책 분류</option>{[...new Set(policies.map((item)=>item.category))].map((item)=><option key={item}>{item}</option>)}</select><select className={shared.selectSm} value={action} onChange={(event)=>setAction(event.target.value)}><option value="">전체 처리 방식</option><option>표시</option><option>마스킹</option><option>발송 차단</option><option>신고 큐 생성</option></select><select className={shared.selectSm} value={status} onChange={(event)=>setStatus(event.target.value)}><option value="">전체 정책 상태</option><option>사용</option><option>검토 필요</option><option>중지</option></select><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="개"/><DataGrid columns={[{label:'정책 ID / 수정일'},{label:'정책 / 분류'},{label:'탐지 방식 / 패턴'},{label:'처리 방식'},{label:'위험도'},{label:'예외 조건'},{label:'담당 / 수정일'},{label:'상태'},{label:'관리'}]} rows={rows} gridTemplate="125px 150px minmax(215px,1.35fr) 105px 75px minmax(170px,1fr) 135px 75px 55px" minWidth="1090px" empty={!filtered.length} emptyText="조건에 맞는 메시지 정책이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0개'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`메시지 정책 · ${selected.id}`} title={selected.name} status={selected.status} statusMeta={statusMeta[selected.status]} subtitle={`${selected.category} · ${selected.owner}`} onClose={()=>setSelectedId(null)} actions={<button type="button" className={selected.status==='중지'?drawer.primaryBtn:drawer.dangerBtn} onClick={toggle}>{selected.status==='중지'?'정책 사용':'정책 중지'}</button>} stats={[{label:'위험도',value:selected.severity},{label:'처리 방식',value:selected.action},{label:'담당 조직',value:selected.owner}]} fields={[{label:'탐지 방식',value:selected.detection},{label:'예외 조건',value:selected.exceptions},{label:'최종 수정일',value:selected.updatedAt}]}><div className={drawer.sectionTitleLoose}>탐지 대상</div><div className={styles.policyPatterns}>{selected.patterns.map((item)=><span key={item} className={styles.policyPattern}>{item}</span>)}</div><div className={drawer.sectionTitleLoose}>정책 적용 원칙</div><div className={styles.boundaryNote}>탐지 정책은 메시지 표시·마스킹·발송 차단을 실행합니다. 회원 신고 판정과 채팅 기능 제재는 각각 신고 관리와 제재 관리에서 별도 근거로 처리합니다.</div></DetailDrawer>}
    {toast&&<div className={base.toast}>{toast}</div>}
  </section>;
}

export function ChatAccessHistoryPage() {
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [reason,setReason]=useState('');
  const [result,setResult]=useState('');
  const [exported,setExported]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=CHAT_ACCESS_LOGS.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>CHAT_ACCESS_LOGS.filter((item)=>(!reason||item.reason===reason)&&(!result||item.result===result)&&(!exported||(exported==='yes'?item.exported:!item.exported))&&(!search||`${item.id} ${item.adminId} ${item.roomId} ${item.tradeId} ${item.ticketId} ${item.reason}`.toLowerCase().includes(search.toLowerCase()))),[exported,reason,result,search]);
  const reset=()=>{setKeyword('');setSearch('');setReason('');setResult('');setExported('');};
  const resultMeta:Record<(typeof CHAT_ACCESS_LOGS)[number]['result'],{bg:string;fg:string}>={허용:{bg:'#ecfdf5',fg:'#047857'},거부:{bg:'#fef2f2',fg:'#dc2626'},만료:{bg:'#f4f4f5',fg:'#52525b'}};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.accessedAt,subtitle:item.id},{kind:'stack',title:item.adminId,subtitle:item.ip},{kind:'stack',title:item.roomId,subtitle:item.tradeId},{kind:'stack',title:item.reason,subtitle:item.ticketId},{kind:'text',text:item.scope},{kind:'badge',text:item.result,...resultMeta[item.result]},{kind:'text',text:item.duration,numeric:true},{kind:'pillText',text:item.exported?'내보냄':'없음',bg:item.exported?'#fff7ed':'#f4f4f5',fg:item.exported?'#c2410c':'#52525b'},{kind:'link',text:'상세'}]}));
  return <section className={shared.page}>
    <PageHeading title="운영 조회 이력" subtitle="관리자의 거래 채팅 원문 열람·내보내기 요청과 업무 사유, 접근 범위, 결과를 수정 불가능한 감사 로그로 조회합니다."/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><select className={shared.selectSm}><option>통합 검색</option><option>로그 ID</option><option>관리자</option><option>채팅방</option><option>업무 번호</option></select><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="로그 / 관리자 / 채팅방 / 거래번호 / 연결 업무 번호"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><select className={shared.selectSm} value={reason} onChange={(event)=>setReason(event.target.value)}><option value="">전체 열람 사유</option>{[...new Set(CHAT_ACCESS_LOGS.map((item)=>item.reason))].map((item)=><option key={item}>{item}</option>)}</select><select className={shared.selectSm} value={result} onChange={(event)=>setResult(event.target.value)}><option value="">전체 접근 결과</option><option>허용</option><option>거부</option><option>만료</option></select><select className={shared.selectSm} value={exported} onChange={(event)=>setExported(event.target.value)}><option value="">전체 내보내기</option><option value="yes">내보내기 있음</option><option value="no">내보내기 없음</option></select><span>조회일</span><input type="date" className={shared.selectSm} defaultValue="2026-08-26"/><span>~</span><input type="date" className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-chat-access-audit.csv',['조회일','로그 ID','관리자','채팅방','거래번호','사유','업무 번호','범위','결과','접속 IP','세션','내보내기'],filtered.map((item)=>[item.accessedAt,item.id,item.adminId,item.roomId,item.tradeId,item.reason,item.ticketId,item.scope,item.result,item.ip,item.duration,item.exported?'있음':'없음']))}>감사 로그 다운로드</button></ResultBar><DataGrid columns={[{label:'조회일 / 로그 ID'},{label:'관리자 / 접속 IP'},{label:'채팅방 / 거래번호'},{label:'열람 사유 / 업무 번호'},{label:'접근 범위'},{label:'결과'},{label:'세션'},{label:'내보내기'},{label:'관리'}]} rows={rows} gridTemplate="160px 125px 155px 165px minmax(150px,1fr) 70px 75px 75px 55px" minWidth="1050px" empty={!filtered.length} emptyText="조건에 맞는 운영 조회 이력이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`채팅 접근 감사 · ${selected.id}`} title={selected.reason} status={selected.result} statusMeta={resultMeta[selected.result]} subtitle={`${selected.adminId} · ${selected.accessedAt}`} onClose={()=>setSelectedId(null)} stats={[{label:'접근 결과',value:selected.result},{label:'세션',value:selected.duration},{label:'내보내기',value:selected.exported?'있음':'없음'}]} fields={[{label:'채팅방',value:selected.roomId},{label:'거래번호',value:selected.tradeId},{label:'연결 업무',value:selected.ticketId},{label:'접속 IP',value:selected.ip}]}><div className={drawer.sectionTitleLoose}>접근 범위</div><div className={styles.auditScope}><div><span>열람 범위</span><strong>{selected.scope}</strong></div><div><span>처리 결과</span><strong>{selected.result}</strong></div></div><div className={drawer.sectionTitleLoose}>감사 원칙</div><div className={styles.boundaryNote}>채팅 원문 접근 로그는 수정하거나 삭제하지 않습니다. 업무 번호가 없거나 권한이 부족한 요청도 거부 기록으로 남기며, 내보내기는 별도 승인 이력을 함께 보존합니다.</div></DetailDrawer>}
  </section>;
}
