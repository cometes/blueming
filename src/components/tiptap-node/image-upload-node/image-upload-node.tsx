"use client"

import * as React from "react"
import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"
import { CloseIcon } from "@/components/tiptap-icons/close-icon"
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss"
import type { StickerAsset } from "@/features/stickerboard-editor/model"
import {
  useImageUploadFile,
  type UploadOptions,
} from "@/components/tiptap-node/image-upload-node/use-image-upload-file"
import {
  DropZoneContent,
  ImageUploadDragArea,
  ImageUploadPreview,
} from "@/components/tiptap-node/image-upload-node/image-upload-node-parts"
import { ImageUploadAssetPicker } from "@/components/tiptap-node/image-upload-node/image-upload-asset-picker"
import { resolveImageAttrs } from "@/shared/lib/tiptapImage"

export type { FileItem } from "@/components/tiptap-node/image-upload-node/use-image-upload-file"

export const ImageUploadNode: React.FC<NodeViewProps> = (props) => {
  const { accept, limit, maxSize } = props.node.attrs
  const { deleteNode } = props
  const inputRef = React.useRef<HTMLInputElement>(null)
  const extension = props.extension
  const filesRef = React.useRef<File[]>([])

  const handleImageInsert = React.useCallback(
    (url: string, altText?: string) => {
      const pos = props.getPos()
      const filename =
        altText ||
        filesRef.current[0]?.name.replace(/\.[^/.]+$/, "") ||
        "알 수 없음"

      void (async () => {
        // natural 크기 기반 width 계산 (실패 시 width 없이 삽입)
        const attrs = await resolveImageAttrs(url, filename)
        // Dialog/Popover 정리와의 DOM 충돌을 피하기 위해 한 틱 뒤 교체
        setTimeout(() => {
          try {
            props.editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + 1 })
              .insertContentAt(pos, { type: "image", attrs })
              .run()
            // 커서를 이미지 뒤로 이동해 바로 이어서 쓸 수 있게 (TrailingNode가 문단 보장)
            props.editor.commands.focus(
              Math.min(pos + 1, props.editor.state.doc.content.size)
            )
          } catch {}
        }, 100)
      })()
    },
    [props]
  )

  const uploadOptions: UploadOptions = {
    maxSize,
    limit,
    accept,
    upload: extension.options.upload,
    onSuccess: (url: string) => {
      extension.options.onSuccess?.(url)
      handleImageInsert(url)
    },
    onError: extension.options.onError,
  }

  const { fileItem, uploadFiles, clearFileItem } =
    useImageUploadFile(uploadOptions)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      extension.options.onError?.(new Error("선택된 파일이 없습니다."))
      return
    }
    handleUpload(Array.from(files))
  }

  const handleUpload = async (files: File[]) => {
    filesRef.current = files
    await uploadFiles(files)
  }

  const handleClick = () => {
    if (inputRef.current && !fileItem) {
      inputRef.current.value = ""
      inputRef.current.click()
    }
  }

  const handleSelectAsset = React.useCallback(
    (asset: StickerAsset) => {
      handleImageInsert(asset.url, asset.name || "에셋 이미지")
    },
    [handleImageInsert]
  )

  return (
    <NodeViewWrapper
      className="tiptap-image-upload"
      tabIndex={0}
      onClick={handleClick}
    >
      <button
        type="button"
        className="tiptap-image-upload-remove-btn cursor-pointer"
        onClick={(event) => {
          event.stopPropagation()
          deleteNode?.()
        }}
        aria-label="이미지 업로드 삭제"
      >
        <CloseIcon />
      </button>
      {!fileItem && (
        <>
          <ImageUploadDragArea onFile={handleUpload}>
            <DropZoneContent maxSize={maxSize} />
          </ImageUploadDragArea>
          <ImageUploadAssetPicker onSelect={handleSelectAsset} />
        </>
      )}

      {fileItem && (
        <ImageUploadPreview
          file={fileItem.file}
          progress={fileItem.progress}
          status={fileItem.status}
          onRemove={clearFileItem}
        />
      )}

      <input
        ref={inputRef}
        name="file"
        accept={accept}
        type="file"
        onChange={handleChange}
        onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
      />
    </NodeViewWrapper>
  )
}
