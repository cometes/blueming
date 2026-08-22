"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type Moveable from "react-moveable";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { isPctSticker } from "@/features/stickerboard-editor/lib/stickerboard-utils";

interface InteractionStart {
	xPct: number;
	yPct: number;
	widthPct: number;
	heightPct: number;
	rotation: number;
	isLocked: boolean;
	lockAspectRatio: boolean;
}

/**
 * 캔버스 위 Moveable(드래그/리사이즈/회전) 인터랙션의 프리뷰·커밋 로직.
 * 인터랙션 중에는 DOM 스타일로만 프리뷰하고, 종료 시 % 좌표로 커밋한다.
 */
export function useStickerMoveableInteractions() {
	const {
		state: { componentsDraft, selectedId, selectedIds },
		refs: {
			canvasRef,
			presentRef,
			interactionHistoryBaseRef,
			moveableInteractionRef,
		},
		actions: {
			cloneDraft,
			setComponentsDraft,
			clampStickerToEditorBounds,
			commitHistoryBase,
			setIsMoveableInteracting,
		},
	} = useStickerBoardEditorContext();

	const moveableRef = useRef<Moveable>(null);
	const interactionStartRef = useRef(new Map<number, InteractionStart>());
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

	// 캔버스가 리사이즈되면(창 크기 변경 등) Moveable의 px 기반 선택 프레임을
	// 다시 계산해 %기반 스티커 위치와 어긋나지 않게 한다.
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const observer = new ResizeObserver(() => {
			window.requestAnimationFrame(() => {
				moveableRef.current?.updateRect();
			});
		});
		observer.observe(canvas);
		return () => observer.disconnect();
	}, [canvasRef, moveableTargets]);

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
		const startMap = new Map<number, InteractionStart>();
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

	return {
		moveableRef,
		moveableTargets,
		selectionIds,
		isSelectionLocked,
		keepRatio,
		startMoveableInteraction,
		endMoveableInteraction,
		previewDrag,
		commitDrag,
		previewResize,
		commitResize,
		applyRotate,
		commitRotate,
	};
}
