// context/HistoryContext.tsx (올바른 버전 - 오류 수정)
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
  useMemo
} from "react";
import { message } from "antd";

// 타입 import
import { StickerComponent } from "./ComponentContext";
import {
  HistoryAction,
  HistoryActionType,
  HistoryState,
  HistoryContextValue,
  ExtendedHistoryContextValue,
  canMergeActions,
  HISTORY_CONFIG,
  UpdatePositionAction,
  UpdateSizeAction,
  UpdateRotationAction,
  UpdateOpacityAction
} from "../types/history";

// ================== 히스토리 리듀서 액션 타입 ==================
type HistoryReducerAction =
  | { type: "RECORD_ACTION"; payload: HistoryAction }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "PAUSE_RECORDING" }
  | { type: "RESUME_RECORDING" }
  | { type: "CLEAR_HISTORY" }
  | { type: "SET_GROUP_ID"; payload: string | undefined };

// ================== 초기 상태 ==================
const initialHistoryState: HistoryState = {
  past: [],
  future: [],
  maxHistorySize: HISTORY_CONFIG.MAX_HISTORY_SIZE,
  isRecording: true,
  currentGroupId: undefined
};

// ================== 히스토리 리듀서 ==================
function historyReducer(
  state: HistoryState,
  action: HistoryReducerAction
): HistoryState {
  switch (action.type) {
    case "RECORD_ACTION": {
      if (!state.isRecording) {
        return state;
      }

      const newAction = action.payload;
      const lastAction = state.past[state.past.length - 1];

      // 액션 병합 로직 (Figma 스타일)
      if (lastAction && canMergeActions(lastAction, newAction)) {
        const mergedAction = mergeActions(lastAction, newAction);
        return {
          ...state,
          past: [...state.past.slice(0, -1), mergedAction],
          future: []
        };
      }

      // 새로운 액션 추가
      const newPast = [...state.past, newAction];

      // 히스토리 크기 제한
      const trimmedPast =
        newPast.length > state.maxHistorySize
          ? newPast.slice(newPast.length - state.maxHistorySize)
          : newPast;

      return {
        ...state,
        past: trimmedPast,
        future: []
      };
    }

    case "UNDO": {
      if (state.past.length === 0) {
        return state;
      }

      const lastAction = state.past[state.past.length - 1];
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [lastAction, ...state.future]
      };
    }

    case "REDO": {
      if (state.future.length === 0) {
        return state;
      }

      const nextAction = state.future[0];
      return {
        ...state,
        past: [...state.past, nextAction],
        future: state.future.slice(1)
      };
    }

    case "PAUSE_RECORDING":
      return { ...state, isRecording: false };

    case "RESUME_RECORDING":
      return { ...state, isRecording: true };

    case "CLEAR_HISTORY":
      return {
        ...state,
        past: [],
        future: []
      };

    case "SET_GROUP_ID":
      return { ...state, currentGroupId: action.payload };

    default:
      return state;
  }
}

// ================== 액션 병합 로직 ==================
function mergeActions(
  prevAction: HistoryAction,
  newAction: HistoryAction
): HistoryAction {
  if (prevAction.type !== newAction.type) {
    return newAction;
  }

  switch (newAction.type) {
    case HistoryActionType.UPDATE_POSITION: {
      return {
        ...newAction,
        inverse: prevAction.inverse,
        description: `위치 변경`
      } as UpdatePositionAction;
    }

    case HistoryActionType.UPDATE_SIZE: {
      return {
        ...newAction,
        inverse: prevAction.inverse,
        description: `크기 변경`
      } as UpdateSizeAction;
    }

    case HistoryActionType.UPDATE_ROTATION: {
      return {
        ...newAction,
        inverse: prevAction.inverse,
        description: `회전`
      } as UpdateRotationAction;
    }

    case HistoryActionType.UPDATE_OPACITY: {
      return {
        ...newAction,
        inverse: prevAction.inverse,
        description: `투명도 변경`
      } as UpdateOpacityAction;
    }

    default:
      return newAction;
  }
}

// ================== Context 생성 ==================
const HistoryContext = createContext<ExtendedHistoryContextValue | null>(null);

export const useHistoryContext = (): HistoryContextValue => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistoryContext must be used within HistoryProvider");
  }
  return context;
};

