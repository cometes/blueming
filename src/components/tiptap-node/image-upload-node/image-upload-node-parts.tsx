"use client"

import * as React from "react"
import { CloseIcon } from "@/components/tiptap-icons/close-icon"
import {
  CloudUploadIcon,
  FileCornerIcon,
  FileIcon,
} from "@/components/tiptap-node/image-upload-node/image-upload-node-icons"

// 업로드 노드의 프레젠테이션 파트 (Tiptap 템플릿 유래):
// 드래그 영역 / 업로드 진행 미리보기 / 드롭존 안내

interface ImageUploadDragAreaProps {
  onFile: (files: File[]) => void
  children?: React.ReactNode
}

export const ImageUploadDragArea: React.FC<ImageUploadDragAreaProps> = ({
  onFile,
  children,
}) => {
  const [dragover, setDragover] = React.useState(false)

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setDragover(false)
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    onFile(files)
  }

  const onDragover = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragover(true)
  }

  const onDragleave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragover(false)
  }

  return (
    <div
      className={`tiptap-image-upload-dragger ${dragover ? "tiptap-image-upload-dragger-active" : ""}`}
      onDrop={onDrop}
      onDragOver={onDragover}
      onDragLeave={onDragleave}
    >
      {children}
    </div>
  )
}

interface ImageUploadPreviewProps {
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  onRemove: () => void
}

export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({
  file,
  progress,
  status,
  onRemove,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["바이트", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="tiptap-image-upload-preview">
      {status === "uploading" && (
        <div
          className="tiptap-image-upload-progress"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="tiptap-image-upload-preview-content">
        <div className="tiptap-image-upload-file-info">
          <div className="tiptap-image-upload-file-icon">
            <CloudUploadIcon />
          </div>
          <div className="tiptap-image-upload-details">
            <span className="tiptap-image-upload-text">{file.name}</span>
            <span className="tiptap-image-upload-subtext">
              {formatFileSize(file.size)}
            </span>
          </div>
        </div>
        <div className="tiptap-image-upload-actions">
          {status === "uploading" && (
            <span className="tiptap-image-upload-progress-text">
              {progress}%
            </span>
          )}
          <button
            className="tiptap-image-upload-close-btn"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

export const DropZoneContent: React.FC<{ maxSize: number }> = ({ maxSize }) => (
  <>
    <div className="tiptap-image-upload-dropzone">
      <FileIcon />
      <FileCornerIcon />
      <div className="tiptap-image-upload-icon-container">
        <CloudUploadIcon />
      </div>
    </div>

    <div className="tiptap-image-upload-content">
      <span className="tiptap-image-upload-text">
        <em>클릭하여 업로드</em>하거나 드래그 앤 드롭하세요
      </span>
      <span className="tiptap-image-upload-subtext">
        최대 파일 크기 {maxSize / 1024 / 1024}MB
      </span>
    </div>
  </>
)
