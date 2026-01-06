"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";
import { SketchPicker } from "react-color";
import type { ColorResult } from "react-color";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import { useSettings } from "@/contexts/SettingsContext";

// --- Icons ---
import { BackgroundColorIcon } from "@/components/tiptap-icons/background-color-icon";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";

export interface TextBackgroundColorButtonProps extends ButtonProps {
	editor?: Editor | null;
	hideWhenUnavailable?: boolean;
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
];

export function checkHighlightExtension(editor: Editor | null): boolean {
	if (!editor) return false;

	const hasExtension = editor.extensionManager.extensions.some(
		(extension) => extension.name === "highlight"
	);

	if (!hasExtension) {
		return false;
	}

	return hasExtension;
}

export function canSetHighlight(editor: Editor | null): boolean {
	if (!editor) return false;

	try {
		return editor.can().setHighlight({ color: "#FFFF00" });
	} catch {
		return false;
	}
}

export function setBackgroundColor(
	editor: Editor | null,
	color: string
): boolean {
	if (!editor) return false;

	return editor.chain().focus().setHighlight({ color }).run();
}

export function unsetBackgroundColor(editor: Editor | null): boolean {
	if (!editor) return false;

	return editor.chain().focus().unsetHighlight().run();
}

export function getCurrentBackgroundColor(
	editor: Editor | null
): string | null {
	if (!editor) return null;

	const { color } = editor.getAttributes("highlight");
	return color || null;
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
	const editor = useTiptapEditor(providedEditor);
	const { general } = useSettings();
	const mainFontColor = general?.design?.font?.mainFontColor || "#000000";
	const [isOpen, setIsOpen] = React.useState(false);
	const [pickerColor, setPickerColor] = React.useState("#FFFF00");
	const popupRef = React.useRef<HTMLDivElement>(null);
	const buttonRef = React.useRef<HTMLButtonElement>(null);
	const previousIsOpenRef = React.useRef(false);

	const highlightAvailable = React.useMemo(
		() => checkHighlightExtension(editor),
		[editor]
	);

	const currentColor = getCurrentBackgroundColor(editor);

	// 팝업 위치 계산
	const [popupPosition, setPopupPosition] = React.useState<{
		top: number;
		left: number;
	} | null>(null);

	React.useEffect(() => {
		if (isOpen && buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setPopupPosition({
				top: rect.bottom + 4,
				left: rect.left,
			});
			// 팝업이 열릴 때 현재 색상으로 초기화
			if (currentColor) {
				setPickerColor(currentColor);
			} else {
				setPickerColor("#FFFF00");
			}
		}
	}, [isOpen, currentColor]);

	// 팝업이 닫힐 때 색상 적용
	React.useEffect(() => {
		// 팝업이 열려있다가 닫힐 때 색상 적용
		if (previousIsOpenRef.current && !isOpen) {
			handleApplyColorRef.current();
		}
		previousIsOpenRef.current = isOpen;
	}, [isOpen]);

	// 외부 클릭 시 팝업 닫기
	React.useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				popupRef.current &&
				!popupRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Enter") {
				event.preventDefault();
				handleApplyColorRef.current();
			} else if (event.key === "Escape") {
				event.preventDefault();
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	const canToggle = React.useCallback((): boolean => {
		if (!editor || !highlightAvailable) return false;
		return canSetHighlight(editor);
	}, [editor, highlightAvailable]);

	const isDisabled = disabled || !canToggle();
	const isActive = Boolean(currentColor);

	const show = React.useMemo(() => {
		if (!highlightAvailable || !editor) {
			return false;
		}

		if (hideWhenUnavailable && !canToggle()) {
			return false;
		}

		return true;
	}, [highlightAvailable, editor, hideWhenUnavailable, canToggle]);

	const handleColorSelect = React.useCallback(
		(color: string) => {
			if (!editor || isDisabled) return;
			setBackgroundColor(editor, color);
			setIsOpen(false);
		},
		[editor, isDisabled]
	);

	const handleClearColor = React.useCallback(() => {
		if (!editor || isDisabled) return;
		unsetBackgroundColor(editor);
		setIsOpen(false);
	}, [editor, isDisabled]);

	const handleColorChange = React.useCallback((color: ColorResult) => {
		// 드래그 중에는 미리보기만 (색상 적용하지 않음)
		setPickerColor(color.hex);
	}, []);

	const handleApplyColor = React.useCallback(() => {
		if (pickerColor && /^#[0-9A-Fa-f]{6}$/.test(pickerColor)) {
			handleColorSelect(pickerColor);
		}
	}, [pickerColor, handleColorSelect]);

	// handleApplyColor를 useEffect 의존성에 안전하게 추가하기 위해 useRef 사용
	const handleApplyColorRef = React.useRef(handleApplyColor);
	React.useEffect(() => {
		handleApplyColorRef.current = handleApplyColor;
	}, [handleApplyColor]);

	const handleButtonClick = React.useCallback(
		(e: React.MouseEvent<HTMLButtonElement>) => {
			e.preventDefault();
			e.stopPropagation();

			if (!isDisabled) {
				setIsOpen(!isOpen);
			}

			onClick?.(e);
		},
		[onClick, isDisabled, isOpen]
	);

	if (!show || !editor || !editor.isEditable) {
		return null;
	}

	return (
		<div className="relative" data-component="text-background-color-button">
			<Button
				ref={buttonRef}
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
							style={{ backgroundColor: currentColor || mainFontColor }}
						/>
					</div>
				)}
			</Button>

			{isOpen && popupPosition && (
				<div
					ref={popupRef}
					className="fixed z-[9999]"
					style={{
						top: `${popupPosition.top}px`,
						left: `${popupPosition.left}px`,
					}}
				>
					<div
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleApplyColor();
							}
						}}
					>
						<SketchPicker
							color={pickerColor}
							onChange={handleColorChange}
							onChangeComplete={(color: ColorResult) => {
								// 드래그 완료 시에도 미리보기만 업데이트 (적용하지 않음)
								setPickerColor(color.hex);
							}}
							width="224px"
							presetColors={defaultBackgroundColors}
						/>
					</div>
					<div className="mt-2 flex gap-2">
						{currentColor && (
							<Button
								type="button"
								data-style="ghost"
								onClick={handleClearColor}
								className="flex-1 text-xs px-2 py-1"
							>
								Clear
							</Button>
						)}
						<Button
							type="button"
							data-style="ghost"
							onClick={handleApplyColor}
							className="flex-1 text-xs px-2 py-1"
						>
							Apply
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

export default TextBackgroundColorButton;
