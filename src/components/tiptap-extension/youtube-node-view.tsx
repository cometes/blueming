/* eslint-disable @next/next/no-img-element */
"use client"

import * as React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { ImageBubbleMenu } from "@/components/tiptap-ui/image-bubble-menu/image-bubble-menu"

// YouTube 비디오 ID 추출 함수
function getVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export const YoutubeNodeView: React.FC<NodeViewProps> = ({ node, editor, selected, getPos, updateAttributes }) => {
  const align = node.attrs['data-align'] || 'left'
  const src = node.attrs.src
  const initialWidth = node.attrs.width || 640
  const videoId = getVideoId(src)
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : ""

  const [isResizing, setIsResizing] = React.useState(false)
  const [currentWidth, setCurrentWidth] = React.useState<number | null>(initialWidth)
  const currentWidthRef = React.useRef<number | null>(initialWidth)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const startXRef = React.useRef<number>(0)
  const startWidthRef = React.useRef<number>(0)

  const handleWrapperClick = React.useCallback((e: React.MouseEvent) => {
    // wrapper 자체를 클릭했을 때만 (box를 클릭한 게 아닐 때)
    if (e.target === e.currentTarget) {
      // 선택 해제
      editor.commands.setTextSelection(getPos() + node.nodeSize)
    }
  }, [editor, getPos, node.nodeSize])

  const handleResizeStart = React.useCallback((e: React.MouseEvent, direction: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    startXRef.current = e.clientX

    const currentWidth = containerRef.current?.offsetWidth || 0
    startWidthRef.current = currentWidth
    setCurrentWidth(currentWidth)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = direction === 'right'
        ? moveEvent.clientX - startXRef.current
        : startXRef.current - moveEvent.clientX

      const newWidth = Math.max(200, Math.min(1000, startWidthRef.current + deltaX))
      currentWidthRef.current = newWidth
      setCurrentWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (currentWidthRef.current !== null && updateAttributes) {
        updateAttributes({ width: currentWidthRef.current })
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [updateAttributes])

  const containerStyle: React.CSSProperties = React.useMemo(() => {
    if (currentWidth !== null) {
      return { width: `${currentWidth}px`, maxWidth: '100%' }
    }
    return { width: `${initialWidth}px`, maxWidth: '100%' }
  }, [currentWidth, initialWidth])

  return (
    <NodeViewWrapper
      as="div"
      className={`youtube-wrapper youtube-align-${align}`}
      data-align={align}
      contentEditable={false}
      onClick={handleWrapperClick}
    >
      <div
        className={`youtube-box ${selected ? 'ProseMirror-selectednode' : ''} ${isResizing ? 'is-resizing' : ''}`}
        data-drag-handle
      >
        {selected && <ImageBubbleMenu editor={editor} currentAlign={align} nodeType="youtube" />}
        {selected && (
          <>
            <div
              className="resize-handle resize-handle-left"
              onMouseDown={(e) => handleResizeStart(e, 'left')}
            />
            <div
              className="resize-handle resize-handle-right"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            />
          </>
        )}
        <div ref={containerRef} className="youtube-thumbnail-container" style={containerStyle}>
          <img
            src={thumbnailUrl}
            data-youtube-thumbnail="true"
            data-youtube-src={src}
            width="100%"
            height={currentWidth ? Math.round(currentWidth * 0.5625) : Math.round(initialWidth * 0.5625)}
            className="youtube-thumbnail-image"
            alt="YouTube video thumbnail"
          />
          <div className="youtube-play-icon-overlay">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="white"
              style={{ marginLeft: '2px' }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default YoutubeNodeView
