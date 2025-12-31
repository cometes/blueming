// FreeBoardCustom.tsx
import React from 'react';
import { FreeBoardProviders, useFreeBoardContext } from './context/FreeBoardProviders';
import FreeBoardInfo from './components/FreeBoardInfo';
import FreeBoardToggle from './components/FreeBoardToggle';
import TextEditor from './components/TextEditor';
import ImageEditor from './components/ImageEditor';
import * as S from './style';

// 내부 컴포넌트 - Context를 사용하는 실제 UI
const FreeBoardContent: React.FC = () => {
  const { imageEditOn } = useFreeBoardContext();

  return (
    <S.Wrapper>
      <FreeBoardInfo />
      <FreeBoardToggle />
      {!imageEditOn ? <TextEditor /> : <ImageEditor />}
    </S.Wrapper>
  );
};

// 메인 컴포넌트 - 새로운 통합 Provider로 감싸기
const FreeBoardCustom: React.FC = () => {
  return (
    <FreeBoardProviders>
      <FreeBoardContent />
    </FreeBoardProviders>
  );
};

export default FreeBoardCustom;