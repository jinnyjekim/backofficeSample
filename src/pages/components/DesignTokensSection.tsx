import React from 'react';
import { Copy } from 'lucide-react';
import styles from './DesignTokensSection.module.css';
import { showToast } from '../../components/common/CommonFeedback';

interface ColorToken {
  name: string;
  variable: string;
  value: string;
  label: string;
  bg?: string;
}

const BRAND_COLORS: ColorToken[] = [
  { name: 'Primary (Brand)', variable: 'var(--common-primary)', value: 'oklch(0.52 0.16 258)', label: '메인 브랜드 강조색, 주요 버튼, 활성 탭' },
  { name: 'Primary Hover', variable: 'var(--common-primary-hover)', value: 'oklch(0.46 0.16 258)', label: '브랜드 버튼 마우스 호버 상태' },
  { name: 'Primary Light', variable: 'var(--common-primary-light)', value: '#eef2ff', label: '선택 항목 배경, 틴트 배경' },
  { name: 'Primary Border', variable: 'var(--common-primary-border)', value: '#c7d2fe', label: '브랜드 연한 테두리, 포커스 링' },
];

const NEUTRAL_COLORS: ColorToken[] = [
  { name: 'Background (Base)', variable: 'var(--common-bg)', value: '#ffffff', label: '기본 카드/팝오버/컨텐츠 배경' },
  { name: 'Background Subtle', variable: 'var(--common-bg-subtle)', value: '#f8f8fa', label: '테이블 헤더, 서브 영역 배경' },
  { name: 'Background Disabled', variable: 'var(--common-bg-disabled)', value: '#f1f2f6', label: '비활성화된 입력 필드 배경' },
  { name: 'Border (Default)', variable: 'var(--common-border)', value: '#e2e4ec', label: '기본 테두리, 카드 외곽선, 구분선' },
  { name: 'Border Strong', variable: 'var(--common-border-strong)', value: '#cbd0df', label: '강조 테두리, 입력창 호버 테두리' },
];

const TEXT_COLORS: ColorToken[] = [
  { name: 'Text Primary', variable: 'var(--common-text)', value: '#18181b', label: '기본 본문 텍스트, 제목, 주요 텍스트' },
  { name: 'Text Sub', variable: 'var(--common-text-sub)', value: '#52525b', label: '보조 설명, 부제목, 일반 라벨' },
  { name: 'Text Muted', variable: 'var(--common-text-muted)', value: '#8b8b93', label: '힌트 텍스트, 플레이스홀더, 메타 정보' },
  { name: 'Text Disabled', variable: 'var(--common-text-disabled)', value: '#a1a1aa', label: '비활성화 텍스트, 비활성 아이콘' },
];

const STATUS_COLORS: ColorToken[] = [
  { name: 'Success', variable: 'var(--common-success)', value: '#059669', label: '정상, 완료, 승인, 성공 상태' },
  { name: 'Warning', variable: 'var(--common-warning)', value: '#d97706', label: '보류, 대기, 주의, 미처리 상태' },
  { name: 'Error', variable: 'var(--common-error)', value: '#dc2626', label: '실패, 오류, 반려, 위험 동작' },
  { name: 'Info', variable: 'var(--common-info)', value: '#2563eb', label: '정보, 알림 링크, 시스템 공지' },
];

const STATUS_BG_COLORS: ColorToken[] = [
  { name: 'Success Light', variable: 'var(--m2m-pg-success-bg, #ecfdf5)', value: '#ecfdf5', label: '성공 배지 배경' },
  { name: 'Warning Light', variable: 'var(--m2m-pg-warning-bg, #fffbeb)', value: '#fffbeb', label: '주의 배지 배경' },
  { name: 'Error Light', variable: 'var(--m2m-pg-error-bg, #fef2f2)', value: '#fef2f2', label: '오류 배지 배경' },
  { name: 'Info Light', variable: 'var(--m2m-pg-info-bg, #eff6ff)', value: '#eff6ff', label: '정보 배지 배경' },
];

