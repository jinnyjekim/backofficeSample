import { DatePicker } from '../../../components/forms/DatePicker';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataGrid } from '../../../components/DataGrid';
import type { GridRow } from '../../../components/DataGrid/types';
import shared from '../shared.module.css';
import drawer from '../../ops/opsDrawerShared.module.css';
import base from '../sales/SalesActivity.module.css';
import styles from './TradeSafety.module.css';
import { CommonButton, showToast } from '../../../components/common';
import { ControlArea, DetailDrawer, FilterBox, GridArea, Metrics, PageHeading, ResultBar } from '../sales/SalesActivityShared';
import { downloadCsv, pages } from '../sales/salesActivityUtils';
import { formatWon } from '../sales/salesActivityData';
import {
  HOLD_STATUS_META,
  RISK_CASES,
  RISK_LEVEL_META,
  RISK_STATUS_META,
  TRADE_HOLDS,
  type HoldStatus,
  type RiskCase,
  type RiskLevel,
  type RiskSignalType,
  type RiskStatus,
  type TradeHold,
} from './tradeSafetyData';

type RiskQuick = '전체' | '검토 필요' | '검토중' | '소명대기' | '종결';

const SIGNALS: RiskSignalType[] = ['반복 취소', '반복 신고', '비정상 거래', '의심 계정'];
const SIGNAL_BY_PARAM: Record<string, RiskSignalType> = {
  cancels: '반복 취소',
  reports: '반복 신고',
  abnormal: '비정상 거래',
  accounts: '의심 계정',
};
const PARAM_BY_SIGNAL: Record<RiskSignalType, string> = {
  '반복 취소': 'cancels',
  '반복 신고': 'reports',
  '비정상 거래': 'abnormal',
  '의심 계정': 'accounts',
};

function matchesRiskQuick(item: RiskCase, quick: RiskQuick) {
  if (quick === '전체') return true;
  if (quick === '검토 필요') return item.status === '탐지';
  if (quick === '종결') return item.status === '조치완료' || item.status === '오탐종결';
  return item.status === quick;
}

function riskScoreClass(score: number) {
  if (score >= 85) return `${styles.score} ${styles.scoreDanger}`;
  if (score >= 70) return `${styles.score} ${styles.scoreWarn}`;
  return `${styles.score} ${styles.scoreNormal}`;
}

