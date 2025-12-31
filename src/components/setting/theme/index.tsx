import { useState } from "react";
import { useTheme } from "@emotion/react";
import { Input, Spin, Upload, Button, Popconfirm } from "antd";
import { Upload as UploadIcon } from "lucide-react";
import { Download, Trash2 } from "lucide-react";

import * as S from "../../../../pages/setting/general/style";
import DivideLine from "../../../common/divideLine";
import { useThemes } from "../../../../etc/contexts/themes";
import { dateConvert } from "../../../../etc/libraries/date";

interface ThemeItem {
  id: string;
  name: string;
  createdAt: string;
  general?: {
    design?: {
      background?: {
        color?: string;
        image?: string;
      };
    };
  };
}

interface ThemeContextType {
  themes: ThemeItem[];
  isLoading: boolean;
  createTheme: (name: string) => Promise<boolean>;
  removeTheme: (id: string) => Promise<void>;
  activateTheme: (id: string) => Promise<void>;
  exportTheme: (id: string) => string | null;
  importTheme: (data: string) => Promise<void>;
}

const INPUT_HEIGHT = 36;
const INPUT_WIDTH = 200;
const DIVIDER_MARGIN = "60px 0";

const PLACEHOLDERS = {
  THEME_NAME: "테마명을 입력해주세요"
} as const;

const BUTTON_TEXTS = {
  SAVING: "저장 중...",
  SAVE: "저장하기",
  APPLYING: "적용 중...",
  APPLY: "적용",
  IMPORT: "JSON 파일 선택"
} as const;

const SECTION_TEXTS = {
  SAVE_TITLE: "테마 세트 저장하기",
  SAVE_SUBTITLE:
    "홈페이지의 전체 디자인 및 설정을 저장하고 간편하게 교체할 수 있습니다.",
  INFO_TITLE: "테마 저장 및 적용 범위",
  CURRENT_SAVE: "현재 테마 저장",
  IMPORT: "테마 가져오기",
  LIST_TITLE: "테마 목록",
  LOADING: "테마를 불러오고 있습니다...",
  EMPTY_TITLE: "저장된 테마가 없습니다",
  EMPTY_DESC: "위에서 현재 설정을 테마로 저장해보세요!"
} as const;

const THEME_INFO_ITEMS = [
  "홈페이지 기본 설정 (제목, 설명, 색상 등)",
  "전체 디자인 (배경, 위젯, 카드, 폰트)",
  "메뉴 디자인 및 구성",
  "커스텀 레이아웃 및 슬라이드 설정"
] as const;

const ICON_SIZE = 16;
const EMPTY_ICON = "🎨";
const EMPTY_ICON_SIZE = "48px";

