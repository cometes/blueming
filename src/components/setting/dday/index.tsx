import { useTheme } from "@emotion/react";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Plus } from "lucide-react";
import { Button, message, Popconfirm, PopconfirmProps } from "antd";
import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const MAX_DDAY_COUNT = 8;
const DDAY_BROADCAST_CHANNEL = "ddayUpdated";

interface DdayItem {
  id: string;
  uniqueId: string;
  title: string;
  date: string;
  image: string;
  target: string;
}

import * as S from "../../../../pages/setting/general/style";
import { useModal } from "../../../../etc/hooks/useModal";
import DdayItem from "../../../common/items/dday";
import DdayAddModal from "../../../common/modals/dday";
import { setSettingsDday } from "../../../../etc/queries/setSettingsDday";
import { useSetting } from "../../../../etc/contexts/settings";

export default function MainDdaySetting() {
  const theme = useTheme();
  const [thumbnail, setThumbnail] = useState("");
  const [ddayList, setDdayList] = useState<DdayItem[]>([]);
  const { main } = useSetting();

  useEffect(() => {
    if (main?.dday && Array.isArray(main.dday)) {
      setDdayList(main.dday);
    }
  }, [main?.dday]);

  const { isModalOpen, setIsModalOpen, showModal, cancelModal } = useModal();

  const handleAddDday = useCallback(
    (ddayData: Omit<DdayItem, "id" | "uniqueId">) => {
      if (ddayList.length >= MAX_DDAY_COUNT) {
        message.error(
          `최대 ${MAX_DDAY_COUNT}개의 디데이까지 추가할 수 있습니다.`
        );
        return;
      }

      const newDday = {
        id: `${ddayList.length + 1}`,
        uniqueId: uuidv4(),
        title: ddayData.title,
        date: ddayData.date,
        image: ddayData.image,
        target: ddayData.target
      };

      setDdayList([...ddayList, newDday]);
    },
    [ddayList]
  );

  const handleDeleteDday = useCallback(
    (id: string) => {
      setDdayList(ddayList.filter(dday => dday.id !== id));
    },
    [ddayList]
  );

  const handleDragEnd = useCallback(
    (result: {
      destination?: { index: number };
      source: { index: number };
    }) => {
      const { destination, source } = result;

      if (!destination || destination.index === source.index) return;

      const newDdayList = [...ddayList];
      const [movedItem] = newDdayList.splice(source.index, 1);
      newDdayList.splice(destination.index, 0, movedItem);

      const reorderedDdayList = newDdayList.map((dday, index) => ({
        ...dday,
        id: `${index + 1}`
      }));
      setDdayList(reorderedDdayList);
    },
    [ddayList]
  );

  const handleUpdateDday = useCallback(
    (index: number, updatedDday: Partial<DdayItem>) => {
      const updatedDdays = [...ddayList];
      updatedDdays[index] = { ...updatedDdays[index], ...updatedDday };
      setDdayList(updatedDdays);
    },
    [ddayList]
  );

  const broadcastDdayUpdate = (data: DdayItem[]) => {
    const channel = new BroadcastChannel(DDAY_BROADCAST_CHANNEL);
    channel.postMessage({
      dday: data,
      timestamp: Date.now()
    });
    channel.close();
  };

  const onClickSubmit = async () => {
    try {
      await setSettingsDday(ddayList);
      broadcastDdayUpdate(ddayList);
      message.success("성공적으로 디데이를 저장했습니다.");
    } catch (error) {
      console.error("디데이 저장 실패:", error);
      message.error("디데이를 저장하지 못했습니다.");
    }
  };

  const onClickReset = async () => {
    try {
      const emptyDdayList = [];
      await setSettingsDday(emptyDdayList);
      setDdayList(emptyDdayList);
      broadcastDdayUpdate(emptyDdayList);
      message.success("디데이 설정이 초기화되었습니다.");
    } catch (error) {
      console.error("디데이 초기화 실패:", error);
      message.error("디데이 초기화에 실패했습니다.");
    }
  };

  const cancel: PopconfirmProps["onCancel"] = e => {
    message.error("취소되었습니다.");
  };

  return (
    <>
      <DdayAddModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        showModal={showModal}
        cancelModal={cancelModal}
        thumbnail={thumbnail}
        setThumbnail={setThumbnail}
        onClickUpload={handleAddDday}
      />
      <S.Section>
        <S.SectionTitle>디데이 설정</S.SectionTitle>
        <S.SectionSubtitle>디데이를 설정합니다.</S.SectionSubtitle>
        <S.SectionWrap>
          <S.SlideAdd>
            <Button icon={<Plus size={14} />} onClick={showModal}>
              디데이 추가하기
            </Button>
          </S.SlideAdd>
          <S.SlideWrap>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="ddayList">
                {provided => (
                  <S.SlideBox
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {ddayList.map((ddayItem, index) => (
                      <DdayItem
                        key={ddayItem.uniqueId}
                        menu={ddayItem}
                        index={index}
                        onUpdateMenu={updatedDday =>
                          handleUpdateDday(index, updatedDday)
                        }
                        handleDeleteMenu={handleDeleteDday}
                        thumbnail={thumbnail}
                        setThumbnail={setThumbnail}
                        handleAddDday={handleAddDday}
                      />
                    ))}
                    {provided.placeholder}
                  </S.SlideBox>
                )}
              </Droppable>
            </DragDropContext>
          </S.SlideWrap>
        </S.SectionWrap>
      </S.Section>
      <S.SectionSubmitBox>
        <Popconfirm
          title="정말 레이아웃을 초기화할까요?"
          onConfirm={onClickReset}
          onCancel={cancel}
          okText="O"
          cancelText="X"
        >
          <Button danger>초기화하기</Button>
        </Popconfirm>

        <Button onClick={onClickSubmit}>저장하기</Button>
      </S.SectionSubmitBox>
    </>
  );
}
