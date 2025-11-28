import { useState, useCallback } from 'react';

/**
 * Hook for managing chart legend visibility
 * @param initialLegends - Array of legend names
 * @returns Object with legends state and toggle function
 */
const useToggleChartLegends = (initialLegends: string[]) => {
  const [hiddenLegends, setHiddenLegends] = useState<string[]>([]);

  const toggleLegend = useCallback((legend: string) => {
    setHiddenLegends((prev) =>
      prev.includes(legend) ? prev.filter((l) => l !== legend) : [...prev, legend]
    );
  }, []);

  const isLegendHidden = useCallback(
    (legend: string) => hiddenLegends.includes(legend),
    [hiddenLegends]
  );

  const visibleLegends = initialLegends.filter((legend) => !hiddenLegends.includes(legend));

  return {
    hiddenLegends,
    visibleLegends,
    toggleLegend,
    isLegendHidden,
  };
};

export default useToggleChartLegends;
