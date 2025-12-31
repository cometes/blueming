import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useTheme } from "@emotion/react";
import {
  Button,
  ColorPicker,
  Input,
  InputNumber,
  message,
  Popconfirm,
  PopconfirmProps,
  Slider
} from "antd";
import { createEditor, Editor, Element as SlateElement } from "slate";
import { Editable, Slate, withReact } from "slate-react";
import { withHistory } from "slate-history";

import * as S from "../../../../pages/setting/general/style";
import DivideLine from "../../../common/divideLine";
import { withInlines } from "../../../../etc/hooks/useWithInline";
import { withImages } from "../../../../etc/hooks/useWithImage";
import withVideo from "../../../../etc/hooks/useWithVideo";
import Leaf from "../../../common/editor/customToolbar/leaf";
import Element from "../../../common/editor/customToolbar/element";
import CustomToolbar from "../../new/customToolbar";
import { useSetting } from "../../../../etc/contexts/settings";
import RadioItem from "../../../common/items/radio";
import { setSettingsNotice } from "../../../../etc/queries/setSettingsNotice";

interface Ratio {
  w: number;
  h: number;
}

interface MarqueeSettings {
  type: string;
  gradientColor: string;
  gradientWidth: number;
  textColor: string;
  backgroundColor: string;
}

interface EditorDimensions {
  width: number;
  height: number;
}

interface NoticeData {
  bannerText: string;
  noticeContent: string;
  marqueeSettings: MarqueeSettings;
  editorDimensions: EditorDimensions;
}

interface LayoutItem {
  i: string;
  w: number;
  h: number;
}

type SlateNode = any;
type SlateValue = SlateNode[];

const INPUT_HEIGHT = "36px";
const DIVIDER_MARGIN = "60px 0";
const CANVAS_RATIO_BASE = 12;
const LAYOUT_ITEM_ID = "공지";
const BROADCAST_CHANNELS = {
  LAYOUT_UPDATED: "layoutUpdated",
  NOTICE_UPDATED: "noticeUpdated"
} as const;

const DEFAULT_COLORS = {
  GRADIENT: "#1890ff",
  TEXT: "#ffffff",
  BACKGROUND: "#ffffff",
  TEXT_DEFAULT: "#000000",
  BACKGROUND_DEFAULT: "#ffffff"
} as const;

const GRADIENT_SETTINGS = {
  MIN: 100,
  MAX: 500,
  DEFAULT: 100
} as const;

const MARQUEE_TYPES = ["투명", "컬러"] as const;
const DEFAULT_MARQUEE_TYPE = "투명";
const COLOR_MARQUEE_TYPE = "컬러";

const PLACEHOLDER_TEXT = "텍스트바 내용을 입력해주세요";
const EDITOR_PLACEHOLDER = "공지사항 내용을 입력해주세요...";

const MESSAGES = {
  SAVE_SUCCESS: "설정이 저장되었습니다!",
  SAVE_ERROR: "저장에 실패했습니다.",
  RESET_SUCCESS: "설정이 초기화되었습니다!",
  RESET_ERROR: "초기화에 실패했습니다."
} as const;

const calculateRatio = (width: number, height: number): Ratio => {
  const aspectRatio = width / height;

  if (width > height) {
    return {
      w: CANVAS_RATIO_BASE,
      h: Math.round(CANVAS_RATIO_BASE / aspectRatio)
    };
  } else if (height > width) {
    return {
      w: Math.round(CANVAS_RATIO_BASE * aspectRatio),
      h: CANVAS_RATIO_BASE
    };
  } else {
    return { w: CANVAS_RATIO_BASE, h: CANVAS_RATIO_BASE };
  }
};

const broadcastNoticeUpdate = (
  content: SlateValue,
  editorDimensions: EditorDimensions
) => {
  const channel = new BroadcastChannel(BROADCAST_CHANNELS.NOTICE_UPDATED);
  channel.postMessage({ content, editorDimensions });
  channel.close();
};

