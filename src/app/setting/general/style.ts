import styled from "@emotion/styled";
import { motion } from "framer-motion";

export const Wrapper = styled.div`
  margin-top: 60px;
`;
export const TabWrap = styled.nav`
  width: fit-content;
  margin: 0 auto;
`;
export const TabBox = styled.div`
  display: flex;
  gap: 30px;
`;
export const TabItem = styled.button<{
  active: boolean;
}>`
  display: block;
  word-break: keep-all;
  padding: 10px 0;
  background: none;
  border: none;
  font-size: 1.6rem;
  font-weight: ${props => (props.active ? "bold" : "")};
  color: ${({ theme, active }) =>
    active ? theme.palette.text.textMain : theme.palette.text.textSubLight};
  cursor: pointer;
`;
export const TabIndicatorBox = styled(motion.div)`
  position: relative;
  width: 100%;
  height: 2px;
  background-color: ${({ theme }) => theme.palette.border.card};
  border-radius: 10px;
  overflow: hidden;
`;
export const TabIndicator = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  height: 100%;
  border-radius: 10px;
  background-color: ${({ theme }) => theme.palette.border.cardActive};
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
  overflow-y: scroll;
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  background-color: ${({ theme }) => theme.palette.background.widget};
  border: ${({ theme }) =>
    `${theme.designSet.widget.borderWidth}px ${theme.designSet.widget.borderStyle} ${theme.palette.border.widget}`};
  background-clip: padding-box;
  padding: 14px;

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

  scrollbar-color: ${({ theme }) =>
    `${theme.palette.border.widget} transparent`};
  scrollbar-width: thin;
`;
export const Section = styled.section``;
export const SectionWrap = styled.div`
  margin-top: 24px;
`;
export const SectionTitle = styled.h2`
  font-weight: 600;
  font-size: 2rem;
`;
export const SectionSubtitle = styled.p`
  color: ${({ theme }) => theme.palette.text.textSubLight};
  margin-top: 10px;
`;
export const SectionBox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 18px;
`;
export const SectionTextBox = styled.div`
  width: 220px;
  padding-right: 20px;
  position: relative;
`;
export const SectionCategory = styled.p`
  font-size: 1.6rem;
  font-weight: 500;
  color: ${({ theme }) => theme.palette.text.textSub};
`;
export const SectionDesc = styled.span`
  font-size: 1.4rem;
  line-height: 1.6rem;
  color: ${({ theme }) => theme.palette.text.textSubLight};
  margin-top: 12px;
  display: block;
  word-break: keep-all;
`;
export const SectionInputBox = styled.div`
  position: relative;
  width: calc(100% - 220px);
  display: flex;
  align-items: center;
`;
export const ColorPickerBox = styled.div`
  display: flex;
  align-items: center;

  &:last-of-type {
    margin-left: 12px;
  }
`;
export const SectionInput = styled.input``;
export const SectionImageBox = styled.div`
  width: 300px;
  aspect-ratio: 16 / 7;
  background: ${({ theme }) => theme.palette.background.card};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  border-radius: ${({ theme }) => `${theme.designSet.card.borderRadius}px`};
  overflow: hidden;
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
`;
export const SectionImageItem = styled.div`
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
export const SectionImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;
export const UploadIcon = styled.i`
  font-size: 24px;
  color: ${({ theme }) => theme.palette.text.textSubLight};
  margin-bottom: 8px;
`;
export const UploadText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.palette.text.textSubLight};
`;
export const SectionButtonBox = styled.div`
  display: flex;
  margin-left: 24px;
  & button:last-of-type {
    margin-left: 8px;
  }
`;
export const SectionCheckWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: calc(100% - 220px);
`;
export const SectionCheckBox = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 20px;
  background: ${({ theme }) => theme.palette.background.bg2};
  border: ${({ theme }) => `1px solid ${theme.palette.border.borderLight}`};
  border-radius: 6px;
`;
export const SectionCheckText = styled.span`
  color: ${({ theme }) => theme.palette.text.textSubLight};
  margin-left: 6px;
`;
export const SectionSubmitBox = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 60px;
  margin-bottom: 40px;
  & button:last-of-type {
    margin-left: 8px;
  }
