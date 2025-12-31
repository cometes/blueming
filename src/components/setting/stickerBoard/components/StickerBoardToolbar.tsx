import * as S from "../../../../unit/new/customToolbar/style";
import { useSlate } from "slate-react";
import H1Button from "../../../editor/customToolbar/h1";
import H2Button from "../../../editor/customToolbar/h2";
import BoldButton from "../../../editor/customToolbar/bold";
import ItalicButton from "../../../editor/customToolbar/italic";
import UnderlineButton from "../../../editor/customToolbar/underline";
import ColorButton from "../../../editor/customToolbar/color";
import BackgroundColorButton from "../../../editor/customToolbar/background";
import BroomButton from "../../../editor/customToolbar/broom";
import QuoteButton from "../../../editor/customToolbar/quote";
import CodeButton from "../../../editor/customToolbar/code";
import BulletListButton from "../../../editor/customToolbar/bulletList";
import AlignButton from "../../../editor/customToolbar/align";
import SizeButton from "../../../editor/customToolbar/size";

interface StickerBoardToolbarProps {
  currentAlign: string;
  setCurrentAlign: (align: string) => void;
}

export default function StickerBoardToolbar(props: StickerBoardToolbarProps) {
  const editor = useSlate();

  return (
    <S.CustomToolbarWrap>
      <SizeButton />
      <H1Button />
      <H2Button />
      <AlignButton
        currentAlign={props.currentAlign}
        setCurrentAlign={props.setCurrentAlign}
      />
      <BoldButton />
      <ItalicButton />
      <UnderlineButton />
      <ColorButton />
      <BackgroundColorButton />
      <BulletListButton />
      <BroomButton />
      <QuoteButton />
      <CodeButton />
      {/* 이미지, 유튜브, 링크 버튼 제거됨 */}
    </S.CustomToolbarWrap>
  );
}
