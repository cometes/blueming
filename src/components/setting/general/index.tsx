import { useState } from "react";
import {
  Button,
  ColorPicker,
  Input,
  message,
  Popconfirm,
  PopconfirmProps
} from "antd";
import { ImagePlus, Trash2 } from "lucide-react";

import * as S from "../../../../pages/setting/general/style";
import DivideLine from "../../../common/divideLine";
import RadioItem from "../../../common/items/radio";
import { useModal } from "../../../../etc/hooks/useModal";
import ImageUploadModal from "../../../common/upload/thumbnail";
import { useSettingGeneral } from "../../../../etc/hooks/useSettingGeneral";

type ImageField = "favicon" | "shareImage" | "logoImage";

interface ColorChangeEvent {
  toRgbString(): string;
}

const INPUT_HEIGHT = "36px";
const DIVIDER_MARGIN = "60px 0";
const ICON_SIZE = 28;
const ICON_COLOR = "#9BA2A8";

const PLACEHOLDERS = {
  TITLE: "홈페이지 타이틀을 입력해주세요",
  DESC: "홈페이지 설명을 입력해주세요"
} as const;

const UPLOAD_TEXT = "Upload Image";

interface ImageUploadSectionProps {
  title: string;
  description?: string;
  imageSrc?: string;
  onImageClick: () => void;
  onClearClick: () => void;
  theme: any;
}

interface FormData {
  title?: string;
  desc?: string;
  logoText?: string;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  title,
  description,
  imageSrc,
  onImageClick,
  onClearClick,
  theme
}) => (
  <S.SectionBox>
    <S.SectionTextBox>
      <S.SectionCategory>{title}</S.SectionCategory>
      {description && <S.SectionDesc>{description}</S.SectionDesc>}
    </S.SectionTextBox>
    <S.SectionImageBox>
      {imageSrc ? (
        <S.SectionImage src={imageSrc} />
      ) : (
        <S.SectionImageItem onClick={onImageClick}>
          <ImagePlus
            size={ICON_SIZE}
            color={ICON_COLOR}
            absoluteStrokeWidth={true}
          />
          <S.UploadText>{UPLOAD_TEXT}</S.UploadText>
        </S.SectionImageItem>
      )}
    </S.SectionImageBox>
    <S.SectionButtonBox>
      <Button icon={<Trash2 size={14} />} onClick={onClearClick}>
        비우기
      </Button>
    </S.SectionButtonBox>
  </S.SectionBox>
);