export default function ThemeSetting() {
  const theme = useTheme();
  const {
    themes,
    isLoading,
    loadThemes,
    createTheme,
    removeTheme,
    activateTheme,
    exportTheme,
    importTheme
  } = useThemes();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    const success = await createTheme(name);
    if (success) {
      setName("");
    }
    setSaving(false);
  };

  const handleApply = async (id: string) => {
    setApplying(id);
    await activateTheme(id);
    setApplying(null);
  };

  const handleRemove = async (id: string) => {
    setRemoving(id);
    await removeTheme(id);
    setRemoving(null);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (id: string) => {
    const themeData = exportTheme(id);
    if (themeData) {
      const themeToExport = themes.find(t => t.id === id);
      const filename = `${themeToExport?.name || "theme"}-theme.json`;
      downloadFile(themeData, filename);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      await importTheme(text);
    } catch (err) {
      console.error("파일 읽기 실패:", err);
    }
    return false; // Prevent upload
  };

  const renderThemeInfoItems = () => (
    <S.ThemeInfoBox>
      {THEME_INFO_ITEMS.map((item, index) => (
        <S.ThemeInfoList key={index}>
          <S.ThemeInfoItem>{item}</S.ThemeInfoItem>
        </S.ThemeInfoList>
      ))}
    </S.ThemeInfoBox>
  );

  const renderLoadingState = () => (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <Spin size="large" />
      <div style={{ marginTop: "16px", color: theme.palette.text.textSub }}>
        {SECTION_TEXTS.LOADING}
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: theme.palette.text.textSub
      }}
    >
      <div style={{ fontSize: EMPTY_ICON_SIZE, marginBottom: "16px" }}>
        {EMPTY_ICON}
      </div>
      <div style={{ fontSize: "18px", marginBottom: "8px" }}>
        {SECTION_TEXTS.EMPTY_TITLE}
      </div>
      <div>{SECTION_TEXTS.EMPTY_DESC}</div>
    </div>
  );

  const renderThemeCard = (item: ThemeItem) => (
    <S.ThemeGridBox key={item.id}>
      <S.ThemeTitle>{item.name}</S.ThemeTitle>
      <S.ThemeDate>{dateConvert(item.createdAt)}</S.ThemeDate>
      <S.ThemeThumbnail
        bgColor={item.general?.design?.background?.color}
        bgImage={item.general?.design?.background?.image}
      />
      <S.ThemeButtonBox>
        <Button
          onClick={() => handleExport(item.id)}
          title="테마 내보내기"
          icon={<Download size={ICON_SIZE} />}
        />
        <Popconfirm
          title="정말 테마를 삭제할까요?"
          onConfirm={() => handleRemove(item.id)}
          okText="O"
          cancelText="X"
        >
          <Button
            disabled={removing === item.id}
            title="테마 삭제"
            icon={
              removing === item.id ? (
                <Spin size="small" />
              ) : (
                <Trash2 size={ICON_SIZE} />
              )
            }
          />
        </Popconfirm>
        <Button
          onClick={() => handleApply(item.id)}
          disabled={applying === item.id}
        >
          {applying === item.id ? BUTTON_TEXTS.APPLYING : BUTTON_TEXTS.APPLY}
        </Button>
      </S.ThemeButtonBox>
    </S.ThemeGridBox>
  );

  return (
    <>
      <S.Section>
        <S.SectionTitle>{SECTION_TEXTS.SAVE_TITLE}</S.SectionTitle>
        <S.SectionSubtitle>{SECTION_TEXTS.SAVE_SUBTITLE}</S.SectionSubtitle>
        <S.ThemeInfoWrap>
          <S.ThemeInfoTitle>{SECTION_TEXTS.INFO_TITLE}</S.ThemeInfoTitle>
          {renderThemeInfoItems()}
        </S.ThemeInfoWrap>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionCategory>{SECTION_TEXTS.CURRENT_SAVE}</S.SectionCategory>
            <div
              style={{
                margin: "0 16px",
                width: INPUT_WIDTH
              }}
            >
              <Input
                placeholder={PLACEHOLDERS.THEME_NAME}
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  height: INPUT_HEIGHT
                }}
              />
            </div>

            <Button onClick={handleSave}>
              {saving ? BUTTON_TEXTS.SAVING : BUTTON_TEXTS.SAVE}
            </Button>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionCategory>{SECTION_TEXTS.IMPORT}</S.SectionCategory>
            <div style={{ marginLeft: "16px" }}>
              <Upload
                accept=".json"
                beforeUpload={handleImport}
                showUploadList={false}
              >
                <Button icon={<UploadIcon size={14} />}>
                  {BUTTON_TEXTS.IMPORT}
                </Button>
              </Upload>
            </div>
          </S.SectionBox>
        </S.SectionWrap>
      </S.Section>
      <DivideLine margin={DIVIDER_MARGIN} />
      <S.Section>
        <S.SectionTitle>{SECTION_TEXTS.LIST_TITLE}</S.SectionTitle>
        {isLoading ? (
          renderLoadingState()
        ) : themes?.length === 0 ? (
          renderEmptyState()
        ) : (
          <S.ThemeGridWrap>{themes?.map(renderThemeCard)}</S.ThemeGridWrap>
        )}
      </S.Section>
    </>
  );
}