const TYPO_SCALES = [
  { level: 'Title (H1 / Page)', size: '18px', weight: '700 (Bold)', usage: '페이지 대제목, 모달 타이틀', sample: '백오피스 관리 시스템 표준 대제목' },
  { level: 'Subtitle (Section)', size: '14px', weight: '700 (Bold)', usage: '섹션 제목, 주요 테이블 헤더', sample: '회원 상세 정보 및 권한 설정' },
  { level: 'Body Medium', size: '13px', weight: '500 (Medium)', usage: '주요 탭, 네비게이션 메뉴, 강조 텍스트', sample: '진행 중인 주문 24건이 있습니다' },
  { level: 'Body Regular (Base)', size: '12.5px', weight: '400 (Regular)', usage: '기본 폼 입력창, 표 데이터, 본문', sample: '표준 본문 텍스트 및 그리드 셀 데이터 표기' },
  { level: 'Caption', size: '11.5px', weight: '400 (Regular)', usage: '도움말, 서브 힌트, 등록일시', sample: '최근 3개월간의 결제 이력만 조회할 수 있습니다' },
  { level: 'Micro / Meta', size: '10.5px', weight: '600 (SemiBold)', usage: '상태 뱃지, 태그, 테이블 카운트 라벨', sample: 'TOTAL 1,420 ITEMS' },
];

const RADIUS_TOKENS = [
  { name: '--common-radius-sm', value: '6px', usage: '작은 배지, 인라인 태그, 셀렉트/인풋 내부' },
  { name: '--common-radius-md', value: '8px', usage: '표준 버튼, 입력 필드(CommonInput), 셀렉트' },
  { name: '--common-radius-lg', value: '12px', usage: '카드 컨테이너, 팝오버, 모달 레이어' },
  { name: 'Full / Pill', value: '9999px', usage: '원형 아이콘 버튼, 원형 상태 배지' },
];

const SHADOW_TOKENS = [
  {
    name: '--common-shadow-popover',
    css: '0 10px 30px rgba(0, 0, 0, 0.14)',
    desc: '달력(DatePicker), 셀렉트 드롭다운, 컨텍스트 팝오버',
  },
  {
    name: 'Card Elevation (Subtle)',
    css: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
    desc: '기본 섹션 카드, 표 외곽 컨테이너',
  },
  {
    name: '--m2m-pg-sidebar-shadow',
    css: '2px 0 12px rgba(24, 24, 27, 0.04)',
    desc: 'LNB 사이드바, 좌측 고정 네비게이션',
  },
];

const SIZING_TOKENS = [
  { size: '28px', key: 'Small (sm)', target: '소형 버튼, 미니 액션 뱃지', width: '38%' },
  { size: '30px', key: 'PageSizeSelect', target: '공통 페이지 크기 셀렉트 (표준 규격)', width: '45%' },
  { size: '32px', key: 'Medium (md)', target: '표준 버튼(CommonButton), 입력창(CommonInput)', width: '55%' },
  { size: '36px', key: 'Large (lg)', target: '강조 버튼, 글로벌 검색 인풋', width: '68%' },
  { size: '52px', key: 'Header / GNB', target: '상단 글로벌 네비게이션 헤더', width: '100%' },
];

