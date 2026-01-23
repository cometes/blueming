"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Moveable from "react-moveable";
import Selecto from "react-selecto";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { isPctSticker } from "@/lib/stickerboard-utils";
import { STICKER_ASSET_DND_MIME } from "@/types/stickerBoard";
import { StickerRenderer } from "@/components/stickerboard-editor/StickerRenderer";
import { StickerBoardAssetsPanel } from "@/components/stickerboard-editor/StickerBoardAssetsPanel";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { ImagePlus, Type } from "lucide-react";

const GRID_BASE = 12;

export function StickerBoardCanvas({
	ratio,
}: {
	ratio: { w: number; h: number } | null;
}) {
	const {
		state: {
			componentsDraft,
			selectedId,
			selectedIds,
			isTextInsertMode,
			isImageDialogOpen,
		},
		refs: {
			boundsRef,
			canvasRef,
			setCanvasRef,
			presentRef,
			interactionHistoryBaseRef,
			moveableInteractionRef,
		},
		actions: {
			setSelection,
			addImageStickerAt,
			cloneDraft,
			setComponentsDraft,
			clampStickerToEditorBounds,
			commitHistoryBase,
			setIsTextInsertMode,
			setIsImageDialogOpen,
			addTextStickerAt,
			updateComponent,
			requestAutoSize,
			setIsMoveableInteracting,
		},
		computed: { visibleDraft },
	} = useStickerBoardEditorContext();
	const moveableRef = useRef<Moveable>(null);
	const interactionStartRef = useRef(
		new Map<
			number,
			{
				xPct: number;
				yPct: number;
				widthPct: number;
				heightPct: number;
				rotation: number;
				isLocked: boolean;
				lockAspectRatio: boolean;
			}
		>(),
	);
	const resizePreviewRef = useRef(
		new Map<
			number,
			{ xPct: number; yPct: number; widthPct: number; heightPct: number }
		>(),
	);
	const dragPreviewRef = useRef(
		new Map<number, { xPct: number; yPct: number }>(),
	);
	const rotatePreviewRef = useRef(
		new Map<number, { xPct: number; yPct: number; rotation: number }>(),
	);
	const [moveableTargets, setMoveableTargets] = useState<HTMLElement[]>([]);
	const [textDraft, setTextDraft] = useState<{
		mode: "insert" | "edit";
		id?: number;
		text: string;
		xPct: number;
		yPct: number;
		widthPct?: number; // 편집 모드에서 사용
		heightPct?: number; // 편집 모드에서 사용
		widthPx: number; // 삽입 모드에서 사용
		fontSize: number;
		textColor: string;
		textAlign: "left" | "center" | "right";
		backgroundColor?: string;
	} | null>(null);
	const textDraftRef = useRef<HTMLDivElement | null>(null);

	const selectionIds = useMemo(() => {
		if (selectedIds.size > 0) return Array.from(selectedIds);
		return selectedId ? [selectedId] : [];
	}, [selectedId, selectedIds]);

	const selectedComponents = useMemo(
		() => componentsDraft.filter((c) => selectionIds.includes(c.id)),
		[componentsDraft, selectionIds],
	);

	const isSelectionLocked =
		selectedComponents.length > 0 &&
		selectedComponents.every((c) => c.isLocked === true);

	const keepRatio =
		selectedComponents.length === 1 &&
		selectedComponents[0].lockAspectRatio === true;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			setMoveableTargets([]);
			return;
		}
		const targets = selectionIds
			.map((id) =>
				canvas.querySelector<HTMLElement>(`[data-sticker-id="${id}"]`),
			)
			.filter((el): el is HTMLElement => Boolean(el))
			.filter((el) => el.getAttribute("data-sticker-locked") !== "true");
		setMoveableTargets(targets);
	}, [canvasRef, componentsDraft, selectionIds]);

	useEffect(() => {
		const moveable = moveableRef.current;
		if (!moveable) return;
		const raf = window.requestAnimationFrame(() => {
			moveable.updateRect();
		});
		return () => window.cancelAnimationFrame(raf);
	}, [componentsDraft, selectionIds]);

	useEffect(() => {
		if (!isTextInsertMode) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsTextInsertMode(false);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isTextInsertMode, setIsTextInsertMode]);

	useEffect(() => {
		const el = textDraftRef.current;
		if (!el) return;
		el.focus();
		// 커서를 텍스트 끝으로 이동
		const range = document.createRange();
		const selection = window.getSelection();
		if (el.childNodes.length > 0) {
			const lastNode = el.childNodes[el.childNodes.length - 1];
			range.setStartAfter(lastNode);
		} else {
			range.setStart(el, 0);
		}
		range.collapse(true);
		selection?.removeAllRanges();
		selection?.addRange(range);
	}, [textDraft]);

	const getCanvasRect = () => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const rect = canvas.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;
		return rect;
	};

	const startMoveableInteraction = (ids: number[]) => {
		if (!interactionHistoryBaseRef.current) {
			interactionHistoryBaseRef.current = cloneDraft(presentRef.current);
		}
		setIsMoveableInteracting(true);
		moveableInteractionRef.current = true;
		const startMap = new Map<
			number,
			{
				xPct: number;
				yPct: number;
				widthPct: number;
				heightPct: number;
				rotation: number;
				isLocked: boolean;
				lockAspectRatio: boolean;
			}
		>();
		ids.forEach((id) => {
			const item = presentRef.current.find((c) => c.id === id);
			if (!item || !isPctSticker(item)) return;
			startMap.set(id, {
				xPct: item.xPct,
				yPct: item.yPct,
				widthPct: item.widthPct,
				heightPct: item.heightPct,
				rotation: item.rotation ?? 0,
				isLocked: item.isLocked === true,
				lockAspectRatio: item.lockAspectRatio === true,
			});
		});
		interactionStartRef.current = startMap;
	};

	const endMoveableInteraction = () => {
		const base = interactionHistoryBaseRef.current;
		interactionHistoryBaseRef.current = null;
		moveableInteractionRef.current = false;
		setIsMoveableInteracting(false);
		interactionStartRef.current = new Map();
		dragPreviewRef.current = new Map();
		rotatePreviewRef.current = new Map();
		if (base && JSON.stringify(base) !== JSON.stringify(presentRef.current)) {
			commitHistoryBase(base);
		}
	};

	const previewDrag = (
		id: number,
		target: HTMLElement,
		delta: [number, number],
	) => {
		const rect = getCanvasRect();
		const start = interactionStartRef.current.get(id);
		if (!rect || !start || start.isLocked) return;
		const dxPct = (delta[0] / rect.width) * 100;
		const dyPct = (delta[1] / rect.height) * 100;
		const next = {
			xPct: start.xPct + dxPct,
			yPct: start.yPct + dyPct,
		};
		dragPreviewRef.current.set(id, next);
		target.style.left = `${next.xPct}%`;
		target.style.top = `${next.yPct}%`;
	};

	const commitDrag = (ids: number[]) => {
		if (ids.length === 0) return;
		const updates = new Map<number, { xPct: number; yPct: number }>();
		ids.forEach((id) => {
			const next = dragPreviewRef.current.get(id);
			if (next) updates.set(id, next);
		});
		if (updates.size === 0) return;
		setComponentsDraft((prev) =>
			prev.map((c) => {
				const next = updates.get(c.id);
				if (!next) return c;
				const clamped = clampStickerToEditorBounds({
					xPct: next.xPct,
					yPct: next.yPct,
					widthPct: c.widthPct,
					heightPct: c.heightPct,
				});
				return { ...c, ...clamped };
			}),
		);
		ids.forEach((id) => dragPreviewRef.current.delete(id));
	};

	const previewResize = (
		id: number,
		target: HTMLElement,
		sizePx: { width: number; height: number },
		delta: [number, number],
	) => {
		const rect = getCanvasRect();
		const start = interactionStartRef.current.get(id);
		if (!rect || !start || start.isLocked) return;
		const widthPct = (sizePx.width / rect.width) * 100;
		const heightPct = (sizePx.height / rect.height) * 100;
		const dxPct = (delta[0] / rect.width) * 100;
		const dyPct = (delta[1] / rect.height) * 100;
		const next = {
			xPct: start.xPct + dxPct,
			yPct: start.yPct + dyPct,
			widthPct,
			heightPct,
		};
		resizePreviewRef.current.set(id, next);
		target.style.left = `${next.xPct}%`;
		target.style.top = `${next.yPct}%`;
		target.style.width = `${next.widthPct}%`;
		target.style.height = `${next.heightPct}%`;
	};

	const commitResize = (ids: number[]) => {
		if (ids.length === 0) return;
		const updates = new Map<
			number,
			{ xPct: number; yPct: number; widthPct: number; heightPct: number }
		>();
		ids.forEach((id) => {
			const next = resizePreviewRef.current.get(id);
			if (next) updates.set(id, next);
		});
		if (updates.size === 0) return;
		setComponentsDraft((prev) =>
			prev.map((c) => {
				const next = updates.get(c.id);
				if (!next) return c;
				const clamped = clampStickerToEditorBounds(next);
				return { ...c, ...clamped };
			}),
		);
		ids.forEach((id) => resizePreviewRef.current.delete(id));
	};

	const applyRotate = (
		id: number,
		target: HTMLElement,
		deltaDeg: number,
		delta: [number, number],
	) => {
		const rect = getCanvasRect();
		const start = interactionStartRef.current.get(id);
		if (!rect || !start || start.isLocked) return;
		const dxPct = (delta[0] / rect.width) * 100;
		const dyPct = (delta[1] / rect.height) * 100;
		const nextRotation = start.rotation + deltaDeg;
		const next = { xPct: start.xPct + dxPct, yPct: start.yPct + dyPct };
		rotatePreviewRef.current.set(id, {
			xPct: next.xPct,
			yPct: next.yPct,
			rotation: nextRotation,
		});
		const flipX = target.getAttribute("data-sticker-flip-x") === "true";
		const flipY = target.getAttribute("data-sticker-flip-y") === "true";
		const scaleX = flipX ? -1 : 1;
		const scaleY = flipY ? -1 : 1;
		target.style.left = `${next.xPct}%`;
		target.style.top = `${next.yPct}%`;
		target.style.transform = `rotate(${nextRotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
	};

	const commitRotate = (ids: number[]) => {
		if (ids.length === 0) return;
		const updates = new Map<
			number,
			{ xPct: number; yPct: number; rotation: number }
		>();
		ids.forEach((id) => {
			const next = rotatePreviewRef.current.get(id);
			if (next) updates.set(id, next);
		});
		if (updates.size === 0) return;
		setComponentsDraft((prev) =>
			prev.map((c) => {
				const next = updates.get(c.id);
				if (!next) return c;
				const clamped = clampStickerToEditorBounds({
					xPct: next.xPct,
					yPct: next.yPct,
					widthPct: c.widthPct,
					heightPct: c.heightPct,
				});
				return { ...c, ...clamped, rotation: next.rotation };
			}),
		);
		ids.forEach((id) => rotatePreviewRef.current.delete(id));
	};

	const openTextDraftAt = (xPct: number, yPct: number, text = "") => {
		const rect = getCanvasRect();
		const widthPx = rect ? Math.min(240, rect.width * 0.5) : 240;
		const maxXPct =
			rect && rect.width > 0
				? Math.max(0, 100 - (widthPx / rect.width) * 100)
				: 100;
		const xClamped = Math.min(Math.max(0, xPct), maxXPct);
		setTextDraft({
			mode: "insert",
			text,
			xPct: xClamped,
			yPct: Math.max(0, Math.min(100, yPct)),
			widthPx,
			fontSize: 14,
			textColor: "#1f2937",
			textAlign: "left",
		});
	};

	const openTextDraftForEdit = (
		component: (typeof componentsDraft)[number],
	) => {
		if (component.type !== "text") return;
		const rect = getCanvasRect();
		const widthPx = rect ? (component.widthPct / 100) * rect.width : 240;
		setTextDraft({
			mode: "edit",
			id: component.id,
			text: component.text ?? "",
			xPct: component.xPct,
			yPct: component.yPct,
			widthPct: component.widthPct,
			heightPct: component.heightPct,
			widthPx,
			fontSize: component.style?.fontSize ?? 14,
			textColor: component.style?.textColor ?? "#1f2937",
			textAlign: component.style?.textAlign ?? "left",
			backgroundColor: component.style?.backgroundColor,
		});
	};

	const cancelTextDraft = () => {
		setTextDraft(null);
	};

	const commitTextDraft = () => {
		if (!textDraft) return;
		const text = textDraft.text.replace(/\s+$/u, "");
		if (!text.trim()) {
			cancelTextDraft();
			return;
		}
		if (textDraft.mode === "insert") {
			const base = cloneDraft(presentRef.current);
			addTextStickerAt({
				text,
				xPct: textDraft.xPct,
				yPct: textDraft.yPct,
				historyBase: base,
			});
		} else if (textDraft.mode === "edit" && textDraft.id) {
			updateComponent(textDraft.id, (prev) => {
				if (prev.type !== "text") return prev;
				const next = {
					...prev,
					text,
					style: {
						...(prev.style ?? {}),
						textAlign: textDraft.textAlign,
						textColor: textDraft.textColor,
						fontSize: textDraft.fontSize,
					},
				};
				if (next.autoSize !== false) requestAutoSize(next);
				return next;
			});
		}
		setIsTextInsertMode(false);
		cancelTextDraft();
	};

	return (
		<div className="rounded-card border-card bg-card blur-proxy p-4">
			<div className="flex items-center justify-between">
				<div>
					<div className="text-sm font-semibold text-main-text">캔버스</div>
					<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
						고정 폭 768px 캔버스 영역
					</p>
				</div>
				<ButtonGroup className="items-center rounded-md border border-stone-700 bg-stone-800 overflow-hidden divide-x divide-stone-700">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className={[
							"h-8 w-8 rounded-none hover:bg-stone-700",
							isImageDialogOpen ? "bg-stone-700 text-white" : "",
						].join(" ")}
						onClick={() => setIsImageDialogOpen((prev) => !prev)}
						aria-label="이미지 스티커 추가"
						title="이미지 스티커 추가"
					>
						<ImagePlus className="h-4 w-4" />
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className={[
							"h-8 w-8 rounded-none hover:bg-stone-700",
							isTextInsertMode ? "bg-stone-700 text-white" : "",
						].join(" ")}
						onClick={() => setIsTextInsertMode((prev) => !prev)}
						aria-label="텍스트 스티커 추가"
						title="텍스트 스티커 추가"
					>
						<Type className="h-4 w-4" />
					</Button>
					<StickerBoardAssetsPanel
						containerClassName=""
						compactTrigger
						triggerVariant="ghost"
						triggerClassName="h-8 w-8 rounded-none hover:bg-stone-700"
					/>
				</ButtonGroup>
			</div>
			<div
				ref={boundsRef}
				className="mt-4 w-full overflow-hidden rounded-card border border-card bg-card-bg p-2"
			>
				<div className="relative grid grid-cols-12 grid-rows-12 aspect-[5/4] w-full overflow-visible">
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							backgroundImage:
								"linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
							backgroundSize: "calc(100% / 12) calc(100% / 12)",
						}}
					/>

					{ratio ? (
						<div
							className="relative bg-widget-bg rounded-widget border-widget overflow-visible shadow-[0_10px_25px_rgba(0,0,0,0.08)] stickerboard-canvas"
							style={{
								gridColumn: (() => {
									const span = Math.max(1, Math.min(GRID_BASE, ratio.w || 1));
									const start = Math.floor((GRID_BASE - span) / 2) + 1;
									return `${start} / span ${span}`;
								})(),
								gridRow: (() => {
									const span = Math.max(1, Math.min(GRID_BASE, ratio.h || 1));
									const start = Math.floor((GRID_BASE - span) / 2) + 1;
									return `${start} / span ${span}`;
								})(),
							}}
							ref={setCanvasRef}
							onPointerDown={(e) => {
								if (!isTextInsertMode) return;
								if (
									(e.target as HTMLElement)?.closest?.(
										'[data-sticker-root="true"]',
									)
								) {
									return;
								}
								const rect = canvasRef.current?.getBoundingClientRect();
								if (!rect || rect.width <= 0 || rect.height <= 0) return;
								const xPct = ((e.clientX - rect.left) / rect.width) * 100;
								const yPct = ((e.clientY - rect.top) / rect.height) * 100;
								e.preventDefault();
								e.stopPropagation();
								setIsTextInsertMode(false);
								setSelection(new Set(), null);
								openTextDraftAt(xPct, yPct);
							}}
							onDragOver={(e) => {
								e.preventDefault();
								e.dataTransfer.dropEffect = "copy";
							}}
							onDrop={(e) => {
								e.preventDefault();
								e.stopPropagation();
								const raw = e.dataTransfer.getData(STICKER_ASSET_DND_MIME);
								if (!raw) return;
								let payload = null;
								try {
									payload = JSON.parse(raw);
								} catch {
									payload = null;
								}
								if (!payload?.url) return;

								const canvas = canvasRef.current;
								if (!canvas) return;
								const rect = canvas.getBoundingClientRect();
								const centerXPct = ((e.clientX - rect.left) / rect.width) * 100;
								const centerYPct = ((e.clientY - rect.top) / rect.height) * 100;
								const base = cloneDraft(presentRef.current);

								void addImageStickerAt({
									url: payload.url,
									centerXPct,
									centerYPct,
									assetId: payload.assetId,
									assetName: payload.name,
									assetWidth: payload.width,
									assetHeight: payload.height,
									historyBase: base,
								});
							}}
						>
							<Selecto
								dragContainer=".stickerboard-canvas"
								selectableTargets={[".sticker-item"]}
								selectByClick
								selectFromInside={false}
								toggleContinueSelect="shift"
								hitRate={0}
								onDragStart={(e) => {
									const moveable = moveableRef.current;
									const target = e.inputEvent.target as HTMLElement | null;
									if (!target) return;
									if (
										moveable?.isMoveableElement(target) ||
										target.closest(".moveable-control-box")
									) {
										e.stop();
									}
								}}
								onSelect={(e) => {
									const next = new Set<number>();
									e.selected.forEach((el) => {
										const id = Number(el.getAttribute("data-sticker-id"));
										if (Number.isNaN(id)) return;
										next.add(id);
									});
									const added = e.added[e.added.length - 1];
									const primaryId = added
										? Number(added.getAttribute("data-sticker-id"))
										: next.size
											? Array.from(next)[0]
											: null;
									setSelection(
										next,
										Number.isNaN(primaryId) ? null : primaryId,
									);
								}}
							/>
							<Moveable
								ref={moveableRef}
								target={
									moveableTargets.length === 1 ? moveableTargets[0] : null
								}
								targets={
									moveableTargets.length > 1 ? moveableTargets : undefined
								}
								origin={false}
								draggable={!isSelectionLocked && moveableTargets.length > 0}
								resizable={!isSelectionLocked && moveableTargets.length > 0}
								rotatable={!isSelectionLocked && moveableTargets.length > 0}
								keepRatio={keepRatio}
								throttleDrag={0}
								throttleResize={0}
								throttleRotate={0}
								onDragStart={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (Number.isNaN(id)) return;
									if (selectedIds.size !== 1 || !selectedIds.has(id)) {
										setSelection(new Set([id]), id);
									}
									startMoveableInteraction([id]);
								}}
								onDrag={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (Number.isNaN(id)) return;
									previewDrag(id, e.target as HTMLElement, e.beforeTranslate as [number, number]);
								}}
								onDragEnd={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (!Number.isNaN(id)) {
										commitDrag([id]);
									}
									endMoveableInteraction();
								}}
								onDragGroupStart={(e) => {
									const ids = e.targets
										.map((t) => Number(t.getAttribute("data-sticker-id")))
										.filter((id) => !Number.isNaN(id));
									if (ids.length === 0) return;
									startMoveableInteraction(ids);
								}}
								onDragGroup={(e) => {
									e.events.forEach((ev) => {
										const id = Number(
											(ev.target as HTMLElement).getAttribute(
												"data-sticker-id",
											),
										);
										if (Number.isNaN(id)) return;
										previewDrag(
											id,
											ev.target as HTMLElement,
											ev.beforeTranslate as [number, number],
										);
									});
								}}
								onDragGroupEnd={(e) => {
									const ids = e.targets
										.map((t) => Number(t.getAttribute("data-sticker-id")))
										.filter((id) => !Number.isNaN(id));
									commitDrag(ids);
									endMoveableInteraction();
								}}
								onResizeStart={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (Number.isNaN(id)) return;
									if (selectedIds.size !== 1 || !selectedIds.has(id)) {
										setSelection(new Set([id]), id);
									}
									startMoveableInteraction([id]);
								}}
								onResize={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (Number.isNaN(id)) return;
									previewResize(
										id,
										e.target as HTMLElement,
										{ width: e.width, height: e.height },
										e.drag.beforeTranslate as [number, number],
									);
								}}
								onResizeEnd={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (!Number.isNaN(id)) {
										commitResize([id]);
									}
									endMoveableInteraction();
								}}
								onResizeGroupStart={(e) => {
									const ids = e.targets
										.map((t) => Number(t.getAttribute("data-sticker-id")))
										.filter((id) => !Number.isNaN(id));
									if (ids.length === 0) return;
									startMoveableInteraction(ids);
								}}
								onResizeGroup={(e) => {
									e.events.forEach((ev) => {
										const id = Number(
											(ev.target as HTMLElement).getAttribute(
												"data-sticker-id",
											),
										);
										if (Number.isNaN(id)) return;
										previewResize(
											id,
											ev.target as HTMLElement,
											{ width: ev.width, height: ev.height },
											ev.drag.beforeTranslate as [number, number],
										);
									});
								}}
								onResizeGroupEnd={(e) => {
									const ids = e.targets
										.map((t) => Number(t.getAttribute("data-sticker-id")))
										.filter((id) => !Number.isNaN(id));
									commitResize(ids);
									endMoveableInteraction();
								}}
								onRotateStart={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (Number.isNaN(id)) return;
									if (selectedIds.size !== 1 || !selectedIds.has(id)) {
										setSelection(new Set([id]), id);
									}
									startMoveableInteraction([id]);
								}}
								onRotate={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (Number.isNaN(id)) return;
									const delta = e.beforeRotate;
									const dragDelta = (e.drag?.beforeTranslate ?? [0, 0]) as [number, number];
									applyRotate(id, e.target as HTMLElement, delta, dragDelta);
								}}
								onRotateEnd={(e) => {
									const id = Number(
										(e.target as HTMLElement).getAttribute("data-sticker-id"),
									);
									if (!Number.isNaN(id)) {
										commitRotate([id]);
									}
									endMoveableInteraction();
								}}
								onRotateGroupStart={(e) => {
									const ids = e.targets
										.map((t) => Number(t.getAttribute("data-sticker-id")))
										.filter((id) => !Number.isNaN(id));
									if (ids.length === 0) return;
									startMoveableInteraction(ids);
								}}
								onRotateGroup={(e) => {
									e.events.forEach((ev) => {
										const id = Number(
											(ev.target as HTMLElement).getAttribute(
												"data-sticker-id",
											),
										);
										if (Number.isNaN(id)) return;
										const delta = ev.beforeRotate;
										const dragDelta = (ev.drag?.beforeTranslate ?? [0, 0]) as [number, number];
										applyRotate(id, ev.target as HTMLElement, delta, dragDelta);
									});
								}}
								onRotateGroupEnd={(e) => {
									const ids = e.targets
										.map((t) => Number(t.getAttribute("data-sticker-id")))
										.filter((id) => !Number.isNaN(id));
									commitRotate(ids);
									endMoveableInteraction();
								}}
							/>
							{textDraft && (
								<div
									ref={textDraftRef}
									contentEditable
									suppressContentEditableWarning
									onInput={(e) => {
										const text = (e.target as HTMLDivElement).innerText;
										setTextDraft((prev) => (prev ? { ...prev, text } : prev));
									}}
									onKeyDown={(e) => {
										if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
											e.preventDefault();
											commitTextDraft();
										}
										if (e.key === "Escape") {
											e.preventDefault();
											cancelTextDraft();
										}
									}}
									onBlur={() => {
										commitTextDraft();
									}}
									className={[
										"absolute z-40 outline-none whitespace-pre-wrap break-words",
										textDraft.mode === "edit"
											? "ring-2 ring-blue-500 ring-offset-0 rounded-md"
											: "",
									].join(" ")}
									style={
										textDraft.mode === "edit" &&
											textDraft.widthPct !== undefined
											? {
												// 편집 모드: 기존 스티커 위치/크기에 맞춤
												left: `${textDraft.xPct}%`,
												top: `${textDraft.yPct}%`,
												width: `${textDraft.widthPct}%`,
												minHeight: textDraft.heightPct
													? `${textDraft.heightPct}%`
													: undefined,
												color: textDraft.textColor,
												fontSize: `${textDraft.fontSize}px`,
												textAlign: textDraft.textAlign,
												backgroundColor:
													textDraft.backgroundColor ?? "transparent",
												padding: "4px",
												caretColor: textDraft.textColor,
											}
											: {
												// 삽입 모드: 커서만 보이고 배경 없음
												left: `${textDraft.xPct}%`,
												top: `${textDraft.yPct}%`,
												minWidth: "2px",
												maxWidth: `${textDraft.widthPx}px`,
												color: textDraft.textColor,
												fontSize: `${textDraft.fontSize}px`,
												textAlign: textDraft.textAlign,
												backgroundColor: "transparent",
												caretColor: "#3b82f6",
											}
									}
								>
									{textDraft.mode === "edit" ? textDraft.text : ""}
								</div>
							)}
							{visibleDraft.length > 0 ? (
								visibleDraft.map((component) => (
									<StickerRenderer
										key={component.id}
										component={component}
										onDoubleClick={() => openTextDraftForEdit(component)}
										isEditing={
											textDraft?.mode === "edit" &&
											textDraft?.id === component.id
										}
									/>
								))
							) : (
								<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
									저장된 스티커가 없습니다.
								</div>
							)}
						</div>
					) : (
						<div className="absolute inset-0 flex items-center justify-center">
							<div className="text-center py-10">
								<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-theme-primary border-r-transparent" />
								<div className="mt-4 text-xs text-gray-500">
									캔버스를 불러오는 중...
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
