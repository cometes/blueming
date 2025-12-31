import styled from "@emotion/styled";

export const Wrapper = styled.div``;
export const EditWrap = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(12, 1fr);
  justify-content: center;
  margin-top: 20px;
  aspect-ratio: 5 / 4;
`;
export const Canvas = styled.div<{
  ratio: {
    w: number;
    h: number;
  };
}>`
  position: relative;
  overflow: hidden;
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  background-color: ${({ theme }) => theme.palette.background.card};
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};

  /* 그리드 안에서 ratio.w 만큼 열, ratio.h 만큼 행 차지 */
  grid-column: ${props => {
    const totalColumns = 12; // 전체 열 개수
    const span = props.ratio.w || 1; // 차지할 칸 수 (기본값 6)
    const start = Math.floor((totalColumns - span) / 2) + 1; // 시작 지점 계산
    return `${start} / span ${span}`;
  }};
  grid-row: span ${props => props.ratio.h || 1}; // 기본 1 행
  max-width: 768px;
  max-height: 700px;
  width: 100%;
  min-height: 64px;
`;
export const CaptureArea = styled.div`
  width: 100%;
  height: 100%;
`;
export const ImageEditBox = styled.div<{
  ratio?: { w: number; h: number };
}>`
  position: absolute;
  width: 100%;
  height: 100%;
`;

export const EditorWrap = styled.div<{
  isTextTop?: boolean;
  ratio?: { w: number; h: number };
}>`
  width: 100%;
  height: 100%;
  pointer-events: ${props => (props.isTextTop ? "none" : "")};
  position: relative;
  z-index: ${props => (props.isTextTop ? 99 : 0)};
  overflow: auto;
  padding: 20px;
`;
export const ToggleWrap = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 30px 0 20px 0;
`;
export const ToggleBox = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;
export const Title = styled.p`
  font-size: 1.6rem;
  font-weight: 600;
`;
export const FlexBox = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
  margin-top: 16px;

  & button:last-of-type {
    margin-left: 8px;
  }
`;

export const InfoWrap = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.palette.background.card};
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  padding: 24px;
  border-radius: 6px;
  margin-top: 20px;
`;
export const InfoTitle = styled.p`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.textMain};
`;
export const InfoBox = styled.ul`
  margin-top: 10px;
`;
export const InfoList = styled.li`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.palette.text.textSub};
  margin-top: 4px;
`;
export const ToolbarBox = styled.div`
  margin-bottom: 16px;
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  background-color: ${({ theme }) => theme.palette.background.card};
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  padding: 12px;
`;

export const ImageInsertBox = styled.div`
  max-width: 240px;
`;
export const ButtonBox = styled.div`
  display: flex;
  justify-content: center;
`;
