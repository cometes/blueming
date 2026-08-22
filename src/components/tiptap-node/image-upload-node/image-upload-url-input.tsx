"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { filenameFromUrl } from "@/shared/lib/tiptapImage"

interface ImageUploadUrlInputProps {
  onSubmit: (url: string, altText?: string) => void
}

/** 업로드 노드의 URL 직접 삽입 입력 (이미지 업로드 모달과 동일한 방식) */
export function ImageUploadUrlInput({ onSubmit }: ImageUploadUrlInputProps) {
  const [urlInput, setUrlInput] = React.useState("")

  const handleApply = () => {
    const url = urlInput.trim()
    if (!url) {
      toast.error("이미지 URL을 입력해주세요.")
      return
    }
    if (!/^https?:\/\//i.test(url)) {
      toast.error("http(s)로 시작하는 URL을 입력해주세요.")
      return
    }
    onSubmit(url, filenameFromUrl(url))
    setUrlInput("")
  }

  return (
    <div
      className="mt-2 flex items-center justify-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Input
        type="text"
        value={urlInput}
        onChange={(e) => setUrlInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            handleApply()
          }
        }}
        placeholder="이미지 URL 붙여넣기"
        className="h-8 w-[260px] bg-card border-card rounded-card text-xs text-main-text"
      />
      <Button type="button" variant="outline" size="sm" onClick={handleApply}>
        삽입
      </Button>
    </div>
  )
}
