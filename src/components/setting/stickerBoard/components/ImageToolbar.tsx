// components/ImageToolbar.tsx (히스토리 통합 버전)
import React from "react";
import { InputNumber } from "antd";
import * as S from "./imageToolbarStyle";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Eye,
  FlipHorizontal2,
  FlipVertical2,
  Link2,
  Redo,
  RefreshCcw,
  RefreshCw,
  Undo,
  Unlink2
} from "lucide-react";

// 🎯 히스토리 연결
import {
  useHistoryShortcuts,
  useHistoryGroup,
  useHistoryContext
} from "../context/HistoryContext";
import { useFreeBoardContext } from "../context/FreeBoardProviders";
import { useTheme } from "@emotion/react";

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
  flipX?: boolean; // 좌우반전
  flipY?: boolean; // 상하반전
  lockAspectRatio?: boolean; // 비율 고정
}

interface ImageToolbarProps {
  selectedComponent?: StickerComponent | null;
  onXChange?: (value: number | null) => void;
  onYChange?: (value: number | null) => void;
  onWidthChange?: (value: number | null) => void;
  onHeightChange?: (value: number | null) => void;
  onRotationChange?: (value: number | null) => void;
  onOpacityChange?: (value: number | null) => void;
  onFlipX?: () => void;
  onFlipY?: () => void;
  onResetTransform?: () => void;
  onToggleLockAspectRatio?: () => void;

  // 정렬 기능 콜백들
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onAlignTop?: () => void;
  onAlignMiddle?: () => void;
  onAlignBottom?: () => void;

  // 🎯 서버 상태 복원 콜백 (히스토리도 함께 삭제)
  onRestoreFromServer?: () => void;
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({
  selectedComponent = null,
  onXChange,
  onYChange,
  onWidthChange,
  onHeightChange,
  onRotationChange,
  onOpacityChange,
  onFlipX,
  onFlipY,
  onResetTransform,
  onToggleLockAspectRatio,
  // 정렬 콜백들
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  // 🎯 서버 상태 복원 콜백 (히스토리도 함께 삭제)
  onRestoreFromServer
}) => {
  // 🎯 히스토리 기능 연결
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } =
    useHistoryShortcuts();

  // 🎯 히스토리 상태 확인을 위해 Context에서 직접 가져오기
  const { clearHistory, getHistorySize } = useHistoryContext();

  // 🔧 히스토리가 있는지 확인 (서버 복원 버튼 활성화 조건)
  const hasHistory = getHistorySize() > 0;

  const { withGroup } = useHistoryGroup();
  const { selectedIds, components } = useFreeBoardContext();

  // 선택된 컴포넌트의 속성값들 (선택되지 않은 경우 undefined로 처리)
  const x = selectedComponent
    ? Math.round(selectedComponent.x * 100) / 100
    : undefined;
  const y = selectedComponent
    ? Math.round(selectedComponent.y * 100) / 100
    : undefined;
  const width = selectedComponent
    ? Math.round(selectedComponent.width)
    : undefined;
  const height = selectedComponent
    ? Math.round(selectedComponent.height)
    : undefined;
  const rotation = selectedComponent?.rotation;
  const opacity = selectedComponent?.opacity;
  const flipX = selectedComponent?.flipX || false;
  const flipY = selectedComponent?.flipY || false;
  const lockAspectRatio = selectedComponent?.lockAspectRatio || false;

