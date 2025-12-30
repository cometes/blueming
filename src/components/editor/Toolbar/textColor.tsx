import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSlate, ReactEditor } from "slate-react";
import { Transforms, Editor, Range, Text } from "slate";
import { DropletOff, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TextColorButtonProps } from "./types";
import { CustomEditor, CustomText } from "../../../types/slate";
import { RgbaStringColorPicker } from "react-colorful";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useSettings } from "@/contexts/SettingsContext";

const TextColorButton: React.FC<TextColorButtonProps> = ({
	defaultColor: propDefaultColor,
	onColorChange: propOnColorChange,
	...restProps
}) => {
	const { general } = useSettings();
	const defaultTextColor = general.design.font.mainFontColor;
    
	const editor = useSlate();
	const defaultColor = useMemo(
		() => propDefaultColor || defaultTextColor,
		[propDefaultColor, defaultTextColor]
	);
	const inactiveColor = "rgba(0, 0, 0, 0)";
	const [currentColor, setCurrentColor] = useState(inactiveColor);
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState(() => {
		// defaultTextColor를 HEX 형식으로 변환
		if (defaultTextColor.startsWith("#")) {
			return defaultTextColor;
		}
		// rgba 형식인 경우 변환 필요
		const match = defaultTextColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
		if (match) {
			const r = parseInt(match[1]).toString(16).padStart(2, "0");
			const g = parseInt(match[2]).toString(16).padStart(2, "0");
			const b = parseInt(match[3]).toString(16).padStart(2, "0");
			return `#${r}${g}${b}`;
		}
		return "#000000";
	});
	const [pickerColor, setPickerColor] = useState(defaultColor);

	const getActiveTextColor = useCallback((): string => {
		const { selection } = editor;
		if (!selection) return inactiveColor;

		// 선택 영역이 확장되어 있을 때 실제 노드들을 확인
		if (Range.isExpanded(selection)) {
			const textNodes = Array.from(
				Editor.nodes(editor, {
					match: (n) => Text.isText(n),
					at: selection,
				})
			);

			// 명시적으로 color 속성이 설정된 노드들만 수집
			const colorsSet = new Set<string>();
			textNodes.forEach(([node]) => {
				const textNode = node as CustomText;
				if (textNode.color) {
					colorsSet.add(textNode.color);
				}
			});

			// 색상이 설정된 텍스트가 없으면 비활성 (기본색만 있는 경우)
			if (colorsSet.size === 0) {
				return inactiveColor;
			}

			// 모든 텍스트에 동일한 색상이 설정되어 있으면 그 색상 반환
			if (colorsSet.size === 1) {
				return Array.from(colorsSet)[0];
			}

			// 여러 색상이 섞여있으면 첫 번째 색상을 반환 (활성 상태 유지)
			return Array.from(colorsSet)[0];
		}

		// 커서만 있을 때는 현재 마크 확인
		const marks = Editor.marks(editor) as CustomText | null;
		return marks?.color || inactiveColor;
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

	const setTextColor = useCallback(
		(color: string): void => {
			const alphaValue = getAlphaValue(color);

			if (alphaValue === 0) {
				Editor.removeMark(editor, "color");
			} else {
				Editor.addMark(editor, "color", color);
			}

			setCurrentColor(color);
		},
		[editor, getAlphaValue]
	);

	const hexToRgba = useCallback((hex: string, alpha: number = 1): string => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!result) return `rgba(0, 0, 0, ${alpha})`;

		const r = parseInt(result[1], 16);
		const g = parseInt(result[2], 16);
		const b = parseInt(result[3], 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}, []);

	const rgbaToHex = useCallback((rgba: string): string => {
		const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
		if (!match) return "#000000";

		const r = parseInt(match[1]).toString(16).padStart(2, "0");
		const g = parseInt(match[2]).toString(16).padStart(2, "0");
		const b = parseInt(match[3]).toString(16).padStart(2, "0");
		return `#${r}${g}${b}`;
	}, []);

	const convertToHex = useCallback((color: string): string => {
		if (color.startsWith("#")) {
			return color;
		}
		return rgbaToHex(color);
	}, [rgbaToHex]);

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
			setTextColor(color);
			setInputValue(rgbaToHex(color));
			propOnColorChange?.(color);
		},
		[setTextColor, propOnColorChange, rgbaToHex]
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
		setTextColor(parsedColor);
		setIsOpen(false);

		setTimeout(() => {
			if (savedSelection) {
				Transforms.select(editor, savedSelection);
			}
			ReactEditor.focus(editor);
		}, 0);
	}, [inputValue, parseColorInput, setTextColor, editor]);

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

		ReactEditor.focus(editor);
		if (savedSelection) {
			Transforms.select(editor, savedSelection);
		}

		setTextColor(inactiveColor);
		setPickerColor(defaultColor);
		setInputValue(convertToHex(defaultTextColor));
		setIsOpen(false);
	}, [editor, inactiveColor, defaultColor, setTextColor, defaultTextColor, convertToHex]);

	const handleClick = useCallback(
		(event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			ReactEditor.focus(editor);
		},
		[editor]
	);

	useEffect(() => {
		const activeColor = getActiveTextColor();
		setCurrentColor(activeColor);

		const hexValue = getAlphaValue(activeColor) > 0 
			? rgbaToHex(activeColor) 
			: convertToHex(defaultTextColor);
		setInputValue(hexValue);

		if (getAlphaValue(activeColor) > 0) {
			setPickerColor(activeColor);
		}
	}, [editor.selection, getActiveTextColor, getAlphaValue, rgbaToHex, defaultTextColor, convertToHex]);

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
					<Palette
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
							placeholder={convertToHex(defaultTextColor)}
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

export default TextColorButton;
