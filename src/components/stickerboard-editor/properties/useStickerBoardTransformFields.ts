"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface StickerLike {
	id: number;
	xPct: number;
	yPct: number;
	widthPct: number;
	heightPct: number;
	lockAspectRatio?: boolean;
}

interface UseStickerBoardTransformFieldsArgs<T extends StickerLike> {
	selectedComponent: T | null;
	canvasRef: React.RefObject<HTMLElement | null>;
	moveableInteractionRef: React.RefObject<boolean>;
	updateComponent: (id: number, updater: (prev: T) => T) => void;
	clampStickerToEditorBounds: (value: {
		xPct: number;
		yPct: number;
		widthPct: number;
		heightPct: number;
	}) => {
		xPct: number;
		yPct: number;
		widthPct: number;
		heightPct: number;
	};
}

export function useStickerBoardTransformFields<T extends StickerLike>({
	selectedComponent,
	canvasRef,
	moveableInteractionRef,
	updateComponent,
	clampStickerToEditorBounds,
}: UseStickerBoardTransformFieldsArgs<T>) {
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
		const canvas = canvasRef.current;
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
	}, [canvasRef]);

	const toPx = useMemo(
		() => (pct: number, total: number) =>
			total > 0 ? Math.round((pct / 100) * total) : 0,
		[],
	);
	const toPct = useMemo(
		() => (px: number, total: number) => (total > 0 ? (px / total) * 100 : 0),
		[],
	);

	const syncPxDraft = useCallback(
		(component: T | null) => {
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
		[canvasSize.height, canvasSize.width, toPx],
	);

	const getDraftValue = useCallback(
		(componentId: number | null, field: "x" | "y" | "width" | "height") => {
			if (componentId !== null && pxDraft.id === componentId) {
				return pxDraft[field];
			}
			return "";
		},
		[pxDraft],
	);

	useEffect(() => {
		if (editingFieldRef.current) return;
		syncPxDraft(selectedComponent);
	}, [selectedComponent, canvasSize, syncPxDraft]);

	const applyPxUpdate = useCallback(
		(componentId: number, field: "x" | "y" | "width" | "height", rawValue: string) => {
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
					const min = 2;
					let widthPct = toPct(value, canvasSize.width);
					widthPct = Math.max(min, widthPct);
					let heightPct = prev.heightPct;
					if (prev.lockAspectRatio === true) {
						const aspect = prev.heightPct / Math.max(0.0001, prev.widthPct);
						heightPct = Math.max(min, widthPct * aspect);
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

				const min = 2;
				let heightPct = toPct(value, canvasSize.height);
				heightPct = Math.max(min, heightPct);
				let widthPct = prev.widthPct;
				if (prev.lockAspectRatio === true) {
					const aspect = prev.heightPct / Math.max(0.0001, prev.widthPct);
					widthPct = Math.max(min, heightPct / Math.max(0.0001, aspect));
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
		[canvasSize, clampStickerToEditorBounds, toPct, updateComponent],
	);

	const buildTransformValues = useCallback(
		(componentId: number) => ({
			x: getDraftValue(componentId, "x"),
			y: getDraftValue(componentId, "y"),
			width: getDraftValue(componentId, "width"),
			height: getDraftValue(componentId, "height"),
		}),
		[getDraftValue],
	);

	const handleTransformFieldChange = useCallback(
		(componentId: number, field: "x" | "y" | "width" | "height", value: string) => {
			setPxDraft((prev) => ({
				...prev,
				id: componentId,
				[field]: value,
			}));
		},
		[],
	);

	const handleTransformFieldCommit = useCallback(
		(componentId: number, field: "x" | "y" | "width" | "height") => {
			editingFieldRef.current = null;
			applyPxUpdate(componentId, field, getDraftValue(componentId, field));
		},
		[applyPxUpdate, getDraftValue],
	);

	useEffect(() => {
		let rafId = 0;
		const tick = () => {
			const component = selectedComponent;
			if (!component || editingFieldRef.current) {
				rafId = requestAnimationFrame(tick);
				return;
			}
			if (!moveableInteractionRef.current) {
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
	}, [canvasRef, canvasSize, moveableInteractionRef, selectedComponent, toPx]);

	return {
		canvasSize,
		buildTransformValues,
		handleTransformFieldChange,
		handleTransformFieldCommit,
		editingFieldRef,
	};
}
