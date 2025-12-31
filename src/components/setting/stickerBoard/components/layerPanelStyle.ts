// components/layerPanelStyle.ts
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

// ============= 필수 애니메이션만 정의 =============
const fadeInScale = keyframes`
  0% { 
    opacity: 0; 
    transform: scale(0.95); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1); 
  }
`;

const pulse = keyframes`
  0%, 100% { 
    transform: scale(1); 
  }
  50% { 
    transform: scale(1.05); 
  }
`;

// ============= 기존 스타일들 =============
export const LayerPanelContainer = styled.div`
  min-height: 300px;
  max-height: 500px;
  background: ${({ theme }) => theme.palette.background.card};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const LayerPanelHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border.card};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const LayerTitle = styled.h3`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.textMain};
  margin: 0;
`;

export const LayerCount = styled.span`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.palette.text.textSub};
  background: ${({ theme }) => theme.palette.background.bgDark};
  padding: 4px 8px;
  border-radius: 12px;
`;

export const LayerList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  scrollbar-color: ${({ theme }) =>
    `${theme.palette.text.textSub} transparent`};
  scrollbar-width: thin;
`;

export const LayerBox = styled.div<{
  isVisible?: boolean;
  isSelected?: boolean;
}>`
  margin-bottom: 8px;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0.7)};
  transition: all 0.2s ease;

  /* 선택된 상태일 때 강조 */
  ${({ isSelected }) =>
    isSelected &&
    `
    transform: scale(1.02);
    z-index: 10;
  `}
`;

export const LayerItem = styled.div<{ isSelected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: ${({ theme, isSelected }) =>
    isSelected
      ? theme.palette.background.bgDark
      : theme.palette.background.card};
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  border-radius: 8px;
  border: ${({ theme, isSelected }) =>
    `${theme.designSet.card.borderWidth}px ${
      theme.designSet.card.borderStyle
    } ${isSelected ? "#1890ff" : theme.palette.border.card}`};
  transition: all 0.2s ease;
  cursor: pointer;

  /* 선택된 상태 스타일 */
  ${({ isSelected, theme }) =>
    isSelected &&
    `
    background: linear-gradient(135deg, 
      rgba(24, 144, 255, 0.1) 0%, 
      rgba(24, 144, 255, 0.05) 100%
    );
    border-color: #1890ff;
    box-shadow: 
      0 0 0 1px rgba(24, 144, 255, 0.2),
      0 4px 12px rgba(24, 144, 255, 0.15);
  `}

  &:hover {
    ${({ isSelected, theme }) =>
      !isSelected &&
      `
      border-color: ${theme.palette.border.card};
      background: ${theme.palette.background.bgDark};
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `}
  }

  &:active {
    transform: ${({ isSelected }) =>
      isSelected ? "scale(0.98)" : "translateY(0)"};
  }
`;

export const LayerPreview = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: ${({ theme }) => theme.palette.background.bgDark};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const LayerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  transition: opacity 0.2s ease;
`;

export const LayerInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const LayerName = styled.div<{ isVisible?: boolean }>`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${({ theme, isVisible }) =>
    isVisible ? theme.palette.text.textMain : theme.palette.text.textSub};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;

  ${({ isVisible }) =>
    !isVisible &&
    `
    text-decoration: line-through;
    font-style: italic;
  `}
`;

export const LayerDetails = styled.div`
  font-size: 1rem;
  color: ${({ theme }) => theme.palette.text.textSub};
  line-height: 1.3;
`;

export const LayerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

export const LayerOrder = styled.div<{ isSelected?: boolean }>`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme, isSelected }) =>
    isSelected ? "#1890ff" : theme.palette.text.textSub};
  background: ${({ theme, isSelected }) =>
    isSelected ? "rgba(24, 144, 255, 0.1)" : theme.palette.background.bgDark};
  border: ${({ isSelected }) =>
    isSelected ? "1px solid rgba(24, 144, 255, 0.3)" : "none"};
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 28px;
  text-align: center;
  transition: all 0.2s ease;
`;

// ============= 새로운 컨트롤 버튼 스타일 =============
export const ControlButton = styled.button<{ active?: boolean }>`
  background: ${({ theme, active }) =>
    active ? theme.palette.background.bgDark : "transparent"};
  border: 1px solid
    ${({ theme, active }) =>
      active ? theme.palette.border.card : "transparent"};
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 28px;
  height: 28px;

  /* 아이콘 스타일 */
  i {
    font-size: 1.2rem;
    line-height: 1;
    color: ${({ theme, active }) =>
      active ? theme.palette.text.textMain : theme.palette.text.textSub};
    transition: color 0.2s ease;
  }

  /* 호버 효과 */
  &:hover {
    background: ${({ theme }) => theme.palette.background.bgDark};
    border-color: ${({ theme }) => theme.palette.border.card};

    i {
      color: ${({ theme }) => theme.palette.text.textMain};
    }
  }

  /* 클릭 효과 */
  &:active {
    transform: scale(0.95);
  }

  /* 포커스 효과 */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.palette.border.card};
  }

  /* 활성 상태일 때 특별한 효과 */
  ${({ active }) =>
    active &&
    `
    animation: ${pulse} 0.3s ease-in-out;
  `}
`;

// ============= 업데이트된 DeleteButton 스타일 =============
export const DeleteButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  width: 28px;
  height: 28px;

  /* 아이콘 스타일 */
  i {
    font-size: 1.2rem;
    line-height: 1;
    color: ${({ theme }) => theme.palette.text.textSub};
    transition: color 0.2s ease;
  }

  /* 호버 효과 */
  &:hover {
    background: rgba(255, 59, 48, 0.1);

    i {
      color: #ff3b30;
    }
  }

  /* 클릭 효과 */
  &:active {
    transform: scale(0.95);
  }

  /* 포커스 효과 */
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.3);
  }
