import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSlate, ReactEditor } from "slate-react";
import { Transforms, Editor } from "slate";
import { DropletOff, PaintBucket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BackgroundColorButtonProps } from "./types";
import { CustomEditor, CustomText } from "../../../types/slate";
import { RgbaStringColorPicker } from "react-colorful";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const BackgroundColorButton: React.FC<BackgroundColorButtonProps> = ({
	defaultColor: propDefaultColor,
	onColorChange: propOnColorChange,
	...restProps
}) => {
	const editor = useSlate();
	const defaultColor = useMemo(
		() => propDefaultColor || "rgba(255, 255, 255, 1)",
		[propDefaultColor]
	);
	const inactiveColor = "rgba(255, 255, 255, 0)";
	const [currentColor, setCurrentColor] = useState(inactiveColor);
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState("#ffffff");
	const [pickerColor, setPickerColor] = useState(defaultColor);

	const getActiveBackgroundColor = useCallback((): string => {
		const marks = Editor.marks(editor) as CustomText | null;
		return marks?.backgroundColor || inactiveColor;
	}, [editor, inactiveColor]);

	const getAlphaValue = useCallback((color: string): number => {
		const match = color.match(/rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*([\d.]+))?\)/);
		if (match && match[1] !== undefined) {
			return parseFloat(match[1]);
		}
		if (color.match(/rgb\(\d+,\s*\d+,\s*\d+\)/)) {
			return 1;
		}
		return 0;
	}, []);

	const isActive = getAlphaValue(currentColor) > 0;

	const setBackgroundColor = useCallback(
		(color: string): void => {
			const alphaValue = getAlphaValue(color);

			if (alphaValue === 0) {
				Editor.removeMark(editor, "backgroundColor");
			} else {
				Editor.addMark(editor, "backgroundColor", color);
			}

			setCurrentColor(color);
		},
		[editor, getAlphaValue]
	);

	const hexToRgba = useCallback((hex: string, alpha: number = 1): string => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!result) return `rgba(255, 255, 255, ${alpha})`;

		const r = parseInt(result[1], 16);
		const g = parseInt(result[2], 16);
		const b = parseInt(result[3], 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}, []);

	const rgbaToHex = useCallback((rgba: string): string => {
		const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
		if (!match) return "#ffffff";

		const r = parseInt(match[1]).toString(16).padStart(2, "0");
		const g = parseInt(match[2]).toString(16).padStart(2, "0");
		const b = parseInt(match[3]).toString(16).padStart(2, "0");
		return `#${r}${g}${b}`;
	}, []);

	const parseColorInput = useCallback(
		(input: string): string => {
			const trimmed = input.trim();

			if (trimmed.startsWith("#")) {
				if (trimmed.length === 4) {
					const expanded = trimmed.replace(/^#(.)(.)(.)$/, "#$1$1$2$2$3$3");
					return hexToRgba(expanded);
				} else if (trimmed.length === 7) {
					return hexToRgba(trimmed);
				}
			}

			return currentColor;
		},
		[currentColor, hexToRgba]
	);

	const handleColorChange = useCallback(
		(color: string) => {
			setPickerColor(color);
			setCurrentColor(color);
			setBackgroundColor(color);
			setInputValue(rgbaToHex(color)); // 인풋 필드에 HEX 값 업데이트
			propOnColorChange?.(color);
		},
		[setBackgroundColor, propOnColorChange, rgbaToHex]
	);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			let value = e.target.value;

			if (!value.startsWith("#")) {
				value = "#" + value.replace("#", "");
			}

			if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
				const rgbaColor = hexToRgba(value);
				setPickerColor(rgbaColor);
			}

			setInputValue(value);
		},
		[hexToRgba]
	);

	const handleInputApply = useCallback(() => {
		const parsedColor = parseColorInput(inputValue);
		const savedSelection = editor.selection;

		setCurrentColor(parsedColor);
		setBackgroundColor(parsedColor);
		setIsOpen(false);

		setTimeout(() => {
			if (savedSelection) {
				Transforms.select(editor, savedSelection);
			}
			ReactEditor.focus(editor);
		}, 0);
	}, [inputValue, parseColorInput, setBackgroundColor, editor]);

	const handleInputKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				handleInputApply();
			}
		},
		[handleInputApply]
	);

	const handleRemoveColor = useCallback(() => {
		const savedSelection = editor.selection;

		// 즉시 에디터로 포커스 이동 (버튼 포커스 방지)
		ReactEditor.focus(editor);
		if (savedSelection) {
			Transforms.select(editor, savedSelection);
		}

		setBackgroundColor(inactiveColor);
		setPickerColor(defaultColor);
		setInputValue("#ffffff");
		setIsOpen(false);
	}, [editor, inactiveColor, defaultColor, setBackgroundColor]);

	const handleClick = useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			ReactEditor.focus(editor);
		},
		[editor]
	);

	useEffect(() => {
		const activeColor = getActiveBackgroundColor();
		setCurrentColor(activeColor);

		const hexValue =
			getAlphaValue(activeColor) > 0 ? rgbaToHex(activeColor) : "#ffffff";
		setInputValue(hexValue);

		if (getAlphaValue(activeColor) > 0) {
			setPickerColor(activeColor);
		}
	}, [editor.selection, getActiveBackgroundColor, getAlphaValue, rgbaToHex]);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className={cn(
						"w-8 h-8 p-0 hover:bg-muted",
						isActive && "bg-muted",
						restProps.className
					)}
					disabled={restProps.disabled}
					onMouseDown={handleClick}
				>
					<PaintBucket
						size={16}
						className={cn(
							"text-muted-foreground",
							isActive && "text-foreground"
						)}
						style={{
							color: isActive ? currentColor : undefined,
						}}
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="max-w-[240px]" align="center">
				<div className="flex flex-col gap-2">
					{isActive && (
						<Button
							className="w-full gap-1 rounded-[4px] h-7"
							onClick={handleRemoveColor}
						>
							<DropletOff size={14} /> 없음
						</Button>
					)}

					<div>
						<RgbaStringColorPicker
							color={pickerColor}
							onChange={handleColorChange}
						/>
					</div>

					<div className="flex items-center justify-between gap-1.5">
						<div
							className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0"
							style={{ backgroundColor: pickerColor }}
							title="선택된 색상"
						/>
						<Input
							type="text"
							placeholder="#ffffff"
							value={inputValue}
							onChange={handleInputChange}
							onKeyDown={handleInputKeyDown}
							className="rounded-[4px] h-7 px-2"
						/>
						<Button
							onClick={handleInputApply}
							className="h-7 px-2 rounded-[4px]"
						>
							적용
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default BackgroundColorButton;
