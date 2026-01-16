"use client"

import * as React from "react"
import { isNodeSelection, type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { AlignLeftIcon } from "@/components/tiptap-icons/align-left-icon"

// --- Tiptap UI ---
import {
  TextAlignButton,
  textAlignIcons,
  textAlignLabels,
  checkTextAlignExtension,
  type TextAlign,
} from "@/components/tiptap-ui/text-align-button/text-align-button"

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

export interface TextAlignDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
  aligns?: TextAlign[]
  hideWhenUnavailable?: boolean
  onOpenChange?: (isOpen: boolean) => void
}

export function TextAlignDropdownMenu({
  editor: providedEditor,
  aligns = ["left", "center", "right", "justify"],
  hideWhenUnavailable = false,
  onOpenChange,
  ...props
}: TextAlignDropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const editor = useTiptapEditor(providedEditor)

  const alignAvailable = React.useMemo(
    () => checkTextAlignExtension(editor),
    [editor]
  )

  const handleOnOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open)
      onOpenChange?.(open)
    },
    [onOpenChange]
  )

  const getActiveIcon = React.useCallback(() => {
    if (!editor) return <AlignLeftIcon className="tiptap-button-icon" />

    const activeAlign = aligns.find((align) =>
      editor.isActive({ textAlign: align })
    ) as TextAlign | undefined

    if (!activeAlign) return <AlignLeftIcon className="tiptap-button-icon" />

    const ActiveIcon = textAlignIcons[activeAlign]
    return <ActiveIcon className="tiptap-button-icon" />
  }, [editor, aligns])

  const canToggleAnyAlign = React.useCallback((): boolean => {
    if (!editor || !alignAvailable) return false
    return aligns.some((align) => {
      try {
        return editor.can().setTextAlign(align)
      } catch {
        return false
      }
    })
  }, [editor, aligns, alignAvailable])

  const isDisabled = !canToggleAnyAlign()
  const isAnyAlignActive = aligns.some((align) => 
    editor?.isActive({ textAlign: align }) ?? false
  )

  const show = React.useMemo(() => {
    if (!alignAvailable || !editor) {
      return false
    }

    if (hideWhenUnavailable) {
      if (isNodeSelection(editor.state.selection) || !canToggleAnyAlign()) {
        return false
      }
    }

    return true
  }, [alignAvailable, editor, hideWhenUnavailable, canToggleAnyAlign])

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
          data-active-state={isAnyAlignActive ? "on" : "off"}
          data-disabled={isDisabled}
          role="button"
          tabIndex={-1}
          aria-label="텍스트 정렬"
          aria-pressed={isAnyAlignActive}
          tooltip="텍스트 정렬"
          {...props}
        >
          {getActiveIcon()}
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuGroup>
          {aligns.map((align) => (
            <DropdownMenuItem key={`text-align-${align}`} asChild>
              <TextAlignButton
                editor={editor}
                align={align}
                text={textAlignLabels[align]}
                tooltip=""
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TextAlignDropdownMenu