`;

// ============= 기타 스타일들 =============
export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  height: 200px;
`;

export const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.6;
`;

export const EmptyText = styled.div`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.textMain};
  margin-bottom: 4px;
`;

export const EmptySubText = styled.div`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.palette.text.textSub};
`;

export const LayerPanelFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${({ theme }) => theme.palette.border.card};
  display: flex;
  gap: 8px;
`;

export const FooterButton = styled.button<{
  variant?: "danger" | "primary" | "secondary";
}>`
  flex: 1;
  padding: 8px 12px;
  font-size: 1.2rem;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  background: ${({ theme, variant }) => {
    switch (variant) {
      case "danger":
        return "rgba(255, 59, 48, 0.1)";
      case "primary":
        return "rgba(24, 144, 255, 0.1)";
      case "secondary":
        return theme.palette.background.bgOpaque;
      default:
        return theme.palette.background.bgDark;
    }
  }};

  color: ${({ theme, variant }) => {
    switch (variant) {
      case "danger":
        return "#ff3b30";
      case "primary":
        return "#1890ff";
      case "secondary":
        return theme.palette.text.textSub;
      default:
        return theme.palette.text.textMain;
    }
  }};

  border: ${({ theme, variant }) =>
    variant === "secondary"
      ? `1px solid ${theme.palette.border.card}`
      : "none"};

  &:hover {
    background: ${({ theme, variant }) => {
      switch (variant) {
        case "danger":
          return "rgba(255, 59, 48, 0.2)";
        case "primary":
          return "rgba(24, 144, 255, 0.2)";
        case "secondary":
          return theme.palette.background.bgDark;
        default:
          return theme.palette.background.bgOpaque;
      }
    }};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px
      ${({ variant }) => {
        switch (variant) {
          case "danger":
            return "rgba(255, 59, 48, 0.3)";
          case "primary":
            return "rgba(24, 144, 255, 0.3)";
          case "secondary":
            return "rgba(108, 117, 125, 0.3)";
          default:
            return "rgba(0, 123, 255, 0.3)";
        }
      }};
  }
`;
