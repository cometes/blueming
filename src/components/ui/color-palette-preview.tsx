import { generateColorPalette } from "@/shared/lib/utils";

interface ColorPalettePreviewProps {
	color: string;
	showLabels?: boolean;
}

export function ColorPalettePreview({
	color,
	showLabels = false,
}: ColorPalettePreviewProps) {
	const palette = generateColorPalette(color);

	// 3가지 색상만 표시 (밝은색, 원본, 어두운색)
	const displayColors = [
		{ key: "light", value: palette.light },
		{ key: "base", value: palette.base },
		{ key: "dark", value: palette.dark },
	];

	return (
		<div className="flex items-center gap-1">
			{displayColors.map(({ key, value }) => (
				<div
					key={key}
					className="group relative"
					title={`${key}: ${value}`}
				>
					<div
						className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer transition-transform hover:scale-110"
						style={{ backgroundColor: value }}
					/>
					{showLabels && (
						<div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
							{key}: {value}
						</div>
					)}
				</div>
			))}
		</div>
	);
}
