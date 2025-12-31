import { useTheme } from "@emotion/react";
import {
  Button,
  ColorPicker,
  message,
  Popconfirm,
  PopconfirmProps,
  Popover,
  Select
} from "antd";
import { ChevronDown, CircleAlert, ImagePlus, Trash2 } from "lucide-react";

const BACKGROUND_TYPES = {
  IMAGE: "이미지",
  SOLID: "단색"
} as const;

const FONT_SAMPLE_TEXTS = {
  TITLE: "제목 또는 메뉴명 Title",
  CONTENT: "본문 서체 및 크기 미리보기 기본 문장 12345 Paragraph",
  DESCRIPTION: "서브 폰트 미리보기 12345 Description"
} as const;

const SELECT_STYLE = { width: "120px" };
const DIVIDER_MARGIN = "60px 0 ";

interface ColorChangeEvent {
  toRgbString(): string;
}

import * as S from "../../../../pages/setting/general/style";
import DivideLine from "../../../common/divideLine";
import RadioItem from "../../../common/items/radio";
import { useSettingDesign } from "../../../../etc/hooks/useSettingDesign";
import { useModal } from "../../../../etc/hooks/useModal";
import ImageUploadModal from "../../../common/upload/thumbnail";
import WidgetSetting from "../../../common/setting/widget";

export default function DesignSetting() {
  const theme = useTheme();

  const {
    BGTypes,
    fontTitle,
    fontBody,
    bgThumbnail,
    setBgThumnail,
    background,
    widget,
    card,
    font,
    onClickSubmit,
    openReset,
    setOpenReset,
    onClickReset,
    updateDesignSetting,
    currentDesignSetting
  } = useSettingDesign();

  const { showModal, isModalOpen, setIsModalOpen, cancelModal } = useModal();

  const cancel: PopconfirmProps["onCancel"] = e => {
    message.error("취소되었습니다.");
  };

  return (
    <>
      <ImageUploadModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        showModal={showModal}
        cancelModal={cancelModal}
        thumbnail={bgThumbnail}
        setThumbnail={setBgThumnail}
        onClickUpload={(value: string) => {
          updateDesignSetting("background.image", value);
        }}
      />
      <S.Section>
        <S.SectionTitle>배경 디자인 설정</S.SectionTitle>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>배경 타입</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {BGTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    updateDesignSetting("background.type", el);
                  }}
                  checked={background.type === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          {background.type === BACKGROUND_TYPES.IMAGE && (
            <S.SectionBox>
              <S.SectionTextBox>
                <S.SectionCategory>배경 이미지</S.SectionCategory>
              </S.SectionTextBox>
              <S.SectionImageBox>
                {background.image ? (
                  <S.SectionImage src={background.image} />
                ) : (
                  <S.SectionImageItem onClick={showModal}>
                    <ImagePlus
                      size={28}
                      color="#9BA2A8"
                      absoluteStrokeWidth={true}
                    />
                    <S.UploadText>이미지 업로드</S.UploadText>
                  </S.SectionImageItem>
                )}
              </S.SectionImageBox>
              <S.SectionButtonBox>
                <Button
                  icon={<Trash2 size={14} />}
                  onClick={() => {
                    updateDesignSetting("background.image", "");
                  }}
                >
                  비우기
                </Button>
              </S.SectionButtonBox>
            </S.SectionBox>
          )}
          {background.type === BACKGROUND_TYPES.SOLID && (
            <S.SectionBox>
              <S.SectionTextBox>
                <S.SectionCategory>메인 컬러</S.SectionCategory>
              </S.SectionTextBox>
              <S.SectionInputBox>
                <ColorPicker
                  value={background.color}
                  size="large"
                  onChange={(value: ColorChangeEvent) => {
                    updateDesignSetting(
                      "background.color",
                      value.toRgbString()
                    );
                  }}
                />
                <S.ColorText color={background.color}>
                  {background.color}
                </S.ColorText>
              </S.SectionInputBox>
            </S.SectionBox>
          )}
        </S.SectionWrap>
      </S.Section>
      <DivideLine margin={DIVIDER_MARGIN} />
      <WidgetSetting
        widget={widget}
        card={card}
        updateDesignSetting={updateDesignSetting}
        currentDesignSetting={currentDesignSetting}
      />
      <DivideLine margin={DIVIDER_MARGIN} />
      <S.Section>
        <S.SectionTitle>폰트 설정</S.SectionTitle>
        <S.SectionWrap>
          <S.FontSampleWrap>
            <S.FontSampleTitle
              font={font.titleFontFamily}
              color={font.mainFontColor}
            >
              {FONT_SAMPLE_TEXTS.TITLE}
            </S.FontSampleTitle>
            <S.FontSampleContent
              font={font.bodyFontFamily}
              color={font.mainFontColor}
            >
              {FONT_SAMPLE_TEXTS.CONTENT}
            </S.FontSampleContent>
            <S.FontSampleDesc
              font={font.bodyFontFamily}
              color={font.subFontColor}
            >
              {FONT_SAMPLE_TEXTS.DESCRIPTION}
            </S.FontSampleDesc>
          </S.FontSampleWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>메인 폰트 컬러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <ColorPicker
                value={font.mainFontColor}
                size="large"
                onChange={(value: ColorChangeEvent) => {
                  updateDesignSetting(
                    "font.mainFontColor",
                    value.toRgbString()
                  );
                }}
              />
              <S.ColorText color={font.mainFontColor}>
                {font.mainFontColor}
              </S.ColorText>
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>서브 폰트 컬러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <ColorPicker
                value={font.subFontColor}
                size="large"
                onChange={(value: ColorChangeEvent) => {
                  updateDesignSetting("font.subFontColor", value.toRgbString());
                }}
              />
              <S.ColorText color={font.subFontColor}>
                {font.subFontColor}
              </S.ColorText>
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>제목 서체</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Select
                options={fontTitle}
                style={SELECT_STYLE}
                value={font.titleFontFamily}
                onChange={(value: string) => {
                  updateDesignSetting("font.titleFontFamily", value);
                }}
                suffixIcon={<ChevronDown size={16} />}
              />
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>본문 서체</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Select
                style={SELECT_STYLE}
                options={fontBody}
                value={font.bodyFontFamily}
                onChange={(value: string) => {
                  updateDesignSetting("font.bodyFontFamily", value);
                }}
                suffixIcon={<ChevronDown size={16} />}
              />
            </S.SectionInputBox>
          </S.SectionBox>
        </S.SectionWrap>
      </S.Section>
      <S.SectionSubmitBox>
        <Popconfirm
          title="정말 디자인설정을 초기화할까요?"
          onConfirm={onClickReset}
          onCancel={cancel}
          okText="O"
          cancelText="X"
        >
          <Button danger>초기화하기</Button>
        </Popconfirm>

        <Button onClick={onClickSubmit}>저장하기</Button>
      </S.SectionSubmitBox>
    </>
  );
}
