import type { Member } from '../../data/members';
import { ACCENT, GREEN, RED, avatarColors, STATUS_STYLE } from '../../lib/theme';

export type Tier = '일반' | '우수회원' | 'VIP';

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

export interface MemberDetail {
  id: number;
  name: string;
  handle: string;
  initial: string;
  avBg: string;
  avFg: string;
  status: Member['status'];
  statusFg: string;
  statusBg: string;
  tier: Tier;
  suspended: boolean;
  actionLabel: string;
  actionFg: string;
  actionBg: string;
  actionBorder: string;
  fields: FieldRow[];
  toggles: { label: string; value: string; color: string }[];
  activity: TimelineEntry[];
  paySummary: string;
  orders: OrderRow[];
  inquirySummary: string;
  inquiries: InquiryRow[];
  logs: LogEntry[];
}

export function defaultTier(m: Member): Tier {
  return m.orders > 30 ? 'VIP' : m.orders > 8 ? '우수회원' : '일반';
}

export function buildMemberDetail(m: Member, tier: Tier): MemberDetail {
  const [avBg, avFg] = avatarColors(m.id);
  const suspended = m.status === '정지';
  const seq = m.id % 7;
  const phone = '010-' + (3000 + (m.id % 6000)) + '-' + (1000 + (m.id % 8999));
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

  return {
    id: m.id,
    name: m.name,
    handle: m.handle,
    initial: m.name[0],
    avBg,
    avFg,
    status: m.status,
    statusFg: STATUS_STYLE[m.status].fg,
    statusBg: m.status === '정상' ? '#ecfdf5' : m.status === '정지' ? '#fef2f2' : m.status === '휴면' ? '#fffbeb' : '#f4f4f5',
    tier,
    suspended,
    actionLabel: suspended ? '정지 해제' : '이용 정지',
    actionFg: suspended ? '#059669' : '#b91c1c',
    actionBg: suspended ? '#ecfdf5' : '#fef2f2',
    actionBorder: suspended ? 'rgba(5,150,105,.25)' : 'rgba(185,28,28,.2)',
    fields: [
      { label: '이메일', value: m.email, color: '#3f3f46' },
      { label: '휴대폰', value: phone, color: '#3f3f46' },
      { label: '성별', value: seq % 2 ? '여성' : '남성', color: '#3f3f46' },
      { label: '생년월일', value: birth, color: '#3f3f46' },
      { label: '가입 경로', value: m.provider, color: '#3f3f46' },
      { label: '가입일', value: m.joined, color: '#3f3f46' },
      { label: '마지막 접속', value: m.seen, color: '#3f3f46' },
      { label: '누적 주문 · 결제', value: m.orders + '건 · ' + m.spend, color: '#18181b' },
    ],
    toggles: [
      { label: '이메일 인증', value: m.status === '탈퇴' ? '미인증' : '인증 완료', color: m.status === '탈퇴' ? '#a1a1aa' : '#059669' },
      { label: '마케팅 수신 동의', value: m.marketing ? '동의' : '미동의', color: m.marketing ? '#059669' : '#a1a1aa' },
    ],
    activity: [
      { title: '주문 ' + orderList[0].no + ' 결제', sub: orderList[0].item + ' · ' + orderList[0].amount, when: '2026.08.10 15:00', dot: GREEN },
      { title: '문의 ' + inqList[0].no + ' 접수', sub: '배송 문의 등록', when: '2026.08.09 20:30', dot: ACCENT },
      { title: '배송지 정보 변경', sub: '기본 배송지 교체', when: '2026.08.03 11:12', dot: '#d4d4d8' },
      { title: '회원 가입', sub: m.provider + ' 계정으로 가입', when: m.joined, dot: '#d4d4d8' },
    ],
    paySummary: '총 ' + orderList.length + '건 · 누적 ' + m.spend,
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
