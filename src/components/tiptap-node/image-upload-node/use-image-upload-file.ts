"use client"

import * as React from "react"

// NOTE: 전역 훅 src/hooks/useFileUpload.ts와는 다른 구현이다.
// 이름 충돌을 피하기 위해 useImageUploadFile로 명명 (업로드 노드 전용:
// 단일 파일 + 진행률 + 중단 처리).

export interface FileItem {
  id: string
  file: File
  progress: number
  status: "uploading" | "success" | "error"
  url?: string
  abortController?: AbortController
}

export interface UploadOptions {
  maxSize: number
  limit: number
  accept: string
  upload: (
    file: File,
    onProgress: (event: { progress: number }) => void,
    signal: AbortSignal
  ) => Promise<string>
  onSuccess?: (url: string) => void
  onError?: (error: Error) => void
}

export function useImageUploadFile(options: UploadOptions) {
  const [fileItem, setFileItem] = React.useState<FileItem | null>(null)

  const uploadFile = async (file: File): Promise<string | null> => {
    if (file.size > options.maxSize) {
      const error = new Error(
        `파일 크기가 허용된 최대치(${
          options.maxSize / 1024 / 1024
        }MB)를 초과했습니다.`
      )
      options.onError?.(error)
      return null
    }

    const abortController = new AbortController()

    const newFileItem: FileItem = {
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "uploading",
      abortController,
    }

    setFileItem(newFileItem)

    try {
      if (!options.upload) {
        throw new Error("업로드 함수가 정의되어 있지 않습니다.")
      }

      const url = await options.upload(
        file,
        (event: { progress: number }) => {
          setFileItem((prev) => {
            if (!prev) return null
            return {
              ...prev,
              progress: event.progress,
            }
          })
        },
        abortController.signal
      )

      if (!url) throw new Error("업로드 실패: URL이 반환되지 않았습니다.")

      if (!abortController.signal.aborted) {
        setFileItem((prev) => {
          if (!prev) return null
          return {
            ...prev,
            status: "success",
            url,
            progress: 100,
          }
        })
        options.onSuccess?.(url)
        return url
      }

      return null
    } catch (error) {
      if (!abortController.signal.aborted) {
        setFileItem((prev) => {
          if (!prev) return null
          return {
            ...prev,
            status: "error",
            progress: 0,
          }
        })
        options.onError?.(
          error instanceof Error ? error : new Error("업로드에 실패했습니다.")
        )
      }
      return null
    }
  }

  const uploadFiles = async (files: File[]): Promise<string | null> => {
    if (!files || files.length === 0) {
      options.onError?.(new Error("업로드할 파일이 없습니다."))
      return null
    }

    if (options.limit && files.length > options.limit) {
      options.onError?.(
        new Error(`최대 ${options.limit}개 파일만 업로드할 수 있습니다.`)
      )
      return null
    }

    const file = files[0]
    if (!file) {
      options.onError?.(new Error("파일을 찾을 수 없습니다."))
      return null
    }

    return uploadFile(file)
  }

  const clearFileItem = () => {
    if (!fileItem) return

    if (fileItem.abortController) {
      fileItem.abortController.abort()
    }
    if (fileItem.url) {
      URL.revokeObjectURL(fileItem.url)
    }
    setFileItem(null)
  }

  return {
    fileItem,
    uploadFiles,
    clearFileItem,
  }
}
