"use client";

import { useCallback } from "react";
import { cloneDraft } from "@/features/stickerboard-editor/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/features/stickerboard-editor/model";

interface UseStickerBoardLayerManipulationArgs {
	selectedIdRef: React.MutableRefObject<number | null>;
	presentRef: React.MutableRefObject<StickerBoardComponent[]>;
	isRestoringHistoryRef: React.MutableRefObject<boolean>;
	setComponentsDraft: React.Dispatch<React.SetStateAction<StickerBoardComponent[]>>;
	commitHistoryBase: (base: StickerBoardComponent[] | null) => void;
}

export function useStickerBoardLayerManipulation({
	selectedIdRef,
	presentRef,
	isRestoringHistoryRef,
	setComponentsDraft,
	commitHistoryBase,
}: UseStickerBoardLayerManipulationArgs) {
	const moveSelectedZIndex = useCallback(
		(direction: "forward" | "backward", toEdge: boolean) => {
			const id = selectedIdRef.current;
			if (!id) return;
			const target = presentRef.current.find((component) => component.id === id);
			if (!target || target.isLocked === true) return;
			const base = cloneDraft(presentRef.current);
			const asc = presentRef.current
				.slice()
				.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
				.map((component) => component.id);
			const from = asc.indexOf(id);
			if (from < 0) return;
			let to = from;
			if (toEdge) {
				to = direction === "forward" ? asc.length - 1 : 0;
			} else {
				to =
					direction === "forward"
						? Math.min(asc.length - 1, from + 1)
						: Math.max(0, from - 1);
			}
			if (to === from) return;
			const nextOrder = asc.slice();
			nextOrder.splice(from, 1);
			nextOrder.splice(to, 0, id);
			const zMap = new Map<number, number>();
			nextOrder.forEach((cid, idx) => zMap.set(cid, idx));
			isRestoringHistoryRef.current = true;
			setComponentsDraft((prev) =>
				prev.map((component) =>
					zMap.has(component.id)
						? { ...component, zIndex: zMap.get(component.id)! }
						: component,
				),
			);
			queueMicrotask(() => {
				isRestoringHistoryRef.current = false;
			});
			commitHistoryBase(base);
		},
		[commitHistoryBase, isRestoringHistoryRef, presentRef, selectedIdRef, setComponentsDraft],
	);

	return {
		moveSelectedZIndex,
	};
}
