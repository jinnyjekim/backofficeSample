import type { BanMember, LeftMember } from '../../data/members';
import { ACCENT, RED } from '../../lib/theme';
import type { Pill } from './recordsData';

export interface DetailField {
  label: string;
  value: string;
  color?: string;
  pill?: Pill;
}

export interface DetailSection {
  title: string;
  note?: string;
  fields: DetailField[];
}

export interface TimelineEntry {
  title: string;
  when: string;
  dot: string;
}

export interface EvidenceEntry {
  text: string;
  linkLabel: string;
}

export interface RecDetail {
  title: string;
  sub: string;
  sections: DetailSection[];
  evidence?: EvidenceEntry[];
  timeline: TimelineEntry[];
  footer: string;
  action: string;
}

const pill = (bg: string, fg: string): Pill => ({ bg, fg });

export function buildLeftDetail(rd: LeftMember): RecDetail {
  const businessSection: DetailSection = rd.businessType === 'B2C'
    ? {
        title: 'B2C 구매 정보',
        note: rd.points > 0 ? '잔여 포인트는 탈퇴 정책에 따라 소멸 또는 환급 처리를 완료해야 합니다.' : undefined,
        fields: [
          { label: '탈퇴 당시 등급', value: rd.grade || 'Normal' },
          { label: '누적 주문', value: `${rd.orders}건` },
          { label: '누적 구매', value: `${new Intl.NumberFormat('ko-KR').format(rd.spend)}원` },
          { label: '잔여 포인트', value: `${new Intl.NumberFormat('ko-KR').format(rd.points)}P`, color: rd.points > 0 ? '#b91c1c' : '#8b8b93' },
        ],
      }
    : rd.businessType === 'C2C'
      ? {
          title: 'C2C 거래 종료 정보',
          note: rd.settlement > 0 ? '판매대금 지급이 완료되기 전에는 관련 거래·정산 정보를 파기할 수 없습니다.' : undefined,
          fields: [
            { label: '이용 역할', value: rd.buyer && rd.seller ? '구매·판매' : rd.seller ? '판매' : '구매' },
            { label: '등록 상품', value: `${rd.listings}개` },
            { label: '구매 / 판매 거래', value: `${rd.tradesBuy}건 / ${rd.tradesSell}건` },
            { label: '미지급 판매대금', value: `${new Intl.NumberFormat('ko-KR').format(rd.settlement)}원`, color: rd.settlement > 0 ? '#b91c1c' : '#8b8b93' },
          ],
        }
      : {
          title: 'B2B 소속 · 권한 회수',
          note: rd.followUp === '확인필요' ? '승인선과 담당 업무를 대체 계정으로 이관한 뒤 계정 정리를 완료하세요.' : undefined,
          fields: [
            { label: '소속 회사', value: rd.company || '미소속' },
            { label: '회사 코드', value: rd.companyCode || '—' },
            { label: '부서 / 직책', value: `${rd.dept || '—'} · ${rd.title || '—'}` },
            { label: '역할', value: rd.role },
            { label: '회사 거래 상태', value: rd.companyTrade || '—' },
          ],
        };

  return {
    title: '탈퇴 회원 상세',
    sub: `${rd.businessType} · #${rd.id} · ${rd.name}`,
    sections: [
      {
        title: '기본 정보',
        fields: [
          { label: '회원번호', value: String(rd.id) },
          { label: '비즈니스 유형', value: rd.businessType, pill: pill('#eef2ff', '#4338ca') },
          { label: '이메일 / 계정', value: rd.email },
          { label: '휴대폰', value: rd.phone },
          { label: '가입 방식', value: rd.provider, pill: pill('#ecfdf5', '#059669') },
          { label: '가입일', value: rd.joined },
          { label: '이용 기간', value: rd.dur },
        ],
      },
      businessSection,
      {
        title: '탈퇴 정보',
        fields: [
          { label: '탈퇴일', value: rd.left },
          { label: '탈퇴 유형', value: rd.type, pill: rd.type === '관리자처리' ? pill('#fffbeb', '#b45309') : pill('#f4f4f5', '#52525b') },
          { label: '탈퇴 사유', value: rd.reason },
          { label: '후속 처리', value: rd.followUp, pill: rd.followUp === '확인필요' ? pill('#fef2f2', '#b91c1c') : pill('#ecfdf5', '#047857') },
          { label: '처리 내용', value: rd.followUpDetail, color: rd.followUp === '확인필요' ? '#b91c1c' : '#3f3f46' },
        ],
      },
      {
        title: '개인정보 처리',
        note: rd.data === '보관중' ? '개인정보 보호법에 따라 탈퇴 후 1년간 보관 후 파기됩니다. 파기 예정일 이전에 임의 삭제하려면 별도 승인이 필요합니다.' : undefined,
        fields: [
          { label: '데이터 상태', value: rd.data, pill: rd.data === '보관중' ? pill('#fffbeb', '#b45309') : pill('#f4f4f5', '#52525b') },
          { label: '파기 예정일', value: rd.data === '보관중' ? '2027.08.08' : '파기 완료', color: rd.data === '보관중' ? '#b45309' : '#8b8b93' },
        ],
      },
    ],
    timeline: [
      ...(rd.rejoin ? [{ title: '재가입', when: '2026.08.08', dot: ACCENT }] : []),
      { title: rd.followUp === '확인필요' ? `후속 처리 필요 · ${rd.followUpDetail}` : rd.followUpDetail, when: rd.left, dot: rd.followUp === '확인필요' ? '#b91c1c' : '#059669' },
      { title: rd.type === '관리자처리' ? '관리자 탈퇴 처리' : '본인 탈퇴 신청', when: rd.left, dot: '#a1a1aa' },
      { title: '가입', when: rd.joined, dot: '#d4d4d8' },
    ],
    footer: rd.followUp === '확인필요' ? '후속 처리가 완료되기 전에는 개인정보 파기 대상에 포함되지 않습니다.' : '계정 복구는 별도의 승인 절차를 통해 진행하세요.',
    action: rd.followUp === '확인필요' ? '처리 확인' : '복구 요청',
  };
}

