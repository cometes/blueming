"use client";

import { useCallback } from "react";
import {
	cloneDraft,
	isPctSticker,
} from "@/features/stickerboard-editor/lib/stickerboard-utils";
import type {
	StickerBoardComponent,
	StickerBoardTextComponent,
} from "@/features/stickerboard-editor/model";
import { useStickerBoardInsertions } from "@/features/stickerboard-editor/hooks/useStickerBoardInsertions";
import { useStickerBoardGroupManipulation } from "@/features/stickerboard-editor/hooks/useStickerBoardGroupManipulation";
import { useStickerBoardLayerManipulation } from "@/features/stickerboard-editor/hooks/useStickerBoardLayerManipulation";

type StickerAlignAction =
	| "left"
	| "hcenter"
	| "right"
	| "top"
	| "vcenter"
	| "bottom";

interface UseStickerBoardManipulationArgs {
	getNextZIndex: number;
	selectedComponent: StickerBoardComponent | null;
	selectedIdsRef: React.MutableRefObject<Set<number>>;
	selectedIdRef: React.MutableRefObject<number | null>;
	presentRef: React.MutableRefObject<StickerBoardComponent[]>;
	isRestoringHistoryRef: React.MutableRefObject<boolean>;
	canvasRef: React.MutableRefObject<HTMLDivElement | null>;
	boundsRef: React.MutableRefObject<HTMLDivElement | null>;
	setComponentsDraft: React.Dispatch<React.SetStateAction<StickerBoardComponent[]>>;
	setSelectedId: React.Dispatch<React.SetStateAction<number | null>>;
	setSelection: (next: Set<number>, primaryId?: number | null) => void;
	clampStickerToEditorBounds: (
		sticker: Pick<StickerBoardComponent, "xPct" | "yPct" | "widthPct" | "heightPct">,
	) => { xPct: number; yPct: number; widthPct: number; heightPct: number };
	computeAutoSizePct: (component: StickerBoardTextComponent) =>
		| { widthPct: number; heightPct: number }
		| null
		| undefined;
	commitHistoryBase: (base: StickerBoardComponent[] | null) => void;
	markAssetUsed: (assetId: string) => Promise<void>;
}

