import {
  Button,
  ColorPicker,
  ConfigProvider,
  Input,
  Popconfirm,
  Radio,
  Select
} from "antd";
import * as S from "../../../../pages/setting/general/style";
import DivideLine from "../../../common/divideLine";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import MenuItem from "../../../common/items/menu";
import { useMenu } from "../../../../etc/hooks/useMenu";
import RadioItem from "../../../common/items/radio";
import { useModal } from "../../../../etc/hooks/useModal";
import ImageUploadModal from "../../../common/upload/thumbnail";
import { ChevronDown, ImagePlus, Plus, Trash2 } from "lucide-react";
import MenuAddModal from "../../../common/modals/menu";

export default function MenuSetting() {
  const {
    handleSubmit,
    handleAddMenu,
    updateMenuSetting,
    setCurrentMenu,
    setValue,
    currentMenu,
    theme,
    formState,
    getValues,
    boardArr,
    handleUpdateMenu,
    handleDeleteMenu,
    handleDragEnd,
    menus,
    menuTypes,
    align,
    textAlign,
    bgType,
    menuDesign,
    updateMenuDesign,
    handleReset,
    handleSave,
    bgThumbnail,
    setBgThumnail
  } = useMenu();

  const { showModal, isModalOpen, setIsModalOpen, cancelModal } = useModal();
  const {
    showModal: showMenuModal,
    isModalOpen: isMenuModalOpen,
    setIsModalOpen: setIsMenuModalOpen,
    cancelModal: cancelMenuModal
  } = useModal();
  const {
    showModal: showLogoModal,
    isModalOpen: isLogoModalOpen,
    setIsModalOpen: setIsLogoModalOpen,
    cancelModal: cancelLogoModal
  } = useModal();

  return (
    <>
      <ImageUploadModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        showModal={showModal}
        cancelModal={cancelModal}
        thumbnail={bgThumbnail}
        setThumbnail={setBgThumnail}
        onClickUpload={value => {
          updateMenuDesign("backgroundImage", value);
        }}
      />
      <ImageUploadModal
        isModalOpen={isLogoModalOpen}
        setIsModalOpen={setIsLogoModalOpen}
        showModal={showLogoModal}
        cancelModal={cancelLogoModal}
        thumbnail={bgThumbnail}
        setThumbnail={setBgThumnail}
        onClickUpload={value => {
          updateMenuSetting("logo.image", value);
        }}
      />
      <MenuAddModal
        isModalOpen={isMenuModalOpen}
        setIsModalOpen={setIsMenuModalOpen}
        onAddMenu={handleAddMenu}
        boardArr={boardArr}
        cancelModal={cancelMenuModal}
      />
      <S.Section>
        <S.SectionTitle>메뉴 디자인</S.SectionTitle>
        <S.SectionWrap>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>메뉴 레이아웃 배치</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {align.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setValue("align", el);
                    updateMenuDesign("align", el);
                  }}
                  checked={menuDesign.align === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>메뉴 폰트 컬러</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionInputBox>
              <ColorPicker
                value={menuDesign.fontColor}
                onChange={value => {
                  updateMenuSetting("font.color", value.toRgbString());
                }}
                size="large"
              />
              <S.ColorText color={menuDesign.fontColor}>
                {menuDesign.fontColor}
              </S.ColorText>
            </S.SectionInputBox>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>메뉴 텍스트 정렬</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {textAlign.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setValue("textAlign", el);
                    updateMenuDesign("textAlign", el);
                  }}
                  checked={menuDesign.textAlign === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>메뉴 로고 타입</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {menuTypes.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setValue("logoType", el);
                    updateMenuDesign("logoType", el);
                  }}
                  checked={menuDesign.logoType === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          {menuDesign.logoType == "텍스트" && (
            <S.SectionBox>
              <S.SectionTextBox>
                <S.SectionCategory>로고 타이틀</S.SectionCategory>
              </S.SectionTextBox>
              <S.SectionInputBox>
                <Input 
                  placeholder="로고 타이틀을 입력해주세요" 
                  value={menuDesign.logoText || ""} 
                  onChange={(e) => {
                    updateMenuSetting("logo.text", e.target.value);
                  }} 
                />
              </S.SectionInputBox>
            </S.SectionBox>
          )}
          {menuDesign.logoType == "이미지" && (
            <S.SectionBox>
              <S.SectionTextBox>
                <S.SectionCategory>로고 이미지</S.SectionCategory>
                <S.SectionDesc>메뉴에 표시될 로고 이미지를 업로드하세요</S.SectionDesc>
              </S.SectionTextBox>
              <S.SectionImageBox>
                {menuDesign.logoImage ? (
                  <S.SectionImage src={menuDesign.logoImage} />
                ) : (
                  <S.SectionImageItem onClick={showLogoModal}>
                    <ImagePlus
                      size={28}
                      color="#9BA2A8"
                      absoluteStrokeWidth={true}
                    />
                    <S.UploadText>Upload Image</S.UploadText>
                  </S.SectionImageItem>
                )}
              </S.SectionImageBox>
              <S.SectionButtonBox>
                <Button
                  icon={<Trash2 size={14} />}
                  onClick={() => {
                    updateMenuSetting("logo.image", "");
                  }}
                >
                  비우기
                </Button>
              </S.SectionButtonBox>
            </S.SectionBox>
          )}
          <S.SectionBox>
            <S.SectionTextBox>
              <S.SectionCategory>메뉴 배경 타입</S.SectionCategory>
            </S.SectionTextBox>
            <S.SectionCheckWrap>
              {bgType.map(el => (
                <RadioItem
                  key={el}
                  onClickRadio={() => {
                    setValue("bgType", el);
                    updateMenuDesign("bgType", el);
                  }}
                  checked={menuDesign.bgType === el}
                  content={el}
                />
              ))}
            </S.SectionCheckWrap>
          </S.SectionBox>
          {menuDesign.bgType == "단색" && (
            <S.SectionBox>
              <S.SectionTextBox>
                <S.SectionCategory>메뉴 배경 컬러</S.SectionCategory>
              </S.SectionTextBox>
              <S.SectionInputBox>
                <ColorPicker
                  value={menuDesign.backgroundColor}
                  onChange={value => {
                    updateMenuSetting("background.color", value.toRgbString());
                  }}
                  size="large"
                />
                <S.ColorText color={menuDesign.backgroundColor}>
                  {menuDesign.backgroundColor}
                </S.ColorText>
              </S.SectionInputBox>
            </S.SectionBox>
          )}
          {menuDesign.bgType == "이미지" && (
            <S.SectionBox>
              <S.SectionTextBox>
                <S.SectionCategory>배경 이미지</S.SectionCategory>
                <S.SectionDesc></S.SectionDesc>
              </S.SectionTextBox>
              <S.SectionImageBox>
                {menuDesign.backgroundImage ? (
                  <S.SectionImage src={menuDesign.backgroundImage} />
                ) : (
                  <S.SectionImageItem onClick={showModal}>
                    <ImagePlus
                      size={28}
                      color="#9BA2A8"
                      absoluteStrokeWidth={true}
                    />
                    <S.UploadText>Upload Image</S.UploadText>
                  </S.SectionImageItem>
                )}
              </S.SectionImageBox>
              <S.SectionButtonBox>
                <Button
                  icon={<Trash2 size={14} />}
                  onClick={() => {
                    updateMenuSetting("background.image", "");
                  }}
                >
                  비우기
                </Button>
              </S.SectionButtonBox>
            </S.SectionBox>
          )}
        </S.SectionWrap>
      </S.Section>
      <DivideLine margin="60px 0 " />
      <S.Section>
        <S.SectionTitle>메뉴 설정</S.SectionTitle>
        <S.SectionSubtitle>
          메뉴 텍스트 및 이미지를 설정합니다. 드래그 앤 드롭으로 순서를 변경할
          수 있습니다. 최대 8개까지 추가 가능합니다.
        </S.SectionSubtitle>
        <S.SectionWrap>
          <S.SlideAdd>
            <Button onClick={showMenuModal} icon={<Plus size={14} />}>
              메뉴 추가하기
            </Button>
          </S.SlideAdd>
          <S.SlideWrap>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="menus">
                {provided => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {menus.map((menu, index) => (
                      <MenuItem
                        key={menu.uniqueId}
                        menu={menu}
                        index={index}
                        boardArr={boardArr}
                        onUpdateMenu={updatedMenu =>
                          handleUpdateMenu(index, updatedMenu)
                        }
                        handleDeleteMenu={handleDeleteMenu}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </S.SlideWrap>
        </S.SectionWrap>
      </S.Section>
      <S.SectionSubmitBox>
        <Popconfirm
          title="정말 메뉴 설정을 초기화할까요?"
          onConfirm={handleReset}
          okText="O"
          cancelText="X"
        >
          <Button danger>초기화하기</Button>
        </Popconfirm>

        <Button onClick={handleSave}>저장하기</Button>
      </S.SectionSubmitBox>
    </>
  );
}
