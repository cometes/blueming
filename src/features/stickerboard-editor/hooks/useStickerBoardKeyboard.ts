"use client";

import { useEffect } from "react";
import {
	cloneDraft,
	isGroupSticker,
	normalizeStickerSize,
	type PctSticker,
} from "@/features/stickerboard-editor/lib/stickerboard-utils";
import type { StickerBoardComponent } from "@/features/stickerboard-editor/model";

interface UseStickerBoardKeyboardArgs {
	selectedIdRef: React.MutableRefObject<number | null>;
	clipboardRef: React.MutableRefObject<StickerBoardComponent | null>;
	presentRef: React.MutableRefObject<StickerBoardComponent[]>;
	isRestoringHistoryRef: React.MutableRefObject<boolean>;
	setComponentsDraft: React.Dispatch<React.SetStateAction<StickerBoardComponent[]>>;
	setSelectedId: React.Dispatch<React.SetStateAction<number | null>>;
	commitHistoryBase: (base: StickerBoardComponent[] | null) => void;
	isEditingFormField: (target: EventTarget | null) => boolean;
	deleteSelectedSticker: () => void;
	duplicateSelectedSticker: () => void;
	moveSelectedZIndex: (direction: "forward" | "backward", toEdge: boolean) => void;
	groupSelection: () => void;
	ungroupSelection: () => void;
	enterGroupEdit: (groupId: number) => void;
	exitGroupEdit: () => void;
	editingGroupId: number | null;
	undo: () => void;
	redo: () => void;
}

export function useStickerBoardKeyboard({
	selectedIdRef,
	clipboardRef,
	presentRef,
	isRestoringHistoryRef,
	setComponentsDraft,
	setSelectedId,
	commitHistoryBase,
	isEditingFormField,
	deleteSelectedSticker,
	duplicateSelectedSticker,
	moveSelectedZIndex,
	groupSelection,
	ungroupSelection,
	enterGroupEdit,
	exitGroupEdit,
	editingGroupId,
	undo,
	redo,
}: UseStickerBoardKeyboardArgs) {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isEditingFormField(e.target)) return;
			const key = e.key.toLowerCase();
			const mod = e.metaKey || e.ctrlKey;

			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				deleteSelectedSticker();
				return;
			}
			if (e.key === "[" || e.key === "]") {
				e.preventDefault();
				if (e.key === "]") moveSelectedZIndex("forward", e.shiftKey);
				else moveSelectedZIndex("backward", e.shiftKey);
				return;
			}

			if (!mod) return;
			if (key === "g") {
				e.preventDefault();
				if (e.shiftKey) ungroupSelection();
				else groupSelection();
				return;
			}
			if (key === "enter") {
				const id = selectedIdRef.current;
				if (!id) return;
				const target = presentRef.current.find((component) => component.id === id);
				if (target && isGroupSticker(target)) {
					e.preventDefault();
					enterGroupEdit(id);
				}
				return;
			}
			if (key === "escape") {
				if (editingGroupId !== null) {
					e.preventDefault();
					exitGroupEdit();
				}
				return;
			}
			if (key === "z") {
				e.preventDefault();
				if (e.shiftKey) redo();
				else undo();
				return;
			}
			if (key === "y") {
				e.preventDefault();
				redo();
				return;
			}
			if (key === "c") {
				const id = selectedIdRef.current;
				if (!id) return;
				const target = presentRef.current.find((component) => component.id === id);
				if (!target) return;
				e.preventDefault();
				clipboardRef.current = cloneDraft([target])[0];
				return;
			}
			if (key === "v") {
				const clip = clipboardRef.current;
				if (!clip) return;
				e.preventDefault();
				const base = cloneDraft(presentRef.current);
				const newId = Date.now();
				const maxZ = presentRef.current.reduce(
					(acc, component) => Math.max(acc, component.zIndex ?? 0),
					0,
				);
				const pasted: StickerBoardComponent = {
					...(clip as StickerBoardComponent),
					id: newId,
					zIndex: maxZ + 1,
					...normalizeStickerSize({
						xPct: (clip as PctSticker).xPct + 2,
						yPct: (clip as PctSticker).yPct + 2,
						widthPct: (clip as PctSticker).widthPct,
						heightPct: (clip as PctSticker).heightPct,
					}),
				};
				isRestoringHistoryRef.current = true;
				setComponentsDraft((prev) => [...prev, pasted]);
				setSelectedId(newId);
				queueMicrotask(() => {
					isRestoringHistoryRef.current = false;
				});
				commitHistoryBase(base);
				return;
			}
			if (key === "d") {
				e.preventDefault();
				duplicateSelectedSticker();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		clipboardRef,
		commitHistoryBase,
		deleteSelectedSticker,
		duplicateSelectedSticker,
		editingGroupId,
		enterGroupEdit,
		exitGroupEdit,
		groupSelection,
		isEditingFormField,
		isRestoringHistoryRef,
		moveSelectedZIndex,
		presentRef,
		redo,
		selectedIdRef,
		setComponentsDraft,
		setSelectedId,
		undo,
		ungroupSelection,
	]);
}
