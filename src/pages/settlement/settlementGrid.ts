import type { GridColumn, GridRow } from '../../components/DataGrid/types';
import { PAY_STATUS_META, SETTLE_STATUS_META, calcAdjustTotal, calcFee, calcFinal, fmt, signed, type Settlement } from './settlementData';

export const SETTLEMENT_GRID_TEMPLATE = '104px 108px 138px 68px 116px 100px 100px 122px 92px 78px 78px 68px 56px';
export const SETTLEMENT_GRID_MIN_WIDTH = '1400px';

export const SETTLEMENT_GRID_COLUMNS: GridColumn[] = [
  { label: '정산번호' },
  { label: '정산대상' },
  { label: '정산기간' },
  { label: '거래건수', align: 'right' },
  { label: '총거래금액', align: 'right' },
  { label: '공제', align: 'right' },
  { label: '조정', align: 'right' },
  { label: '최종정산금액', align: 'right' },
  { label: '지급예정일' },
  { label: '정산상태' },
  { label: '지급상태' },
  { label: '담당자' },
  { label: '관리' },
];

export function buildSettlementRows(list: Settlement[], onOpen: (id: string) => void): GridRow[] {
  return list.map((r) => {
    const fee = calcFee(r);
    const adjustTotal = calcAdjustTotal(r);
    const final = calcFinal(r);
    const sm = SETTLE_STATUS_META[r.settleStatus];
    const pm = PAY_STATUS_META[r.payStatus];
    return {
      id: r.id,
      onClick: () => onOpen(r.id),
      cells: [
        { kind: 'noWarn', no: r.id, hasIssue: r.issues.length > 0, issueTitle: r.issues.join(' · ') },
        { kind: 'text', text: r.target, color: '#18181b', size: '13px', weight: 600 },
        { kind: 'text', text: r.period, color: '#71717a', size: '11px', weight: 500, numeric: true },
        { kind: 'text', text: `${r.txCount}건`, color: '#52525b', size: '12px', weight: 500, align: 'right', numeric: true },
        { kind: 'text', text: fmt(r.gross), color: '#3f3f46', size: '12px', weight: 600, align: 'right', numeric: true },
        { kind: 'text', text: fee ? '-' + fmt(fee) : '-', color: fee ? '#dc2626' : '#a1a1aa', size: '11.5px', weight: 500, align: 'right', numeric: true },
        {
          kind: 'text',
          text: adjustTotal ? signed(adjustTotal) : '-',
          color: adjustTotal > 0 ? '#059669' : adjustTotal < 0 ? '#dc2626' : '#a1a1aa',
          size: '11.5px', weight: 500, align: 'right', numeric: true,
        },
        { kind: 'text', text: fmt(final), color: '#18181b', size: '12.5px', weight: 700, align: 'right', numeric: true },
        { kind: 'text', text: r.dueDate.slice(5), color: '#71717a', size: '11.5px', weight: 500, numeric: true, tip: r.dueDate },
        { kind: 'badge', text: r.settleStatus, bg: sm.bg, fg: sm.fg },
        { kind: 'badge', text: r.payStatus, bg: pm.bg, fg: pm.fg },
        { kind: 'text', text: r.assignee, color: '#52525b', size: '11.5px', weight: 500 },
        { kind: 'link', text: '상세', size: '12px' },
      ],
    };
  });
}
