"use client";

import { useEffect, useRef, useState } from "react";
import { cloneDraft } from "@/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/types/stickerBoard";

export function useStickerHistory(args: {
	componentsDraft: StickerBoardComponent[];
	presentRef: React.MutableRefObject<StickerBoardComponent[]>;
	moveableInteractionRef: React.MutableRefObject<boolean>;
	setComponentsDraft: React.Dispatch<
		React.SetStateAction<StickerBoardComponent[]>
	>;
}) {
	const { componentsDraft, presentRef, moveableInteractionRef, setComponentsDraft } =
		args;
	const [historyPast, setHistoryPast] = useState<StickerBoardComponent[][]>(
		[],
	);
	const [historyFuture, setHistoryFuture] = useState<StickerBoardComponent[][]>(
		[],
	);
	const historyDebounceRef = useRef<number | null>(null);
	const pendingHistoryBaseRef = useRef<StickerBoardComponent[] | null>(null);
	const prevDraftRef = useRef<StickerBoardComponent[] | null>(null);
	const isRestoringHistoryRef = useRef(false);

	const commitHistoryBase = (base: StickerBoardComponent[] | null) => {
		if (!base) return;
		const MAX = 100;
		setHistoryPast((prev) => {
			const next = [...prev, base];
			return next.length > MAX ? next.slice(next.length - MAX) : next;
		});
		setHistoryFuture([]);
	};

	useEffect(() => {
		if (isRestoringHistoryRef.current) {
			prevDraftRef.current = cloneDraft(componentsDraft);
			return;
		}
		if (moveableInteractionRef.current) {
			prevDraftRef.current = cloneDraft(componentsDraft);
			return;
		}

		const prev = prevDraftRef.current;
		if (!prev) {
			prevDraftRef.current = cloneDraft(componentsDraft);
			return;
		}

		if (!pendingHistoryBaseRef.current) {
			pendingHistoryBaseRef.current = prev;
		}

		if (historyDebounceRef.current) {
			window.clearTimeout(historyDebounceRef.current);
		}

		historyDebounceRef.current = window.setTimeout(() => {
			const base = pendingHistoryBaseRef.current;
			pendingHistoryBaseRef.current = null;
			historyDebounceRef.current = null;
			if (!base) return;

			if (JSON.stringify(base) !== JSON.stringify(presentRef.current)) {
				commitHistoryBase(base);
			}
		}, 250);

		prevDraftRef.current = cloneDraft(componentsDraft);
	}, [componentsDraft, moveableInteractionRef, presentRef]);

	const undo = () => {
		setHistoryPast((past) => {
			if (past.length === 0) return past;
			const prev = past[past.length - 1];
			const nextPast = past.slice(0, -1);
			const present = cloneDraft(presentRef.current);
			isRestoringHistoryRef.current = true;
			setComponentsDraft(prev);
			setHistoryFuture((future) => [present, ...future]);
			queueMicrotask(() => {
				isRestoringHistoryRef.current = false;
			});
			return nextPast;
		});
	};

	const redo = () => {
		setHistoryFuture((future) => {
			if (future.length === 0) return future;
			const next = future[0];
			const rest = future.slice(1);
			const present = cloneDraft(presentRef.current);
			isRestoringHistoryRef.current = true;
			setComponentsDraft(next);
			setHistoryPast((past) => [...past, present]);
			queueMicrotask(() => {
				isRestoringHistoryRef.current = false;
			});
			return rest;
		});
	};

	return {
		state: {
			historyPast,
			historyFuture,
		},
		refs: {
			historyDebounceRef,
			pendingHistoryBaseRef,
			prevDraftRef,
			isRestoringHistoryRef,
		},
		actions: {
			setHistoryPast,
			setHistoryFuture,
			commitHistoryBase,
			undo,
			redo,
		},
	};
}
