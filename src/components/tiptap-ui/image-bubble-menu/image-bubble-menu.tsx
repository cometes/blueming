"use client"

import * as React from "react"
import type { Editor } from "@tiptap/react"
import { Button } from "@/components/tiptap-ui-primitive/button"
import "@/components/tiptap-ui/image-bubble-menu/image-bubble-menu.scss"

const AlignLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="15" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const AlignCenterIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const AlignRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="9" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

interface ImageBubbleMenuProps {
  editor: Editor
  currentAlign: 'left' | 'center' | 'right'
  nodeType?: string
}

export const ImageBubbleMenu: React.FC<ImageBubbleMenuProps> = ({
  editor,
  currentAlign,
  nodeType = 'image',
}) => {
  const setImageAlign = React.useCallback((align: 'left' | 'center' | 'right') => {
    editor
      .chain()
      .focus()
      .updateAttributes(nodeType, { 'data-align': align })
      .run()
  }, [editor, nodeType])

  return (
    <div className="image-bubble-menu">
      <div className="image-bubble-menu-content">
        <Button
          type="button"
          className="tiptap-button"
          data-style="ghost"
          data-active-state={currentAlign === 'left' ? 'on' : 'off'}
          onClick={() => setImageAlign('left')}
          tooltip="왼쪽 정렬"
        >
          <AlignLeftIcon className="tiptap-button-icon" />
        </Button>

        <Button
          type="button"
          className="tiptap-button"
          data-style="ghost"
          data-active-state={currentAlign === 'center' ? 'on' : 'off'}
          onClick={() => setImageAlign('center')}
          tooltip="가운데 정렬"
        >
          <AlignCenterIcon className="tiptap-button-icon" />
        </Button>

        <Button
          type="button"
          className="tiptap-button"
          data-style="ghost"
          data-active-state={currentAlign === 'right' ? 'on' : 'off'}
          onClick={() => setImageAlign('right')}
          tooltip="오른쪽 정렬"
        >
          <AlignRightIcon className="tiptap-button-icon" />
        </Button>
      </div>
    </div>
  )
}

export default ImageBubbleMenu