`;
export const FontSampleWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  border-radius: 8px;
  border: ${({ theme }) => `2px solid ${theme.palette.border.card}`};
  /* background-color: ${({ theme }) => theme.palette.background.card}; */
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  margin-top: 18px;
`;
export const FontSampleTitle = styled.h1<{
  font: string;
}>`
  font-family: ${props => (props.font ? props.font : "Pretendard")};
  color: ${props => props.color};
`;
export const FontSampleContent = styled.p<{
  font: string;
}>`
  font-size: 1.6rem;
  font-family: ${props => (props.font ? props.font : "Pretendard")};
  color: ${props => props.color};
`;
export const FontSampleDesc = styled.span<{
  font: string;
}>`
  font-size: 1.4rem;
  color: ${props => props.color};
`;
export const ColorText = styled.p<{
  color: string;
}>`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${props => props.color};
  margin-left: 12px;
  text-shadow: ${({ theme }) =>
    `1px 1px 0 ${theme.palette.border.borderHover}`};
`;
export const MenuAddWrap = styled.div`
  padding: 40px 0;
`;
export const MenuAddBox = styled.div`
  display: flex;
  gap: 8px;
`;
export const MenuAddText = styled.p`
  font-weight: 600;
  margin-right: 16px;
`;
export const MenuWrap = styled.div`
  display: flex;
  background: ${({ theme }) => theme.palette.background.card};
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;
export const MenuCategory = styled.p`
  font-weight: 600;
  font-size: 1.6rem;
  width: 200px;
  padding-right: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${({ theme }) => theme.palette.text.textMain};

  &::before {
    content: "||";
    color: ${({ theme }) => theme.palette.text.textSub};
    display: block;
    margin-right: 16px;
  }
`;
export const MenuBox = styled.div`
  display: flex;
  width: calc(100% - 200px);
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;
export const MenuInfoWrap = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 60%;
`;
export const MenuInfoBox = styled.div``;
export const MenuInfoDesc = styled.span`
  font-size: 1.4rem;
  cursor: pointer;
  color: ${({ theme }) => theme.palette.text.textSubLight};
  display: flex;
  align-items: center;
  margin-top: 8px;
  width: fit-content;

  &::before {
    content: "+";
    margin-right: 6px;
    font-size: 1.4rem;
    line-height: 1.4rem;
    padding: 2px 5px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #dee2e6;
  }
`;
export const MenuImageWrap = styled.div`
  position: relative;
  height: 0;
  visibility: hidden;
  opacity: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.palette.background.card};
  border: ${({ theme }) => `1px solid ${theme.palette.border.card}`};
  border-radius: 8px;
  transition: all 0.3s ease-in-out;

  &.active {
    margin-top: 8px;
    height: 56px;
    visibility: visible;
    opacity: 1;
  }

  &.slide {
    margin-top: 8px;
    aspect-ratio: 3 / 1;
    height: auto;
    visibility: visible;
    opacity: 1;
  }
`;
export const ImageRemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #222;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
`;
export const ImageRemoveIcon = styled.i`
  display: block;
  color: ${({ theme }) => theme.palette.text.textLight};
  font-size: 1.2rem;
  width: 12px;
  height: 12px;
`;
export const MenuAllowWrap = styled.div`
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;
export const MenuAllowBox = styled.div`
  display: flex;
  align-items: center;
`;
export const MenuAllowIcon = styled.i`
  display: block;
  color: ${({ theme }) => theme.palette.text.textSub};
  font-size: 1.4rem;
  width: 14px;
  height: 14px;
`;
export const MenuAllowDesc = styled.div`
  margin-left: 6px;
  color: ${({ theme }) => theme.palette.text.textSub};
`;
export const MenuSubmitBox = styled.div`
  width: 15%;

  &.slide {
    width: fit-content;
  }
`;
export const MenuInputBox = styled.div`
  min-width: 200px;
  position: relative;
`;
export const Error = styled.p`
  position: absolute;
  left: 3px;
  top: 100%;
  color: ${({ theme }) => theme.palette.warning.red};
  font-size: 1.4rem;
  margin-top: 4px;
`;
export const MenuSelectBox = styled.div`
  position: relative;
  width: 100%;
`;
export const MenuSubmitButtonBox = styled.div`
  margin-left: 10px;
`;
export const ThemeInfoWrap = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.palette.background.card};
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  padding: 24px;
  border-radius: 6px;
  margin-top: 30px;
`;
export const ThemeInfoTitle = styled.p`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.textMain};
`;
export const ThemeInfoBox = styled.ul`
  margin-top: 10px;
`;
export const ThemeInfoList = styled.li`
  color: ${({ theme }) => theme.palette.text.textSub};
  margin-top: 4px;
`;