  // 🎯 히스토리 및 서버 상태 관리 핸들러들
  const handleResetToServer = async () => {
    if (!onRestoreFromServer) {
      return;
    }

    if (
      window.confirm(
        "서버에 저장된 상태로 되돌리시겠습니까?\n(현재 편집 내용이 사라지지만 히스토리는 유지됩니다)"
      )
    ) {
      // 🔧 서버 상태로만 복원, 히스토리는 유지
      onRestoreFromServer();
    }
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  // 좌우반전, 상하반전 핸들러
  const handleFlipX = () => {
    if (onFlipX) {
      onFlipX();
    }
  };

  const handleFlipY = () => {
    if (onFlipY) {
      onFlipY();
    }
  };

  // 회전/반전 초기화 핸들러
  const handleResetTransform = async () => {
    if (onResetTransform && selectedComponent) {
      await withGroup("변형 초기화", async () => {
        onResetTransform();
      });
    }
  };

  // 비율 고정 토글 핸들러
  const handleToggleLockAspectRatio = () => {
    if (onToggleLockAspectRatio) {
      onToggleLockAspectRatio();
    }
  };

  // 비율 고정 시 자동 계산 로직이 포함된 크기 변경 핸들러
  const handleWidthChangeWithAspectRatio = async (value: number | null) => {
    if (!onWidthChange || !selectedComponent || value === null) return;

    if (
      lockAspectRatio &&
      selectedComponent.width &&
      selectedComponent.height &&
      onHeightChange
    ) {
      // 🎯 비율 고정 시 그룹으로 처리 - 단일 업데이트로 처리
      await withGroup("크기 변경 (비율 고정)", async () => {
        const aspectRatio = selectedComponent.width / selectedComponent.height;
        const newHeight = Math.round(value / aspectRatio);

        // 🔧 수정된 onWidthChange를 통해 lockAspectRatio 상태 포함하여 업데이트
        // 부모 컴포넌트에서 updateComponent를 직접 호출하도록 수정 필요
        onWidthChange(value);
        setTimeout(() => onHeightChange(newHeight), 0);
      });
    } else {
      onWidthChange(value);
    }
  };

  const handleHeightChangeWithAspectRatio = async (value: number | null) => {
    if (!onHeightChange || !selectedComponent || value === null) return;

    if (
      lockAspectRatio &&
      selectedComponent.width &&
      selectedComponent.height &&
      onWidthChange
    ) {
      // 🎯 비율 고정 시 그룹으로 처리 - 단일 업데이트로 처리
      await withGroup("크기 변경 (비율 고정)", async () => {
        const aspectRatio = selectedComponent.width / selectedComponent.height;
        const newWidth = Math.round(value * aspectRatio);

        // 🔧 수정된 onHeightChange를 통해 lockAspectRatio 상태 포함하여 업데이트
        // 부모 컴포넌트에서 updateComponent를 직접 호출하도록 수정 필요
        onHeightChange(value);
        setTimeout(() => onWidthChange(newWidth), 0);
      });
    } else {
      onHeightChange(value);
    }
  };

  // 🎯 정렬 핸들러들 - 그룹으로 처리
  const handleAlignLeft = async () => {
    if (onAlignLeft && selectedComponent) {
      await withGroup("왼쪽 정렬", async () => {
        onAlignLeft();
      });
    }
  };

  const handleAlignCenter = async () => {
    if (onAlignCenter && selectedComponent) {
      await withGroup("가로 중앙 정렬", async () => {
        onAlignCenter();
      });
    }
  };

  const handleAlignRight = async () => {
    if (onAlignRight && selectedComponent) {
      await withGroup("오른쪽 정렬", async () => {
        onAlignRight();
      });
    }
  };

  const handleAlignTop = async () => {
    if (onAlignTop && selectedComponent) {
      await withGroup("위쪽 정렬", async () => {
        onAlignTop();
      });
    }
  };

  const handleAlignMiddle = async () => {
    if (onAlignMiddle && selectedComponent) {
      await withGroup("세로 중앙 정렬", async () => {
        onAlignMiddle();
      });
    }
  };

  const handleAlignBottom = async () => {
    if (onAlignBottom && selectedComponent) {
      await withGroup("아래쪽 정렬", async () => {
        onAlignBottom();
      });
    }
  };

  const hasSelection = selectedIds.length > 0;

  // transform 초기화가 필요한지 체크
  const hasTransform =
    selectedComponent &&
    ((selectedComponent.rotation && selectedComponent.rotation !== 0) ||
      selectedComponent.flipX ||
      selectedComponent.flipY);

  const theme = useTheme();
  return (
    <S.ToolbarContainer>
      <S.ToolbarHeader>
        <S.ToolbarTitle>편집 도구</S.ToolbarTitle>
        {hasSelection && (
          <S.SelectionBadge>{selectedIds.length}개 선택</S.SelectionBadge>
        )}
      </S.ToolbarHeader>

      {/* 🎯 Actions 섹션 - 히스토리 기능 연결 */}
      <S.ToolbarSection>
        <S.SectionTitle>Actions</S.SectionTitle>

        {/* 🎯 History - 실제 히스토리 기능 연결 */}
        <S.PropertyGroup>
          <S.PropertyLabel>History</S.PropertyLabel>
          <S.ButtonRow>
            <S.ToolbarButton
              onClick={handleResetToServer}
              title={
                hasHistory
                  ? "서버 상태로 되돌리기"
                  : "히스토리가 없어 서버 복원 불가"
              }
              size="small"
              disabled={!hasHistory} // 🔧 히스토리가 없으면 비활성화
              style={{
                opacity: hasHistory ? 1 : 0.4,
                cursor: hasHistory ? "pointer" : "not-allowed"
              }}
            >
              <RefreshCcw size={14} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleUndo}
              title={
                canUndo
                  ? `실행 취소 (${undoDescription})`
                  : "실행 취소할 수 없음"
              }
              size="small"
              disabled={!canUndo}
              style={{
                opacity: canUndo ? 1 : 0.4,
                cursor: canUndo ? "pointer" : "not-allowed"
              }}
            >
              <Undo size={14} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleRedo}
              title={
                canRedo
                  ? `다시 실행 (${redoDescription})`
                  : "다시 실행할 수 없음"
              }
              size="small"
              disabled={!canRedo}
              style={{
                opacity: canRedo ? 1 : 0.4,
                cursor: canRedo ? "pointer" : "not-allowed"
              }}
            >
              <Redo size={14} />
            </S.ToolbarButton>
          </S.ButtonRow>
        </S.PropertyGroup>
      </S.ToolbarSection>

