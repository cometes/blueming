import { useCallback, useEffect, useRef, useState } from "react";
import {
	clamp,
	clampStickerToEditorBounds as clampStickerToEditorBoundsBase,
	cloneDraft,
	computeAutoSizePct as computeAutoSizePctBase,
	DEFAULT_TEXT_MAX_WIDTH_PX,
	DEFAULT_TEXT_PADDING,
	isTextSticker,
	normalizeStickerSize,
} from "@/features/stickerboard-editor/lib/stickerboard-utils";
import type {
	StickerBoardComponent,
	StickerBoardTextComponent,
} from "@/features/stickerboard-editor/model";
import { useStickerBoardAssets } from "@/features/stickerboard-editor/hooks/useStickerBoardAssets";
import { useStickerBoardHistory } from "@/features/stickerboard-editor/hooks/useStickerBoardHistory";
import { useStickerBoardState } from "@/features/stickerboard-editor/hooks/useStickerBoardState";
import { useStickerBoardManipulation } from "@/features/stickerboard-editor/hooks/useStickerBoardManipulation";
import { useStickerBoardKeyboard } from "@/features/stickerboard-editor/hooks/useStickerBoardKeyboard";

export function useStickerBoardEditor(initialComponents: StickerBoardComponent[]) {
	const [componentsDraft, setComponentsDraft] = useState<StickerBoardComponent[]>(
		[],
	);
	const [historyPast, setHistoryPast] = useState<StickerBoardComponent[][]>([]);
	const [historyFuture, setHistoryFuture] = useState<StickerBoardComponent[][]>([]);
	const presentRef = useRef<StickerBoardComponent[]>([]);
	const selectedIdRef = useRef<number | null>(null);
	const selectedIdsRef = useRef<Set<number>>(new Set());
	const historyDebounceRef = useRef<number | null>(null);
	const pendingHistoryBaseRef = useRef<StickerBoardComponent[] | null>(null);
	const prevDraftRef = useRef<StickerBoardComponent[] | null>(null);
	const interactionHistoryBaseRef = useRef<StickerBoardComponent[] | null>(null);
	const isRestoringHistoryRef = useRef(false);
	const boundsRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const moveableInteractionRef = useRef(false);
	const autosizeRafRef = useRef<number | null>(null);
	const autosizePendingRef = useRef<StickerBoardTextComponent | null>(null);
	const clipboardRef = useRef<StickerBoardComponent | null>(null);

	const {
		state: { assetTab, assets, assetsLoading, assetsError, authReady },
		actions: {
			setAssetTab,
			setAssets,
			setAssetsLoading,
			setAssetsError,
			refreshAssets,
			markAssetUsed,
		},
	} = useStickerBoardAssets();

	const {
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
	} = useStickerBoardState(componentsDraft);

	const setCanvasRef = useCallback(
		(el: HTMLDivElement | null) => {
			canvasRef.current = el;
			setCanvasElement(el);
		},
		[setCanvasElement],
	);

	const clampStickerToEditorBounds = useCallback(
		(
			sticker: Pick<
				StickerBoardComponent,
				"xPct" | "yPct" | "widthPct" | "heightPct"
			>,
		) =>
			clampStickerToEditorBoundsBase(sticker, {
				canvas: canvasRef.current,
				bounds: boundsRef.current,
			}),
		[],
	);

	const computeAutoSizePct = useCallback(
		(component: StickerBoardTextComponent) =>
			computeAutoSizePctBase(component, {
				canvas: canvasRef.current,
				paddingPx: DEFAULT_TEXT_PADDING,
				maxWidthPx: DEFAULT_TEXT_MAX_WIDTH_PX,
			}),
		[],
	);

	const commitHistoryBase = useCallback((base: StickerBoardComponent[] | null) => {
		if (!base) return;
		const maxHistory = 100;
		setHistoryPast((prev) => {
			const next = [...prev, base];
			return next.length > maxHistory
				? next.slice(next.length - maxHistory)
				: next;
		});
		setHistoryFuture([]);
	}, []);

	const isEditingFormField = useCallback((target: EventTarget | null) => {
		const element = target as HTMLElement | null;
		if (!element) return false;
		const tag = element.tagName?.toLowerCase();
		if (tag === "input" || tag === "textarea" || tag === "select") return true;
		if (element.isContentEditable) return true;
		return false;
	}, []);

	const requestAutoSize = useCallback(
		(nextComponent: StickerBoardTextComponent) => {
			autosizePendingRef.current = nextComponent;
			if (autosizeRafRef.current) return;
			autosizeRafRef.current = window.requestAnimationFrame(() => {
				autosizeRafRef.current = null;
				const pending = autosizePendingRef.current;
				autosizePendingRef.current = null;
				if (!pending || pending.autoSize === false) return;
				const size = computeAutoSizePct(pending);
				if (!size) return;
				setComponentsDraft((prev) =>
					prev.map((component) => {
						if (component.id !== pending.id) return component;
						if (!isTextSticker(component)) return component;
						const next = clampStickerToEditorBounds({
							xPct: component.xPct,
							yPct: component.yPct,
							widthPct: size.widthPct,
							heightPct: size.heightPct,
						});
						return { ...component, ...next };
					}),
				);
			});
		},
		[clampStickerToEditorBounds, computeAutoSizePct],
	);

	const {
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
	} = useStickerBoardManipulation({
		getNextZIndex,
		selectedComponent,
		selectedIdsRef,
		selectedIdRef,
		presentRef,
		isRestoringHistoryRef,
		canvasRef,
		boundsRef,
		setComponentsDraft,
		setSelectedId,
		setSelection,
		clampStickerToEditorBounds,
		computeAutoSizePct,
		commitHistoryBase,
		markAssetUsed,
	});

	useEffect(() => {
		const comps = initialComponents ?? [];
		isRestoringHistoryRef.current = true;
		setComponentsDraft(comps);
		setSelectedId(null);
		setHistoryPast([]);
		setHistoryFuture([]);
		prevDraftRef.current = cloneDraft(comps);
		pendingHistoryBaseRef.current = null;
		if (historyDebounceRef.current) {
			window.clearTimeout(historyDebounceRef.current);
			historyDebounceRef.current = null;
		}
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
	}, [initialComponents, setSelectedId]);

	useEffect(() => {
		selectedIdRef.current = selectedId;
	}, [selectedId]);

	useEffect(() => {
		selectedIdsRef.current = selectedIds;
	}, [selectedIds]);

	const { undo, redo } = useStickerBoardHistory({
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
	});

	useStickerBoardKeyboard({
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
	});

	return {
		state: {
			componentsDraft,
			selectedId,
			selectedIds,
			isImageDialogOpen,
			isTextInsertMode,
			uploadThumbnail,
			editingGroupId,
			expandedGroupIds,
			imageReplaceTargetId,
			historyPast,
			historyFuture,
			assetTab,
			assets,
			assetsLoading,
			assetsError,
			authReady,
			isMoveableInteracting,
			canvasElement,
		},
		refs: {
			presentRef,
			selectedIdRef,
			selectedIdsRef,
			historyDebounceRef,
			pendingHistoryBaseRef,
			prevDraftRef,
			interactionHistoryBaseRef,
			moveableInteractionRef,
			isRestoringHistoryRef,
			boundsRef,
			canvasRef,
			setCanvasRef,
			autosizeRafRef,
			autosizePendingRef,
			clipboardRef,
		},
		actions: {
			setComponentsDraft,
			setSelectedId,
			setSelectedIds,
			setIsImageDialogOpen,
			setIsTextInsertMode,
			setUploadThumbnail,
			setEditingGroupId,
			setExpandedGroupIds,
			setImageReplaceTargetId,
			setHistoryPast,
			setHistoryFuture,
			setAssetTab,
			setAssets,
			setAssetsLoading,
			setAssetsError,
			setIsMoveableInteracting,
			updateComponent,
			deleteSticker,
			toggleVisibility,
			toggleLock,
			reorderLayersByIndex,
			addTextSticker,
			addTextStickerAt,
			addImageSticker,
			addImageStickerAt,
			refreshAssets,
			setSelection,
			getGroupMemberIds,
			toggleIds,
			enterGroupEdit,
			exitGroupEdit,
			alignSelectedSticker,
			undo,
			redo,
			groupSelection,
			ungroupSelection,
			requestAutoSize,
			deleteSelectedSticker,
			duplicateSelectedSticker,
			commitHistoryBase,
			cloneDraft,
			normalizeStickerSize,
			clamp,
			clampStickerToEditorBounds,
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
