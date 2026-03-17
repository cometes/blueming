"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isGroupSticker, isImageSticker, isPctSticker } from "@/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/types/stickerBoard";

export function useStickerBoardState(componentsDraft: StickerBoardComponent[]) {
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	const [isTextInsertMode, setIsTextInsertMode] = useState(false);
	const [uploadThumbnail, setUploadThumbnail] = useState("");
	const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(
		() => new Set(),
	);
	const [imageReplaceTargetId, setImageReplaceTargetId] = useState<number | null>(
		null,
	);
	const [isMoveableInteracting, setIsMoveableInteracting] = useState(false);
	const [canvasElement, setCanvasElement] = useState<HTMLElement | null>(null);

	const visibleDraft = useMemo(
		() =>
			componentsDraft
				.filter((component) => component.isVisible !== false)
				.filter(isPctSticker)
				.slice()
				.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
		[componentsDraft],
	);

	const layerItems = useMemo(
		() =>
			componentsDraft
				.slice()
				.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)),
		[componentsDraft],
	);

	const selectedComponent = useMemo(
		() => componentsDraft.find((component) => component.id === selectedId) ?? null,
		[componentsDraft, selectedId],
	);

	const editingGroup = useMemo(() => {
		if (editingGroupId === null) return null;
		const group = componentsDraft.find((component) => component.id === editingGroupId);
		return group && isGroupSticker(group) ? group : null;
	}, [componentsDraft, editingGroupId]);

	const selectedGroupMeta = useMemo(() => {
		if (selectedIds.size < 2) return null;
		const ids = Array.from(selectedIds);
		const items = componentsDraft
			.filter((component) => ids.includes(component.id))
			.filter(isPctSticker)
			.filter((component) => component.isVisible !== false);
		if (items.length < 2) return null;
		const gid = items[0].groupId;
		if (!gid) return null;
		if (!items.every((item) => item.groupId === gid)) return null;
		const rotationDeg = items[0].groupRotationDeg ?? 0;
		const rad = (rotationDeg * Math.PI) / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);

		const fallbackMinX = Math.min(...items.map((item) => item.xPct));
		const fallbackMinY = Math.min(...items.map((item) => item.yPct));
		const fallbackMaxX = Math.max(...items.map((item) => item.xPct + item.widthPct));
		const fallbackMaxY = Math.max(...items.map((item) => item.yPct + item.heightPct));
		const fallbackCenterX = fallbackMinX + (fallbackMaxX - fallbackMinX) / 2;
		const fallbackCenterY = fallbackMinY + (fallbackMaxY - fallbackMinY) / 2;

		const centerX = items[0].groupCenterXPct ?? fallbackCenterX;
		const centerY = items[0].groupCenterYPct ?? fallbackCenterY;
		const toLocal = (x: number, y: number) => {
			const dx = x - centerX;
			const dy = y - centerY;
			return { x: dx * cos + dy * sin, y: -dx * sin + dy * cos };
		};

		let minLx = Infinity;
		let minLy = Infinity;
		let maxLx = -Infinity;
		let maxLy = -Infinity;
		items.forEach((item) => {
			const corners = [
				toLocal(item.xPct, item.yPct),
				toLocal(item.xPct + item.widthPct, item.yPct),
				toLocal(item.xPct, item.yPct + item.heightPct),
				toLocal(item.xPct + item.widthPct, item.yPct + item.heightPct),
			];
			corners.forEach((point) => {
				minLx = Math.min(minLx, point.x);
				minLy = Math.min(minLy, point.y);
				maxLx = Math.max(maxLx, point.x);
				maxLy = Math.max(maxLy, point.y);
			});
		});

		const w = maxLx - minLx;
		const h = maxLy - minLy;
		const minX = centerX + (minLx * cos - minLy * sin);
		const minY = centerY + (minLx * sin + minLy * cos);
		const maxZ = Math.max(...items.map((item) => item.zIndex ?? 0));
		return {
			groupId: gid,
			rotationDeg,
			ids: new Set(items.map((item) => item.id)),
			items,
			minX,
			minY,
			w,
			h,
			centerX,
			centerY,
			zIndex: maxZ + 1000,
		};
	}, [componentsDraft, selectedIds]);

	const selectedImageComponent = useMemo(
		() =>
			selectedComponent && isImageSticker(selectedComponent)
				? selectedComponent
				: null,
		[selectedComponent],
	);

	const getNextZIndex = useMemo(() => {
		const maxZ = componentsDraft.reduce(
			(acc, component) => Math.max(acc, component.zIndex ?? 0),
			0,
		);
		return maxZ + 1;
	}, [componentsDraft]);

	const setSelection = useCallback(
		(next: Set<number>, primaryId?: number | null) => {
			setSelectedIds(next);
			const nextPrimary =
				primaryId !== undefined
					? primaryId
					: next.size
						? Array.from(next)[0]
						: null;
			setSelectedId(nextPrimary ?? null);
		},
		[],
	);

	const enterGroupEdit = useCallback((groupId: number) => {
		setEditingGroupId(groupId);
		setExpandedGroupIds((prev) => new Set(prev).add(groupId));
	}, []);

	const exitGroupEdit = useCallback(() => {
		setEditingGroupId(null);
	}, []);

	useEffect(() => {
		if (selectedIds.size === 0) {
			if (selectedId !== null) setSelectedId(null);
			return;
		}
		const existing = new Set(componentsDraft.map((component) => component.id));
		const next = new Set<number>();
		selectedIds.forEach((id) => {
			if (existing.has(id)) next.add(id);
		});
		if (next.size !== selectedIds.size) {
			setSelectedIds(next);
		}
		if (selectedId !== null && !existing.has(selectedId)) {
			setSelectedId(next.size ? Array.from(next)[0] : null);
		}
	}, [componentsDraft, selectedId, selectedIds]);

	return {
		state: {
			selectedId,
			selectedIds,
			isImageDialogOpen,
			isTextInsertMode,
			uploadThumbnail,
			editingGroupId,
			expandedGroupIds,
			imageReplaceTargetId,
			isMoveableInteracting,
			canvasElement,
		},
		actions: {
			setSelectedId,
			setSelectedIds,
			setSelection,
			setIsImageDialogOpen,
			setIsTextInsertMode,
			setUploadThumbnail,
			setEditingGroupId,
			setExpandedGroupIds,
			setImageReplaceTargetId,
			setIsMoveableInteracting,
			setCanvasElement,
			enterGroupEdit,
			exitGroupEdit,
		},
		computed: {
			visibleDraft,
			layerItems,
			selectedComponent,
			editingGroup,
			selectedGroupMeta,
			selectedImageComponent,
			getNextZIndex,
		},
	};
}
