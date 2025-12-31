// context/LayerContext.tsx (히스토리 연동 버전)
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useMemo
} from "react";
import { message } from "antd";
import { useComponentContext, StickerComponent } from "./ComponentContext";

// 🎯 히스토리 연동 추가
import { useHistoryContext, useHistoryActionExecutor } from "./HistoryContext";
import { createHistoryAction } from "../types/history";

// ================== 타입 정의 ==================
export interface LayerContextValue {
  // 레이어 순서 관리
  reorderComponents: (newOrder: StickerComponent[]) => void;
  moveLayerUp: (componentId: number) => void;
  moveLayerDown: (componentId: number) => void;

  // 숨김/고정 기능
  toggleComponentVisibility: (componentId: number) => void;
  toggleComponentLock: (componentId: number) => void;
}

// ================== Context 생성 ==================
const LayerContext = createContext<LayerContextValue | null>(null);

export const useLayerContext = () => {
  const context = useContext(LayerContext);
  if (!context) {
    throw new Error("useLayerContext must be used within LayerProvider");
  }
  return context;
};

// ================== Provider 컴포넌트 ==================
export const LayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { components, updateComponent } = useComponentContext();

  // 🎯 히스토리 연동
  const history = useHistoryContext();
  const registerExecutor = useHistoryActionExecutor();

  // 히스토리 기록 중지 플래그 (undo/redo 중에는 히스토리 기록 안함)
  const isExecutingHistory = useRef(false);
  // 등록 해제 함수 보관
  const unregisterExecutorRef = useRef<(() => void) | null>(null);

  // updateComponent를 참조로 보존하여 최신 함수를 사용
  const updateComponentRef = useRef(updateComponent);
  useEffect(() => {
    updateComponentRef.current = updateComponent;
  }, [updateComponent]);

  // 🎯 히스토리 액션 실행기 등록
  useEffect(() => {

    const executeAction = (action: any) => {
      isExecutingHistory.current = true;

      try {
        switch (action.type) {
          case "REORDER_LAYERS":
            // 레이어 순서 변경 실행
            action.data.newOrder.forEach(
              (orderInfo: { id: number; zIndex: number }) => {
                updateComponentRef.current(orderInfo.id, {
                  zIndex: orderInfo.zIndex
                });
              }
            );
            break;

          case "TOGGLE_VISIBILITY":
            // 가시성 토글 실행
            updateComponentRef.current(action.data.componentId, {
              isVisible: action.data.newVisibility
            });
            break;

          case "TOGGLE_LOCK":
            // 잠금 토글 실행
            updateComponentRef.current(action.data.componentId, {
              isLocked: action.data.newLockState
            });
            break;
        }
      } finally {
        // 🚨 동기적으로 플래그 해제 (StrictMode 대응)
        isExecutingHistory.current = false;
      }
    };

    const executeInverseAction = (action: any) => {
      isExecutingHistory.current = true;

      try {
        switch (action.type) {
          case "REORDER_LAYERS":
            // 이전 레이어 순서로 복원
            action.inverse.oldOrder.forEach(
              (orderInfo: { id: number; zIndex: number }) => {
                updateComponentRef.current(orderInfo.id, {
                  zIndex: orderInfo.zIndex
                });
              }
            );
            break;

          case "TOGGLE_VISIBILITY":
            // 이전 가시성 상태로 복원
            updateComponentRef.current(action.inverse.componentId, {
              isVisible: action.inverse.oldVisibility
            });
            break;

          case "TOGGLE_LOCK":
            // 이전 잠금 상태로 복원
            updateComponentRef.current(action.inverse.componentId, {
              isLocked: action.inverse.oldLockState
            });
            break;
        }
      } finally {
        // 🚨 동기적으로 플래그 해제 (StrictMode 대응)
        isExecutingHistory.current = false;
      }
    };

    // 히스토리 액션 실행기 등록
    const unregister = registerExecutor({ executeAction, executeInverseAction });
    unregisterExecutorRef.current = unregister;
    return () => {
      unregisterExecutorRef.current?.();
      unregisterExecutorRef.current = null;
    };
  }, [registerExecutor]);

  // ================== 🎯 히스토리 기록이 포함된 레이어 관리 액션들 ==================
  const reorderComponents = useCallback(
    (newOrder: StickerComponent[]) => {
      // 현재 순서 저장 (히스토리용)
      const currentOrder = [...components]
        .sort((a, b) => b.zIndex - a.zIndex)
        .map(comp => ({ id: comp.id, zIndex: comp.zIndex }));

      // 새로운 zIndex 계산 및 적용
      const reorderedComponents = newOrder.map((component, index) => ({
        ...component,
        zIndex: newOrder.length - index
      }));

      // 새로운 순서 정보
      const newOrderInfo = reorderedComponents.map(comp => ({
        id: comp.id,
        zIndex: comp.zIndex
      }));

      // 🎯 히스토리 기록 (undo/redo 실행 중이 아닐 때만)
      if (!isExecutingHistory.current) {
        const action = createHistoryAction.reorderLayers(
          newOrderInfo,
          currentOrder
        );
        history.recordAction(action);
      }

      // 각 컴포넌트의 zIndex 업데이트
      reorderedComponents.forEach(comp => {
        updateComponent(comp.id, { zIndex: comp.zIndex });
      });

    },
    [components, updateComponent, history]
  );

  const moveLayerUp = useCallback(
    (componentId: number) => {
      const sortedComponents = [...components].sort(
        (a, b) => b.zIndex - a.zIndex
      );
      const currentIndex = sortedComponents.findIndex(
        comp => comp.id === componentId
      );

      if (currentIndex > 0) {
        const newOrder = [...sortedComponents];
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
          newOrder[currentIndex],
          newOrder[currentIndex - 1]
        ];
        reorderComponents(newOrder);
        message.success("레이어가 위로 이동했습니다");
      } else {
        message.warning("이미 최상위 레이어입니다");
      }
    },
    [components, reorderComponents]
  );

  const moveLayerDown = useCallback(
    (componentId: number) => {
      const sortedComponents = [...components].sort(
        (a, b) => b.zIndex - a.zIndex
      );
      const currentIndex = sortedComponents.findIndex(
        comp => comp.id === componentId
      );

      if (currentIndex < sortedComponents.length - 1) {
        const newOrder = [...sortedComponents];
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
          newOrder[currentIndex + 1],
          newOrder[currentIndex]
        ];
        reorderComponents(newOrder);
        message.success("레이어가 아래로 이동했습니다");
      } else {
        message.warning("이미 최하위 레이어입니다");
      }
    },
    [components, reorderComponents]
  );

  // ================== 🎯 가시성/잠금 토글 (히스토리 직접 기록) ==================
  const toggleComponentVisibility = useCallback(
    (componentId: number) => {
      const component = components.find(comp => comp.id === componentId);
      if (!component) return;

      const newVisibility = !component.isVisible;

      // 🎯 히스토리 기록 (undo/redo 실행 중이 아닐 때만)
      if (!isExecutingHistory.current) {
        const action = createHistoryAction.toggleVisibility(
          componentId,
          newVisibility,
          component.isVisible
        );
        history.recordAction(action);
      }

      // 컴포넌트 상태 업데이트
      updateComponent(componentId, { isVisible: newVisibility });

      message.success(
        newVisibility ? "스티커가 표시되었습니다" : "스티커가 숨겨졌습니다"
      );
    },
    [components, updateComponent, history]
  );

  const toggleComponentLock = useCallback(
    (componentId: number) => {
      const component = components.find(comp => comp.id === componentId);
      if (!component) return;

      const newLockState = !component.isLocked;

      // 🎯 히스토리 기록 (undo/redo 실행 중이 아닐 때만)
      if (!isExecutingHistory.current) {
        const action = createHistoryAction.toggleLock(
          componentId,
          newLockState,
          component.isLocked
        );
        history.recordAction(action);
      }

      // 컴포넌트 상태 업데이트
      updateComponent(componentId, { isLocked: newLockState });

      message.success(
        newLockState
          ? "스티커 위치가 고정되었습니다"
          : "스티커 위치가 해제되었습니다"
      );
    },
    [components, updateComponent, history]
  );

  // ================== Context Value ==================
  const contextValue: LayerContextValue = useMemo(
    () => ({
      // 레이어 순서 관리 (히스토리 기록 포함)
      reorderComponents,
      moveLayerUp,
      moveLayerDown,

      // 숨김/고정 기능 (히스토리 기록 포함)
      toggleComponentVisibility,
      toggleComponentLock
    }),
    [
      reorderComponents,
      moveLayerUp,
      moveLayerDown,
      toggleComponentVisibility,
      toggleComponentLock
    ]
  );

  return (
    <LayerContext.Provider value={contextValue}>
      {children}
    </LayerContext.Provider>
  );
};
