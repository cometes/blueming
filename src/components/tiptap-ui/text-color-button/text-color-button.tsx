"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";
import { SketchPicker } from "react-color";
import type { ColorResult } from "react-color";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import { useSettings } from "@/contexts/SettingsContext";

// --- Icons ---
import { TextColorIcon } from "@/components/tiptap-icons/text-color-icon";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";

export interface TextColorButtonProps extends ButtonProps {
	editor?: Editor | null;
	hideWhenUnavailable?: boolean;
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
];

export function checkColorExtension(editor: Editor | null): boolean {
	if (!editor) return false;

	const hasExtension = editor.extensionManager.extensions.some(
		(extension) => extension.name === "color"
	);

	if (!hasExtension) {
		console.warn(
			"Color extension is not available. " +
				"Make sure it is included in your editor configuration."
		);
	}

	return hasExtension;
}

export function canSetColor(editor: Editor | null): boolean {
	if (!editor) return false;

	try {
		return editor.can().setColor("#000000");
	} catch {
		return false;
	}
}

export function setTextColor(editor: Editor | null, color: string): boolean {
	if (!editor) return false;

	return editor.chain().focus().setColor(color).run();
}

export function unsetTextColor(editor: Editor | null): boolean {
	if (!editor) return false;

	return editor.chain().focus().unsetColor().run();
}

export function getCurrentTextColor(editor: Editor | null): string | null {
	if (!editor) return null;

	const { color } = editor.getAttributes("textStyle");
	return color || null;
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
	const editor = useTiptapEditor(providedEditor);
	const { general } = useSettings();
	const mainFontColor = general?.design?.font?.mainFontColor || "#000000";
	const [isOpen, setIsOpen] = React.useState(false);
	const [pickerColor, setPickerColor] = React.useState("#000000");
	const popupRef = React.useRef<HTMLDivElement>(null);
	const buttonRef = React.useRef<HTMLButtonElement>(null);
	const previousIsOpenRef = React.useRef(false);

	const colorAvailable = React.useMemo(
		() => checkColorExtension(editor),
		[editor]
	);

	const currentColor = getCurrentTextColor(editor);

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
				setPickerColor(mainFontColor);
			}
		}
	}, [isOpen, currentColor, mainFontColor]);

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
		if (!editor || !colorAvailable) return false;
		return canSetColor(editor);
	}, [editor, colorAvailable]);

	const isDisabled = disabled || !canToggle();
	const isActive = Boolean(currentColor);

	const show = React.useMemo(() => {
		if (!colorAvailable || !editor) {
			return false;
		}

		if (hideWhenUnavailable && !canToggle()) {
			return false;
		}

		return true;
	}, [colorAvailable, editor, hideWhenUnavailable, canToggle]);

	const handleColorSelect = React.useCallback(
		(color: string) => {
			if (!editor || isDisabled) return;
			setTextColor(editor, color);
			setIsOpen(false);
		},
		[editor, isDisabled]
	);

	const handleClearColor = React.useCallback(() => {
		if (!editor || isDisabled) return;
		unsetTextColor(editor);
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
		<div className="relative" data-component="text-color-button">
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
							presetColors={defaultTextColors}
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

export default TextColorButton;
