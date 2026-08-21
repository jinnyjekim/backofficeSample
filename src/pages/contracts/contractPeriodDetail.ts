import type { PeriodContractCalc, PeriodHistoryEntry, PeriodLinkedField } from './contractPeriodData';

export interface PeriodFieldRow {
  label: string;
  value: string;
  weight: number;
  color: string;
}

export interface ContractPeriodDetail {
  no: string;
  partner: string;
  name: string;
  contractStatus: PeriodContractCalc['status'];
  periodLabel: PeriodContractCalc['periodStatus'];
  periodBg: string;
  periodFg: string;
  start: string;
  end: string;
  tlStart: string;
  tlEnd: string;
  tlPct: number;
  elapsedDays: number;
  remainDays: number;
  hasIssue: boolean;
  issueLabel: string | null;
  canRenew: boolean;
  summaryFields: PeriodFieldRow[];
  renewalFields: PeriodFieldRow[];
  hasSuccessor: boolean;
  successor: string | null;
  hasGap: boolean;
  gapDays: number;
  gapRange: string;
  linkedFields: PeriodLinkedField[];
  history: PeriodHistoryEntry[];
}

function fmtDate(d: string): string {
  return d.replace(/-/g, '.');
}

export function buildContractPeriodDetail(selected: PeriodContractCalc): ContractPeriodDetail {
  const tlPct = Math.max(0, Math.min(100, Math.round((selected.elapsed / selected.totalDays) * 100)));
  const issue =
    selected.periodStatus === '만료 임박' && selected.renewal === '검토전'
      ? `만료 D-${selected.remain}인데 갱신 검토가 시작되지 않았습니다.`
      : null;

  return {
    no: selected.id,
    partner: selected.partner,
    name: selected.name,
    contractStatus: selected.status,
    periodLabel: selected.periodStatus,
    periodBg: selected.periodBg,
    periodFg: selected.periodFg,
    start: fmtDate(selected.start),
    end: fmtDate(selected.end),
    tlStart: fmtDate(selected.start),
    tlEnd: fmtDate(selected.end),
    tlPct,
    elapsedDays: Math.max(0, selected.elapsed),
    remainDays: Math.max(0, selected.remain),
    hasIssue: !!issue,
    issueLabel: issue,
    canRenew: selected.periodStatus === '만료 임박' || selected.periodStatus === '만료',
    summaryFields: [
      { label: '시작일', value: fmtDate(selected.start), weight: 500, color: '#3f3f46' },
      { label: '종료일', value: fmtDate(selected.end), weight: 500, color: '#3f3f46' },
      { label: '총 계약기간', value: selected.totalDays + '일', weight: 500, color: '#3f3f46' },
      { label: '경과기간', value: Math.max(0, selected.elapsed) + '일', weight: 500, color: '#3f3f46' },
      { label: '잔여기간', value: Math.max(0, selected.remain) + '일', weight: 700, color: selected.periodStatus === '만료 임박' ? '#d97706' : '#18181b' },
      { label: '기간 상태', value: selected.periodStatus, weight: 600, color: selected.periodFg },
      { label: '계약 상태', value: selected.status, weight: 500, color: '#3f3f46' },
    ],
    renewalFields: [
      { label: '갱신 상태', value: selected.renewal, weight: 600, color: '#18181b' },
      { label: '담당자', value: selected.owner, weight: 500, color: '#3f3f46' },
      { label: '자동 갱신', value: '사용 안함', weight: 500, color: '#3f3f46' },
      { label: '해지 통보 기한', value: '해당없음', weight: 500, color: '#3f3f46' },
    ],
    hasSuccessor: !!selected.successor,
    successor: selected.successor,
    hasGap: !!(selected.gap && selected.gap.days > 0),
    gapDays: selected.gap ? selected.gap.days : 0,
    gapRange: selected.gap ? selected.gap.range : '',
    linkedFields: selected.linked,
    history: selected.history,
  };
}
