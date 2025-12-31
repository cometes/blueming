// components/FreeBoardToggle.tsx
import React from 'react';
import { Switch } from 'antd';
import { useFreeBoardContext } from '../context/FreeBoardProviders';
import * as S from '../style';

const FreeBoardToggle: React.FC = () => {
  const { imageEditOn, isTextTop, toggleSwitch, toggleZindex } = useFreeBoardContext();

  return (
    <S.ToggleWrap>
      <S.ToggleBox>
        <S.Title>텍스트 영역 편집하기</S.Title>
        <Switch onChange={toggleSwitch} />
        <S.Title>이미지 영역 편집하기</S.Title>
      </S.ToggleBox>
      {imageEditOn && (
        <S.ToggleBox>
          <S.Title>텍스트 맨위로</S.Title>
          <Switch checked={isTextTop} onChange={toggleZindex} />
        </S.ToggleBox>
      )}
    </S.ToggleWrap>
  );
};

export default FreeBoardToggle;