// types/history.ts (레이어 패널 연동 확인 및 수정)
// 🎨 Figma 스타일 히스토리 시스템 설계

/**
 * Figma의 히스토리 시스템 특징:
 * 1. Command 기반 (상태 스냅샷이 아닌 액션 기반)
 * 2. 연속된 같은 액션은 병합 (예: 드래그 중 위치 변경)
 * 3. 배치 액션 지원 (여러 객체 동시 수정)
 * 4. 메모리 효율적 (변경사항만 저장)
 * 5. 스마트 그룹핑 (관련 액션들을 논리적으로 묶음)
 */

// ================== 기본 히스토리 액션 타입 ==================
export enum HistoryActionType {
  // 컴포넌트 생명주기
  CREATE_COMPONENT = "CREATE_COMPONENT",
  DELETE_COMPONENT = "DELETE_COMPONENT",

  // 컴포넌트 속성 변경
  UPDATE_POSITION = "UPDATE_POSITION",
  UPDATE_SIZE = "UPDATE_SIZE",
  UPDATE_ROTATION = "UPDATE_ROTATION",
  UPDATE_OPACITY = "UPDATE_OPACITY",
  UPDATE_FLIP = "UPDATE_FLIP",

  // 🎯 레이어 관리 (레이어 패널 전용)
  REORDER_LAYERS = "REORDER_LAYERS",
  TOGGLE_VISIBILITY = "TOGGLE_VISIBILITY",
  TOGGLE_LOCK = "TOGGLE_LOCK",

  // 선택 상태 (특별한 경우에만 히스토리에 포함)
  SELECTION_CHANGE = "SELECTION_CHANGE",

  // 배치 액션
  BATCH_UPDATE = "BATCH_UPDATE",
  BATCH_DELETE = "BATCH_DELETE",

  // 정렬 액션
  ALIGN_COMPONENTS = "ALIGN_COMPONENTS"
}

// ================== 기본 히스토리 액션 인터페이스 ==================
export interface BaseHistoryAction<TData = any, TInverse = any> {
  type: HistoryActionType;
  timestamp: number;
  groupId?: string; // 관련 액션들을 그룹핑 (Figma의 transaction과 유사)
  isMergeable?: boolean; // 연속된 같은 액션과 병합 가능한지
  description: string; // 사용자에게 보여줄 설명
  data: TData;
  inverse: TInverse;
}

// ================== 구체적인 액션 타입들 ==================

export interface CreateComponentAction
  extends BaseHistoryAction<
    { component: StickerComponent },
    { componentId: number }
  > {
  type: HistoryActionType.CREATE_COMPONENT;
}

export interface DeleteComponentAction
  extends BaseHistoryAction<
    { componentId: number },
    { component: StickerComponent; index: number }
  > {
  type: HistoryActionType.DELETE_COMPONENT;
}

export interface UpdatePositionAction
  extends BaseHistoryAction<
    { componentId: number; newPosition: { x: number; y: number } },
    { componentId: number; oldPosition: { x: number; y: number } }
  > {
  type: HistoryActionType.UPDATE_POSITION;
  isMergeable: true;
}

export interface UpdateSizeAction
  extends BaseHistoryAction<
    { componentId: number; newSize: { width: number; height: number; lockAspectRatio?: boolean } },
    { componentId: number; oldSize: { width: number; height: number; lockAspectRatio?: boolean } }
  > {
  type: HistoryActionType.UPDATE_SIZE;
  isMergeable: true;
}

export interface UpdateRotationAction
  extends BaseHistoryAction<
    { componentId: number; newRotation: number },
    { componentId: number; oldRotation: number }
  > {
  type: HistoryActionType.UPDATE_ROTATION;
  isMergeable: true;
}

export interface UpdateOpacityAction
  extends BaseHistoryAction<
    { componentId: number; newOpacity: number },
    { componentId: number; oldOpacity: number }
  > {
  type: HistoryActionType.UPDATE_OPACITY;
  isMergeable: true;
}

export interface UpdateFlipAction
  extends BaseHistoryAction<
    { componentId: number; flipType: "x" | "y"; newValue: boolean },
    { componentId: number; flipType: "x" | "y"; oldValue: boolean }
  > {
  type: HistoryActionType.UPDATE_FLIP;
}