// ================== Provider 컴포넌트 ==================
export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(historyReducer, initialHistoryState);

  // Ref that mirrors the reducer state to avoid stale closures
  const stateRef = useRef<HistoryState>(initialHistoryState);

  const dispatchWithRef = useCallback((action: HistoryReducerAction) => {
    stateRef.current = historyReducer(stateRef.current, action);
    dispatch(action);
  }, [dispatch]);

  // 그룹 관리용 ref
  const groupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 여러 액션 실행기 배열 관리
  const actionExecutorsRef = useRef<
    Array<{
      executeAction: (action: HistoryAction) => void;
      executeInverseAction: (action: HistoryAction) => void;
    }>
  >([]);

  // ================== 계산된 값들 (먼저 선언) ==================
  const canUndo = useMemo(() => state.past.length > 0, [state.past.length]);
  const canRedo = useMemo(() => state.future.length > 0, [state.future.length]);

  // ================== 유틸리티 함수들 ==================
  const generateGroupId = useCallback((): string => {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, [dispatchWithRef]);

  const resetGroupTimeout = useCallback(() => {
    if (groupTimeoutRef.current) {
      clearTimeout(groupTimeoutRef.current);
      groupTimeoutRef.current = null;
    }

    if (stateRef.current.currentGroupId) {
      if (HISTORY_CONFIG.AUTO_GROUP_TIMEOUT <= 0) {
        dispatchWithRef({ type: "SET_GROUP_ID", payload: undefined });
      } else {
        groupTimeoutRef.current = setTimeout(() => {
          dispatchWithRef({ type: "SET_GROUP_ID", payload: undefined });
        }, HISTORY_CONFIG.AUTO_GROUP_TIMEOUT);
      }
    }
  }, [dispatchWithRef]);

  // 즉시 히스토리 기록을 위한 강제 플러시 함수
  const flushPendingActions = useCallback(() => {
    if (stateRef.current.currentGroupId) {
      dispatchWithRef({ type: "SET_GROUP_ID", payload: undefined });
      if (groupTimeoutRef.current) {
        clearTimeout(groupTimeoutRef.current);
        groupTimeoutRef.current = null;
      }
    }
  }, [dispatchWithRef]);

  const getHistorySize = useCallback((): number => {
    return state.past.length + state.future.length;
  }, [state.past.length, state.future.length]);

  const getLastAction = useCallback((): HistoryAction | null => {
    return state.past.length > 0 ? state.past[state.past.length - 1] : null;
  }, [state.past]);

  const getActionDescription = useCallback((action: HistoryAction): string => {
    return action.description;
  }, []);

  // ================== UI용 설명 텍스트 ==================
  const undoDescription = useMemo(() => {
    if (!canUndo) return "되돌릴 수 없음";
    const lastAction = getLastAction();
    return lastAction ? lastAction.description : "실행 취소";
  }, [canUndo, getLastAction]);

  const redoDescription = useMemo(() => {
    if (!canRedo) return "재실행할 수 없음";
    const nextAction = state.future[0];
    return nextAction ? nextAction.description : "다시 실행";
  }, [canRedo, state.future]);

  // ================== 액션 기록 ==================
  const recordAction = useCallback(
    (action: HistoryAction) => {
      // 즉시 기록 - 그룹 관리 최소화
      const actionWithGroup = stateRef.current.currentGroupId
        ? { ...action, groupId: stateRef.current.currentGroupId }
        : action;

      dispatchWithRef({ type: "RECORD_ACTION", payload: actionWithGroup });
      
      // 그룹 관리
      resetGroupTimeout();
    },
    [resetGroupTimeout, dispatchWithRef]
  );

  // ================== 그룹 관리 ==================
  const startGroup = useCallback(
    (description: string): string => {
      const groupId = generateGroupId();
      dispatchWithRef({ type: "SET_GROUP_ID", payload: groupId });
      resetGroupTimeout();
      return groupId;
    },
    [generateGroupId, resetGroupTimeout, dispatchWithRef]
  );

  const endGroup = useCallback(
    (groupId: string) => {
      if (stateRef.current.currentGroupId === groupId) {
        dispatchWithRef({ type: "SET_GROUP_ID", payload: undefined });
        if (groupTimeoutRef.current) {
          clearTimeout(groupTimeoutRef.current);
          groupTimeoutRef.current = null;
        }
      }
    },
    [dispatchWithRef]
  );

  // ================== Undo/Redo 로직 ==================
  const undo = useCallback(() => {
    // 먼저 pending 액션들을 플러시
    flushPendingActions();

    if (stateRef.current.past.length === 0) {
      message.warning("더 이상 되돌릴 수 없습니다");
      return;
    }

    const lastAction = stateRef.current.past[stateRef.current.past.length - 1];

    // 모든 등록된 실행기에서 역액션 실행
    actionExecutorsRef.current.forEach(executor => {
      try {
        executor.executeInverseAction(lastAction);
      } catch (error) {
        console.error("History executor error during undo:", error);
      }
    });

    dispatchWithRef({ type: "UNDO" });
  }, [flushPendingActions]);

  const redo = useCallback(() => {
    // 먼저 pending 액션들을 플러시
    flushPendingActions();

    if (stateRef.current.future.length === 0) {
      message.warning("더 이상 재실행할 수 없습니다");
      return;
    }

    const nextAction = stateRef.current.future[0];

    // 모든 등록된 실행기에서 액션 실행
    actionExecutorsRef.current.forEach(executor => {
      try {
        executor.executeAction(nextAction);
      } catch (error) {
        console.error("History executor error during redo:", error);
      }
    });

    dispatchWithRef({ type: "REDO" });
  }, [flushPendingActions]);

  // ================== 히스토리 제어 ==================
  const pauseRecording = useCallback(() => {
    dispatchWithRef({ type: "PAUSE_RECORDING" });
  }, [dispatchWithRef]);

  const resumeRecording = useCallback(() => {
    dispatchWithRef({ type: "RESUME_RECORDING" });
  }, [dispatchWithRef]);

  const clearHistory = useCallback(() => {
    dispatchWithRef({ type: "CLEAR_HISTORY" });
    message.success("히스토리가 초기화되었습니다");
  }, [dispatchWithRef]);

  // ================== 액션 실행기 등록 ==================
  const registerActionExecutor = useCallback(
    (executor: {
      executeAction: (action: HistoryAction) => void;
      executeInverseAction: (action: HistoryAction) => void;
    }): (() => void) => {
      // 중복 등록 방지
      const isDuplicate = actionExecutorsRef.current.some(
        existing => existing === executor
      );

      if (!isDuplicate) {
        actionExecutorsRef.current.push(executor);
      }

      const unregister = () => {
        const index = actionExecutorsRef.current.indexOf(executor);
        if (index !== -1) {
          actionExecutorsRef.current.splice(index, 1);
        }
      };

      return unregister;
    },
    []
  );

  // ================== 키보드 단축키 ==================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 입력 필드나 텍스트 에디터에서는 무시
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.closest("[contenteditable]")
      ) {
        return;
      }

      const isMeta = event.ctrlKey || event.metaKey;
      
      // Undo: Ctrl+Z / Cmd+Z (단, Shift가 없을 때만)
      if (isMeta && (event.key === "z" || event.key === "Z") && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        undo();
        return;
      }

      // Redo: Ctrl+Y, Ctrl+Shift+Z / Cmd+Y, Cmd+Shift+Z
      if (
        (isMeta && (event.key === "y" || event.key === "Y")) ||
        (isMeta && event.shiftKey && (event.key === "z" || event.key === "Z"))
      ) {
        event.preventDefault();
        event.stopPropagation();
        redo();
        return;
      }

      // 🎯 다른 키보드 단축키는 ImageEditor에서 처리하도록 허용
      // Ctrl+A, Ctrl+C, Ctrl+V, Delete 등은 캡처하지 않음
    };

    // 캡처 단계에서 이벤트 리스너 등록 (우선순위 확보)
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [undo, redo]);

  // ================== 정리 작업 ==================
  useEffect(() => {
    return () => {
      if (groupTimeoutRef.current) {
        clearTimeout(groupTimeoutRef.current);
      }
    };
  }, []);

  // ================== Context Value ==================
  const contextValue: ExtendedHistoryContextValue = useMemo(
    () => ({
      // 상태
      ...state,

      // 기본 히스토리 조작
      undo,
      redo,
      canUndo,
      canRedo,

      // UI용 설명 텍스트
      undoDescription,
      redoDescription,

      // 히스토리 기록
      recordAction,
      startGroup,
      endGroup,

      // 히스토리 제어
      pauseRecording,
      resumeRecording,
      clearHistory,

      // 유틸리티
      getHistorySize,
      getLastAction,
      getActionDescription,
      flushPendingActions,

      // 내부용 (액션 실행기 등록)
      registerActionExecutor
    }),
    [
      state,
      undo,
      redo,
      canUndo,
      canRedo,
      undoDescription,
      redoDescription,
      recordAction,
      startGroup,
      endGroup,
      pauseRecording,
      resumeRecording,
      clearHistory,
      getHistorySize,
      getLastAction,
      getActionDescription,
      flushPendingActions,
      registerActionExecutor
    ]
  );

  // ================== 개발 모드 디버깅 ==================
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as any).__FREEBOARD_HISTORY__ = {
        state,
        past: state.past,
        future: state.future,
        canUndo,
        canRedo,
        historySize: getHistorySize(),
        currentGroupId: state.currentGroupId,
        isRecording: state.isRecording,
        undoDescription,
        redoDescription,
        executorsCount: actionExecutorsRef.current.length
      };
    }
  }, [
    state,
    canUndo,
    canRedo,
    getHistorySize,
    undoDescription,
    redoDescription
  ]);

  return (
    <HistoryContext.Provider value={contextValue}>
      {children}
    </HistoryContext.Provider>
  );
};

// ================== 액션 실행기 Hook ==================
export const useHistoryActionExecutor = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error(
      "useHistoryActionExecutor must be used within HistoryProvider"
    );
  }

  return useCallback(
    (executor: {
      executeAction: (action: HistoryAction) => void;
      executeInverseAction: (action: HistoryAction) => void;
    }) => {
      return context.registerActionExecutor(executor);
    },
    [context]
  );
};

// ================== 편의 Hook들 ==================
export const useHistoryShortcuts = () => {
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } =
    useHistoryContext();

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription
  };
};

export const useHistoryGroup = () => {
  const { startGroup, endGroup } = useHistoryContext();

  const withGroup = useCallback(
    async (description: string, action: () => Promise<void> | void) => {
      const groupId = startGroup(description);
      try {
        await action();
      } finally {
        endGroup(groupId);
      }
    },
    [startGroup, endGroup]
  );

  return { startGroup, endGroup, withGroup };
};

export default HistoryProvider;