export function TradeRiskMonitoringPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cases, setCases] = useState<RiskCase[]>(RISK_CASES);
  const [quick, setQuick] = useState<RiskQuick>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<RiskLevel | ''>('');
  const [assignee, setAssignee] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const signalType = SIGNAL_BY_PARAM[searchParams.get('signal') ?? ''] ?? '';
  const selected = cases.find((item) => item.id === selectedId) ?? null;
  const quicks: RiskQuick[] = ['전체', '검토 필요', '검토중', '소명대기', '종결'];

  const filtered = useMemo(() => cases.filter((item) => {
    if (!matchesRiskQuick(item, quick)) return false;
    if (signalType && item.signalType !== signalType) return false;
    if (level && item.level !== level) return false;
    if (assignee && (assignee === '미배정' ? item.assignee !== '미배정' : item.assignee === '미배정')) return false;
    if (search && !`${item.id} ${item.targetId} ${item.accountId} ${item.accountName} ${item.summary}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [assignee, cases, level, quick, search, signalType]);

  const notify = (message: string) => showToast({ message, type: 'success' });

  const selectSignal = (value: RiskSignalType | '') => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('signal', PARAM_BY_SIGNAL[value]);
    else next.delete('signal');
    setSearchParams(next, { replace: true });
  };

  const patchSelected = (status: RiskStatus, action: string, detail: string) => {
    if (!selected) return;
    setCases((items) => items.map((item) => item.id === selected.id ? {
      ...item,
      status,
      assignee: item.assignee === '미배정' ? 'admin01' : item.assignee,
      lastActionAt: '2026-08-27 11:20',
      history: [{ at: '2026-08-27 11:20', actor: 'admin01', action, detail }, ...item.history],
    } : item));
    notify(`${selected.id} 위험 건을 ${action} 처리했습니다.`);
  };

  const reset = () => {
    setKeyword('');
    setSearch('');
    setLevel('');
    setAssignee('');
    setQuick('전체');
    selectSignal('');
  };

  const rows: GridRow[] = filtered.map((item) => ({
    id: item.id,
    onClick: () => setSelectedId(item.id),
    bg: item.level === '긴급' && item.status !== '조치완료' ? '#fffafa' : undefined,
    mark: item.level === '긴급' && item.status !== '조치완료' ? 'inset 3px 0 #ef4444' : undefined,
    cells: [
      { kind: 'stack', title: item.id, subtitle: item.detectedAt },
      { kind: 'pillText', text: item.signalType, bg: '#f4f4f5', fg: '#52525b' },
      { kind: 'stack', title: item.accountName, subtitle: `${item.targetType} · ${item.targetId}` },
      { kind: 'titleWarn', title: item.summary, hasIssue: item.level === '긴급', issueTitle: item.indicators.join(' · ') },
      { kind: 'badge', text: item.level, ...RISK_LEVEL_META[item.level] },
      { kind: 'text', text: `${item.score}점`, align: 'right', numeric: true, weight: 800, color: item.score >= 85 ? '#dc2626' : item.score >= 70 ? '#c2410c' : '#1d4ed8' },
      { kind: 'badge', text: item.status, ...RISK_STATUS_META[item.status] },
      { kind: 'text', text: item.assignee, color: item.assignee === '미배정' ? '#dc2626' : '#52525b' },
    ],
  }));

  return <div className={shared.page}>
    <PageHeading title="위험 모니터링" subtitle="취소·신고·거래·계정 신호를 하나의 위험 건으로 묶어 우선순위에 따라 검토하고 조치합니다." />
    <Metrics items={[
      { label: '검토 필요', value: `${cases.filter((item) => item.status === '탐지').length}건`, note: '담당자 배정 필요', tone: 'down', dot: '#ef4444' },
      { label: '고위험 건', value: `${cases.filter((item) => item.level === '긴급' || item.level === '높음').length}건`, note: '위험도 높음 이상', tone: 'down', dot: '#f59e0b' },
      { label: '거래 보류 연계', value: `${TRADE_HOLDS.filter((item) => item.status === '보류중').length}건`, note: '현재 보류 상태', dot: '#8b5cf6' },
      { label: '오늘 종결', value: `${cases.filter((item) => item.status === '조치완료' || item.status === '오탐종결').length}건`, note: '조치 및 오탐 포함', tone: 'up', dot: '#10b981' },
    ]} />
    <ControlArea>
      <div className={shared.quickFilters}>{quicks.map((item) => {
        const active = quick === item;
        return (
          <CommonButton
            type="button"
            key={item}
            variant={active ? 'primary-light' : 'secondary'}
            size="md"
            className={`${shared.qfBtn} ${active ? base.quickActive : ''}`}
            onClick={() => setQuick(item)}
          >
            <span className={shared.qfLabel}>{item}</span>
            <span className={shared.qfCount}>{cases.filter((risk) => matchesRiskQuick(risk, item)).length}</span>
          </CommonButton>
        );
      })}</div>
      <FilterBox>
        <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}>
          <label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>위험 건 ID</option><option>거래 / 계정 ID</option><option>대상 계정</option></select></label>
          <input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="위험 건 / 거래 / 계정 ID 또는 대상명" />
          <button className={shared.searchBtn}>조회</button>
        </form>
        <div className={shared.filterRow2}>
          <label className="globalFilterField"><span>탐지 유형</span><select aria-label="탐지 유형" className={shared.selectSm} value={signalType} onChange={(event) => selectSignal(event.target.value as RiskSignalType | '')}><option value="">전체 탐지 유형</option>{SIGNALS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="globalFilterField"><span>위험도</span><select aria-label="위험도" className={shared.selectSm} value={level} onChange={(event) => setLevel(event.target.value as RiskLevel | '')}><option value="">전체 위험도</option><option>긴급</option><option>높음</option><option>보통</option><option>낮음</option></select></label>
          <label className="globalFilterField"><span>배정 상태</span><select aria-label="배정 상태" className={shared.selectSm} value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="">전체 배정 상태</option><option>미배정</option><option value="배정">담당자 배정</option></select></label>
          <span>탐지일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20" /><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27" />
          <span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button>
        </div>
      </FilterBox>
    </ControlArea>
    <GridArea>
      <ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('c2c-risk-monitoring.csv', ['위험 건', '탐지 유형', '대상', '위험도', '점수', '상태'], filtered.map((item) => [item.id, item.signalType, item.targetId, item.level, item.score, item.status]))}>다운로드</button></ResultBar>
      <DataGrid columns={[{ label: '위험 건 / 탐지일' }, { label: '탐지 유형' }, { label: '대상' }, { label: '탐지 요약' }, { label: '위험도' }, { label: '점수', align: 'right' }, { label: '검토 상태' }, { label: '담당자' }]} rows={rows} gridTemplate="128px 82px 130px minmax(230px,1.5fr) 56px 44px 80px 64px" minWidth="950px" empty={!filtered.length} emptyText="조건에 맞는 위험 건이 없습니다." emptySubtext="탐지 유형이나 위험도 필터를 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} />
    </GridArea>
    {selected && <DetailDrawer eyebrow={`거래 안전 위험 건 · ${selected.id}`} title={selected.summary} status={selected.status} statusMeta={RISK_STATUS_META[selected.status]} subtitle={`${selected.signalType} · ${selected.detectedAt}`} onClose={() => setSelectedId(null)} actions={<>
      {selected.status === '탐지' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('검토중', '검토 시작', '담당자 배정 및 연관 거래 확인')}>검토 시작</button>}
      {(selected.status === '탐지' || selected.status === '검토중') && <button type="button" className={drawer.actionLink} onClick={() => patchSelected('소명대기', '소명 요청', '대상 회원에게 거래 증빙 제출 요청')}>소명 요청</button>}
      {selected.status !== '조치완료' && selected.status !== '오탐종결' && <button type="button" className={drawer.dangerBtn} onClick={() => patchSelected('소명대기', '거래 보류', '검토 완료 전 거래 및 판매대금 지급 보류')}>거래 보류</button>}
      <span className={drawer.spacer} />
      {selected.status !== '조치완료' && selected.status !== '오탐종결' && <button type="button" className={drawer.actionLink} onClick={() => patchSelected('오탐종결', '오탐 종결', '증빙 확인 결과 정상 활동으로 판단')}>오탐 종결</button>}
    </>} stats={[{ label: '위험 점수', value: `${selected.score}점` }, { label: '연관 거래', value: `${selected.relatedTrades}건` }, { label: '연관 금액', value: formatWon(selected.amount) }]} fields={[{ label: '탐지 유형', value: selected.signalType }, { label: '위험도', value: <span className={riskScoreClass(selected.score)}>{selected.level}</span> }, { label: '대상', value: `${selected.accountName} (${selected.accountId})` }, { label: '대상 구분', value: `${selected.targetType} · ${selected.targetId}` }, { label: '담당자', value: selected.assignee }, { label: '최근 조치', value: selected.lastActionAt }]}>
      <div className={drawer.sectionTitleLoose}>탐지 요약</div><div className={styles.riskSummary}>{selected.summary}</div>
      <div className={drawer.sectionTitleLoose}>위험 지표</div><div className={styles.indicatorList}>{selected.indicators.map((item) => <div key={item} className={styles.indicatorItem}>{item}</div>)}</div>
      <div className={drawer.sectionTitleLoose}>검토 / 조치 이력</div><div className={base.timeline}>{selected.history.map((item, index) => <div className={base.timelineItem} key={`${item.at}-${index}`}><strong>{item.action}</strong><p>{item.detail} · {item.actor}</p><time>{item.at}</time></div>)}</div>
    </DetailDrawer>}
  </div>;
}

type HoldQuick = '전체' | HoldStatus;

export function TradeHoldManagementPage() {
  const [holds, setHolds] = useState<TradeHold[]>(TRADE_HOLDS);
  const [quick, setQuick] = useState<HoldQuick>('전체');
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = holds.find((item) => item.id === selectedId) ?? null;
  const quicks: HoldQuick[] = ['전체', '보류중', '해제 승인 대기', '해제', '만료'];

  const filtered = useMemo(() => holds.filter((item) => {
    if (quick !== '전체' && item.status !== quick) return false;
    if (scope && !item.scopes.includes(scope as '거래 진행' | '판매대금 지급')) return false;
    if (search && !`${item.id} ${item.tradeId} ${item.riskCaseId} ${item.accountId} ${item.accountName} ${item.buyer}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [holds, quick, scope, search]);

  const notify = (message: string) => showToast({ message, type: 'success' });

  const patchSelected = (status: HoldStatus, action: string, detail: string) => {
    if (!selected) return;
    setHolds((items) => items.map((item) => item.id === selected.id ? {
      ...item,
      status,
      approvalBy: status === '해제 승인 대기' ? 'admin05' : status === '해제' ? 'admin01' : item.approvalBy,
      releaseDueAt: action === '보류 연장' ? '2026-08-31 18:00' : item.releaseDueAt,
      history: [{ at: '2026-08-27 11:30', actor: 'admin01', action, detail }, ...item.history],
    } : item));
    notify(`${selected.id} 건을 ${action} 처리했습니다.`);
  };

  const reset = () => {
    setQuick('전체');
    setKeyword('');
    setSearch('');
    setScope('');
  };

  const rows: GridRow[] = filtered.map((item) => ({
    id: item.id,
    onClick: () => setSelectedId(item.id),
    bg: item.status === '보류중' && item.releaseDueAt.slice(0, 10) <= '2026-08-27' ? '#fffafa' : undefined,
    cells: [
      { kind: 'stack', title: item.id, subtitle: item.heldAt },
      { kind: 'stack', title: item.tradeId, subtitle: item.riskCaseId },
      { kind: 'stack', title: item.accountName, subtitle: `${item.accountId} · 구매자 ${item.buyer}` },
      { kind: 'titleWarn', title: item.reason, hasIssue: item.status === '보류중' && item.releaseDueAt.slice(0, 10) <= '2026-08-27', issueTitle: '해제 검토 기한이 임박했습니다.' },
      { kind: 'text', text: formatWon(item.amount), align: 'right', numeric: true, weight: 700 },
      { kind: 'pillText', text: item.scopes.join(' + '), bg: '#fef2f2', fg: '#b91c1c' },
      { kind: 'badge', text: item.status, ...HOLD_STATUS_META[item.status] },
      { kind: 'stack', title: item.releaseDueAt.slice(0, 10), subtitle: item.handler },
    ],
  }));

  const heldAmount = holds.filter((item) => item.status === '보류중' || item.status === '해제 승인 대기').reduce((sum, item) => sum + item.amount, 0);

  return <div className={shared.page}>
    <PageHeading title="거래 보류 관리" subtitle="위험 검토로 중단된 거래와 판매대금의 해제 기한·승인 상태를 관리합니다." />
    <Metrics items={[
      { label: '현재 보류', value: `${holds.filter((item) => item.status === '보류중').length}건`, note: '조사 및 소명 진행중', tone: 'down', dot: '#ef4444' },
      { label: '해제 승인 대기', value: `${holds.filter((item) => item.status === '해제 승인 대기').length}건`, note: '승인자 확인 필요', dot: '#f59e0b' },
      { label: '보류 금액', value: formatWon(heldAmount), note: '거래·판매대금 합계', dot: '#8b5cf6' },
      { label: '오늘 해제', value: `${holds.filter((item) => item.status === '해제').length}건`, note: '정상 거래 재개', tone: 'up', dot: '#10b981' },
    ]} />
    <ControlArea>
      <div className={shared.quickFilters}>{quicks.map((item) => {
        const active = quick === item;
        return (
          <CommonButton
            type="button"
            key={item}
            variant={active ? 'primary-light' : 'secondary'}
            size="md"
            className={`${shared.qfBtn} ${active ? base.quickActive : ''}`}
            onClick={() => setQuick(item)}
          >
            <span className={shared.qfLabel}>{item}</span>
            <span className={shared.qfCount}>{holds.filter((hold) => item === '전체' || hold.status === item).length}</span>
          </CommonButton>
        );
      })}</div>
      <FilterBox>
        <form className={shared.filterRow1} onSubmit={(event) => { event.preventDefault(); setSearch(keyword.trim()); }}><label className="globalFilterField"><span>검색 범위</span><select aria-label="검색 범위" className={shared.selectSm}><option>통합 검색</option><option>보류번호</option><option>거래번호</option><option>계정</option></select></label><input className={shared.searchInput} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="보류 / 거래 / 위험 건 ID 또는 대상 계정" /><button className={shared.searchBtn}>조회</button></form>
        <div className={shared.filterRow2}><label className="globalFilterField"><span>보류 범위</span><select aria-label="보류 범위" className={shared.selectSm} value={scope} onChange={(event) => setScope(event.target.value)}><option value="">전체 보류 범위</option><option>거래 진행</option><option>판매대금 지급</option></select></label><span>보류일</span><DatePicker className={shared.selectSm} defaultValue="2026-08-20" /><span>~</span><DatePicker className={shared.selectSm} defaultValue="2026-08-27" /><span className={shared.rowSpacer} /><button type="button" className={shared.resetBtn} onClick={reset}>초기화</button></div>
      </FilterBox>
    </ControlArea>
    <GridArea>
      <ResultBar count={filtered.length} unit="건"><button type="button" className={shared.downloadBtn} onClick={() => downloadCsv('c2c-trade-holds.csv', ['보류번호', '거래번호', '대상', '금액', '범위', '상태', '해제기한'], filtered.map((item) => [item.id, item.tradeId, item.accountName, item.amount, item.scopes.join(' + '), item.status, item.releaseDueAt]))}>다운로드</button></ResultBar>
      <DataGrid columns={[{ label: '보류번호 / 보류일' }, { label: '거래 / 위험 건' }, { label: '대상 계정' }, { label: '보류 사유' }, { label: '금액', align: 'right' }, { label: '보류 범위' }, { label: '상태' }, { label: '해제 기한 / 담당자' }]} rows={rows} gridTemplate="136px 132px 176px minmax(220px,1.4fr) 95px 144px 100px 125px" minWidth="1130px" empty={!filtered.length} emptyText="조건에 맞는 거래 보류 건이 없습니다." emptySubtext="상태나 보류 범위 필터를 변경해 주세요." emptyActionLabel="필터 초기화" emptyActionClick={reset} showPagination pages={pages} rangeLabel={filtered.length ? `1–${filtered.length} / ${filtered.length}` : '0건'} />
    </GridArea>
    {selected && <DetailDrawer eyebrow={`거래 보류 · ${selected.id}`} title={selected.reason} status={selected.status} statusMeta={HOLD_STATUS_META[selected.status]} subtitle={`${selected.tradeId} · ${selected.heldAt}`} onClose={() => setSelectedId(null)} actions={<>
      {selected.status === '보류중' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('해제 승인 대기', '보류 해제 요청', '위험 검토 완료에 따른 해제 승인 요청')}>해제 요청</button>}
      {selected.status === '해제 승인 대기' && <button type="button" className={drawer.primaryBtn} onClick={() => patchSelected('해제', '보류 해제 승인', '승인 완료 · 거래 및 지급 재개')}>해제 승인</button>}
      {selected.status === '보류중' && <button type="button" className={drawer.actionLink} onClick={() => patchSelected('보류중', '보류 연장', '추가 소명 확인을 위해 해제 기한 연장')}>보류 연장</button>}
    </>} stats={[{ label: '보류 금액', value: formatWon(selected.amount) }, { label: '보류 범위', value: `${selected.scopes.length}개` }, { label: '해제 기한', value: selected.releaseDueAt.slice(0, 10) }]} fields={[{ label: '거래번호', value: selected.tradeId }, { label: '위험 건', value: selected.riskCaseId }, { label: '대상 계정', value: `${selected.accountName} (${selected.accountId})` }, { label: '구매자', value: selected.buyer }, { label: '담당자', value: selected.handler }, { label: '해제 승인자', value: selected.approvalBy }]}>
      <div className={drawer.sectionTitleLoose}>보류 사유</div><div className={styles.holdSummary}>{selected.reason}</div>
      <div className={drawer.sectionTitleLoose}>보류 범위</div><div className={styles.scopeList}>{selected.scopes.map((item) => <span key={item} className={styles.scopeChip}>{item}</span>)}</div>
      <div className={drawer.sectionTitleLoose}>처리 이력</div><div className={base.timeline}>{selected.history.map((item, index) => <div className={base.timelineItem} key={`${item.at}-${index}`}><strong>{item.action}</strong><p>{item.detail} · {item.actor}</p><time>{item.at}</time></div>)}</div>
    </DetailDrawer>}
  </div>;
}
