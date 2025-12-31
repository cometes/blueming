// components/FreeBoardInfo.tsx
import React from 'react';
import * as S from '../style';

const FreeBoardInfo: React.FC = () => {
  return (
    <S.InfoWrap>
      <S.InfoTitle>스티커보드 편집</S.InfoTitle>
      <S.InfoBox>
        <S.InfoList>자유롭게 캔버스를 편집할 수 있습니다.</S.InfoList>
        <S.InfoList>
          레이아웃에서 설정한 스티커보드의 비율대로 캔버스가 생성됩니다.
        </S.InfoList>
        <S.InfoList>
          텍스트 영역에서 내용을 입력하고 이미지 영역에서 스티커를 추가할 수
          있습니다.
        </S.InfoList>
        <S.InfoList>
          토글 버튼으로 텍스트를 맨 위로, 맨 아래로 변경할 수 있습니다.
        </S.InfoList>
      </S.InfoBox>
    </S.InfoWrap>
  );
};

export default FreeBoardInfo;