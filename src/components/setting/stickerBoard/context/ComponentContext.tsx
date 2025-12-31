// context/ComponentContext.tsx (StrictMode 복제 문제 해결)
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useMemo
} from "react";
// import throttle from "lodash/throttle"; // 제거: 즉시 히스토리 기록을 위해
import { message } from "antd";
import html2canvas from "html2canvas";
import { setUploadImage } from "../../../../../etc/queries/setUploadImage";
import { setSettingsMainStickerBoard } from "../../../../../etc/queries/setSettngMainStickerBoard";
import { useSetting } from "../../../../../etc/contexts/settings";
import { useFreeBoardBaseContext } from "./FreeBoardContext";

// 🎯 히스토리 통합
import { useHistoryContext, useHistoryActionExecutor } from "./HistoryContext";
import {
  createHistoryAction,
  HistoryActionType,
  HistoryAction
} from "../types/history";

// ================== 타입 정의 ==================
export interface StickerComponent {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  imageUrl: string;
  isVisible: boolean;
  isLocked: boolean;
  rotation?: number;
  opacity?: number;
  flipX?: boolean;
  flipY?: boolean;
  lockAspectRatio?: boolean;
}

export interface ComponentState {
  components: StickerComponent[];
}

export interface ComponentContextValue extends ComponentState {
  // 기본 컴포넌트 관리
  addStickerComponent: (url: string) => void;
  updateComponent: (
    id: number,
    updates: Partial<StickerComponent>,
    groupId?: string
  ) => void;
  deleteComponent: (id: number) => void;
  duplicateComponents: (comps: StickerComponent[]) => void;

  // 🎯 레이어 패널용 히스토리 기록 함수들 추가
  reorderComponentsWithHistory: (newOrder: StickerComponent[]) => void;
  toggleComponentVisibilityWithHistory: (componentId: number) => void;
  toggleComponentLockWithHistory: (componentId: number) => void;

  // 저장 관리
  captureAndSaveComponent: () => Promise<void>;

  // 🎯 서버 상태로 되돌리기
  restoreFromServer: () => void;

  // 정렬 기능
  alignLeft: (componentId: number) => void;
  alignCenter: (componentId: number) => void;
  alignRight: (componentId: number) => void;
  alignTop: (componentId: number) => void;
  alignMiddle: (componentId: number) => void;
  alignBottom: (componentId: number) => void;
}

// ================== 상수 정의 ==================
const MAX_STICKER_SIZE = 200;
// NOTE: padding is handled via styled-components, so no need to offset when
// calculating alignment positions. This remains for potential future use.
const EDITOR_PADDING = 0;
const DEFAULT_ROTATION = 0;
const DEFAULT_OPACITY = 100;
const DEFAULT_FLIP_X = false;
const DEFAULT_FLIP_Y = false;
const DEFAULT_LOCK_ASPECT_RATIO = false;

// ================== 액션 타입 ==================
type ComponentAction =
  | { type: "SET_COMPONENTS"; payload: StickerComponent[] }
  | { type: "ADD_COMPONENT"; payload: StickerComponent }
  | {
      type: "UPDATE_COMPONENT";
      payload: { id: number; updates: Partial<StickerComponent> };
    }
  | { type: "DELETE_COMPONENT"; payload: number };

// ================== 초기 상태 ==================
const initialState: ComponentState = {
  components: []
};

// ================== 리듀서 ==================
function componentReducer(
  state: ComponentState,
  action: ComponentAction
): ComponentState {
  switch (action.type) {
    case "SET_COMPONENTS":
      return { ...state, components: action.payload };
    case "ADD_COMPONENT":
      return { ...state, components: [...state.components, action.payload] };
    case "UPDATE_COMPONENT":
      return {
        ...state,
        components: state.components.map(comp =>
          comp.id === action.payload.id
            ? { ...comp, ...action.payload.updates }
            : comp
        )
      };
    case "DELETE_COMPONENT":
      return {
        ...state,
        components: state.components.filter(comp => comp.id !== action.payload)
      };
    default:
      return state;
  }
}

// ================== 유틸리티 함수들 ==================
const normalizeAngle = (angle: number): number => {
  let normalizedAngle = angle % 360;
  if (normalizedAngle < 0) {
    normalizedAngle += 360;
  }
  return Math.round(normalizedAngle);
};

