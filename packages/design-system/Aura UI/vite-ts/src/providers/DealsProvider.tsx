import { Dispatch, PropsWithChildren, createContext, use, useCallback, useReducer } from 'react';
import { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { Deal, DealList, dealsData } from 'data/crm/deals';
import { ACTIONTYPE, DRAG_END, DRAG_OVER, DRAG_START, dealsReducer } from 'reducers/DealsReducer';

export interface DealsState {
  listItems: DealList[];
  draggedList: DealList | null;
  draggedDeal: Deal | null;
  createDealDialog: { isOpen: boolean; listId?: string };
}

const initialState: DealsState = {
  listItems: dealsData,
  createDealDialog: { isOpen: false },
  draggedList: null,
  draggedDeal: null,
};

interface DealsContextInterface extends DealsState {
  dealsDispatch: Dispatch<ACTIONTYPE>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

const DealsContext = createContext({} as DealsContextInterface);

const DealsProvider = ({ children }: PropsWithChildren) => {
  const [state, dealsDispatch] = useReducer(dealsReducer, initialState);

  const handleDragStart = (event: DragStartEvent) => {
    dealsDispatch({
      type: DRAG_START,
      payload: { type: event.active.data.current?.type, item: event.active.data.current },
    });
  };

  const handleDragOver = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout | undefined;

      return (event: DragOverEvent) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          dealsDispatch({
            type: DRAG_OVER,
            payload: {
              activeId: event.active.id as string,
              overId: event.over?.id as string,
              activeRect: event.active.rect.current.translated,
              overRect: event.over?.rect,
            },
          });
        }, 16);
      };
    })(),
    [],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    dealsDispatch({
      type: DRAG_END,
      payload: { activeId: event.active.id as string, overId: event.over?.id as string },
    });
  };

  return (
    <DealsContext
      value={{ ...state, dealsDispatch, handleDragStart, handleDragOver, handleDragEnd }}
    >
      {children}
    </DealsContext>
  );
};

export const useDealsContext = () => use(DealsContext);

export default DealsProvider;
