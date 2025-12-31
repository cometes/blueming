// components/TextEditor.tsx
import React from 'react';
import { Editable, Slate } from 'slate-react';
import StickerBoardToolbar from './StickerBoardToolbar';
import { useFreeBoardContext } from '../context/FreeBoardProviders';
import * as S from '../style';

const TextEditor: React.FC = () => {
  const {
    editor,
    content,
    getContent,
    currentAlign,
    setCurrentAlign,
    renderElement,
    renderLeaf,
    ratio,
    canvasRef
  } = useFreeBoardContext();

  return (
    <Slate
      editor={editor}
      initialValue={JSON.parse(content)}
      onChange={getContent}
      key={content}
    >
      <S.ToolbarBox>
        <StickerBoardToolbar
          currentAlign={currentAlign}
          setCurrentAlign={setCurrentAlign}
        />
      </S.ToolbarBox>
      <S.EditWrap>
        <S.Canvas ref={canvasRef} ratio={ratio}>
          <S.EditorWrap>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              style={{
                height: "100%",
                flexGrow: 1,
                outline: "none"
              }}
            />
          </S.EditorWrap>
        </S.Canvas>
      </S.EditWrap>
    </Slate>
  );
};

export default TextEditor;