// 🎯 레이어 패널 전용 액션들 (LayerContext와 정확히 호환)
export interface ReorderLayersAction
  extends BaseHistoryAction<
    { newOrder: Array<{ id: number; zIndex: number }> },
    { oldOrder: Array<{ id: number; zIndex: number }> }
  > {
  type: HistoryActionType.REORDER_LAYERS;
}

export interface ToggleVisibilityAction
  extends BaseHistoryAction<
    { componentId: number; newVisibility: boolean },
    { componentId: number; oldVisibility: boolean }
  > {
  type: HistoryActionType.TOGGLE_VISIBILITY;
}

export interface ToggleLockAction
  extends BaseHistoryAction<
    { componentId: number; newLockState: boolean },
    { componentId: number; oldLockState: boolean }
  > {
  type: HistoryActionType.TOGGLE_LOCK;
}

export interface BatchUpdateAction
  extends BaseHistoryAction<
    {
      updates: Array<{
        componentId: number;
        updates: Partial<StickerComponent>;
      }>;
    },
    {
      updates: Array<{
        componentId: number;
        oldValues: Partial<StickerComponent>;
      }>;
    }
  > {
  type: HistoryActionType.BATCH_UPDATE;
}

export interface AlignComponentsAction
  extends BaseHistoryAction<
    {
      componentIds: number[];
      alignType: "left" | "center" | "right" | "top" | "middle" | "bottom";
      newPositions: Array<{ id: number; x: number; y: number }>;
    },
    {
      componentIds: number[];
      oldPositions: Array<{ id: number; x: number; y: number }>;
    }
  > {
  type: HistoryActionType.ALIGN_COMPONENTS;
}


// ================== 통합 히스토리 액션 타입 ==================
export type HistoryAction =
  | CreateComponentAction
  | DeleteComponentAction
  | UpdatePositionAction
  | UpdateSizeAction
  | UpdateRotationAction
  | UpdateOpacityAction
  | UpdateFlipAction
  | ReorderLayersAction
  | ToggleVisibilityAction
  | ToggleLockAction
  | BatchUpdateAction
  | AlignComponentsAction;

// ================== 히스토리 상태 ==================
export interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
  maxHistorySize: number; // 메모리 관리용
  isRecording: boolean; // 히스토리 기록 일시 중단용
  currentGroupId?: string; // 현재 진행 중인 그룹 ID
}

// ================== 히스토리 그룹 관리 ==================
export interface HistoryGroup {
  id: string;
  startTime: number;
  endTime?: number;
  actions: HistoryAction[];
  description: string;
}

// ================== 히스토리 컨텍스트 값 ==================
export interface HistoryContextValue extends HistoryState {
  // 기본 히스토리 조작
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // 히스토리 기록
  recordAction: (action: HistoryAction) => void;
  startGroup: (description: string) => string; // 그룹 시작, groupId 반환
  endGroup: (groupId: string) => void; // 그룹 종료

  // 히스토리 제어
  pauseRecording: () => void; // 히스토리 기록 일시 중단
  resumeRecording: () => void; // 히스토리 기록 재개
  clearHistory: () => void; // 히스토리 초기화

  // 디버깅 및 유틸리티
  getHistorySize: () => number;
  getLastAction: () => HistoryAction | null;
  getActionDescription: (action: HistoryAction) => string;

  // 🎯 설명 텍스트 (UI용)
  undoDescription: string;
  redoDescription: string;
}

// ================== 확장된 히스토리 컨텍스트 (내부용) ==================
export interface ExtendedHistoryContextValue extends HistoryContextValue {
  // 액션 실행기 등록 (다른 Context와 연동용)
  registerActionExecutor: (
    executor: {
      executeAction: (action: HistoryAction) => void;
      executeInverseAction: (action: HistoryAction) => void;
    }
  ) => () => void;
}

