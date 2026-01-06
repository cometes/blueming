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

    const url = prompt("YouTube 비디오 URL을 입력하세요:")

    if (!url) return false

    const formattedUrl = formatYoutubeUrl(url)

    if (!formattedUrl) {
      alert("올바른 YouTube URL을 입력해주세요.")
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
    const popupRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    // Merge refs
    const mergedRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    // 팝업 위치 계산
    const [popupPosition, setPopupPosition] = React.useState<{
      top: number
      left: number
    } | null>(null)

    React.useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setPopupPosition({
          top: rect.bottom + 4,
          left: rect.left,
        })
      }
    }, [isOpen])

    // 외부 클릭 시 팝업 닫기
    React.useEffect(() => {
      if (!isOpen) return

      const handleClickOutside = (event: MouseEvent) => {
        if (
          popupRef.current &&
          !popupRef.current.contains(event.target as Node) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
          setYoutubeUrl("")
          setError("")
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [isOpen])

    const handleButtonClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.stopPropagation()

        if (!isDisabled) {
          setIsOpen(!isOpen)
          setError("")
        }

        onClick?.(e)
      },
      [onClick, isDisabled, isOpen]
    )

    const handleInsert = React.useCallback(() => {
      if (!editor || !youtubeUrl.trim()) return

      const formattedUrl = formatYoutubeUrl(youtubeUrl.trim())

      if (!formattedUrl) {
        setError("올바른 YouTube URL을 입력해주세요.")
        return
      }

      const result = insertYoutubeVideo(editor, formattedUrl)

      if (result) {
        setIsOpen(false)
        setYoutubeUrl("")
        setError("")
      } else {
        setError("YouTube 비디오를 삽입하지 못했습니다.")
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
          aria-label="Add YouTube video"
          aria-pressed={isActive}
          tooltip="Add YouTube video"
          onClick={handleButtonClick}
          {...buttonProps}
        >
          {children || (
            <>
              <YoutubeIcon className="tiptap-button-icon" />
              {/* {text && <span className="tiptap-button-text">{text}</span>} */}
            </>
          )}
        </Button>

        {isOpen && popupPosition && (
          <div
            ref={popupRef}
            className="fixed p-3 bg-white border border-gray-300 rounded-lg shadow-xl z-[9999] min-w-[320px]"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
            }}
          >
            <div className="space-y-2">
              <div className="text-xs text-gray-600 mb-2">YouTube 비디오 URL</div>

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

              {error && (
                <div className="text-xs text-red-500">{error}</div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleInsert}
                  className="flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  삽입
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    setYoutubeUrl("")
                    setError("")
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

YoutubeUploadButton.displayName = "YoutubeUploadButton"

export default YoutubeUploadButton
