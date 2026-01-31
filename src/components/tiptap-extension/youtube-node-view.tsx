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
  const initialWidth = node.attrs.width || "100%"
  const videoId = getVideoId(src)
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : ""
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : src

  const [isResizing, setIsResizing] = React.useState(false)
  const [currentWidth, setCurrentWidth] = React.useState<number | null>(
    typeof initialWidth === "number" ? initialWidth : null
  )
  const currentWidthRef = React.useRef<number | null>(
    typeof initialWidth === "number" ? initialWidth : null
  )
  const containerRef = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
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
        const containerWidth =
          wrapperRef.current?.parentElement?.clientWidth ||
          wrapperRef.current?.clientWidth ||
          0
        if (containerWidth > 0) {
          const percent = Math.max(20, Math.min(100, Math.round((currentWidthRef.current / containerWidth) * 100)))
          updateAttributes({ width: `${percent}%` })
        } else {
          updateAttributes({ width: currentWidthRef.current })
        }
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [updateAttributes])

  const boxStyle: React.CSSProperties = React.useMemo(() => {
    if (isResizing && currentWidth !== null) {
      return { width: `${currentWidth}px`, maxWidth: "100%" }
    }
    if (typeof node.attrs.width === "number") {
      return { width: `${node.attrs.width}px`, maxWidth: "100%" }
    }
    if (typeof node.attrs.width === "string") {
      return { width: node.attrs.width, maxWidth: "100%" }
    }
    return { width: "100%", maxWidth: "100%" }
  }, [currentWidth, node.attrs.width, isResizing])

  const containerStyle: React.CSSProperties = React.useMemo(() => {
    return { width: "100%", maxWidth: "100%", aspectRatio: "16 / 9" }
  }, [])

  React.useEffect(() => {
    if (!editor?.isEditable) return
    if (typeof node.attrs.width === "number" && updateAttributes) {
      const containerWidth =
        wrapperRef.current?.parentElement?.clientWidth ||
        wrapperRef.current?.clientWidth ||
        0
      if (containerWidth > 0) {
        const percent = Math.max(20, Math.min(100, Math.round((node.attrs.width / containerWidth) * 100)))
        updateAttributes({ width: `${percent}%` })
      }
    }
  }, [editor?.isEditable, node.attrs.width, updateAttributes])

  return (
    <NodeViewWrapper
      as="div"
      ref={wrapperRef}
      className={`youtube-wrapper youtube-align-${align}`}
      data-align={align}
      contentEditable={false}
      onClick={handleWrapperClick}
    >
      <div
        className={`youtube-box ${selected ? 'ProseMirror-selectednode' : ''} ${isResizing ? 'is-resizing' : ''}`}
        data-drag-handle
        style={boxStyle}
      >
        {selected && editor.isEditable && (
          <ImageBubbleMenu editor={editor} currentAlign={align} nodeType="youtube" />
        )}
        {selected && editor.isEditable && (
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
          {editor.isEditable ? (
            <>
              <img
                src={thumbnailUrl}
                data-youtube-thumbnail="true"
                data-youtube-src={src}
                width="100%"
                height="100%"
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
            </>
          ) : (
            <iframe
              src={embedUrl}
              title="YouTube video"
              width="100%"
              height="100%"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 0, display: "block" }}
            />
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default YoutubeNodeView
