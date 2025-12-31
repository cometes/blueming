// components/ImageEditor.tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Editable, Slate } from "slate-react";
import { Rnd } from "react-rnd";
import { useTheme } from "@emotion/react";
import Button30px from "../../../buttons/button30px";
import Button40px from "../../../buttons/button40px";
import FreeBoardImage from "../../../items/freeboardImage";
import { useFreeBoardContext } from "../context/FreeBoardProviders";
import { useModal } from "../../../../../etc/hooks/useModal";
import ImageUploadModal from "../../../upload/thumbnail";
import * as S from "../style";
import LayerPanel from "./LayerPanel";
import ImageToolbar from "./ImageToolbar";
import { StickerComponent } from "../context/ComponentContext";
import { message } from "antd";
import { Plus } from "lucide-react";

// 회전 핸들 스타일 (Figma 스타일)
const RotationHandle = React.memo(
  ({
    onMouseDown,
    isVisible,
    position
  }: {
    onMouseDown: (e: React.MouseEvent) => void;
    isVisible: boolean;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  }) => {
    if (!isVisible) return null;

    const getPositionStyle = () => {
      const offset = 25;
      switch (position) {
        case "top-left":
          return { top: -offset, left: -offset };
        case "top-right":
          return { top: -offset, right: -offset };
        case "bottom-left":
          return { bottom: -offset, left: -offset };
        case "bottom-right":
          return { bottom: -offset, right: -offset };
      }
    };

    return (
      <div
        style={{
          position: "absolute",
          ...getPositionStyle(),
          width: 16,
          height: 16,
          background: "white",
          border: "1px solid #1890ff",
          borderRadius: "50%",
          cursor: "crosshair",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "8px",
          color: "#1890ff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          zIndex: 1002,
          userSelect: "none",
          transition: "all 0.2s ease"
        }}
        onMouseDown={onMouseDown}
        title="회전"
      >
        ↻
      </div>
    );
  }
);

// displayName 추가
RotationHandle.displayName = "RotationHandle";

// 회전 가이드라인 컴포넌트
const RotationGuide = React.memo(
  ({
    isVisible,
    centerX,
    centerY,
    mouseX,
    mouseY,
    rotation
  }: {
    isVisible: boolean;
    centerX: number;
    centerY: number;
    mouseX: number;
    mouseY: number;
    rotation: number;
  }) => {
    if (!isVisible) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 9998
        }}
      >
        {/* 중심점에서 마우스까지 가이드라인 */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%"
          }}
        >
          <line
            x1={centerX}
            y1={centerY}
            x2={mouseX}
            y2={mouseY}
            stroke="#1890ff"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.6"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r="3"
            fill="#1890ff"
            opacity="0.8"
          />
        </svg>

        {/* 각도 표시 툴팁 */}
        <div
          style={{
            position: "absolute",
            left: mouseX + 10,
            top: mouseY - 10,
            background: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
            whiteSpace: "nowrap"
          }}
        >
          {Math.round(rotation)}°
        </div>
      </div>
    );
  }
);

// displayName 추가
RotationGuide.displayName = "RotationGuide";

