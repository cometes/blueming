import { Draggable } from "react-beautiful-dnd";
import * as S from "../../../../pages/setting/general/style";
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  message,
  Popconfirm,
  PopconfirmProps,
  Select
} from "antd";
import { useEffect, useState, useCallback, memo } from "react";
import { useTheme } from "@emotion/react";
import { Calendar, ImagePlus, Trash2, X } from "lucide-react";
import { useModal } from "../../../../etc/hooks/useModal";
import dayjs from "dayjs";
import ImageUploadModal from "../../upload/thumbnail";

function DdayItem(props) {
  const theme = useTheme();

  const [imageActive, setImageActive] = useState(false);
  const [bgThumbnail, setBgThumbnail] = useState(props.menu.image || "");
  const [tempThumbnail, setTempThumbnail] = useState("");

  // Initialize thumbnail from props when component mounts
  useEffect(() => {
    setBgThumbnail(props.menu.image || "");
  }, [props.menu.image]);

  const handleChange = useCallback(
    (field, value) => {
      props.onUpdateMenu({ [field]: value });
    },
    [props.onUpdateMenu]
  );

  const onChangeTarget = useCallback(
    e => {
      handleChange("target", e.target.checked);
    },
    [handleChange]
  );

  const onChangeDdayTitle = useCallback(
    e => {
      handleChange("title", e.target.value);
    },
    [handleChange]
  );

  const onChangeDdayDate = useCallback(
    date => {
      handleChange("date", date ? date.format("YYYY-MM-DD") : "");
    },
    [handleChange]
  );

  const { showModal, isModalOpen, setIsModalOpen, cancelModal } = useModal();

  const handleImageRemove = useCallback(() => {
    setBgThumbnail("");
    handleChange("image", "");
  }, [handleChange]);

  // Handle image upload and update menu data - only called when upload button is clicked
  const handleImageUpload = useCallback(
    imageUrl => {
      setBgThumbnail(imageUrl);
      handleChange("image", imageUrl);
      setTempThumbnail(""); // Clear temp thumbnail after successful upload
    },
    [handleChange]
  );

  const handleDeleteClick = useCallback(() => {
    props.handleDeleteMenu(props.menu.id);
  }, [props.handleDeleteMenu, props.menu.id]);

  const toggleImageActive = useCallback(() => {
    setImageActive(prev => !prev);
  }, []);

  const cancel: PopconfirmProps["onCancel"] = e => {
    message.error("취소되었습니다.");
  };

  return (
    <>
      <ImageUploadModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        showModal={showModal}
        cancelModal={() => {
          setTempThumbnail(""); // Clear temp thumbnail when modal is cancelled
          cancelModal();
        }}
        thumbnail={tempThumbnail}
        setThumbnail={setTempThumbnail}
        onClickUpload={handleImageUpload}
      />
      <Draggable
        key={props.menu.uniqueId} // 고유 식별자 사용
        draggableId={props.menu.uniqueId} // 고유 식별자 사용
        index={props.index}
      >
        {provided => (
          <S.MenuWrap ref={provided.innerRef} {...provided.draggableProps}>
            <S.MenuCategory {...provided.dragHandleProps}>
              {`디데이 ${props.menu.id}`}
            </S.MenuCategory>
            <S.MenuBox>
              <S.DdayInfoWrap>
                <S.DdayInfoBox>
                  <Input
                    placeholder="디데이 제목을 입력하세요."
                    onChange={onChangeDdayTitle}
                    defaultValue={props.menu.title || ""}
                    style={{
                      width: "calc(100% - 110px)"
                    }}
                  />
                  <DatePicker
                    value={props.menu.date ? dayjs(props.menu.date) : null}
                    onChange={onChangeDdayDate}
                    style={{
                      width: "110px"
                    }}
                    format="YY. MM. DD"
                    placeholder="날짜 선택"
                    suffixIcon={
                      <Calendar size={16} color={theme.palette.text.textSub} />
                    }
                  />
                </S.DdayInfoBox>

                <S.MenuInfoDesc onClick={toggleImageActive}>
                  이미지
                </S.MenuInfoDesc>
                <S.MenuImageWrap
                  className={imageActive || bgThumbnail ? "active slide" : ""}
                >
                  {bgThumbnail ? (
                    <>
                      <S.SectionImage src={bgThumbnail} />
                      <S.ImageRemoveButton onClick={handleImageRemove}>
                        <X color={theme.palette.text.textLight} size={12} />
                      </S.ImageRemoveButton>
                    </>
                  ) : (
                    <S.SectionImageItem onClick={showModal}>
                      <ImagePlus
                        size={28}
                        color="#9BA2A8"
                        absoluteStrokeWidth={true}
                      />
                      <S.UploadText>이미지 업로드</S.UploadText>
                    </S.SectionImageItem>
                  )}
                </S.MenuImageWrap>
              </S.DdayInfoWrap>
              <S.MenuAllowWrap>
                <S.MenuAllowBox>
                  <Checkbox
                    checked={props.menu.target}
                    onChange={onChangeTarget}
                  />
                  <S.MenuAllowDesc>위젯에 추가</S.MenuAllowDesc>
                </S.MenuAllowBox>
                <S.MenuSubmitBox className="slide">
                  <Popconfirm
                    title="이 디데이를 삭제할까요?"
                    onConfirm={handleDeleteClick}
                    onCancel={cancel}
                    okText="O"
                    cancelText="X"
                  >
                    <Button icon={<Trash2 size={14} />}>삭제</Button>
                  </Popconfirm>
                </S.MenuSubmitBox>
              </S.MenuAllowWrap>
            </S.MenuBox>
          </S.MenuWrap>
        )}
      </Draggable>
    </>
  );
}

export default memo(DdayItem);
