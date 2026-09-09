import { useState } from "react";

export function useStatisticsPeriod<Range extends string>(
  initialRange: Range,
  getRangeDates: (range: Range) => [string, string],
) {
  const initialDates = getRangeDates(initialRange);
  const [range, setActiveRange] = useState<Range | "직접 설정">(initialRange);
  const [start, setStart] = useState(initialDates[0]);
  const [end, setEnd] = useState(initialDates[1]);
  const [draftStart, setDraftStart] = useState(initialDates[0]);
  const [draftEnd, setDraftEnd] = useState(initialDates[1]);

  const setRange = (nextRange: Range) => {
    const [nextStart, nextEnd] = getRangeDates(nextRange);
    setActiveRange(nextRange);
    setStart(nextStart);
    setEnd(nextEnd);
    setDraftStart(nextStart);
    setDraftEnd(nextEnd);
  };

  const applyDateRange = () => {
    if (!draftStart || !draftEnd || draftStart > draftEnd) return false;
    setActiveRange("직접 설정");
    setStart(draftStart);
    setEnd(draftEnd);
    return true;
  };

  return {
    range,
    start,
    end,
    draftStart,
    draftEnd,
    setDraftStart,
    setDraftEnd,
    setRange,
    applyDateRange,
  };
}
