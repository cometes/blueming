import styled from "@emotion/styled";
import { Button, message, Modal } from "antd";
import { useState } from "react";
import axios from "axios";
import { ImagePlus, Upload } from "lucide-react";

const UploadContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
`;

const AspectRatioBox = styled.div<{
  active: boolean;
}>`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  min-height: 150px;
  border: ${props => (props.active ? "1px solid #ccc" : "")};
  border-radius: ${props => (props.active ? "4px" : "")};
`;

const ImagePreview = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
`;

const PlaceholderBox = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 2px dashed #e1e1e1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
`;

const UploadIcon = styled.i`
  font-size: 24px;
  color: #999;
  margin-bottom: 8px;
`;

const UploadText = styled.p`
  font-size: 14px;
  color: #666;
`;

const HiddenInput = styled.input`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

const ImageInsertBox = styled.div`
  max-width: 240px;
`;
const FlexBox = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
  margin-top: 16px;

  & button:last-of-type {
    margin-left: 8px;
  }
`;

export default function ImageUploadModal(props) {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "https://api-w5buphcleq-du.a.run.app/images/uploadImage",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      const url = response.data.file.url; // API가 반환한 이미지 URL

      if (url) {
        props.setThumbnail(url);
      } else {
        message.error("URL이 반환되지 않았습니다.");
      }

      setSelectedFile(null);
    } catch (error) {
      message.error("이미지 업로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <Modal
      open={props.isModalOpen}
      footer={null}
      closable={false}
      onCancel={props.cancelModal}
      styles={{
        content: {
          width: "fit-content"
        }
      }}
      width={"fit-content"}
    >
      <ImageInsertBox>
        <UploadContainer>
          <AspectRatioBox active={props.thumbnail ? true : false}>
            {props.thumbnail ? (
              <ImagePreview src={props.thumbnail} alt="Preview" />
            ) : (
              <PlaceholderBox>
                <ImagePlus
                  size={28}
                  color="#9BA2A8"
                  absoluteStrokeWidth={true}
                />
                <UploadText>Upload Image</UploadText>
              </PlaceholderBox>
            )}
          </AspectRatioBox>
          <HiddenInput
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </UploadContainer>
      </ImageInsertBox>
      <FlexBox>
        <Button
          icon={<Upload size={14} />}
          onClick={() => {
            props.onClickUpload(props.thumbnail);
            props.setThumbnail("");
            props.setIsModalOpen(prev => !prev);
          }}
        >
          업로드
        </Button>
      </FlexBox>
    </Modal>
  );
}
