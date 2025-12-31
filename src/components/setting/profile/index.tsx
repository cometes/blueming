import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useTheme } from "@emotion/react";
import { Button, Input, message, Popconfirm, PopconfirmProps } from "antd";
import { ImagePlus, Trash2 } from "lucide-react";
import { createEditor, Editor, Element as SlateElement } from "slate";
import { Editable, Slate, withReact } from "slate-react";
import { withHistory } from "slate-history";

import * as S from "../../../../pages/setting/general/style";
import ImageUploadModal from "../../../common/upload/thumbnail";
import { useModal } from "../../../../etc/hooks/useModal";
import { useSetting } from "../../../../etc/contexts/settings";
import { withInlines } from "../../../../etc/hooks/useWithInline";
import { withImages } from "../../../../etc/hooks/useWithImage";
import withVideo from "../../../../etc/hooks/useWithVideo";
import Leaf from "../../../common/editor/customToolbar/leaf";
import Element from "../../../common/editor/customToolbar/element";
import SimpleToolbar from "../../../common/editor/customToolbar/simpleToolbar";
import { setSettingsProfile } from "../../../../etc/queries/setSettingsProfile";

interface ProfileData {
  headerImage: string;
  profileImage: string;
  nickname: string;
  introduction: string;
  etc: string;
}

type ImageField = "headerImage" | "profileImage";

type SlateNode = any;
type SlateValue = SlateNode[];

const INPUT_HEIGHT = "36px";
const ICON_SIZE = 28;
const ICON_COLOR = "#151718";

const PLACEHOLDERS = {
  NICKNAME: "닉네임을 입력해주세요",
  INTRODUCTION: "자기소개를 입력해주세요...",
  ETC: "기타 내용을 입력해주세요 (옵션)"
} as const;

const UPLOAD_TEXT = "Upload Image";
const BROADCAST_CHANNEL = "profileUpdated";

const MESSAGES = {
  SAVE_SUCCESS: "프로필이 저장되었습니다.",
  SAVE_ERROR: "프로필 저장에 실패했습니다.",
  RESET_SUCCESS: "프로필이 초기화되었습니다.",
  RESET_ERROR: "프로필 초기화에 실패했습니다.",
  IMAGE_UPLOAD_ERROR: "이미지 업로드 저장에 실패했습니다.",
  IMAGE_DELETE_ERROR: "이미지 삭제 저장에 실패했습니다."
} as const;

const EDITOR_STYLES = {
  CONTAINER: {
    borderRadius: "8px",
    overflow: "hidden",
    transition: "all 0.2s ease"
  },
  TOOLBAR: {
    padding: "8px 12px",
    display: "flex",
    gap: "16px"
  },
  CONTENT: {
    minHeight: "120px",
    padding: "16px",
    lineHeight: "1.6",
    fontSize: "14px"
  },
  EDITABLE: {
    outline: "none",
    minHeight: "88px",
    fontFamily: "inherit",
    fontSize: "inherit",
    lineHeight: "inherit"
  }
} as const;

const createDefaultProfile = (): ProfileData => ({
  headerImage: "",
  profileImage: "",
  nickname: "",
  introduction: "",
  etc: ""
});

const broadcastProfileUpdate = (profile: ProfileData) => {
  const channel = new BroadcastChannel(BROADCAST_CHANNEL);
  channel.postMessage({
    profile,
    timestamp: Date.now()
  });
  channel.close();
};