export function useStickerBoardManipulation({
	getNextZIndex,
	selectedComponent,
	selectedIdsRef,
	selectedIdRef,
	presentRef,
	isRestoringHistoryRef,
	canvasRef,
	setComponentsDraft,
	setSelectedId,
	setSelection,
	clampStickerToEditorBounds,
	computeAutoSizePct,
	commitHistoryBase,
	markAssetUsed,
}: UseStickerBoardManipulationArgs) {
	const alignSelectedSticker = useCallback(
		(action: StickerAlignAction) => {
			const selection = new Set(selectedIdsRef.current);
			if (selectedComponent) selection.add(selectedComponent.id);
			if (selection.size === 0) return;

			const selectedItemsAll = presentRef.current
				.filter((component) => selection.has(component.id))
				.filter(isPctSticker)
				.filter((component) => component.isVisible !== false);
			if (selectedItemsAll.length === 0) return;

			const selectedMovable = selectedItemsAll.filter(
				(component) => component.isLocked !== true,
			);
			if (selectedMovable.length === 0) return;

			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return;

			const base = cloneDraft(presentRef.current);
			const commonGroupId =
				selectedItemsAll.length >= 2 ? selectedItemsAll[0].groupId : undefined;
			const isSingleGroup =
				Boolean(commonGroupId) &&
				selectedItemsAll.length >= 2 &&
				selectedItemsAll.every((item) => item.groupId === commonGroupId);

			if (!isSingleGroup) {
				setComponentsDraft((prev) =>
					prev.map((component) => {
						if (!selection.has(component.id)) return component;
						if (!isPctSticker(component)) return component;
						if (component.isLocked === true) return component;
						const nextXY = (() => {
							switch (action) {
								case "left":
									return { xPct: 0, yPct: component.yPct };
								case "hcenter":
									return {
										xPct: 50 - component.widthPct / 2,
										yPct: component.yPct,
									};
								case "right":
									return { xPct: 100 - component.widthPct, yPct: component.yPct };
								case "top":
									return { xPct: component.xPct, yPct: 0 };
								case "vcenter":
									return {
										xPct: component.xPct,
										yPct: 50 - component.heightPct / 2,
									};
								case "bottom":
									return { xPct: component.xPct, yPct: 100 - component.heightPct };
							}
						})();
						const next = clampStickerToEditorBounds({
							xPct: nextXY.xPct,
							yPct: nextXY.yPct,
							widthPct: component.widthPct,
							heightPct: component.heightPct,
						});
						return { ...component, ...next };
					}),
				);
				commitHistoryBase(base);
				return;
			}

			const groupItems = selectedMovable;
			const minX = Math.min(...groupItems.map((item) => item.xPct));
			const minY = Math.min(...groupItems.map((item) => item.yPct));
			const maxX = Math.max(...groupItems.map((item) => item.xPct + item.widthPct));
			const maxY = Math.max(...groupItems.map((item) => item.yPct + item.heightPct));
			const groupW = maxX - minX;
			const groupH = maxY - minY;
			const desiredDelta = (() => {
				switch (action) {
					case "left":
						return { dx: -minX, dy: 0 };
					case "hcenter":
						return { dx: 50 - (minX + groupW / 2), dy: 0 };
					case "right":
						return { dx: 100 - (minX + groupW), dy: 0 };
					case "top":
						return { dx: 0, dy: -minY };
					case "vcenter":
						return { dx: 0, dy: 50 - (minY + groupH / 2) };
					case "bottom":
						return { dx: 0, dy: 100 - (minY + groupH) };
				}
			})();

			// 캔버스 밖 배치를 허용하므로 정렬 이동량을 bounds로 제한하지 않는다.
			const dx = desiredDelta.dx;
			const dy = desiredDelta.dy;

			setComponentsDraft((prev) =>
				prev.map((component) => {
					if (!selection.has(component.id)) return component;
					if (!isPctSticker(component)) return component;
					if (component.isLocked === true) return component;
					const next = clampStickerToEditorBounds({
						xPct: component.xPct + dx,
						yPct: component.yPct + dy,
						widthPct: component.widthPct,
						heightPct: component.heightPct,
					});
					return { ...component, ...next };
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

	const updateComponent = useCallback(
		(id: number, updater: (prev: StickerBoardComponent) => StickerBoardComponent) => {
			setComponentsDraft((prev) =>
				prev.map((component) => (component.id === id ? updater(component) : component)),
			);
		},
		[setComponentsDraft],
	);

	const toggleVisibility = useCallback((id: number) => {
		setComponentsDraft((prev) =>
			prev.map((component) =>
				component.id === id
					? { ...component, isVisible: !(component.isVisible !== false) }
					: component,
			),
		);
	}, [setComponentsDraft]);

	const toggleLock = useCallback((id: number) => {
		setComponentsDraft((prev) =>
			prev.map((component) =>
				component.id === id ? { ...component, isLocked: !component.isLocked } : component,
			),
		);
	}, [setComponentsDraft]);

	const deleteSticker = useCallback((id: number) => {
		setComponentsDraft((prev) => prev.filter((component) => component.id !== id));
		setSelectedId((prev) => (prev === id ? null : prev));
	}, [setComponentsDraft, setSelectedId]);

	const reorderLayersByIndex = useCallback((fromIndex: number, toIndex: number) => {
		setComponentsDraft((prev) => {
			const order = prev
				.slice()
				.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
				.map((component) => component.id);
			if (
				fromIndex < 0 ||
				toIndex < 0 ||
				fromIndex >= order.length ||
				toIndex >= order.length ||
				fromIndex === toIndex
			) {
				return prev;
			}

			const nextOrder = order.slice();
			const [moved] = nextOrder.splice(fromIndex, 1);
			nextOrder.splice(toIndex, 0, moved);
			const zMap = new Map<number, number>();
			nextOrder.forEach((id, idx) => {
				zMap.set(id, nextOrder.length - 1 - idx);
			});
			return prev.map((component) =>
				zMap.has(component.id)
					? { ...component, zIndex: zMap.get(component.id)! }
					: component,
			);
		});
	}, [setComponentsDraft]);

	const { addTextSticker, addTextStickerAt, addImageSticker, addImageStickerAt } =
		useStickerBoardInsertions({
			getNextZIndex,
			canvasRef,
			setComponentsDraft,
			setSelectedId,
			clampStickerToEditorBounds,
			computeAutoSizePct,
			commitHistoryBase,
			markAssetUsed,
		});

	const {
		getGroupMemberIds,
		toggleIds,
		deleteSelectedSticker,
		duplicateSelectedSticker,
		groupSelection,
		ungroupSelection,
	} = useStickerBoardGroupManipulation({
		selectedIdsRef,
		selectedIdRef,
		presentRef,
		isRestoringHistoryRef,
		setComponentsDraft,
		setSelectedId,
		setSelection,
		commitHistoryBase,
	});

	const { moveSelectedZIndex } = useStickerBoardLayerManipulation({
		selectedIdRef,
		presentRef,
		isRestoringHistoryRef,
		setComponentsDraft,
		commitHistoryBase,
	});

	return {
		alignSelectedSticker,
		updateComponent,
		toggleVisibility,
		toggleLock,
		deleteSticker,
		reorderLayersByIndex,
		addTextSticker,
		addTextStickerAt,
		addImageSticker,
		addImageStickerAt,
		getGroupMemberIds,
		toggleIds,
		deleteSelectedSticker,
		duplicateSelectedSticker,
		groupSelection,
		ungroupSelection,
		moveSelectedZIndex,
	};
}
