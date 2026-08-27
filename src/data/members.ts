import type { MemberStatus } from '../lib/theme';

export type MemberBusinessType = 'B2B' | 'B2C' | 'C2C';

export interface Member {
  id: number;
  name: string;
  handle: string;
  shop: string;
  email: string;
  phone: string;
  provider: string;
  status: MemberStatus;
  joined: string;
  joinedDays: number;
  seen: string;
  seenDays: number | null;
  orders: number;
  spend: number;
  lastBuyDays: number | null;
  marketing: boolean;
  businessType: MemberBusinessType;

  verified: boolean;
  grade: string;
  group: string;

  buyer: boolean;
  seller: boolean;
  sellerStatus: string;
  listings: number;
  tradesBuy: number;
  tradesSell: number;
  reports: number;
  disputes: number;
  restriction: string;

  company: string;
  companyCode: string;
  workplace: string;
  dept: string;
  title: string;
  role: string;
  approval: string;
  companyTrade: string;
  account: string;
}

function m(o: Partial<Member> & Pick<Member, 'id' | 'name' | 'handle' | 'email' | 'provider' | 'status' | 'joined' | 'joinedDays' | 'seen' | 'seenDays' | 'orders' | 'spend'>): Member {
  return {
    shop: o.name + '샵',
    phone: '010-' + (1000 + (o.id % 9000)) + '-****',
    lastBuyDays: o.orders && o.orders > 0 ? (o.seenDays ?? 30) : null,
    marketing: false,
    businessType: 'B2C',
    verified: true,
    grade: o.orders! >= 30 ? 'VIP' : o.orders! >= 10 ? 'Gold' : 'Normal',
    group: o.orders! >= 30 ? '우수고객' : '일반',
    buyer: true,
    seller: false,
    sellerStatus: '',
    listings: 0,
    tradesBuy: 0,
    tradesSell: 0,
    reports: 0,
    disputes: 0,
    restriction: '',
    company: '',
    companyCode: '',
    workplace: '',
    dept: '',
    title: '',
    role: '일반 사용자',
    approval: '승인 완료',
    companyTrade: '',
    account: '정상',
    ...o,
  };
}

