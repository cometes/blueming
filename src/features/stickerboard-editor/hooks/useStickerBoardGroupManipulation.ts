"use client";

import { useCallback } from "react";
import { cloneDraft, isGroupSticker, isPctSticker, normalizeStickerSize, type PctSticker } from "@/lib/stickerboard-utils";
import type {
	StickerBoardComponent,
	StickerBoardGroupComponent,
	StickerBoardLeafComponent,
} from "@/types/stickerBoard";

interface UseStickerBoardGroupManipulationArgs {
	selectedIdsRef: React.MutableRefObject<Set<number>>;
	selectedIdRef: React.MutableRefObject<number | null>;
	presentRef: React.MutableRefObject<StickerBoardComponent[]>;
	isRestoringHistoryRef: React.MutableRefObject<boolean>;
	setComponentsDraft: React.Dispatch<React.SetStateAction<StickerBoardComponent[]>>;
	setSelectedId: React.Dispatch<React.SetStateAction<number | null>>;
	setSelection: (next: Set<number>, primaryId?: number | null) => void;
	commitHistoryBase: (base: StickerBoardComponent[] | null) => void;
}

export function useStickerBoardGroupManipulation({
	selectedIdsRef,
	selectedIdRef,
	presentRef,
	isRestoringHistoryRef,
	setComponentsDraft,
	setSelectedId,
	setSelection,
	commitHistoryBase,
}: UseStickerBoardGroupManipulationArgs) {
	const getGroupMemberIds = useCallback(
		(id: number) => {
			const target = presentRef.current.find((component) => component.id === id);
			const groupId = target?.groupId;
			if (!groupId) return [id];
			return presentRef.current
				.filter((component) => component.groupId === groupId)
				.map((component) => component.id);
		},
		[presentRef],
	);

	const toggleIds = useCallback((base: Set<number>, ids: number[]) => {
		const next = new Set(base);
		const allSelected = ids.every((id) => next.has(id));
		ids.forEach((id) => {
			if (allSelected) next.delete(id);
			else next.add(id);
		});
		return next;
	}, []);

	const deleteSelectedSticker = useCallback(() => {
		const id = selectedIdRef.current;
		if (!id) return;
		const target = presentRef.current.find((component) => component.id === id);
		if (!target || target.isLocked === true) return;
		const base = cloneDraft(presentRef.current);
		isRestoringHistoryRef.current = true;
		setComponentsDraft((prev) => prev.filter((component) => component.id !== id));
		setSelectedId(null);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [commitHistoryBase, isRestoringHistoryRef, presentRef, selectedIdRef, setComponentsDraft, setSelectedId]);

	const duplicateSelectedSticker = useCallback(() => {
		const id = selectedIdRef.current;
		if (!id) return;
		const target = presentRef.current.find((component) => component.id === id);
		if (!target || target.isLocked === true) return;
		const base = cloneDraft(presentRef.current);
		const newId = Date.now();
		const maxZ = presentRef.current.reduce(
			(acc, component) => Math.max(acc, component.zIndex ?? 0),
			0,
		);
		const pasted: StickerBoardComponent = {
			...(cloneDraft([target])[0] as StickerBoardComponent),
			id: newId,
			zIndex: maxZ + 1,
			...normalizeStickerSize({
				xPct: (target as PctSticker).xPct + 2,
				yPct: (target as PctSticker).yPct + 2,
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
	}, [commitHistoryBase, isRestoringHistoryRef, presentRef, selectedIdRef, setComponentsDraft, setSelectedId]);

	const groupSelection = useCallback(() => {
		const ids = Array.from(selectedIdsRef.current);
		if (ids.length < 2) return;
		const selected = presentRef.current.filter((component) => ids.includes(component.id));
		if (selected.some((component) => isGroupSticker(component))) return;
		const items = selected
			.filter(isPctSticker)
			.filter((component) => component.isVisible !== false)
			.filter((component) => component.isLocked !== true);
		if (items.length < 2) return;
		const base = cloneDraft(presentRef.current);
		const minX = Math.min(...items.map((item) => item.xPct));
		const minY = Math.min(...items.map((item) => item.yPct));
		const maxX = Math.max(...items.map((item) => item.xPct + item.widthPct));
		const maxY = Math.max(...items.map((item) => item.yPct + item.heightPct));
		const groupId = Date.now();
		const group: StickerBoardGroupComponent = {
			id: groupId,
			type: "group",
			name: "그룹",
			zIndex: Math.max(...items.map((item) => item.zIndex ?? 0)),
			xPct: minX,
			yPct: minY,
			widthPct: Math.max(0.0001, maxX - minX),
			heightPct: Math.max(0.0001, maxY - minY),
			rotation: 0,
			isVisible: true,
			children: items.map((item) => ({
				...(cloneDraft([item])[0] as StickerBoardLeafComponent),
				xPct: ((item.xPct - minX) / Math.max(0.0001, maxX - minX)) * 100,
				yPct: ((item.yPct - minY) / Math.max(0.0001, maxY - minY)) * 100,
				widthPct: (item.widthPct / Math.max(0.0001, maxX - minX)) * 100,
				heightPct: (item.heightPct / Math.max(0.0001, maxY - minY)) * 100,
			})),
		};
		const nextTop = presentRef.current
			.filter((component) => !ids.includes(component.id))
			.concat(group)
			.slice()
			.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
			.map((component, idx) => ({ ...component, zIndex: idx }));
		isRestoringHistoryRef.current = true;
		setComponentsDraft(nextTop);
		setSelection(new Set([groupId]), groupId);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [commitHistoryBase, isRestoringHistoryRef, presentRef, selectedIdsRef, setComponentsDraft, setSelection]);

	const ungroupSelection = useCallback(() => {
		const id = selectedIdRef.current;
		if (!id) return;
		const group = presentRef.current.find((component) => component.id === id);
		if (!group || !isGroupSticker(group) || group.isLocked === true) return;
		const base = cloneDraft(presentRef.current);
		const rad = ((group.rotation ?? 0) * Math.PI) / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);
		const cx = group.xPct + group.widthPct / 2;
		const cy = group.yPct + group.heightPct / 2;
		const childrenWorld: StickerBoardLeafComponent[] = (group.children ?? []).map((child) => {
			const w = (child.widthPct / 100) * group.widthPct;
			const h = (child.heightPct / 100) * group.heightPct;
			const localCenterX =
				group.xPct + ((child.xPct + child.widthPct / 2) / 100) * group.widthPct;
			const localCenterY =
				group.yPct + ((child.yPct + child.heightPct / 2) / 100) * group.heightPct;
			const dx = localCenterX - cx;
			const dy = localCenterY - cy;
			const centerX = cx + (dx * cos - dy * sin);
			const centerY = cy + (dx * sin + dy * cos);
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
		const sortedChildren = childrenWorld
			.slice()
			.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
			.map((component, idx) => ({ ...component, zIndex: groupZ + idx }));
		const nextTop = presentRef.current
			.filter((component) => component.id !== group.id)
			.concat(sortedChildren)
			.slice()
			.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
			.map((component, idx) => ({ ...component, zIndex: idx }));
		isRestoringHistoryRef.current = true;
		setComponentsDraft(nextTop);
		setSelection(
			new Set(sortedChildren.map((component) => component.id)),
			sortedChildren[0]?.id ?? null,
		);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [commitHistoryBase, isRestoringHistoryRef, presentRef, selectedIdRef, setComponentsDraft, setSelection]);

	return {
		getGroupMemberIds,
		toggleIds,
		deleteSelectedSticker,
		duplicateSelectedSticker,
		groupSelection,
		ungroupSelection,
	};
}