const migrateComponent = (component: any): StickerComponent => {
  return {
    ...component,
    rotation:
      component.rotation !== undefined
        ? normalizeAngle(component.rotation)
        : DEFAULT_ROTATION,
    opacity:
      component.opacity !== undefined ? component.opacity : DEFAULT_OPACITY,
    isVisible: component.isVisible !== undefined ? component.isVisible : true,
    isLocked: component.isLocked !== undefined ? component.isLocked : false,
    flipX: component.flipX !== undefined ? component.flipX : DEFAULT_FLIP_X,
    flipY: component.flipY !== undefined ? component.flipY : DEFAULT_FLIP_Y,
    lockAspectRatio:
      component.lockAspectRatio !== undefined
        ? component.lockAspectRatio
        : DEFAULT_LOCK_ASPECT_RATIO
  };
};

// ================== Context 생성 ==================
const ComponentContext = createContext<ComponentContextValue | null>(null);

export const useComponentContext = () => {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error(
      "useComponentContext must be used within ComponentProvider"
    );
  }
  return context;
};

// ================== Provider 컴포넌트 ==================
export const ComponentProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, dispatch] = useReducer(componentReducer, initialState);
  const { main } = useSetting();
  const { canvasRef, content } = useFreeBoardBaseContext();
  const localStorage = globalThis?.localStorage;

  const componentsMap = useMemo(() => {
    return new Map(state.components.map(comp => [comp.id, comp]));
  }, [state.components]);

  // 🎯 히스토리 연결
  const history = useHistoryContext();
  const registerExecutor = useHistoryActionExecutor();

  // 히스토리 기록 중지 플래그 (undo/redo 중에는 히스토리 기록 안함)
  const isExecutingHistory = useRef(false);

  // 실행기 해제 함수 보관
  const unregisterExecutorRef = useRef<(() => void) | null>(null);

  // ================== 실행기 등록 ==================
  useEffect(() => {
    const executeAction = (action: HistoryAction) => {
      isExecutingHistory.current = true;

      try {
        switch (action.type) {
          case HistoryActionType.CREATE_COMPONENT:
            dispatch({ type: "ADD_COMPONENT", payload: action.data.component });
            break;

          case HistoryActionType.DELETE_COMPONENT:
            dispatch({
              type: "DELETE_COMPONENT",
              payload: action.data.componentId
            });
            break;

          case HistoryActionType.UPDATE_POSITION:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.data.componentId,
                updates: action.data.newPosition
              }
            });
            break;

          case HistoryActionType.UPDATE_SIZE:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.data.componentId,
                updates: action.data.newSize
              }
            });
            break;

          case HistoryActionType.UPDATE_ROTATION:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.data.componentId,
                updates: { rotation: action.data.newRotation }
              }
            });
            break;

          case HistoryActionType.UPDATE_OPACITY:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.data.componentId,
                updates: { opacity: action.data.newOpacity }
              }
            });
            break;

          case HistoryActionType.UPDATE_FLIP:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.data.componentId,
                updates: {
                  [action.data.flipType === "x" ? "flipX" : "flipY"]:
                    action.data.newValue
                }
              }
            });
            break;

          // 🎯 레이어 관련 액션들
          case HistoryActionType.REORDER_LAYERS:
            action.data.newOrder.forEach(
              (orderInfo: { id: number; zIndex: number }) => {
                dispatch({
                  type: "UPDATE_COMPONENT",
                  payload: {
                    id: orderInfo.id,
                    updates: { zIndex: orderInfo.zIndex }
                  }
                });
              }
            );
            break;

          case HistoryActionType.TOGGLE_VISIBILITY:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.data.componentId,
                updates: { isVisible: action.data.newVisibility }
              }
            });
            break;

          case HistoryActionType.TOGGLE_LOCK:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.data.componentId,
                updates: { isLocked: action.data.newLockState }
              }
            });
            break;

          case HistoryActionType.ALIGN_COMPONENTS:
            action.data.newPositions.forEach(
              (pos: { id: number; x: number; y: number }) => {
                dispatch({
                  type: "UPDATE_COMPONENT",
                  payload: {
                    id: pos.id,
                    updates: { x: pos.x, y: pos.y }
                  }
                });
              }
            );
            break;

          case HistoryActionType.BATCH_UPDATE:
            action.data.updates.forEach(
              (update: {
                componentId: number;
                updates: Partial<StickerComponent>;
              }) => {
                dispatch({
                  type: "UPDATE_COMPONENT",
                  payload: {
                    id: update.componentId,
                    updates: update.updates
                  }
                });
              }
            );
            break;
        }
      } finally {
        // 🚨 동기적으로 플래그 해제 (StrictMode 대응)
        isExecutingHistory.current = false;
      }
    };

    const executeInverseAction = (action: HistoryAction) => {
      isExecutingHistory.current = true;

      try {
        switch (action.type) {
          case HistoryActionType.CREATE_COMPONENT:
            dispatch({
              type: "DELETE_COMPONENT",
              payload: action.inverse.componentId
            });
            break;

          case HistoryActionType.DELETE_COMPONENT:
            // 🎯 컴포넌트를 원래 위치에 복원 (ADD_COMPONENT만 사용)
            dispatch({
              type: "ADD_COMPONENT",
              payload: action.inverse.component
            });
            break;

          case HistoryActionType.UPDATE_POSITION:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.inverse.componentId,
                updates: action.inverse.oldPosition
              }
            });
            break;

          case HistoryActionType.UPDATE_SIZE:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.inverse.componentId,
                updates: action.inverse.oldSize
              }
            });
            break;

          case HistoryActionType.UPDATE_ROTATION:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.inverse.componentId,
                updates: { rotation: action.inverse.oldRotation }
              }
            });
            break;

          case HistoryActionType.UPDATE_OPACITY:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.inverse.componentId,
                updates: { opacity: action.inverse.oldOpacity }
              }
            });
            break;

          case HistoryActionType.UPDATE_FLIP:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.inverse.componentId,
                updates: {
                  [action.inverse.flipType === "x" ? "flipX" : "flipY"]:
                    action.inverse.oldValue
                }
              }
            });
            break;

          // 🎯 레이어 관련 역액션들
          case HistoryActionType.REORDER_LAYERS:
            action.inverse.oldOrder.forEach(
              (orderInfo: { id: number; zIndex: number }) => {
                dispatch({
                  type: "UPDATE_COMPONENT",
                  payload: {
                    id: orderInfo.id,
                    updates: { zIndex: orderInfo.zIndex }
                  }
                });
              }
            );
            break;

          case HistoryActionType.TOGGLE_VISIBILITY:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.inverse.componentId,
                updates: { isVisible: action.inverse.oldVisibility }
              }
            });
            break;

          case HistoryActionType.TOGGLE_LOCK:
            dispatch({
              type: "UPDATE_COMPONENT",
              payload: {
                id: action.inverse.componentId,
                updates: { isLocked: action.inverse.oldLockState }
              }
            });
            break;

          case HistoryActionType.ALIGN_COMPONENTS:
            action.inverse.oldPositions.forEach(
              (pos: { id: number; x: number; y: number }) => {
                dispatch({
                  type: "UPDATE_COMPONENT",
                  payload: {
                    id: pos.id,
                    updates: { x: pos.x, y: pos.y }
                  }
                });
              }
            );
            break;

          case HistoryActionType.BATCH_UPDATE:
            action.inverse.updates.forEach(
              (update: {
                componentId: number;
                oldValues: Partial<StickerComponent>;
              }) => {
                dispatch({
                  type: "UPDATE_COMPONENT",
                  payload: {
                    id: update.componentId,
                    updates: update.oldValues
                  }
                });
              }
            );
            break;
        }
      } finally {
        // 🚨 동기적으로 플래그 해제 (StrictMode 대응)
        isExecutingHistory.current = false;
      }
    };

    // 히스토리 액션 실행기 등록
    const unregister = registerExecutor({
      executeAction,
      executeInverseAction
    });
    unregisterExecutorRef.current = unregister;

    return () => {
      unregisterExecutorRef.current?.();
      unregisterExecutorRef.current = null;
    };
  }, [registerExecutor]); // registerExecutor는 안정적이므로 의존성 배열에 포함

  // ================== 기존 유틸리티 함수들 ==================
  const calculateCenterPosition = useCallback(
    (imageWidth: number, imageHeight: number) => {
      if (!canvasRef.current) {
        return { x: 50, y: 50 };
      }

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const availableWidth = canvasRect.width;
      const availableHeight = canvasRect.height;

      const centerX = Math.max(0, (availableWidth - imageWidth) / 2);
      const centerY = Math.max(0, (availableHeight - imageHeight) / 2);

      return { x: centerX, y: centerY };
    },
    [canvasRef]
  );

  const calculateImageSize = useCallback((img: HTMLImageElement) => {
    const aspectRatio = img.width / img.height;
    let width, height;

    if (img.width > img.height) {
      width = Math.min(MAX_STICKER_SIZE, img.width);
      height = width / aspectRatio;
    } else {
      height = Math.min(MAX_STICKER_SIZE, img.height);
      width = height * aspectRatio;
    }

    return { width, height };
  }, []);

  const dataURLToFile = useCallback((dataURL: string, fileName: string) => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], fileName, { type: mime });
  }, []);

  // ================== 🎯 히스토리 기록이 포함된 컴포넌트 관리 액션들 ==================
  const addStickerComponent = useCallback(
    (url: string) => {
      const img = new Image();
      img.src = url;

      img.onload = () => {
        const { width, height } = calculateImageSize(img);
        const centerPosition = calculateCenterPosition(width, height);

        const newComponent: StickerComponent = {
          id: Date.now(),
          x: centerPosition.x,
          y: centerPosition.y,
          width,
          height,
          zIndex: state.components.length + 1,
          imageUrl: url,
          isVisible: true,
          isLocked: false,
          rotation: DEFAULT_ROTATION,
          opacity: DEFAULT_OPACITY,
          flipX: DEFAULT_FLIP_X,
          flipY: DEFAULT_FLIP_Y,
          lockAspectRatio: DEFAULT_LOCK_ASPECT_RATIO
        };

        // 컴포넌트 상태 업데이트
        dispatch({ type: "ADD_COMPONENT", payload: newComponent });

        // 🎯 히스토리 기록
        if (!isExecutingHistory.current) {
          const action = createHistoryAction.createComponent(newComponent);
          history.recordAction(action);
        }

        message.success("스티커가 캔버스 중앙에 추가되었습니다!");
      };

      img.onerror = () => {
        message.error("이미지를 로드할 수 없습니다.");
      };
    },
    [
      state.components.length,
      calculateCenterPosition,
      calculateImageSize,
      history
    ]
  );

  const updateComponent = useCallback(
    (id: number, updates: Partial<StickerComponent>, groupId?: string) => {
      const component = componentsMap.get(id);
      if (!component) return;

      // 🔧 잠긴 스티커는 잠금 해제(isLocked: false)만 허용
      if (
        component.isLocked &&
        !(Object.keys(updates).length === 1 && updates.isLocked === false)
      ) {
        message.warning("잠긴 스티커는 수정할 수 없습니다.");
        return;
      }

      // 변경된 속성들의 이전 값 저장
      const oldValues: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const typedKey = key as keyof StickerComponent;
        (oldValues as any)[typedKey] = component[typedKey];
      });

      // 정규화 처리
      const normalizedUpdates = { ...updates };
      if (normalizedUpdates.rotation !== undefined) {
        normalizedUpdates.rotation = normalizeAngle(normalizedUpdates.rotation);
      }
      if (normalizedUpdates.opacity !== undefined) {
        normalizedUpdates.opacity = Math.max(
          0,
          Math.min(100, normalizedUpdates.opacity)
        );
      }

      // 컴포넌트 상태 업데이트
      dispatch({
        type: "UPDATE_COMPONENT",
        payload: { id, updates: normalizedUpdates }
      });

      // 🎯 히스토리 기록 (각 속성별로 개별 액션 생성)
      if (!isExecutingHistory.current) {
        Object.keys(normalizedUpdates).forEach(key => {
          const typedKey = key as keyof StickerComponent;
          const newValue = normalizedUpdates[typedKey];
          const oldValue = oldValues[typedKey];

          if (newValue === oldValue) return; // 값이 변경되지 않은 경우 스킵

          let action: HistoryAction | null = null;

          switch (typedKey) {
            case "x":
            case "y":
              if (
                normalizedUpdates.x !== undefined &&
                normalizedUpdates.y !== undefined
              ) {
                action = createHistoryAction.updatePosition(
                  id,
                  { x: normalizedUpdates.x, y: normalizedUpdates.y },
                  {
                    x: (oldValues.x as number) || component.x,
                    y: (oldValues.y as number) || component.y
                  },
                  groupId
                );
              } else if (
                typedKey === "x" &&
                normalizedUpdates.y === undefined
              ) {
                action = createHistoryAction.updatePosition(
                  id,
                  { x: newValue as number, y: component.y },
                  { x: oldValue as number, y: component.y },
                  groupId
                );
              } else if (
                typedKey === "y" &&
                normalizedUpdates.x === undefined
              ) {
                action = createHistoryAction.updatePosition(
                  id,
                  { x: component.x, y: newValue as number },
                  { x: component.x, y: oldValue as number },
                  groupId
                );
              }
              break;

            case "width":
            case "height":
              if (
                normalizedUpdates.width !== undefined &&
                normalizedUpdates.height !== undefined
              ) {
                action = createHistoryAction.updateSize(
                  id,
                  {
                    width: normalizedUpdates.width,
                    height: normalizedUpdates.height,
                    // 🔧 비율 고정 상태도 포함
                    lockAspectRatio:
                      normalizedUpdates.lockAspectRatio !== undefined
                        ? normalizedUpdates.lockAspectRatio
                        : component.lockAspectRatio
                  },
                  {
                    width: (oldValues.width as number) || component.width,
                    height: (oldValues.height as number) || component.height,
                    lockAspectRatio:
                      (oldValues.lockAspectRatio as boolean) ||
                      component.lockAspectRatio
                  },
                  groupId
                );
              } else if (
                typedKey === "width" &&
                normalizedUpdates.height === undefined
              ) {
                action = createHistoryAction.updateSize(
                  id,
                  {
                    width: newValue as number,
                    height: component.height,
                    lockAspectRatio: component.lockAspectRatio
                  },
                  {
                    width: oldValue as number,
                    height: component.height,
                    lockAspectRatio: component.lockAspectRatio
                  },
                  groupId
                );
              } else if (
                typedKey === "height" &&
                normalizedUpdates.width === undefined
              ) {
                action = createHistoryAction.updateSize(
                  id,
                  {
                    width: component.width,
                    height: newValue as number,
                    lockAspectRatio: component.lockAspectRatio
                  },
                  {
                    width: component.width,
                    height: oldValue as number,
                    lockAspectRatio: component.lockAspectRatio
                  },
                  groupId
                );
              }
              break;

            case "rotation":
              action = createHistoryAction.updateRotation(
                id,
                newValue as number,
                oldValue as number,
                groupId
              );
              break;

            case "opacity":
              action = createHistoryAction.updateOpacity(
                id,
                newValue as number,
                oldValue as number,
                groupId
              );
              break;

            case "flipX":
              action = createHistoryAction.updateFlip(
                id,
                "x",
                newValue as boolean,
                oldValue as boolean
              );
              break;

            case "flipY":
              action = createHistoryAction.updateFlip(
                id,
                "y",
                newValue as boolean,
                oldValue as boolean
              );
              break;

            case "isVisible":
              action = createHistoryAction.toggleVisibility(
                id,
                newValue as boolean,
                oldValue as boolean
              );
              break;

            case "isLocked":
              action = createHistoryAction.toggleLock(
                id,
                newValue as boolean,
                oldValue as boolean
              );
              break;

            case "lockAspectRatio":
              // 🔧 비율 고정 상태 변경에 대한 히스토리 기록
              action = createHistoryAction.updateSize(
                id,
                {
                  width: component.width,
                  height: component.height,
                  lockAspectRatio: newValue as boolean
                },
                {
                  width: component.width,
                  height: component.height,
                  lockAspectRatio: oldValue as boolean
                },
                groupId
              );
              break;
          }

          if (action) {
            history.recordAction(action);
          }
        });
      }
    },
    [state.components, history]
  );

  const deleteComponent = useCallback(
    (id: number) => {
      const component = componentsMap.get(id);
      if (!component) return;
      if (component.isLocked) {
        message.warning("잠긴 스티커는 삭제할 수 없습니다.");
        return;
      }

      const componentIndex = state.components.findIndex(comp => comp.id === id);

      // 컴포넌트 상태 업데이트
      dispatch({ type: "DELETE_COMPONENT", payload: id });

      // 🎯 히스토리 기록
      if (!isExecutingHistory.current) {
        const action = createHistoryAction.deleteComponent(
          component,
          componentIndex
        );
        history.recordAction(action);
      }

      message.success("스티커가 삭제되었습니다.");
    },
    [state.components, history]
  );

  const duplicateComponents = useCallback(
    (comps: StickerComponent[]) => {
      if (comps.length === 0) return;

      // 🎯 원본 컴포넌트들의 zIndex 기준으로 다른 컴포넌트들을 위로 밀어올리고 복제본 삽입
      const originalZIndices = comps.map(comp => comp.zIndex);
      const maxOriginalZIndex = Math.max(...originalZIndices);

      // 원본보다 높은 zIndex를 가진 컴포넌트들을 위로 밀어올림
      const componentsToShift = state.components.filter(
        comp =>
          comp.zIndex > maxOriginalZIndex && !comps.find(c => c.id === comp.id)
      );

      // 기존 컴포넌트들의 zIndex 업데이트 (위로 밀어올리기)
      componentsToShift.forEach(comp => {
        dispatch({
          type: "UPDATE_COMPONENT",
          payload: {
            id: comp.id,
            updates: { zIndex: comp.zIndex + comps.length }
          }
        });
      });

      // 복제본 생성 (원본 바로 위에 배치)
      comps.forEach((comp, idx) => {
        const { groupId, ...rest } = comp;
        const newComponent: StickerComponent = {
          ...rest,
          id: Date.now() + idx,
          x: comp.x + 10,
          y: comp.y + 10,
          zIndex: comp.zIndex + 1 + idx // 🎯 원본 바로 위에 배치
        };

        dispatch({ type: "ADD_COMPONENT", payload: newComponent });

        if (!isExecutingHistory.current) {
          const action = createHistoryAction.createComponent(newComponent);
          history.recordAction(action);
        }
      });
    },
    [state.components, history]
  );

  // ================== 🎯 레이어 패널 전용 히스토리 기록 함수들 ==================
  const reorderComponentsWithHistory = useCallback(
    (newOrder: StickerComponent[]) => {
      // 현재 순서 저장 (히스토리용)
      const currentOrder = [...state.components]
        .sort((a, b) => b.zIndex - a.zIndex)
        .map(comp => ({ id: comp.id, zIndex: comp.zIndex }));

      // 새로운 zIndex 계산
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

      // 각 컴포넌트의 zIndex 업데이트 (히스토리 기록 없이 직접 dispatch)
      reorderedComponents.forEach(comp => {
        dispatch({
          type: "UPDATE_COMPONENT",
          payload: { id: comp.id, updates: { zIndex: comp.zIndex } }
        });
      });
    },
    [state.components, history]
  );

  const toggleComponentVisibilityWithHistory = useCallback(
    (componentId: number) => {
      const component = componentsMap.get(componentId);
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

      // 컴포넌트 상태 업데이트 (히스토리 기록 없이 직접 dispatch)
      dispatch({
        type: "UPDATE_COMPONENT",
        payload: { id: componentId, updates: { isVisible: newVisibility } }
      });

      message.success(
        newVisibility ? "스티커가 표시되었습니다" : "스티커가 숨겨졌습니다"
      );
    },
    [state.components, history]
  );

  const toggleComponentLockWithHistory = useCallback(
    (componentId: number) => {
      const component = componentsMap.get(componentId);
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

      // 컴포넌트 상태 업데이트 (히스토리 기록 없이 직접 dispatch)
      dispatch({
        type: "UPDATE_COMPONENT",
        payload: { id: componentId, updates: { isLocked: newLockState } }
      });

      message.success(
        newLockState
          ? "스티커 위치가 고정되었습니다"
          : "스티커 위치가 해제되었습니다"
      );
    },
    [state.components, history]
  );

  // ================== 정렬 기능들 (히스토리 기록 포함) ==================
  const alignLeft = useCallback(
    (componentId: number) => {
      const component = componentsMap.get(componentId);
      if (!component || component.isLocked) {
        message.warning(
          component?.isLocked
            ? "잠긴 스티커는 정렬할 수 없습니다"
            : "스티커를 찾을 수 없습니다"
        );
        return;
      }

      const oldPosition = { x: component.x, y: component.y };
      const newPosition = { x: 0, y: component.y };

      dispatch({
        type: "UPDATE_COMPONENT",
        payload: {
          id: componentId,
          updates: newPosition
        }
      });

      if (!isExecutingHistory.current) {
        const action = createHistoryAction.alignComponents(
          [componentId],
          "left",
          [{ id: componentId, ...newPosition }],
          [{ id: componentId, ...oldPosition }]
        );
        history.recordAction(action);
      }

      message.success("왼쪽으로 정렬되었습니다");
    },
    [state.components, history]
  );

  const alignCenter = useCallback(
    (componentId: number) => {
      const component = componentsMap.get(componentId);
      if (!component || component.isLocked) {
        message.warning(
          component?.isLocked
            ? "잠긴 스티커는 정렬할 수 없습니다"
            : "스티커를 찾을 수 없습니다"
        );
        return;
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const availableWidth = canvasRect ? canvasRect.width : 0;

      // 🔧 스티커가 캔버스보다 클 때도 올바르게 가운데 정렬
      const newX = (availableWidth - component.width) / 2;
      const oldPosition = { x: component.x, y: component.y };
      const newPosition = { x: newX, y: component.y };

      dispatch({
        type: "UPDATE_COMPONENT",
        payload: { id: componentId, updates: newPosition }
      });

      if (!isExecutingHistory.current) {
        const action = createHistoryAction.alignComponents(
          [componentId],
          "center",
          [{ id: componentId, ...newPosition }],
          [{ id: componentId, ...oldPosition }]
        );
        history.recordAction(action);
      }

      message.success("가로 중앙으로 정렬되었습니다");
    },
    [state.components, history, canvasRef]
  );

  const alignRight = useCallback(
    (componentId: number) => {
      const component = componentsMap.get(componentId);
      if (!component || component.isLocked) {
        message.warning(
          component?.isLocked
            ? "잠긴 스티커는 정렬할 수 없습니다"
            : "스티커를 찾을 수 없습니다"
        );
        return;
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const availableWidth = canvasRect ? canvasRect.width : 0;

      // 🔧 스티커가 캔버스보다 클 때도 올바르게 오른쪽 정렬
      const newX = availableWidth - component.width;
      const oldPosition = { x: component.x, y: component.y };
      const newPosition = { x: newX, y: component.y };

      dispatch({
        type: "UPDATE_COMPONENT",
        payload: { id: componentId, updates: newPosition }
      });

      if (!isExecutingHistory.current) {
        const action = createHistoryAction.alignComponents(
          [componentId],
          "right",
          [{ id: componentId, ...newPosition }],
          [{ id: componentId, ...oldPosition }]
        );
        history.recordAction(action);
      }

      message.success("오른쪽으로 정렬되었습니다");
    },
    [state.components, history, canvasRef]
  );

  const alignTop = useCallback(
    (componentId: number) => {
      const component = componentsMap.get(componentId);
      if (!component || component.isLocked) {
        message.warning(
          component?.isLocked
            ? "잠긴 스티커는 정렬할 수 없습니다"
            : "스티커를 찾을 수 없습니다"
        );
        return;
      }

      const oldPosition = { x: component.x, y: component.y };
      const newPosition = { x: component.x, y: 0 };

      dispatch({
        type: "UPDATE_COMPONENT",
        payload: { id: componentId, updates: newPosition }
      });

      if (!isExecutingHistory.current) {
        const action = createHistoryAction.alignComponents(
          [componentId],
          "top",
          [{ id: componentId, ...newPosition }],
          [{ id: componentId, ...oldPosition }]
        );
        history.recordAction(action);
      }

      message.success("위쪽으로 정렬되었습니다");
    },
    [state.components, history]
  );

  const alignMiddle = useCallback(
    (componentId: number) => {
      const component = componentsMap.get(componentId);
      if (!component || component.isLocked) {
        message.warning(
          component?.isLocked
            ? "잠긴 스티커는 정렬할 수 없습니다"
            : "스티커를 찾을 수 없습니다"
        );
        return;
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const availableHeight = canvasRect ? canvasRect.height : 0;

      // 🔧 스티커가 캔버스보다 클 때도 올바르게 세로 중앙 정렬
      const newY = (availableHeight - component.height) / 2;
      const oldPosition = { x: component.x, y: component.y };
      const newPosition = { x: component.x, y: newY };

      dispatch({
        type: "UPDATE_COMPONENT",
        payload: { id: componentId, updates: newPosition }
      });

      if (!isExecutingHistory.current) {
        const action = createHistoryAction.alignComponents(
          [componentId],
          "middle",
          [{ id: componentId, ...newPosition }],
          [{ id: componentId, ...oldPosition }]
        );
        history.recordAction(action);
      }

      message.success("세로 중앙으로 정렬되었습니다");
    },
    [state.components, history, canvasRef]
  );

  const alignBottom = useCallback(
    (componentId: number) => {
      const component = componentsMap.get(componentId);
      if (!component || component.isLocked) {
        message.warning(
          component?.isLocked
            ? "잠긴 스티커는 정렬할 수 없습니다"
            : "스티커를 찾을 수 없습니다"
        );
        return;
      }

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const availableHeight = canvasRect ? canvasRect.height : 0;

      // 🔧 스티커가 캔버스보다 클 때도 올바르게 아래쪽 정렬
      const newY = availableHeight - component.height;
      const oldPosition = { x: component.x, y: component.y };
      const newPosition = { x: component.x, y: newY };

      dispatch({
        type: "UPDATE_COMPONENT",
        payload: { id: componentId, updates: newPosition }
      });

      if (!isExecutingHistory.current) {
        const action = createHistoryAction.alignComponents(
          [componentId],
          "bottom",
          [{ id: componentId, ...newPosition }],
          [{ id: componentId, ...oldPosition }]
        );
        history.recordAction(action);
      }

      message.success("아래쪽으로 정렬되었습니다");
    },
    [state.components, history, canvasRef]
  );

  // ================== 🎯 서버 상태로 되돌리기 ==================
  const restoreFromServer = useCallback(() => {
    const stickerBoard = main?.stickerBoard;
    if (stickerBoard) {
      const migratedComponents = (stickerBoard.components || []).map(
        migrateComponent
      );

      // 🎯 히스토리 기록 일시 중단
      isExecutingHistory.current = true;

      try {
        dispatch({
          type: "SET_COMPONENTS",
          payload: migratedComponents
        });

        message.success("마지막 저장 상태로 되돌렸습니다");
      } finally {
        // 히스토리 기록 재개
        isExecutingHistory.current = false;
      }
    } else {
      // 서버 상태가 없으면 빈 상태로
      isExecutingHistory.current = true;

      try {
        dispatch({
          type: "SET_COMPONENTS",
          payload: []
        });

        message.success("초기 상태로 되돌렸습니다");
      } finally {
        isExecutingHistory.current = false;
      }
    }
  }, [main]);

  const captureAndSaveComponent = useCallback(async () => {
    const captureArea = async (elementId: string) => {
      const element = document.getElementById(elementId);
      if (!element) throw new Error("Capture area not found");

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: true
      });

      return new Promise<File>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) {
            resolve(new File([blob], "capture.png", { type: "image/png" }));
          } else {
            reject(new Error("Canvas toBlob failed"));
          }
        });
      });
    };

    try {
      const capture = await captureArea("capture-area");
      const { data: imageUrl } = await setUploadImage(capture);

      const value = {
        content,
        capture: imageUrl,
        components: state.components
      };

      await setSettingsMainStickerBoard(value);
      
      // BroadcastChannel을 통해 스티커보드 변경사항을 다른 탭/창에 알림
      const channel = new BroadcastChannel("stickerBoardUpdated");
      channel.postMessage({
        stickerBoard: value,
        timestamp: Date.now()
      });
      channel.close();
      
      message.success("성공적으로 저장되었습니다.");
    } catch (error) {
      console.error(error);
      message.error("스티커보드를 저장하지 못했습니다.");
    }
  }, [content, state.components]);

  // ================== 이펙트 훅들 ==================
  useEffect(() => {
    const stickerBoard = main?.stickerBoard;
    if (stickerBoard) {
      const migratedComponents = (stickerBoard.components || []).map(
        migrateComponent
      );

      dispatch({
        type: "SET_COMPONENTS",
        payload: migratedComponents
      });
    }
  }, [main]);

  // 즉시 저장 함수 (throttle 제거)
  const saveComponents = useCallback((comps: StickerComponent[]) => {
    localStorage?.setItem("dynamicComponents", JSON.stringify(comps));
  }, []);

  useEffect(() => {
    saveComponents(state.components);
  }, [state.components, saveComponents]);

  // ================== Context Value ==================
  const contextValue: ComponentContextValue = useMemo(
    () => ({
      // 상태
      ...state,

      // 기본 컴포넌트 관리 (히스토리 기록 포함)
      addStickerComponent,
      updateComponent,
      deleteComponent,
      duplicateComponents,

      // 🎯 레이어 패널용 히스토리 기록 함수들
      reorderComponentsWithHistory,
      toggleComponentVisibilityWithHistory,
      toggleComponentLockWithHistory,

      // 저장 관리
      captureAndSaveComponent,

      // 🎯 서버 상태로 되돌리기
      restoreFromServer,

      // 정렬 기능 (히스토리 기록 포함)
      alignLeft,
      alignCenter,
      alignRight,
      alignTop,
      alignMiddle,
      alignBottom
    }),
    [
      state,
      addStickerComponent,
      updateComponent,
      deleteComponent,
      duplicateComponents,
      reorderComponentsWithHistory,
      toggleComponentVisibilityWithHistory,
      toggleComponentLockWithHistory,
      captureAndSaveComponent,
      restoreFromServer,
      alignLeft,
      alignCenter,
      alignRight,
      alignTop,
      alignMiddle,
      alignBottom
    ]
  );

  return (
    <ComponentContext.Provider value={contextValue}>
      {children}
    </ComponentContext.Provider>
  );
};