export const MEMBERS: Member[] = [
  m({ id: 102384, name: '김지은', handle: '@jieun_k', email: 'ji***@gmail.com', provider: 'Google', status: '정상', joined: '2026.08.21', joinedDays: 0, seen: '5분 전', seenDays: 0, orders: 24, spend: 1284000, marketing: true, businessType: 'B2C',
    buyer: true, seller: true, sellerStatus: '승인', listings: 12, tradesBuy: 26, tradesSell: 12,
    company: '대성상사', companyCode: 'C-1043', workplace: '서울 본사', dept: '구매팀', title: '대리', role: '구매 담당자', companyTrade: '거래중' }),
  m({ id: 102383, name: '홍길동', handle: '@hong_gd', email: 'ho***@naver.com', provider: 'Kakao', status: '정지', joined: '2026.08.19', joinedDays: 8, seen: '3일 전', seenDays: 3, orders: 3, spend: 64000, marketing: false, businessType: 'B2C',
    buyer: true, seller: true, sellerStatus: '정지', listings: 4, tradesBuy: 3, tradesSell: 6, reports: 4, disputes: 1, restriction: '판매 제한',
    company: '대성상사', companyCode: 'C-1043', workplace: '부산 지점', dept: '영업팀', title: '주임', role: '일반 사용자', companyTrade: '거래중', account: '사용중지' }),
  m({ id: 102382, name: '이민수', handle: '@mins_lee', email: 'mi***@email.com', provider: 'Email', status: '정상', joined: '2026.08.14', joinedDays: 13, seen: '1일 전', seenDays: 1, orders: 11, spend: 432900, marketing: true, businessType: 'C2C',
    buyer: true, seller: true, sellerStatus: '승인', listings: 7, tradesBuy: 9, tradesSell: 4,
    company: '한빛물산', companyCode: 'C-2091', workplace: '서울 본사', dept: '자재팀', title: '과장', role: '승인 담당자', companyTrade: '거래중' }),
  m({ id: 102381, name: '박서연', handle: '@seoyeon', email: 'pa***@apple.com', provider: 'Apple', status: '휴면', joined: '2026.06.20', joinedDays: 68, seen: '32일 전', seenDays: 32, orders: 7, spend: 298000, marketing: false, businessType: 'B2C',
    buyer: true, seller: false,
    company: '', companyCode: '', workplace: '', dept: '', title: '', role: '일반 사용자', approval: '승인대기', companyTrade: '', account: '정상' }),
  m({ id: 102380, name: '최준혁', handle: '@jun_choi', email: 'ch***@naver.com', provider: 'Naver', status: '정상', joined: '2026.06.01', joinedDays: 87, seen: '2시간 전', seenDays: 0, orders: 41, spend: 3102500, marketing: true, businessType: 'B2B',
    buyer: true, seller: true, sellerStatus: '승인', listings: 18, tradesBuy: 30, tradesSell: 20,
    company: '대성상사', companyCode: 'C-1043', workplace: '서울 본사', dept: '경영지원팀', title: '팀장', role: '관리자', companyTrade: '거래중' }),
  m({ id: 102379, name: '정유진', handle: '@yujin_j', email: 'je***@gmail.com', provider: 'Google', status: '탈퇴', joined: '2026.05.12', joinedDays: 107, seen: '—', seenDays: null, orders: 0, spend: 0, marketing: false, businessType: 'C2C',
    buyer: false, seller: false,
    company: '우리테크', companyCode: 'C-3312', workplace: '인천 지점', dept: '품질팀', title: '사원', role: '일반 사용자', approval: '승인대기', companyTrade: '거래대기', account: '승인대기' }),
  m({ id: 102378, name: '강태양', handle: '@taeyang', email: 'ka***@email.com', provider: 'Email', status: '정상', joined: '2026.04.30', joinedDays: 119, seen: '방금 전', seenDays: 0, orders: 18, spend: 876400, marketing: true, businessType: 'B2C',
    buyer: true, seller: true, sellerStatus: '승인', listings: 9, tradesBuy: 15, tradesSell: 9,
    company: '한빛물산', companyCode: 'C-2091', workplace: '대전 지점', dept: '영업팀', title: '대리', role: '구매 담당자', companyTrade: '거래중' }),
  m({ id: 102377, name: '윤소희', handle: '@sohee_y', email: 'yu***@kakao.com', provider: 'Kakao', status: '정상', joined: '2026.04.18', joinedDays: 131, seen: '4시간 전', seenDays: 0, orders: 9, spend: 221000, marketing: true, businessType: 'C2C',
    buyer: true, seller: false,
    company: '', companyCode: '', workplace: '', dept: '', title: '', role: '일반 사용자', account: '정상' }),
  m({ id: 102376, name: '임도현', handle: '@dohyun', email: 'im***@gmail.com', provider: 'Google', status: '휴면', joined: '2026.03.29', joinedDays: 151, seen: '61일 전', seenDays: 61, orders: 2, spend: 39000, marketing: false, businessType: 'B2C',
    buyer: true, seller: false,
    company: '우리테크', companyCode: 'C-3312', workplace: '인천 지점', dept: '자재팀', title: '사원', role: '일반 사용자', companyTrade: '거래중지', account: '정상' }),
  m({ id: 102375, name: '서지우', handle: '@jiwoo_s', email: 'se***@naver.com', provider: 'Naver', status: '정상', joined: '2026.03.11', joinedDays: 169, seen: '12시간 전', seenDays: 0, orders: 33, spend: 2410000, marketing: true, businessType: 'B2B',
    buyer: true, seller: true, sellerStatus: '승인', listings: 21, tradesBuy: 28, tradesSell: 17,
    company: '한빛물산', companyCode: 'C-2091', workplace: '서울 본사', dept: '구매팀', title: '차장', role: '승인 담당자', companyTrade: '거래중' }),
  m({ id: 102374, name: '한예린', handle: '@yerin_h', email: 'ha***@apple.com', provider: 'Apple', status: '정상', joined: '2026.02.24', joinedDays: 184, seen: '2일 전', seenDays: 2, orders: 6, spend: 150200, marketing: false, businessType: 'B2C',
    buyer: true, seller: false,
    company: '', companyCode: '', workplace: '', dept: '', title: '', role: '일반 사용자' }),
  m({ id: 102373, name: '오세훈', handle: '@sehun_o', email: 'oh***@email.com', provider: 'Email', status: '정지', joined: '2026.02.02', joinedDays: 206, seen: '18일 전', seenDays: 18, orders: 1, spend: 12000, marketing: false, businessType: 'C2C',
    buyer: true, seller: true, sellerStatus: '정지', listings: 2, tradesBuy: 1, tradesSell: 3, reports: 6, disputes: 2, restriction: '판매 제한',
    company: '', companyCode: '', workplace: '', dept: '', title: '', role: '일반 사용자', account: '사용중지' }),
  m({ id: 102372, name: '배수정', handle: '@sujeong', email: 'ba***@kakao.com', provider: 'Kakao', status: '정상', joined: '2026.01.19', joinedDays: 220, seen: '30분 전', seenDays: 0, orders: 52, spend: 4880000, marketing: true, businessType: 'B2B',
    buyer: true, seller: true, sellerStatus: '승인', listings: 30, tradesBuy: 45, tradesSell: 25,
    company: '대성상사', companyCode: 'C-1043', workplace: '서울 본사', dept: '구매팀', title: '부장', role: '관리자', companyTrade: '거래중' }),
  m({ id: 102371, name: '노민재', handle: '@minjae_n', email: 'no***@gmail.com', provider: 'Google', status: '정상', joined: '2026.01.05', joinedDays: 234, seen: '6일 전', seenDays: 6, orders: 14, spend: 610000, marketing: true, businessType: 'B2C',
    buyer: true, seller: true, sellerStatus: '승인대기', listings: 1, tradesBuy: 5, tradesSell: 1,
    company: '우리테크', companyCode: 'C-3312', workplace: '인천 지점', dept: '영업팀', title: '주임', role: '일반 사용자', companyTrade: '거래중' }),
];

