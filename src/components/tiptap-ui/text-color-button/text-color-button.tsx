"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { TextColorIcon } from "@/components/tiptap-icons/text-color-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

export interface TextColorButtonProps extends ButtonProps {
  editor?: Editor | null
  hideWhenUnavailable?: boolean
}

export const defaultTextColors = [
  "#000000", // Black
  "#666666", // Dark Gray
  "#999999", // Gray
  "#CCCCCC", // Light Gray
  "#FFFFFF", // White
  "#FF0000", // Red
  "#FF6600", // Orange
  "#FFCC00", // Yellow
  "#66CC00", // Green
  "#00CCCC", // Cyan
  "#0066CC", // Blue
  "#6600CC", // Purple
  "#CC0066", // Pink
]

export function checkColorExtension(editor: Editor | null): boolean {
  if (!editor) return false

  const hasExtension = editor.extensionManager.extensions.some(
    (extension) => extension.name === "color"
  )

  if (!hasExtension) {
    console.warn(
      "Color extension is not available. " +
        "Make sure it is included in your editor configuration."
    )
  }

  return hasExtension
}

export function canSetColor(editor: Editor | null): boolean {
  if (!editor) return false
  
  try {
    return editor.can().setColor("#000000")
  } catch {
    return false
  }
}

export function setTextColor(editor: Editor | null, color: string): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .setColor(color)
    .run()
}

export function unsetTextColor(editor: Editor | null): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .unsetColor()
    .run()
}

export function getCurrentTextColor(editor: Editor | null): string | null {
  if (!editor) return null

  const { color } = editor.getAttributes("textStyle")
  return color || null
}

export function TextColorButton({
  editor: providedEditor,
  hideWhenUnavailable = false,
  className = "",
  disabled = false,
  onClick,
  children,
  ...buttonProps
}: TextColorButtonProps) {
  const editor = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = React.useState(false)

  const colorAvailable = React.useMemo(
    () => checkColorExtension(editor),
    [editor]
  )

  const currentColor = getCurrentTextColor(editor)

  const canToggle = React.useCallback((): boolean => {
    if (!editor || !colorAvailable) return false
    return canSetColor(editor)
  }, [editor, colorAvailable])

  const isDisabled = disabled || !canToggle()
  const isActive = Boolean(currentColor)

  const show = React.useMemo(() => {
    if (!colorAvailable || !editor) {
      return false
    }

    if (hideWhenUnavailable && !canToggle()) {
      return false
    }

    return true
  }, [colorAvailable, editor, hideWhenUnavailable, canToggle])

  const handleColorSelect = React.useCallback(
    (color: string) => {
      if (!editor || isDisabled) return
      setTextColor(editor, color)
      setIsOpen(false)
    },
    [editor, isDisabled]
  )

  const handleClearColor = React.useCallback(() => {
    if (!editor || isDisabled) return
    unsetTextColor(editor)
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
        aria-label="Text color"
        aria-pressed={isActive}
        tooltip="Text color"
        onClick={handleButtonClick}
        {...buttonProps}
      >
        {children || (
          <div className="relative">
            <TextColorIcon className="tiptap-button-icon" />
            <div 
              className="absolute bottom-0 left-0 right-0 h-1 rounded-sm"
              style={{ backgroundColor: currentColor || "#000000" }}
            />
          </div>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="grid grid-cols-5 gap-1 mb-2">
            {defaultTextColors.map((color) => (
              <button
                key={color}
                type="button"
                className="w-6 h-6 rounded border border-gray-300 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                aria-label={`Set text color to ${color}`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="color"
              className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
              onChange={(e) => handleColorSelect(e.target.value)}
              aria-label="Custom text color"
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

export default TextColorButton