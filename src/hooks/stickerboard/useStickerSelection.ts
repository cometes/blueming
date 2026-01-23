"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isGroupSticker, isPctSticker } from "@/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/types/stickerBoard";

export function useStickerSelection(componentsDraft: StickerBoardComponent[]) {
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(
		() => new Set(),
	);
	const selectedIdRef = useRef<number | null>(null);
	const selectedIdsRef = useRef<Set<number>>(new Set());

	const selectedComponent = useMemo(
		() => componentsDraft.find((c) => c.id === selectedId) ?? null,
		[componentsDraft, selectedId],
	);

	const editingGroup = useMemo(() => {
		if (editingGroupId === null) return null;
		const g = componentsDraft.find((c) => c.id === editingGroupId);
		return g && isGroupSticker(g) ? g : null;
	}, [componentsDraft, editingGroupId]);

	const enterGroupEdit = (groupId: number) => {
		setEditingGroupId(groupId);
		setExpandedGroupIds((prev) => new Set(prev).add(groupId));
	};

	const exitGroupEdit = () => {
		setEditingGroupId(null);
	};

	const selectedGroupMeta = useMemo(() => {
		if (selectedIds.size < 2) return null;
		const ids = Array.from(selectedIds);
		const items = componentsDraft
			.filter((c) => ids.includes(c.id))
			.filter(isPctSticker)
			.filter((c) => c.isVisible !== false);
		if (items.length < 2) return null;
		const gid = items[0].groupId;
		if (!gid) return null;
		if (!items.every((it) => it.groupId === gid)) return null;
		const rotationDeg = items[0].groupRotationDeg ?? 0;
		const rad = (rotationDeg * Math.PI) / 180;
		const cos = Math.cos(rad);
		const sin = Math.sin(rad);

		const fallbackMinX = Math.min(...items.map((it) => it.xPct));
		const fallbackMinY = Math.min(...items.map((it) => it.yPct));
		const fallbackMaxX = Math.max(...items.map((it) => it.xPct + it.widthPct));
		const fallbackMaxY = Math.max(...items.map((it) => it.yPct + it.heightPct));
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
		items.forEach((it) => {
			const x1 = it.xPct;
			const y1 = it.yPct;
			const x2 = it.xPct + it.widthPct;
			const y2 = it.yPct + it.heightPct;
			const corners = [
				toLocal(x1, y1),
				toLocal(x2, y1),
				toLocal(x2, y2),
				toLocal(x1, y2),
			];
			corners.forEach((p) => {
				minLx = Math.min(minLx, p.x);
				minLy = Math.min(minLy, p.y);
				maxLx = Math.max(maxLx, p.x);
				maxLy = Math.max(maxLy, p.y);
			});
		});

		const widthPct = maxLx - minLx;
		const heightPct = maxLy - minLy;
		const centerLocalX = minLx + widthPct / 2;
		const centerLocalY = minLy + heightPct / 2;
		const centerWorldX = centerX + centerLocalX * cos - centerLocalY * sin;
		const centerWorldY = centerY + centerLocalX * sin + centerLocalY * cos;

		return {
			centerX: centerWorldX,
			centerY: centerWorldY,
			widthPct,
			heightPct,
			rotationDeg,
		};
	}, [componentsDraft, selectedIds]);

	useEffect(() => {
		selectedIdRef.current = selectedId;
	}, [selectedId, editingGroupId]);

	useEffect(() => {
		selectedIdsRef.current = selectedIds;
	}, [selectedIds]);

	const setSelection = (next: Set<number>, primaryId?: number | null) => {
		setSelectedIds(next);
		const nextPrimary =
			primaryId !== undefined
				? primaryId
				: next.size
					? Array.from(next)[0]
					: null;
		setSelectedId(nextPrimary ?? null);
	};

	const getGroupMemberIds = (id: number) => {
		const target = componentsDraft.find((c) => c.id === id);
		const gid = target?.groupId;
		if (!gid) return [id];
		return componentsDraft.filter((c) => c.groupId === gid).map((c) => c.id);
	};

	const toggleIds = (base: Set<number>, ids: number[]) => {
		const next = new Set(base);
		const allSelected = ids.every((id) => next.has(id));
		ids.forEach((id) => {
			if (allSelected) next.delete(id);
			else next.add(id);
		});
		return next;
	};

	useEffect(() => {
		if (selectedIds.size === 0) {
			if (selectedId !== null) setSelectedId(null);
			return;
		}
		const existing = new Set(componentsDraft.map((c) => c.id));
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
			editingGroupId,
			expandedGroupIds,
		},
		refs: {
			selectedIdRef,
			selectedIdsRef,
		},
		computed: {
			selectedComponent,
			editingGroup,
			selectedGroupMeta,
		},
		actions: {
			setSelectedId,
			setSelectedIds,
			setSelection,
			setEditingGroupId,
			setExpandedGroupIds,
			enterGroupEdit,
			exitGroupEdit,
			getGroupMemberIds,
			toggleIds,
		},
	};
}