export interface LeftMember {
  id: number;
  name: string;
  email: string;
  joined: string;
  left: string;
  dur: string;
  type: '직접탈퇴' | '관리자처리';
  reason: string;
  data: '보관중' | '파기완료';
  rejoin: boolean;
}

export const LEFT_MEMBERS: LeftMember[] = [
  { id: 102384, name: '김지은', email: 'ji***@gmail.com', joined: '2024.03.12', left: '2026.08.11 14:22', dur: '2년 4개월', type: '직접탈퇴', reason: '서비스를 자주 사용하지 않음', data: '보관중', rejoin: false },
  { id: 102212, name: '이민준', email: 'mi***@naver.com', joined: '2025.10.05', left: '2026.08.10 09:15', dur: '10개월', type: '직접탈퇴', reason: '기타', data: '파기완료', rejoin: false },
  { id: 101987, name: '박서연', email: 'pa***@apple.com', joined: '2023.01.20', left: '2026.08.09 18:43', dur: '3년 6개월', type: '직접탈퇴', reason: '가격 부담', data: '보관중', rejoin: false },
  { id: 101765, name: '최준혁', email: 'ch***@naver.com', joined: '2024.06.30', left: '2026.08.08 11:05', dur: '1년 1개월', type: '관리자처리', reason: '이용 불편', data: '보관중', rejoin: true },
  { id: 101540, name: '정유진', email: 'je***@gmail.com', joined: '2022.11.03', left: '2026.08.07 16:30', dur: '3년 9개월', type: '직접탈퇴', reason: '다른 서비스 이용', data: '파기완료', rejoin: false },
  { id: 101233, name: '강태양', email: 'ka***@email.com', joined: '2025.02.14', left: '2026.08.05 08:20', dur: '1년 5개월', type: '직접탈퇴', reason: '원하는 콘텐츠 부족', data: '보관중', rejoin: false },
  { id: 100988, name: '윤소희', email: 'yu***@kakao.com', joined: '2023.08.19', left: '2026.08.03 13:55', dur: '2년 11개월', type: '직접탈퇴', reason: '개인정보 우려', data: '파기완료', rejoin: false },
  { id: 100741, name: '임현우', email: 'im***@email.com', joined: '2024.09.22', left: '2026.08.01 20:10', dur: '1년 10개월', type: '관리자처리', reason: '이용 불편', data: '보관중', rejoin: true },
];