export default function MainNoticeSetting() {
  const theme = useTheme();
  const { main } = useSetting();
  const canvasRef = useRef<HTMLDivElement>(null);

  const defaultValue: SlateValue = [
    {
      type: "paragraph",
      children: [{ text: "" }]
    }
  ];

  const [bannerText, setBannerText] = useState<string>("");
  const [ratio, setRatio] = useState<Ratio>({ w: 0, h: 0 });
  const [noticeContent, setNoticeContent] = useState<SlateValue>(defaultValue);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const noticeContentRef = useRef<string>(JSON.stringify(defaultValue));
  const [currentAlign, setCurrentAlign] = useState<string>("left");
  const [currentType, setCurrentType] = useState<string>(DEFAULT_MARQUEE_TYPE);
  const [gradientColor, setGradientColor] = useState<string>(
    DEFAULT_COLORS.GRADIENT
  );
  const [gradientWidth, setGradientWidth] = useState<number>(
    GRADIENT_SETTINGS.DEFAULT
  );
  const [textColor, setTextColor] = useState<string>(DEFAULT_COLORS.TEXT);
  const [backgroundColor, setBackgroundColor] = useState<string>(
    DEFAULT_COLORS.BACKGROUND
  );

  // 에디터 생성
  const editor = useMemo(() => {
    return withVideo(
      withInlines(withImages(withHistory(withReact(createEditor()))))
    );
  }, []);

  const renderLeaf = useCallback((props: any) => {
    return <Leaf {...props} />;
  }, []);

  const renderElement = useCallback((props: any) => {
    return <Element {...props} />;
  }, []);

  // 초기 데이터 로드 (settingProvider에서)
  useEffect(() => {
    if (main?.notice) {
      const noticeData = main.notice;

      // 텍스트바 설정
      if (noticeData.bannerText) {
        setBannerText(noticeData.bannerText);
      }

      // 공지사항 내용
      if (noticeData.noticeContent) {
        try {
          const parsedContent =
            typeof noticeData.noticeContent === "string"
              ? JSON.parse(noticeData.noticeContent)
              : noticeData.noticeContent;
          setNoticeContent(parsedContent);
          noticeContentRef.current =
            typeof noticeData.noticeContent === "string"
              ? noticeData.noticeContent
              : JSON.stringify(noticeData.noticeContent);
        } catch (error) {
          console.error("공지사항 내용 파싱 오류:", error);
        }
      }

      // 마키 설정
      if (noticeData.marqueeSettings) {
        const marqueeSettings = noticeData.marqueeSettings;
        setCurrentType(marqueeSettings.type || DEFAULT_MARQUEE_TYPE);
        setGradientColor(
          marqueeSettings.gradientColor || DEFAULT_COLORS.GRADIENT
        );
        setGradientWidth(
          marqueeSettings.gradientWidth || GRADIENT_SETTINGS.DEFAULT
        );
        setTextColor(marqueeSettings.textColor || DEFAULT_COLORS.TEXT_DEFAULT);
        setBackgroundColor(
          marqueeSettings.backgroundColor || DEFAULT_COLORS.BACKGROUND_DEFAULT
        );
      }
    }

    setIsLoaded(true);
  }, [main?.notice]);

  // 레이아웃 비율 초기화
  useEffect(() => {
    const customLayout = main?.customLayout.layout;
    if (customLayout) {
      const freeboard = customLayout.find((el: any) => el.i === LAYOUT_ITEM_ID);

      if (freeboard) {
        setRatio(calculateRatio(freeboard.w, freeboard.h));
      }
    }
  }, [main?.customLayout.layout]);

  useEffect(() => {
    const handleLayoutUpdate = (e: { detail?: { layout?: LayoutItem[] } }) => {
      const layout = e.detail?.layout;
      if (layout) {
        const notice = layout.find((el: any) => el.i === LAYOUT_ITEM_ID);
        if (notice) {
          setRatio(calculateRatio(notice.w, notice.h));
        }
      }
    };
    const channel = new BroadcastChannel(BROADCAST_CHANNELS.LAYOUT_UPDATED);
    channel.onmessage = e => handleLayoutUpdate({ detail: e.data });
    return () => {
      channel.close();
    };
  }, []);

  // 콘텐츠 변경 핸들러
  const updateCurrentAlign = () => {
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: n => SlateElement.isElement(n),
        mode: "lowest"
      })
    );

    setCurrentAlign((match?.[0] as any)?.align || "left");
  };

  const getContent = (value: SlateValue) => {
    if (editor.selection) {
      updateCurrentAlign();
    }

    const content = JSON.stringify(value);
    noticeContentRef.current = content;
  };

  // 저장 핸들러 (API 방식)
  const handleSave = async () => {
    try {
      // 마키 설정
      const marqueeSettings = {
        type: currentType,
        gradientColor,
        gradientWidth,
        textColor,
        backgroundColor
      };

      // 에디터 캔버스 크기
      const editorDimensions = canvasRef.current
        ? canvasRef.current.getBoundingClientRect()
        : { width: 0, height: 0 };

      // API로 저장할 데이터 구성
      const noticeData = {
        bannerText,
        noticeContent: noticeContentRef.current,
        marqueeSettings,
        editorDimensions: {
          width: editorDimensions.width,
          height: editorDimensions.height
        }
      };

      // API로 저장
      await setSettingsNotice(noticeData);

      // 로컬 상태 업데이트
      setNoticeContent(JSON.parse(noticeContentRef.current));

      broadcastNoticeUpdate(
        JSON.parse(noticeContentRef.current),
        editorDimensions
      );

      message.success(MESSAGES.SAVE_SUCCESS);
    } catch (error) {
      console.error("저장 중 오류:", error);
      message.error(MESSAGES.SAVE_ERROR);
    }
  };

  // 초기화 핸들러 (API 방식)
  const handleReset = async () => {
    try {
      // 초기화된 데이터
      const resetData = {
        bannerText: "",
        noticeContent: JSON.stringify(defaultValue),
        marqueeSettings: {
          type: DEFAULT_MARQUEE_TYPE,
          gradientColor: DEFAULT_COLORS.GRADIENT,
          gradientWidth: GRADIENT_SETTINGS.DEFAULT,
          textColor: DEFAULT_COLORS.TEXT_DEFAULT,
          backgroundColor: DEFAULT_COLORS.BACKGROUND_DEFAULT
        },
        editorDimensions: { width: 0, height: 0 }
      };

      // API로 초기화된 데이터 저장
      await setSettingsNotice(resetData);

      // 로컬 상태 초기화
      setBannerText("");
      setNoticeContent(defaultValue);
      noticeContentRef.current = JSON.stringify(defaultValue);
      setCurrentType(DEFAULT_MARQUEE_TYPE);
      setGradientColor(DEFAULT_COLORS.GRADIENT);
      setGradientWidth(GRADIENT_SETTINGS.DEFAULT);
      setTextColor(DEFAULT_COLORS.TEXT_DEFAULT);
      setBackgroundColor(DEFAULT_COLORS.BACKGROUND_DEFAULT);

      broadcastNoticeUpdate(defaultValue, { width: 0, height: 0 });

      message.success(MESSAGES.RESET_SUCCESS);
    } catch (error) {
      console.error("초기화 중 오류:", error);
      message.error(MESSAGES.RESET_ERROR);
    }
  };

  const cancel: PopconfirmProps["onCancel"] = e => {
    message.error("취소되었습니다.");
  };

  return (
    <>
      <S.Section>
        <S.SectionTitle>텍스트바 설정</S.SectionTitle>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>
                텍스트바 내용 <br /> (움직이는 한 줄 텍스트)
              </S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Input
                placeholder={PLACEHOLDER_TEXT}
                value={bannerText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBannerText(e.target.value)
                }
                style={{ height: INPUT_HEIGHT }}
              />
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>텍스트 컬러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <ColorPicker
                value={textColor}
                onChange={(_, hex: string) => setTextColor(hex)}
                size="large"
              />
              <S.ColorText color={textColor}>{textColor}</S.ColorText>
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>배경 컬러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <ColorPicker
                value={backgroundColor}
                onChange={(_, hex: string) => setBackgroundColor(hex)}
                size="large"
              />
              <S.ColorText color={backgroundColor}>
                {backgroundColor}
              </S.ColorText>
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>양쪽 끝 처리</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {MARQUEE_TYPES.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => setCurrentType(el)}
                  checked={currentType === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          {currentType === COLOR_MARQUEE_TYPE && (
            <>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>그라디언트 컬러</S.SectionCategory>
                </S.SectionTextBox>
                <S.SectionInputBox>
                  <ColorPicker
                    value={gradientColor}
                    onChange={(_, hex: string) => setGradientColor(hex)}
                    size="large"
                  />
                  <S.ColorText color={gradientColor}>
                    {gradientColor}
                  </S.ColorText>
                </S.SectionInputBox>
              </S.SectionBox>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>그라디언트 너비</S.SectionCategory>
                </S.SectionTextBox>
                <S.SectionInputBox>
                  <Slider
                    min={GRADIENT_SETTINGS.MIN}
                    max={GRADIENT_SETTINGS.MAX}
                    onChange={(value: number) => setGradientWidth(value)}
                    value={gradientWidth}
                    style={{ width: "100%" }}
                  />
                  <InputNumber
                    min={GRADIENT_SETTINGS.MIN}
                    max={GRADIENT_SETTINGS.MAX}
                    style={{ margin: "0 16px" }}
                    value={gradientWidth}
                    onChange={(value: number) => setGradientWidth(value)}
                    onPressEnter={() => {}}
                  />
                </S.SectionInputBox>
              </S.SectionBox>
            </>
          )}
        </S.SectionWrap>
      </S.Section>
      <DivideLine margin={DIVIDER_MARGIN} />
      <S.Section>
        <S.SectionTitle>공지사항 설정</S.SectionTitle>

        <S.SectionWrap>
          {isLoaded && (
            <Slate
              editor={editor}
              initialValue={noticeContent}
              onChange={getContent}
            >
              <S.ToolbarBox>
                <CustomToolbar
                  currentAlign={currentAlign}
                  setCurrentAlign={setCurrentAlign}
                />
              </S.ToolbarBox>

              <S.EditWrap>
                <S.Canvas ref={canvasRef} ratio={ratio}>
                  <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder={EDITOR_PLACEHOLDER}
                    style={{
                      height: "100%",
                      flexGrow: 1,
                      outline: "none"
                    }}
                  />
                </S.Canvas>
              </S.EditWrap>
            </Slate>
          )}
        </S.SectionWrap>
      </S.Section>
      <S.SectionSubmitBox>
        <Popconfirm
          title="정말 공지사항을 초기화할까요?"
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