export const ThemeInfoItem = styled.span`
  font-size: 1.6rem;
  color: ${({ theme }) => theme.palette.text.textSub};
`;
export const ThemeGridWrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin: 24px 0 60px 0;
`;
export const ThemeGridBox = styled.div`
  background: ${({ theme }) => theme.palette.background.card};
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  border: ${({ theme }) =>
    `${theme.designSet.card.borderWidth}px ${theme.designSet.card.borderStyle} ${theme.palette.border.card}`};
  padding: 16px;
  border-radius: 6px;
`;
export const ThemeTitle = styled.p`
  font-size: 2rem;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.text.textMain};
`;
export const ThemeDate = styled.span`
  color: ${({ theme }) => theme.palette.text.textSub};
  margin-top: 10px;
  display: block;
`;
export const ThemeThumbnail = styled.div<{
  bgColor?: string;
  bgImage?: string;
}>`
  width: 100%;
  aspect-ratio: 4.5 / 3;
  background: ${({ bgColor }) => bgColor || "#ccc"};
  ${({ bgImage }) =>
    bgImage
      ? `background-image: url(${bgImage}); background-size: cover; background-position: center;`
      : ""};
  margin-top: 10px;
  border-radius: 3px;
`;
export const ThemeButtonBox = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
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
export const SlideAdd = styled.div`
  display: flex;
  justify-content: end;
`;
export const SlideWrap = styled.div`
  margin-top: 24px;
`;
export const SlideBox = styled.div``;
export const SlideItem = styled.div``;
export const SlideImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: 50% 50%;
`;
export const WidgetPreviewWrap = styled.div`
  /* background-color: #fff; */
  backdrop-filter: ${({ theme }) => `blur(${theme.designSet.card.blur}px)`};
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  border-radius: 8px;
  border: ${({ theme }) => `2px solid ${theme.palette.border.card}`};
  margin-top: 18px;
`;
export const WidgetLorem = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;
export const WidgetPreviewBox = styled.div<{
  preset: {
    borderStyle: string;
    borderRadius: number;
    background: string;
    borderColor: string;
    blur: number;
    translateY?: number;
    borderWidth: number;
  };
}>`
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  aspect-ratio: 3 / 1;
  border-style: ${props => props.preset.borderStyle};
  border-width: ${props => `${props.preset.borderWidth}px`};
  border-radius: ${props => `${props.preset.borderRadius}px`};
  border-color: ${props => props.preset.borderColor};
  background-color: ${props => props.preset.background};
  backdrop-filter: ${props => `blur(${props.preset.blur}px)`};
  background-clip: padding-box;
`;
export const WidgetPreviewText = styled.p<{
  preset: string;
}>`
  color: ${({ theme, preset }) =>
    preset == "다크"
      ? theme.palette.text.textLight
      : theme.palette.text.textSubLight};
  font-weight: 500;
`;
export const CardPreviewBox = styled.div<{
  preset: {
    borderStyle: string;
    borderRadius: number;
    background: string;
    borderColor: string;
    blur: number;
    translateY?: number;
    borderWidth: number;
  };
}>`
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  aspect-ratio: 3 / 1;
  border-style: ${props => props.preset.borderStyle};
  border-width: ${props => `${props.preset.borderWidth}px`};
  border-radius: ${props => `${props.preset.borderRadius}px`};
  border-color: ${props => props.preset.borderColor};
  background-color: ${props => props.preset.background};
  backdrop-filter: ${props => `blur(${props.preset.blur}px)`};
  transition: 0.2s;

  &:hover {
    box-shadow: 0px 20px 20px -15px rgba(0, 0, 0, 0.1);
    transform: ${props => `translateY(${props.preset.translateY}px)`};
  }
`;
export const CardPreviewText = styled.p<{
  preset: string;
}>`
  color: ${({ theme, preset }) =>
    preset == "다크"
      ? theme.palette.text.textLight
      : theme.palette.text.textSubLight};
  font-weight: 500;
`;
export const PopAlert = styled.div`
  aspect-ratio: 5 / 2;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
`;
export const PopAlertText = styled.p`
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;
export const PopAlertIcon = styled.i`
  font-size: 1.6rem;
  line-height: 1.6rem;
  height: 1.6rem;
  color: ${({ theme }) => theme.palette.warning.red};
`;
export const PopAlertBox = styled.div`
  width: 100%;
  display: flex;
  justify-content: end;
  gap: 8px;
`;
export const DdayInfoWrap = styled.div`
  display: flex;
  flex-direction: column;
  width: 60%;
`;
export const DdayInfoBox = styled.div`
  display: flex;
  gap: 4px;
`;
