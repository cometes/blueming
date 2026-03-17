"use client";

import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { cloneDraft, type PctSticker, isPctSticker } from "@/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/types/stickerBoard";

interface UseStickerBoardHistoryArgs {
	componentsDraft: StickerBoardComponent[];
	setComponentsDraft: Dispatch<SetStateAction<StickerBoardComponent[]>>;
	setHistoryPast: Dispatch<SetStateAction<StickerBoardComponent[][]>>;
	setHistoryFuture: Dispatch<SetStateAction<StickerBoardComponent[][]>>;
	presentRef: MutableRefObject<StickerBoardComponent[]>;
	prevDraftRef: MutableRefObject<StickerBoardComponent[] | null>;
	pendingHistoryBaseRef: MutableRefObject<StickerBoardComponent[] | null>;
	historyDebounceRef: MutableRefObject<number | null>;
	isRestoringHistoryRef: MutableRefObject<boolean>;
	moveableInteractionRef: MutableRefObject<boolean>;
	interactionHistoryBaseRef: MutableRefObject<StickerBoardComponent[] | null>;
	selectedIdsRef: MutableRefObject<Set<number>>;
	commitHistoryBase: (base: StickerBoardComponent[] | null) => void;
	clampStickerToEditorBounds: (
		sticker: Pick<PctSticker, "xPct" | "yPct" | "widthPct" | "heightPct">,
	) => {
		xPct: number;
		yPct: number;
		widthPct: number;
		heightPct: number;
	};
	isEditingFormField: (target: EventTarget | null) => boolean;
}

export function useStickerBoardHistory({
	componentsDraft,
	setComponentsDraft,
	setHistoryPast,
	setHistoryFuture,
	presentRef,
	prevDraftRef,
	pendingHistoryBaseRef,
	historyDebounceRef,
	isRestoringHistoryRef,
	moveableInteractionRef,
	interactionHistoryBaseRef,
	selectedIdsRef,
	commitHistoryBase,
	clampStickerToEditorBounds,
	isEditingFormField,
}: UseStickerBoardHistoryArgs) {
	useEffect(() => {
		presentRef.current = componentsDraft;
	}, [componentsDraft, presentRef]);

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
	}, [
		commitHistoryBase,
		componentsDraft,
		historyDebounceRef,
		isRestoringHistoryRef,
		moveableInteractionRef,
		pendingHistoryBaseRef,
		presentRef,
		prevDraftRef,
	]);

	const undo = useCallback(() => {
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
	}, [isRestoringHistoryRef, presentRef, setComponentsDraft, setHistoryFuture, setHistoryPast]);

	const redo = useCallback(() => {
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
	}, [isRestoringHistoryRef, presentRef, setComponentsDraft, setHistoryFuture, setHistoryPast]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isEditingFormField(e.target)) return;
			const selection = selectedIdsRef.current;
			if (selection.size === 0) return;

			const key = e.key;
			if (
				key !== "ArrowLeft" &&
				key !== "ArrowRight" &&
				key !== "ArrowUp" &&
				key !== "ArrowDown"
			) {
				return;
			}

			e.preventDefault();

			if (!interactionHistoryBaseRef.current) {
				interactionHistoryBaseRef.current = cloneDraft(presentRef.current);
			}

			const step = e.shiftKey ? 2 : 0.5;
			const dx = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0;
			const dy = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0;

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
		};

		const onKeyUp = (e: KeyboardEvent) => {
			if (isEditingFormField(e.target)) return;
			const key = e.key;
			if (
				key !== "ArrowLeft" &&
				key !== "ArrowRight" &&
				key !== "ArrowUp" &&
				key !== "ArrowDown"
			) {
				return;
			}
			const base = interactionHistoryBaseRef.current;
			interactionHistoryBaseRef.current = null;
			if (base && JSON.stringify(base) !== JSON.stringify(presentRef.current)) {
				commitHistoryBase(base);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		window.addEventListener("keyup", onKeyUp);
		return () => {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
		};
	}, [
		clampStickerToEditorBounds,
		commitHistoryBase,
		interactionHistoryBaseRef,
		isEditingFormField,
		presentRef,
		selectedIdsRef,
		setComponentsDraft,
	]);

	return {
		undo,
		redo,
	};
}
