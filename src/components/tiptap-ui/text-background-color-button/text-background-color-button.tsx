"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { BackgroundColorIcon } from "@/components/tiptap-icons/background-color-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

export interface TextBackgroundColorButtonProps extends ButtonProps {
  editor?: Editor | null
  hideWhenUnavailable?: boolean
}

export const defaultBackgroundColors = [
  "#FFFFFF", // White
  "#F5F5F5", // Light Gray
  "#E5E5E5", // Gray
  "#FFE5E5", // Light Pink
  "#FFE5CC", // Light Orange
  "#FFFFE5", // Light Yellow
  "#E5FFE5", // Light Green
  "#E5F5FF", // Light Blue
  "#E5E5FF", // Light Purple
  "#FF6B6B", // Red
  "#FF9F43", // Orange
  "#F9CA24", // Yellow
  "#F0932B", // Dark Orange
  "#6C5CE7", // Purple
  "#A29BFE", // Light Purple
  "#00D2D3", // Cyan
  "#0FB9B1", // Teal
  "#3742FA", // Blue
]

export function checkHighlightExtension(editor: Editor | null): boolean {
  if (!editor) return false

  const hasExtension = editor.extensionManager.extensions.some(
    (extension) => extension.name === "highlight"
  )

  if (!hasExtension) {
    console.warn(
      "Highlight extension is not available. " +
        "Make sure it is included in your editor configuration."
    )
  }

  return hasExtension
}

export function canSetHighlight(editor: Editor | null): boolean {
  if (!editor) return false
  
  try {
    return editor.can().setHighlight({ color: "#FFFF00" })
  } catch {
    return false
  }
}

export function setBackgroundColor(editor: Editor | null, color: string): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .setHighlight({ color })
    .run()
}

export function unsetBackgroundColor(editor: Editor | null): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .unsetHighlight()
    .run()
}

export function getCurrentBackgroundColor(editor: Editor | null): string | null {
  if (!editor) return null

  const { color } = editor.getAttributes("highlight")
  return color || null
}

export function TextBackgroundColorButton({
  editor: providedEditor,
  hideWhenUnavailable = false,
  className = "",
  disabled = false,
  onClick,
  children,
  ...buttonProps
}: TextBackgroundColorButtonProps) {
  const editor = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = React.useState(false)

  const highlightAvailable = React.useMemo(
    () => checkHighlightExtension(editor),
    [editor]
  )

  const currentColor = getCurrentBackgroundColor(editor)

  const canToggle = React.useCallback((): boolean => {
    if (!editor || !highlightAvailable) return false
    return canSetHighlight(editor)
  }, [editor, highlightAvailable])

  const isDisabled = disabled || !canToggle()
  const isActive = Boolean(currentColor)

  const show = React.useMemo(() => {
    if (!highlightAvailable || !editor) {
      return false
    }

    if (hideWhenUnavailable && !canToggle()) {
      return false
    }

    return true
  }, [highlightAvailable, editor, hideWhenUnavailable, canToggle])

  const handleColorSelect = React.useCallback(
    (color: string) => {
      if (!editor || isDisabled) return
      setBackgroundColor(editor, color)
      setIsOpen(false)
    },
    [editor, isDisabled]
  )

  const handleClearColor = React.useCallback(() => {
    if (!editor || isDisabled) return
    unsetBackgroundColor(editor)
    setIsOpen(false)
  }, [editor, isDisabled])

  const handleButtonClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      
      if (!e.defaultPrevented && !isDisabled) {
        setIsOpen(!isOpen)
      }
    },
    [onClick, isDisabled, isOpen]
  )

  if (!show || !editor || !editor.isEditable) {
    return null
  }

  return (
    <div className="relative">
      <Button
        type="button"
        className={className.trim()}
        disabled={isDisabled}
        data-style="ghost"
        data-active-state={isActive ? "on" : "off"}
        data-disabled={isDisabled}
        role="button"
        tabIndex={-1}
        aria-label="Background color"
        aria-pressed={isActive}
        tooltip="Background color"
        onClick={handleButtonClick}
        {...buttonProps}
      >
        {children || (
          <div className="relative">
            <BackgroundColorIcon className="tiptap-button-icon" />
            <div 
              className="absolute bottom-0 left-0 right-0 h-1 rounded-sm"
              style={{ backgroundColor: currentColor || "#FFFF00" }}
            />
          </div>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="grid grid-cols-6 gap-1 mb-2">
            {defaultBackgroundColors.map((color) => (
              <button
                key={color}
                type="button"
                className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                aria-label={`Set background color to ${color}`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="color"
              className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
              onChange={(e) => handleColorSelect(e.target.value)}
              aria-label="Custom background color"
            />
            
            {currentColor && (
              <Button
                type="button"
                data-style="ghost"
                onClick={handleClearColor}
                className="text-xs px-2 py-1"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TextBackgroundColorButton