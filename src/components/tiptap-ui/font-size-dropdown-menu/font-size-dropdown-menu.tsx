"use client"

import * as React from "react"
import { isNodeSelection, type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { FontSizeIcon } from "@/components/tiptap-icons/font-size-icon"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/tiptap-ui-primitive/dropdown-menu"

export interface FontSizeDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  sizes?: string[]
  hideWhenUnavailable?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export const defaultFontSizes = [
  "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "40px", "48px", "56px"
]

export function checkTextStyleExtension(editor: Editor | null): boolean {
  if (!editor) return false

  const hasExtension = editor.extensionManager.extensions.some(
    (extension) => extension.name === "textStyle"
  )

  if (!hasExtension) {
    console.warn(
      "TextStyle extension is not available. " +
        "Make sure it is included in your editor configuration."
    )
  }

  return hasExtension
}

export function canSetFontSize(editor: Editor | null): boolean {
  if (!editor) return false
  
  try {
    return editor.can().setMark("textStyle", { fontSize: "16px" })
  } catch {
    return false
  }
}

export function setFontSize(editor: Editor | null, fontSize: string): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .setMark("textStyle", { fontSize })
    .run()
}

export function unsetFontSize(editor: Editor | null): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .unsetMark("textStyle")
    .run()
}

export function getCurrentFontSize(editor: Editor | null): string | null {
  if (!editor) return null

  const { fontSize } = editor.getAttributes("textStyle")
  return fontSize || null
}

export function FontSizeDropdownMenu({
  editor: providedEditor,
  sizes = defaultFontSizes,
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: FontSizeDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [customSize, setCustomSize] = React.useState("")
  const editor = useTiptapEditor(providedEditor)

  const textStyleAvailable = React.useMemo(
    () => checkTextStyleExtension(editor),
    [editor]
  )

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    },
    [onOpenChange]
  )

  const currentFontSize = getCurrentFontSize(editor)

  const canToggle = React.useCallback((): boolean => {
    if (!editor || !textStyleAvailable) return false
    return canSetFontSize(editor)
  }, [editor, textStyleAvailable])

  const isDisabled = !canToggle()
  const isActive = Boolean(currentFontSize)

  const show = React.useMemo(() => {
    if (!textStyleAvailable || !editor) {
      return false
    }

    if (hideWhenUnavailable) {
      if (isNodeSelection(editor.state.selection) || !canToggle()) {
        return false
      }
    }

    return true
  }, [textStyleAvailable, editor, hideWhenUnavailable, canToggle])

  const handleSizeSelect = React.useCallback(
    (size: string) => {
      if (!editor || isDisabled) return
      setFontSize(editor, size)
      setIsOpen(false)
    },
    [editor, isDisabled]
  )

  const handleClearSize = React.useCallback(() => {
    if (!editor || isDisabled) return
    unsetFontSize(editor)
    setCustomSize("")
    setIsOpen(false)
  }, [editor, isDisabled])

  const handleCustomSizeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setCustomSize(value)
    },
    []
  )

  const handleCustomSizeSubmit = React.useCallback(() => {
    if (!editor || isDisabled) return
    
    const sizeValue = parseInt(customSize, 10)
    if (isNaN(sizeValue) || sizeValue < 12 || sizeValue > 56) {
      alert("폰트 크기는 12px ~ 56px 사이의 값이어야 합니다.")
      return
    }
    
    setFontSize(editor, `${sizeValue}px`)
    setCustomSize("")
    setIsOpen(false)
  }, [editor, isDisabled, customSize])

  const handleCustomSizeKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleCustomSizeSubmit()
      }
    },
    [handleCustomSizeSubmit]
  )

  if (!show || !editor || !editor.isEditable) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          disabled={isDisabled}
          data-style="ghost"
          data-active-state={isActive ? "on" : "off"}
          data-disabled={isDisabled}
          role="button"
          tabIndex={-1}
          aria-label="Font size"
          aria-pressed={isActive}
          tooltip="Font size"
          {...props}
        >
          <FontSizeIcon className="tiptap-button-icon" />
          {currentFontSize && (
            <span className="tiptap-button-text">{currentFontSize}</span>
          )}
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <div className="flex items-center gap-2 w-full">
              <input
                type="number"
                min="12"
                max="56"
                value={customSize}
                onChange={handleCustomSizeChange}
                onKeyDown={handleCustomSizeKeyDown}
                placeholder="크기 입력"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="button"
                data-style="ghost"
                onClick={handleCustomSizeSubmit}
                disabled={!customSize || isDisabled}
                className="text-xs px-2 py-1"
              >
                적용
              </Button>
            </div>
          </DropdownMenuItem>
          
          {currentFontSize && (
            <DropdownMenuItem asChild>
              <Button
                type="button"
                data-style="ghost"
                onClick={handleClearSize}
                className="w-full justify-start"
              >
                Default
              </Button>
            </DropdownMenuItem>
          )}
          
          {sizes.map((size) => (
            <DropdownMenuItem key={`font-size-${size}`} asChild>
              <Button
                type="button"
                data-style="ghost"
                data-active-state={currentFontSize === size ? "on" : "off"}
                onClick={() => handleSizeSelect(size)}
                className="w-full justify-start"
              >
                <span style={{ fontSize: size }}>{size}</span>
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default FontSizeDropdownMenu