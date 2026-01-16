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
    return false
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

export function getCurrentFontSize(editor: Editor | null): number | null | "mixed" {
  if (!editor) return null

  const { from, to } = editor.state.selection

  // 선택 영역이 없으면 현재 커서 위치의 속성 반환
  if (from === to) {
    const { fontSize } = editor.getAttributes("textStyle")
    if (!fontSize) return 16 // 기본값 16px

    const sizeMatch = fontSize.match(/^(\d+)px$/)
    return sizeMatch ? parseInt(sizeMatch[1], 10) : 16
  }

  // 선택 영역의 모든 폰트 크기 수집
  const fontSizes = new Set<string>()

  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.isText && node.marks.length > 0) {
      const textStyleMark = node.marks.find((mark) => mark.type.name === "textStyle")
      if (textStyleMark?.attrs.fontSize) {
        fontSizes.add(textStyleMark.attrs.fontSize)
      } else {
        fontSizes.add("16px") // 기본값
      }
    } else if (node.isText) {
      fontSizes.add("16px") // 마크 없는 텍스트는 기본값
    }
  })

  // 크기가 혼합되어 있으면 "mixed" 반환
  if (fontSizes.size > 1) return "mixed"

  // 단일 크기면 해당 값 반환
  if (fontSizes.size === 1) {
    const fontSize = Array.from(fontSizes)[0]
    const sizeMatch = fontSize.match(/^(\d+)px$/)
    return sizeMatch ? parseInt(sizeMatch[1], 10) : 16
  }

  return 16 // 기본값
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
  const previousValueRef = React.useRef<string>("")

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
      let newValue = ""
      if (currentFontSize === "mixed") {
        newValue = "" // 혼합된 크기는 빈칸
      } else if (currentFontSize) {
        newValue = currentFontSize.toString()
      } else {
        newValue = "16" // 기본값
      }
      setInputValue(newValue)
      previousValueRef.current = newValue
    }
  }, [currentFontSize, isFocused])

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const prevValue = previousValueRef.current

      setInputValue(value)
      previousValueRef.current = value

      // 스피너 버튼 클릭 감지: 값이 정확히 1 차이나고 유효한 숫자면 즉시 적용
      const currentNum = parseInt(value, 10)
      const prevNum = parseInt(prevValue, 10)

      if (!isNaN(currentNum) && !isNaN(prevNum)) {
        const diff = Math.abs(currentNum - prevNum)

        // 스피너 버튼으로 판단 (정확히 1 차이)
        if (diff === 1 && editor && !isDisabled) {
          const clampedValue = Math.max(12, Math.min(56, currentNum))
          setFontSize(editor, `${clampedValue}px`)

          // 범위를 벗어나면 input 값도 수정
          if (currentNum !== clampedValue) {
            setInputValue(clampedValue.toString())
            previousValueRef.current = clampedValue.toString()
          }
        }
      }
    },
    [editor, isDisabled]
  )

  const handleApplySize = React.useCallback(() => {
    if (!editor || isDisabled) return

    const sizeValue = parseInt(inputValue, 10)

    if (inputValue === "" || isNaN(sizeValue)) {
      // 빈 값이면 폰트 크기 제거
      unsetFontSize(editor)
      return
    }

    // 범위를 벗어나면 자동으로 최소값/최대값으로 제한
    const clampedValue = Math.max(12, Math.min(56, sizeValue))
    setFontSize(editor, `${clampedValue}px`)

    // 범위를 벗어난 경우 input 값도 수정
    if (sizeValue !== clampedValue) {
      setInputValue(clampedValue.toString())
    }
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
    previousValueRef.current = inputValue
  }, [inputValue])

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
        placeholder={currentFontSize === "mixed" ? "" : "16"}
        className="w-11 px-0.5 py-0.5 text-sm text-center border border-gray-300/30 rounded focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary disabled:bg-card-bg disabled:border-0 disabled:ring-0 disabled:text-[#666] disabled:cursor-not-allowed"
        aria-label="글자 크기"
        title="폰트 크기 (12-56px)"
      />
      <span className="text-xs text-gray-500">px</span>
    </div>
  )
}

export default FontSizeInput
