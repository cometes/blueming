import { useTheme } from "@emotion/react";
import { Button, ColorPicker, InputNumber, Slider } from "antd";
import { Trash2 } from "lucide-react";

import * as S from "../../../../pages/setting/general/style";
import DivideLine from "../../divideLine";
import RadioItem from "../../items/radio";
import { useSettingDesign } from "../../../../etc/hooks/useSettingDesign";

interface WidgetSettings {
  background: string;
  borderColor: string;
  borderRadius: number;
  borderStyle: string;
  borderWidth: number;
  blur: number;
  borderImage: string;
}

interface CardSettings extends WidgetSettings {
  type: string;
  borderActiveColor: string;
  boxShadow: string;
  translateY: number;
}

interface ColorChangeEvent {
  toRgbString(): string;
}

interface WidgetSettingProps {
  widget: WidgetSettings;
  card: CardSettings;
  updateDesignSetting: (path: string, value: any) => void;
}

const SLIDER_CONFIG = {
  BORDER_WIDTH: { min: 1, max: 5 },
  BLUR: { min: 0, max: 20 }
} as const;

const INPUT_STYLES = {
  SLIDER_FULL_WIDTH: { width: "100%" },
  INPUT_NUMBER_MARGIN: { margin: "0 16px" }
} as const;

const SECTION_TEXTS = {
  WIDGET_TITLE: "위젯 설정",
  WIDGET_PREVIEW: "위젯 프리뷰입니다.",
  CARD_TITLE: "카드 설정",
  CARD_PREVIEW: "카드 프리뷰입니다.",
  CLEAR_BUTTON: "비우기"
} as const;

const FIELD_LABELS = {
  WIDGET: {
    BACKGROUND: "위젯 배경 컬러",
    BORDER_COLOR: "위젯 라인 컬러",
    BORDER_RADIUS: "위젯 모서리 둥글기",
    BORDER_STYLE: "위젯 라인 타입",
    BORDER_WIDTH: "위젯 라인 굵기",
    BLUR: "위젯 블러",
    BORDER_IMAGE: "위젯 보더 이미지 (옵션)"
  },
  CARD: {
    PRESET: "프리셋",
    BACKGROUND: "카드 배경 컬러",
    BORDER_COLOR: "카드 라인 컬러",
    BORDER_RADIUS: "카드 모서리 둥글기",
    BORDER_STYLE: "카드 라인 타입",
    BORDER_WIDTH: "카드 라인 굵기",
    BLUR: "카드 블러",
    BORDER_IMAGE: "카드 보더 이미지 (옵션)"
  }
} as const;

const PRESET_TYPES = {
  LIGHT: "라이트",
  DARK: "다크",
  CUSTOM: "커스텀"
} as const;

const DIVIDER_MARGIN = "60px 0";
const RECOMMENDED_SIZE = "권장 90 * 90";

