import styled from "@emotion/styled";

export const Wrapper = styled.div``;
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
export const MenuAllowIcon = styled.i`
  display: block;
  color: ${({ theme }) => theme.palette.text.textSub};
  font-size: 1.4rem;
  width: 14px;
  height: 14px;
`;
export const InfoList = styled.li`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.palette.text.textSub};
  margin-top: 4px;
`;
export const CustomWrap = styled.div``;
export const AddBlockWrap = styled.div`
  margin-top: 30px;
`;
export const AddBlockTitle = styled.p`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.textMain};
`;
export const AddBlockBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
`;
export const Container = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 40px;
  margin-top: 30px;
`;
export const BlockWrap = styled.div`
  width: 75%;
  aspect-ratio: 5 / 4;
  background: ${({ theme }) => theme.palette.background.card};
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  border-radius: 10px;
`;
export const WidgetWrap = styled.div`
  width: 25%;
`;
export const WidgetTitle = styled.p`
  font-size: 1.8rem;
  font-weight: 600;
`;
export const WidgetBox = styled.div`
  display: grid;
  grid-template-columns: 1fr;
`;
export const WidgetList = styled.div`
  list-style: none;
  margin-top: 16px;
`;
export const WidgetItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
export const WidgetName = styled.p`
  font-size: 1.6rem;
`;
export const Widget = styled.div`
  word-break: keep-all;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-weight: 500;
  cursor: grab;
`;
export const ThemeButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: ${({ theme }) => `1px solid ${theme.palette.border.borderLight}`};
  background: ${({ theme }) => theme.palette.background.bg1};
  cursor: pointer;
`;
export const ThemeButtonIcon = styled.i`
  font-size: 1.6rem;
  line-height: 1.6rem;
  height: 1.6rem;
  color: ${({ theme }) => theme.palette.text.textSub};
`;
