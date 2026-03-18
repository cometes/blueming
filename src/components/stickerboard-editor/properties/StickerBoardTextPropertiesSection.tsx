"use client";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { StickerBoardTransformFields } from "@/components/stickerboard-editor/properties/StickerBoardTransformFields";
import {
	DEFAULT_TEXT_MAX_WIDTH_PX,
	DEFAULT_TEXT_PADDING,
	isTextSticker,
} from "@/features/stickerboard-editor/lib/stickerboard-utils";
import type {
	StickerBoardComponent,
	StickerBoardTextComponent,
} from "@/features/stickerboard-editor/model";

interface StickerBoardTextPropertiesSectionProps {
	component: StickerBoardTextComponent;
	canvasSize: { width: number; height: number };
	values: { x: string; y: string; width: string; height: string };
	onUpdate: (id: number, updater: (prev: StickerBoardComponent) => StickerBoardComponent) => void;
	onRequestAutoSize: (component: StickerBoardTextComponent) => void;
	onFieldChange: (field: "x" | "y" | "width" | "height", value: string) => void;
	onFieldFocus: (field: "x" | "y" | "width" | "height") => void;
	onFieldCommit: (field: "x" | "y" | "width" | "height") => void;
}

export function StickerBoardTextPropertiesSection({
	component,
	canvasSize,
	values,
	onUpdate,
	onRequestAutoSize,
	onFieldChange,
	onFieldFocus,
	onFieldCommit,
}: StickerBoardTextPropertiesSectionProps) {
	return (
		<div className="mt-4 space-y-4">
			<div className="grid grid-cols-2 gap-3">
				<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-200">
						자동 크기
					</div>
					<input
						type="checkbox"
						checked={component.autoSize !== false}
						disabled={component.isLocked === true}
						onChange={(e) => {
							const next = e.target.checked;
							onUpdate(component.id, (prev) => {
								if (!isTextSticker(prev)) return prev;
								const nextComp: StickerBoardTextComponent = {
									...prev,
									autoSize: next,
									maxWidthPx: prev.maxWidthPx ?? DEFAULT_TEXT_MAX_WIDTH_PX,
									paddingPx: prev.paddingPx ?? DEFAULT_TEXT_PADDING,
								};
								if (nextComp.autoSize !== false) onRequestAutoSize(nextComp);
								return nextComp;
							});
						}}
					/>
				</div>

				<div>
					<div className="text-xs font-medium text-gray-600">최대 폭(px)</div>
					<Input
						className="mt-2"
						type="number"
						min={80}
						max={800}
						step={10}
						value={component.maxWidthPx ?? DEFAULT_TEXT_MAX_WIDTH_PX}
						disabled={component.isLocked === true || component.autoSize === false}
						onChange={(e) => {
							const raw = Number(e.target.value || 0);
							onUpdate(component.id, (prev) => {
								if (!isTextSticker(prev)) return prev;
								const maxWidthPx = Number.isFinite(raw)
									? Math.max(80, Math.min(800, raw))
									: DEFAULT_TEXT_MAX_WIDTH_PX;
								const nextComp: StickerBoardTextComponent = {
									...prev,
									maxWidthPx,
									autoSize: prev.autoSize !== false,
									paddingPx: prev.paddingPx ?? DEFAULT_TEXT_PADDING,
								};
								if (nextComp.autoSize !== false) onRequestAutoSize(nextComp);
								return nextComp;
							});
						}}
					/>
				</div>
			</div>

			<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
				<div className="text-xs font-medium text-gray-700">비율 고정</div>
				<input
					type="checkbox"
					checked={component.lockAspectRatio === true}
					disabled={component.isLocked === true}
					onChange={(e) => {
						onUpdate(component.id, (prev) => ({
							...prev,
							lockAspectRatio: e.target.checked,
						}));
					}}
				/>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<div className="text-xs font-medium text-gray-600">글자색</div>
					<Input
						className="mt-2"
						type="color"
						value={component.style?.textColor ?? "#1f2937"}
						disabled={component.isLocked === true}
						onChange={(e) => {
							const color = e.target.value;
							onUpdate(component.id, (prev) => {
								if (!isTextSticker(prev)) return prev;
								return { ...prev, style: { ...(prev.style ?? {}), textColor: color } };
							});
						}}
					/>
				</div>

				<div>
					<div className="text-xs font-medium text-gray-600">폰트 크기(px)</div>
					<Input
						className="mt-2"
						type="number"
						min={8}
						max={96}
						step={1}
						value={component.style?.fontSize ?? 14}
						disabled={component.isLocked === true}
						onChange={(e) => {
							const size = Number(e.target.value || 0);
							onUpdate(component.id, (prev) => {
								if (!isTextSticker(prev)) return prev;
								const next: StickerBoardTextComponent = {
									...prev,
									style: {
										...(prev.style ?? {}),
										fontSize: Number.isFinite(size) ? size : 14,
									},
								};
								if (next.autoSize !== false) onRequestAutoSize(next);
								return next;
							});
						}}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<div className="text-xs font-medium text-gray-600">굵기</div>
					<div className="mt-2">
						<Select
							value={String(component.style?.fontWeight ?? 400)}
							onValueChange={(value) => {
								const weight = Number(value);
								onUpdate(component.id, (prev) => {
									if (!isTextSticker(prev)) return prev;
									const next: StickerBoardTextComponent = {
										...prev,
										style: { ...(prev.style ?? {}), fontWeight: weight },
									};
									if (next.autoSize !== false) onRequestAutoSize(next);
									return next;
								});
							}}
							disabled={component.isLocked === true}
						>
							<SelectTrigger>
								<SelectValue placeholder="굵기" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="100">Thin</SelectItem>
								<SelectItem value="200">Extra Light</SelectItem>
								<SelectItem value="300">Light</SelectItem>
								<SelectItem value="400">Regular</SelectItem>
								<SelectItem value="500">Medium</SelectItem>
								<SelectItem value="600">Semi Bold</SelectItem>
								<SelectItem value="700">Bold</SelectItem>
								<SelectItem value="800">Extra Bold</SelectItem>
								<SelectItem value="900">Black</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div>
					<div className="text-xs font-medium text-gray-600">정렬</div>
					<div className="mt-2">
						<Select
							value={component.style?.textAlign ?? "left"}
							onValueChange={(value) => {
								onUpdate(component.id, (prev) => {
									if (!isTextSticker(prev)) return prev;
									const next: StickerBoardTextComponent = {
										...prev,
										style: {
											...(prev.style ?? {}),
											textAlign: value as "left" | "center" | "right",
										},
									};
									if (next.autoSize !== false) onRequestAutoSize(next);
									return next;
								});
							}}
							disabled={component.isLocked === true}
						>
							<SelectTrigger>
								<SelectValue placeholder="정렬" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="left">왼쪽</SelectItem>
								<SelectItem value="center">가운데</SelectItem>
								<SelectItem value="right">오른쪽</SelectItem>
							</SelectContent>
						</Select>
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
