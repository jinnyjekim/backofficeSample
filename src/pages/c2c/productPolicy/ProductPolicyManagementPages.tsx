import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../shared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../sales/SalesActivity.module.css';
import styles from './ProductPolicyManagement.module.css';
import { CommonButton, showToast } from '../../../components/common';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from '../sales/SalesActivityShared';
import { downloadCsv, pages } from '../sales/salesActivityUtils';
import {
  DETECTION_LOGS,
  DETECTION_RESULT_META,
  DETECTION_RULES,
  PRODUCT_POLICIES,
  PRODUCT_POLICY_LEVEL_META,
  PRODUCT_POLICY_STATUS_META,
  type DetectionAction,
  type DetectionRule,
  type DetectionRuleType,
  type ProductPolicy,
  type ProductPolicyLevel,
  type ProductPolicyStatus,
} from './productPolicyData';

const LEVELS:ProductPolicyLevel[]=['금지','제한','조건부 허용'];
const LEVEL_BY_PARAM:Record<string,ProductPolicyLevel>={prohibited:'금지',limited:'제한',conditional:'조건부 허용'};
const PARAM_BY_LEVEL:Record<ProductPolicyLevel,string>={금지:'prohibited',제한:'limited','조건부 허용':'conditional'};

export function ProductPolicyPage() {
  const [searchParams,setSearchParams]=useSearchParams();
  const [policies,setPolicies]=useState<ProductPolicy[]>(PRODUCT_POLICIES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('');
  const [status,setStatus]=useState<ProductPolicyStatus|''>('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const level=LEVEL_BY_PARAM[searchParams.get('level')??'']??'';
  const selected=policies.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>policies.filter((item)=>(!level||item.level===level)&&(!category||item.category===category)&&(!status||item.status===status)&&(!search||`${item.id} ${item.name} ${item.category} ${item.criteria} ${item.examples.join(' ')} ${item.legalBasis}`.toLowerCase().includes(search.toLowerCase()))),[category,level,policies,search,status]);
  const selectLevel=(nextLevel:ProductPolicyLevel|'')=>{const next=new URLSearchParams(searchParams);if(nextLevel)next.set('level',PARAM_BY_LEVEL[nextLevel]);else next.delete('level');setSearchParams(next,{replace:true});};
  const reset=()=>{setKeyword('');setSearch('');setCategory('');setStatus('');setSearchParams(new URLSearchParams(),{replace:true});};
  const toggle=()=>{if(!selected)return;const next:ProductPolicyStatus=selected.status==='중지'?'사용':'중지';setPolicies((items)=>items.map((item)=>item.id===selected.id?{...item,status:next,updatedAt:'2026-08-27'}:item));showToast({ message: `${selected.id} 정책을 ${next} 상태로 변경했습니다.`, type: 'success' });};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.id,subtitle:`${item.version} · ${item.updatedAt}`},{kind:'stack',title:item.name,subtitle:item.category},{kind:'pillText',text:item.level,...PRODUCT_POLICY_LEVEL_META[item.level]},{kind:'stack',title:item.criteria,subtitle:item.examples.join(' · ')},{kind:'text',text:item.defaultAction,weight:600},{kind:'text',text:item.evidence},{kind:'stack',title:item.owner,subtitle:item.region},{kind:'badge',text:item.status,...PRODUCT_POLICY_STATUS_META[item.status]},{kind:'link',text:'상세'}]}));
  return <div className={shared.page}>
    <PageHeading title="상품 정책" subtitle="C2C 상품의 금지·제한·조건부 허용 등급과 판단 기준, 예외, 기본 조치 및 증빙 요건을 하나의 정책 체계로 관리합니다."/>
    <Metrics items={[{label:'금지 정책',value:`${policies.filter((item)=>item.level==='금지'&&item.status!=='중지').length}개`,note:'등록 차단 대상',dot:'#ef4444'},{label:'제한 정책',value:`${policies.filter((item)=>item.level==='제한'&&item.status!=='중지').length}개`,note:'증빙·자격 확인',dot:'#f59e0b'},{label:'조건부 허용',value:`${policies.filter((item)=>item.level==='조건부 허용'&&item.status!=='중지').length}개`,note:'검수 후 노출',dot:'#4f7bd9'},{label:'검토 필요',value:`${policies.filter((item)=>item.status==='검토 필요').length}개`,note:'법령·운영 기준 개정',tone:'down',dot:'#8b5cf6'}]}/>
    <ControlArea><div className={shared.quickFilters}>{(['전체',...LEVELS] as const).map((item) => {
      const active = (item === '전체' && !level) || level === item;
      return (
        <CommonButton
          type="button"
          key={item}
          variant={active ? 'primary-light' : 'secondary'}
          size="md"
          className={`${shared.qfBtn} ${active ? base.quickActive : ''}`}
          onClick={() => selectLevel(item === '전체' ? '' : item)}
        >
          <span className={shared.qfLabel}>{item}</span>
          <span className={shared.qfCount}>{policies.filter((policy) => item === '전체' || policy.level === item).length}</span>
        </CommonButton>
      );
    })}</div><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>정책 ID</option><option>정책명</option><option>판단 기준</option><option>법적 근거</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="정책 ID / 정책명 / 판단 기준 / 예시 / 법적 근거"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>정책 분류</span><select aria-label="정책 분류" className={shared.selectSm} value={category} onChange={(event)=>setCategory(event.target.value)}><option value="">전체 정책 분류</option>{[...new Set(policies.map((item)=>item.category))].map((item)=><option key={item}>{item}</option>)}</select></label><label className="globalFilterField"><span>정책 상태</span><select aria-label="정책 상태" className={shared.selectSm} value={status} onChange={(event)=>setStatus(event.target.value as ProductPolicyStatus|'')}><option value="">전체 정책 상태</option><option>사용</option><option>검토 필요</option><option>중지</option></select></label><span>기준일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="개"><button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-product-policies.csv',['정책 ID','정책명','분류','등급','판단 기준','기본 조치','증빙','법적 근거','상태','버전'],filtered.map((item)=>[item.id,item.name,item.category,item.level,item.criteria,item.defaultAction,item.evidence,item.legalBasis,item.status,item.version]))}>정책 다운로드</button></ResultBar><DataGrid columns={[{label:'정책 ID / 버전'},{label:'정책 / 분류'},{label:'등급'},{label:'판단 기준 / 예시'},{label:'기본 조치'},{label:'필요 증빙'},{label:'담당 / 지역'},{label:'상태'},{label:'관리'}]} rows={rows} gridTemplate="106px 140px 85px minmax(245px,1.4fr) 165px 188px 100px 75px 55px" minWidth="1190px" empty={!filtered.length} emptyText="조건에 맞는 상품 정책이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0개'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`상품 정책 · ${selected.id}`} title={selected.name} status={selected.status} statusMeta={PRODUCT_POLICY_STATUS_META[selected.status]} subtitle={`${selected.level} · ${selected.category} · ${selected.version}`} onClose={()=>setSelectedId(null)} actions={<button type="button" className={selected.status==='중지'?drawer.primaryBtn:drawer.dangerBtn} onClick={toggle}>{selected.status==='중지'?'정책 사용':'정책 중지'}</button>} stats={[{label:'정책 등급',value:selected.level},{label:'적용 지역',value:selected.region},{label:'담당 조직',value:selected.owner}]} fields={[{label:'판단 기준',value:selected.criteria},{label:'기본 조치',value:selected.defaultAction},{label:'필요 증빙',value:selected.evidence},{label:'예외 조건',value:selected.exceptions},{label:'법적 근거',value:selected.legalBasis},{label:'최종 수정일',value:selected.updatedAt}]}><div className={drawer.sectionTitleLoose}>대표 예시</div><div className={styles.exampleList}>{selected.examples.map((item)=><span key={item} className={styles.example}>{item}</span>)}</div><div className={drawer.sectionTitleLoose}>정책 적용 경계</div><div className={styles.boundaryNote}>상품 정책은 등록 가능 여부와 기본 조치를 정의합니다. 신고 접수·판정은 신고 관리, 탐지된 상품의 숨김·삭제·복구는 사용자 상품 관리, 반복 위반 회원 제재는 제재 관리에서 처리합니다.</div></DetailDrawer>}
  </div>;
}