export function buildBanDetail(rd: BanMember): RecDetail {
  const businessSection: DetailSection = rd.businessType === 'B2C'
    ? {
        title: 'B2C 고객 · 구매 영향',
        fields: [
          { label: '회원 등급', value: rd.grade || 'Normal' },
          { label: '누적 주문', value: `${rd.orders}건` },
          { label: '누적 구매', value: `${new Intl.NumberFormat('ko-KR').format(rd.spend)}원` },
          { label: '제한 영향', value: rd.type === '기능 제한' ? '리뷰·쿠폰 등 지정 기능' : rd.type === '경고' ? '이용 제한 없음' : '로그인·구매 이용 제한', color: rd.type === '경고' ? '#8b8b93' : '#b91c1c' },
        ],
      }
    : rd.businessType === 'C2C'
      ? {
          title: 'C2C 거래 · 판매 영향',
          note: rd.disputes > 0 ? '진행중 분쟁은 계정 제재와 별개로 분쟁 관리에서 계속 처리해야 합니다.' : undefined,
          fields: [
            { label: '이용 역할', value: rd.buyer && rd.seller ? '구매·판매' : rd.seller ? '판매' : '구매' },
            { label: '등록 상품', value: `${rd.listings}개` },
            { label: '구매 / 판매 거래', value: `${rd.tradesBuy}건 / ${rd.tradesSell}건` },
            { label: '신고 / 분쟁', value: `${rd.reports}건 / ${rd.disputes}건`, color: rd.reports + rd.disputes > 0 ? '#b91c1c' : '#8b8b93' },
          ],
        }
      : {
          title: 'B2B 소속 · 권한 영향',
          note: rd.role === '관리자' || rd.role === '승인 담당자' ? '회사 업무 중단을 방지하기 위해 승인선과 담당 권한의 대체 계정을 확인하세요.' : undefined,
          fields: [
            { label: '소속 회사', value: rd.company || '미소속' },
            { label: '회사 코드', value: rd.companyCode || '—' },
            { label: '부서 / 직책', value: `${rd.dept || '—'} · ${rd.title || '—'}` },
            { label: '계정 역할', value: rd.role },
          ],
        };

  return {
    title: '제재 회원 상세',
    sub: `${rd.businessType} · #${rd.id} · ${rd.name}`,
    sections: [
      {
        title: '기본 정보',
        fields: [
          { label: '회원번호', value: String(rd.id) },
          { label: '비즈니스 유형', value: rd.businessType, pill: pill('#eef2ff', '#4338ca') },
          { label: '이메일 / 계정', value: rd.email },
          { label: '휴대폰', value: rd.phone },
          { label: '가입 방식', value: rd.provider },
          { label: '현재 상태', value: rd.state, pill: pill('#f4f4f5', '#52525b') },
        ],
      },
      businessSection,
      {
        title: '제재 정보',
        note: rd.type === '영구정지' ? '영구정지는 해제 시 상위 관리자 승인이 필요합니다. 해제 시 제재 이력은 보존됩니다.' : undefined,
        fields: [
          { label: '제재 유형', value: rd.type, pill: rd.type === '영구정지' ? pill('#fef2f2', '#b91c1c') : /정지$/.test(rd.type) ? pill('#fffbeb', '#b45309') : pill('#f4f4f5', '#52525b') },
          { label: '제재 사유', value: rd.reason },
          { label: '시작일', value: rd.start },
          { label: '해제 예정', value: rd.end, color: rd.end === '—' ? '#b91c1c' : '#18181b' },
          { label: '처리자', value: rd.by },
        ],
      },
      {
        title: '누적 이력',
        fields: [
          { label: '제재 횟수', value: rd.count + '회' },
          { label: '신고 접수', value: rd.type === '경고' ? '1건' : '5건' },
          { label: '이의신청', value: '없음', color: '#8b8b93' },
        ],
      },
    ],
    evidence: rd.evidence.map(([text, linkLabel]) => ({ text, linkLabel })),
    timeline: [
      { title: rd.type + ' 적용', when: rd.start + ' · ' + rd.by, dot: RED },
      { title: '신고 누적 임계 도달', when: '2026.07.26', dot: '#a1a1aa' },
      { title: '최초 경고', when: '2026.06.14', dot: '#d4d4d8' },
    ],
    footer: '제재 해제 시 회원에게 알림이 발송되며 이력은 보존됩니다.',
    action: '제재 해제',
  };
}
