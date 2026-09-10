import { useEffect, useRef } from 'react';

export type PlacementY = 'top' | 'bottom';
export type PlacementX = 'left' | 'right' | 'center';

export interface DatePickerPlacementOptions {
  /** 팝업과 뷰포트 가장자리 사이의 최소 여백 (기본값: 10px) */
  margin?: number;
  /** 팝업과 트리거 사이의 간격 (기본값: 6px) */
  offset?: number;
}

/**
 * DatePicker가 화면 어디에 위치했는지(상/하/좌/우/중앙)를 실시간 감지하여,
 * 달력 다이얼로그(.bsDatePickerPopup)의 위치를 위, 아래, 왼쪽, 오른쪽, 가운데로 동적 배치합니다.
 */
export function useDatePickerPlacement<T extends HTMLElement = HTMLElement>(
  options: DatePickerPlacementOptions = {}
) {
  const containerRef = useRef<T | null>(null);
  const { margin = 10, offset = 6 } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;

    const updatePlacement = () => {
      const popup = container.querySelector('.bsDatePickerPopup') as HTMLElement | null;
      if (!popup) return;

      const trigger = (container.querySelector('.bsDatePickerTrigger') ||
        container.querySelector('.bsDatePicker') ||
        container) as HTMLElement;

      const triggerRect = trigger.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 팝업 높이/너비 측정 (렌더 직후 0일 경우 표준 기본값 적용)
      const popupHeight = popupRect.height > 0 ? popupRect.height : 340;
      const popupWidth = popupRect.width > 0 ? popupRect.width : (popup.querySelector('.bsDatePickerRangePanels') ? 600 : 300);

      // ── 1. 수직 위치 (Vertical: 위 vs 아래) ──
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let placementY: PlacementY = 'bottom';
      // 아래쪽 공간이 부족하고, 위쪽에 더 여유 공간이 있는 경우 "위(top)"로 배치
      if (spaceBelow < popupHeight + margin && spaceAbove > spaceBelow) {
        placementY = 'top';
      } else {
        placementY = 'bottom';
      }

      // ── 2. 수평 위치 (Horizontal: 왼쪽 vs 오른쪽 vs 가운데) ──
      const triggerCenterX = triggerRect.left + triggerRect.width / 2;

      // 가운데 배치 시 뷰포트 좌우 경계 내에 온전히 들어가는지 검사
      const centerLeft = triggerCenterX - popupWidth / 2;
      const centerRight = triggerCenterX + popupWidth / 2;
      const canFitCenter = centerLeft >= margin && centerRight <= viewportWidth - margin;

      // 왼쪽 정렬 시 우측 경계 초과 여부
      const willOverflowRightOnLeftAlign = triggerRect.left + popupWidth > viewportWidth - margin;
      // 오른쪽 정렬 시 좌측 경계 초과 여부
      const willOverflowLeftOnRightAlign = triggerRect.right - popupWidth < margin;

      let placementX: PlacementX = 'left';

      // 트리거 위치 및 넘침 여부에 따라 왼쪽 / 가운데 / 오른쪽 정렬 결정
      if (willOverflowRightOnLeftAlign && !willOverflowLeftOnRightAlign) {
        // 화면 오른쪽 끝에 위치하거나 우측으로 넘치는 경우 -> 오른쪽 정렬
        placementX = 'right';
      } else if (
        triggerCenterX > viewportWidth * 0.35 &&
        triggerCenterX < viewportWidth * 0.65 &&
        canFitCenter
      ) {
        // 화면 중앙 영역(35%~65%)에 위치하며 가운데 배치가 가능한 경우 -> 가운데 정렬
        placementX = 'center';
      } else if (triggerRect.right > viewportWidth * 0.65 || willOverflowRightOnLeftAlign) {
        // 화면 우측 영역에 위치한 경우 -> 오른쪽 정렬
        placementX = 'right';
      } else {
        // 화면 좌측에 위치하거나 왼쪽 정렬이 여유 있는 경우 -> 왼쪽 정렬
        placementX = 'left';
      }

      // ── 3. DOM 스타일 및 속성 적용 ──
      // Y축 배치 적용
      if (placementY === 'top') {
        popup.style.setProperty('top', 'auto', 'important');
        popup.style.setProperty('bottom', `calc(100% + ${offset}px)`, 'important');
      } else {
        popup.style.setProperty('top', `calc(100% + ${offset}px)`, 'important');
        popup.style.setProperty('bottom', 'auto', 'important');
      }

      // X축 배치 적용
      if (placementX === 'right') {
        popup.style.setProperty('left', 'auto', 'important');
        popup.style.setProperty('right', '0px', 'important');
        popup.style.setProperty('transform', 'none', 'important');
      } else if (placementX === 'center') {
        popup.style.setProperty('left', '50%', 'important');
        popup.style.setProperty('right', 'auto', 'important');
        popup.style.setProperty('transform', 'translateX(-50%)', 'important');
      } else {
        popup.style.setProperty('left', '0px', 'important');
        popup.style.setProperty('right', 'auto', 'important');
        popup.style.setProperty('transform', 'none', 'important');
      }

      // 데이터 속성 부여 (CSS 셀렉터 및 디버깅용)
      popup.setAttribute('data-placement-y', placementY);
      popup.setAttribute('data-placement-x', placementX);
      container.setAttribute('data-datepicker-placement-y', placementY);
      container.setAttribute('data-datepicker-placement-x', placementX);
    };

    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePlacement);
    };

    // DOM 변화 감지 (달력 다이얼로그 열림/닫힘 및 내부 전환)
    const observer = new MutationObserver(() => {
      scheduleUpdate();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'aria-expanded'],
    });

    // 뷰포트 리사이즈 및 스크롤 시 실시간 재계산
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('scroll', scheduleUpdate, { capture: true, passive: true });

    // 사용자의 클릭 및 키보드 포커스 시 즉시 갱신
    container.addEventListener('click', scheduleUpdate);
    container.addEventListener('focusin', scheduleUpdate);

    scheduleUpdate();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
      container.removeEventListener('click', scheduleUpdate);
      container.removeEventListener('focusin', scheduleUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [margin, offset]);

  return containerRef;
}