export default function GeneralSetting() {
  // Get all needed variables and functions from the hook
  const {
    handleSubmit,
    formState,
    getValues,
    setValue,
    logoTypes,
    currentLogo,
    setCurrentLogo,
    generalSetting,
    updateGeneralSetting,
    updateColorSetting,
    handleImageUpload,
    handleClearImage,
    handleReset,
    handleSave,
    bgThumbnail,
    setBgThumnail,
    theme
  } = useSettingGeneral();

  const { showModal, isModalOpen, setIsModalOpen, cancelModal } = useModal();

  const [currentImageField, setCurrentImageField] = useState<ImageField | "">(
    ""
  );

  const openImageModal = (field: ImageField) => {
    setCurrentImageField(field);
    if (generalSetting[field]) {
      setBgThumnail(generalSetting[field]);
    } else {
      setBgThumnail("");
    }
    showModal();
  };

  const onSubmit = (data: FormData) => {
    handleSave();
  };

  const cancel: PopconfirmProps["onCancel"] = e => {
    message.error("취소되었습니다.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ImageUploadModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        showModal={showModal}
        cancelModal={cancelModal}
        thumbnail={bgThumbnail}
        setThumbnail={setBgThumnail}
        onClickUpload={(value: string) => {
          handleImageUpload(currentImageField, value);
        }}
      />
      <S.Section>
        <S.SectionTitle>홈페이지 설정</S.SectionTitle>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>홈페이지 타이틀</S.SectionCategory>
              <S.Error>{formState.errors.title?.message}</S.Error>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Input
                placeholder={PLACEHOLDERS.TITLE}
                value={getValues("title") || generalSetting.title || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue("title", e.target.value);
                  updateGeneralSetting("title", e.target.value);
                }}
                style={{ height: INPUT_HEIGHT }}
              />
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>홈페이지 설명</S.SectionCategory>
              <S.Error>{formState.errors.desc?.message}</S.Error>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Input
                placeholder={PLACEHOLDERS.DESC}
                value={getValues("desc") || generalSetting.desc || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setValue("desc", e.target.value);
                  updateGeneralSetting("desc", e.target.value);
                }}
                style={{ height: INPUT_HEIGHT }}
              />
            </S.SectionInputBox>
          </S.SectionBox>
          <ImageUploadSection
            title="파비콘 (32x32)"
            description="브라우저 옆에 띄우는 작은 아이콘"
            imageSrc={generalSetting.favicon}
            onImageClick={() => openImageModal("favicon")}
            onClearClick={() => handleClearImage("favicon")}
            theme={theme}
          />

          <ImageUploadSection
            title="URL 공유 이미지"
            description="1200 * 630 권장"
            imageSrc={generalSetting.shareImage}
            onImageClick={() => openImageModal("shareImage")}
            onClearClick={() => handleClearImage("shareImage")}
            theme={theme}
          />

          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>메인 컬러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <ColorPicker
                value={generalSetting.primaryColor}
                onChange={(value: ColorChangeEvent) => {
                  updateColorSetting("primaryColor", value.toRgbString());
                }}
                size="large"
              />
              <S.ColorText color={generalSetting.primaryColor}>
                {generalSetting.primaryColor}
              </S.ColorText>
            </S.SectionInputBox>
          </S.SectionBox>

          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>서브 컬러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <ColorPicker
                value={generalSetting.secondaryColor}
                onChange={(value: ColorChangeEvent) => {
                  updateColorSetting("secondaryColor", value.toRgbString());
                }}
                size="large"
              />
              <S.ColorText color={generalSetting.secondaryColor}>
                {generalSetting.secondaryColor}
              </S.ColorText>
            </S.SectionInputBox>
          </S.SectionBox>
        </S.SectionWrap>
      </S.Section>

      <DivideLine margin={DIVIDER_MARGIN} />

      <S.Section>
        <S.SectionTitle>로고</S.SectionTitle>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>로고 타입</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {logoTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => setCurrentLogo(el)}
                  checked={currentLogo === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>

          {currentLogo === "이미지" && (
            <ImageUploadSection
              title="홈페이지 로고"
              description="홈페이지의 대표 로고를 커스텀 할 수 있습니다."
              imageSrc={generalSetting.logoImage}
              onImageClick={() => openImageModal("logoImage")}
              onClearClick={() => handleClearImage("logoImage")}
              theme={theme}
            />
          )}
          {currentLogo === "텍스트" && (
            <S.SectionBox>
              <S.SectionTextBox>
                <S.SectionCategory>로고 타이틀</S.SectionCategory>
                <S.Error>{formState.errors.logoText?.message}</S.Error>
              </S.SectionTextBox>
              <S.SectionInputBox>
                <Input
                  placeholder="로고 타이틀을 입력해주세요"
                  value={getValues("logoText") || generalSetting.logoText || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue("logoText", e.target.value);
                    updateGeneralSetting("logoText", e.target.value);
                  }}
                  style={{ height: INPUT_HEIGHT }}
                />
              </S.SectionInputBox>
            </S.SectionBox>
          )}
        </S.SectionWrap>
      </S.Section>

      <S.SectionSubmitBox>
        <Popconfirm
          title="정말 디자인설정을 초기화할까요?"
          onConfirm={handleReset}
          onCancel={cancel}
          okText="O"
          cancelText="X"
        >
          <Button danger>초기화하기</Button>
        </Popconfirm>

        <Button htmlType="submit">저장하기</Button>
      </S.SectionSubmitBox>
    </form>
  );
}
