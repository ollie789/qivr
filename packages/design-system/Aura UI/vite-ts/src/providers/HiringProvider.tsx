import {
  Context,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useCallback,
  useReducer,
  useState,
} from 'react';
import { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { jobOpenings, pipelineData } from 'data/hiring/admin';
import { jobList } from 'data/hiring/candidate';
import { ACTIONTYPE, DRAG_END, DRAG_OVER, DRAG_START, hiringReducer } from 'reducers/HiringReducer';
import type { Job, JobOpening, PipelineItem, PipelineList } from 'types/hiring';

export interface PipelineState {
  listItems: PipelineList[];
  draggedList: PipelineList | null;
  draggedItem: PipelineItem | null;
}

const initialState: PipelineState = {
  listItems: pipelineData,
  draggedList: null,
  draggedItem: null,
};

interface HiringContextProps {
  job: Job | null;
  setJob: Dispatch<SetStateAction<Job | null>>;
  candidate: {
    jobs: Job[];
  };
  admin: {
    jobOpenings: JobOpening[];
    pipeline: PipelineState & {
      hiringDispatch: Dispatch<ACTIONTYPE>;
      handleDragStart: (event: DragStartEvent) => void;
      handleDragOver: (event: DragOverEvent) => void;
      handleDragEnd: (event: DragEndEvent) => void;
    };
  };
}

export const HiringContext: Context<HiringContextProps> = createContext({});

const HiringProvider = ({ children }: PropsWithChildren) => {
  const [job, setJob] = useState<Job | null>(null);
  const [state, hiringDispatch] = useReducer(hiringReducer, initialState);

  const handleDragStart = (event: DragStartEvent) => {
    hiringDispatch({
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
          hiringDispatch({
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
    hiringDispatch({
      type: DRAG_END,
      payload: { activeId: event.active.id as string, overId: event.over?.id as string },
    });
  };

  return (
    <HiringContext
      value={{
        job,
        setJob,
        candidate: { jobs: jobList },
        admin: {
          jobOpenings,
          pipeline: { ...state, hiringDispatch, handleDragEnd, handleDragOver, handleDragStart },
        },
      }}
    >
      {children}
    </HiringContext>
  );
};

export default HiringProvider;

export const useHiringContext = () => use(HiringContext);