// ================== 액션 생성 헬퍼 함수들 ==================
export const createHistoryAction = {
  createComponent: (component: StickerComponent): CreateComponentAction => ({
    type: HistoryActionType.CREATE_COMPONENT,
    timestamp: Date.now(),
    description: `스티커 추가`,
    data: { component },
    inverse: { componentId: component.id }
  }),

  deleteComponent: (
    component: StickerComponent,
    index: number
  ): DeleteComponentAction => ({
    type: HistoryActionType.DELETE_COMPONENT,
    timestamp: Date.now(),
    description: `스티커 삭제`,
    data: { componentId: component.id },
    inverse: { component, index }
  }),

  updatePosition: (
    componentId: number,
    newPosition: { x: number; y: number },
    oldPosition: { x: number; y: number },
    groupId?: string
  ): UpdatePositionAction => ({
    type: HistoryActionType.UPDATE_POSITION,
    timestamp: Date.now(),
    isMergeable: true,
    groupId,
    description: `위치 변경`,
    data: { componentId, newPosition },
    inverse: { componentId, oldPosition }
  }),

  updateSize: (
    componentId: number,
    newSize: { width: number; height: number; lockAspectRatio?: boolean },
    oldSize: { width: number; height: number; lockAspectRatio?: boolean },
    groupId?: string
  ): UpdateSizeAction => ({
    type: HistoryActionType.UPDATE_SIZE,
    timestamp: Date.now(),
    isMergeable: true,
    groupId,
    description: `크기 변경`,
    data: { componentId, newSize },
    inverse: { componentId, oldSize }
  }),

  updateRotation: (
    componentId: number,
    newRotation: number,
    oldRotation: number,
    groupId?: string
  ): UpdateRotationAction => ({
    type: HistoryActionType.UPDATE_ROTATION,
    timestamp: Date.now(),
    isMergeable: true,
    groupId,
    description: `회전`,
    data: { componentId, newRotation },
    inverse: { componentId, oldRotation }
  }),

  updateOpacity: (
    componentId: number,
    newOpacity: number,
    oldOpacity: number,
    groupId?: string
  ): UpdateOpacityAction => ({
    type: HistoryActionType.UPDATE_OPACITY,
    timestamp: Date.now(),
    isMergeable: true,
    groupId,
    description: `투명도 변경`,
    data: { componentId, newOpacity },
    inverse: { componentId, oldOpacity }
  }),

  updateFlip: (
    componentId: number,
    flipType: "x" | "y",
    newValue: boolean,
    oldValue: boolean
  ): UpdateFlipAction => ({
    type: HistoryActionType.UPDATE_FLIP,
    timestamp: Date.now(),
    description: `${flipType === "x" ? "좌우" : "상하"}반전 ${
      newValue ? "활성화" : "비활성화"
    }`,
    data: { componentId, flipType, newValue },
    inverse: { componentId, flipType, oldValue }
  }),

  // 🎯 레이어 패널 전용 헬퍼 함수들 (LayerContext와 정확히 호환)
  reorderLayers: (
    newOrder: Array<{ id: number; zIndex: number }>,
    oldOrder: Array<{ id: number; zIndex: number }>
  ): ReorderLayersAction => ({
    type: HistoryActionType.REORDER_LAYERS,
    timestamp: Date.now(),
    description: `레이어 순서 변경 (${newOrder.length}개)`,
    data: { newOrder },
    inverse: { oldOrder }
  }),

  toggleVisibility: (
    componentId: number,
    newVisibility: boolean,
    oldVisibility: boolean
  ): ToggleVisibilityAction => ({
    type: HistoryActionType.TOGGLE_VISIBILITY,
    timestamp: Date.now(),
    description: newVisibility ? "스티커 표시" : "스티커 숨김",
    data: { componentId, newVisibility },
    inverse: { componentId, oldVisibility }
  }),

  toggleLock: (
    componentId: number,
    newLockState: boolean,
    oldLockState: boolean
  ): ToggleLockAction => ({
    type: HistoryActionType.TOGGLE_LOCK,
    timestamp: Date.now(),
    description: newLockState ? "스티커 잠금" : "스티커 잠금 해제",
    data: { componentId, newLockState },
    inverse: { componentId, oldLockState }
  }),

  alignComponents: (
    componentIds: number[],
    alignType: "left" | "center" | "right" | "top" | "middle" | "bottom",
    newPositions: Array<{ id: number; x: number; y: number }>,
    oldPositions: Array<{ id: number; x: number; y: number }>
  ): AlignComponentsAction => ({
    type: HistoryActionType.ALIGN_COMPONENTS,
    timestamp: Date.now(),
    description: `${alignType} 정렬`,
    data: { componentIds, alignType, newPositions },
    inverse: { componentIds, oldPositions }
  }),


  batchUpdate: (
    updates: Array<{ componentId: number; updates: Partial<StickerComponent> }>,
    oldValues: Array<{
      componentId: number;
      oldValues: Partial<StickerComponent>;
    }>
  ): BatchUpdateAction => ({
    type: HistoryActionType.BATCH_UPDATE,
    timestamp: Date.now(),
    description: `일괄 수정 (${updates.length}개 스티커)`,
    data: { updates },
    inverse: { updates: oldValues }
  })
};

