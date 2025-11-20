import { PropsWithChildren, createContext, use, useEffect, useState } from 'react';

interface Identification {
  id: number;
}

interface BulkSelectContextValue<T extends Identification> {
  selectedIds: number[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
  handleToggleAll: (checked: boolean) => void;
  handleToggleCheck: (id: T['id']) => void;
}

export const BulkSelectContext = createContext({} as BulkSelectContextValue<Identification>);

const BulkSelectProvider = <T extends Identification>({
  data,
  children,
}: PropsWithChildren<{ data: T[] }>) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleToggleAll = (checked: boolean) => {
    if (checked && !isIndeterminate) {
      setSelectedIds(data.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleCheck = (id: T['id']) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => data.findIndex((item) => item.id === id) > -1));
  }, [data]);

  return (
    <BulkSelectContext
      value={{
        selectedIds,
        isAllSelected,
        isIndeterminate,
        handleToggleAll,
        handleToggleCheck,
      }}
    >
      {children}
    </BulkSelectContext>
  );
};

export const useBulkSelect = () => use(BulkSelectContext);

export default BulkSelectProvider;
