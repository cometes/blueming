// context/FreeBoardProviders.tsx (히스토리 통합 버전)
import React from "react";
import {
  FreeBoardBaseProvider,
  useFreeBoardBaseContext
} from "./FreeBoardContext";
import { ComponentProvider, useComponentContext } from "./ComponentContext";
import { LayerProvider, useLayerContext } from "./LayerContext";
import { SelectionProvider, useSelectionContext } from "./SelectionContext";
// 🎯 HistoryProvider 추가
import { HistoryProvider, useHistoryContext } from "./HistoryContext";

// ================== 통합 Provider ==================
export const FreeBoardProviders: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <HistoryProvider>
      {" "}
      {/* 🎯 최상단에 HistoryProvider 추가 */}
      <FreeBoardBaseProvider>
        <ComponentProvider>
          <LayerProvider>
            <SelectionProvider>{children}</SelectionProvider>
          </LayerProvider>
        </ComponentProvider>
      </FreeBoardBaseProvider>
    </HistoryProvider>
  );
};

// ================== 통합 Hook (편의용) ==================
export const useFreeBoardContext = () => {
  // 각 Context에서 필요한 것들을 가져와서 통합
  const base = useFreeBoardBaseContext();
  const component = useComponentContext();
  const layer = useLayerContext();
  const selection = useSelectionContext();
  const history = useHistoryContext(); // 🎯 히스토리 Context 추가

  return {
    // 기본 기능
    ...base,

    // 컴포넌트 관리
    ...component,

    // 레이어 관리
    ...layer,

    // 선택 관리
    ...selection,

    // 🎯 히스토리 관리
    ...history,

    // 🎯 명시적으로 resetToSavedState 노출
    restoreFromServer: component.restoreFromServer
  };
};

// 개별 Context Hook들도 export
export { useFreeBoardBaseContext } from "./FreeBoardContext";
export { useComponentContext } from "./ComponentContext";
export { useLayerContext } from "./LayerContext";
export { useSelectionContext } from "./SelectionContext";
export { useHistoryContext } from "./HistoryContext"; // 🎯 히스토리 Hook도 export