// ================== 액션 병합 로직 ==================
export const canMergeActions = (
  prevAction: HistoryAction,
  newAction: HistoryAction
): boolean => {
  // 같은 타입이고 병합 가능한 액션인지 확인
  if (prevAction.type !== newAction.type || !newAction.isMergeable) {
    return false;
  }

  // 같은 컴포넌트에 대한 액션인지 확인
  const prevComponentId = getComponentIdFromAction(prevAction);
  const newComponentId = getComponentIdFromAction(newAction);

  if (prevComponentId !== newComponentId) {
    return false;
  }

  // 시간 간격이 너무 크지 않은지 확인 (Figma는 약 500ms)
  const timeDiff = newAction.timestamp - prevAction.timestamp;
  if (timeDiff > HISTORY_CONFIG.MERGE_TIMEOUT) {
    return false;
  }

  // 같은 그룹에 속하는지 확인
  if (prevAction.groupId !== newAction.groupId) {
    return false;
  }

  return true;
};

// ================== 유틸리티 함수 ==================
function getComponentIdFromAction(action: HistoryAction): number | null {
  switch (action.type) {
    case HistoryActionType.CREATE_COMPONENT:
      return action.data.component.id;
    case HistoryActionType.DELETE_COMPONENT:
    case HistoryActionType.UPDATE_POSITION:
    case HistoryActionType.UPDATE_SIZE:
    case HistoryActionType.UPDATE_ROTATION:
    case HistoryActionType.UPDATE_OPACITY:
    case HistoryActionType.UPDATE_FLIP:
    case HistoryActionType.TOGGLE_VISIBILITY:
    case HistoryActionType.TOGGLE_LOCK:
      return action.data.componentId;
    default:
      return null;
  }
}

// 🎯 액션 타입 검사 헬퍼 함수들 (LayerContext용)
export const isReorderLayersAction = (
  action: HistoryAction
): action is ReorderLayersAction => {
  return action.type === HistoryActionType.REORDER_LAYERS;
};

export const isToggleVisibilityAction = (
  action: HistoryAction
): action is ToggleVisibilityAction => {
  return action.type === HistoryActionType.TOGGLE_VISIBILITY;
};

export const isToggleLockAction = (
  action: HistoryAction
): action is ToggleLockAction => {
  return action.type === HistoryActionType.TOGGLE_LOCK;
};

// ================== 히스토리 상수 ==================
export const HISTORY_CONFIG = {
  MAX_HISTORY_SIZE: 50, // 최대 히스토리 개수
  MERGE_TIMEOUT: 0, // 액션 병합 시간 제한 (ms) - 즉각적 응답성
  AUTO_GROUP_TIMEOUT: 0, // 자동 그룹 종료 시간 (ms) - 즉시 그룹 종료
  DEBOUNCE_DELAY: 0 // 연속 액션 디바운스 (ms) - 완전 즉시 반응
} as const;

// ================== 컴포넌트 타입 Import ==================
// 실제 사용 시에는 다음과 같이 import
// import { StickerComponent } from '../context/ComponentContext';

// 참조용 타입 정의 (실제로는 위의 import 사용)
interface StickerComponent {
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
  groupId?: string;
}