export function DetectionRulePage() {
  const [rules,setRules]=useState<DetectionRule[]>(DETECTION_RULES);
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [type,setType]=useState<DetectionRuleType|''>('');
  const [action,setAction]=useState<DetectionAction|''>('');
  const [status,setStatus]=useState<ProductPolicyStatus|''>('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=rules.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>rules.filter((item)=>(!type||item.type===type)&&(!action||item.action===action)&&(!status||item.status===status)&&(!search||`${item.id} ${item.name} ${item.policyId} ${item.target} ${item.signals.join(' ')} ${item.owner}`.toLowerCase().includes(search.toLowerCase()))),[action,rules,search,status,type]);
  const reset=()=>{setKeyword('');setSearch('');setType('');setAction('');setStatus('');};
  const toggle=()=>{if(!selected)return;const next:ProductPolicyStatus=selected.status==='중지'?'사용':'중지';setRules((items)=>items.map((item)=>item.id===selected.id?{...item,status:next,updatedAt:'2026-08-27'}:item));showToast({ message: `${selected.id} 규칙을 ${next} 상태로 변경했습니다.`, type: 'success' });};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.id,subtitle:`${item.version} · ${item.updatedAt}`},{kind:'stack',title:item.name,subtitle:`정책 ${item.policyId}`},{kind:'pillText',text:item.type,bg:'#f4f4f5',fg:'#52525b'},{kind:'stack',title:item.target,subtitle:item.signals.join(' · ')},{kind:'text',text:item.threshold,weight:600},{kind:'pillText',text:item.action,bg:item.action==='등록 차단'?'#fef2f2':item.action==='임시 숨김'?'#fff7ed':'#eff6ff',fg:item.action==='등록 차단'?'#dc2626':item.action==='임시 숨김'?'#c2410c':'#1d4ed8'},{kind:'badgeSub',text:`${item.hits24h}건`,subText:`오탐 ${item.falsePositiveRate.toFixed(1)}%`,bg:'#f4f4f5',fg:'#52525b'},{kind:'badge',text:item.status,...PRODUCT_POLICY_STATUS_META[item.status]},{kind:'link',text:'상세'}]}));
  return <div className={shared.page}>
    <PageHeading title="자동 탐지 규칙" subtitle="상품명·설명·이미지·가격·중복 등록 신호를 상품 정책과 연결하고 임계값과 자동 조치 수준을 관리합니다."/>
    <Metrics items={[{label:'사용 규칙',value:`${rules.filter((item)=>item.status==='사용').length}개`,note:'실시간 상품 등록 적용',tone:'up',dot:'#10b981'},{label:'24시간 탐지',value:`${rules.reduce((sum,item)=>sum+item.hits24h,0)}건`,note:'전체 규칙 합계',dot:'#4f7bd9'},{label:'자동 차단·숨김',value:`${rules.filter((item)=>['등록 차단','임시 숨김'].includes(item.action)&&item.status==='사용').length}개`,note:'고위험 자동 조치',dot:'#ef4444'},{label:'검토 필요',value:`${rules.filter((item)=>item.status==='검토 필요').length}개`,note:'오탐률·임계값 조정',tone:'down',dot:'#f59e0b'}]}/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>규칙 ID</option><option>규칙명</option><option>연결 정책</option><option>탐지 신호</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder="규칙 ID / 규칙명 / 정책 ID / 탐지 신호 / 담당 조직"/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>탐지 방식</span><select aria-label="탐지 방식" className={shared.selectSm} value={type} onChange={(event)=>setType(event.target.value as DetectionRuleType|'')}><option value="">전체 탐지 방식</option><option>키워드</option><option>이미지</option><option>OCR</option><option>가격 이상</option><option>중복 등록</option><option>분류 모델</option></select></label><label className="globalFilterField"><span>자동 조치</span><select aria-label="자동 조치" className={shared.selectSm} value={action} onChange={(event)=>setAction(event.target.value as DetectionAction|'')}><option value="">전체 자동 조치</option><option>등록 차단</option><option>임시 숨김</option><option>검토 큐 생성</option><option>위험 표시</option></select></label><label className="globalFilterField"><span>규칙 상태</span><select aria-label="규칙 상태" className={shared.selectSm} value={status} onChange={(event)=>setStatus(event.target.value as ProductPolicyStatus|'')}><option value="">전체 규칙 상태</option><option>사용</option><option>검토 필요</option><option>중지</option></select></label><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="개"/><DataGrid columns={[{label:'규칙 ID / 버전'},{label:'규칙 / 연결 정책'},{label:'방식'},{label:'탐지 대상 / 신호'},{label:'임계값'},{label:'자동 조치'},{label:'24시간 / 오탐'},{label:'상태'},{label:'관리'}]} rows={rows} gridTemplate="134px 140px 72px minmax(240px,1.4fr) 130px 84px 68px 75px 55px" minWidth="1040px" empty={!filtered.length} emptyText="조건에 맞는 자동 탐지 규칙이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0개'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`탐지 규칙 · ${selected.id}`} title={selected.name} status={selected.status} statusMeta={PRODUCT_POLICY_STATUS_META[selected.status]} subtitle={`${selected.type} · ${selected.version} · 정책 ${selected.policyId}`} onClose={()=>setSelectedId(null)} actions={<button type="button" className={selected.status==='중지'?drawer.primaryBtn:drawer.dangerBtn} onClick={toggle}>{selected.status==='중지'?'규칙 사용':'규칙 중지'}</button>} stats={[{label:'24시간 탐지',value:`${selected.hits24h}건`},{label:'검토 전환율',value:`${selected.reviewRate.toFixed(1)}%`},{label:'오탐률',value:`${selected.falsePositiveRate.toFixed(1)}%`}]} fields={[{label:'탐지 대상',value:selected.target},{label:'판정 임계값',value:selected.threshold},{label:'자동 조치',value:selected.action},{label:'담당 조직',value:selected.owner},{label:'최종 수정일',value:selected.updatedAt}]}><div className={drawer.sectionTitleLoose}>탐지 신호</div><div className={styles.ruleSignals}>{selected.signals.map((item)=><div key={item} className={styles.signal}>{item}</div>)}</div><div className={drawer.sectionTitleLoose}>운영 원칙</div><div className={styles.boundaryNote}>등록 차단·임시 숨김은 고위험 규칙에만 사용합니다. 오탐률 상승 시 자동 조치보다 검토 큐 생성을 우선하며, 규칙 변경 전후 버전과 결과를 탐지 이력에 보존합니다.</div></DetailDrawer>}
  </div>;
}

