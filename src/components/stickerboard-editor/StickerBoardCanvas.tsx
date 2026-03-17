"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Moveable from "react-moveable";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { isPctSticker } from "@/lib/stickerboard-utils";
import { StickerBoardCanvasToolbar } from "@/components/stickerboard-editor/StickerBoardCanvasToolbar";
import { StickerBoardCanvasStage } from "@/components/stickerboard-editor/StickerBoardCanvasStage";

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
			<StickerBoardCanvasToolbar
				isImageDialogOpen={isImageDialogOpen}
				isTextInsertMode={isTextInsertMode}
				onToggleImageDialog={() => setIsImageDialogOpen((prev) => !prev)}
				onToggleTextInsertMode={() => setIsTextInsertMode((prev) => !prev)}
			/>
			<StickerBoardCanvasStage
				ratio={ratio}
				boundsRef={boundsRef}
				setCanvasRef={setCanvasRef}
				visibleDraft={visibleDraft}
				textDraft={textDraft}
				textDraftRef={textDraftRef}
				moveableRef={moveableRef}
				moveableTargets={moveableTargets}
				isSelectionLocked={isSelectionLocked}
				keepRatio={keepRatio}
				selectedIds={selectedIds}
				setSelection={setSelection}
				startMoveableInteraction={startMoveableInteraction}
				endMoveableInteraction={endMoveableInteraction}
				previewDrag={previewDrag}
				commitDrag={commitDrag}
				previewResize={previewResize}
				commitResize={commitResize}
				applyRotate={applyRotate}
				commitRotate={commitRotate}
				onPointerInsertText={(e) => {
					if (!isTextInsertMode) return;
					if ((e.target as HTMLElement)?.closest?.('[data-sticker-root="true"]')) {
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
				onDropAsset={(e) => {
					e.preventDefault();
					e.stopPropagation();
					const raw = e.dataTransfer.getData("application/x-sticker-asset");
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
				onChangeTextDraft={(text) =>
					setTextDraft((prev) => (prev ? { ...prev, text } : prev))
				}
				onCommitTextDraft={commitTextDraft}
				onCancelTextDraft={cancelTextDraft}
				onDoubleClickComponent={openTextDraftForEdit}
				isEditingComponent={(componentId) =>
					textDraft?.mode === "edit" && textDraft?.id === componentId
				}
			/>
		</div>
	);
}
