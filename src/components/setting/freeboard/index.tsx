import { Editable, Slate } from "slate-react";
import * as S from "./style";
import { Modal, Switch } from "antd";
import CustomToolbar from "../../../unit/new/customToolbar";
import Button30px from "../../buttons/button30px";
import { Rnd } from "react-rnd";
import ImageUpload from "../../upload/thumbnail";
import FreeBoardImage from "../../items/freeboardImage";
import { useFreeBoard } from "../../../../etc/hooks/useFreeBoard";
import Button40px from "../../buttons/button40px";
import { useTheme } from "@emotion/react";
import ImageUploadModal from "../../upload/thumbnail";
import { useModal } from "../../../../etc/hooks/useModal";
import { Plus } from "lucide-react";

export default function FreeBoardCustom() {
  const {
    thumbnail,
    addStickerComponent,
    setThumbnail,
    toggleSwitch,
    toggleZindex,
    imageEditOn,
    editor,
    content,
    getContent,
    currentAlign,
    setCurrentAlign,
    renderElement,
    renderLeaf,
    isTextTop,
    viewerElement,
    components,
    updateComponent,
    deleteComponent,
    ratio,
    canvasRef,
    captureAndSaveComponent
  } = useFreeBoard();
  const theme = useTheme();

  const { isModalOpen, setIsModalOpen, showModal, cancelModal } = useModal();

  return (
    <>
      <ImageUploadModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        showModal={showModal}
        cancelModal={cancelModal}
        thumbnail={thumbnail}
        setThumbnail={setThumbnail}
        onClickUpload={addStickerComponent}
      />
      <S.Wrapper>
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
        {!imageEditOn ? (
          <Slate
            editor={editor}
            initialValue={JSON.parse(content)}
            onChange={getContent}
            key={content}
          >
            <S.ToolbarBox>
              <CustomToolbar
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
        ) : (
          <>
            <S.FlexBox>
              <Button30px
                content="이미지 추가하기"
                onClick={showModal}
                icon={Plus}
                background={theme.palette.background.bgDark}
                color={theme.palette.text.textWhite}
              />
            </S.FlexBox>
            <Slate
              editor={editor}
              initialValue={JSON.parse(content)}
              key={content}
            >
              <S.EditWrap>
                <S.Canvas ref={canvasRef} ratio={ratio}>
                  <S.CaptureArea id="capture-area">
                    <S.ImageEditBox>
                      {/* 드래그 및 리사이즈 가능한 컴포넌트 렌더링 */}
                      {components.map(comp => (
                        <Rnd
                          key={comp.id}
                          size={{
                            width: comp.width || "fit-content",
                            height: comp.height || "fit-content"
                          }}
                          position={{
                            x: comp.x,
                            y: comp.y
                          }}
                          style={{
                            zIndex: comp.zIndex,
                            position: "absolute"
                          }}
                          onDragStop={(e, d) => {
                            updateComponent(comp.id, {
                              x: d.x,
                              y: d.y
                            });
                          }}
                          onResizeStop={(
                            e,
                            direction,
                            ref,
                            delta,
                            position
                          ) => {
                            updateComponent(comp.id, {
                              width: parseInt(ref.style.width),
                              height: parseInt(ref.style.height),
                              ...position
                            });
                          }}
                          // bounds="parent" // 부모 컨테이너 내에서 제한
                          dragHandleClassName="drag-handle"
                          lockAspectRatio
                        >
                          <div
                            className="drag-handle"
                            style={{
                              cursor: "move",
                              width: "100%",
                              height: "100%"
                            }}
                          >
                            <FreeBoardImage
                              onDelete={() => deleteComponent(comp.id)}
                              imageUrl={comp.imageUrl}
                            />
                          </div>
                        </Rnd>
                      ))}
                    </S.ImageEditBox>
                    <S.EditorWrap isTextTop={isTextTop}>
                      <Editable
                        readOnly
                        renderElement={viewerElement}
                        renderLeaf={renderLeaf}
                        style={{
                          height: "100%",
                          flexGrow: 1,
                          outline: "none"
                        }}
                      />
                    </S.EditorWrap>
                  </S.CaptureArea>
                </S.Canvas>
              </S.EditWrap>
            </Slate>
            <S.ButtonBox>
              <Button40px
                content="저장하기"
                onClick={captureAndSaveComponent}
              />
            </S.ButtonBox>
          </>
        )}
      </S.Wrapper>
    </>
  );
}
