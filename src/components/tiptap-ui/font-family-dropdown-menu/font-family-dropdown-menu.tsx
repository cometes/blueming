"use client"

import * as React from "react"
import { isNodeSelection, type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { FontFamilyIcon } from "@/components/tiptap-icons/font-family-icon"

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

export interface FontFamilyDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  fonts?: { name: string; value: string }[]
  hideWhenUnavailable?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export const defaultFontFamilies = [
  { name: "Pretendard", value: "Pretendard" },
  { name: "Noto Sans KR", value: "Noto Sans KR" },
  { name: "Malgun Gothic", value: "Malgun Gothic" },
  { name: "Inter", value: "Inter" },
  { name: "Arial", value: "Arial" },
  { name: "Helvetica", value: "Helvetica" },
  { name: "Times New Roman", value: "Times New Roman" },
  { name: "Georgia", value: "Georgia" },
  { name: "Courier New", value: "Courier New" },
  { name: "Verdana", value: "Verdana" },
  { name: "Trebuchet MS", value: "Trebuchet MS" },
  { name: "Arial Black", value: "Arial Black" },
  { name: "Impact", value: "Impact" },
]

export function checkFontFamilyExtension(editor: Editor | null): boolean {
  if (!editor) return false

  const hasExtension = editor.extensionManager.extensions.some(
    (extension) => extension.name === "fontFamily"
  )

  if (!hasExtension) {
    console.warn(
      "FontFamily extension is not available. " +
        "Make sure it is included in your editor configuration."
    )
  }

  return hasExtension
}

export function canSetFontFamily(editor: Editor | null): boolean {
  if (!editor) return false
  
  try {
    return editor.can().setFontFamily("Arial")
  } catch {
    return false
  }
}

export function setFontFamily(editor: Editor | null, fontFamily: string): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .setFontFamily(fontFamily)
    .run()
}

export function unsetFontFamily(editor: Editor | null): boolean {
  if (!editor) return false

  return editor
    .chain()
    .focus()
    .unsetFontFamily()
    .run()
}

export function getCurrentFontFamily(editor: Editor | null): string | null {
  if (!editor) return null

  const { fontFamily } = editor.getAttributes("textStyle")
  return fontFamily || null
}

export function FontFamilyDropdownMenu({
  editor: providedEditor,
  fonts = defaultFontFamilies,
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: FontFamilyDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const editor = useTiptapEditor(providedEditor)

  const fontFamilyAvailable = React.useMemo(
    () => checkFontFamilyExtension(editor),
    [editor]
  )

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    },
    [onOpenChange]
  )

  const currentFontFamily = getCurrentFontFamily(editor)

  const canToggle = React.useCallback((): boolean => {
    if (!editor || !fontFamilyAvailable) return false
    return canSetFontFamily(editor)
  }, [editor, fontFamilyAvailable])

  const isDisabled = !canToggle()
  const isActive = Boolean(currentFontFamily)

  const show = React.useMemo(() => {
    if (!fontFamilyAvailable || !editor) {
      return false
    }

    if (hideWhenUnavailable) {
      if (isNodeSelection(editor.state.selection) || !canToggle()) {
        return false
      }
    }

    return true
  }, [fontFamilyAvailable, editor, hideWhenUnavailable, canToggle])

  const handleFontSelect = React.useCallback(
    (fontFamily: string) => {
      if (!editor || isDisabled) return
      setFontFamily(editor, fontFamily)
      setIsOpen(false)
    },
    [editor, isDisabled]
  )

  const handleClearFont = React.useCallback(() => {
    if (!editor || isDisabled) return
    unsetFontFamily(editor)
    setIsOpen(false)
  }, [editor, isDisabled])

  const getCurrentFontName = React.useCallback(() => {
    if (!currentFontFamily) return null
    const currentFont = fonts.find(font => font.value === currentFontFamily)
    return currentFont?.name || currentFontFamily
  }, [currentFontFamily, fonts])

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
          aria-label="Font family"
          aria-pressed={isActive}
          tooltip="Font family"
          {...props}
        >
          <FontFamilyIcon className="tiptap-button-icon" />
          {getCurrentFontName() && (
            <span className="tiptap-button-text">{getCurrentFontName()}</span>
          )}
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          {currentFontFamily && (
            <DropdownMenuItem asChild>
              <Button
                type="button"
                data-style="ghost"
                onClick={handleClearFont}
                className="w-full justify-start"
              >
                Default
              </Button>
            </DropdownMenuItem>
          )}
          {fonts.map((font) => (
            <DropdownMenuItem key={`font-family-${font.value}`} asChild>
              <Button
                type="button"
                data-style="ghost"
                data-active-state={currentFontFamily === font.value ? "on" : "off"}
                onClick={() => handleFontSelect(font.value)}
                className="w-full justify-start"
              >
                <span style={{ fontFamily: font.value }}>{font.name}</span>
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default FontFamilyDropdownMenu