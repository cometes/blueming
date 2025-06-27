import React, { useState } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms } from "slate";
import axios from "axios";
import { UploadOutlined } from "@ant-design/icons";
import { CustomToolbarBox } from "../icon";
import Button30px from "../../../buttons/button30px";
import { Images } from "lucide-react";
import type { CustomElement, CustomText } from "../../types/slate";

interface ImageButtonProps {
  currentAlign?: string;
}

const ImageButton: React.FC<ImageButtonProps> = ({ currentAlign = "left" }) => {
  const editor = useSlate();
  const [isUrlActive, setIsUrlActive] = useState(false); // FILE/URL 탭 상태
  const [imageUrl, setImageUrl] = useState(""); // URL 입력 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 선택된 파일
  const [fileList, setFileList] = useState<any[]>([]); // 선택된 파일
  const [isPopUp, setIsPopUp] = useState(false); // 팝오버 상태
  const [loading, setLoading] = useState(false); // 로딩 상태

  const insertImage = (url: string): void => {
    const imageNode: CustomElement = {
      type: "image",
      url,
      align: currentAlign as any,
      width: 400,
      height: 300,
      children: [{ text: "" } as CustomText] // 이미지 노드의 자식은 비어 있는 텍스트
    };

    // 이미지 노드 삽입
    Transforms.insertNodes(editor, imageNode);

    // 이미지 아래 빈 줄 추가 여부 검사
    const { selection } = editor;
    if (selection) {
      const currentPath = selection.anchor.path;

      // 현재 노드가 이미지가 아니라면 빈 줄 추가
      const [currentNode] = Editor.node(editor, currentPath);
      if ((currentNode as CustomElement).type !== "paragraph") {
        const paragraphNode: CustomElement = {
          type: "paragraph",
          align: currentAlign as any,
          children: [{ text: "" } as CustomText] // 빈 줄로 사용할 노드
        };
        Transforms.insertNodes(editor, paragraphNode);
      }

      // 커서를 새로 삽입한 빈 줄로 이동
      const lastPath = Editor.path(editor, []);
      Transforms.select(editor, Editor.end(editor, lastPath));
    }

    ReactEditor.focus(editor);
  };

  const handleFileUpload = async (): Promise<void> => {
    if (!selectedFile) {
      message.warning("파일이 선택되지 않았습니다."); // 경고 메시지
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      const sanitizedFileName = encodeURIComponent(selectedFile.name);
      const file = new File([selectedFile], sanitizedFileName, {
        type: selectedFile.type
      });
      formData.append("file", file);

      const response = await axios.post(
        "https://api-w5buphcleq-du.a.run.app/images/uploadImage",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const url = response.data.file.url;
      if (url) {
        insertImage(url);
      } else {
        message.error("URL이 반환되지 않았습니다.");
      }

      setSelectedFile(null);
      setIsPopUp(false);
    } catch (error) {
      message.error("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (): Promise<void> => {
    if (!imageUrl) {
      message.warning("URL이 입력되지 않았습니다."); // 경고 메시지
      return;
    }
    
    setLoading(true);
    try {
      const urlToFile = async (url: string): Promise<File> => {
        const response = await fetch(url);
        const blob = await response.blob();
        const contentType = response.headers.get("content-type") || blob.type;
        const filename = `uploaded-image-${Date.now()}`;
        return new File([blob], filename, { type: contentType });
      };

      const file = await urlToFile(imageUrl);
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "https://api-w5buphcleq-du.a.run.app/images/uploadImage",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const url = response.data.file.url;
      if (url) {
        insertImage(url);
      } else {
        message.error("URL이 반환되지 않았습니다.");
      }

      setImageUrl("");
      setIsPopUp(false);
    } catch (error) {
      message.error("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <S.ImageInsertWrap>
      <div>
        <S.ImageInsertTabWrap>
          <S.ImageInsertTabBox>
            <S.Tab
              onClick={() => {
                setIsUrlActive(false);
              }}
            >
              FILE
            </S.Tab>
            <S.Tab
              onClick={() => {
                setIsUrlActive(true);
              }}
            >
              URL
            </S.Tab>
          </S.ImageInsertTabBox>
          <S.TabIndivatorBox>
            <S.TabIndivator isUrlActive={isUrlActive} />
          </S.TabIndivatorBox>
        </S.ImageInsertTabWrap>
        <S.ImageInsertBox>
          {!isUrlActive && (
            <Upload
              beforeUpload={file => {
                setSelectedFile(file); // 파일 선택 상태 업데이트
                setFileList([
                  {
                    uid: "1",
                    name: file.name
                  }
                ]);
                return false; // 업로드를 막고 사용자 정의 업로드 로직 실행
              }}
              fileList={fileList}
            >
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          )}
          {isUrlActive && (
            <Input
              placeholder="이미지 Url"
              onChange={e => setImageUrl(e.target.value)}
              value={imageUrl}
            />
          )}
        </S.ImageInsertBox>
      </div>
      <S.ImageInsertButtonWrap>
        <Button30px
          content="취소"
          onClick={() => {
            setFileList([]);
            setImageUrl(""); // URL 초기화
            setSelectedFile(null); // 파일 선택 초기화
            setIsPopUp(false);
            setIsUrlActive(false);
          }}
        />
        <Button30px
          content="확인"
          background={theme.palette.background.bgDark}
          color={theme.palette.text.textWhite}
          onClick={() => {
            if (isUrlActive) {
              handleUrlSubmit(); // URL 제출
            } else {
              handleFileUpload(); // 파일 업로드
            }
          }}
        />
      </S.ImageInsertButtonWrap>
    </S.ImageInsertWrap>
  );

  return (
    <S.CustomToolbarWrap>
      <Popover
        content={content}
        trigger="click"
        open={isPopUp}
        onOpenChange={setIsPopUp}
      >
        <CustomToolbarBox
          onClick={(event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            setIsPopUp(!isPopUp);
          }}
        >
          <Images
            style={{
              color: "#9BA2A8"
            }}
          />
        </CustomToolbarBox>
      </Popover>
    </S.CustomToolbarWrap>
  );
};

export default ImageButton;