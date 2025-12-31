// components/imageToolbarStyle.ts
import styled from "@emotion/styled";

export const ToolbarContainer = styled.div`
  width: 240px;
  background: ${({ theme }) => theme.palette.background.card};
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const ToolbarHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border.card};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ToolbarTitle = styled.h3`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.textMain};
  margin: 0;
`;

export const SelectionBadge = styled.span`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.palette.text.textSub};
  background: ${({ theme }) => theme.palette.background.bgDark};
  padding: 3px 8px;
  border-radius: 12px;
`;

export const ToolbarSection = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border.card};

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    padding: 10px 12px;
  }
`;

export const SectionTitle = styled.h4`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.textMain};
  margin: 0 0 12px 0;
`;

export const PropertyGroup = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const PropertyLabel = styled.label`
  display: block;
  font-size: 1.1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.textSub};
  margin-bottom: 6px;
`;

export const AlignmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 4px;
  background: ${({ theme }) => theme.palette.background.bgOpaque};
  padding: 4px;
  border-radius: 6px;
`;

export const InputRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

export const InputWithLabel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  /* background: ${({ theme }) => theme.palette.background.bgOpaque}; */
  border-radius: 4px;
  /* border: 1px solid ${({ theme }) => theme.palette.border.card}; */
  overflow: hidden;

  &:focus-within {
    border-color: ${({ theme }) => theme.designSet.home.primary || "#1890ff"};
  }
`;

export const InputPrefix = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 1px;
  width: 100%;
  font-size: 1.1rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.textSub};

`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

export const ToolbarButton = styled.button<{ 
  active?: boolean; 
  size?: 'small' | 'medium' 
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ size }) => size === 'small' ? '28px' : '32px'};
  height: ${({ size }) => size === 'small' ? '28px' : '32px'};
  border: none;
  border-radius: 4px;
  background: ${({ theme, active }) =>
    active ? theme.palette.background.bgDark : 'transparent'};
  color: ${({ theme }) => theme.palette.text.textMain};
  cursor: pointer;
  transition: all 0.2s ease;

  i, svg {
    font-size: ${({ size }) => size === 'small' ? '12px' : '14px'};
    line-height: 1;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.palette.background.bgDark};
  }

  &:active:not(:disabled) {
    background: ${({ theme }) => theme.palette.background.bgOpaque};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.palette.border.card};
  }
`;

// Antd InputNumber 커스텀 스타일 오버라이드
export const StyledInputNumber = styled.div`
  .ant-input-number {
    width: 100%;
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0 6px;
    height: 24px;
    font-size: 1.1rem;

    &:hover, &:focus, &.ant-input-number-focused {
      border: none;
      box-shadow: none;
    }

    .ant-input-number-input {
      color: ${({ theme }) => theme.palette.text.textMain};
      background: transparent;
      padding: 0;
      height: 22px;
    }

    .ant-input-number-handler-wrap {
      display: none;
    }
  }
`;