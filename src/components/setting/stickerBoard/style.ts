// style.ts (레이아웃 스타일 추가)
import styled from "@emotion/styled";

export const Wrapper = styled.div``;

// 이미지 에디터 전체 컨테이너 (캔버스 + 레이어 패널)
export const ImageEditorContainer = styled.div`
  /* display: flex; */
  gap: 20px;
  margin-top: 20px;
  align-items: flex-start;
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

// 캔버스 섹션 (기존 편집 영역)
export const CanvasSection = styled.div`
  flex: 1;
  min-width: 0; /* flexbox에서 줄어들 수 있도록 */
`;

// 레이어 패널 섹션
export const LayerSection = styled.div`
  flex-shrink: 0;
  width: 240px;
  position: absolute;
  top: 12px;
  right: calc(100% + 12px);

  @media (max-width: 768px) {
    width: 100%;
  }
`;

// 툴바 섹션 (오른쪽으로 이동)
export const ToolbarSection = styled.div`
  flex-shrink: 0;
  width: 240px;
  position: absolute;
  top: 12px;
  left: calc(100% + 12px); /* 오른쪽으로 이동 */

  @media (max-width: 768px) {
    width: 100%;
    position: static;
  }
`;

export const EditWrap = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(12, 1fr);
  justify-content: center;
  aspect-ratio: 5 / 4;
  padding: 8px;

  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  background-color: ${({ theme }) => theme.palette.background.card};
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
`;

export const Canvas = styled.div<{
  ratio: {
    w: number;
    h: number;
  };
}>`
  position: relative;
  overflow: hidden;
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  background-color: ${({ theme }) => theme.palette.background.widget};
  border: ${({ theme }) =>
    `${theme.designSet.widget.borderWidth}px ${theme.designSet.widget.borderStyle} ${theme.palette.border.widget}`};
  background-clip: padding-box;

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

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    margin: 20px 0 16px 0;
  }
`;

export const ToggleBox = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

export const Title = styled.p`
  font-size: 1.6rem;
  font-weight: 600;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

export const FlexBox = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
  margin-top: 16px;

  & button:last-of-type {
    margin-left: 8px;
  }

  @media (max-width: 768px) {
    justify-content: center;
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
  margin-top: 20px;
`;
