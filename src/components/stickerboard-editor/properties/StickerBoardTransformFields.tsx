"use client";

import { Input } from "@/components/ui/input";

type TransformField = "x" | "y" | "width" | "height";

interface StickerBoardTransformFieldsProps {
	componentId: number;
	disabled: boolean;
	canvasWidth: number;
	canvasHeight: number;
	values: Record<TransformField, string>;
	onFieldChange: (field: TransformField, value: string) => void;
	onFieldFocus: (field: TransformField) => void;
	onFieldCommit: (field: TransformField) => void;
}

const FIELD_CONFIG = [
	{ field: "x", label: "X(px)", min: undefined },
	{ field: "y", label: "Y(px)", min: undefined },
	{ field: "width", label: "가로(px)", min: 2 },
	{ field: "height", label: "세로(px)", min: 2 },
] as const;

export function StickerBoardTransformFields({
	disabled,
	canvasWidth,
	canvasHeight,
	values,
	onFieldChange,
	onFieldFocus,
	onFieldCommit,
}: StickerBoardTransformFieldsProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			{FIELD_CONFIG.map(({ field, label, min }) => (
				<div key={field}>
					<div className="text-xs font-medium text-gray-600">{label}</div>
					<Input
						className="mt-2"
						type="number"
						min={min}
						max={
							field === "width"
								? Math.max(0, Math.round(canvasWidth))
								: field === "height"
									? Math.max(0, Math.round(canvasHeight))
									: undefined
						}
						step={1}
						value={values[field]}
						disabled={disabled}
						onFocus={() => onFieldFocus(field)}
						onChange={(e) => onFieldChange(field, e.target.value)}
						onBlur={() => onFieldCommit(field)}
						onKeyDown={(e) => {
							if (e.key !== "Enter") return;
							e.preventDefault();
							onFieldCommit(field);
						}}
					/>
				</div>
			))}
		</div>
	);
}
