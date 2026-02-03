import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	clamp,
	clampStickerToEditorBounds as clampStickerToEditorBoundsBase,
	cloneDraft,
	computeAutoSizePct as computeAutoSizePctBase,
	DEFAULT_TEXT_MAX_WIDTH_PX,
	DEFAULT_TEXT_PADDING,
	isGroupSticker,
	isImageSticker,
	isPctSticker,
	isTextSticker,
	normalizeStickerSize,
	type PctSticker,
} from "@/lib/stickerboard-utils";
import { useAuthStore } from "@/store/auth/store";
import {
	listStickerAssets,
	markStickerAssetUsed,
} from "@/queries/stickerAssets";
import type {
	StickerBoardComponent,
	StickerBoardGroupComponent,
	StickerBoardLeafComponent,
	StickerBoardTextComponent,
	StickerAsset,
	StickerAssetTab,
} from "@/types/stickerBoard";


export function useStickerBoardEditor(initialComponents: StickerBoardComponent[]) {
	const [componentsDraft, setComponentsDraft] = useState<
		StickerBoardComponent[]
	>([]);
	const presentRef = useRef<StickerBoardComponent[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	const [isTextInsertMode, setIsTextInsertMode] = useState(false);
	const [uploadThumbnail, setUploadThumbnail] = useState("");
	const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
	const [expandedGroupIds, setExpandedGroupIds] = useState<Set<number>>(
		() => new Set()
	);
	const [imageReplaceTargetId, setImageReplaceTargetId] = useState<
		number | null
	>(null);
	const [historyPast, setHistoryPast] = useState<StickerBoardComponent[][]>([]);
	const [historyFuture, setHistoryFuture] = useState<StickerBoardComponent[][]>(
		[]
	);
	const [assetTab, setAssetTab] = useState<StickerAssetTab>("all");
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [assetsLoading, setAssetsLoading] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);
	const [authReady, setAuthReady] = useState(false);
	const [isMoveableInteracting, setIsMoveableInteracting] = useState(false);
	const clipboardRef = useRef<StickerBoardComponent | null>(null);
	const selectedIdRef = useRef<number | null>(null);
	const selectedIdsRef = useRef<Set<number>>(new Set());
	const historyDebounceRef = useRef<number | null>(null);
	const pendingHistoryBaseRef = useRef<StickerBoardComponent[] | null>(null);
	const prevDraftRef = useRef<StickerBoardComponent[] | null>(null);
	const interactionHistoryBaseRef = useRef<StickerBoardComponent[] | null>(
		null
	);
	const isRestoringHistoryRef = useRef(false);
	const boundsRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLDivElement>(null);
	const [canvasElement, setCanvasElement] = useState<HTMLElement | null>(null);
	const setCanvasRef = useCallback((el: HTMLDivElement | null) => {
		canvasRef.current = el;
		setCanvasElement(el);
	}, []);
	const moveableInteractionRef = useRef(false);

	const clampStickerToEditorBounds = useCallback(
		(
			sticker: Pick<
				StickerBoardComponent,
				"xPct" | "yPct" | "widthPct" | "heightPct"
			>
		) =>
			clampStickerToEditorBoundsBase(sticker, {
				canvas: canvasRef.current,
				bounds: boundsRef.current,
			}),
		[]
	);

	const computeAutoSizePct = (component: StickerBoardTextComponent) =>
		computeAutoSizePctBase(component, {
			canvas: canvasRef.current,
			paddingPx: DEFAULT_TEXT_PADDING,
			maxWidthPx: DEFAULT_TEXT_MAX_WIDTH_PX,
		});

	const visibleDraft = useMemo(
		() =>
			componentsDraft
				.filter((c) => c.isVisible !== false)
				.filter(isPctSticker)
				.slice()
				.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)),
		[componentsDraft]
	);

	const layerItems = useMemo(() => {
		// Figma-like: top-most first (higher zIndex first)
		return componentsDraft
			.slice()
			.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
	}, [componentsDraft]);

	const selectedComponent = useMemo(
		() => componentsDraft.find((c) => c.id === selectedId) ?? null,
		[componentsDraft, selectedId]
	);

	const editingGroup = useMemo(() => {
		if (editingGroupId === null) return null;
		const g = componentsDraft.find((c) => c.id === editingGroupId);
		return g && isGroupSticker(g) ? g : null;
	}, [componentsDraft, editingGroupId]);

	const enterGroupEdit = useCallback((groupId: number) => {
		setEditingGroupId(groupId);
		setExpandedGroupIds((prev) => new Set(prev).add(groupId));
	}, []);

	const exitGroupEdit = useCallback(() => {
		setEditingGroupId(null);
	}, []);

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
				toLocal(x1, y2),
				toLocal(x2, y2),
			];
			corners.forEach((p) => {
				minLx = Math.min(minLx, p.x);
				minLy = Math.min(minLy, p.y);
				maxLx = Math.max(maxLx, p.x);
				maxLy = Math.max(maxLy, p.y);
			});
		});
		const w = maxLx - minLx;
		const h = maxLy - minLy;
		const minX = centerX + (minLx * cos - minLy * sin);
		const minY = centerY + (minLx * sin + minLy * cos);
		const maxZ = Math.max(...items.map((it) => it.zIndex ?? 0));
		return {
			groupId: gid,
			rotationDeg,
			ids: new Set(items.map((it) => it.id)),
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
		[selectedComponent]
	);

	const commitHistoryBase = useCallback((base: StickerBoardComponent[] | null) => {
		if (!base) return;
		const MAX = 100;
		setHistoryPast((prev) => {
			const next = [...prev, base];
			return next.length > MAX ? next.slice(next.length - MAX) : next;
		});
		setHistoryFuture([]);
	}, []);

	type StickerAlignAction =
		| "left"
		| "hcenter"
		| "right"
		| "top"
		| "vcenter"
		| "bottom";

	const alignSelectedSticker = (action: StickerAlignAction) => {
		const selection = new Set(selectedIdsRef.current);
		if (selectedComponent) selection.add(selectedComponent.id);
		if (selection.size === 0) return;

		const selectedItemsAll = presentRef.current
			.filter((c) => selection.has(c.id))
			.filter(isPctSticker)
			.filter((c) => c.isVisible !== false);
		if (selectedItemsAll.length === 0) return;

		const selectedMovable = selectedItemsAll.filter((c) => c.isLocked !== true);
		if (selectedMovable.length === 0) return;

		const canvas = canvasRef.current;
		if (!canvas) return;

		const c = canvas.getBoundingClientRect();
		if (c.width <= 0 || c.height <= 0) return;

		const base = cloneDraft(presentRef.current);

		// If all selected belong to the same persistent groupId -> group bbox align (current behavior).
		const commonGroupId =
			selectedItemsAll.length >= 2 ? selectedItemsAll[0].groupId : undefined;
		const isSingleGroup =
			Boolean(commonGroupId) &&
			selectedItemsAll.length >= 2 &&
			selectedItemsAll.every((it) => it.groupId === commonGroupId);

		if (!isSingleGroup) {
			// Individual align: each sticker snaps its own center/edge to canvas guide line.
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
				})
			);
			commitHistoryBase(base);
			return;
		}

		// Group bbox align: move the selected group as a unit (relative positions preserved).
		const groupItems = selectedMovable;
		const minX = Math.min(...groupItems.map((it) => it.xPct));
		const minY = Math.min(...groupItems.map((it) => it.yPct));
		const maxX = Math.max(...groupItems.map((it) => it.xPct + it.widthPct));
		const maxY = Math.max(...groupItems.map((it) => it.yPct + it.heightPct));
		const groupW = maxX - minX;
		const groupH = maxY - minY;

		const desiredDelta = (() => {
			switch (action) {
				case "left":
					return { dx: 0 - minX, dy: 0 };
				case "hcenter":
					return { dx: 50 - (minX + groupW / 2), dy: 0 };
				case "right":
					return { dx: 100 - (minX + groupW), dy: 0 };
				case "top":
					return { dx: 0, dy: 0 - minY };
				case "vcenter":
					return { dx: 0, dy: 50 - (minY + groupH / 2) };
				case "bottom":
					return { dx: 0, dy: 100 - (minY + groupH) };
			}
		})();

		const boundsCanvas = canvasRef.current?.getBoundingClientRect();
		const boundsBox = boundsRef.current?.getBoundingClientRect();
		let dx = desiredDelta.dx;
		let dy = desiredDelta.dy;
		if (
			boundsCanvas &&
			boundsBox &&
			boundsCanvas.width > 0 &&
			boundsCanvas.height > 0
		) {
			const minXPct =
				((boundsBox.left - boundsCanvas.left) / boundsCanvas.width) * 100;
			const maxXPct =
				((boundsBox.right - boundsCanvas.left) / boundsCanvas.width) * 100;
			const minYPct =
				((boundsBox.top - boundsCanvas.top) / boundsCanvas.height) * 100;
			const maxYPct =
				((boundsBox.bottom - boundsCanvas.top) / boundsCanvas.height) * 100;

			let dxMin = -Infinity;
			let dxMax = Infinity;
			let dyMin = -Infinity;
			let dyMax = Infinity;

			groupItems.forEach((it) => {
				const maxXForIt = maxXPct - it.widthPct;
				const maxYForIt = maxYPct - it.heightPct;
				dxMin = Math.max(dxMin, minXPct - it.xPct);
				dxMax = Math.min(dxMax, maxXForIt - it.xPct);
				dyMin = Math.max(dyMin, minYPct - it.yPct);
				dyMax = Math.min(dyMax, maxYForIt - it.yPct);
			});

			dx = clamp(dx, dxMin, dxMax);
			dy = clamp(dy, dyMin, dyMax);
		}

		setComponentsDraft((prev) =>
			prev.map((c) => {
				if (!selection.has(c.id)) return c;
				if (!isPctSticker(c)) return c;
				if (c.isLocked === true) return c;
				const next = clampStickerToEditorBounds({
					xPct: c.xPct + dx,
					yPct: c.yPct + dy,
					widthPct: c.widthPct,
					heightPct: c.heightPct,
				});
				return { ...c, ...next };
			})
		);
		commitHistoryBase(base);
	};

	const isEditingFormField = useCallback((target: EventTarget | null) => {
		const el = target as HTMLElement | null;
		if (!el) return false;
		const tag = el.tagName?.toLowerCase();
		if (tag === "input" || tag === "textarea" || tag === "select") return true;
		if ((el as HTMLElement).isContentEditable) return true;
		return false;
	}, []);

	const { isAuthenticated, isLoading: authLoading } = useAuthStore();

	const refreshAssets = async (tab: StickerAssetTab = assetTab) => {
		setAssetsLoading(true);
		setAssetsError(null);
		try {
			if (!isAuthenticated) {
				if (!authReady) {
					setAssetsLoading(false);
					return;
				}
				throw new Error("로그인이 필요합니다.");
			}
			const list = await listStickerAssets(tab);
			setAssets(list.filter((a) => a.url));
		} catch (e) {
			const msg =
				e instanceof Error ? e.message : "에셋을 불러오지 못했습니다.";
			setAssets([]);
			setAssetsError(msg);
		} finally {
			setAssetsLoading(false);
		}
	};

	// auth store가 로딩 완료되면 authReady 설정
	useEffect(() => {
		if (!authLoading) {
			setAuthReady(true);
		}
	}, [authLoading]);

	const autosizeRafRef = useRef<number | null>(null);
	const autosizePendingRef = useRef<StickerBoardTextComponent | null>(null);

	const requestAutoSize = (nextComponent: StickerBoardTextComponent) => {
		autosizePendingRef.current = nextComponent;
		if (autosizeRafRef.current) return;
		autosizeRafRef.current = window.requestAnimationFrame(() => {
			autosizeRafRef.current = null;
			const pending = autosizePendingRef.current;
			autosizePendingRef.current = null;
			if (!pending) return;
			if (pending.autoSize === false) return;

			const size = computeAutoSizePct(pending);
			if (!size) return;
			setComponentsDraft((prev) =>
				prev.map((c) => {
					if (c.id !== pending.id) return c;
					if (!isTextSticker(c)) return c;
					const next = clampStickerToEditorBounds({
						xPct: c.xPct,
						yPct: c.yPct,
						widthPct: size.widthPct,
						heightPct: size.heightPct,
					});
					return { ...c, ...next };
				})
			);
		});
	};

	const updateComponent = (
		id: number,
		updater: (prev: StickerBoardComponent) => StickerBoardComponent
	) => {
		setComponentsDraft((prev) =>
			prev.map((c) => (c.id === id ? updater(c) : c))
		);
	};

	const toggleVisibility = (id: number) => {
		setComponentsDraft((prev) =>
			prev.map((c) =>
				c.id === id ? { ...c, isVisible: !(c.isVisible !== false) } : c
			)
		);
	};

	const toggleLock = (id: number) => {
		setComponentsDraft((prev) =>
			prev.map((c) => (c.id === id ? { ...c, isLocked: !c.isLocked } : c))
		);
	};

	const deleteSticker = (id: number) => {
		setComponentsDraft((prev) => prev.filter((c) => c.id !== id));
		setSelectedId((prev) => (prev === id ? null : prev));
	};

	const reorderLayersByIndex = (fromIndex: number, toIndex: number) => {
		setComponentsDraft((prev) => {
			const order = prev
				.slice()
				.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
				.map((c) => c.id);
			if (
				fromIndex < 0 ||
				toIndex < 0 ||
				fromIndex >= order.length ||
				toIndex >= order.length ||
				fromIndex === toIndex
			)
				return prev;

			const nextOrder = order.slice();
			const [moved] = nextOrder.splice(fromIndex, 1);
			nextOrder.splice(toIndex, 0, moved);

			const zMap = new Map<number, number>();
			// Layer list is "top-most first" => higher zIndex should appear earlier.
			nextOrder.forEach((id, idx) => {
				zMap.set(id, nextOrder.length - 1 - idx);
			});

			return prev.map((c) =>
				zMap.has(c.id) ? { ...c, zIndex: zMap.get(c.id)! } : c
			);
		});
	};

	const getNextZIndex = useMemo(() => {
		const maxZ = componentsDraft.reduce(
			(acc, c) => Math.max(acc, c.zIndex ?? 0),
			0
		);
		return maxZ + 1;
	}, [componentsDraft]);

	const addTextStickerAt = (opts?: {
		text?: string;
		xPct?: number;
		yPct?: number;
		centerXPct?: number;
		centerYPct?: number;
		historyBase?: StickerBoardComponent[] | null;
	}) => {
		const id = Date.now();
		const text = opts?.text?.trim() ? opts.text : "새 스티커";
		const fontSize = 14;
		const paddingPx = DEFAULT_TEXT_PADDING;
		const maxWidthPx = DEFAULT_TEXT_MAX_WIDTH_PX;

		const measured = computeAutoSizePct({
			id,
			zIndex: 0,
			xPct: 0,
			yPct: 0,
			widthPct: 0,
			heightPct: 0,
			type: "text",
			text,
			autoSize: true,
			maxWidthPx,
			paddingPx,
			style: {
				textColor: "#1f2937",
				fontSize,
				textAlign: "center",
			},
		});

		const widthPct = measured?.widthPct ?? 18;
		const heightPct = measured?.heightPct ?? 10;
		const hasExplicitPosition =
			typeof opts?.xPct === "number" && typeof opts?.yPct === "number";
		const centerX = opts?.centerXPct ?? 50;
		const centerY = opts?.centerYPct ?? 50;
		const base = clampStickerToEditorBounds({
			xPct: hasExplicitPosition ? opts!.xPct! : centerX - widthPct / 2,
			yPct: hasExplicitPosition ? opts!.yPct! : centerY - heightPct / 2,
			widthPct,
			heightPct,
		});
		const newSticker: StickerBoardComponent = {
			id,
			zIndex: getNextZIndex,
			xPct: base.xPct,
			yPct: base.yPct,
			widthPct: base.widthPct,
			heightPct: base.heightPct,
			type: "text",
			text,
			style: {
				textColor: "#1f2937",
				fontSize,
				textAlign: "center",
			},
			autoSize: true,
			maxWidthPx,
			paddingPx,
			isVisible: true,
			isLocked: false,
			rotation: 0,
			opacity: 100,
			flipX: false,
			flipY: false,
		};
		setComponentsDraft((prev) => [...prev, newSticker]);
		setSelectedId(id);
		if (opts?.historyBase) commitHistoryBase(opts.historyBase);
	};

	const addTextSticker = () => {
		addTextStickerAt();
	};

	const addImageSticker = async (url: string) => {
		await addImageStickerAt({ url, centerXPct: 50, centerYPct: 50 });
	};

	const addImageStickerAt = async (opts: {
		url: string;
		centerXPct?: number;
		centerYPct?: number;
		assetId?: string;
		assetName?: string;
		assetWidth?: number;
		assetHeight?: number;
		historyBase?: StickerBoardComponent[] | null;
	}) => {
		const id = Date.now();

		// Default size in percent; will be adjusted by image aspect ratio.
		let widthPct = 30;
		let heightPct = 30;

		const applyAspect = (w?: number, h?: number) => {
			if (!w || !h) return;
			if (w <= 0 || h <= 0) return;
			const canvas = canvasRef.current;
			const rect = canvas?.getBoundingClientRect();
			const canvasRatio =
				rect && rect.width > 0 && rect.height > 0
					? rect.width / rect.height
					: 1;
			const aspect = h / w; // h / w
			heightPct = widthPct * aspect * canvasRatio;

			// Keep within reasonable bounds (avoid huge stickers by default)
			const maxSizePct = 60;
			if (heightPct > maxSizePct) {
				const scale = maxSizePct / heightPct;
				heightPct *= scale;
				widthPct *= scale;
			}
			if (widthPct > maxSizePct) {
				const scale = maxSizePct / widthPct;
				widthPct *= scale;
				heightPct *= scale;
			}
		};

		if (opts.assetWidth && opts.assetHeight) {
			applyAspect(opts.assetWidth, opts.assetHeight);
		} else {
			// Try to load image to match the sticker box to the real image aspect ratio.
			try {
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.src = opts.url;
				try {
					await img.decode();
				} catch {
					await new Promise<void>((resolve, reject) => {
						img.onload = () => resolve();
						img.onerror = () => reject(new Error("failed to load image"));
					});
				}
				applyAspect(img.naturalWidth, img.naturalHeight);
			} catch {
				// Fallback to square sticker if we can't read image dimensions.
			}
		}

		const centerX = opts.centerXPct ?? 50;
		const centerY = opts.centerYPct ?? 50;
		const pos = clampStickerToEditorBounds({
			xPct: centerX - widthPct / 2,
			yPct: centerY - heightPct / 2,
			widthPct,
			heightPct,
		});

		const newSticker: StickerBoardComponent = {
			id,
			zIndex: getNextZIndex,
			xPct: pos.xPct,
			yPct: pos.yPct,
			widthPct: pos.widthPct,
			heightPct: pos.heightPct,
			type: "image",
			imageUrl: opts.url,
			name: opts.assetName,
			imageFit: "contain",
			isVisible: true,
			isLocked: false,
			rotation: 0,
			opacity: 100,
			flipX: false,
			flipY: false,
			lockAspectRatio: true,
		};

		setComponentsDraft((prev) => [...prev, newSticker]);
		setSelectedId(id);

		if (opts.historyBase) commitHistoryBase(opts.historyBase);

		if (opts.assetId) {
			setAssets((prev) =>
				prev.map((a) =>
					a.id === opts.assetId ? { ...a, lastUsedAtMs: Date.now() } : a
				)
			);
			void markStickerAssetUsed(opts.assetId).then(() => {
				if (assetTab === "recent") void refreshAssets("recent");
			});
		}
	};

	// Load assets for asset panel
	useEffect(() => {
		if (!authReady || !isAuthenticated) return;
		void refreshAssets(assetTab);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [assetTab, authReady, isAuthenticated]);

	// Load percent-based stickers from the single `components` field
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
		// allow next updates to be tracked
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
	}, [initialComponents]);

	// Keep a ref to the latest draft (used by undo/redo)
	useEffect(() => {
		presentRef.current = componentsDraft;
	}, [componentsDraft, commitHistoryBase]);

	// Keep a ref to the latest selection (used by keyboard shortcuts)
	useEffect(() => {
		selectedIdRef.current = selectedId;
	}, [selectedId, editingGroupId]);

	useEffect(() => {
		selectedIdsRef.current = selectedIds;
	}, [selectedIds]);

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
		[]
	);

	const getGroupMemberIds = (id: number) => {
		const target = presentRef.current.find((c) => c.id === id);
		const gid = target?.groupId;
		if (!gid) return [id];
		return presentRef.current.filter((c) => c.groupId === gid).map((c) => c.id);
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
	}, [commitHistoryBase]);

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
			0
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
	}, [commitHistoryBase]);

	const groupSelection = useCallback(() => {
		const ids = Array.from(selectedIdsRef.current);
		if (ids.length < 2) return;

		// Only allow grouping top-level leaf stickers (no nested groups, no grouping groups)
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
				// group-local z ordering
				return local;
			}),
		};

		// Build next top-level list: remove selected leaf items, insert group, reindex z
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
	}, [commitHistoryBase, setSelection]);

	const ungroupSelection = useCallback(() => {
		// Only ungroup when a single group is selected (top-level)
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

		const childrenWorld: StickerBoardLeafComponent[] = (
			group.children ?? []
		).map((child) => {
			const w = (child.widthPct / 100) * group.widthPct;
			const h = (child.heightPct / 100) * group.heightPct;
			const localCenterX =
				group.xPct + ((child.xPct + child.widthPct / 2) / 100) * group.widthPct;
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
			sortedChildren[0]?.id ?? null
		);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [commitHistoryBase, setSelection]);

	const moveSelectedZIndex = useCallback((
		direction: "forward" | "backward",
		toEdge: boolean
	) => {
		const id = selectedIdRef.current;
		if (!id) return;
		const target = presentRef.current.find((c) => c.id === id);
		if (!target) return;
		if (target.isLocked === true) return;

		const base = cloneDraft(presentRef.current);

		const asc = presentRef.current
			.slice()
			.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
			.map((c) => c.id);
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
			prev.map((c) => (zMap.has(c.id) ? { ...c, zIndex: zMap.get(c.id)! } : c))
		);
		queueMicrotask(() => {
			isRestoringHistoryRef.current = false;
		});
		commitHistoryBase(base);
	}, [commitHistoryBase]);

	// If selection disappears after undo/redo/delete, clear it
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

	// Debounced history tracking for non-drag/non-transform changes
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

		// First change in a debounce window captures the "base" state.
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

			// Only commit if something actually changed.
			if (JSON.stringify(base) !== JSON.stringify(presentRef.current)) {
				commitHistoryBase(base);
			}
		}, 250);

		prevDraftRef.current = cloneDraft(componentsDraft);
	}, [componentsDraft, commitHistoryBase]);

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
	}, []);

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
	}, []);

	// Keyboard shortcuts for undo/redo
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isEditingFormField(e.target)) return;
			const key = e.key.toLowerCase();
			const mod = e.metaKey || e.ctrlKey;

			// Global (non-mod) shortcuts
			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				deleteSelectedSticker();
				return;
			}
			if (e.key === "[" || e.key === "]") {
				e.preventDefault();
				// Shift + [ / ] => send to back / bring to front
				if (e.key === "]") moveSelectedZIndex("forward", e.shiftKey);
				else moveSelectedZIndex("backward", e.shiftKey);
				return;
			}

			if (!mod) return;

			// Group / Ungroup
			if (key === "g") {
				e.preventDefault();
				if (e.shiftKey) ungroupSelection();
				else groupSelection();
				return;
			}

			// Enter / Exit group edit mode
			if (key === "enter") {
				const id = selectedIdRef.current;
				if (!id) return;
				const target = presentRef.current.find((c) => c.id === id);
				if (target && isGroupSticker(target)) {
					e.preventDefault();
					enterGroupEdit(id);
					return;
				}
			}
			if (key === "escape") {
				if (editingGroupId !== null) {
					e.preventDefault();
					exitGroupEdit();
					return;
				}
			}

			// Undo / Redo
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

			// Copy / Paste (sticker-level)
			if (key === "c") {
				const id = selectedIdRef.current;
				if (!id) return;
				const target = presentRef.current.find((c) => c.id === id);
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
					(acc, c) => Math.max(acc, c.zIndex ?? 0),
					0
				);
				const offset = 2;
				const pasted: StickerBoardComponent = {
					...(clip as StickerBoardComponent),
					id: newId,
					zIndex: maxZ + 1,
					...normalizeStickerSize({
						xPct: (clip as PctSticker).xPct + offset,
						yPct: (clip as PctSticker).yPct + offset,
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

			// Duplicate
			if (key === "d") {
				e.preventDefault();
				duplicateSelectedSticker();
				return;
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [
		deleteSelectedSticker,
		duplicateSelectedSticker,
		editingGroupId,
		enterGroupEdit,
		exitGroupEdit,
		groupSelection,
		isEditingFormField,
		moveSelectedZIndex,
		redo,
		undo,
		ungroupSelection,
		commitHistoryBase,
	]);

	// Keyboard nudge (Arrow keys) for selected sticker
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
			)
				return;

			e.preventDefault();

			// Start of a continuous nudge sequence: capture base state once
			if (!interactionHistoryBaseRef.current) {
				interactionHistoryBaseRef.current = cloneDraft(presentRef.current);
			}

			const step = e.shiftKey ? 2 : 0.5;
			const dx = key === "ArrowLeft" ? -step : key === "ArrowRight" ? step : 0;
			const dy = key === "ArrowUp" ? -step : key === "ArrowDown" ? step : 0;

			setComponentsDraft((prev) =>
				prev.map((c) => {
					if (!selection.has(c.id)) return c;
					if (!isPctSticker(c)) return c;
					if (c.isLocked === true) return c;
					const next = clampStickerToEditorBounds({
						xPct: c.xPct + dx,
						yPct: c.yPct + dy,
						widthPct: c.widthPct,
						heightPct: c.heightPct,
					});
					return { ...c, ...next };
				})
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
			)
				return;

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
		selectedId,
		clampStickerToEditorBounds,
		commitHistoryBase,
		isEditingFormField,
	]);

	// Drag/resize/rotate interactions are handled by react-moveable in the canvas.

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
