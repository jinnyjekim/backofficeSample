export type Align = 'left' | 'center' | 'right';

interface BaseCell {
  align?: Align;
}

export interface TextCell extends BaseCell {
  kind: 'text';
  text: string;
  color?: string;
  size?: string;
  weight?: number;
  numeric?: boolean;
  tip?: string;
}
export interface PillTextCell extends BaseCell {
  kind: 'pillText';
  text: string;
  bg: string;
  fg: string;
  size?: string;
  weight?: number;
  sub?: string;
}
export interface BadgeCell extends BaseCell {
  kind: 'badge';
  text: string;
  bg: string;
  fg: string;
}
export interface BadgeSubCell extends BaseCell {
  kind: 'badgeSub';
  text: string;
  bg: string;
  fg: string;
  subText?: string;
}
export interface BadgeSquareCell extends BaseCell {
  kind: 'badgeSquare';
  text: string;
  bg: string;
  fg: string;
}
export interface CheckGroupCell extends BaseCell {
  kind: 'checkGroup';
  items: Array<{
    label: string;
    tone: 'success' | 'warning' | 'error' | 'muted';
  }>;
}
export interface StatusDotCell extends BaseCell {
  kind: 'statusDot';
  text: string;
  dot: string;
  fg: string;
}
export interface StackCell extends BaseCell {
  kind: 'stack';
  title: string;
  subtitle: string;
}
export interface AvatarTextCell extends BaseCell {
  kind: 'avatarText';
  title: string;
  subtitle: string;
  avatarChar: string;
  avatarBg: string;
  avatarFg: string;
}
export interface LinkCell extends BaseCell {
  kind: 'link';
  text: string;
  size?: string;
}
export interface ProgressCell extends BaseCell {
  kind: 'progress';
  pct: number;
  label: string;
}
export interface TitleWarnCell extends BaseCell {
  kind: 'titleWarn';
  title: string;
  hasIssue?: boolean;
  issueTitle?: string;
}
export interface NoWarnCell extends BaseCell {
  kind: 'noWarn';
  no: string;
  hasIssue?: boolean;
  issueTitle?: string;
}
export interface NoTagCell extends BaseCell {
  kind: 'noTag';
  no: string;
  hasTag?: boolean;
  tagText?: string;
  tagBg?: string;
  tagFg?: string;
}
export interface ThumbTitleCell extends BaseCell {
  kind: 'thumbTitle';
  thumb: string;
  title: string;
  id: string;
  titleFg?: string;
  onClick?: () => void;
}
export interface RowMenuCell extends BaseCell {
  kind: 'rowMenu';
  detailLabel?: string;
  onDetail?: () => void;
  open: boolean;
  onToggle: () => void;
  items: { label?: string; sep?: boolean; fg?: string; click?: () => void }[];
}

export type Cell =
  | TextCell
  | PillTextCell
  | BadgeCell
  | BadgeSubCell
  | BadgeSquareCell
  | CheckGroupCell
  | StatusDotCell
  | StackCell
  | AvatarTextCell
  | LinkCell
  | ProgressCell
  | TitleWarnCell
  | NoWarnCell
  | NoTagCell
  | ThumbTitleCell
  | RowMenuCell;

export interface GridRow {
  id: string | number;
  cells: Cell[];
  onClick?: () => void;
  bg?: string;
  mark?: string;
  selected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}

export interface GridColumn {
  label: string;
  align?: Align;
  onClick?: () => void;
}

export interface PageBtn {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface DataGridProps {
  columns: GridColumn[];
  rows: GridRow[];
  gridTemplate: string;
  minWidth: string;
  selectable?: boolean;
  allSelected?: boolean;
  onToggleAll?: () => void;
  showPagination?: boolean;
  pages?: PageBtn[];
  rangeLabel?: string;
  empty?: boolean;
  emptyText?: string;
  emptySubtext?: string;
  emptyActionLabel?: string;
  emptyActionClick?: () => void;
  fillHeight?: boolean;
  stickyHeader?: boolean;
  showTopBar?: boolean;
  totalLabel?: string;
  actions?: { label: string; onClick: () => void }[];
}
