// context/SelectionContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo
} from "react";
import { useComponentContext, StickerComponent } from "./ComponentContext";

// ================== 타입 정의 ==================
export interface SelectionState {
  selectedIds: number[];
  lastSelectedId: number | null;
  hoveredId: number | null;
}

export interface SelectionContextValue extends SelectionState {
  // 기본 선택
  selectComponent: (id: number) => void;
  toggleSelection: (id: number) => void;
  selectRange: (id: number) => void;
  selectAll: (ids: number[]) => void;
  clearSelection: () => void;
  isSelected: (id: number) => boolean;
  
  // 호버
  setHoveredComponent: (id: number | null) => void;
  
  // 유틸리티
  hasSelection: boolean;
  selectedComponent: number | null;
  selectedIds: number[];
  selectedComponents: StickerComponent[];
}

// ================== 초기 상태 ==================
const initialState: SelectionState = {
  selectedIds: [],
  lastSelectedId: null,
  hoveredId: null
};

// ================== Context 생성 ==================
const SelectionContext = createContext<SelectionContextValue | null>(null);

export const useSelectionContext = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error(
      "useSelectionContext must be used within SelectionProvider"
    );
  }
  return context;
};

// ================== Provider 컴포넌트 ==================
export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [state, setState] = useState<SelectionState>(initialState);
  const { components } = useComponentContext();

  // ================== 기본 선택 액션 ==================
  const selectComponent = useCallback((id: number) => {
    setState(prev => ({
      ...prev,
      selectedIds: [id],
      lastSelectedId: id
    }));
  }, []);

  const toggleSelection = useCallback((id: number) => {
    setState(prev => {
      const exists = prev.selectedIds.includes(id);
      const newIds = exists
        ? prev.selectedIds.filter(i => i !== id)
        : [...prev.selectedIds, id];
      return {
        ...prev,
        selectedIds: newIds,
        lastSelectedId: id
      };
    });
  }, []);

  const selectRange = useCallback(
    (id: number) => {
      if (state.lastSelectedId === null) {
        selectComponent(id);
        return;
      }
      const sorted = [...components].sort((a, b) => b.zIndex - a.zIndex);
      const ids = sorted.map(c => c.id);
      const startIndex = ids.indexOf(state.lastSelectedId);
      const endIndex = ids.indexOf(id);
      if (startIndex === -1 || endIndex === -1) {
        selectComponent(id);
        return;
      }
      const range = ids.slice(
        Math.min(startIndex, endIndex),
        Math.max(startIndex, endIndex) + 1
      );
      setState(prev => ({
        ...prev,
        selectedIds: Array.from(new Set([...prev.selectedIds, ...range])),
        lastSelectedId: id
      }));
    },
    [components, selectComponent, state.lastSelectedId]
  );

  const selectAll = useCallback((ids: number[]) => {
    setState(prev => ({
      ...prev,
      selectedIds: ids,
      lastSelectedId: ids[ids.length - 1] || null
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIds: [],
      lastSelectedId: null
    }));
  }, []);

  const isSelected = useCallback((id: number) => {
    return state.selectedIds.includes(id);
  }, [state.selectedIds]);

  // ================== 호버 액션 ==================
  const setHoveredComponent = useCallback((id: number | null) => {
    setState(prev => ({
      ...prev,
      hoveredId: id
    }));
  }, []);

  // ================== 유틸리티 ==================
  const hasSelection = state.selectedIds.length > 0;
  const selectedComponent = state.selectedIds[0] || null;
  const selectedComponents = useMemo(
    () =>
      state.selectedIds
        .map(id => components.find(c => c.id === id))
        .filter((c): c is StickerComponent => !!c),
    [state.selectedIds, components]
  );

  // ================== Context Value ==================
  const contextValue: SelectionContextValue = useMemo(
    () => ({
      // 상태
      ...state,

      // 기본 선택
      selectComponent,
      toggleSelection,
      selectRange,
      selectAll,
      clearSelection,
      isSelected,

      // 호버
      setHoveredComponent,

      // 유틸리티
      hasSelection,
      selectedComponent,
      selectedIds: state.selectedIds,
      selectedComponents
    }),
    [
      state,
      selectComponent,
      toggleSelection,
      selectRange,
      selectAll,
      clearSelection,
      isSelected,
      setHoveredComponent,
      selectedComponents
    ]
  );

  return (
    <SelectionContext.Provider value={contextValue}>
      {children}
    </SelectionContext.Provider>
  );
};