export interface BanMember {
  id: number;
  name: string;
  email: string;
  joined: string;
  type: string;
  level: number;
  reason: string;
  detail: string;
  start: string;
  end: string;
  state: '제재중' | '만료' | '해제';
  count: number;
  by: string;
  how: string;
  evidence: [string, string][];
}

export const BAN_MEMBERS: BanMember[] = [
  { id: 102384, name: 'user01', email: 'ji***@gmail.com', joined: '2024.03.12', type: '7일 정지', level: 3, reason: '욕설', detail: '채팅 중 반복적인 욕설 및 비방', start: '2026.08.10 14:22', end: '2026.08.17', state: '제재중', count: 2, by: '김운영', how: '신고 처리', evidence: [['신고 #18293', '신고 상세'], ['채팅 로그 #7712', '로그 보기']] },
  { id: 102212, name: 'user02', email: 'mi***@naver.com', joined: '2025.10.05', type: '영구정지', level: 4, reason: '부정 이용', detail: '타인 결제수단 도용 시도 3회 확인', start: '2026.08.08 09:15', end: '—', state: '제재중', count: 4, by: '김운영', how: '관리자 직접', evidence: [['주문 #ORD-9820', '주문 보기'], ['결제 로그 #4410', '로그 보기']] },
  { id: 101992, name: 'user03', email: 'pa***@apple.com', joined: '2023.01.20', type: '3일 정지', level: 3, reason: '스팸', detail: '광고성 게시물 반복 등록', start: '2026.08.01 18:43', end: '2026.08.04', state: '만료', count: 1, by: '이관리', how: '자동 제재', evidence: [['게시물 #29381', '게시물 보기']] },
  { id: 101765, name: 'user04', email: 'ch***@naver.com', joined: '2024.06.30', type: '기능 제한', level: 2, reason: '신고 누적', detail: '댓글 작성 기능 30일 제한', start: '2026.07.28 11:05', end: '2026.08.27', state: '제재중', count: 3, by: '박관리', how: '신고 처리', evidence: [['신고 #17740', '신고 상세']] },
  { id: 101540, name: 'user05', email: 'je***@gmail.com', joined: '2022.11.03', type: '경고', level: 1, reason: '욕설', detail: '커뮤니티 규정 1차 위반', start: '2026.07.26 16:30', end: '—', state: '해제', count: 1, by: '자동', how: '자동 제재', evidence: [['신고 #17512', '신고 상세']] },
  { id: 101233, name: 'user06', email: 'ka***@email.com', joined: '2025.02.14', type: '30일 정지', level: 3, reason: '부정 이용', detail: '환불 악용 패턴 반복', start: '2026.07.21 08:20', end: '2026.08.20', state: '제재중', count: 2, by: '박관리', how: '관리자 직접', evidence: [['주문 #ORD-9014', '주문 보기'], ['CS 티켓 #2281', '티켓 보기']] },
  { id: 100988, name: 'user07', email: 'yu***@kakao.com', joined: '2023.08.19', type: '기능 제한', level: 2, reason: '스팸', detail: '리뷰 작성 기능 14일 제한', start: '2026.07.14 13:55', end: '2026.07.28', state: '만료', count: 1, by: '이관리', how: '신고 처리', evidence: [['게시물 #28110', '게시물 보기']] },
];
