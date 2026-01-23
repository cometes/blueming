"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import {
	DEFAULT_TEXT_MAX_WIDTH_PX,
	DEFAULT_TEXT_PADDING,
	isImageSticker,
	isTextSticker,
} from "@/lib/stickerboard-utils";
import type { StickerBoardTextComponent } from "@/types/stickerBoard";
import {
	AlignCenterHorizontal,
	AlignCenterVertical,
	AlignEndHorizontal,
	AlignEndVertical,
	AlignStartHorizontal,
	AlignStartVertical,
	FlipHorizontal2,
	FlipVertical2,
} from "lucide-react";

export function StickerBoardPropertiesPanel() {
	const {
		computed: { selectedComponent, selectedImageComponent },
		actions: {
			updateComponent,
			requestAutoSize,
			alignSelectedSticker,
			clampStickerToEditorBounds,
		},
	} = useStickerBoardEditorContext();

	return (
		<>
			{selectedComponent && (
				<div className="mt-4 space-y-2">
					<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
						효과
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								불투명도(%)
							</div>
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
									updateComponent(selectedComponent.id, (prev) => ({
										...prev,
										opacity: Number.isFinite(opacity)
											? Math.max(0, Math.min(100, opacity))
											: 100,
									}));
								}}
							/>
						</div>

						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								블렌드
							</div>
							<div className="mt-2">
								<Select
									value={selectedComponent.blendMode ?? "normal"}
									onValueChange={(value) => {
										updateComponent(selectedComponent.id, (prev) => ({
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

					<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
						스티커 정렬
					</div>
					<div className="grid grid-cols-3 gap-2">
						<Button
							type="button"
							variant="outline"
							className="h-9 px-0"
							disabled={selectedComponent.isLocked === true}
							onClick={() => alignSelectedSticker("left")}
							title="왼쪽 정렬"
						>
							<AlignStartVertical className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							className="h-9 px-0"
							disabled={selectedComponent.isLocked === true}
							onClick={() => alignSelectedSticker("hcenter")}
							title="가로 가운데 정렬"
						>
							<AlignCenterVertical className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							className="h-9 px-0"
							disabled={selectedComponent.isLocked === true}
							onClick={() => alignSelectedSticker("right")}
							title="오른쪽 정렬"
						>
							<AlignEndVertical className="h-4 w-4" />
						</Button>
					</div>
					<div className="grid grid-cols-3 gap-2">
						<Button
							type="button"
							variant="outline"
							className="h-9 px-0"
							disabled={selectedComponent.isLocked === true}
							onClick={() => alignSelectedSticker("top")}
							title="위 정렬"
						>
							<AlignStartHorizontal className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							className="h-9 px-0"
							disabled={selectedComponent.isLocked === true}
							onClick={() => alignSelectedSticker("vcenter")}
							title="세로 가운데 정렬"
						>
							<AlignCenterHorizontal className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							className="h-9 px-0"
							disabled={selectedComponent.isLocked === true}
							onClick={() => alignSelectedSticker("bottom")}
							title="아래 정렬"
						>
							<AlignEndHorizontal className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{selectedComponent && isTextSticker(selectedComponent) && (
				<div className="mt-4 space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
							<div className="text-xs font-medium text-gray-700 dark:text-gray-200">
								자동 크기
							</div>
							<input
								type="checkbox"
								checked={selectedComponent.autoSize !== false}
								disabled={selectedComponent.isLocked === true}
								onChange={(e) => {
									const next = e.target.checked;
									updateComponent(selectedComponent.id, (prev) => {
										if (!isTextSticker(prev)) return prev;
										const nextComp: StickerBoardTextComponent = {
											...prev,
											autoSize: next,
											maxWidthPx: prev.maxWidthPx ?? DEFAULT_TEXT_MAX_WIDTH_PX,
											paddingPx: prev.paddingPx ?? DEFAULT_TEXT_PADDING,
										};
										if (nextComp.autoSize !== false) requestAutoSize(nextComp);
										return nextComp;
									});
								}}
							/>
						</div>

						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								최대 폭(px)
							</div>
							<Input
								className="mt-2"
								type="number"
								min={80}
								max={800}
								step={10}
								value={selectedComponent.maxWidthPx ?? DEFAULT_TEXT_MAX_WIDTH_PX}
								disabled={
									selectedComponent.isLocked === true ||
									selectedComponent.autoSize === false
								}
								onChange={(e) => {
									const raw = Number(e.target.value || 0);
									updateComponent(selectedComponent.id, (prev) => {
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
										if (nextComp.autoSize !== false) requestAutoSize(nextComp);
										return nextComp;
									});
								}}
							/>
						</div>
					</div>

					<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
						<div className="text-xs font-medium text-gray-700 dark:text-gray-200">
							비율 고정
						</div>
						<input
							type="checkbox"
							checked={selectedComponent.lockAspectRatio === true}
							disabled={selectedComponent.isLocked === true}
							onChange={(e) => {
								const next = e.target.checked;
								updateComponent(selectedComponent.id, (prev) => ({
									...prev,
									lockAspectRatio: next,
								}));
							}}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								글자색
							</div>
							<Input
								className="mt-2"
								type="color"
								value={selectedComponent.style?.textColor ?? "#1f2937"}
								disabled={selectedComponent.isLocked === true}
								onChange={(e) => {
									const color = e.target.value;
									updateComponent(selectedComponent.id, (prev) => {
										if (!isTextSticker(prev)) return prev;
										return {
											...prev,
											style: { ...(prev.style ?? {}), textColor: color },
										};
									});
								}}
							/>
						</div>

						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								폰트 크기(px)
							</div>
							<Input
								className="mt-2"
								type="number"
								min={8}
								max={96}
								step={1}
								value={selectedComponent.style?.fontSize ?? 14}
								disabled={selectedComponent.isLocked === true}
								onChange={(e) => {
									const size = Number(e.target.value || 0);
									updateComponent(selectedComponent.id, (prev) => {
										if (!isTextSticker(prev)) return prev;
										const next: StickerBoardTextComponent = {
											...prev,
											style: {
												...(prev.style ?? {}),
												fontSize: Number.isFinite(size) ? size : 14,
											},
										};
										if (next.autoSize !== false) requestAutoSize(next);
										return next;
									});
								}}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								굵기
							</div>
							<div className="mt-2">
								<Select
									value={String(selectedComponent.style?.fontWeight ?? 400)}
									onValueChange={(value) => {
										const weight = Number(value);
										updateComponent(selectedComponent.id, (prev) => {
											if (!isTextSticker(prev)) return prev;
											const next: StickerBoardTextComponent = {
												...prev,
												style: {
													...(prev.style ?? {}),
													fontWeight: weight,
												},
											};
											if (next.autoSize !== false) requestAutoSize(next);
											return next;
										});
									}}
									disabled={selectedComponent.isLocked === true}
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
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								정렬
							</div>
							<div className="mt-2">
								<Select
									value={selectedComponent.style?.textAlign ?? "left"}
									onValueChange={(value) => {
										updateComponent(selectedComponent.id, (prev) => {
											if (!isTextSticker(prev)) return prev;
											const next: StickerBoardTextComponent = {
												...prev,
												style: {
													...(prev.style ?? {}),
													textAlign: value as typeof prev.style.textAlign,
												},
											};
											if (next.autoSize !== false) requestAutoSize(next);
											return next;
										});
									}}
									disabled={selectedComponent.isLocked === true}
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
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								회전(°)
							</div>
							<Input
								className="mt-2"
								type="number"
								step={1}
								value={selectedComponent.rotation ?? 0}
								disabled={selectedComponent.isLocked === true}
								onChange={(e) => {
									const rotation = Number(e.target.value || 0);
									updateComponent(selectedComponent.id, (prev) => ({
										...prev,
										rotation: Number.isFinite(rotation) ? rotation : 0,
									}));
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								투명도(%)
							</div>
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
									updateComponent(selectedComponent.id, (prev) => ({
										...prev,
										opacity: Number.isFinite(opacity)
											? Math.max(0, Math.min(100, opacity))
											: 100,
									}));
								}}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								X(%)
							</div>
							<Input
								className="mt-2"
								type="number"
								step={0.5}
								value={selectedComponent.xPct}
								disabled={selectedComponent.isLocked === true}
								onChange={(e) => {
									const xPct = Number(e.target.value || 0);
									updateComponent(selectedComponent.id, (prev) => {
										const next = clampStickerToEditorBounds({
											xPct: Number.isFinite(xPct) ? xPct : prev.xPct,
											yPct: prev.yPct,
											widthPct: prev.widthPct,
											heightPct: prev.heightPct,
										});
										return { ...prev, ...next };
									});
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								Y(%)
							</div>
							<Input
								className="mt-2"
								type="number"
								step={0.5}
								value={selectedComponent.yPct}
								disabled={selectedComponent.isLocked === true}
								onChange={(e) => {
									const yPct = Number(e.target.value || 0);
									updateComponent(selectedComponent.id, (prev) => {
										const next = clampStickerToEditorBounds({
											xPct: prev.xPct,
											yPct: Number.isFinite(yPct) ? yPct : prev.yPct,
											widthPct: prev.widthPct,
											heightPct: prev.heightPct,
										});
										return { ...prev, ...next };
									});
								}}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								가로(%)
							</div>
							<Input
								className="mt-2"
								type="number"
								min={2}
								max={100}
								step={0.5}
								value={selectedComponent.widthPct}
								disabled={selectedComponent.isLocked === true}
								onChange={(e) => {
									const widthPctRaw = Number(e.target.value || 0);
									updateComponent(selectedComponent.id, (prev) => {
										const MIN = 2;
										let widthPct = Number.isFinite(widthPctRaw)
											? widthPctRaw
											: prev.widthPct;
										widthPct = Math.max(MIN, widthPct);
										let heightPct = prev.heightPct;
										if (prev.lockAspectRatio === true) {
											const aspect =
												prev.heightPct / Math.max(0.0001, prev.widthPct);
											heightPct = Math.max(MIN, widthPct * aspect);
										}
										return {
											...prev,
											...clampStickerToEditorBounds({
												xPct: prev.xPct,
												yPct: prev.yPct,
												widthPct,
												heightPct,
											}),
										};
									});
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								세로(%)
							</div>
							<Input
								className="mt-2"
								type="number"
								min={2}
								max={100}
								step={0.5}
								value={selectedComponent.heightPct}
								disabled={selectedComponent.isLocked === true}
								onChange={(e) => {
									const heightPctRaw = Number(e.target.value || 0);
									updateComponent(selectedComponent.id, (prev) => {
										const MIN = 2;
										let heightPct = Number.isFinite(heightPctRaw)
											? heightPctRaw
											: prev.heightPct;
										heightPct = Math.max(MIN, heightPct);
										let widthPct = prev.widthPct;
										if (prev.lockAspectRatio === true) {
											const aspect =
												prev.heightPct / Math.max(0.0001, prev.widthPct);
											widthPct = Math.max(
												MIN,
												heightPct / Math.max(0.0001, aspect)
											);
										}
										return {
											...prev,
											...clampStickerToEditorBounds({
												xPct: prev.xPct,
												yPct: prev.yPct,
												widthPct,
												heightPct,
											}),
										};
									});
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{selectedImageComponent && (
				<div className="mt-4 space-y-4">
					<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
						<div className="text-xs font-medium text-gray-700 dark:text-gray-200">
							비율 고정
						</div>
						<input
							type="checkbox"
							checked={selectedImageComponent.lockAspectRatio === true}
							disabled={selectedImageComponent.isLocked === true}
							onChange={(e) => {
								const next = e.target.checked;
								updateComponent(selectedImageComponent.id, (prev) => ({
									...prev,
									lockAspectRatio: next,
								}));
							}}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								맞춤
							</div>
							<div className="mt-2">
								<Select
									value={selectedImageComponent.imageFit ?? "contain"}
									onValueChange={(value) => {
										updateComponent(selectedImageComponent.id, (prev) => {
											if (!isImageSticker(prev)) return prev;
											return {
												...prev,
												imageFit: value as "contain" | "cover",
											};
										});
									}}
									disabled={selectedImageComponent.isLocked === true}
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
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								뒤집기
							</div>
							<div className="mt-2 flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="flex-1"
									disabled={selectedImageComponent.isLocked === true}
									onClick={() => {
										updateComponent(selectedImageComponent.id, (prev) => ({
											...prev,
											flipX: !(prev.flipX === true),
										}));
								}}
								>
									<FlipHorizontal2 className="h-4 w-4" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon"
									className="flex-1"
									disabled={selectedImageComponent.isLocked === true}
									onClick={() => {
										updateComponent(selectedImageComponent.id, (prev) => ({
											...prev,
											flipY: !(prev.flipY === true),
										}));
								}}
								>
									<FlipVertical2 className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								X(%)
							</div>
							<Input
								className="mt-2"
								type="number"
								step={0.5}
								value={selectedImageComponent.xPct}
								disabled={selectedImageComponent.isLocked === true}
								onChange={(e) => {
									const xPct = Number(e.target.value || 0);
									updateComponent(selectedImageComponent.id, (prev) => {
										const next = clampStickerToEditorBounds({
											xPct: Number.isFinite(xPct) ? xPct : prev.xPct,
											yPct: prev.yPct,
											widthPct: prev.widthPct,
											heightPct: prev.heightPct,
										});
										return { ...prev, ...next };
									});
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								Y(%)
							</div>
							<Input
								className="mt-2"
								type="number"
								step={0.5}
								value={selectedImageComponent.yPct}
								disabled={selectedImageComponent.isLocked === true}
								onChange={(e) => {
									const yPct = Number(e.target.value || 0);
									updateComponent(selectedImageComponent.id, (prev) => {
										const next = clampStickerToEditorBounds({
											xPct: prev.xPct,
											yPct: Number.isFinite(yPct) ? yPct : prev.yPct,
											widthPct: prev.widthPct,
											heightPct: prev.heightPct,
										});
										return { ...prev, ...next };
									});
								}}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								가로(%)
							</div>
							<Input
								className="mt-2"
								type="number"
								min={2}
								max={100}
								step={0.5}
								value={selectedImageComponent.widthPct}
								disabled={selectedImageComponent.isLocked === true}
								onChange={(e) => {
									const widthPctRaw = Number(e.target.value || 0);
									updateComponent(selectedImageComponent.id, (prev) => {
										const MIN = 2;
										let widthPct = Number.isFinite(widthPctRaw)
											? widthPctRaw
											: prev.widthPct;
										widthPct = Math.max(MIN, widthPct);
										let heightPct = prev.heightPct;
										if (prev.lockAspectRatio === true) {
											const aspect =
												prev.heightPct / Math.max(0.0001, prev.widthPct);
											heightPct = Math.max(MIN, widthPct * aspect);
										}
										return {
											...prev,
											...clampStickerToEditorBounds({
												xPct: prev.xPct,
												yPct: prev.yPct,
												widthPct,
												heightPct,
											}),
										};
									});
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
								세로(%)
							</div>
							<Input
								className="mt-2"
								type="number"
								min={2}
								max={100}
								step={0.5}
								value={selectedImageComponent.heightPct}
								disabled={selectedImageComponent.isLocked === true}
								onChange={(e) => {
									const heightPctRaw = Number(e.target.value || 0);
									updateComponent(selectedImageComponent.id, (prev) => {
										const MIN = 2;
										let heightPct = Number.isFinite(heightPctRaw)
											? heightPctRaw
											: prev.heightPct;
										heightPct = Math.max(MIN, heightPct);
										let widthPct = prev.widthPct;
										if (prev.lockAspectRatio === true) {
											const aspect =
												prev.heightPct / Math.max(0.0001, prev.widthPct);
											widthPct = Math.max(
												MIN,
												heightPct / Math.max(0.0001, aspect)
											);
										}
										return {
											...prev,
											...clampStickerToEditorBounds({
												xPct: prev.xPct,
												yPct: prev.yPct,
												widthPct,
												heightPct,
											}),
										};
									});
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
