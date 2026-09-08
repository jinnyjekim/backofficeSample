import { useEffect, type RefObject } from 'react';

/**
 * 전역 상세 필터 토글 훅
 *
 * 1. 필터 박스 내의 [상세 필터] 버튼 클릭 시 부모 컨테이너의 data-filter-expanded 속성을
 *    'true' <-> 'false'로 토글하여 2행(상세 필터 드롭다운 그룹)의 펼침/접힘을 제어합니다.
 * 2. 이벤트 위임으로 동적 페이지에도 적용합니다. React가 관리하지 않는 data 속성은 같은
 *    엘리먼트의 리렌더링에도 유지되므로 별도 DOM 감시는 필요하지 않습니다.
 */
export function useDetailFilterToggle(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const button = target?.closest<HTMLButtonElement>('[class*="detailFilterBtn"], [class*="moreFilterBtn"]');
      if (!button || !root?.contains(button)) return;
      if (!button.textContent?.trim().startsWith('상세')) return;

      const filterBox = button.closest<HTMLElement>(
        ':is([class*="filterBox"], [class*="filterCard"], [class*="FilterBox"], [class*="filterContainer"])'
      );
      if (!filterBox) return;

      const isCurrentlyExpanded = filterBox.getAttribute('data-filter-expanded') === 'true';
      const nextExpanded = !isCurrentlyExpanded;

      const nextValue = nextExpanded ? 'true' : 'false';
      if (filterBox.getAttribute('data-filter-expanded') !== nextValue) {
        filterBox.setAttribute('data-filter-expanded', nextValue);
      }
      if (button.getAttribute('aria-expanded') !== nextValue) {
        button.setAttribute('aria-expanded', nextValue);
      }
    }

    root.addEventListener('click', handleClick);

    return () => {
      root.removeEventListener('click', handleClick);
    };
  }, [rootRef]);
}
