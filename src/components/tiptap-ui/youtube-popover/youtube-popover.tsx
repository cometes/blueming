"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"
import type { Node as PMNode } from "@tiptap/pm/model"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { CornerDownLeftIcon } from "@/components/tiptap-icons/corner-down-left-icon"
import { YoutubeIcon } from "@/components/tiptap-icons/youtube-icon"
import { TrashIcon } from "@/components/tiptap-icons/trash-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover"
import { Separator } from "@/components/tiptap-ui-primitive/separator"

// --- Utils ---
export function isValidYoutubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]
  return patterns.some(pattern => pattern.test(url))
}

export function normalizeYoutubeUrl(input: string): string | null {
  if (!input.trim()) return null
  
  if (isValidYoutubeUrl(input)) {
    return input
  }
  
  const videoIdPattern = /^[a-zA-Z0-9_-]{11}$/
  if (videoIdPattern.test(input.trim())) {
    return `https://www.youtube.com/watch?v=${input.trim()}`
  }
  
  return null
}

export interface YoutubeHandlerProps {
  editor: Editor | null
  onSetYoutube?: () => void
  onYoutubeActive?: () => void
}

export interface YoutubeMainProps {
  url: string
  setUrl: React.Dispatch<React.SetStateAction<string | null>>
  setYoutube: () => void
  removeYoutube: () => void
  isActive: boolean
}

export const useYoutubeHandler = (props: YoutubeHandlerProps) => {
  const { editor, onSetYoutube, onYoutubeActive } = props
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!editor) return

    const { src } = editor.getAttributes("youtube")

    if (editor.isActive("youtube") && url === null) {
      setUrl(src || "")
      onYoutubeActive?.()
    }
  }, [editor, onYoutubeActive, url])

  React.useEffect(() => {
    if (!editor) return

    const updateYoutubeState = () => {
      const { src } = editor.getAttributes("youtube")
      
      if (editor.isActive("youtube")) {
        setUrl(src || "")
        onYoutubeActive?.()
      }
    }

    editor.on("selectionUpdate", updateYoutubeState)
    return () => {
      editor.off("selectionUpdate", updateYoutubeState)
    }
  }, [editor, onYoutubeActive])

  const setYoutube = React.useCallback(() => {
    if (!url || !editor) return

    const normalizedUrl = normalizeYoutubeUrl(url)
    if (!normalizedUrl) return

    // If an image or youtube is selected, move cursor to the end of selection before inserting
    const { to } = editor.state.selection
    const selectedNode = ('node' in editor.state.selection ? editor.state.selection.node : null) as PMNode | null

    if (selectedNode && (selectedNode.type.name === 'image' || selectedNode.type.name === 'youtube')) {
      // Move cursor after the selected node
      editor.chain().focus().setTextSelection(to).setYoutubeVideo({
        src: normalizedUrl,
        width: 640,
        height: 480
      }).run()
    } else {
      editor.commands.setYoutubeVideo({
        src: normalizedUrl,
        width: 640,
        height: 480
      })
    }

    setUrl(null)
    onSetYoutube?.()
  }, [editor, onSetYoutube, url])

  const removeYoutube = React.useCallback(() => {
    if (!editor) return
    
    // YouTube 노드가 선택된 상태에서 삭제
    if (editor.isActive("youtube")) {
      editor.chain().focus().deleteSelection().run()
    }
    
    setUrl("")
  }, [editor])

  return {
    url: url || "",
    setUrl,
    setYoutube,
    removeYoutube,
    isActive: editor?.isActive("youtube") || false,
  }
}

export const YoutubeButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        type="button"
        className={className}
        data-style="ghost"
        role="button"
        tabIndex={0}
        aria-label="Add YouTube video"
        tooltip="Add YouTube video"
        ref={ref}
        {...props}
      >
        {children || <YoutubeIcon className="tiptap-button-icon" />}
      </Button>
    )
  }
)

