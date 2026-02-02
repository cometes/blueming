"use client";

import { useCallback } from "react";
import {
	cloneDraft,
	isGroupSticker,
	isPctSticker,
	normalizeStickerSize,
	type PctSticker,
} from "@/lib/stickerboard-utils";
import type {
	StickerBoardComponent,
	StickerBoardGroupComponent,
	StickerBoardLeafComponent,
} from "@/types/stickerBoard";

type StickerAlignAction =
	| "left"
	| "hcenter"
	| "right"
	| "top"
	| "vcenter"
	| "bottom";

export function useStickerManipulation(args: {
	selectedIdsRef: React.MutableRefObject<Set<number>>;
	selectedIdRef: React.MutableRefObject<number | null>;
	selectedComponent: StickerBoardComponent | null;
	presentRef: React.MutableRefObject<StickerBoardComponent[]>;
	canvasRef: React.RefObject<HTMLDivElement>;
	setComponentsDraft: React.Dispatch<
		React.SetStateAction<StickerBoardComponent[]>
	>;
	setSelectedId: (id: number | null) => void;
	setSelection: (next: Set<number>, primaryId?: number | null) => void;
	commitHistoryBase: (base: StickerBoardComponent[] | null) => void;
	clampStickerToEditorBounds: (sticker: {
		xPct: number;
		yPct: number;
		widthPct: number;
		heightPct: number;
	}) => { xPct: number; yPct: number; widthPct: number; heightPct: number };
	isRestoringHistoryRef: React.MutableRefObject<boolean>;
}): {
	alignSelectedSticker: (action: StickerAlignAction) => void;
	deleteSelectedSticker: () => void;
	duplicateSelectedSticker: () => void;
	groupSelection: () => void;
	ungroupSelection: () => void;
} {
	const {
		selectedIdsRef,
		selectedIdRef,
		selectedComponent,
		presentRef,
		canvasRef,
		setComponentsDraft,
		setSelectedId,
		setSelection,
		commitHistoryBase,
		clampStickerToEditorBounds,
		isRestoringHistoryRef,
	} = args;

	const alignSelectedSticker = useCallback(
		(action: StickerAlignAction) => {
			const selection = new Set(selectedIdsRef.current);
			if (selectedComponent) selection.add(selectedComponent.id);
			if (selection.size === 0) return;

			const selectedItemsAll = presentRef.current
				.filter((c) => selection.has(c.id))
				.filter(isPctSticker)
				.filter((c) => c.isVisible !== false);
			if (selectedItemsAll.length === 0) return;

			const selectedMovable = selectedItemsAll.filter(
				(c) => c.isLocked !== true,
			);
			if (selectedMovable.length === 0) return;

			const canvas = canvasRef.current;
			if (!canvas) return;

			const c = canvas.getBoundingClientRect();
			if (c.width <= 0 || c.height <= 0) return;

			const base = cloneDraft(presentRef.current);

			const commonGroupId =
				selectedItemsAll.length >= 2 ? selectedItemsAll[0].groupId : undefined;
			const isSingleGroup =
				Boolean(commonGroupId) &&
				selectedItemsAll.length >= 2 &&
				selectedItemsAll.every((it) => it.groupId === commonGroupId);

			if (!isSingleGroup) {
				setComponentsDraft((prev) =>
					prev.map((c) => {
						if (!selection.has(c.id)) return c;
						if (!isPctSticker(c)) return c;
						if (c.isLocked === true) return c;

						const nextXY = (() => {
							switch (action) {
								case "left":
									return { xPct: 0, yPct: c.yPct };
								case "hcenter":
									return { xPct: 50 - c.widthPct / 2, yPct: c.yPct };
								case "right":
									return { xPct: 100 - c.widthPct, yPct: c.yPct };
								case "top":
									return { xPct: c.xPct, yPct: 0 };
								case "vcenter":
									return { xPct: c.xPct, yPct: 50 - c.heightPct / 2 };
								case "bottom":
									return { xPct: c.xPct, yPct: 100 - c.heightPct };
							}
						})();

						const next = clampStickerToEditorBounds({
							xPct: nextXY.xPct,
							yPct: nextXY.yPct,
							widthPct: c.widthPct,
							heightPct: c.heightPct,
						});
						return { ...c, ...next };
					}),
				);
				commitHistoryBase(base);
				return;
			}

			const groupItems = selectedMovable;
			const minX = Math.min(...groupItems.map((it) => it.xPct));
			const minY = Math.min(...groupItems.map((it) => it.yPct));
			const maxX = Math.max(...groupItems.map((it) => it.xPct + it.widthPct));
			const maxY = Math.max(...groupItems.map((it) => it.yPct + it.heightPct));
			const groupW = maxX - minX;
			const groupH = maxY - minY;

			const next = (() => {
				switch (action) {
					case "left":
						return { xPct: 0, yPct: minY };
					case "hcenter":
						return { xPct: 50 - groupW / 2, yPct: minY };
					case "right":
						return { xPct: 100 - groupW, yPct: minY };
					case "top":
						return { xPct: minX, yPct: 0 };
					case "vcenter":
						return { xPct: minX, yPct: 50 - groupH / 2 };
					case "bottom":
						return { xPct: minX, yPct: 100 - groupH };
				}
			})();

			const dx = next.xPct - minX;
			const dy = next.yPct - minY;
			setComponentsDraft((prev) =>
				prev.map((c) => {
					if (!selection.has(c.id)) return c;
					if (!isPctSticker(c)) return c;
					if (c.isLocked === true) return c;
					return { ...c, xPct: c.xPct + dx, yPct: c.yPct + dy };
				}),
			);
			commitHistoryBase(base);
		},
		[
			canvasRef,
			clampStickerToEditorBounds,
			commitHistoryBase,
			presentRef,
			selectedComponent,
			selectedIdsRef,
			setComponentsDraft,
		],
	);

	const deleteSelectedSticker = useCallback(() => {
		const id = selectedIdRef.current;
		if (!id) return;
		const target = presentRef.current.find((c) => c.id === id);
		if (!target) return;
		if (target.isLocked === true) return;
		const base = cloneDraft(presentRef.current);
		isRestoringHistoryRef.current = true;
		setComponentsDraft((prev) => prev.filter((c) => c.id !== id));
		setSelectedId(null);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [
		commitHistoryBase,
		isRestoringHistoryRef,
		presentRef,
		selectedIdRef,
		setComponentsDraft,
		setSelectedId,
	]);

	const duplicateSelectedSticker = useCallback(() => {
		const id = selectedIdRef.current;
		if (!id) return;
		const target = presentRef.current.find((c) => c.id === id);
		if (!target) return;
		if (target.isLocked === true) return;

		const base = cloneDraft(presentRef.current);
		const newId = Date.now();
		const maxZ = presentRef.current.reduce(
			(acc, c) => Math.max(acc, c.zIndex ?? 0),
			0,
		);
		const offset = 2;
		const pasted: StickerBoardComponent = {
			...(cloneDraft([target])[0] as StickerBoardComponent),
			id: newId,
			zIndex: maxZ + 1,
			...normalizeStickerSize({
				xPct: (target as PctSticker).xPct + offset,
				yPct: (target as PctSticker).yPct + offset,
				widthPct: (target as PctSticker).widthPct,
				heightPct: (target as PctSticker).heightPct,
			}),
		};

		isRestoringHistoryRef.current = true;
		setComponentsDraft((prev) => [...prev, pasted]);
		setSelectedId(newId);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [
		commitHistoryBase,
		isRestoringHistoryRef,
		presentRef,
		selectedIdRef,
		setComponentsDraft,
		setSelectedId,
	]);

	const groupSelection = useCallback(() => {
		const ids = Array.from(selectedIdsRef.current);
		if (ids.length < 2) return;

		const selected = presentRef.current.filter((c) => ids.includes(c.id));
		if (selected.some((c) => isGroupSticker(c))) return;

		const items = selected
			.filter(isPctSticker)
			.filter((c) => c.isVisible !== false)
			.filter((c) => c.isLocked !== true);
		if (items.length < 2) return;

		const base = cloneDraft(presentRef.current);

		const minX = Math.min(...items.map((it) => it.xPct));
		const minY = Math.min(...items.map((it) => it.yPct));
		const maxX = Math.max(...items.map((it) => it.xPct + it.widthPct));
		const maxY = Math.max(...items.map((it) => it.yPct + it.heightPct));
		const w = Math.max(0.0001, maxX - minX);
		const h = Math.max(0.0001, maxY - minY);

		const groupId = Date.now();
		const group: StickerBoardGroupComponent = {
			id: groupId,
			type: "group",
			name: "그룹",
			zIndex: Math.max(...items.map((it) => it.zIndex ?? 0)),
			xPct: minX,
			yPct: minY,
			widthPct: w,
			heightPct: h,
			rotation: 0,
			isVisible: true,
			children: items.map((it) => {
				const local: StickerBoardLeafComponent = {
					...(cloneDraft([it])[0] as StickerBoardLeafComponent),
					xPct: ((it.xPct - minX) / w) * 100,
					yPct: ((it.yPct - minY) / h) * 100,
					widthPct: (it.widthPct / w) * 100,
					heightPct: (it.heightPct / h) * 100,
				};
				return local;
			}),
		};

		const nextTop = presentRef.current
			.filter((c) => !ids.includes(c.id))
			.concat(group)
			.slice()
			.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
			.map((c, idx) => ({ ...c, zIndex: idx }));

		isRestoringHistoryRef.current = true;
		setComponentsDraft(nextTop);
		setSelection(new Set([groupId]), groupId);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [
		commitHistoryBase,
		isRestoringHistoryRef,
		presentRef,
		selectedIdsRef,
		setComponentsDraft,
		setSelection,
	]);

	const ungroupSelection = useCallback(() => {
		const id = selectedIdRef.current;
		if (!id) return;
		const group = presentRef.current.find((c) => c.id === id);
		if (!group || !isGroupSticker(group)) return;
		if (group.isLocked === true) return;

		const base = cloneDraft(presentRef.current);

		const rad = ((group.rotation ?? 0) * Math.PI) / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);
		const cx = group.xPct + group.widthPct / 2;
		const cy = group.yPct + group.heightPct / 2;

		const childrenWorld = (group.children ?? []).map((child) => {
			const w = (child.widthPct / 100) * group.widthPct;
			const h = (child.heightPct / 100) * group.heightPct;
			const localCenterX =
				group.xPct +
				((child.xPct + child.widthPct / 2) / 100) * group.widthPct;
			const localCenterY =
				group.yPct +
				((child.yPct + child.heightPct / 2) / 100) * group.heightPct;

			// rotate center around group center
			const dx = localCenterX - cx;
			const dy = localCenterY - cy;
			const rx = dx * cos - dy * sin;
			const ry = dx * sin + dy * cos;
			const centerX = cx + rx;
			const centerY = cy + ry;

			return {
				...(cloneDraft([child])[0] as StickerBoardLeafComponent),
				xPct: centerX - w / 2,
				yPct: centerY - h / 2,
				widthPct: w,
				heightPct: h,
				rotation: (child.rotation ?? 0) + (group.rotation ?? 0),
			};
		});

		const groupZ = group.zIndex ?? 0;
		// Insert children around the group's z-index slot, preserving child z order
		const sortedChildren = childrenWorld
			.slice()
			.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
			.map((c, idx) => ({ ...c, zIndex: groupZ + idx }));

		const nextTop = presentRef.current
			.filter((c) => c.id !== group.id)
			.concat(sortedChildren)
			.slice()
			.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
			.map((c, idx) => ({ ...c, zIndex: idx }));

		isRestoringHistoryRef.current = true;
		setComponentsDraft(nextTop);
		setSelection(
			new Set(sortedChildren.map((c) => c.id)),
			sortedChildren[0]?.id ?? null,
		);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [
		commitHistoryBase,
		isRestoringHistoryRef,
		presentRef,
		selectedIdRef,
		setComponentsDraft,
		setSelection,
	]);

	return {
		alignSelectedSticker,
		deleteSelectedSticker,
		duplicateSelectedSticker,
		groupSelection,
		ungroupSelection,
	};
}
