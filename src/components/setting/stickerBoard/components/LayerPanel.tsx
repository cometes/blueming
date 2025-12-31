// components/LayerPanel.tsx
import React, { useMemo } from "react";
import { useFreeBoardContext } from "../context/FreeBoardProviders";
import * as S from "./layerPanelStyle";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Eye,
  EyeClosed,
  LockKeyhole,
  LockKeyholeOpen,
  Trash2
} from "lucide-react";
import { useTheme } from "@emotion/react";

const LayerPanel: React.FC = () => {
  const {
    components,
    reorderComponents,
    deleteComponent,
    toggleComponentVisibility,
    toggleComponentLock,
    selectComponent,
    toggleSelection,
    selectRange,
    selectAll, // 🔧 모두 선택 함수 추가
    clearSelection, // 선택 해제 함수 추가
    isSelected,
    selectedIds // 🎯 선택된 ID 목록 추가
  } = useFreeBoardContext();

  const theme = useTheme();

  // 드래그 종료 시 호출 (슬라이드 패턴 적용)
  const handleDragEnd = (result: any) => {
    const { destination, source } = result;

    if (!destination || destination.index === source.index) return;

    // 현재 정렬된 컴포넌트들 가져오기
    const sortedComponents = [...components].sort(
      (a, b) => b.zIndex - a.zIndex
    );

    // 드래그된 아이템 이동 (슬라이드와 동일한 로직)
    const [movedItem] = sortedComponents.splice(source.index, 1);
    sortedComponents.splice(destination.index, 0, movedItem);

    // zIndex 재할당 (슬라이드의 id 재할당과 동일한 패턴)
    const reorderedComponents = sortedComponents.map((component, index) => ({
      ...component,
      zIndex: sortedComponents.length - index
    }));

    // Context 업데이트 (슬라이드의 setValue와 동일한 역할)
    reorderComponents(reorderedComponents);
  };

  // 레이어 아이템 클릭 시 스티커 선택
  const handleLayerClick = (componentId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    if (e.shiftKey) {
      selectRange(componentId);
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelection(componentId);
    } else {
      selectComponent(componentId);
    }
  };

  // 레이어 패널 빈공간 클릭 시 선택 해제
  const handleLayerListClick = (e: React.MouseEvent) => {
    // 이벤트가 LayerList 자체에서 발생한 경우에만 선택 해제
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  // 🎯 모든 스티커가 선택되었는지 확인
  const areAllSelected = useMemo(() => {
    if (components.length === 0) return false;
    return components.every(comp => selectedIds.includes(comp.id));
  }, [components, selectedIds]);

  // 🎯 모든 스티커 선택/해제 토글 기능
  const handleToggleSelectAll = () => {
    if (areAllSelected) {
      clearSelection();
    } else {
      selectAll(components.map(c => c.id));
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm("모든 스티커를 삭제하시겠습니까?")) {
      components.forEach(comp => deleteComponent(comp.id));
    }
  };

  // zIndex 순서대로 미리 정렬 (성능 최적화)
  const sortedComponents = useMemo(
    () => [...components].sort((a, b) => b.zIndex - a.zIndex),
    [components]
  );

  return (
    <S.LayerPanelContainer>
      <S.LayerPanelHeader>
        <S.LayerTitle>레이어</S.LayerTitle>
        <S.LayerCount>총 {components.length}개</S.LayerCount>
      </S.LayerPanelHeader>

      <S.LayerList onClick={handleLayerListClick}>
        {" "}
        {/* 빈공간 클릭 시 선택 해제 */}
        {components.length === 0 ? (
          <S.EmptyState>
            <S.EmptyIcon>📷</S.EmptyIcon>
            <S.EmptyText>추가된 스티커가 없습니다</S.EmptyText>
            <S.EmptySubText>이미지를 추가해보세요!</S.EmptySubText>
          </S.EmptyState>
        ) : (
          <div>
            {/* zIndex 순서대로 정렬된 컴포넌트들 */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="layers">
                {provided => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {sortedComponents.map((component, index) => (
                      <Draggable
                        key={component.id.toString()} // 고유 ID 사용 (슬라이드의 uniqueId와 동일)
                        draggableId={component.id.toString()} // 고유 ID 사용
                        index={index}
                      >
                        {provided => (
                          <S.LayerBox
                            key={component.id}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            isVisible={component.isVisible}
                            isSelected={isSelected(component.id)} // 선택 상태 전달
                          >
                            <S.LayerItem
                              {...provided.dragHandleProps}
                              onClick={e => handleLayerClick(component.id, e)} // 레이어 클릭 시 선택
                              isSelected={isSelected(component.id)} // 선택 상태 전달
                            >
                              {/* 레이어 미리보기 */}
                              <S.LayerPreview>
                                <S.LayerImage
                                  src={component.imageUrl}
                                  alt={`Layer ${component.id}`}
                                  style={{
                                    opacity: component.isVisible ? 1 : 0.5
                                  }}
                                />
                              </S.LayerPreview>

                              {/* 레이어 컨트롤 */}
                              <S.LayerControls>
                                <S.LayerOrder
                                  isSelected={isSelected(component.id)}
                                >
                                  #{index + 1}
                                </S.LayerOrder>

                                {/* 가시성 토글 버튼 */}
                                <S.ControlButton
                                  onClick={e => {
                                    e.stopPropagation();
                                    toggleComponentVisibility(component.id);
                                  }}
                                  title={
                                    component.isVisible ? "숨기기" : "보이기"
                                  }
                                  active={component.isVisible}
                                >
                                  {component.isVisible ? (
                                    <Eye color={theme.palette.text.textMain} />
                                  ) : (
                                    <EyeClosed
                                      color={theme.palette.text.textSub}
                                    />
                                  )}
                                </S.ControlButton>

                                {/* 잠금 토글 버튼 */}
                                <S.ControlButton
                                  onClick={e => {
                                    e.stopPropagation();
                                    toggleComponentLock(component.id);
                                  }}
                                  title={
                                    component.isLocked ? "잠금 해제" : "잠그기"
                                  }
                                  active={component.isLocked}
                                >
                                  {component.isLocked ? (
                                    <LockKeyhole
                                      color={theme.palette.text.textMain}
                                    />
                                  ) : (
                                    <LockKeyholeOpen
                                      color={theme.palette.text.textSub}
                                    />
                                  )}
                                </S.ControlButton>

                                {/* 삭제 버튼 */}
                                <S.DeleteButton
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (
                                      window.confirm(
                                        "이 스티커를 삭제하시겠습니까?"
                                      )
                                    ) {
                                      deleteComponent(component.id);
                                    }
                                  }}
                                  title="삭제"
                                >
                                  <Trash2 color={theme.palette.text.textSub} />
                                </S.DeleteButton>
                              </S.LayerControls>
                            </S.LayerItem>
                          </S.LayerBox>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </S.LayerList>

      {components.length > 0 && (
        <S.LayerPanelFooter>
          <S.FooterButton
            onClick={handleToggleSelectAll}
            variant={areAllSelected ? "secondary" : "primary"} // 🎯 선택 상태에 따라 스타일 변경
          >
            {areAllSelected ? "모두 해제" : "모두 선택"}
          </S.FooterButton>
          <S.FooterButton variant="danger" onClick={handleDeleteAll}>
            모두 삭제
          </S.FooterButton>
        </S.LayerPanelFooter>
      )}
    </S.LayerPanelContainer>
  );
};

export default LayerPanel;