export default function WidgetSetting(props: WidgetSettingProps) {
  const theme = useTheme();
  const {
    lightPreset,
    darkPreset,
    design,
    presetTypes,
    radiusTypes,
    lineTypes
  } = useSettingDesign();

  const applyPreset = (presetType: string) => {
    if (presetType === PRESET_TYPES.LIGHT) {
      const presetKeys = Object.keys(lightPreset) as Array<
        keyof typeof lightPreset
      >;
      presetKeys.forEach(key => {
        props.updateDesignSetting(`card.${key}`, lightPreset[key]);
      });
      props.updateDesignSetting("card.type", presetType);
    } else if (presetType === PRESET_TYPES.DARK) {
      const presetKeys = Object.keys(darkPreset) as Array<
        keyof typeof darkPreset
      >;
      presetKeys.forEach(key => {
        props.updateDesignSetting(`card.${key}`, darkPreset[key]);
      });
      props.updateDesignSetting("card.type", presetType);
    } else {
      props.updateDesignSetting("card.type", presetType);
    }
  };

  const getCardPreset = () => {
    if (
      props.card.type === PRESET_TYPES.LIGHT ||
      props.card.type === PRESET_TYPES.DARK
    ) {
      return props.card.type === PRESET_TYPES.LIGHT ? lightPreset : darkPreset;
    }
    return props.card;
  };

  const renderColorPicker = (
    value: string,
    onChange: (color: ColorChangeEvent) => void
  ) => (
    <>
      <ColorPicker defaultValue={value} size="large" onChange={onChange} />
      <S.ColorText color={value}>{value}</S.ColorText>
    </>
  );

  const renderSliderWithInput = (
    config: { min: number; max: number },
    value: number,
    onChange: (value: number) => void
  ) => (
    <>
      <Slider
        min={config.min}
        max={config.max}
        onChange={onChange}
        value={typeof value === "number" ? value : 0}
        style={INPUT_STYLES.SLIDER_FULL_WIDTH}
      />
      <InputNumber
        min={config.min}
        max={config.max}
        style={INPUT_STYLES.INPUT_NUMBER_MARGIN}
        value={value}
        onChange={onChange}
        onPressEnter={e =>
          onChange(Number((e.target as HTMLInputElement).value))
        }
      />
    </>
  );

  const renderRadioGroup = (
    items: any[],
    currentValue: any,
    onChange: (value: any) => void,
    getLabel?: (item: any) => string
  ) => (
    <S.SectionCheckWrap>
      {items.map(item => (
        <RadioItem
          key={item.value || item}
          onClickRadio={() => onChange(item.value || item)}
          checked={currentValue === (item.value || item)}
          content={getLabel ? getLabel(item) : `${item}px`}
        />
      ))}
    </S.SectionCheckWrap>
  );

  return (
    <>
      <S.Section>
        <S.SectionTitle>{SECTION_TEXTS.WIDGET_TITLE}</S.SectionTitle>
        <S.WidgetPreviewWrap>
          <S.WidgetPreviewBox preset={props.widget}>
            <S.WidgetPreviewText preset={""}>
              {SECTION_TEXTS.WIDGET_PREVIEW}
            </S.WidgetPreviewText>
          </S.WidgetPreviewBox>
          <S.WidgetLorem src="/꼬솜.png" />
        </S.WidgetPreviewWrap>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>
                {FIELD_LABELS.WIDGET.BACKGROUND}
              </S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              {renderColorPicker(props.widget.background, value =>
                props.updateDesignSetting(
                  "widget.background",
                  value.toRgbString()
                )
              )}
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>위젯 라인 컬러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <ColorPicker
                defaultValue={props.widget.borderColor}
                size="large"
                onChange={value => {
                  props.updateDesignSetting(
                    "widget.borderColor",
                    value.toRgbString()
                  );
                }}
              />
              <S.ColorText color={props.widget.borderColor}>
                {props.widget.borderColor}
              </S.ColorText>
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>위젯 모서리 둥글기</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {radiusTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    props.updateDesignSetting("widget.borderRadius", el);
                  }}
                  checked={props.widget.borderRadius === el}
                  content={`${el}px`}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>위젯 라인 타입</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {lineTypes.map(el => (
                <RadioItem
                  key={el.value}
                  onClickRadio={() => {
                    props.updateDesignSetting("widget.borderStyle", el.value);
                  }}
                  checked={props.widget.borderStyle === el.value}
                  content={el.label}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>위젯 라인 굵기</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Slider
                min={1}
                max={5}
                onChange={value => {
                  props.updateDesignSetting("widget.borderWidth", value);
                }}
                value={
                  typeof props.widget.borderWidth === "number"
                    ? props.widget.borderWidth
                    : 0
                }
                style={{
                  width: "100%"
                }}
              />
              <InputNumber
                min={1}
                max={5}
                style={{
                  margin: "0 16px"
                }}
                value={props.widget.borderWidth}
                onChange={value => {
                  props.updateDesignSetting("widget.borderWidth", value);
                }}
                onPressEnter={e =>
                  props.updateDesignSetting(
                    "widget.borderWidth",
                    Number((e.target as HTMLInputElement).value)
                  )
                }
              />
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>위젯 블러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Slider
                min={0}
                max={20}
                onChange={value => {
                  props.updateDesignSetting("widget.blur", value);
                }}
                value={
                  typeof props.widget.blur === "number" ? props.widget.blur : 0
                }
                style={{
                  width: "100%"
                }}
              />
              <InputNumber
                min={1}
                max={20}
                style={{
                  margin: "0 16px"
                }}
                value={props.widget.blur}
                onChange={value => {
                  props.updateDesignSetting("widget.blur", value);
                }}
                onPressEnter={e =>
                  props.updateDesignSetting(
                    "widget.blur",
                    Number((e.target as HTMLInputElement).value)
                  )
                }
              />
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>위젯 보더 이미지 (옵션)</S.SectionCategory>
              <S.SectionDesc>권장 90 * 90</S.SectionDesc>
            </S.SectionTextBox>
            <S.SectionImageBox></S.SectionImageBox>
            <S.SectionButtonBox>
              <Button
                icon={<Trash2 size={14} />}
                onClick={() => {
                  props.updateDesignSetting("widget.borderImage", "");
                }}
              >
                비우기
              </Button>
            </S.SectionButtonBox>
          </S.SectionBox>
        </S.SectionWrap>
      </S.Section>
      <DivideLine margin={DIVIDER_MARGIN} />
      <S.Section>
        <S.SectionTitle>{SECTION_TEXTS.CARD_TITLE}</S.SectionTitle>
        <S.WidgetPreviewWrap>
          <S.CardPreviewBox preset={getCardPreset()}>
            <S.CardPreviewText preset={props.card.type}>
              {SECTION_TEXTS.CARD_PREVIEW}
            </S.CardPreviewText>
          </S.CardPreviewBox>
          <S.WidgetLorem src="/꼬솜.png" />
        </S.WidgetPreviewWrap>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>프리셋</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {presetTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    applyPreset(el);
                  }}
                  checked={props.card.type === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          {props.card.type === PRESET_TYPES.CUSTOM && (
            <>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>카드 배경 컬러</S.SectionCategory>
                </S.SectionTextBox>
                <S.SectionInputBox>
                  <ColorPicker
                    defaultValue={props.card.background}
                    size="large"
                    onChange={value => {
                      props.updateDesignSetting(
                        "card.background",
                        value.toRgbString()
                      );
                    }}
                  />
                  <S.ColorText color={props.card.background}>
                    {props.card.background}
                  </S.ColorText>
                </S.SectionInputBox>
              </S.SectionBox>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>카드 라인 컬러</S.SectionCategory>
                </S.SectionTextBox>
                <S.SectionInputBox>
                  <S.ColorPickerBox>
                    <ColorPicker
                      defaultValue={props.card.borderColor}
                      size="large"
                      onChange={value => {
                        props.updateDesignSetting(
                          "card.borderColor",
                          value.toRgbString()
                        );
                      }}
                    />
                    <S.ColorText color={props.card.borderColor}>
                      {props.card.borderColor}
                    </S.ColorText>
                  </S.ColorPickerBox>
                  <S.ColorPickerBox>
                    <ColorPicker
                      defaultValue={props.card.borderActiveColor}
                      size="large"
                      onChange={value => {
                        props.updateDesignSetting(
                          "card.borderActiveColor",
                          value.toRgbString()
                        );
                      }}
                    />
                    <S.ColorText color={props.card.borderActiveColor}>
                      {props.card.borderActiveColor}
                    </S.ColorText>
                  </S.ColorPickerBox>
                </S.SectionInputBox>
              </S.SectionBox>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>카드 모서리 둥글기</S.SectionCategory>
                </S.SectionTextBox>
                <S.SectionCheckWrap>
                  {radiusTypes.map(el => (
                    <RadioItem
                      key={el}
                      onClickRadio={() => {
                        props.updateDesignSetting("card.borderRadius", el);
                      }}
                      checked={props.card.borderRadius === el}
                      content={`${el}px`}
                    />
                  ))}
                </S.SectionCheckWrap>
              </S.SectionBox>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>카드 라인 타입</S.SectionCategory>
                </S.SectionTextBox>
                <S.SectionCheckWrap>
                  {lineTypes.map(el => (
                    <RadioItem
                      key={el.value}
                      onClickRadio={() => {
                        props.updateDesignSetting("card.borderStyle", el.value);
                      }}
                      checked={props.card.borderStyle === el.value}
                      content={el.label}
                    />
                  ))}
                </S.SectionCheckWrap>
              </S.SectionBox>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>카드 라인 굵기</S.SectionCategory>
                </S.SectionTextBox>
                <S.SectionInputBox>
                  <Slider
                    min={1}
                    max={5}
                    onChange={value => {
                      props.updateDesignSetting("card.borderWidth", value);
                    }}
                    value={
                      typeof props.card.borderWidth === "number"
                        ? props.card.borderWidth
                        : 0
                    }
                    style={{
                      width: "100%"
                    }}
                  />
                  <InputNumber
                    min={1}
                    max={5}
                    style={{
                      margin: "0 16px"
                    }}
                    value={props.card.borderWidth}
                    onChange={value => {
                      props.updateDesignSetting("card.borderWidth", value);
                    }}
                    onPressEnter={e =>
                      props.updateDesignSetting(
                        "card.borderWidth",
                        Number((e.target as HTMLInputElement).value)
                      )
                    }
                  />
                </S.SectionInputBox>
              </S.SectionBox>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>카드 블러</S.SectionCategory>
                </S.SectionTextBox>
                <S.SectionInputBox>
                  <Slider
                    min={0}
                    max={20}
                    onChange={value => {
                      props.updateDesignSetting("card.blur", value);
                    }}
                    value={
                      typeof props.card.blur === "number" ? props.card.blur : 0
                    }
                    style={{
                      width: "100%"
                    }}
                  />
                  <InputNumber
                    min={0}
                    max={20}
                    style={{
                      margin: "0 16px"
                    }}
                    value={props.card.blur}
                    onChange={value => {
                      props.updateDesignSetting("card.blur", value);
                    }}
                    onPressEnter={e =>
                      props.updateDesignSetting(
                        "card.blur",
                        Number((e.target as HTMLInputElement).value)
                      )
                    }
                  />
                </S.SectionInputBox>
              </S.SectionBox>
              <S.SectionBox>
                <S.SectionTextBox>
                  <S.SectionCategory>카드 보더 이미지 (옵션)</S.SectionCategory>
                  <S.SectionDesc>권장 90 * 90</S.SectionDesc>
                </S.SectionTextBox>
                <S.SectionImageBox></S.SectionImageBox>
                <S.SectionButtonBox>
                  <Button
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      props.updateDesignSetting("card.borderImage", "");
                    }}
                  >
                    비우기
                  </Button>
                </S.SectionButtonBox>
              </S.SectionBox>
            </>
          )}
        </S.SectionWrap>
      </S.Section>
    </>
  );
}