export function DesignTokensSection() {
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast({ message: `복사되었습니다: ${text}`, type: 'info' });
  };

  return (
    <div className={styles.container}>
      {/* 1. 색상 토큰: Brand & Primary */}
      <div className={styles.tokenGroup}>
        <div className={styles.groupHead}>
          <span className={styles.groupTitle}>
            <span>🎨</span> 브랜드 및 프라이머리 컬러 (Brand & Primary)
          </span>
          <span className={styles.groupDesc}>카드를 클릭하면 CSS 변수명이 클립보드에 복사됩니다</span>
        </div>
        <div className={styles.colorGrid}>
          {BRAND_COLORS.map((c) => (
            <div
              key={c.name}
              className={styles.colorCard}
              onClick={() => handleCopy(c.variable, c.name)}
              title="클릭하여 CSS 변수 복사"
            >
              <div className={styles.colorSwatch} style={{ backgroundColor: c.variable }} />
              <div className={styles.colorInfo}>
                <span className={styles.tokenName}>{c.variable}</span>
                <div className={styles.colorMeta}>
                  <span className={styles.colorValue}>{c.value}</span>
                </div>
                <span className={styles.colorLabel}>{c.label}</span>
              </div>
              <span className={styles.copyBadge}>
                <Copy size={11} /> 복사
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 색상 토큰: Neutral & Surface */}
      <div className={styles.tokenGroup}>
        <div className={styles.groupHead}>
          <span className={styles.groupTitle}>
            <span>⚪</span> 배경 및 테두리 (Neutral & Surface)
          </span>
          <span className={styles.groupDesc}>화면 기본 바탕 및 카드, 구분선 규격</span>
        </div>
        <div className={styles.colorGrid}>
          {NEUTRAL_COLORS.map((c) => (
            <div
              key={c.name}
              className={styles.colorCard}
              onClick={() => handleCopy(c.variable, c.name)}
              title="클릭하여 CSS 변수 복사"
            >
              <div className={styles.colorSwatch} style={{ backgroundColor: c.variable }} />
              <div className={styles.colorInfo}>
                <span className={styles.tokenName}>{c.variable}</span>
                <div className={styles.colorMeta}>
                  <span className={styles.colorValue}>{c.value}</span>
                </div>
                <span className={styles.colorLabel}>{c.label}</span>
              </div>
              <span className={styles.copyBadge}>
                <Copy size={11} /> 복사
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 색상 토큰: Typography & Text */}
      <div className={styles.tokenGroup}>
        <div className={styles.groupHead}>
          <span className={styles.groupTitle}>
            <span>✒️</span> 텍스트 계조 (Typography Colors)
          </span>
          <span className={styles.groupDesc}>위계에 따른 텍스트 및 비활성 색상</span>
        </div>
        <div className={styles.colorGrid}>
          {TEXT_COLORS.map((c) => (
            <div
              key={c.name}
              className={styles.colorCard}
              onClick={() => handleCopy(c.variable, c.name)}
              title="클릭하여 CSS 변수 복사"
            >
              <div className={styles.colorSwatch} style={{ backgroundColor: c.variable }} />
              <div className={styles.colorInfo}>
                <span className={styles.tokenName}>{c.variable}</span>
                <div className={styles.colorMeta}>
                  <span className={styles.colorValue}>{c.value}</span>
                </div>
                <span className={styles.colorLabel}>{c.label}</span>
              </div>
              <span className={styles.copyBadge}>
                <Copy size={11} /> 복사
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 색상 토큰: Status & Feedback */}
      <div className={styles.tokenGroup}>
        <div className={styles.groupHead}>
          <span className={styles.groupTitle}>
            <span>🚦</span> 상태 및 피드백 컬러 (Status & Feedback)
          </span>
          <span className={styles.groupDesc}>성공, 주의, 오류, 정보 상태 표시</span>
        </div>
        <div className={styles.colorGrid}>
          {STATUS_COLORS.map((c) => (
            <div
              key={c.name}
              className={styles.colorCard}
              onClick={() => handleCopy(c.variable, c.name)}
              title="클릭하여 CSS 변수 복사"
            >
              <div className={styles.colorSwatch} style={{ backgroundColor: c.variable }} />
              <div className={styles.colorInfo}>
                <span className={styles.tokenName}>{c.variable}</span>
                <div className={styles.colorMeta}>
                  <span className={styles.colorValue}>{c.value}</span>
                </div>
                <span className={styles.colorLabel}>{c.label}</span>
              </div>
              <span className={styles.copyBadge}>
                <Copy size={11} /> 복사
              </span>
            </div>
          ))}
          {STATUS_BG_COLORS.map((c) => (
            <div
              key={c.name}
              className={styles.colorCard}
              onClick={() => handleCopy(c.variable, c.name)}
              title="클릭하여 CSS 변수 복사"
            >
              <div className={styles.colorSwatch} style={{ backgroundColor: c.value }} />
              <div className={styles.colorInfo}>
                <span className={styles.tokenName}>{c.name}</span>
                <div className={styles.colorMeta}>
                  <span className={styles.colorValue}>{c.value}</span>
                </div>
                <span className={styles.colorLabel}>{c.label}</span>
              </div>
              <span className={styles.copyBadge}>
                <Copy size={11} /> 복사
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 타이포그래피 스케일 */}
      <div className={styles.tokenGroup}>
        <div className={styles.groupHead}>
          <span className={styles.groupTitle}>
            <span>✍️</span> 타이포그래피 스케일 (Typography Scale)
          </span>
          <span className={styles.groupDesc}>Pretendard 기본 서체 · 크기 및 두께 위계</span>
        </div>
        <div className={styles.typoList}>
          {TYPO_SCALES.map((t) => (
            <div key={t.level} className={styles.typoRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--common-text-muted)', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--common-text-sub)' }}>{t.level}</span> — {t.usage}
                </div>
                <div
                  className={styles.typoSample}
                  style={{
                    fontSize: t.size,
                    fontWeight: t.weight.includes('700') ? 700 : t.weight.includes('600') ? 600 : t.weight.includes('500') ? 500 : 400,
                  }}
                >
                  {t.sample}
                </div>
              </div>
              <div className={styles.typoMeta}>
                <span className={styles.typoTag}>{t.size}</span>
                <span>{t.weight}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. 모서리 곡률 (Border Radius) */}
      <div className={styles.tokenGroup}>
        <div className={styles.groupHead}>
          <span className={styles.groupTitle}>
            <span>📐</span> 모서리 곡률 (Border Radius)
          </span>
          <span className={styles.groupDesc}>컴포넌트 유형별 일관된 라운딩 규격</span>
        </div>
        <div className={styles.radiusGrid}>
          {RADIUS_TOKENS.map((r) => (
            <div
              key={r.name}
              className={styles.radiusItem}
              onClick={() => handleCopy(r.name.startsWith('--') ? `var(${r.name})` : r.value, r.name)}
              title="클릭하여 복사"
            >
              <div className={styles.radiusBox} style={{ borderRadius: r.value }}>
                {r.value}
              </div>
              <div className={styles.radiusMeta}>
                <div className={styles.radiusName}>{r.name}</div>
                <div className={styles.radiusUsage}>{r.usage}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. 그림자 및 깊이 (Shadows & Elevation) */}
      <div className={styles.tokenGroup}>
        <div className={styles.groupHead}>
          <span className={styles.groupTitle}>
            <span>🌫️</span> 그림자 및 깊이 (Shadows & Elevation)
          </span>
          <span className={styles.groupDesc}>레이어 및 팝업의 시각적 분리감</span>
        </div>
        <div className={styles.shadowGrid}>
          {SHADOW_TOKENS.map((s) => (
            <div
              key={s.name}
              className={styles.shadowCard}
              style={{ boxShadow: s.css }}
              onClick={() => handleCopy(s.name.startsWith('--') ? `var(${s.name})` : s.css, s.name)}
              title="클릭하여 복사"
            >
              <span className={styles.shadowName}>{s.name}</span>
              <span className={styles.shadowValue}>{s.css}</span>
              <span className={styles.shadowDesc}>{s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. 컴포넌트 표준 높이 (Sizing Tokens) */}
      <div className={styles.tokenGroup}>
        <div className={styles.groupHead}>
          <span className={styles.groupTitle}>
            <span>📏</span> 컴포넌트 표준 높이 (Component Sizing)
          </span>
          <span className={styles.groupDesc}>인풋, 버튼, 셀렉트, 헤더의 높이 일관성 규격</span>
        </div>
        <div className={styles.sizingList}>
          {SIZING_TOKENS.map((sz) => (
            <div key={sz.key} className={styles.sizingRow}>
              <div className={styles.sizingLabel}>
                <span className={styles.sizingKey}>{sz.key} ({sz.size})</span>
                <span className={styles.sizingTarget}>{sz.target}</span>
              </div>
              <div className={styles.sizingBarWrap}>
                <div className={styles.sizingBar} style={{ height: sz.size, width: sz.width }}>
                  높이 {sz.size}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