      {/* Position 섹션 */}
      <S.ToolbarSection>
        <S.SectionTitle>Position</S.SectionTitle>

        {/* 🎯 Alignment - 그룹 처리로 업그레이드 */}
        <S.PropertyGroup>
          <S.PropertyLabel>Alignment</S.PropertyLabel>
          <S.ButtonRow>
            <S.ToolbarButton
              onClick={handleAlignLeft}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={
                selectedComponent?.isLocked
                  ? "잠긴 스티커는 정렬할 수 없습니다"
                  : "왼쪽 정렬"
              }
              size="small"
            >
              <AlignStartVertical size={12} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleAlignCenter}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={
                selectedComponent?.isLocked
                  ? "잠긴 스티커는 정렬할 수 없습니다"
                  : "가로 중앙 정렬"
              }
              size="small"
            >
              <AlignCenterVertical size={12} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleAlignRight}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={
                selectedComponent?.isLocked
                  ? "잠긴 스티커는 정렬할 수 없습니다"
                  : "오른쪽 정렬"
              }
              size="small"
            >
              <AlignEndVertical size={12} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleAlignTop}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={
                selectedComponent?.isLocked
                  ? "잠긴 스티커는 정렬할 수 없습니다"
                  : "위쪽 정렬"
              }
              size="small"
            >
              <AlignStartHorizontal size={12} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleAlignMiddle}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={
                selectedComponent?.isLocked
                  ? "잠긴 스티커는 정렬할 수 없습니다"
                  : "세로 중앙 정렬"
              }
              size="small"
            >
              <AlignCenterHorizontal size={12} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleAlignBottom}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={
                selectedComponent?.isLocked
                  ? "잠긴 스티커는 정렬할 수 없습니다"
                  : "아래쪽 정렬"
              }
              size="small"
            >
              <AlignEndHorizontal size={12} />
            </S.ToolbarButton>
          </S.ButtonRow>
        </S.PropertyGroup>

        {/* Position X, Y */}
        <S.PropertyGroup>
          <S.PropertyLabel>Position</S.PropertyLabel>
          <S.InputRow>
            <S.InputWithLabel>
              <InputNumber
                value={x}
                placeholder={hasSelection ? undefined : "-"}
                onChange={onXChange}
                onPressEnter={e =>
                  onXChange?.(Number((e.target as HTMLInputElement).value))
                }
                disabled={!hasSelection}
                size="small"
                controls={false}
                style={{
                  width: "100%",
                  background: theme.palette.background.bgDark,
                  border: "none"
                }}
                prefix={<S.InputPrefix>X</S.InputPrefix>}
              />
            </S.InputWithLabel>
            <S.InputWithLabel>
              <InputNumber
                value={y}
                placeholder={hasSelection ? undefined : "-"}
                onChange={onYChange}
                onPressEnter={e =>
                  onYChange?.(Number((e.target as HTMLInputElement).value))
                }
                disabled={!hasSelection}
                size="small"
                controls={false}
                style={{
                  width: "100%",
                  background: theme.palette.background.bgDark,
                  border: "none"
                }}
                prefix={<S.InputPrefix>Y</S.InputPrefix>}
              />
            </S.InputWithLabel>
          </S.InputRow>
        </S.PropertyGroup>

        {/* width, height - 🎯 그룹 처리 업그레이드 */}
        <S.PropertyGroup>
          <S.PropertyLabel>Dimensions</S.PropertyLabel>
          <S.InputRow>
            <S.InputWithLabel>
              <InputNumber
                value={width}
                placeholder={hasSelection ? undefined : "-"}
                onChange={handleWidthChangeWithAspectRatio} // 🎯 그룹 처리 버전
                onPressEnter={e =>
                  handleWidthChangeWithAspectRatio(
                    Number((e.target as HTMLInputElement).value)
                  )
                }
                disabled={!hasSelection}
                size="small"
                min={10}
                max={1000}
                controls={false}
                style={{
                  width: "100%",
                  background: theme.palette.background.bgDark,
                  border: "none"
                }}
                prefix={<S.InputPrefix>W</S.InputPrefix>}
                suffix={<S.InputPrefix>px</S.InputPrefix>}
              />
            </S.InputWithLabel>
            <S.InputWithLabel>
              <InputNumber
                value={height}
                placeholder={hasSelection ? undefined : "-"}
                onChange={handleHeightChangeWithAspectRatio} // 🎯 그룹 처리 버전
                onPressEnter={e =>
                  handleHeightChangeWithAspectRatio(
                    Number((e.target as HTMLInputElement).value)
                  )
                }
                disabled={!hasSelection}
                size="small"
                min={10}
                max={1000}
                controls={false}
                style={{
                  width: "100%",
                  background: theme.palette.background.bgDark,
                  border: "none"
                }}
                prefix={<S.InputPrefix>H</S.InputPrefix>}
                suffix={<S.InputPrefix>px</S.InputPrefix>}
              />
            </S.InputWithLabel>
            <S.ToolbarButton
              onClick={handleToggleLockAspectRatio}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={lockAspectRatio ? "비율 고정 해제" : "비율 고정"}
              size="small"
              active={lockAspectRatio}
            >
              {lockAspectRatio ? <Link2 size={14} /> : <Unlink2 size={14} />}
            </S.ToolbarButton>
          </S.InputRow>
        </S.PropertyGroup>

        {/* Rotation - 🎯 그룹 처리 업그레이드 */}
        <S.PropertyGroup>
          <S.PropertyLabel>Rotation</S.PropertyLabel>
          <S.InputRow>
            <S.InputWithLabel>
              <InputNumber
                value={rotation}
                placeholder={hasSelection ? undefined : "-"}
                onChange={onRotationChange}
                onPressEnter={e =>
                  onRotationChange?.(
                    Number((e.target as HTMLInputElement).value)
                  )
                }
                disabled={!hasSelection}
                size="small"
                min={0}
                max={360}
                controls={false}
                style={{
                  width: "100%",
                  background: theme.palette.background.bgDark,
                  border: "none"
                }}
                prefix={
                  <S.InputPrefix>
                    <RefreshCw size={14} />
                  </S.InputPrefix>
                }
                suffix={<S.InputPrefix>°</S.InputPrefix>}
              />
            </S.InputWithLabel>
            <S.ToolbarButton
              onClick={handleFlipX}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={flipX ? "좌우반전 해제" : "좌우반전"}
              size="small"
              active={flipX}
            >
              <FlipHorizontal2 size={14} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleFlipY}
              disabled={!hasSelection || selectedComponent?.isLocked}
              title={flipY ? "상하반전 해제" : "상하반전"}
              size="small"
              active={flipY}
            >
              <FlipVertical2 size={14} />
            </S.ToolbarButton>
            <S.ToolbarButton
              onClick={handleResetTransform} // 🎯 그룹 처리 버전
              disabled={
                !hasSelection || selectedComponent?.isLocked || !hasTransform
              }
              title="회전/반전 초기화"
              size="small"
            >
              <RefreshCw size={14} />
            </S.ToolbarButton>
          </S.InputRow>
        </S.PropertyGroup>
      </S.ToolbarSection>

      {/* Appearance 섹션 */}
      <S.ToolbarSection>
        <S.SectionTitle>Appearance</S.SectionTitle>

        {/* Opacity */}
        <S.PropertyGroup>
          <S.PropertyLabel>Opacity</S.PropertyLabel>
          <S.InputRow>
            <S.InputWithLabel>
              <InputNumber
                value={opacity}
                placeholder={hasSelection ? undefined : "-"}
                onChange={onOpacityChange}
                onPressEnter={e =>
                  onOpacityChange?.(
                    Number((e.target as HTMLInputElement).value)
                  )
                }
                disabled={!hasSelection}
                size="small"
                min={0}
                max={100}
                controls={false}
                style={{
                  width: "100%",
                  background: theme.palette.background.bgDark,
                  border: "none"
                }}
                prefix={
                  <S.InputPrefix>
                    <Eye size={14} />
                  </S.InputPrefix>
                }
                suffix={<S.InputPrefix>%</S.InputPrefix>}
              />
            </S.InputWithLabel>
          </S.InputRow>
        </S.PropertyGroup>
      </S.ToolbarSection>

      {/* 선택된 컴포넌트 정보 표시 */}
      {hasSelection && selectedComponent && (
        <S.ToolbarSection>
          <S.SectionTitle>선택된 스티커 정보</S.SectionTitle>
          <S.PropertyGroup>
            <S.PropertyLabel>ID: {selectedComponent.id}</S.PropertyLabel>
            <S.PropertyLabel>
              크기: {Math.round(selectedComponent.width)} ×{" "}
              {Math.round(selectedComponent.height)}px
            </S.PropertyLabel>
            <S.PropertyLabel>
              레이어: {selectedComponent.zIndex}
            </S.PropertyLabel>
            <S.PropertyLabel>
              상태: {selectedComponent.isVisible ? "표시" : "숨김"} /{" "}
              {selectedComponent.isLocked ? "잠김" : "잠금해제"}
            </S.PropertyLabel>
            <S.PropertyLabel>
              반전: {selectedComponent.flipX ? "좌우반전" : "정상"} /{" "}
              {selectedComponent.flipY ? "상하반전" : "정상"}
            </S.PropertyLabel>
            <S.PropertyLabel>
              비율: {selectedComponent.lockAspectRatio ? "고정" : "자유"}
            </S.PropertyLabel>
          </S.PropertyGroup>
        </S.ToolbarSection>
      )}
    </S.ToolbarContainer>
  );
};

export default ImageToolbar;