interface ImageUploadSectionProps {
  title: string;
  imageSrc?: string;
  onImageClick: () => void;
  onClearClick: () => void;
  theme: any;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  title,
  imageSrc,
  onImageClick,
  onClearClick,
  theme
}) => (
  <S.SectionBox>
    <S.SectionTextBox>
      <S.SectionCategory>{title}</S.SectionCategory>
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

export default function MainProfileSetting() {
  const theme = useTheme();
  const { showModal, isModalOpen, setIsModalOpen, cancelModal } = useModal();
  const [bgThumbnail, setBgThumnail] = useState<string>("");
  const [currentImageField, setCurrentImageField] = useState<ImageField | "">(
    ""
  );
  const { main } = useSetting();

  const defaultValue: SlateValue = [
    {
      type: "paragraph",
      children: [{ text: "" }]
    }
  ];

  const [introductionContent, setIntroductionContent] =
    useState<SlateValue>(defaultValue);
  const introductionContentRef = useRef<string>(JSON.stringify(defaultValue));
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const editor = useMemo(() => {
    return withVideo(
      withInlines(withImages(withHistory(withReact(createEditor()))))
    );
  }, []);

  const [profileData, setProfileData] = useState<ProfileData>(
    createDefaultProfile()
  );

  // Slate editor render functions
  const renderLeaf = useCallback((props: any) => {
    return <Leaf {...props} />;
  }, []);

  const renderElement = useCallback((props: any) => {
    return <Element {...props} />;
  }, []);

  // Load from settingProvider on mount
  useEffect(() => {
    if (main?.profile) {
      const profileData = main.profile;

      setProfileData({
        headerImage: profileData.headerImage || "",
        profileImage: profileData.profileImage || "",
        nickname: profileData.nickname || "",
        introduction: profileData.introduction || "",
        etc: profileData.etc || ""
      });

      // Load introduction content if it exists and is valid slate content
      if (profileData.introduction) {
        try {
          const parsedIntroduction = JSON.parse(profileData.introduction);
          if (Array.isArray(parsedIntroduction)) {
            setIntroductionContent(parsedIntroduction);
            introductionContentRef.current = profileData.introduction;
          }
        } catch {
          // If it's not valid JSON, treat as plain text
          setIntroductionContent([
            {
              type: "paragraph",
              children: [{ text: profileData.introduction }]
            }
          ]);
        }
      }
    }

    setIsLoaded(true);
  }, [main?.profile]);

  const saveToAPI = useCallback(async (data: ProfileData) => {
    try {
      await setSettingsProfile(data);
    } catch (error) {
      console.error("Failed to save profile data to API:", error);
      throw error;
    }
  }, []);

  const handleInputChange = useCallback(
    (field: keyof ProfileData, value: string) => {
      setProfileData(prev => ({
        ...prev,
        [field]: value
      }));
    },
    []
  );

  const getIntroductionContent = (value: SlateValue) => {
    if (editor.selection) {
      // Update current align if needed
    }
    const content = JSON.stringify(value);
    introductionContentRef.current = content;

    // Update profileData with the serialized content
    setProfileData(prev => ({
      ...prev,
      introduction: content
    }));
  };

  const handleImageUpload = useCallback(
    async (field: ImageField, value: string) => {
      const newData = {
        ...profileData,
        [field]: value
      };
      setProfileData(newData);

      try {
        await saveToAPI(newData);
      } catch (error) {
        // API 저장 실패 시 이전 상태로 되돌림
        setProfileData(profileData);
        alert(MESSAGES.IMAGE_UPLOAD_ERROR);
      }
    },
    [profileData, saveToAPI]
  );

  const handleClearImage = useCallback(
    async (field: ImageField) => {
      const newData = {
        ...profileData,
        [field]: ""
      };
      setProfileData(newData);
    },
    [profileData, saveToAPI]
  );

  // Save profile data
  const handleSave = useCallback(async () => {
    try {
      await saveToAPI(profileData);

      broadcastProfileUpdate(profileData);

      alert(MESSAGES.SAVE_SUCCESS);
    } catch (error) {
      alert(MESSAGES.SAVE_ERROR);
    }
  }, [profileData, saveToAPI]);

  // Reset profile data
  const handleReset = useCallback(async () => {
    const emptyProfile = createDefaultProfile();

    try {
      await saveToAPI(emptyProfile);

      setProfileData(emptyProfile);
      setIntroductionContent(defaultValue);
      introductionContentRef.current = JSON.stringify(defaultValue);

      broadcastProfileUpdate(emptyProfile);

      alert(MESSAGES.RESET_SUCCESS);
    } catch (error) {
      alert(MESSAGES.RESET_ERROR);
    }
  }, [saveToAPI]);

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
          handleImageUpload(currentImageField as ImageField, value);
        }}
      />
      <S.Section>
        <S.SectionTitle>프로필 설정</S.SectionTitle>
        <S.SectionWrap>
          <ImageUploadSection
            title="헤더 이미지"
            imageSrc={profileData.headerImage}
            onImageClick={() => {
              setCurrentImageField("headerImage");
              showModal();
            }}
            onClearClick={() => handleClearImage("headerImage")}
            theme={theme}
          />
          <ImageUploadSection
            title="프로필 이미지"
            imageSrc={profileData.profileImage}
            onImageClick={() => {
              setCurrentImageField("profileImage");
              showModal();
            }}
            onClearClick={() => handleClearImage("profileImage")}
            theme={theme}
          />
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>닉네임</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Input
                placeholder={PLACEHOLDERS.NICKNAME}
                value={profileData.nickname}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("nickname", e.target.value)
                }
                style={{ height: INPUT_HEIGHT }}
              />
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>자기소개</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              {isLoaded && (
                <div
                  style={{
                    width: "100%",
                    background: theme.palette.background.card,
                    backdropFilter: `blur(${
                      theme.designSet?.card?.blur || 0
                    }px)`,
                    border: `1px solid ${theme.palette.border.card}`,
                    ...EDITOR_STYLES.CONTAINER
                  }}
                >
                  <Slate
                    editor={editor}
                    initialValue={introductionContent}
                    onChange={getIntroductionContent}
                  >
                    <div
                      style={{
                        borderBottom: `1px solid ${theme.palette.border.card}`,
                        ...EDITOR_STYLES.TOOLBAR
                      }}
                    >
                      <SimpleToolbar />
                    </div>

                    <div style={EDITOR_STYLES.CONTENT}>
                      <Editable
                        renderElement={renderElement}
                        renderLeaf={renderLeaf}
                        placeholder={PLACEHOLDERS.INTRODUCTION}
                        style={{
                          ...EDITOR_STYLES.EDITABLE,
                          color: theme.palette.text.textMain
                        }}
                      />
                    </div>
                  </Slate>
                </div>
              )}
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>etc</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Input
                placeholder={PLACEHOLDERS.ETC}
                value={profileData.etc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("etc", e.target.value)
                }
                style={{ height: INPUT_HEIGHT }}
              />
            </S.SectionInputBox>
          </S.SectionBox>
        </S.SectionWrap>
      </S.Section>
      <S.SectionSubmitBox>
        <Popconfirm
          title="정말 프로필 설정을 초기화할까요?"
          onConfirm={handleReset}
          onCancel={cancel}
          okText="O"
          cancelText="X"
        >
          <Button danger>초기화하기</Button>
        </Popconfirm>

        <Button onClick={handleSave}>저장하기</Button>
      </S.SectionSubmitBox>
    </>
  );
}