export const YoutubeContent: React.FC<{
  editor?: Editor | null
}> = ({ editor: providedEditor }) => {
  const editor = useTiptapEditor(providedEditor)

  const youtubeHandler = useYoutubeHandler({
    editor: editor,
  })

  return <YoutubeMain {...youtubeHandler} />
}

const YoutubeMain: React.FC<YoutubeMainProps> = ({
  url,
  setUrl,
  setYoutube,
  removeYoutube,
  isActive,
}) => {
  const [error, setError] = React.useState<string | null>(null)

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSetYoutube()
    }
  }

  const handleSetYoutube = () => {
    if (!url.trim()) return

    const normalizedUrl = normalizeYoutubeUrl(url)
    if (!normalizedUrl) {
      setError("올바른 YouTube URL을 입력해주세요.")
      return
    }

    setError(null)
    setYoutube()
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (error) setError(null)
  }

  return (
    <>
      <div className="space-y-2">
        <input
          type="url"
          placeholder="YouTube URL 또는 비디오 ID를 입력하세요..."
          value={url}
          onChange={handleUrlChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="tiptap-input tiptap-input-clamp"
        />
        
        {error && (
          <div className="text-sm text-red-500 px-2">
            {error}
            <div className="mt-1 text-xs opacity-70">
              예시: https://www.youtube.com/watch?v=VIDEO_ID 또는 11자리 비디오 ID
            </div>
          </div>
        )}
      </div>

      <div className="tiptap-button-group" data-orientation="horizontal">
        <Button
          type="button"
          onClick={handleSetYoutube}
          title="YouTube 비디오 추가"
          disabled={!url.trim()}
          data-style="ghost"
        >
          <CornerDownLeftIcon className="tiptap-button-icon" />
        </Button>
      </div>

      {isActive && (
        <>
          <Separator />
          <div className="tiptap-button-group" data-orientation="horizontal">
            <Button
              type="button"
              onClick={removeYoutube}
              title="YouTube 비디오 제거"
              data-style="ghost"
            >
              <TrashIcon className="tiptap-button-icon" />
            </Button>
          </div>
        </>
      )}
    </>
  )
}

export interface YoutubePopoverProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  hideWhenUnavailable?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export function YoutubePopover({
  editor: providedEditor,
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: YoutubePopoverProps) {
  const editor = useTiptapEditor(providedEditor)

  const [isOpen, setIsOpen] = React.useState(false)

  const onSetYoutube = () => {
    setIsOpen(false)
  }

  const onYoutubeActive = () => {
    // YouTube가 활성화되어도 자동으로 팝오버를 열지 않음
  }

  const youtubeHandler = useYoutubeHandler({
    editor: editor,
    onSetYoutube,
    onYoutubeActive,
  })

  const isDisabled = React.useMemo(() => {
    if (!editor) return true
    return !editor.can().setYoutubeVideo({ src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
  }, [editor])

  const canSetYoutube = React.useMemo(() => {
    if (!editor) return false
    try {
      return editor.can().setYoutubeVideo({ src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
    } catch {
      return false
    }
  }, [editor])

  const isActive = editor?.isActive("youtube") ?? false

  const handleOnOpenChange = React.useCallback(
    (nextIsOpen: boolean) => {
      setIsOpen(nextIsOpen)
      onOpenChange?.(nextIsOpen)
    },
    [onOpenChange]
  )

  const show = React.useMemo(() => {
    if (!editor) return false

    if (hideWhenUnavailable && !canSetYoutube) {
      return false
    }

    return true
  }, [hideWhenUnavailable, editor, canSetYoutube])

  if (!show || !editor || !editor.isEditable) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOnOpenChange}>
      <PopoverTrigger asChild>
        <YoutubeButton
          disabled={isDisabled}
          data-active-state={isActive ? "on" : "off"}
          data-disabled={isDisabled}
          {...props}
        />
      </PopoverTrigger>

      <PopoverContent>
        <YoutubeMain {...youtubeHandler} />
      </PopoverContent>
    </Popover>
  )
}

YoutubeButton.displayName = "YoutubeButton"