export function DetectionHistoryPage() {
  const navigate=useNavigate();
  const [searchParams,setSearchParams]=useSearchParams();
  const [keyword,setKeyword]=useState('');
  const [search,setSearch]=useState('');
  const [result,setResult]=useState('');
  const [rule,setRule]=useState('');
  const [actor,setActor]=useState('');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const productFilter=searchParams.get('product')??'';
  const selected=DETECTION_LOGS.find((item)=>item.id===selectedId)??null;
  const filtered=useMemo(()=>DETECTION_LOGS.filter((item)=>(!productFilter||item.productId===productFilter)&&(!result||item.result===result)&&(!rule||item.ruleId===rule)&&(!actor||(actor==='SYSTEM'?item.actor==='SYSTEM':item.actor!=='SYSTEM'))&&(!search||`${item.id} ${item.ruleId} ${item.productId} ${item.productTitle} ${item.sellerId} ${item.sellerNickname} ${item.policyId} ${item.reason}`.toLowerCase().includes(search.toLowerCase()))),[actor,productFilter,result,rule,search]);
  const reset=()=>{setKeyword('');setSearch('');setResult('');setRule('');setActor('');setSearchParams(new URLSearchParams(),{replace:true});};
  const rows:GridRow[]=filtered.map((item)=>({id:item.id,onClick:()=>setSelectedId(item.id),cells:[{kind:'stack',title:item.detectedAt,subtitle:item.id},{kind:'stack',title:item.ruleName,subtitle:`${item.ruleId} · ${item.policyId}`},{kind:'stack',title:item.productTitle,subtitle:item.productId},{kind:'stack',title:item.sellerNickname,subtitle:item.sellerId},{kind:'progress',pct:item.score,label:`${item.score}점`},{kind:'stack',title:item.signals.join(' · '),subtitle:item.reason},{kind:'badge',text:item.result,...DETECTION_RESULT_META[item.result]},{kind:'stack',title:item.actionId,subtitle:item.actor},{kind:'link',text:'상세'}]}));
  return <div className={shared.page}>
    <PageHeading title="탐지 이력" subtitle="자동 탐지 규칙의 판정 점수와 신호, 적용 정책, 등록 차단·상품 조치 연계·오탐 해제 결과를 감사 이력으로 조회합니다."/>
    <ControlArea><FilterBox><form className={shared.filterRow1} onSubmit={(event)=>{event.preventDefault();setSearch(keyword.trim());}}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>탐지 ID</option><option>규칙 ID</option><option>상품</option><option>판매자</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event)=>setKeyword(event.target.value)} placeholder={productFilter?`${productFilter} 상품의 탐지 이력만 표시 중`:'탐지 / 규칙 / 상품 / 판매자 / 정책 ID / 판정 사유'}/><button className={shared.searchBtn}>조회</button></form><div className={shared.filterRow2}><label className="globalFilterField"><span>탐지 결과</span><select aria-label="탐지 결과" className={shared.selectSm} value={result} onChange={(event)=>setResult(event.target.value)}><option value="">전체 탐지 결과</option><option>등록 차단</option><option>조치 연계</option><option>통과</option><option>오탐 해제</option></select></label><label className="globalFilterField"><span>탐지 규칙</span><select aria-label="탐지 규칙" className={shared.selectSm} value={rule} onChange={(event)=>setRule(event.target.value)}><option value="">전체 탐지 규칙</option>{DETECTION_RULES.map((item)=><option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></label><label className="globalFilterField"><span>처리 주체</span><select aria-label="처리 주체" className={shared.selectSm} value={actor} onChange={(event)=>setActor(event.target.value)}><option value="">전체 처리 주체</option><option value="관리자">관리자</option><option>SYSTEM</option></select></label><span>탐지일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-26"/><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27"/><span className={shared.rowSpacer}/><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div></FilterBox></ControlArea>
    <GridArea><ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={()=>downloadCsv('c2c-product-detection-history.csv',['탐지일','탐지 ID','규칙','정책','상품','판매자','점수','신호','결과','조치 ID','처리자','사유'],filtered.map((item)=>[item.detectedAt,item.id,item.ruleId,item.policyId,item.productId,item.sellerId,item.score,item.signals.join('/'),item.result,item.actionId,item.actor,item.reason]))}>탐지 이력 다운로드</button></ResultBar><DataGrid columns={[{label:'탐지일 / 탐지 ID'},{label:'규칙 / 정책'},{label:'상품'},{label:'판매자'},{label:'점수'},{label:'탐지 신호 / 사유'},{label:'결과'},{label:'조치 / 처리자'},{label:'관리'}]} rows={rows} gridTemplate="128px 140px 148px 88px 90px minmax(300px,1.4fr) 76px 135px 55px" minWidth="1200px" empty={!filtered.length} emptyText="조건에 맞는 상품 탐지 이력이 없습니다." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length?`1–${filtered.length} / ${filtered.length}`:'0건'}/></GridArea>
    {selected&&<DetailDrawer eyebrow={`상품 탐지 로그 · ${selected.id}`} title={selected.productTitle} status={selected.result} statusMeta={DETECTION_RESULT_META[selected.result]} subtitle={`${selected.ruleName} · ${selected.detectedAt}`} onClose={()=>setSelectedId(null)} actions={<>{selected.actionId.startsWith('MOD-')&&<button type="button" className={drawer.primaryBtn} onClick={()=>navigate(`/c2c/products/moderation?product=${encodeURIComponent(selected.productId)}`)}>상품 조치 확인</button>}</>} stats={[{label:'탐지 점수',value:`${selected.score}점`},{label:'적용 정책',value:selected.policyId},{label:'처리자',value:selected.actor}]} fields={[{label:'상품 ID',value:selected.productId},{label:'판매자',value:`${selected.sellerNickname} (${selected.sellerId})`},{label:'탐지 규칙',value:`${selected.ruleId} · ${selected.ruleName}`},{label:'연결 조치',value:selected.actionId},{label:'판정 사유',value:selected.reason}]}><div className={drawer.sectionTitleLoose}>탐지 점수</div><div className={styles.scoreTrack}><div className={styles.scoreBar} style={{width:`${selected.score}%`}}/></div><div className={styles.scoreLabel}><span>0</span><strong>{selected.score}점</strong><span>100</span></div><div className={drawer.sectionTitleLoose}>탐지 신호</div><div className={styles.ruleSignals}>{selected.signals.map((item)=><div key={item} className={styles.signal}>{item}</div>)}</div><div className={drawer.sectionTitleLoose}>감사 원칙</div><div className={styles.boundaryNote}>탐지 이력은 규칙 버전과 원본 판정을 보존합니다. 운영자가 통과 또는 오탐 해제해도 최초 점수와 신호는 수정하지 않고 후속 결과만 추가합니다.</div></DetailDrawer>}
  </div>;
}
