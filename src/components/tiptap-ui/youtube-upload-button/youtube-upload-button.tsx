"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"
import type { Node as PMNode } from "@tiptap/pm/model"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { YoutubeIcon } from "@/components/tiptap-icons/youtube-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

  try {
    // If an image or youtube is selected, move cursor to the end of selection before inserting
    const { to } = editor.state.selection
    const selectedNode = ('node' in editor.state.selection ? editor.state.selection.node : null) as PMNode | null

    if (selectedNode && (selectedNode.type.name === 'image' || selectedNode.type.name === 'youtube')) {
      // Move cursor after the selected node
      return editor
        .chain()
        .focus()
        .setTextSelection(to)
        .setYoutubeVideo({
          src,
          width: width || 640,
          height: height || 480,
        })
        .run()
    }

    return editor
      .chain()
      .focus()
      .setYoutubeVideo({
        src,
        width: width || 640,
        height: height || 480,
      })
      .run()
  } catch {
    return false
  }
}

export function canInsertYoutube(editor: Editor | null): boolean {
  if (!editor) return false

  try {
    // YouTube 익스텐션이 있으면 삽입 가능
    return checkYoutubeExtension(editor) && editor.can().chain().focus().run()
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
    return false
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
    if (isDisabled || !editor) {
      return false
    }

    const url = prompt("유튜브 영상 URL을 입력하세요:")

    if (!url) return false

    const formattedUrl = formatYoutubeUrl(url)

    if (!formattedUrl) {
      alert("올바른 유튜브 URL을 입력해주세요.")
      return false
    }

    const result = insertYoutubeVideo(editor, formattedUrl)
    return result
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
      className = "",
      disabled,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const editor = useTiptapEditor(providedEditor)
    const { isActive, isDisabled } = useYoutubeUploadButton(editor, disabled)
    const [isOpen, setIsOpen] = React.useState(false)
    const [youtubeUrl, setYoutubeUrl] = React.useState("")
    const [error, setError] = React.useState("")

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const handleOpenChange = React.useCallback((open: boolean) => {
      setIsOpen(open)
      if (!open) {
        setYoutubeUrl("")
        setError("")
      }
    }, [])

    const handleInsert = React.useCallback(() => {
      if (!editor || !youtubeUrl.trim()) return

      const formattedUrl = formatYoutubeUrl(youtubeUrl.trim())

      if (!formattedUrl) {
        setError("올바른 유튜브 URL을 입력해주세요.")
        return
      }

      const result = insertYoutubeVideo(editor, formattedUrl)

      if (result) {
        setIsOpen(false)
        setYoutubeUrl("")
        setError("")
      } else {
        setError("유튜브 영상을 삽입하지 못했습니다.")
      }
    }, [editor, youtubeUrl])

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault()
          handleInsert()
        } else if (e.key === "Escape") {
          setIsOpen(false)
          setYoutubeUrl("")
          setError("")
        }
      },
      [handleInsert]
    )

    if (!editor || !editor.isEditable) {
      return null
    }

    return (
      <div className="relative">
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              ref={mergedRef}
              type="button"
              className={className.trim()}
              disabled={isDisabled}
              data-style="ghost"
              data-active-state={isActive ? "on" : "off"}
              data-disabled={isDisabled}
              role="button"
              tabIndex={-1}
              aria-label="유튜브 동영상 추가"
              aria-pressed={isActive}
              tooltip="유튜브 동영상 추가"
              onClick={onClick}
              {...buttonProps}
            >
              {children || (
                <>
                  <YoutubeIcon className="tiptap-button-icon" />
                  {/* {text && <span className="tiptap-button-text">{text}</span>} */}
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-3" side="bottom" align="start">
            <div className="space-y-2">
              <div className="text-xs text-gray-600 mb-2">유튜브 영상 URL</div>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value)
                  setError("")
                }}
                onKeyDown={handleKeyDown}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {error && <div className="text-xs text-red-500">{error}</div>}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={handleInsert}
                  className="flex-1"
                >
                  삽입
                </Button>
                <Button
                  type="button"
                  data-style="ghost"
                  onClick={() => handleOpenChange(false)}
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)

YoutubeUploadButton.displayName = "YoutubeUploadButton"

export default YoutubeUploadButton
