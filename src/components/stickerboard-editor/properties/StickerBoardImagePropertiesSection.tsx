"use client";

import { FlipHorizontal2, FlipVertical2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { StickerBoardTransformFields } from "@/components/stickerboard-editor/properties/StickerBoardTransformFields";
import { isImageSticker } from "@/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/types/stickerBoard";

interface StickerBoardImagePropertiesSectionProps {
	component: StickerBoardComponent;
	canvasSize: { width: number; height: number };
	values: { x: string; y: string; width: string; height: string };
	onUpdate: (id: number, updater: (prev: StickerBoardComponent) => StickerBoardComponent) => void;
	onFieldChange: (field: "x" | "y" | "width" | "height", value: string) => void;
	onFieldFocus: (field: "x" | "y" | "width" | "height") => void;
	onFieldCommit: (field: "x" | "y" | "width" | "height") => void;
}

export function StickerBoardImagePropertiesSection({
	component,
	canvasSize,
	values,
	onUpdate,
	onFieldChange,
	onFieldFocus,
	onFieldCommit,
}: StickerBoardImagePropertiesSectionProps) {
	if (!isImageSticker(component)) return null;

	return (
		<div className="mt-4 space-y-4">
			<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
				<div className="text-xs font-medium text-gray-700">비율 고정</div>
				<Checkbox
					checked={component.lockAspectRatio === true}
					disabled={component.isLocked === true}
					onCheckedChange={(checked) => {
						onUpdate(component.id, (prev) => ({
							...prev,
							lockAspectRatio: checked === true,
						}));
					}}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<div className="text-xs font-medium text-gray-600">맞춤</div>
					<div className="mt-2">
						<Select
							value={component.imageFit ?? "contain"}
							onValueChange={(value) => {
								onUpdate(component.id, (prev) => {
									if (!isImageSticker(prev)) return prev;
									return { ...prev, imageFit: value as "contain" | "cover" };
								});
							}}
							disabled={component.isLocked === true}
						>
							<SelectTrigger>
								<SelectValue placeholder="contain/cover" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="contain">contain</SelectItem>
								<SelectItem value="cover">cover</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div>
					<div className="text-xs font-medium text-gray-600">뒤집기</div>
					<div className="mt-2">
						<ButtonGroup className="flex-1 justify-center rounded-md border border-stone-700 bg-stone-800 overflow-hidden divide-x divide-stone-700">
							<Button
								type="button"
								variant="ghost"
								className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
								disabled={component.isLocked === true}
								onClick={() => {
									onUpdate(component.id, (prev) => ({
										...prev,
										flipX: !(prev.flipX === true),
									}));
								}}
							>
								<FlipHorizontal2 className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700 focus:z-10"
								disabled={component.isLocked === true}
								onClick={() => {
									onUpdate(component.id, (prev) => ({
										...prev,
										flipY: !(prev.flipY === true),
									}));
								}}
							>
								<FlipVertical2 className="h-4 w-4" />
							</Button>
						</ButtonGroup>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<div className="text-xs font-medium text-gray-600">회전(°)</div>
					<Input
						className="mt-2"
						type="number"
						step={1}
						value={component.rotation ?? 0}
						disabled={component.isLocked === true}
						onChange={(e) => {
							const rotation = Number(e.target.value || 0);
							onUpdate(component.id, (prev) => ({
								...prev,
								rotation: Number.isFinite(rotation) ? rotation : 0,
							}));
						}}
					/>
				</div>
				<div>
					<div className="text-xs font-medium text-gray-600">투명도(%)</div>
					<Input
						className="mt-2"
						type="number"
						min={0}
						max={100}
						step={1}
						value={component.opacity ?? 100}
						disabled={component.isLocked === true}
						onChange={(e) => {
							const opacity = Number(e.target.value || 0);
							onUpdate(component.id, (prev) => ({
								...prev,
								opacity: Number.isFinite(opacity)
									? Math.max(0, Math.min(100, opacity))
									: 100,
							}));
						}}
					/>
				</div>
			</div>

			<StickerBoardTransformFields
				componentId={component.id}
				disabled={component.isLocked === true}
				canvasWidth={canvasSize.width}
				canvasHeight={canvasSize.height}
				values={values}
				onFieldChange={onFieldChange}
				onFieldFocus={onFieldFocus}
				onFieldCommit={onFieldCommit}
			/>
		</div>
	);
}
