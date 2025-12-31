import { Input, Switch } from "antd";
import * as S from "../../../../pages/setting/general/style";
import DivideLine from "../../../common/divideLine";
import RadioItem from "../../../common/items/radio";
import { useState } from "react";

export default function EffectSetting() {
  const menuTypes = [
    "눈",
    "비",
    "별똥별",
    "밤하늘",
    "프리즘",
    "안개",
    "연기",
    "콘페티",
    "불꽃놀이",
    "비눗방울",
    "꽃비",
    "커스텀"
  ];
  const [currentMenu, setCurrentMenu] = useState("");

  return (
    <>
      <S.Section>
        <S.SectionTitle>배경이펙트 설정</S.SectionTitle>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>이펙트 활성화</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <Switch />
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>이펙트 타입</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {menuTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setCurrentMenu(el);
                  }}
                  checked={currentMenu === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>이펙트 방향</S.SectionCategory>
            </S.SectionTextBox>
            {/* <S.SectionCheckWrap>
              {menuTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setCurrentMenu(el);
                  }}
                  checked={currentMenu === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap> */}
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>이펙트 양</S.SectionCategory>
            </S.SectionTextBox>
            {/* <S.SectionCheckWrap>
              {menuTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setCurrentMenu(el);
                  }}
                  checked={currentMenu === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap> */}
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>이펙트 속도</S.SectionCategory>
            </S.SectionTextBox>
            {/* <S.SectionCheckWrap>
              {menuTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setCurrentMenu(el);
                  }}
                  checked={currentMenu === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap> */}
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>이펙트 크기</S.SectionCategory>
            </S.SectionTextBox>
            {/* <S.SectionCheckWrap>
              {menuTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setCurrentMenu(el);
                  }}
                  checked={currentMenu === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap> */}
          </S.SectionBox>
        </S.SectionWrap>
      </S.Section>

      <DivideLine margin={"60px 0"} />
    </>
  );
}
