import type { Member } from '../../data/members';
import { ACCENT, GREEN, RED, avatarColors, formatWon } from '../../lib/theme';
import { ST, type BusinessMode, type ModeConfig } from './modeConfig';

export interface OrderRow {
  no: string;
  item: string;
  date: string;
  amount: string;
  status: string;
  fg: string;
}

export interface InquiryRow {
  no: string;
  type: string;
  title: string;
  date: string;
  status: string;
  bg: string;
  fg: string;
}

export interface TimelineEntry {
  title: string;
  sub: string;
  when: string;
  dot: string;
}

export interface LogEntry {
  title: string;
  titleFg: string;
  sub: string;
  when: string;
  dot: string;
}

export interface FieldRow {
  label: string;
  value: string;
  color: string;
}

export type SecondaryKind = 'reset' | 'approve' | 'sanction';

export interface MemberDetail {
  id: number;
  name: string;
  handle: string;
  initial: string;
  avBg: string;
  avFg: string;
  statusLabel: string;
  statusFg: string;
  statusBg: string;
  badgeLabel: string;
  suspended: boolean;
  actionLabel: string;
  actionFg: string;
  actionBg: string;
  actionBorder: string;
  secondaryLabel: string;
  secondaryKind: SecondaryKind;
  tabsDetail: string[];
  fields: FieldRow[];
  toggles: { label: string; value: string; color: string }[];
  activity: TimelineEntry[];
  tab1Kind: 'orders' | 'fields';
  tab1Fields: FieldRow[];
  paySummary: string;
  orders: OrderRow[];
  inquirySummary: string;
  inquiries: InquiryRow[];
  logs: LogEntry[];
}