const ImageEditor: React.FC = () => {
  const {
    editor,
    content,
    renderLeaf,
    viewerElement,
    isTextTop,
    components,
    updateComponent,
    deleteComponent,
    ratio,
    canvasRef,
    captureAndSaveComponent,
    thumbnail,
    setThumbnail,
    addStickerComponent,
    duplicateComponents,
    selectComponent,
    toggleSelection,
    selectRange,
    selectAll,
    clearSelection,
    isSelected,
    selectedComponent,
    selectedIds,
    restoreFromServer,
    // 🎯 정렬 함수들 추가
    alignLeft,
    alignCenter,
    alignRight,
    alignTop,
    alignMiddle,
    alignBottom,
    startGroup,
    endGroup
  } = useFreeBoardContext();

  const theme = useTheme();
  const { isModalOpen, setIsModalOpen, showModal, cancelModal } = useModal();

  // 회전 및 리사이징 상태 관리
  const [isRotating, setIsRotating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [rotationStart, setRotationStart] = useState({
    angle: 0,
    mouseX: 0,
    mouseY: 0,
    initialRotation: 0
  });
  const [rotationGuide, setRotationGuide] = useState({
    centerX: 0,
    centerY: 0,
    mouseX: 0,
    mouseY: 0
  });
  const rotatingComponentRef = useRef<{
    id: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const clipboardRef = useRef<StickerComponent[] | null>(null);
  const interactionGroupRef = useRef<string | null>(null);

  // 각도 계산 유틸리티 함수 (Figma 스타일 - 감도 조정)
  const calculateAngle = useCallback(
    (centerX: number, centerY: number, mouseX: number, mouseY: number) => {
      const deltaX = mouseX - centerX;
      const deltaY = mouseY - centerY;
      return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    },
    []
  );

  // 각도 정규화 함수 (0-360도) - 더 부드럽게
  const normalizeAngle = useCallback((angle: number) => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  }, []);

  // 회전 감도 조정 함수
  const calculateRotationDelta = useCallback(
    (
      centerX: number,
      centerY: number,
      currentMouseX: number,
      currentMouseY: number,
      initialMouseX: number,
      initialMouseY: number
    ) => {
      const currentAngle = calculateAngle(
        centerX,
        centerY,
        currentMouseX,
        currentMouseY
      );
      const initialAngle = calculateAngle(
        centerX,
        centerY,
        initialMouseX,
        initialMouseY
      );

      let delta = currentAngle - initialAngle;

      // 360도 경계에서의 각도 보정
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      return delta;
    },
    [calculateAngle]
  );

  // 회전 시작 (Figma 스타일)
  const handleRotationStart = useCallback(
    (componentId: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const component = components.find(comp => comp.id === componentId);
      if (!component || component.isLocked) return;

      if (!interactionGroupRef.current) {
        interactionGroupRef.current = startGroup("rotate");
      }

      // 캔버스 기준으로 좌표 계산
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      // 스티커의 중심점 계산 (캔버스 기준)
      const centerX = canvasRect.left + component.x + component.width / 2;
      const centerY = canvasRect.top + component.y + component.height / 2;

      setIsRotating(true);
      setRotationStart({
        angle: 0,
        mouseX: e.clientX,
        mouseY: e.clientY,
        initialRotation: component.rotation || 0
      });

      setRotationGuide({
        centerX,
        centerY,
        mouseX: e.clientX,
        mouseY: e.clientY
      });

      rotatingComponentRef.current = { id: componentId, centerX, centerY };

      // 선택 상태로 만들기
      selectComponent(componentId);
    },
    [components, selectComponent]
  );

  // 회전 중 (개선된 감도)
  const handleRotationMove = useCallback(
    (e: MouseEvent) => {
      if (!isRotating || !rotatingComponentRef.current) return;

      e.preventDefault();

      const { id, centerX, centerY } = rotatingComponentRef.current;

      // 회전 델타 계산 (감도 조정)
      const rotationDelta = calculateRotationDelta(
        centerX,
        centerY,
        e.clientX,
        e.clientY,
        rotationStart.mouseX,
        rotationStart.mouseY
      );

      const newRotation = normalizeAngle(
        rotationStart.initialRotation + rotationDelta
      );

      // 가이드라인 업데이트
      setRotationGuide(prev => ({
        ...prev,
        mouseX: e.clientX,
        mouseY: e.clientY
      }));

      updateComponent(
        id,
        { rotation: Math.round(newRotation) },
        interactionGroupRef.current || undefined
      );
    },
    [
      isRotating,
      calculateRotationDelta,
      normalizeAngle,
      rotationStart,
      updateComponent
    ]
  );

  // 회전 종료
  const handleRotationEnd = useCallback(() => {
    setIsRotating(false);
    rotatingComponentRef.current = null;
    if (interactionGroupRef.current) {
      endGroup(interactionGroupRef.current);
      interactionGroupRef.current = null;
    }
  }, [endGroup]);

  // 마우스 이벤트 리스너 등록/해제
  React.useEffect(() => {
    if (isRotating) {
      document.addEventListener("mousemove", handleRotationMove);
      document.addEventListener("mouseup", handleRotationEnd);

      return () => {
        document.removeEventListener("mousemove", handleRotationMove);
        document.removeEventListener("mouseup", handleRotationEnd);
      };
    }
  }, [isRotating, handleRotationMove, handleRotationEnd]);

  // 배경 클릭 시 선택 해제 (리사이징 중에는 무시)
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (isRotating || isResizing) return;
    clearSelection();
  };

  // 스티커 클릭 시 선택 (개선된 로직)
  const handleStickerClick = (componentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (isRotating || isResizing) return;
    if (e.shiftKey) {
      selectRange(componentId);
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelection(componentId);
    } else {
      selectComponent(componentId);
    }
  };

  // 🎯 저장 시 선택 해제 후 캡쳐 진행
  const handleSaveWithClearSelection = useCallback(async () => {
    // 먼저 모든 선택 해제
    clearSelection();

    // 선택 해제가 UI에 반영될 시간을 위해 잠시 대기 (React 리렌더링 대기)
    await new Promise(resolve => setTimeout(resolve, 50));

    // 그 다음 캡쳐 및 저장 진행
    await captureAndSaveComponent();
  }, [clearSelection, captureAndSaveComponent]);

  // 선택된 컴포넌트 정보 가져오기
  const getSelectedComponent = () => {
    if (!selectedComponent) return null;
    return components.find(comp => comp.id === selectedComponent);
  };

  const selectedComp = getSelectedComponent();

  // ================== 키보드 단축키 ==================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      // 입력 필드나 텍스트 에디터에서는 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true" ||
        target.closest("[contenteditable]")
      ) {
        return;
      }

      const isMeta = e.ctrlKey || e.metaKey;

      // 🎯 Select All: Ctrl+A / Cmd+A
      if (isMeta && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        e.stopPropagation();
        selectAll(components.map(c => c.id));
        return;
      }

      // 🎯 Copy: Ctrl+C / Cmd+C
      if (isMeta && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        e.stopPropagation();
        clipboardRef.current = selectedIds
          .map(id => components.find(c => c.id === id))
          .filter(Boolean) as StickerComponent[];
        if (selectedIds.length > 0) {
          message.success(`${selectedIds.length}개 스티커가 복사되었습니다.`);
        }
        return;
      }

      // 🎯 Paste: Ctrl+V / Cmd+V
      if (isMeta && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        e.stopPropagation();
        if (clipboardRef.current && clipboardRef.current.length > 0) {
          clipboardRef.current.forEach((comp, idx) => {
            const newComponent = {
              ...comp,
              id: Date.now() + idx,
              x: comp.x + 10,
              y: comp.y + 10
            };
            duplicateComponents([newComponent]);
          });
          message.success(
            `${clipboardRef.current.length}개 스티커가 붙여넣기되었습니다.`
          );
        } else {
          message.warning("복사된 스티커가 없습니다.");
        }
        return;
      }

      // 🎯 Delete: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          e.stopPropagation();
          let anyDeleted = false;
          selectedIds.forEach(id => {
            const comp = components.find(c => c.id === id);
            if (comp && comp.isLocked) {
              message.warning("잠긴 스티커는 삭제할 수 없습니다.");
            } else {
              deleteComponent(id);
              anyDeleted = true;
            }
          });
          if (anyDeleted) {
            clearSelection();
          }
        }
        return;
      }
    };
    // 🎯 캡처 단계에서 이벤트 리스너 등록하여 HistoryContext와 함께 동작
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [
    components,
    selectedIds,
    selectAll,
    deleteComponent,
    clearSelection,
    duplicateComponents
  ]);

  return (
    <>
      <ImageUploadModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        showModal={showModal}
        cancelModal={cancelModal}
        thumbnail={thumbnail}
        setThumbnail={setThumbnail}
        onClickUpload={addStickerComponent}
      />

      <S.FlexBox>
        <Button30px
          content="이미지 추가하기"
          onClick={showModal}
          icon={Plus}
          background={theme.palette.background.bgDark}
          color={theme.palette.text.textWhite}
        />
      </S.FlexBox>

      {/* 메인 편집 영역과 레이어 패널을 나란히 배치 */}
      <S.ImageEditorContainer>
        {/* 캔버스 영역 */}
        <S.CanvasSection onClick={handleBackgroundClick}>
          <Slate
            editor={editor}
            initialValue={JSON.parse(content)}
            key={content}
          >
            <S.EditWrap>
              <S.Canvas ref={canvasRef} ratio={ratio}>
                <S.CaptureArea
                  id="capture-area"
                  onClick={handleBackgroundClick}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%"
                  }}
                >
                  <S.ImageEditBox>
                    {components
                      .filter(comp => comp.isVisible)
                      .map(comp => (
                        <Rnd
                          key={comp.id}
                          size={{
                            width: comp.width || "fit-content",
                            height: comp.height || "fit-content"
                          }}
                          position={{
                            x: comp.x,
                            y: comp.y
                          }}
                          style={{
                            zIndex: comp.zIndex,
                            position: "absolute",
                            opacity: comp.isVisible ? 1 : 0.3,
                            border: "2px solid transparent",
                            borderRadius: "4px",
                            transition: isRotating
                              ? "none"
                              : "border-color 0.2s ease"
                          }}
                          onDragStart={() => {
                            if (
                              !comp.isLocked &&
                              !isRotating &&
                              !interactionGroupRef.current
                            ) {
                              interactionGroupRef.current = startGroup("drag");
                            }
                          }}
                          onDragStop={(e, d) => {
                            if (!comp.isLocked && !isRotating) {
                              updateComponent(
                                comp.id,
                                {
                                  x: d.x,
                                  y: d.y
                                },
                                interactionGroupRef.current || undefined
                              );
                            }
                            if (interactionGroupRef.current) {
                              endGroup(interactionGroupRef.current);
                              interactionGroupRef.current = null;
                            }
                          }}
                          onResizeStart={() => {
                            if (!interactionGroupRef.current) {
                              interactionGroupRef.current =
                                startGroup("resize");
                            }
                            setIsResizing(true);
                          }}
                          onResize={() => {
                            // 리사이징 중
                          }}
                          onResizeStop={(
                            e,
                            direction,
                            ref,
                            delta,
                            position
                          ) => {
                            if (
                              !comp.isLocked &&
                              !isRotating &&
                              isSelected(comp.id)
                            ) {
                              updateComponent(
                                comp.id,
                                {
                                  width: parseInt(ref.style.width),
                                  height: parseInt(ref.style.height),
                                  ...position
                                },
                                interactionGroupRef.current || undefined
                              );
                            }
                            setIsResizing(false);
                            if (interactionGroupRef.current) {
                              endGroup(interactionGroupRef.current);
                              interactionGroupRef.current = null;
                            }
                          }}
                          dragHandleClassName="drag-handle"
                          lockAspectRatio={comp.lockAspectRatio || false} // 🎯 비율 고정 적용
                          disableDragging={
                            comp.isLocked || isRotating || isResizing
                          }
                          enableResizing={
                            !comp.isLocked &&
                            !isRotating &&
                            !isResizing &&
                            isSelected(comp.id)
                          }
                        >
                          <div
                            className="drag-handle"
                            style={{
                              cursor: comp.isLocked
                                ? "not-allowed"
                                : isRotating
                                ? "grabbing"
                                : isResizing
                                ? "grabbing"
                                : isSelected(comp.id)
                                ? "move"
                                : "pointer",
                              width: "100%",
                              height: "100%",
                              position: "relative",
                              // 🎯 회전 + 반전을 함께 적용 (Figma 스타일)
                              transform: `
                                rotate(${comp.rotation || 0}deg) 
                                scaleX(${comp.flipX ? -1 : 1}) 
                                scaleY(${comp.flipY ? -1 : 1})
                              `,
                              transformOrigin: "center center",
                              transition: isRotating
                                ? "none"
                                : "transform 0.2s ease",
                              outline: isSelected(comp.id)
                                ? "1px solid #1890ff"
                                : "none",
                              outlineOffset: "-1px", // 내부에 표시
                              borderRadius: "4px",
                              boxShadow: isSelected(comp.id)
                                ? "0 0 0 1px rgba(24, 144, 255, 0.2)"
                                : "none"
                            }}
                          >
                            <FreeBoardImage
                              onDelete={() => deleteComponent(comp.id)}
                              imageUrl={comp.imageUrl}
                              isSelected={isSelected(comp.id)}
                              onClick={e => handleStickerClick(comp.id, e)}
                              opacity={comp.opacity || 100}
                            />

                            {/* 잠금 상태 표시 */}
                            {comp.isLocked && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "4px",
                                  right: "4px",
                                  background: "rgba(255, 255, 255, 0.9)",
                                  borderRadius: "4px",
                                  padding: "2px 4px",
                                  fontSize: "12px",
                                  color: "#666",
                                  pointerEvents: "none"
                                }}
                              >
                                🔒
                              </div>
                            )}

                            {/* 회전 핸들 */}
                            {isSelected(comp.id) &&
                              !comp.isLocked &&
                              !isRotating &&
                              !isResizing && (
                                <RotationHandle
                                  isVisible={true}
                                  position="bottom-right"
                                  onMouseDown={e =>
                                    handleRotationStart(comp.id, e)
                                  }
                                />
                              )}
                          </div>
                        </Rnd>
                      ))}
                  </S.ImageEditBox>

                  <S.EditorWrap isTextTop={isTextTop}>
                    <Editable
                      readOnly
                      renderElement={viewerElement}
                      renderLeaf={renderLeaf}
                      style={{
                        height: "100%",
                        flexGrow: 1,
                        outline: "none"
                      }}
                    />
                  </S.EditorWrap>
                </S.CaptureArea>
              </S.Canvas>
            </S.EditWrap>
          </Slate>
        </S.CanvasSection>

        {/* 레이어 패널 */}
        <S.LayerSection onClick={e => e.stopPropagation()}>
          <LayerPanel />
        </S.LayerSection>

        {/* 이미지 편집 툴바 */}
        <S.ToolbarSection onClick={e => e.stopPropagation()}>
          <ImageToolbar
            selectedComponent={selectedComp}
            onXChange={value => {
              if (
                selectedComp &&
                !selectedComp.isLocked &&
                value !== null &&
                !isRotating
              ) {
                updateComponent(selectedComp.id, { x: value });
              }
            }}
            onYChange={value => {
              if (
                selectedComp &&
                !selectedComp.isLocked &&
                value !== null &&
                !isRotating
              ) {
                updateComponent(selectedComp.id, { y: value });
              }
            }}
            onWidthChange={value => {
              if (
                selectedComp &&
                !selectedComp.isLocked &&
                value !== null &&
                value >= 10
              ) {
                // 🔧 비율 고정이 활성화된 경우 height도 함께 업데이트
                if (
                  selectedComp.lockAspectRatio &&
                  selectedComp.width &&
                  selectedComp.height
                ) {
                  const aspectRatio = selectedComp.width / selectedComp.height;
                  const newHeight = Math.round(value / aspectRatio);
                  updateComponent(selectedComp.id, {
                    width: value,
                    height: newHeight,
                    lockAspectRatio: true // 🎯 비율 고정 상태 명시적으로 포함
                  });
                } else {
                  updateComponent(selectedComp.id, { width: value });
                }
              }
            }}
            onHeightChange={value => {
              if (
                selectedComp &&
                !selectedComp.isLocked &&
                value !== null &&
                value >= 10
              ) {
                // 🔧 비율 고정이 활성화된 경우 width도 함께 업데이트
                if (
                  selectedComp.lockAspectRatio &&
                  selectedComp.width &&
                  selectedComp.height
                ) {
                  const aspectRatio = selectedComp.width / selectedComp.height;
                  const newWidth = Math.round(value * aspectRatio);
                  updateComponent(selectedComp.id, {
                    width: newWidth,
                    height: value,
                    lockAspectRatio: true // 🎯 비율 고정 상태 명시적으로 포함
                  });
                } else {
                  updateComponent(selectedComp.id, { height: value });
                }
              }
            }}
            onRotationChange={value => {
              if (
                selectedComp &&
                !selectedComp.isLocked &&
                value !== null &&
                !isRotating
              ) {
                updateComponent(selectedComp.id, { rotation: value });
              }
            }}
            onOpacityChange={value => {
              if (selectedComp && !selectedComp.isLocked && value !== null) {
                updateComponent(selectedComp.id, { opacity: value });
              }
            }}
            onFlipX={() => {
              if (selectedComp && !selectedComp.isLocked) {
                updateComponent(selectedComp.id, {
                  flipX: !selectedComp.flipX
                });
              }
            }}
            onFlipY={() => {
              if (selectedComp && !selectedComp.isLocked) {
                updateComponent(selectedComp.id, {
                  flipY: !selectedComp.flipY
                });
              }
            }}
            onResetTransform={() => {
              if (selectedComp && !selectedComp.isLocked) {
                updateComponent(selectedComp.id, {
                  rotation: 0,
                  flipX: false,
                  flipY: false
                });
              }
            }}
            onToggleLockAspectRatio={() => {
              if (selectedComp) {
                updateComponent(selectedComp.id, {
                  lockAspectRatio: !selectedComp.lockAspectRatio
                });
              }
            }}
            onAlignLeft={() => {
              if (selectedComp && !selectedComp.isLocked) {
                alignLeft(selectedComp.id);
              }
            }}
            onAlignCenter={() => {
              if (selectedComp && !selectedComp.isLocked) {
                alignCenter(selectedComp.id);
              }
            }}
            onAlignRight={() => {
              if (selectedComp && !selectedComp.isLocked) {
                alignRight(selectedComp.id);
              }
            }}
            onAlignTop={() => {
              if (selectedComp && !selectedComp.isLocked) {
                alignTop(selectedComp.id);
              }
            }}
            onAlignMiddle={() => {
              if (selectedComp && !selectedComp.isLocked) {
                alignMiddle(selectedComp.id);
              }
            }}
            onAlignBottom={() => {
              if (selectedComp && !selectedComp.isLocked) {
                alignBottom(selectedComp.id);
              }
            }}
            // 🎯 서버 상태 복원 함수 연결
            onRestoreFromServer={() => {
              restoreFromServer();
            }}
          />
        </S.ToolbarSection>
      </S.ImageEditorContainer>

      <S.ButtonBox>
        <Button40px content="저장하기" onClick={handleSaveWithClearSelection} />
      </S.ButtonBox>

      {/* 회전 가이드라인 및 전체 화면 오버레이 */}
      {isRotating && (
        <>
          <RotationGuide
            isVisible={true}
            centerX={rotationGuide.centerX}
            centerY={rotationGuide.centerY}
            mouseX={rotationGuide.mouseX}
            mouseY={rotationGuide.mouseY}
            rotation={selectedComp?.rotation || 0}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              cursor: "crosshair",
              userSelect: "none"
            }}
          />
        </>
      )}

      {/* 리사이징 중일 때 선택 해제 방지 오버레이 */}
      {isResizing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            pointerEvents: "none",
            userSelect: "none"
          }}
        />
      )}
    </>
  );
};

export default ImageEditor;
