"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlignCenterHorizontal,
	AlignCenterVertical,
	AlignEndHorizontal,
	AlignEndVertical,
	AlignStartHorizontal,
	AlignStartVertical,
} from "lucide-react";
import type { StickerBoardComponent } from "@/features/stickerboard-editor/model";

interface StickerBoardAlignmentSectionProps {
	selectedComponent: StickerBoardComponent;
	onUpdate: (
		componentId: number,
		updater: (prev: StickerBoardComponent) => StickerBoardComponent,
	) => void;
	onAlign: (
		direction: "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom",
	) => void;
}

export function StickerBoardAlignmentSection({
	selectedComponent,
	onUpdate,
	onAlign,
}: StickerBoardAlignmentSectionProps) {
	return (
		<div className="mt-4 space-y-2">
			<div className="text-xs font-medium text-gray-600">효과</div>
			<div className="grid grid-cols-2 gap-3">
				<div>
					<div className="text-xs font-medium text-gray-600">불투명도(%)</div>
					<Input
						className="mt-2"
						type="number"
						min={0}
						max={100}
						step={1}
						value={selectedComponent.opacity ?? 100}
						disabled={selectedComponent.isLocked === true}
						onChange={(e) => {
							const opacity = Number(e.target.value || 0);
							onUpdate(selectedComponent.id, (prev) => ({
								...prev,
								opacity: Number.isFinite(opacity)
									? Math.max(0, Math.min(100, opacity))
									: 100,
							}));
						}}
					/>
				</div>

				<div>
					<div className="text-xs font-medium text-gray-600">블렌드</div>
					<div className="mt-2">
						<Select
							value={selectedComponent.blendMode ?? "normal"}
							onValueChange={(value) => {
								onUpdate(selectedComponent.id, (prev) => ({
									...prev,
									blendMode: value as typeof prev.blendMode,
								}));
							}}
							disabled={selectedComponent.isLocked === true}
						>
							<SelectTrigger>
								<SelectValue placeholder="blend" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="normal">normal</SelectItem>
								<SelectItem value="multiply">multiply</SelectItem>
								<SelectItem value="screen">screen</SelectItem>
								<SelectItem value="overlay">overlay</SelectItem>
								<SelectItem value="darken">darken</SelectItem>
								<SelectItem value="lighten">lighten</SelectItem>
								<SelectItem value="color-dodge">color-dodge</SelectItem>
								<SelectItem value="color-burn">color-burn</SelectItem>
								<SelectItem value="hard-light">hard-light</SelectItem>
								<SelectItem value="soft-light">soft-light</SelectItem>
								<SelectItem value="difference">difference</SelectItem>
								<SelectItem value="exclusion">exclusion</SelectItem>
								<SelectItem value="hue">hue</SelectItem>
								<SelectItem value="saturation">saturation</SelectItem>
								<SelectItem value="color">color</SelectItem>
								<SelectItem value="luminosity">luminosity</SelectItem>
								<SelectItem value="plus-lighter">plus-lighter</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</div>

			<div className="text-xs font-medium text-gray-600">스티커 정렬</div>
			<ButtonGroup className="flex w-full items-center justify-between gap-2">
				<ButtonGroup className="flex-1 justify-center rounded-md border border-stone-700 bg-stone-800 overflow-hidden divide-x divide-stone-700">
					<Button
						type="button"
						variant="ghost"
						className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
						disabled={selectedComponent.isLocked === true}
						onClick={() => onAlign("left")}
						title="왼쪽 정렬"
					>
						<AlignStartVertical className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
						disabled={selectedComponent.isLocked === true}
						onClick={() => onAlign("hcenter")}
						title="가로 가운데 정렬"
					>
						<AlignCenterVertical className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700 focus:z-10"
						disabled={selectedComponent.isLocked === true}
						onClick={() => onAlign("right")}
						title="오른쪽 정렬"
					>
						<AlignEndVertical className="h-4 w-4" />
					</Button>
				</ButtonGroup>

				<ButtonGroup className="flex-1 justify-center rounded-md border border-stone-700 bg-stone-800 overflow-hidden divide-x divide-stone-700">
					<Button
						type="button"
						variant="ghost"
						className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
						disabled={selectedComponent.isLocked === true}
						onClick={() => onAlign("top")}
						title="위 정렬"
					>
						<AlignStartHorizontal className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
						disabled={selectedComponent.isLocked === true}
						onClick={() => onAlign("vcenter")}
						title="세로 가운데 정렬"
					>
						<AlignCenterHorizontal className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
						disabled={selectedComponent.isLocked === true}
						onClick={() => onAlign("bottom")}
						title="아래 정렬"
					>
						<AlignEndHorizontal className="h-4 w-4" />
					</Button>
				</ButtonGroup>
			</ButtonGroup>
		</div>
	);
}
