import { useEffect, useState } from "react";
import { useTheme } from "@emotion/react";
import { Button, message, Popconfirm, PopconfirmProps } from "antd";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import * as S from "../../../../pages/setting/general/style";
import SlideItem from "../../../common/items/slide";
import ImageUploadModal from "../../../common/upload/thumbnail";
import { useModal } from "../../../../etc/hooks/useModal";
import { setSettingsMainSlide } from "../../../../etc/queries/setSettngMainStickerSlide";
import { useSetting } from "../../../../etc/contexts/settings";

interface SlideItem {
  id: string;
  uniqueId: string;
  url: string;
  image: string;
  target: boolean;
}

interface DragResult {
  destination?: { index: number };
  source: { index: number };
}

const MAX_SLIDES = 8;
const BROADCAST_CHANNEL = "slideUpdated";

const MESSAGES = {
  MAX_SLIDES_ERROR: "최대 8장의 슬라이드까지 추가할 수 있습니다.",
  SAVE_SUCCESS: "성공적으로 슬라이드 배너를 저장했습니다.",
  SAVE_ERROR: "슬라이드 배너를 저장하지 못했습니다.",
  RESET_SUCCESS: "슬라이드 배너가 초기화되었습니다.",
  RESET_ERROR: "슬라이드 배너 초기화에 실패했습니다."
} as const;

const TEXTS = {
  TITLE: "슬라이드 배너 편집하기",
  SUBTITLE:
    "슬라이드 배너 이미지를 설정합니다. 드래그 앤 드롭으로 순서를 변경할 수 있습니다. 최대 8장까지 추가 가능합니다.",
  ADD_BUTTON: "슬라이드 추가하기",
  RESET_BUTTON: "초기화하기",
  SAVE_BUTTON: "저장하기"
} as const;

export default function SlideSetting() {
  const theme = useTheme();
  const { main } = useSetting();
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [thumbnail, setThumbnail] = useState<string>("");

  useEffect(() => {
    if (main?.slide) {
      setSlides(main.slide);
    }
  }, [main?.slide]);

  const handleAddMenu = (image: string) => {
    if (slides.length >= MAX_SLIDES) {
      message.error(MESSAGES.MAX_SLIDES_ERROR);
      return;
    }

    const newSlide: SlideItem = {
      id: `${slides.length + 1}`,
      uniqueId: uuidv4(),
      url: "",
      image,
      target: false
    };

    setSlides([...slides, newSlide]);
  };

  const handleDeleteMenu = (id: string) => {
    setSlides(slides.filter(slide => slide.id !== id));
  };

  const handleDragEnd = (result: DragResult) => {
    const { destination, source } = result;

    if (!destination || destination.index === source.index) return;

    const newSlides = [...slides];
    const [movedItem] = newSlides.splice(source.index, 1);
    newSlides.splice(destination.index, 0, movedItem);

    const reorderedSlides = newSlides.map((slide, index) => ({
      ...slide,
      id: `${index + 1}`
    }));

    setSlides(reorderedSlides);
  };

  const handleUpdateMenu = (
    index: number,
    updatedSlide: Partial<SlideItem>
  ) => {
    const updatedSlides = [...slides];
    updatedSlides[index] = { ...updatedSlides[index], ...updatedSlide };
    setSlides(updatedSlides);
  };

  const broadcastSlideUpdate = (slides: SlideItem[]) => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    channel.postMessage({
      slide: slides,
      timestamp: Date.now()
    });
    channel.close();
  };

  const handleReset = async () => {
    try {
      setSlides([]);

      await setSettingsMainSlide([]);

      broadcastSlideUpdate([]);

      message.success(MESSAGES.RESET_SUCCESS);
    } catch (error) {
      message.error(MESSAGES.RESET_ERROR);
    }
  };

  const onClickSubmit = async () => {
    try {
      await setSettingsMainSlide(slides);

      broadcastSlideUpdate(slides);

      message.success(MESSAGES.SAVE_SUCCESS);
    } catch (error) {
      message.error(MESSAGES.SAVE_ERROR);
    }
  };

  const { isModalOpen, setIsModalOpen, showModal, cancelModal } = useModal();

  const cancel: PopconfirmProps["onCancel"] = e => {
    message.error("취소되었습니다.");
  };

  return (
    <>
      <ImageUploadModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        showModal={showModal}
        cancelModal={cancelModal}
        thumbnail={thumbnail}
        setThumbnail={setThumbnail}
        onClickUpload={handleAddMenu}
      />
      <S.Section>
        <S.SectionTitle>{TEXTS.TITLE}</S.SectionTitle>
        <S.SectionSubtitle>{TEXTS.SUBTITLE}</S.SectionSubtitle>
        <S.SectionWrap>
          <S.SlideAdd>
            <Button icon={<Plus size={14} />} onClick={showModal}>
              {TEXTS.ADD_BUTTON}
            </Button>
          </S.SlideAdd>
          <S.SlideWrap>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="slides">
                {provided => (
                  <S.SlideBox
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {slides.map((slide, index) => (
                      <SlideItem
                        key={slide.uniqueId}
                        menu={slide}
                        index={index}
                        onUpdateMenu={updatedSlide =>
                          handleUpdateMenu(index, updatedSlide)
                        }
                        handleDeleteMenu={handleDeleteMenu}
                      />
                    ))}
                    {provided.placeholder}
                  </S.SlideBox>
                )}
              </Droppable>
            </DragDropContext>
          </S.SlideWrap>
        </S.SectionWrap>
        <S.SectionSubmitBox>
          <Popconfirm
            title="정말 슬라이드 설정을 초기화할까요?"
            onConfirm={handleReset}
            onCancel={cancel}
            okText="O"
            cancelText="X"
          >
            <Button danger>초기화하기</Button>
          </Popconfirm>

          <Button onClick={onClickSubmit}>저장하기</Button>
        </S.SectionSubmitBox>
      </S.Section>
    </>
  );
}
