"use client";

import { useState, useEffect } from "react";
import { SketchPicker, ColorResult } from "react-color";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
	value?: string;
	onChange?: (color: string) => void;
	className?: string;
}

export function ColorPicker({
	value = "#000000",
	onChange,
	className,
}: ColorPickerProps) {
	const [color, setColor] = useState(value);

	// Sync internal state with prop value
	useEffect(() => {
		setColor(value);
	}, [value]);

	const handleChange = (newColor: ColorResult) => {
		// Use hex if alpha is 1, otherwise use rgba
		const colorValue = newColor.rgb.a === 1 
			? newColor.hex 
			: `rgba(${newColor.rgb.r}, ${newColor.rgb.g}, ${newColor.rgb.b}, ${newColor.rgb.a})`;
		setColor(colorValue);
		onChange?.(colorValue);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"block h-8 w-8 min-h-[32px] min-w-[32px] rounded-card border border-card bg-transparent focus:outline-none",
						className
					)}
					style={{ backgroundColor: color }}
				>
					<span className="sr-only">Pick a color</span>
				</button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-0 border-0 bg-card backdrop-blur-card"
				align="start"
				portal={false}
			>
				<SketchPicker color={color} onChange={handleChange} />
			</PopoverContent>
		</Popover>
	);
}
