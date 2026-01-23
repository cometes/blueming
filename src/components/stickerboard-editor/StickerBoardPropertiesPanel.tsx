"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
		state: { canvasElement },
		computed: { selectedComponent, selectedImageComponent },
		refs: { canvasRef },
		actions: {
			updateComponent,
			requestAutoSize,
			alignSelectedSticker,
			clampStickerToEditorBounds,
		},
	} = useStickerBoardEditorContext();
	const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
	const [pxDraft, setPxDraft] = useState({
		id: null as number | null,
		x: "",
		y: "",
		width: "",
		height: "",
	});
	const editingFieldRef = useRef<null | "x" | "y" | "width" | "height">(null);

	useEffect(() => {
		const canvas = canvasElement;
		if (!canvas) return;
		const updateSize = () => {
			const rect = canvas.getBoundingClientRect();
			setCanvasSize({
				width: Math.max(0, rect.width),
				height: Math.max(0, rect.height),
			});
		};
		updateSize();
		const observer = new ResizeObserver(updateSize);
		observer.observe(canvas);
		return () => observer.disconnect();
	}, [canvasElement]);

	const toPx = useMemo(
		() => (pct: number, total: number) =>
			total > 0 ? Math.round((pct / 100) * total) : 0,
		[]
	);
	const toPct = useMemo(
		() => (px: number, total: number) => (total > 0 ? (px / total) * 100 : 0),
		[]
	);
	const syncPxDraft = useCallback(
		(component: typeof selectedComponent) => {
			if (!component) {
				setPxDraft({ id: null, x: "", y: "", width: "", height: "" });
				return;
			}
			setPxDraft({
				id: component.id,
				x: String(toPx(component.xPct, canvasSize.width)),
				y: String(toPx(component.yPct, canvasSize.height)),
				width: String(toPx(component.widthPct, canvasSize.width)),
				height: String(toPx(component.heightPct, canvasSize.height)),
			});
		},
		[canvasSize.height, canvasSize.width, toPx]
	);
	const getDraftValue = useCallback(
		(componentId: number | null, field: "x" | "y" | "width" | "height") => {
			if (componentId !== null && pxDraft.id === componentId) {
				return pxDraft[field];
			}
			return "";
		},
		[pxDraft]
	);

	useEffect(() => {
		if (editingFieldRef.current) return;
		syncPxDraft(selectedComponent);
	}, [selectedComponent, canvasSize, syncPxDraft]);

	const applyPxUpdate = useCallback(
		(
			componentId: number,
			field: "x" | "y" | "width" | "height",
			rawValue: string
		) => {
			const value = Number(rawValue);
			updateComponent(componentId, (prev) => {
				if (!Number.isFinite(value)) return prev;
				if (field === "x") {
					const xPct = toPct(value, canvasSize.width);
					return {
						...prev,
						...clampStickerToEditorBounds({
							xPct,
							yPct: prev.yPct,
							widthPct: prev.widthPct,
							heightPct: prev.heightPct,
						}),
					};
				}
				if (field === "y") {
					const yPct = toPct(value, canvasSize.height);
					return {
						...prev,
						...clampStickerToEditorBounds({
							xPct: prev.xPct,
							yPct,
							widthPct: prev.widthPct,
							heightPct: prev.heightPct,
						}),
					};
				}

				if (field === "width") {
					const MIN = 2;
					let widthPct = toPct(value, canvasSize.width);
					widthPct = Math.max(MIN, widthPct);
					let heightPct = prev.heightPct;
					if (prev.lockAspectRatio === true) {
						const aspect = prev.heightPct / Math.max(0.0001, prev.widthPct);
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
				}

				const MIN = 2;
				let heightPct = toPct(value, canvasSize.height);
				heightPct = Math.max(MIN, heightPct);
				let widthPct = prev.widthPct;
				if (prev.lockAspectRatio === true) {
					const aspect = prev.heightPct / Math.max(0.0001, prev.widthPct);
					widthPct = Math.max(MIN, heightPct / Math.max(0.0001, aspect));
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
		},
		[canvasSize, clampStickerToEditorBounds, toPct, updateComponent]
	);

	useEffect(() => {
		let rafId = 0;
		const tick = () => {
			const component = selectedComponent;
			if (!component || editingFieldRef.current) {
				rafId = requestAnimationFrame(tick);
				return;
			}
			const canvas = canvasRef.current;
			const target = canvas
				? (canvas.querySelector(
					`[data-sticker-id="${component.id}"]`,
				) as HTMLElement | null)
				: null;
			if (target) {
				const leftPct = parseFloat(target.style.left || "");
				const topPct = parseFloat(target.style.top || "");
				const widthPct = parseFloat(target.style.width || "");
				const heightPct = parseFloat(target.style.height || "");
				const next = {
					x: String(
						toPx(
							Number.isFinite(leftPct) ? leftPct : component.xPct,
							canvasSize.width,
						),
					),
					y: String(
						toPx(
							Number.isFinite(topPct) ? topPct : component.yPct,
							canvasSize.height,
						),
					),
					width: String(
						toPx(
							Number.isFinite(widthPct) ? widthPct : component.widthPct,
							canvasSize.width,
						),
					),
					height: String(
						toPx(
							Number.isFinite(heightPct) ? heightPct : component.heightPct,
							canvasSize.height,
						),
					),
				};
				setPxDraft((prev) => {
					if (
						prev.id === component.id &&
						prev.x === next.x &&
						prev.y === next.y &&
						prev.width === next.width &&
						prev.height === next.height
					) {
						return prev;
					}
					return {
						id: component.id,
						x: next.x,
						y: next.y,
						width: next.width,
						height: next.height,
					};
				});
			}
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	}, [canvasRef, canvasSize, selectedComponent, toPx]);

	return (
		<>
			{selectedComponent && (
				<div className="mt-4 space-y-2">
					<div className="text-xs font-medium text-gray-600">효과</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600">
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
							<div className="text-xs font-medium text-gray-600">블렌드</div>
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

					<div className="text-xs font-medium text-gray-600">스티커 정렬</div>
					<ButtonGroup className="flex w-full items-center justify-between gap-2">
						<ButtonGroup className="flex-1 justify-center rounded-md border border-stone-700 bg-stone-800 overflow-hidden divide-x divide-stone-700">
							<Button
								type="button"
								variant="ghost"
								className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
								disabled={selectedComponent.isLocked === true}
								onClick={() => alignSelectedSticker("left")}
								title="왼쪽 정렬"
							>
								<AlignStartVertical className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
								disabled={selectedComponent.isLocked === true}
								onClick={() => alignSelectedSticker("hcenter")}
								title="가로 가운데 정렬"
							>
								<AlignCenterVertical className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700 focus:z-10"
								disabled={selectedComponent.isLocked === true}
								onClick={() => alignSelectedSticker("right")}
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
								onClick={() => alignSelectedSticker("top")}
								title="위 정렬"
							>
								<AlignStartHorizontal className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
								disabled={selectedComponent.isLocked === true}
								onClick={() => alignSelectedSticker("vcenter")}
								title="세로 가운데 정렬"
							>
								<AlignCenterHorizontal className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
								disabled={selectedComponent.isLocked === true}
								onClick={() => alignSelectedSticker("bottom")}
								title="아래 정렬"
							>
								<AlignEndHorizontal className="h-4 w-4" />
							</Button>
						</ButtonGroup>
					</ButtonGroup>
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
							<div className="text-xs font-medium text-gray-600">
								최대 폭(px)
							</div>
							<Input
								className="mt-2"
								type="number"
								min={80}
								max={800}
								step={10}
								value={
									selectedComponent.maxWidthPx ?? DEFAULT_TEXT_MAX_WIDTH_PX
								}
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
						<div className="text-xs font-medium text-gray-700">비율 고정</div>
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
							<div className="text-xs font-medium text-gray-600">글자색</div>
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
							<div className="text-xs font-medium text-gray-600">
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
							<div className="text-xs font-medium text-gray-600">굵기</div>
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
							<div className="text-xs font-medium text-gray-600">정렬</div>
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
							<div className="text-xs font-medium text-gray-600">회전(°)</div>
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
							<div className="text-xs font-medium text-gray-600">투명도(%)</div>
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
							<div className="text-xs font-medium text-gray-600">X(px)</div>
							<Input
								className="mt-2"
								type="number"
								step={1}
								value={
									getDraftValue(selectedComponent.id, "x") ||
									String(toPx(selectedComponent.xPct, canvasSize.width))
								}
								disabled={selectedComponent.isLocked === true}
								onFocus={() => {
									editingFieldRef.current = "x";
								}}
								onChange={(e) => {
									const value = e.target.value;
									setPxDraft((prev) => ({
										...prev,
										id: selectedComponent.id,
										x: value,
									}));
								}}
								onBlur={() => {
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedComponent.id,
										"x",
										getDraftValue(selectedComponent.id, "x")
									);
								}}
								onKeyDown={(e) => {
									if (e.key !== "Enter") return;
									e.preventDefault();
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedComponent.id,
										"x",
										getDraftValue(selectedComponent.id, "x")
									);
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600">Y(px)</div>
							<Input
								className="mt-2"
								type="number"
								step={1}
								value={
									getDraftValue(selectedComponent.id, "y") ||
									String(toPx(selectedComponent.yPct, canvasSize.height))
								}
								disabled={selectedComponent.isLocked === true}
								onFocus={() => {
									editingFieldRef.current = "y";
								}}
								onChange={(e) => {
									const value = e.target.value;
									setPxDraft((prev) => ({
										...prev,
										id: selectedComponent.id,
										y: value,
									}));
								}}
								onBlur={() => {
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedComponent.id,
										"y",
										getDraftValue(selectedComponent.id, "y")
									);
								}}
								onKeyDown={(e) => {
									if (e.key !== "Enter") return;
									e.preventDefault();
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedComponent.id,
										"y",
										getDraftValue(selectedComponent.id, "y")
									);
								}}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600">가로(px)</div>
							<Input
								className="mt-2"
								type="number"
								min={2}
								max={Math.max(0, Math.round(canvasSize.width))}
								step={1}
								value={
									getDraftValue(selectedComponent.id, "width") ||
									String(toPx(selectedComponent.widthPct, canvasSize.width))
								}
								disabled={selectedComponent.isLocked === true}
								onFocus={() => {
									editingFieldRef.current = "width";
								}}
								onChange={(e) => {
									const value = e.target.value;
									setPxDraft((prev) => ({
										...prev,
										id: selectedComponent.id,
										width: value,
									}));
								}}
								onBlur={() => {
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedComponent.id,
										"width",
										getDraftValue(selectedComponent.id, "width")
									);
								}}
								onKeyDown={(e) => {
									if (e.key !== "Enter") return;
									e.preventDefault();
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedComponent.id,
										"width",
										getDraftValue(selectedComponent.id, "width")
									);
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600">세로(px)</div>
							<Input
								className="mt-2"
								type="number"
								min={2}
								max={Math.max(0, Math.round(canvasSize.height))}
								step={1}
								value={
									getDraftValue(selectedComponent.id, "height") ||
									String(toPx(selectedComponent.heightPct, canvasSize.height))
								}
								disabled={selectedComponent.isLocked === true}
								onFocus={() => {
									editingFieldRef.current = "height";
								}}
								onChange={(e) => {
									const value = e.target.value;
									setPxDraft((prev) => ({
										...prev,
										id: selectedComponent.id,
										height: value,
									}));
								}}
								onBlur={() => {
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedComponent.id,
										"height",
										getDraftValue(selectedComponent.id, "height")
									);
								}}
								onKeyDown={(e) => {
									if (e.key !== "Enter") return;
									e.preventDefault();
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedComponent.id,
										"height",
										getDraftValue(selectedComponent.id, "height")
									);
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{selectedImageComponent && (
				<div className="mt-4 space-y-4">
					<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
						<div className="text-xs font-medium text-gray-700">비율 고정</div>
						<Checkbox
							checked={selectedImageComponent.lockAspectRatio === true}
							disabled={selectedImageComponent.isLocked === true}
							onCheckedChange={(checked) => {
								const next = checked === true;
								updateComponent(selectedImageComponent.id, (prev) => ({
									...prev,
									lockAspectRatio: next,
								}));
							}}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600">맞춤</div>
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
							<div className="text-xs font-medium text-gray-600">뒤집기</div>
							<div className="mt-2">
								<ButtonGroup className="flex-1 justify-center rounded-md border border-stone-700 bg-stone-800 overflow-hidden divide-x divide-stone-700">
									<Button
										type="button"
										variant="ghost"
										className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700"
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
										variant="ghost"
										className="h-8 flex-1 min-w-0 rounded-none hover:bg-stone-700 focus:z-10"
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
								</ButtonGroup>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600">X(px)</div>
							<Input
								className="mt-2"
								type="number"
								step={1}
								value={
									getDraftValue(selectedImageComponent.id, "x") ||
									String(toPx(selectedImageComponent.xPct, canvasSize.width))
								}
								disabled={selectedImageComponent.isLocked === true}
								onFocus={() => {
									editingFieldRef.current = "x";
								}}
								onChange={(e) => {
									const value = e.target.value;
									setPxDraft((prev) => ({
										...prev,
										id: selectedImageComponent.id,
										x: value,
									}));
								}}
								onBlur={() => {
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedImageComponent.id,
										"x",
										getDraftValue(selectedImageComponent.id, "x")
									);
								}}
								onKeyDown={(e) => {
									if (e.key !== "Enter") return;
									e.preventDefault();
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedImageComponent.id,
										"x",
										getDraftValue(selectedImageComponent.id, "x")
									);
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600">Y(px)</div>
							<Input
								className="mt-2"
								type="number"
								step={1}
								value={
									getDraftValue(selectedImageComponent.id, "y") ||
									String(toPx(selectedImageComponent.yPct, canvasSize.height))
								}
								disabled={selectedImageComponent.isLocked === true}
								onFocus={() => {
									editingFieldRef.current = "y";
								}}
								onChange={(e) => {
									const value = e.target.value;
									setPxDraft((prev) => ({
										...prev,
										id: selectedImageComponent.id,
										y: value,
									}));
								}}
								onBlur={() => {
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedImageComponent.id,
										"y",
										getDraftValue(selectedImageComponent.id, "y")
									);
								}}
								onKeyDown={(e) => {
									if (e.key !== "Enter") return;
									e.preventDefault();
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedImageComponent.id,
										"y",
										getDraftValue(selectedImageComponent.id, "y")
									);
								}}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<div className="text-xs font-medium text-gray-600">가로(px)</div>
							<Input
								className="mt-2"
								type="number"
								min={2}
								max={Math.max(0, Math.round(canvasSize.width))}
								step={1}
								value={
									getDraftValue(selectedImageComponent.id, "width") ||
									String(toPx(selectedImageComponent.widthPct, canvasSize.width))
								}
								disabled={selectedImageComponent.isLocked === true}
								onFocus={() => {
									editingFieldRef.current = "width";
								}}
								onChange={(e) => {
									const value = e.target.value;
									setPxDraft((prev) => ({
										...prev,
										id: selectedImageComponent.id,
										width: value,
									}));
								}}
								onBlur={() => {
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedImageComponent.id,
										"width",
										getDraftValue(selectedImageComponent.id, "width")
									);
								}}
								onKeyDown={(e) => {
									if (e.key !== "Enter") return;
									e.preventDefault();
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedImageComponent.id,
										"width",
										getDraftValue(selectedImageComponent.id, "width")
									);
								}}
							/>
						</div>
						<div>
							<div className="text-xs font-medium text-gray-600">세로(px)</div>
							<Input
								className="mt-2"
								type="number"
								min={2}
								max={Math.max(0, Math.round(canvasSize.height))}
								step={1}
								value={
									getDraftValue(selectedImageComponent.id, "height") ||
									String(
										toPx(selectedImageComponent.heightPct, canvasSize.height),
									)
								}
								disabled={selectedImageComponent.isLocked === true}
								onFocus={() => {
									editingFieldRef.current = "height";
								}}
								onChange={(e) => {
									const value = e.target.value;
									setPxDraft((prev) => ({
										...prev,
										id: selectedImageComponent.id,
										height: value,
									}));
								}}
								onBlur={() => {
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedImageComponent.id,
										"height",
										getDraftValue(selectedImageComponent.id, "height")
									);
								}}
								onKeyDown={(e) => {
									if (e.key !== "Enter") return;
									e.preventDefault();
									editingFieldRef.current = null;
									applyPxUpdate(
										selectedImageComponent.id,
										"height",
										getDraftValue(selectedImageComponent.id, "height")
									);
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
