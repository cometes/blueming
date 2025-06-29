"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { YoutubeIcon } from "@/components/tiptap-icons/youtube-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

export interface YoutubeUploadButtonProps extends ButtonProps {
  editor?: Editor | null
  text?: string
}

export function isYoutubeActive(editor: Editor | null): boolean {
  if (!editor) return false
  return editor.isActive("youtube")
}

export function insertYoutubeVideo(
  editor: Editor | null,
  src: string,
  width?: number,
  height?: number
): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .setYoutubeVideo({
      src,
      width: width || 640,
      height: height || 480,
    })
    .run()
}

export function canInsertYoutube(editor: Editor | null): boolean {
  if (!editor) return false
  
  try {
    return editor.can().setYoutubeVideo({ src: "" })
  } catch {
    return false
  }
}

export function checkYoutubeExtension(editor: Editor | null): boolean {
  if (!editor) return false

  const hasExtension = editor.extensionManager.extensions.some(
    (extension) => extension.name === "youtube"
  )

  if (!hasExtension) {
    console.warn(
      "YouTube extension is not available. " +
        "Make sure it is included in your editor configuration."
    )
  }

  return hasExtension
}

export function extractYoutubeVideoId(url: string): string | null {
  // YouTube URL 패턴들을 처리
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // 직접 비디오 ID인 경우
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

export function formatYoutubeUrl(input: string): string | null {
  const videoId = extractYoutubeVideoId(input)
  if (!videoId) return null
  
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function useYoutubeUploadButton(
  editor: Editor | null,
  disabled: boolean = false
) {
  const youtubeAvailable = React.useMemo(
    () => checkYoutubeExtension(editor),
    [editor]
  )

  const canInsert = React.useMemo(
    () => canInsertYoutube(editor),
    [editor]
  )

  const isActive = isYoutubeActive(editor)
  const isDisabled = !youtubeAvailable || !canInsert || disabled

  const handleInsertYoutube = React.useCallback(() => {
    if (isDisabled || !editor) return false

    const url = prompt("YouTube 비디오 URL을 입력하세요:")
    if (!url) return false

    const formattedUrl = formatYoutubeUrl(url)
    if (!formattedUrl) {
      alert("올바른 YouTube URL을 입력해주세요.")
      return false
    }

    return insertYoutubeVideo(editor, formattedUrl)
  }, [editor, isDisabled])

  return {
    youtubeAvailable,
    canInsert,
    isActive,
    isDisabled,
    handleInsertYoutube,
  }
}

export const YoutubeUploadButton = React.forwardRef<
  HTMLButtonElement,
  YoutubeUploadButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      className = "",
      disabled,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const editor = useTiptapEditor(providedEditor)
    const { isActive, isDisabled, handleInsertYoutube } = useYoutubeUploadButton(
      editor,
      disabled
    )

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e)

        if (!e.defaultPrevented && !isDisabled) {
          handleInsertYoutube()
        }
      },
      [onClick, isDisabled, handleInsertYoutube]
    )

    if (!editor || !editor.isEditable) {
      return null
    }

    return (
      <Button
        ref={ref}
        type="button"
        className={className.trim()}
        disabled={isDisabled}
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        data-disabled={isDisabled}
        role="button"
        tabIndex={-1}
        aria-label="Add YouTube video"
        aria-pressed={isActive}
        tooltip="Add YouTube video"
        onClick={handleClick}
        {...buttonProps}
      >
        {children || (
          <>
            <YoutubeIcon className="tiptap-button-icon" />
            {/* {text && <span className="tiptap-button-text">{text}</span>} */}
          </>
        )}
      </Button>
    )
  }
)

YoutubeUploadButton.displayName = "YoutubeUploadButton"

export default YoutubeUploadButton