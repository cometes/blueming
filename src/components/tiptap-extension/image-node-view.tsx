"use client"

import * as React from "react"
import { NodeViewWrapper } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"
import { ImageBubbleMenu } from "@/components/tiptap-ui/image-bubble-menu/image-bubble-menu"

export const ImageNodeView: React.FC<NodeViewProps> = ({ node, editor, selected, getPos, updateAttributes }) => {
  const align = node.attrs['data-align'] || 'left'
  const src = node.attrs.src
  const alt = node.attrs.alt || ''
  const title = node.attrs.title || ''
  const initialWidth = node.attrs.width

  const [isResizing, setIsResizing] = React.useState(false)
  const [currentWidth, setCurrentWidth] = React.useState<number | null>(initialWidth)
  const imgRef = React.useRef<HTMLImageElement>(null)
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

    const currentWidth = imgRef.current?.offsetWidth || 0
    startWidthRef.current = currentWidth
    setCurrentWidth(currentWidth)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = direction === 'right'
        ? moveEvent.clientX - startXRef.current
        : startXRef.current - moveEvent.clientX

      const newWidth = Math.max(100, Math.min(1000, startWidthRef.current + deltaX))
      setCurrentWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (currentWidth !== null && updateAttributes) {
        updateAttributes({ width: currentWidth })
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [currentWidth, updateAttributes])

  const imgStyle: React.CSSProperties = React.useMemo(() => {
    if (currentWidth !== null) {
      return { width: `${currentWidth}px`, maxWidth: '100%' }
    }
    return {}
  }, [currentWidth])

  return (
    <NodeViewWrapper
      as="div"
      className={`image-wrapper image-align-${align}`}
      data-align={align}
      contentEditable={false}
      onClick={handleWrapperClick}
    >
      <div
        className={`image-box ${selected ? 'ProseMirror-selectednode' : ''} ${isResizing ? 'is-resizing' : ''}`}
        data-drag-handle
      >
        {selected && <ImageBubbleMenu editor={editor} currentAlign={align} />}
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
        <img ref={imgRef} src={src} alt={alt} title={title} style={imgStyle} />
      </div>
    </NodeViewWrapper>
  )
}

export default ImageNodeView
