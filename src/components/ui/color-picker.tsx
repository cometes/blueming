"use client";

import { useState } from "react";
import { SketchPicker, ColorResult } from "react-color";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ColorPickerProps {
	value?: string;
	onChange?: (color: string) => void;
	className?: string;
}

export function ColorPicker({ value = "#000000", onChange, className }: ColorPickerProps) {
	const [color, setColor] = useState(value);

	const handleChange = (newColor: ColorResult) => {
		const rgbaColor = `rgba(${newColor.rgb.r}, ${newColor.rgb.g}, ${newColor.rgb.b}, ${newColor.rgb.a})`;
		setColor(rgbaColor);
		onChange?.(rgbaColor);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={className}
					style={{
						backgroundColor: color,
						minWidth: "64px",
						minHeight: "40px",
					}}
				>
					<span className="sr-only">Pick a color</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0 border-0" align="start">
				<SketchPicker color={color} onChange={handleChange} />
			</PopoverContent>
		</Popover>
	);
}