export function buildMemberDetail(m: Member, mode: BusinessMode, cfg: ModeConfig): MemberDetail {
  const [avBg, avFg] = avatarColors(m.id);
  const isB2B = mode === 'B2B';
  const statusLabel = isB2B ? m.account : m.status;
  const st = ST[statusLabel] ?? ST['정상'];
  const suspended = isB2B ? m.account === '사용중지' : m.status === '정지';
  const seq = m.id % 7;
  const birth = (1985 + seq * 2) + '.0' + (1 + (seq % 9)) + '.' + (10 + seq * 2);

  const orderList: OrderRow[] = [
    { no: 'ORD-' + (9800 + seq), item: '프리미엄 플랜 1개월', date: '2026.08.10', amount: '29,000원', status: '결제완료', fg: '#059669' },
    { no: 'ORD-' + (9300 + seq), item: '기본 상품 패키지', date: '2026.07.08', amount: '89,000원', status: '배송완료', fg: '#52525b' },
    { no: 'ORD-' + (7400 + seq), item: '스페셜 에디션 세트', date: '2026.04.22', amount: '124,000원', status: '환불완료', fg: '#b91c1c' },
  ].slice(0, Math.max(1, Math.min(3, m.orders)));

  const inqList: InquiryRow[] = [
    { no: 'INQ-' + (440 + seq), type: '배송 문의', title: '배송이 언제 도착하나요?', date: '2026.08.09', status: '답변완료', bg: '#ecfdf5', fg: '#059669' },
    { no: 'INQ-' + (380 + seq), type: '결제 문의', title: '영수증 재발행 요청', date: '2026.07.02', status: '처리완료', bg: '#f4f4f5', fg: '#52525b' },
  ];

  const tab1Kind: 'orders' | 'fields' = mode === 'B2C' ? 'orders' : 'fields';
  const tab1Fields: FieldRow[] = mode === 'C2C'
    ? [
        { label: '이용 역할', value: cfg.badge(m), color: '#18181b' },
        { label: '판매자 상태', value: m.sellerStatus || '미등록', color: '#3f3f46' },
        { label: '등록 상품 수', value: m.listings + '개', color: '#3f3f46' },
        { label: '구매 거래', value: m.tradesBuy + '건', color: '#3f3f46' },
        { label: '판매 거래', value: m.tradesSell + '건', color: '#3f3f46' },
        { label: '신고 접수', value: m.reports + '건', color: m.reports > 0 ? '#b91c1c' : '#3f3f46' },
        { label: '진행중 분쟁', value: m.disputes + '건', color: m.disputes > 0 ? '#b91c1c' : '#3f3f46' },
        { label: '제재 상태', value: m.restriction || '없음', color: m.restriction ? '#b91c1c' : '#3f3f46' },
      ]
    : mode === 'B2B'
      ? [
          { label: '소속 회사', value: m.company || '미소속', color: m.company ? '#18181b' : '#a1a1aa' },
          { label: '회사 코드', value: m.companyCode || '—', color: '#3f3f46' },
          { label: '사업장', value: m.workplace || '—', color: '#3f3f46' },
          { label: '부서 / 직책', value: (m.dept || '—') + ' · ' + (m.title || '—'), color: '#3f3f46' },
          { label: '역할', value: m.role, color: '#3f3f46' },
          { label: '가입 승인', value: m.approval, color: m.approval === '승인대기' ? '#b45309' : '#3f3f46' },
          { label: '회사 거래 상태', value: m.companyTrade || '—', color: m.companyTrade === '거래중지' ? '#b91c1c' : '#3f3f46' },
        ]
      : [];

  const secondaryKind: SecondaryKind = isB2B && m.approval === '승인대기' ? 'approve' : mode === 'C2C' ? 'sanction' : 'reset';
  const secondaryLabel = secondaryKind === 'approve' ? '가입 승인' : secondaryKind === 'sanction' ? '제재 등록' : '비밀번호 초기화';

  return {
    id: m.id,
    name: m.name,
    handle: m.handle,
    initial: m.name[0],
    avBg,
    avFg,
    statusLabel,
    statusFg: st.fg,
    statusBg: st.bg,
    badgeLabel: cfg.badge(m),
    suspended,
    actionLabel: suspended ? (isB2B ? '사용 재개' : '정지 해제') : (isB2B ? '사용 중지' : '이용 정지'),
    actionFg: suspended ? '#059669' : '#b91c1c',
    actionBg: suspended ? '#ecfdf5' : '#fef2f2',
    actionBorder: suspended ? 'rgba(5,150,105,.25)' : 'rgba(185,28,28,.2)',
    secondaryLabel,
    secondaryKind,
    tabsDetail: cfg.tabsDetail,
    fields: [
      { label: '이메일', value: m.email, color: '#3f3f46' },
      { label: '휴대폰', value: m.phone, color: '#3f3f46' },
      { label: '생년월일', value: birth, color: '#3f3f46' },
      { label: '가입 경로', value: m.provider, color: '#3f3f46' },
      { label: '가입일', value: m.joined, color: '#3f3f46' },
      { label: '마지막 접속', value: m.seen, color: '#3f3f46' },
      { label: '누적 주문 · 결제', value: m.orders + '건 · ' + formatWon(m.spend), color: '#18181b' },
    ],
    toggles: [
      { label: '본인 인증', value: m.verified ? '인증 완료' : '미인증', color: m.verified ? '#059669' : '#a1a1aa' },
      { label: '마케팅 수신 동의', value: m.marketing ? '동의' : '미동의', color: m.marketing ? '#059669' : '#a1a1aa' },
    ],
    activity: [
      { title: '주문 ' + orderList[0].no + ' 결제', sub: orderList[0].item + ' · ' + orderList[0].amount, when: '2026.08.10 15:00', dot: GREEN },
      { title: '문의 ' + inqList[0].no + ' 접수', sub: '배송 문의 등록', when: '2026.08.09 20:30', dot: ACCENT },
      { title: '배송지 정보 변경', sub: '기본 배송지 교체', when: '2026.08.03 11:12', dot: '#d4d4d8' },
      { title: '회원 가입', sub: m.provider + ' 계정으로 가입', when: m.joined, dot: '#d4d4d8' },
    ],
    tab1Kind,
    tab1Fields,
    paySummary: '총 ' + orderList.length + '건 · 누적 ' + formatWon(m.spend),
    orders: orderList,
    inquirySummary: '총 ' + inqList.length + '건',
    inquiries: inqList,
    logs: [
      { title: '로그인 성공', titleFg: '#18181b', sub: 'IP 123.45.67.' + (10 + seq) + ' · Chrome / Windows', when: '2026.08.11 09:21', dot: GREEN },
      { title: '로그인 성공', titleFg: '#18181b', sub: 'IP 123.45.67.' + (10 + seq) + ' · Safari / iPhone', when: '2026.08.09 22:05', dot: GREEN },
      { title: '로그인 실패', titleFg: '#b91c1c', sub: '비밀번호 오류 · IP 98.76.54.32', when: '2026.08.07 14:33', dot: RED },
      { title: '비밀번호 변경', titleFg: '#18181b', sub: '이메일 인증 후 변경', when: '2026.08.01 11:10', dot: ACCENT },
    ],
  };
}
