import styled from "@emotion/styled";

export const Wrapper = styled.div`
  width: 1200px;
  /* height: calc(100vh - 50px); */
 
  margin: 0 auto;
   margin-top: 50px;
  padding: 24px 0;
`;

export const Aside = styled.div<{ isExpanded: boolean }>`
  width: 100%;
  max-width: ${({ isExpanded }) => (isExpanded ? "240px" : "50px")};
  padding: 24px;
  cursor: ${({ isExpanded }) => (isExpanded ? "default" : "pointer")};

  border-right: 1px solid ${({ theme }) => theme.palette.border.card};
  overflow: hidden;
  overflow-y: ${({ isExpanded }) => (isExpanded ? "scroll" : "hidden")};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 3px;
    transition: background-color 0.3s ease;
  }

  &:hover {
    &::-webkit-scrollbar-thumb {
      background-color: ${({ theme }) => theme.palette.border.widget};
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background-color: ${({ theme }) => theme.palette.border.card};
    }
  }

  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  
  &:hover {
    scrollbar-color: ${({ theme }) =>
      `${theme.palette.border.widget} transparent`};
  }
`;

export const CategoryWrap = styled.div<{ isExpanded: boolean }>`
  opacity: ${({ isExpanded }) => (isExpanded ? 1 : 0)};
  visibility: ${({ isExpanded }) => (isExpanded ? "visible" : "hidden")};
  transition: opacity 0.3s ease 0.1s, visibility 0.3s ease 0.1s;
`;

export const CategoryBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const Category = styled.p`
  color: ${({ theme }) => theme.palette.text.textSub};
  font-weight: 600;
  font-size: 1.1rem;
  white-space: nowrap;
`;

export const CategoryTitle = styled.p<{ active?: boolean }>`
  cursor: pointer;
  color: ${({ theme, active }) =>
    active ? theme.designSet.home.primary : theme.palette.text.textMain};
  font-weight: ${({ active }) => (active ? 600 : 400)};
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background-color: ${({ theme }) => theme.palette.background.card};
    color: ${({ theme }) => theme.designSet.home.secondary};
  }
`;

export const Container = styled.div`
  display: flex;
  background: ${({ theme }) => theme.palette.background.card};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  height: calc(100vh - 98px);
  opacity: 0;
  animation: fadeIn 0.3s ease-in-out forwards;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export const Content = styled.div`
  /* max-width: 768px; */
  width: 100%;
  flex-shrink: unset;
`;

export const ContentTop = styled.div`
  padding: 14px 20px;
  height: 80px;
  border-bottom: 1px solid ${({ theme }) => theme.palette.border.card};
`;

export const ContentTopTitle = styled.p`
  font-size: 2.4rem;
  color: ${({ theme }) => theme.palette.text.textMain};
  font-weight: 700;
`;

export const ContentTopDesc = styled.p`
  color: ${({ theme }) => theme.palette.text.textSub};
  margin-top: 8px;
  font-size: 1.4rem;
`;

export const ContentBottom = styled.div`
  padding: 20px;
  height: calc(100% - 80px);
  overflow-y: scroll;
  scrollbar-color: ${({ theme }) =>
    `${theme.palette.border.widget} transparent`};
  scrollbar-width: thin;
`;

export const UnitWrap = styled.section`
  max-width: 768px;
  margin: 0 auto;
`