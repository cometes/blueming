"use client"

import * as React from "react"
import { type Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { FontSizeIcon } from "@/components/tiptap-icons/font-size-icon"

export interface FontSizeInputProps {
  editor?: Editor | null
  className?: string
  disabled?: boolean
  hideWhenUnavailable?: boolean
}

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

export function getCurrentFontSize(editor: Editor | null): number | null {
  if (!editor) return null

  const { fontSize } = editor.getAttributes("textStyle")
  if (!fontSize) return null
  
  // "16px" → 16으로 변환
  const sizeMatch = fontSize.match(/^(\d+)px$/)
  return sizeMatch ? parseInt(sizeMatch[1], 10) : null
}

export function FontSizeInput({
  editor: providedEditor,
  className = "",
  disabled = false,
  hideWhenUnavailable = false,
}: FontSizeInputProps) {
  const editor = useTiptapEditor(providedEditor)
  const [inputValue, setInputValue] = React.useState("")
  const [isFocused, setIsFocused] = React.useState(false)

  const textStyleAvailable = React.useMemo(
    () => checkTextStyleExtension(editor),
    [editor]
  )

  const currentFontSize = getCurrentFontSize(editor)

  const canToggle = React.useCallback((): boolean => {
    if (!editor || !textStyleAvailable) return false
    return canSetFontSize(editor)
  }, [editor, textStyleAvailable])

  const isDisabled = disabled || !canToggle()

  const show = React.useMemo(() => {
    if (!textStyleAvailable || !editor) {
      return false
    }

    if (hideWhenUnavailable && !canToggle()) {
      return false
    }

    return true
  }, [textStyleAvailable, editor, hideWhenUnavailable, canToggle])

  // 현재 폰트 크기가 변경되면 입력값 업데이트 (포커스 중이 아닐 때만)
  React.useEffect(() => {
    if (!isFocused) {
      setInputValue(currentFontSize ? currentFontSize.toString() : "")
    }
  }, [currentFontSize, isFocused])

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
    },
    []
  )

  const handleApplySize = React.useCallback(() => {
    if (!editor || isDisabled) return
    
    const sizeValue = parseInt(inputValue, 10)
    
    if (inputValue === "" || isNaN(sizeValue)) {
      // 빈 값이면 폰트 크기 제거
      unsetFontSize(editor)
      return
    }
    
    if (sizeValue < 12 || sizeValue > 56) {
      alert("폰트 크기는 12px ~ 56px 사이의 값이어야 합니다.")
      return
    }
    
    setFontSize(editor, `${sizeValue}px`)
  }, [editor, isDisabled, inputValue])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleApplySize()
        e.currentTarget.blur()
      }
    },
    [handleApplySize]
  )

  const handleFocus = React.useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = React.useCallback(() => {
    setIsFocused(false)
    handleApplySize()
  }, [handleApplySize])

  if (!show || !editor || !editor.isEditable) {
    return null
  }

  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      <FontSizeIcon className="w-4 h-4 text-gray-600" />
      <input
        type="number"
        min="12"
        max="56"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isDisabled}
        placeholder="크기"
        className="w-12 px-1 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label="Font size"
        title="폰트 크기 (12-56px)"
      />
      <span className="text-xs text-gray-500">px</span>
    </div>
  )
}

export default FontSizeInput