"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { fitToGrid12 } from "@/lib/stickerboard";
import { setSettingsMainStickerBoard } from "@/queries/set/setSettingsMainStickerBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import {
	Eye,
	EyeOff,
	Lock,
	Unlock,
	Layers,
	Trash2,
	ImagePlus,
	Plus,
	GripVertical,
	Undo2,
	Redo2,
	AlignStartVertical,
	AlignCenterVertical,
	AlignEndVertical,
	AlignStartHorizontal,
	AlignCenterHorizontal,
	AlignEndHorizontal,
	Star,
	Upload,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import type {
	StickerBoardComponent,
	StickerBoardImageComponent,
	StickerBoardGroupComponent,
	StickerBoardLeafComponent,
	StickerBoardTextComponent,
	StickerBoardSettings,
	StickerAsset,
	StickerAssetTab,
} from "@/types/stickerBoard";
import { STICKER_ASSET_DND_MIME } from "@/types/stickerBoard";
import {
	createStickerAssetFromFile,
	deleteStickerAsset,
	listStickerAssets,
	markStickerAssetUsed,
	setStickerAssetFavorite,
} from "@/queries/stickerAssets";

const LAYOUT_ITEM_ID = "스티커보드";
const GRID_BASE = 12;

const isTextSticker = (
	component: StickerBoardComponent
): component is StickerBoardTextComponent =>
	(component as StickerBoardTextComponent).type === "text";

const isImageSticker = (
	component: StickerBoardComponent
): component is StickerBoardImageComponent =>
	(component as StickerBoardImageComponent).type === "image";

const isGroupSticker = (
	component: StickerBoardComponent
): component is StickerBoardGroupComponent =>
	(component as StickerBoardGroupComponent).type === "group";

type PctSticker = Extract<StickerBoardComponent, { xPct: number }>;

const isPctSticker = (
	component: StickerBoardComponent
): component is PctSticker =>
	typeof (component as { xPct?: unknown }).xPct === "number";

export default function StickerBoardEditPage() {
	const { main, refreshSettings } = useSettings();
	const [ratio, setRatio] = useState<{ w: number; h: number } | null>(null);
	const stickerBoard = main?.stickerBoard;
	const [componentsDraft, setComponentsDraft] = useState<
		StickerBoardComponent[]
	>([]);
	const presentRef = useRef<StickerBoardComponent[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
	const [isSaving, setIsSaving] = useState(false);
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	const [groupRotatePreviewDeg, setGroupRotatePreviewDeg] = useState(0);
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
	const dragRef = useRef<{
		id: number;
		startClientX: number;
		startClientY: number;
		startXPct: number;
		startYPct: number;
		widthPct: number;
		heightPct: number;
	} | null>(null);
	const groupDragRef = useRef<{
		startClientX: number;
		startClientY: number;
		items: Array<{
			id: number;
			startXPct: number;
			startYPct: number;
			widthPct: number;
			heightPct: number;
		}>;
	} | null>(null);
	const groupTransformRef = useRef<
		| {
				kind: "resize";
				groupId: string;
				groupRotationDeg: number;
				startCenterXPct: number;
				startCenterYPct: number;
				anchorLocalX: number;
				anchorLocalY: number;
				startMinLocalX: number;
				startMinLocalY: number;
				startMaxLocalX: number;
				startMaxLocalY: number;
				handle: "nw" | "ne" | "sw" | "se";
				startClientX: number;
				startClientY: number;
				items: Array<{
					id: number;
					startCenterLocalX: number;
					startCenterLocalY: number;
					startWidthPct: number;
					startHeightPct: number;
				}>;
		  }
		| {
				kind: "rotate";
				groupId: string;
				startGroupRotationDeg: number;
				startMinX: number;
				startMinY: number;
				startW: number;
				startH: number;
				centerXPct: number;
				centerYPct: number;
				centerClientX: number;
				centerClientY: number;
				startAngleDeg: number;
				items: Array<{
					id: number;
					startCenterXPct: number;
					startCenterYPct: number;
					startWidthPct: number;
					startHeightPct: number;
					startRotationDeg: number;
				}>;
		  }
		| null
	>(null);
	const transformRef = useRef<
		| {
				kind: "resize";
				id: number;
				handle: "nw" | "ne" | "sw" | "se";
				startClientX: number;
				startClientY: number;
				startXPct: number;
				startYPct: number;
				startWidthPct: number;
				startHeightPct: number;
				lockAspectRatio: boolean;
		  }
		| {
				kind: "rotate";
				id: number;
				centerClientX: number;
				centerClientY: number;
				startAngleDeg: number;
				startRotationDeg: number;
		  }
		| null
	>(null);
	const marqueeRef = useRef<{
		startClientX: number;
		startClientY: number;
		startXPct: number;
		startYPct: number;
	} | null>(null);
	const [marquee, setMarquee] = useState<{
		xPct: number;
		yPct: number;
		widthPct: number;
		heightPct: number;
	} | null>(null);

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

	const cloneDraft = (draft: StickerBoardComponent[]) => {
		// safe enough for plain JSON-ish objects
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const g: any = globalThis as any;
		if (typeof g.structuredClone === "function")
			return g.structuredClone(draft);
		return JSON.parse(JSON.stringify(draft)) as StickerBoardComponent[];
	};

	const commitHistoryBase = (base: StickerBoardComponent[] | null) => {
		if (!base) return;
		const MAX = 100;
		setHistoryPast((prev) => {
			const next = [...prev, base];
			return next.length > MAX ? next.slice(next.length - MAX) : next;
		});
		setHistoryFuture([]);
	};

	// NOTE: 캔버스 밖으로 자유롭게 나갈 수 있도록 x/y는 clamp 하지 않습니다.
	// size만 최소값을 보장하고 NaN/Infinity를 방지합니다.
	const normalizeStickerSize = (
		sticker: Pick<
			StickerBoardComponent,
			"xPct" | "yPct" | "widthPct" | "heightPct"
		>
	) => {
		const MIN = 2;
		const widthPct = Math.max(
			MIN,
			Number.isFinite(sticker.widthPct) ? sticker.widthPct : MIN
		);
		const heightPct = Math.max(
			MIN,
			Number.isFinite(sticker.heightPct) ? sticker.heightPct : MIN
		);
		return {
			xPct: Number.isFinite(sticker.xPct) ? sticker.xPct : 0,
			yPct: Number.isFinite(sticker.yPct) ? sticker.yPct : 0,
			widthPct,
			heightPct,
		};
	};

	const clamp = (value: number, min: number, max: number) =>
		Math.max(min, Math.min(max, value));

	/**
	 * Inner canvas 밖으로는 나갈 수 있지만, 바깥 bounds(1029 컨테이너) 밖으로는 못 나가게 제한
	 * x/y는 canvasRef 기준 %로 저장되어 있으므로, boundsRect를 canvasRect로 환산해서 clamp합니다.
	 */
	const clampStickerToEditorBounds = (
		sticker: Pick<
			StickerBoardComponent,
			"xPct" | "yPct" | "widthPct" | "heightPct"
		>
	) => {
		const next = normalizeStickerSize(sticker);
		const canvas = canvasRef.current;
		const bounds = boundsRef.current;
		if (!canvas || !bounds) return next;

		const c = canvas.getBoundingClientRect();
		const b = bounds.getBoundingClientRect();
		if (c.width <= 0 || c.height <= 0) return next;

		const minXPct = ((b.left - c.left) / c.width) * 100;
		const maxXPct = ((b.right - c.left) / c.width) * 100 - next.widthPct;
		const minYPct = ((b.top - c.top) / c.height) * 100;
		const maxYPct = ((b.bottom - c.top) / c.height) * 100 - next.heightPct;

		const safeMinX = Math.min(minXPct, maxXPct);
		const safeMaxX = Math.max(minXPct, maxXPct);
		const safeMinY = Math.min(minYPct, maxYPct);
		const safeMaxY = Math.max(minYPct, maxYPct);

		return {
			...next,
			xPct: clamp(next.xPct, safeMinX, safeMaxX),
			yPct: clamp(next.yPct, safeMinY, safeMaxY),
		};
	};

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

	const isEditingFormField = (target: EventTarget | null) => {
		const el = target as HTMLElement | null;
		if (!el) return false;
		const tag = el.tagName?.toLowerCase();
		if (tag === "input" || tag === "textarea" || tag === "select") return true;
		if ((el as HTMLElement).isContentEditable) return true;
		return false;
	};

	const DEFAULT_TEXT_PADDING = { x: 4, y: 4 };
	const DEFAULT_TEXT_MAX_WIDTH_PX = 280;

	const refreshAssets = async (tab: StickerAssetTab = assetTab) => {
		setAssetsLoading(true);
		setAssetsError(null);
		try {
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

	const measureTextStickerPx = (opts: {
		text: string;
		fontSizePx: number;
		fontFamily?: string;
		fontWeight?: StickerBoardTextComponent["style"] extends {
			fontWeight?: infer W;
		}
			? W
			: unknown;
		lineHeight?: number;
		paddingPx: { x: number; y: number };
		maxWidthPx: number;
	}) => {
		const el = document.createElement("div");
		el.style.position = "fixed";
		el.style.left = "-9999px";
		el.style.top = "-9999px";
		el.style.visibility = "hidden";
		el.style.whiteSpace = "pre-wrap";
		el.style.wordBreak = "break-word";
		el.style.fontSize = `${opts.fontSizePx}px`;
		el.style.lineHeight = opts.lineHeight ? String(opts.lineHeight) : "1.2";
		if (opts.fontFamily) el.style.fontFamily = opts.fontFamily;
		if (opts.fontWeight) el.style.fontWeight = String(opts.fontWeight);
		el.style.padding = `${opts.paddingPx.y}px ${opts.paddingPx.x}px`;
		el.style.maxWidth = `${Math.max(40, opts.maxWidthPx)}px`;
		el.textContent = opts.text || " ";
		document.body.appendChild(el);
		const wPx = el.offsetWidth;
		const hPx = el.offsetHeight;
		document.body.removeChild(el);
		return { wPx, hPx };
	};

	const computeAutoSizePct = (component: StickerBoardTextComponent) => {
		const canvas = canvasRef.current;
		if (!canvas) return null;
		const rect = canvas.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return null;

		const paddingPx = component.paddingPx ?? DEFAULT_TEXT_PADDING;
		const maxWidthPx = component.maxWidthPx ?? DEFAULT_TEXT_MAX_WIDTH_PX;
		const fontSizePx = component.style?.fontSize ?? 14;
		const { wPx, hPx } = measureTextStickerPx({
			text: component.text ?? "",
			fontSizePx,
			fontFamily: component.style?.fontFamily,
			fontWeight: component.style?.fontWeight,
			paddingPx,
			maxWidthPx,
		});

		return {
			widthPct: (wPx / rect.width) * 100,
			heightPct: (hPx / rect.height) * 100,
		};
	};

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

	const addTextSticker = () => {
		const id = Date.now();
		const text = "새 스티커";
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
		const base = clampStickerToEditorBounds({
			xPct: 50 - widthPct / 2,
			yPct: 50 - heightPct / 2,
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
	};

	const addImageSticker = async (url: string) => {
		await addImageStickerAt({ url, centerXPct: 50, centerYPct: 50 });
	};

	const addImageStickerAt = async (opts: {
		url: string;
		centerXPct?: number;
		centerYPct?: number;
		assetId?: string;
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
			const aspect = h / w; // h / w
			heightPct = widthPct * aspect;

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

	useEffect(() => {
		const customLayout = main?.customLayout?.layout as
			| Array<{ i: string; w: number; h: number }>
			| undefined;
		const stickerWidget = customLayout?.find((el) => el.i === LAYOUT_ITEM_ID);
		if (!stickerWidget) {
			setRatio(null);
			return;
		}

		setRatio(fitToGrid12(stickerWidget.w, stickerWidget.h));
	}, [main?.customLayout?.layout]);

	// Load assets for asset panel
	useEffect(() => {
		void refreshAssets(assetTab);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [assetTab]);

	// Load percent-based stickers from the single `components` field
	useEffect(() => {
		const comps = stickerBoard?.components ?? [];
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
	}, [stickerBoard?.components]);

	// Keep a ref to the latest draft (used by undo/redo)
	useEffect(() => {
		presentRef.current = componentsDraft;
	}, [componentsDraft]);

	// Keep a ref to the latest selection (used by keyboard shortcuts)
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

	const deleteSelectedSticker = () => {
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
	};

	const duplicateSelectedSticker = () => {
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
	};

	const groupSelection = () => {
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
	};

	const ungroupSelection = () => {
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
	};

	const moveSelectedZIndex = (
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
	};

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
		if (dragRef.current || transformRef.current) {
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
	}, [componentsDraft]);

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
	}, []);

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
	}, [selectedId]);

	// Drag handlers (percent-based)
	useEffect(() => {
		const handleMove = (e: PointerEvent) => {
			const marqueeState = marqueeRef.current;
			if (marqueeState) {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const rect = canvas.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) return;
				const currXPct = ((e.clientX - rect.left) / rect.width) * 100;
				const currYPct = ((e.clientY - rect.top) / rect.height) * 100;
				const x1 = marqueeState.startXPct;
				const y1 = marqueeState.startYPct;
				const x2 = currXPct;
				const y2 = currYPct;
				const left = Math.min(x1, x2);
				const top = Math.min(y1, y2);
				const width = Math.abs(x2 - x1);
				const height = Math.abs(y2 - y1);
				setMarquee({
					xPct: left,
					yPct: top,
					widthPct: width,
					heightPct: height,
				});
				return;
			}

			const groupDrag = groupDragRef.current;
			if (groupDrag) {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const rect = canvas.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) return;

				const dxPct = ((e.clientX - groupDrag.startClientX) / rect.width) * 100;
				const dyPct =
					((e.clientY - groupDrag.startClientY) / rect.height) * 100;

				setComponentsDraft((prev) =>
					prev.map((c) => {
						const item = groupDrag.items.find((it) => it.id === c.id);
						if (!item) return c;
						const next = clampStickerToEditorBounds({
							xPct: item.startXPct + dxPct,
							yPct: item.startYPct + dyPct,
							widthPct: item.widthPct,
							heightPct: item.heightPct,
						});
						return { ...c, ...next };
					})
				);
				return;
			}

			const groupTransform = groupTransformRef.current;
			if (groupTransform) {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const rect = canvas.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) return;

				if (groupTransform.kind === "resize") {
					const dxWorld =
						((e.clientX - groupTransform.startClientX) / rect.width) * 100;
					const dyWorld =
						((e.clientY - groupTransform.startClientY) / rect.height) * 100;
					const rad = (groupTransform.groupRotationDeg * Math.PI) / 180;
					const cos = Math.cos(rad);
					const sin = Math.sin(rad);
					// world -> local (rotate -theta)
					const dxLocal = dxWorld * cos + dyWorld * sin;
					const dyLocal = -dxWorld * sin + dyWorld * cos;

					let minLx = groupTransform.startMinLocalX;
					let minLy = groupTransform.startMinLocalY;
					let maxLx = groupTransform.startMaxLocalX;
					let maxLy = groupTransform.startMaxLocalY;

					switch (groupTransform.handle) {
						case "nw":
							minLx = groupTransform.startMinLocalX + dxLocal;
							minLy = groupTransform.startMinLocalY + dyLocal;
							break;
						case "ne":
							maxLx = groupTransform.startMaxLocalX + dxLocal;
							minLy = groupTransform.startMinLocalY + dyLocal;
							break;
						case "sw":
							minLx = groupTransform.startMinLocalX + dxLocal;
							maxLy = groupTransform.startMaxLocalY + dyLocal;
							break;
						case "se":
							maxLx = groupTransform.startMaxLocalX + dxLocal;
							maxLy = groupTransform.startMaxLocalY + dyLocal;
							break;
					}

					const MIN_SIZE_PCT = 2;
					const startW =
						groupTransform.startMaxLocalX - groupTransform.startMinLocalX;
					const startH =
						groupTransform.startMaxLocalY - groupTransform.startMinLocalY;
					const newW = Math.max(MIN_SIZE_PCT, maxLx - minLx);
					const newH = Math.max(MIN_SIZE_PCT, maxLy - minLy);

					// keep anchor corner fixed in local space
					const sx = newW / Math.max(0.0001, startW);
					const sy = newH / Math.max(0.0001, startH);

					const shiftCenterLocalX = groupTransform.anchorLocalX * (1 - sx);
					const shiftCenterLocalY = groupTransform.anchorLocalY * (1 - sy);
					const shiftCenterWorldX =
						shiftCenterLocalX * cos - shiftCenterLocalY * sin;
					const shiftCenterWorldY =
						shiftCenterLocalX * sin + shiftCenterLocalY * cos;
					const newCenterX = groupTransform.startCenterXPct + shiftCenterWorldX;
					const newCenterY = groupTransform.startCenterYPct + shiftCenterWorldY;

					setComponentsDraft((prev) =>
						prev.map((c) => {
							const it = groupTransform.items.find((x) => x.id === c.id);
							if (!it) return c;
							// scale sticker center in local space around anchor
							const newCenterLocalX =
								groupTransform.anchorLocalX +
								(it.startCenterLocalX - groupTransform.anchorLocalX) * sx;
							const newCenterLocalY =
								groupTransform.anchorLocalY +
								(it.startCenterLocalY - groupTransform.anchorLocalY) * sy;
							const newCenterWorldX =
								newCenterX + (newCenterLocalX * cos - newCenterLocalY * sin);
							const newCenterWorldY =
								newCenterY + (newCenterLocalX * sin + newCenterLocalY * cos);
							const widthPct = it.startWidthPct * sx;
							const heightPct = it.startHeightPct * sy;
							const next = clampStickerToEditorBounds({
								xPct: newCenterWorldX - widthPct / 2,
								yPct: newCenterWorldY - heightPct / 2,
								widthPct,
								heightPct,
							});
							return {
								...c,
								...next,
								groupCenterXPct: newCenterX,
								groupCenterYPct: newCenterY,
								groupRotationDeg: groupTransform.groupRotationDeg,
							};
						})
					);
					return;
				}

				if (groupTransform.kind === "rotate") {
					const angleDeg =
						(Math.atan2(
							e.clientY - groupTransform.centerClientY,
							e.clientX - groupTransform.centerClientX
						) *
							180) /
						Math.PI;
					const deltaDeg = angleDeg - groupTransform.startAngleDeg;
					setGroupRotatePreviewDeg(deltaDeg);
					const rad = (deltaDeg * Math.PI) / 180;
					const cos = Math.cos(rad);
					const sin = Math.sin(rad);

					setComponentsDraft((prev) =>
						prev.map((c) => {
							const it = groupTransform.items.find((x) => x.id === c.id);
							if (!it) return c;

							const dx = it.startCenterXPct - groupTransform.centerXPct;
							const dy = it.startCenterYPct - groupTransform.centerYPct;
							const rx = dx * cos - dy * sin;
							const ry = dx * sin + dy * cos;
							const nextCenterX = groupTransform.centerXPct + rx;
							const nextCenterY = groupTransform.centerYPct + ry;

							const next = clampStickerToEditorBounds({
								xPct: nextCenterX - it.startWidthPct / 2,
								yPct: nextCenterY - it.startHeightPct / 2,
								widthPct: it.startWidthPct,
								heightPct: it.startHeightPct,
							});
							return {
								...c,
								...next,
								rotation: it.startRotationDeg + deltaDeg,
								groupRotationDeg:
									groupTransform.startGroupRotationDeg + deltaDeg,
								groupCenterXPct: groupTransform.centerXPct,
								groupCenterYPct: groupTransform.centerYPct,
							};
						})
					);
					return;
				}
			}

			const transform = transformRef.current;
			if (transform) {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const rect = canvas.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) return;

				if (transform.kind === "resize") {
					const dxPct =
						((e.clientX - transform.startClientX) / rect.width) * 100;
					const dyPct =
						((e.clientY - transform.startClientY) / rect.height) * 100;

					let xPct = transform.startXPct;
					let yPct = transform.startYPct;
					let widthPct = transform.startWidthPct;
					let heightPct = transform.startHeightPct;

					switch (transform.handle) {
						case "nw":
							xPct = transform.startXPct + dxPct;
							yPct = transform.startYPct + dyPct;
							widthPct = transform.startWidthPct - dxPct;
							heightPct = transform.startHeightPct - dyPct;
							break;
						case "ne":
							yPct = transform.startYPct + dyPct;
							widthPct = transform.startWidthPct + dxPct;
							heightPct = transform.startHeightPct - dyPct;
							break;
						case "sw":
							xPct = transform.startXPct + dxPct;
							widthPct = transform.startWidthPct - dxPct;
							heightPct = transform.startHeightPct + dyPct;
							break;
						case "se":
							widthPct = transform.startWidthPct + dxPct;
							heightPct = transform.startHeightPct + dyPct;
							break;
					}

					const MIN_SIZE_PCT = 2;
					widthPct = Math.max(MIN_SIZE_PCT, widthPct);
					heightPct = Math.max(MIN_SIZE_PCT, heightPct);

					if (transform.lockAspectRatio) {
						const aspect =
							transform.startHeightPct /
							Math.max(0.0001, transform.startWidthPct);
						const byWidth = widthPct * aspect;
						// const byHeight = heightPct;

						// Use the dimension that changed more as the driver.
						const widthDelta = Math.abs(widthPct - transform.startWidthPct);
						const heightDelta = Math.abs(heightPct - transform.startHeightPct);

						if (widthDelta >= heightDelta) {
							heightPct = Math.max(MIN_SIZE_PCT, byWidth);
						} else {
							widthPct = Math.max(
								MIN_SIZE_PCT,
								heightPct / Math.max(0.0001, aspect)
							);
						}

						// Re-anchor based on handle after enforcing aspect ratio.
						if (transform.handle === "nw") {
							xPct = transform.startXPct + (transform.startWidthPct - widthPct);
							yPct =
								transform.startYPct + (transform.startHeightPct - heightPct);
						}
						if (transform.handle === "ne") {
							yPct =
								transform.startYPct + (transform.startHeightPct - heightPct);
						}
						if (transform.handle === "sw") {
							xPct = transform.startXPct + (transform.startWidthPct - widthPct);
						}
					}

					setComponentsDraft((prev) =>
						prev.map((c) =>
							c.id === transform.id
								? {
										...c,
										...clampStickerToEditorBounds({
											xPct,
											yPct,
											widthPct,
											heightPct,
										}),
								  }
								: c
						)
					);
					return;
				}

				if (transform.kind === "rotate") {
					const angleDeg =
						(Math.atan2(
							e.clientY - transform.centerClientY,
							e.clientX - transform.centerClientX
						) *
							180) /
						Math.PI;
					const delta = angleDeg - transform.startAngleDeg;
					const nextRotation = transform.startRotationDeg + delta;
					setComponentsDraft((prev) =>
						prev.map((c) =>
							c.id === transform.id ? { ...c, rotation: nextRotation } : c
						)
					);
					return;
				}
			}

			const drag = dragRef.current;
			if (!drag) return;
			const canvas = canvasRef.current;
			if (!canvas) return;
			const rect = canvas.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return;

			const dxPct = ((e.clientX - drag.startClientX) / rect.width) * 100;
			const dyPct = ((e.clientY - drag.startClientY) / rect.height) * 100;

			setComponentsDraft((prev) =>
				prev.map((c) => {
					if (c.id !== drag.id) return c;
					const next = clampStickerToEditorBounds({
						xPct: drag.startXPct + dxPct,
						yPct: drag.startYPct + dyPct,
						widthPct: drag.widthPct,
						heightPct: drag.heightPct,
					});
					return { ...c, ...next };
				})
			);
		};

		const handleUp = () => {
			if (marqueeRef.current) {
				const box = marquee;
				marqueeRef.current = null;
				setMarquee(null);
				if (!box) return;

				// finalize selection: any sticker intersecting the marquee box
				const next = new Set<number>(selectedIdsRef.current);
				const x1 = box.xPct;
				const y1 = box.yPct;
				const x2 = box.xPct + box.widthPct;
				const y2 = box.yPct + box.heightPct;

				const intersects = (c: PctSticker) => {
					const cx1 = c.xPct;
					const cy1 = c.yPct;
					const cx2 = c.xPct + c.widthPct;
					const cy2 = c.yPct + c.heightPct;
					return cx1 <= x2 && cx2 >= x1 && cy1 <= y2 && cy2 >= y1;
				};

				const hit = componentsDraft
					.filter(isPctSticker)
					.filter((c) => c.isVisible !== false)
					.filter(intersects)
					.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)); // top-most first

				hit.forEach((c) => next.add(c.id));
				const primary = hit.length
					? hit[0].id
					: next.size
					? Array.from(next)[0]
					: null;
				setSelection(next, primary);
				return;
			}

			if (transformRef.current) {
				transformRef.current = null;
				const base = interactionHistoryBaseRef.current;
				interactionHistoryBaseRef.current = null;
				if (
					base &&
					JSON.stringify(base) !== JSON.stringify(presentRef.current)
				) {
					commitHistoryBase(base);
				}
				return;
			}
			if (groupTransformRef.current) {
				groupTransformRef.current = null;
				setGroupRotatePreviewDeg(0);
				const base = interactionHistoryBaseRef.current;
				interactionHistoryBaseRef.current = null;
				if (
					base &&
					JSON.stringify(base) !== JSON.stringify(presentRef.current)
				) {
					commitHistoryBase(base);
				}
				return;
			}
			if (groupDragRef.current) {
				groupDragRef.current = null;
				const base = interactionHistoryBaseRef.current;
				interactionHistoryBaseRef.current = null;
				if (
					base &&
					JSON.stringify(base) !== JSON.stringify(presentRef.current)
				) {
					commitHistoryBase(base);
				}
				return;
			}
			if (!dragRef.current) return;
			dragRef.current = null;
			const base = interactionHistoryBaseRef.current;
			interactionHistoryBaseRef.current = null;
			if (base && JSON.stringify(base) !== JSON.stringify(presentRef.current)) {
				commitHistoryBase(base);
			}
		};

		window.addEventListener("pointermove", handleMove);
		window.addEventListener("pointerup", handleUp);
		return () => {
			window.removeEventListener("pointermove", handleMove);
			window.removeEventListener("pointerup", handleUp);
		};
	}, []);

	const stickerBoardToSave: StickerBoardSettings = useMemo(
		() => ({
			// NOTE: do not force default title/description into DB.
			// Save only what exists + components.
			...(stickerBoard || {}),
			components: componentsDraft,
		}),
		[componentsDraft, stickerBoard]
	);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// NOTE: percent-based `components` is the single source of truth.
			await setSettingsMainStickerBoard(stickerBoardToSave);
			await refreshSettings?.({ broadcast: true });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<main className="w-full min-h-[calc(100vh)] flex items-center justify-center mt-5">
			<ImageUploadDialog
				isOpen={isImageDialogOpen}
				onOpenChange={setIsImageDialogOpen}
				thumbnail={uploadThumbnail}
				setThumbnail={setUploadThumbnail}
				onUpload={(url) => {
					const targetId = imageReplaceTargetId;
					setImageReplaceTargetId(null);
					if (targetId) {
						updateComponent(targetId, (prev) => {
							if (!isImageSticker(prev)) return prev;
							return { ...prev, imageUrl: url };
						});
						return;
					}
					void addImageSticker(url);
				}}
			/>

			<div className="mx-auto w-full max-w-[1400px] px-6 py-10">
				<header className="mb-6 flex items-end justify-between gap-6">
					<div>
						<h1 className="text-2xl font-semibold">스티커보드 편집</h1>

						{editingGroup && (
							<div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700">
								<span className="font-medium">
									그룹 편집 중: {editingGroup.name ?? "그룹"}
								</span>
								<span className="text-blue-600/80">Esc로 종료</span>
							</div>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={undo}
							disabled={historyPast.length === 0}
							className="px-3"
							aria-label="Undo"
							title="Undo (⌘/Ctrl+Z)"
						>
							<Undo2 className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={redo}
							disabled={historyFuture.length === 0}
							className="px-3"
							aria-label="Redo"
							title="Redo (⌘/Ctrl+Shift+Z)"
						>
							<Redo2 className="h-4 w-4" />
						</Button>
						<Button onClick={handleSave} disabled={isSaving}>
							{isSaving ? "저장 중..." : "저장"}
						</Button>
					</div>
				</header>

				<section
					className="grid gap-4"
					style={{
						gridTemplateColumns: "1fr 768px 1fr",
					}}
				>
					<aside className="rounded-card border border-card bg-card-bg/60 p-4 backdrop-blur-card">
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2">
								<Layers className="h-4 w-4 text-gray-500" />
								<div className="text-sm font-semibold text-main-text">
									레이어
								</div>
							</div>
							<div className="text-[11px] text-gray-500 dark:text-gray-400">
								{layerItems.length}개
							</div>
						</div>
						<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
							레이어 목록/정렬/숨김/잠금 영역
						</p>

						<div className="mt-4 space-y-1">
							{layerItems.length > 0 ? (
								<DragDropContext
									onDragStart={() => {
										interactionHistoryBaseRef.current = cloneDraft(
											presentRef.current
										);
									}}
									onDragEnd={(result) => {
										const base = interactionHistoryBaseRef.current;
										interactionHistoryBaseRef.current = null;

										const destination = result.destination;
										if (!destination) return;
										if (destination.index === result.source.index) return;

										reorderLayersByIndex(
											result.source.index,
											destination.index
										);

										// Commit history as a single step
										if (base) commitHistoryBase(base);
									}}
								>
									<Droppable droppableId="stickerboard-layers">
										{(provided) => (
											<div
												ref={provided.innerRef}
												{...provided.droppableProps}
												className="space-y-1"
											>
												{layerItems.map((layer, index) => {
													const isSelected = selectedId === layer.id;
													const isVisible = layer.isVisible !== false;
													const isLocked = layer.isLocked === true;
													const isGroup = isGroupSticker(
														layer as StickerBoardGroupComponent
													);
													const label = isGroup
														? (layer as StickerBoardGroupComponent).name
															? String(
																	(layer as StickerBoardGroupComponent).name
															  )
															: `그룹 (${
																	(layer as StickerBoardGroupComponent).children
																		?.length ?? 0
															  })`
														: layer.type === "text"
														? layer.text?.trim()
															? layer.text.trim().slice(0, 20)
															: "텍스트 스티커"
														: "이미지 스티커";

													return (
														<Draggable
															key={layer.id}
															draggableId={String(layer.id)}
															index={index}
														>
															{(provided, snapshot) => (
																<div
																	ref={provided.innerRef}
																	{...provided.draggableProps}
																	className={[
																		"flex items-center gap-2 rounded-md border px-2 py-2",
																		snapshot.isDragging ? "opacity-80" : "",
																		isSelected
																			? "border-blue-300 bg-blue-50/60 dark:border-blue-500/40 dark:bg-blue-950/20"
																			: "border-card bg-background/30 hover:bg-background/50",
																	].join(" ")}
																	onClick={() => {
																		setSelection(new Set([layer.id]), layer.id);
																	}}
																	onDoubleClick={() => {
																		if (!isGroup) return;
																		enterGroupEdit(layer.id);
																	}}
																	role="button"
																	tabIndex={0}
																>
																	{/* drag handle */}
																	<div
																		className="flex h-7 w-7 items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing"
																		onClick={(e) => e.stopPropagation()}
																		{...provided.dragHandleProps}
																	>
																		<GripVertical className="h-4 w-4" />
																	</div>

																	<div className="min-w-0 flex-1">
																		<div className="flex items-center gap-2">
																			{isGroup && (
																				<button
																					type="button"
																					className="p-1 -ml-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-gray-500"
																					onClick={(e) => {
																						e.stopPropagation();
																						setExpandedGroupIds((prev) => {
																							const next = new Set(prev);
																							if (next.has(layer.id))
																								next.delete(layer.id);
																							else next.add(layer.id);
																							return next;
																						});
																					}}
																					aria-label="그룹 펼치기/접기"
																					title="그룹 펼치기/접기"
																				>
																					<span className="inline-block w-3 text-center">
																						{expandedGroupIds.has(layer.id)
																							? "▾"
																							: "▸"}
																					</span>
																				</button>
																			)}
																			<span className="text-xs font-medium text-main-text truncate">
																				{label}
																			</span>
																			{layer.groupId && (
																				<span className="shrink-0 rounded-full border border-gray-300/70 bg-background/50 px-1.5 py-0.5 text-[10px] leading-none text-gray-500 dark:border-gray-700 dark:text-gray-400">
																					G{String(layer.groupId).slice(-4)}
																				</span>
																			)}
																		</div>
																		{isGroup &&
																			expandedGroupIds.has(layer.id) && (
																				<div className="mt-1 space-y-1 pl-4">
																					{(
																						(
																							layer as StickerBoardGroupComponent
																						).children ?? []
																					)
																						.slice()
																						.sort(
																							(
																								a: StickerBoardComponent,
																								b: StickerBoardComponent
																							) =>
																								(b.zIndex ?? 0) -
																								(a.zIndex ?? 0)
																						)
																						.map(
																							(
																								child: StickerBoardComponent
																							) => {
																								const childLabel =
																									child.type === "text"
																										? child.text?.trim()
																											? child.text
																													.trim()
																													.slice(0, 18)
																											: "텍스트"
																										: child.type === "image"
																										? "이미지"
																										: "스티커";
																								const isChildSelected =
																									editingGroupId === layer.id &&
																									selectedId === child.id;
																								return (
																									<div
																										key={child.id}
																										className={[
																											"flex items-center gap-2 rounded border px-2 py-1",
																											isChildSelected
																												? "border-blue-300 bg-blue-50/60"
																												: "border-transparent bg-transparent hover:bg-black/5",
																										].join(" ")}
																										onClick={(e) => {
																											e.stopPropagation();
																											enterGroupEdit(layer.id);
																											setSelection(
																												new Set([child.id]),
																												child.id
																											);
																										}}
																										role="button"
																										tabIndex={0}
																									>
																										<span className="text-[11px] text-gray-500 truncate">
																											{childLabel}
																										</span>
																									</div>
																								);
																							}
																						)}
																				</div>
																			)}
																	</div>

																	<button
																		type="button"
																		className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
																		onClick={(e) => {
																			e.stopPropagation();
																			toggleVisibility(layer.id);
																		}}
																		aria-label={isVisible ? "숨기기" : "표시"}
																		title={isVisible ? "숨기기" : "표시"}
																	>
																		{isVisible ? (
																			<Eye className="h-4 w-4 text-gray-600 dark:text-gray-300" />
																		) : (
																			<EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
																		)}
																	</button>

																	<button
																		type="button"
																		className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
																		onClick={(e) => {
																			e.stopPropagation();
																			toggleLock(layer.id);
																		}}
																		aria-label={isLocked ? "잠금 해제" : "잠금"}
																		title={isLocked ? "잠금 해제" : "잠금"}
																	>
																		{isLocked ? (
																			<Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
																		) : (
																			<Unlock className="h-4 w-4 text-gray-600 dark:text-gray-300" />
																		)}
																	</button>

																	<button
																		type="button"
																		className={[
																			"p-1 rounded",
																			isLocked
																				? "opacity-40 cursor-not-allowed"
																				: "hover:bg-black/5 dark:hover:bg-white/5",
																		].join(" ")}
																		onClick={(e) => {
																			e.stopPropagation();
																			if (isLocked) return;
																			deleteSticker(layer.id);
																		}}
																		disabled={isLocked}
																		aria-label="삭제"
																		title={
																			isLocked
																				? "잠긴 스티커는 삭제할 수 없습니다"
																				: "삭제"
																		}
																	>
																		<Trash2 className="h-4 w-4 text-red-500" />
																	</button>
																</div>
															)}
														</Draggable>
													);
												})}
												{provided.placeholder}
											</div>
										)}
									</Droppable>
								</DragDropContext>
							) : (
								<div className="rounded-md border border-dashed border-gray-300/70 bg-background/40 p-3 text-xs text-gray-400">
									레이어가 없습니다.
								</div>
							)}
						</div>
					</aside>

					<div className="rounded-card border border-card bg-card-bg/60 p-4 backdrop-blur-card">
						<div className="text-sm font-semibold text-main-text">캔버스</div>
						<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
							고정 폭 768px 캔버스 영역
						</p>
						<div
							ref={boundsRef}
							className="mt-4 w-full overflow-hidden rounded-card border border-card bg-card-bg p-2"
						>
							<div
								className="relative grid grid-cols-12 grid-rows-12 aspect-[5/4] w-full overflow-visible"
								onPointerDown={(e) => {
									// Start marquee selection when clicking empty area (inside canvas bounds box)
									const canvas = canvasRef.current;
									if (!canvas) {
										setSelection(new Set(), null);
										return;
									}
									const rect = canvas.getBoundingClientRect();
									if (rect.width <= 0 || rect.height <= 0) {
										setSelection(new Set(), null);
										return;
									}

									// only start marquee if clicking on the background (not a sticker)
									if (
										(e.target as HTMLElement)?.closest?.(
											'[data-sticker-root="true"]'
										)
									)
										return;

									const xPct = ((e.clientX - rect.left) / rect.width) * 100;
									const yPct = ((e.clientY - rect.top) / rect.height) * 100;
									marqueeRef.current = {
										startClientX: e.clientX,
										startClientY: e.clientY,
										startXPct: xPct,
										startYPct: yPct,
									};
									setMarquee({ xPct, yPct, widthPct: 0, heightPct: 0 });

									// If shift is not pressed, start a fresh selection
									if (!e.shiftKey) {
										setSelection(new Set(), null);
									}
								}}
							>
								{/* 12x12 grid background */}
								<div
									className="absolute inset-0 pointer-events-none"
									style={{
										backgroundImage:
											"linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
										backgroundSize: "calc(100% / 12) calc(100% / 12)",
									}}
								/>

								{/* fitted canvas (ratio) */}
								{ratio ? (
									<div
										className="relative bg-widget-bg backdrop-blur-widget rounded-widget border-widget overflow-visible shadow-[0_10px_25px_rgba(0,0,0,0.08)]"
										style={{
											gridColumn: (() => {
												const span = Math.max(
													1,
													Math.min(GRID_BASE, ratio.w || 1)
												);
												const start = Math.floor((GRID_BASE - span) / 2) + 1;
												return `${start} / span ${span}`;
											})(),
											gridRow: (() => {
												const span = Math.max(
													1,
													Math.min(GRID_BASE, ratio.h || 1)
												);
												const start = Math.floor((GRID_BASE - span) / 2) + 1;
												return `${start} / span ${span}`;
											})(),
										}}
										ref={canvasRef}
										onDragOver={(e) => {
											e.preventDefault();
											e.dataTransfer.dropEffect = "copy";
										}}
										onDrop={(e) => {
											e.preventDefault();
											e.stopPropagation();
											const raw = e.dataTransfer.getData(
												STICKER_ASSET_DND_MIME
											);
											if (!raw) return;
											let payload: {
												assetId?: string;
												url?: string;
												width?: number;
												height?: number;
											} | null = null;
											try {
												payload = JSON.parse(raw);
											} catch {
												payload = null;
											}
											if (!payload?.url) return;
											const canvas = canvasRef.current;
											if (!canvas) return;
											const rect = canvas.getBoundingClientRect();
											if (rect.width <= 0 || rect.height <= 0) return;
											const centerXPct =
												((e.clientX - rect.left) / rect.width) * 100;
											const centerYPct =
												((e.clientY - rect.top) / rect.height) * 100;
											const base = cloneDraft(presentRef.current);
											void addImageStickerAt({
												url: payload.url,
												centerXPct,
												centerYPct,
												assetId: payload.assetId,
												assetWidth: payload.width,
												assetHeight: payload.height,
												historyBase: base,
											});
										}}
									>
										{/* marquee selection box */}
										{marquee && (
											<div
												className="absolute border border-blue-400/80 bg-blue-400/15"
												style={{
													left: `${marquee.xPct}%`,
													top: `${marquee.yPct}%`,
													width: `${marquee.widthPct}%`,
													height: `${marquee.heightPct}%`,
													pointerEvents: "none",
													zIndex: 9999,
												}}
											/>
										)}
										{visibleDraft.length > 0 ? (
											<>
												{visibleDraft.map((component) => {
													const rotation = component.rotation ?? 0;
													const opacity = (component.opacity ?? 100) / 100;
													const scaleX = component.flipX ? -1 : 1;
													const scaleY = component.flipY ? -1 : 1;
													const transform = `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
													const isSelected =
														selectedId === component.id ||
														selectedIds.has(component.id);
													const isLocked = component.isLocked === true;
													const isGroupSelected =
														!!selectedGroupMeta &&
														selectedGroupMeta.ids.has(component.id);
													const showPerStickerOutline =
														isSelected && !isGroupSelected;
													const showPerStickerHandles =
														isSelected && !isLocked && !isGroupSelected;

													return (
														<div
															key={component.id}
															className="absolute"
															data-sticker-root="true"
															style={{
																left: `${component.xPct}%`,
																top: `${component.yPct}%`,
																width: `${component.widthPct}%`,
																height: `${component.heightPct}%`,
																opacity,
																mixBlendMode:
																	(component.blendMode as React.CSSProperties["mixBlendMode"]) ??
																	"normal",
																zIndex: component.zIndex,
																transform,
																touchAction: "none",
																cursor: isLocked ? "not-allowed" : "grab",
															}}
															onDoubleClick={() => {
																if (isGroupSticker(component)) {
																	enterGroupEdit(component.id);
																}
															}}
															onPointerDown={(e) => {
																e.stopPropagation();
																// selection: group is treated as a single sticker in normal mode
																if (
																	!editingGroup &&
																	isGroupSticker(component)
																) {
																	setSelection(
																		new Set([component.id]),
																		component.id
																	);
																	if (component.isLocked === true) return;
																	interactionHistoryBaseRef.current =
																		cloneDraft(presentRef.current);
																	dragRef.current = {
																		id: component.id,
																		startClientX: e.clientX,
																		startClientY: e.clientY,
																		startXPct: component.xPct,
																		startYPct: component.yPct,
																		widthPct: component.widthPct,
																		heightPct: component.heightPct,
																	};
																	return;
																}

																// legacy multi-select (non-group objects)
																const groupIds = getGroupMemberIds(
																	component.id
																);
																if (e.shiftKey) {
																	const next = toggleIds(
																		selectedIdsRef.current,
																		groupIds
																	);
																	setSelection(next, component.id);
																} else {
																	setSelection(new Set(groupIds), component.id);
																}
																if (isLocked) return;
																interactionHistoryBaseRef.current = cloneDraft(
																	presentRef.current
																);
																const canvas = canvasRef.current;
																if (!canvas) return;
																const rect = canvas.getBoundingClientRect();
																if (rect.width <= 0 || rect.height <= 0) return;
																// Use the same "effective selection" used above (group-aware)
																const selection = new Set(groupIds);

																if (selection.size > 1) {
																	groupDragRef.current = {
																		startClientX: e.clientX,
																		startClientY: e.clientY,
																		items: Array.from(selection)
																			.map((id) => {
																				const found = presentRef.current.find(
																					(c) => c.id === id
																				);
																				if (!found) return null;
																				return {
																					id,
																					startXPct: found.xPct,
																					startYPct: found.yPct,
																					widthPct: found.widthPct,
																					heightPct: found.heightPct,
																				};
																			})
																			.filter(
																				(
																					item
																				): item is NonNullable<typeof item> =>
																					item !== null
																			),
																	};
																	return;
																}

																dragRef.current = {
																	id: component.id,
																	startClientX: e.clientX,
																	startClientY: e.clientY,
																	startXPct: component.xPct,
																	startYPct: component.yPct,
																	widthPct: component.widthPct,
																	heightPct: component.heightPct,
																};
															}}
														>
															{/* selection outline layer */}
															<div
																className="absolute inset-0 rounded-md"
																style={{
																	outline: showPerStickerOutline
																		? "2px solid rgba(59, 130, 246, 0.9)"
																		: isSelected
																		? "none"
																		: "1px solid rgba(0,0,0,0.08)",
																	outlineOffset: "-1px",
																	boxShadow: showPerStickerOutline
																		? "0 0 0 2px rgba(59, 130, 246, 0.2)"
																		: "none",
																	pointerEvents: "none",
																}}
															/>
															{/* transform handles (selected only) */}
															{showPerStickerHandles && (
																<div className="absolute inset-0 pointer-events-none">
																	{/* rotate handle */}
																	<div
																		className="absolute left-1/2 -top-6 -translate-x-1/2 pointer-events-auto"
																		style={{
																			cursor:
																				"url(/cursor-rotate.png) 10 10, grab",
																		}}
																	>
																		<div className="absolute left-1/2 top-3 h-3 w-px -translate-x-1/2 bg-blue-500/70" />
																		<button
																			type="button"
																			className="h-4 w-4 rounded-full bg-blue-500 shadow-sm ring-2 ring-white"
																			style={{
																				cursor:
																					"url(/cursor-rotate.png) 10 10, grab",
																			}}
																			onPointerDown={(e) => {
																				e.stopPropagation();
																				interactionHistoryBaseRef.current =
																					cloneDraft(presentRef.current);
																				const canvas = canvasRef.current;
																				if (!canvas) return;
																				const rect =
																					canvas.getBoundingClientRect();
																				const groupIds = getGroupMemberIds(
																					component.id
																				);
																				const groupItems = presentRef.current
																					.filter((c) =>
																						groupIds.includes(c.id)
																					)
																					.filter(isPctSticker)
																					.filter((c) => c.isLocked !== true);

																				const useGroup =
																					groupIds.length >= 2 &&
																					groupItems.length >= 2;

																				const groupBBox = (() => {
																					if (!useGroup) return null;
																					const minX = Math.min(
																						...groupItems.map((it) => it.xPct)
																					);
																					const minY = Math.min(
																						...groupItems.map((it) => it.yPct)
																					);
																					const maxX = Math.max(
																						...groupItems.map(
																							(it) => it.xPct + it.widthPct
																						)
																					);
																					const maxY = Math.max(
																						...groupItems.map(
																							(it) => it.yPct + it.heightPct
																						)
																					);
																					return {
																						centerXPct:
																							minX + (maxX - minX) / 2,
																						centerYPct:
																							minY + (maxY - minY) / 2,
																					};
																				})();

																				const centerXPct = useGroup
																					? groupBBox!.centerXPct
																					: component.xPct +
																					  component.widthPct / 2;
																				const centerYPct = useGroup
																					? groupBBox!.centerYPct
																					: component.yPct +
																					  component.heightPct / 2;

																				const centerClientX =
																					rect.left +
																					(centerXPct / 100) * rect.width;
																				const centerClientY =
																					rect.top +
																					(centerYPct / 100) * rect.height;
																				const startAngleDeg =
																					(Math.atan2(
																						e.clientY - centerClientY,
																						e.clientX - centerClientX
																					) *
																						180) /
																					Math.PI;

																				if (useGroup) {
																					setGroupRotatePreviewDeg(0);
																					const startGroupRotationDeg =
																						groupItems[0].groupRotationDeg ?? 0;
																					const groupId =
																						groupItems[0].groupId ??
																						`g_${Date.now()}`;
																					const minX = Math.min(
																						...groupItems.map((it) => it.xPct)
																					);
																					const minY = Math.min(
																						...groupItems.map((it) => it.yPct)
																					);
																					const maxX = Math.max(
																						...groupItems.map(
																							(it) => it.xPct + it.widthPct
																						)
																					);
																					const maxY = Math.max(
																						...groupItems.map(
																							(it) => it.yPct + it.heightPct
																						)
																					);
																					groupTransformRef.current = {
																						kind: "rotate",
																						groupId,
																						startGroupRotationDeg,
																						startMinX: minX,
																						startMinY: minY,
																						startW: maxX - minX,
																						startH: maxY - minY,
																						centerXPct,
																						centerYPct,
																						centerClientX,
																						centerClientY,
																						startAngleDeg,
																						items: groupItems.map((it) => ({
																							id: it.id,
																							startCenterXPct:
																								it.xPct + it.widthPct / 2,
																							startCenterYPct:
																								it.yPct + it.heightPct / 2,
																							startWidthPct: it.widthPct,
																							startHeightPct: it.heightPct,
																							startRotationDeg:
																								it.rotation ?? 0,
																						})),
																					};
																					return;
																				}

																				transformRef.current = {
																					kind: "rotate",
																					id: component.id,
																					centerClientX,
																					centerClientY,
																					startAngleDeg,
																					startRotationDeg:
																						component.rotation ?? 0,
																				};
																			}}
																			aria-label="회전"
																			title="회전"
																		/>
																	</div>

																	{/* resize handles */}
																	<>
																		{(
																			[
																				{
																					k: "nw",
																					cls: "-left-1.5 -top-1.5 cursor-nwse-resize",
																				},
																				{
																					k: "ne",
																					cls: "-right-1.5 -top-1.5 cursor-nesw-resize",
																				},
																				{
																					k: "sw",
																					cls: "-left-1.5 -bottom-1.5 cursor-nesw-resize",
																				},
																				{
																					k: "se",
																					cls: "-right-1.5 -bottom-1.5 cursor-nwse-resize",
																				},
																			] as const
																		).map((h) => (
																			<button
																				key={h.k}
																				type="button"
																				className={[
																					"absolute h-3 w-3 rounded-sm bg-white ring-2 ring-blue-500 shadow-sm pointer-events-auto",
																					h.cls,
																				].join(" ")}
																				onPointerDown={(e) => {
																					e.stopPropagation();
																					interactionHistoryBaseRef.current =
																						cloneDraft(presentRef.current);
																					const groupIds = getGroupMemberIds(
																						component.id
																					);
																					const groupItems = presentRef.current
																						.filter((c) =>
																							groupIds.includes(c.id)
																						)
																						.filter(isPctSticker)
																						.filter((c) => c.isLocked !== true);
																					const useGroup =
																						groupIds.length >= 2 &&
																						groupItems.length >= 2;

																					if (useGroup) {
																						const groupId =
																							groupItems[0].groupId ??
																							`g_${Date.now()}`;
																						const rotationDeg =
																							groupItems[0].groupRotationDeg ??
																							0;
																						const rad =
																							(rotationDeg * Math.PI) / 180;
																						const cos = Math.cos(rad);
																						const sin = Math.sin(rad);

																						const fallbackMinX = Math.min(
																							...groupItems.map((it) => it.xPct)
																						);
																						const fallbackMinY = Math.min(
																							...groupItems.map((it) => it.yPct)
																						);
																						const fallbackMaxX = Math.max(
																							...groupItems.map(
																								(it) => it.xPct + it.widthPct
																							)
																						);
																						const fallbackMaxY = Math.max(
																							...groupItems.map(
																								(it) => it.yPct + it.heightPct
																							)
																						);
																						const centerXPct =
																							groupItems[0].groupCenterXPct ??
																							fallbackMinX +
																								(fallbackMaxX - fallbackMinX) /
																									2;
																						const centerYPct =
																							groupItems[0].groupCenterYPct ??
																							fallbackMinY +
																								(fallbackMaxY - fallbackMinY) /
																									2;

																						const toLocal = (
																							x: number,
																							y: number
																						) => {
																							const dx = x - centerXPct;
																							const dy = y - centerYPct;
																							return {
																								x: dx * cos + dy * sin,
																								y: -dx * sin + dy * cos,
																							};
																						};

																						let minLx = Infinity;
																						let minLy = Infinity;
																						let maxLx = -Infinity;
																						let maxLy = -Infinity;
																						groupItems.forEach((it) => {
																							const x1 = it.xPct;
																							const y1 = it.yPct;
																							const x2 = it.xPct + it.widthPct;
																							const y2 = it.yPct + it.heightPct;
																							[
																								toLocal(x1, y1),
																								toLocal(x2, y1),
																								toLocal(x1, y2),
																								toLocal(x2, y2),
																							].forEach((p) => {
																								minLx = Math.min(minLx, p.x);
																								minLy = Math.min(minLy, p.y);
																								maxLx = Math.max(maxLx, p.x);
																								maxLy = Math.max(maxLy, p.y);
																							});
																						});

																						const anchor = (() => {
																							switch (h.k) {
																								case "nw":
																									return {
																										x: maxLx,
																										y: maxLy,
																									};
																								case "ne":
																									return {
																										x: minLx,
																										y: maxLy,
																									};
																								case "sw":
																									return {
																										x: maxLx,
																										y: minLy,
																									};
																								case "se":
																									return {
																										x: minLx,
																										y: minLy,
																									};
																							}
																						})();
																						groupTransformRef.current = {
																							kind: "resize",
																							groupId,
																							groupRotationDeg: rotationDeg,
																							startCenterXPct: centerXPct,
																							startCenterYPct: centerYPct,
																							anchorLocalX: anchor.x,
																							anchorLocalY: anchor.y,
																							startMinLocalX: minLx,
																							startMinLocalY: minLy,
																							startMaxLocalX: maxLx,
																							startMaxLocalY: maxLy,
																							handle: h.k,
																							startClientX: e.clientX,
																							startClientY: e.clientY,
																							items: groupItems.map((it) => ({
																								id: it.id,
																								startCenterLocalX: toLocal(
																									it.xPct + it.widthPct / 2,
																									it.yPct + it.heightPct / 2
																								).x,
																								startCenterLocalY: toLocal(
																									it.xPct + it.widthPct / 2,
																									it.yPct + it.heightPct / 2
																								).y,
																								startWidthPct: it.widthPct,
																								startHeightPct: it.heightPct,
																							})),
																						};
																						return;
																					}

																					transformRef.current = {
																						kind: "resize",
																						id: component.id,
																						handle: h.k,
																						startClientX: e.clientX,
																						startClientY: e.clientY,
																						startXPct: component.xPct,
																						startYPct: component.yPct,
																						startWidthPct: component.widthPct,
																						startHeightPct: component.heightPct,
																						lockAspectRatio:
																							component.lockAspectRatio ===
																							true,
																					};
																				}}
																				aria-label="리사이즈"
																				title="리사이즈"
																			/>
																		))}
																	</>
																</div>
															)}
															{isGroupSticker(component) ? (
																<div className="relative w-full h-full">
																	{(component.children ?? [])
																		.filter((c) => c.isVisible !== false)
																		.slice()
																		.sort(
																			(a, b) =>
																				(a.zIndex ?? 0) - (b.zIndex ?? 0)
																		)
																		.map((child) => {
																			const rotation = child.rotation ?? 0;
																			const opacity =
																				(child.opacity ?? 100) / 100;
																			const scaleX = child.flipX ? -1 : 1;
																			const scaleY = child.flipY ? -1 : 1;
																			const transform = `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
																			return (
																				<div
																					key={child.id}
																					className="absolute"
																					style={{
																						left: `${child.xPct}%`,
																						top: `${child.yPct}%`,
																						width: `${child.widthPct}%`,
																						height: `${child.heightPct}%`,
																						opacity,
																						mixBlendMode:
																							(child.blendMode as React.CSSProperties["mixBlendMode"]) ??
																							"normal",
																						zIndex: child.zIndex,
																						transform,
																					}}
																				>
																					{child.type === "text" ? (
																						<div
																							className="w-full h-full rounded-md bg-transparent text-gray-800"
																							style={{
																								backgroundColor:
																									child.style
																										?.backgroundColor ??
																									"transparent",
																								color:
																									child.style?.textColor ??
																									"#1f2937",
																								fontSize: child.style?.fontSize
																									? `${child.style.fontSize}px`
																									: undefined,
																								fontWeight:
																									child.style?.fontWeight,
																								fontFamily:
																									child.style?.fontFamily,
																								textAlign:
																									child.style?.textAlign,
																							}}
																						>
																							<div className="w-full h-full px-1 py-1 text-[13px] leading-snug overflow-hidden">
																								<div
																									className="w-full h-full"
																									style={{
																										whiteSpace: "pre-wrap",
																									}}
																								>
																									{child.text || " "}
																								</div>
																							</div>
																						</div>
																					) : child.type === "image" ? (
																						<img
																							src={child.imageUrl}
																							alt="sticker"
																							className={[
																								"w-full h-full",
																								child.imageFit === "cover"
																									? "object-cover"
																									: "object-contain",
																							].join(" ")}
																							draggable={false}
																						/>
																					) : (
																						<div className="w-full h-full rounded-md border border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center text-[11px] text-gray-400">
																							알 수 없는 스티커
																						</div>
																					)}
																				</div>
																			);
																		})}
																</div>
															) : isTextSticker(component) ? (
																<div
																	className="w-full h-full rounded-md bg-transparent text-gray-800"
																	style={{
																		backgroundColor:
																			component.style?.backgroundColor ??
																			"transparent",
																		color:
																			component.style?.textColor ?? "#1f2937",
																		fontSize: component.style?.fontSize
																			? `${component.style.fontSize}px`
																			: undefined,
																		fontWeight: component.style?.fontWeight,
																		fontFamily: component.style?.fontFamily,
																		textAlign: component.style?.textAlign,
																	}}
																>
																	<div className="w-full h-full px-1 py-1 text-[13px] leading-snug overflow-hidden">
																		<div
																			className="w-full h-full"
																			style={{ whiteSpace: "pre-wrap" }}
																		>
																			{component.text || " "}
																		</div>
																	</div>
																</div>
															) : isImageSticker(component) ? (
																<img
																	src={component.imageUrl}
																	alt="sticker"
																	className={[
																		"w-full h-full",
																		component.imageFit === "cover"
																			? "object-cover"
																			: "object-contain",
																	].join(" ")}
																	draggable={false}
																/>
															) : (
																<div className="w-full h-full rounded-md border border-dashed border-gray-300 bg-gray-50/60 flex items-center justify-center text-[11px] text-gray-400">
																	알 수 없는 스티커
																</div>
															)}
														</div>
													);
												})}

												{/* group selection outline (single box) */}
												{selectedGroupMeta && (
													<div
														className="absolute pointer-events-none rounded-md"
														style={{
															left: `${(groupTransformRef.current?.kind ===
															"rotate"
																? groupTransformRef.current.centerXPct
																: selectedGroupMeta.centerX
															).toFixed(6)}%`,
															top: `${(groupTransformRef.current?.kind ===
															"rotate"
																? groupTransformRef.current.centerYPct
																: selectedGroupMeta.centerY
															).toFixed(6)}%`,
															width: `${(groupTransformRef.current?.kind ===
															"rotate"
																? groupTransformRef.current.startW
																: selectedGroupMeta.w
															).toFixed(6)}%`,
															height: `${(groupTransformRef.current?.kind ===
															"rotate"
																? groupTransformRef.current.startH
																: selectedGroupMeta.h
															).toFixed(6)}%`,
															outline: "2px solid rgba(59, 130, 246, 0.95)",
															outlineOffset: "-1px",
															boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
															zIndex: selectedGroupMeta.zIndex,
															transform:
																groupTransformRef.current?.kind === "rotate"
																	? `translate(-50%, -50%) rotate(${(
																			selectedGroupMeta.rotationDeg +
																			groupRotatePreviewDeg
																	  ).toFixed(6)}deg)`
																	: `translate(-50%, -50%) rotate(${selectedGroupMeta.rotationDeg.toFixed(
																			6
																	  )}deg)`,
															transformOrigin: "center",
														}}
													>
														{/* group transform handles */}
														<div className="absolute inset-0 pointer-events-none">
															{/* rotate handle */}
															<div
																className="absolute left-1/2 -top-6 -translate-x-1/2 pointer-events-auto"
																style={{
																	cursor: "url(/cursor-rotate.png) 10 10, grab",
																}}
															>
																<div className="absolute left-1/2 top-3 h-3 w-px -translate-x-1/2 bg-blue-500/70" />
																<button
																	type="button"
																	className="h-4 w-4 rounded-full bg-blue-500 shadow-sm ring-2 ring-white"
																	style={{
																		cursor:
																			"url(/cursor-rotate.png) 10 10, grab",
																	}}
																	onPointerDown={(e) => {
																		e.stopPropagation();
																		interactionHistoryBaseRef.current =
																			cloneDraft(presentRef.current);
																		const canvas = canvasRef.current;
																		if (!canvas) return;
																		const rect = canvas.getBoundingClientRect();
																		if (rect.width <= 0 || rect.height <= 0)
																			return;

																		const centerClientX =
																			rect.left +
																			(selectedGroupMeta.centerX / 100) *
																				rect.width;
																		const centerClientY =
																			rect.top +
																			(selectedGroupMeta.centerY / 100) *
																				rect.height;
																		const startAngleDeg =
																			(Math.atan2(
																				e.clientY - centerClientY,
																				e.clientX - centerClientX
																			) *
																				180) /
																			Math.PI;

																		const groupItems =
																			selectedGroupMeta.items.filter(
																				(it) => it.isLocked !== true
																			);
																		if (groupItems.length < 2) return;

																		setGroupRotatePreviewDeg(0);
																		groupTransformRef.current = {
																			kind: "rotate",
																			groupId: selectedGroupMeta.groupId,
																			startGroupRotationDeg:
																				selectedGroupMeta.rotationDeg ?? 0,
																			startMinX: selectedGroupMeta.minX,
																			startMinY: selectedGroupMeta.minY,
																			startW: selectedGroupMeta.w,
																			startH: selectedGroupMeta.h,
																			centerXPct: selectedGroupMeta.centerX,
																			centerYPct: selectedGroupMeta.centerY,
																			centerClientX,
																			centerClientY,
																			startAngleDeg,
																			items: groupItems.map((it) => ({
																				id: it.id,
																				startCenterXPct:
																					it.xPct + it.widthPct / 2,
																				startCenterYPct:
																					it.yPct + it.heightPct / 2,
																				startWidthPct: it.widthPct,
																				startHeightPct: it.heightPct,
																				startRotationDeg: it.rotation ?? 0,
																			})),
																		};
																	}}
																	aria-label="그룹 회전"
																	title="그룹 회전"
																/>
															</div>

															{/* resize handles */}
															<>
																{(
																	[
																		{
																			k: "nw",
																			cls: "-left-1.5 -top-1.5 cursor-nwse-resize",
																		},
																		{
																			k: "ne",
																			cls: "-right-1.5 -top-1.5 cursor-nesw-resize",
																		},
																		{
																			k: "sw",
																			cls: "-left-1.5 -bottom-1.5 cursor-nesw-resize",
																		},
																		{
																			k: "se",
																			cls: "-right-1.5 -bottom-1.5 cursor-nwse-resize",
																		},
																	] as const
																).map((h) => (
																	<button
																		key={h.k}
																		type="button"
																		className={[
																			"absolute h-3 w-3 rounded-sm bg-white ring-2 ring-blue-500 shadow-sm pointer-events-auto",
																			h.cls,
																		].join(" ")}
																		onPointerDown={(e) => {
																			e.stopPropagation();
																			interactionHistoryBaseRef.current =
																				cloneDraft(presentRef.current);

																			const groupItems =
																				selectedGroupMeta.items.filter(
																					(it) => it.isLocked !== true
																				);
																			if (groupItems.length < 2) return;

																			const rotationDeg =
																				selectedGroupMeta.rotationDeg ?? 0;
																			const rad = (rotationDeg * Math.PI) / 180;
																			const cos = Math.cos(rad);
																			const sin = Math.sin(rad);
																			const toLocal = (
																				x: number,
																				y: number
																			) => {
																				const dx =
																					x - selectedGroupMeta.centerX;
																				const dy =
																					y - selectedGroupMeta.centerY;
																				return {
																					x: dx * cos + dy * sin,
																					y: -dx * sin + dy * cos,
																				};
																			};

																			let minLx = Infinity;
																			let minLy = Infinity;
																			let maxLx = -Infinity;
																			let maxLy = -Infinity;
																			groupItems.forEach((it) => {
																				const x1 = it.xPct;
																				const y1 = it.yPct;
																				const x2 = it.xPct + it.widthPct;
																				const y2 = it.yPct + it.heightPct;
																				[
																					toLocal(x1, y1),
																					toLocal(x2, y1),
																					toLocal(x1, y2),
																					toLocal(x2, y2),
																				].forEach((p) => {
																					minLx = Math.min(minLx, p.x);
																					minLy = Math.min(minLy, p.y);
																					maxLx = Math.max(maxLx, p.x);
																					maxLy = Math.max(maxLy, p.y);
																				});
																			});

																			const anchor = (() => {
																				switch (h.k) {
																					case "nw":
																						return { x: maxLx, y: maxLy };
																					case "ne":
																						return { x: minLx, y: maxLy };
																					case "sw":
																						return { x: maxLx, y: minLy };
																					case "se":
																						return { x: minLx, y: minLy };
																				}
																			})();

																			groupTransformRef.current = {
																				kind: "resize",
																				groupId: selectedGroupMeta.groupId,
																				groupRotationDeg: rotationDeg,
																				startCenterXPct:
																					selectedGroupMeta.centerX,
																				startCenterYPct:
																					selectedGroupMeta.centerY,
																				anchorLocalX: anchor.x,
																				anchorLocalY: anchor.y,
																				startMinLocalX: minLx,
																				startMinLocalY: minLy,
																				startMaxLocalX: maxLx,
																				startMaxLocalY: maxLy,
																				handle: h.k,
																				startClientX: e.clientX,
																				startClientY: e.clientY,
																				items: groupItems.map((it) => ({
																					id: it.id,
																					startCenterLocalX: toLocal(
																						it.xPct + it.widthPct / 2,
																						it.yPct + it.heightPct / 2
																					).x,
																					startCenterLocalY: toLocal(
																						it.xPct + it.widthPct / 2,
																						it.yPct + it.heightPct / 2
																					).y,
																					startWidthPct: it.widthPct,
																					startHeightPct: it.heightPct,
																				})),
																			};
																		}}
																		aria-label="그룹 리사이즈"
																		title="그룹 리사이즈"
																	/>
																))}
															</>
														</div>
													</div>
												)}
											</>
										) : (
											<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
												저장된 스티커가 없습니다.
											</div>
										)}
									</div>
								) : (
									<div className="absolute inset-0 flex items-center justify-center">
										<div className="text-center py-10">
											<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-theme-primary border-r-transparent" />
											<div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
												캔버스를 불러오는 중입니다...
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					<aside className="rounded-card border border-card bg-card-bg/60 p-4 backdrop-blur-card">
						<div className="text-sm font-semibold text-main-text">
							편집 패널
						</div>
						<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
							선택한 스티커 속성 편집(텍스트/스타일/회전/투명도 등)
						</p>

						{/* Asset Panel */}
						<div className="mt-4 rounded-card border border-card bg-card-bg p-3 backdrop-blur-card">
							<div className="flex items-center justify-between gap-2">
								<div className="text-xs font-semibold text-main-text">
									이미지 에셋
								</div>
								<label className="inline-flex items-center gap-2 rounded-md border border-card bg-background/40 px-2 py-1 text-xs text-gray-700 hover:bg-background/60 cursor-pointer">
									<Upload className="h-3.5 w-3.5" />
									업로드
									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={async (e) => {
											const file = e.target.files?.[0];
											e.target.value = "";
											if (!file) return;
											try {
												setAssetsError(null);
												setAssetsLoading(true);
												await createStickerAssetFromFile(file);
												await refreshAssets(assetTab);
											} catch (err) {
												const msg =
													err instanceof Error
														? err.message
														: "업로드에 실패했습니다.";
												toast.error(msg);
												setAssetsError(msg);
											} finally {
												setAssetsLoading(false);
											}
										}}
									/>
								</label>
							</div>

							<div className="mt-3">
								<Tabs
									value={assetTab}
									onValueChange={(v) => setAssetTab(v as StickerAssetTab)}
								>
									<TabsList className="w-full">
										<TabsTrigger value="all" className="flex-1 text-xs">
											전체
										</TabsTrigger>
										<TabsTrigger value="favorites" className="flex-1 text-xs">
											즐겨찾기
										</TabsTrigger>
										<TabsTrigger value="recent" className="flex-1 text-xs">
											최근
										</TabsTrigger>
									</TabsList>

									{(["all", "favorites", "recent"] as StickerAssetTab[]).map(
										(tab) => (
											<TabsContent key={tab} value={tab} className="mt-3">
												{assetsLoading ? (
													<div className="py-6 text-center text-xs text-gray-400">
														불러오는 중...
													</div>
												) : assetsError ? (
													<div className="py-3 text-xs text-red-500">
														{assetsError}
													</div>
												) : assets.length === 0 ? (
													<div className="py-6 text-center text-xs text-gray-400">
														에셋이 없습니다.
													</div>
												) : (
													<div className="grid grid-cols-3 gap-2">
														{assets.map((asset) => {
															const isFav = asset.favorite === true;
															return (
																<div
																	key={asset.id}
																	className="relative group rounded-md border border-card bg-background/30 overflow-hidden"
																>
																	<button
																		type="button"
																		className="block w-full aspect-square"
																		draggable
																		onDragStart={(e) => {
																			e.dataTransfer.effectAllowed = "copy";
																			e.dataTransfer.setData(
																				STICKER_ASSET_DND_MIME,
																				JSON.stringify({
																					assetId: asset.id,
																					url: asset.url,
																					width: asset.width,
																					height: asset.height,
																				})
																			);
																			e.dataTransfer.setData(
																				"text/uri-list",
																				asset.url
																			);
																		}}
																		onClick={() => {
																			const base = cloneDraft(
																				presentRef.current
																			);
																			void addImageStickerAt({
																				url: asset.url,
																				centerXPct: 50,
																				centerYPct: 50,
																				assetId: asset.id,
																				assetWidth: asset.width,
																				assetHeight: asset.height,
																				historyBase: base,
																			});
																		}}
																		title="클릭: 가운데 추가 / 드래그: 캔버스에 드롭"
																	>
																		{/* eslint-disable-next-line @next/next/no-img-element */}
																		<img
																			src={asset.url}
																			alt={asset.name ?? "asset"}
																			className="h-full w-full object-cover"
																		/>
																	</button>

																	<button
																		type="button"
																		className="absolute top-1 left-1 inline-flex h-7 w-7 items-center justify-center rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition"
																		onClick={async (e) => {
																			e.stopPropagation();
																			try {
																				setAssets((prev) =>
																					prev.map((a) =>
																						a.id === asset.id
																							? { ...a, favorite: !isFav }
																							: a
																					)
																				);
																				await setStickerAssetFavorite(
																					asset.id,
																					!isFav
																				);
																				if (assetTab === "favorites")
																					await refreshAssets("favorites");
																			} catch (err) {
																				const msg =
																					err instanceof Error
																						? err.message
																						: "즐겨찾기 변경 실패";
																				toast.error(msg);
																				void refreshAssets(assetTab);
																			}
																		}}
																		aria-label="즐겨찾기"
																		title="즐겨찾기"
																	>
																		<Star
																			className="h-4 w-4"
																			fill={isFav ? "currentColor" : "none"}
																		/>
																	</button>

																	<button
																		type="button"
																		className="absolute top-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition"
																		onClick={async (e) => {
																			e.stopPropagation();
																			try {
																				setAssets((prev) =>
																					prev.filter((a) => a.id !== asset.id)
																				);
																				await deleteStickerAsset({
																					id: asset.id,
																					storagePath: asset.storagePath,
																				});
																				await refreshAssets(assetTab);
																			} catch (err) {
																				const msg =
																					err instanceof Error
																						? err.message
																						: "삭제 실패";
																				toast.error(msg);
																				void refreshAssets(assetTab);
																			}
																		}}
																		aria-label="삭제"
																		title="삭제"
																	>
																		<Trash2 className="h-4 w-4" />
																	</button>
																</div>
															);
														})}
													</div>
												)}
											</TabsContent>
										)
									)}
								</Tabs>
							</div>
						</div>

						<div className="mt-4 space-y-2">
							<Button
								type="button"
								className="w-full justify-start"
								variant="outline"
								onClick={() => setIsImageDialogOpen(true)}
							>
								<ImagePlus className="h-4 w-4 mr-2" />
								이미지 스티커 추가
							</Button>
							<Button
								type="button"
								className="w-full justify-start"
								variant="outline"
								onClick={addTextSticker}
							>
								<Plus className="h-4 w-4 mr-2" />
								텍스트 스티커 추가
							</Button>
						</div>
						<div className="mt-4 rounded-md border border-dashed border-gray-300/70 bg-background/40 p-3 text-xs text-gray-400">
							{selectedComponent
								? `선택됨: #${selectedComponent.id} (${selectedComponent.type})`
								: "선택된 스티커가 없습니다."}
						</div>

						{selectedComponent && (
							<div className="mt-4 space-y-2">
								<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
									효과
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											불투명도(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											min={0}
											max={100}
											step={1}
											value={selectedComponent.opacity ?? 100}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const opacity = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => ({
													...prev,
													opacity: Number.isFinite(opacity)
														? Math.max(0, Math.min(100, opacity))
														: 100,
												}));
											}}
										/>
									</div>

									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											블렌드
										</div>
										<div className="mt-2">
											<Select
												value={selectedComponent.blendMode ?? "normal"}
												onValueChange={(value) => {
													updateComponent(selectedComponent.id, (prev) => ({
														...prev,
														blendMode: value as typeof prev.blendMode,
													}));
												}}
												disabled={selectedComponent.isLocked === true}
											>
												<SelectTrigger>
													<SelectValue placeholder="blend" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="normal">normal</SelectItem>
													<SelectItem value="multiply">multiply</SelectItem>
													<SelectItem value="screen">screen</SelectItem>
													<SelectItem value="overlay">overlay</SelectItem>
													<SelectItem value="darken">darken</SelectItem>
													<SelectItem value="lighten">lighten</SelectItem>
													<SelectItem value="color-dodge">
														color-dodge
													</SelectItem>
													<SelectItem value="color-burn">color-burn</SelectItem>
													<SelectItem value="hard-light">hard-light</SelectItem>
													<SelectItem value="soft-light">soft-light</SelectItem>
													<SelectItem value="difference">difference</SelectItem>
													<SelectItem value="exclusion">exclusion</SelectItem>
													<SelectItem value="hue">hue</SelectItem>
													<SelectItem value="saturation">saturation</SelectItem>
													<SelectItem value="color">color</SelectItem>
													<SelectItem value="luminosity">luminosity</SelectItem>
													<SelectItem value="plus-lighter">
														plus-lighter
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>

								<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
									스티커 정렬
								</div>
								<div className="grid grid-cols-3 gap-2">
									<Button
										type="button"
										variant="outline"
										className="h-9 px-0"
										disabled={selectedComponent.isLocked === true}
										onClick={() => alignSelectedSticker("left")}
										title="왼쪽 정렬"
									>
										<AlignStartVertical className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="outline"
										className="h-9 px-0"
										disabled={selectedComponent.isLocked === true}
										onClick={() => alignSelectedSticker("hcenter")}
										title="가로 가운데 정렬"
									>
										<AlignCenterVertical className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="outline"
										className="h-9 px-0"
										disabled={selectedComponent.isLocked === true}
										onClick={() => alignSelectedSticker("right")}
										title="오른쪽 정렬"
									>
										<AlignEndVertical className="h-4 w-4" />
									</Button>
								</div>
								<div className="grid grid-cols-3 gap-2">
									<Button
										type="button"
										variant="outline"
										className="h-9 px-0"
										disabled={selectedComponent.isLocked === true}
										onClick={() => alignSelectedSticker("top")}
										title="위 정렬"
									>
										<AlignStartHorizontal className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="outline"
										className="h-9 px-0"
										disabled={selectedComponent.isLocked === true}
										onClick={() => alignSelectedSticker("vcenter")}
										title="세로 가운데 정렬"
									>
										<AlignCenterHorizontal className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										variant="outline"
										className="h-9 px-0"
										disabled={selectedComponent.isLocked === true}
										onClick={() => alignSelectedSticker("bottom")}
										title="아래 정렬"
									>
										<AlignEndHorizontal className="h-4 w-4" />
									</Button>
								</div>
							</div>
						)}

						{selectedComponent && isTextSticker(selectedComponent) && (
							<div className="mt-4 space-y-4">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
										<div className="text-xs font-medium text-gray-700 dark:text-gray-200">
											자동 크기
										</div>
										<input
											type="checkbox"
											checked={selectedComponent.autoSize !== false}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const next = e.target.checked;
												updateComponent(selectedComponent.id, (prev) => {
													if (!isTextSticker(prev)) return prev;
													const nextComp: StickerBoardTextComponent = {
														...prev,
														autoSize: next,
														maxWidthPx:
															prev.maxWidthPx ?? DEFAULT_TEXT_MAX_WIDTH_PX,
														paddingPx: prev.paddingPx ?? DEFAULT_TEXT_PADDING,
													};
													if (nextComp.autoSize !== false)
														requestAutoSize(nextComp);
													return nextComp;
												});
											}}
										/>
									</div>

									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											최대 폭(px)
										</div>
										<Input
											className="mt-2"
											type="number"
											min={80}
											max={800}
											step={10}
											value={
												selectedComponent.maxWidthPx ??
												DEFAULT_TEXT_MAX_WIDTH_PX
											}
											disabled={
												selectedComponent.isLocked === true ||
												selectedComponent.autoSize === false
											}
											onChange={(e) => {
												const raw = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => {
													if (!isTextSticker(prev)) return prev;
													const maxWidthPx = Number.isFinite(raw)
														? Math.max(80, Math.min(800, raw))
														: DEFAULT_TEXT_MAX_WIDTH_PX;
													const nextComp: StickerBoardTextComponent = {
														...prev,
														maxWidthPx,
														autoSize: prev.autoSize !== false,
														paddingPx: prev.paddingPx ?? DEFAULT_TEXT_PADDING,
													};
													if (nextComp.autoSize !== false)
														requestAutoSize(nextComp);
													return nextComp;
												});
											}}
										/>
									</div>
								</div>

								<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
									<div className="text-xs font-medium text-gray-700 dark:text-gray-200">
										비율 고정
									</div>
									<input
										type="checkbox"
										checked={selectedComponent.lockAspectRatio === true}
										disabled={selectedComponent.isLocked === true}
										onChange={(e) => {
											const next = e.target.checked;
											updateComponent(selectedComponent.id, (prev) => ({
												...prev,
												lockAspectRatio: next,
											}));
										}}
									/>
								</div>
								<div>
									<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
										텍스트
									</div>
									<textarea
										className="mt-2 w-full min-h-[120px] rounded-card border border-card bg-card-bg px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-theme-primary focus-visible:ring-1 focus-visible:ring-theme-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
										value={selectedComponent.text ?? ""}
										disabled={selectedComponent.isLocked === true}
										onChange={(e) => {
											const nextText = e.target.value;
											updateComponent(selectedComponent.id, (prev) => {
												if (!isTextSticker(prev)) return prev;
												const next = { ...prev, text: nextText };
												// live autosize
												if (next.autoSize !== false) {
													requestAutoSize(next);
												}
												return next;
											});
										}}
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											글자색
										</div>
										<Input
											className="mt-2"
											type="color"
											value={selectedComponent.style?.textColor ?? "#1f2937"}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const color = e.target.value;
												updateComponent(selectedComponent.id, (prev) => {
													if (!isTextSticker(prev)) return prev;
													return {
														...prev,
														style: { ...(prev.style ?? {}), textColor: color },
													};
												});
											}}
										/>
									</div>

									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											폰트 크기(px)
										</div>
										<Input
											className="mt-2"
											type="number"
											min={8}
											max={96}
											step={1}
											value={selectedComponent.style?.fontSize ?? 14}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const size = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => {
													if (!isTextSticker(prev)) return prev;
													const next: StickerBoardTextComponent = {
														...prev,
														style: {
															...(prev.style ?? {}),
															fontSize: Number.isFinite(size) ? size : 14,
														},
													};
													if (next.autoSize !== false) requestAutoSize(next);
													return next;
												});
											}}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											굵기
										</div>
										<Input
											className="mt-2"
											type="number"
											min={100}
											max={900}
											step={100}
											value={selectedComponent.style?.fontWeight ?? 400}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const weight = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => {
													if (!isTextSticker(prev)) return prev;
													const next: StickerBoardTextComponent = {
														...prev,
														style: {
															...(prev.style ?? {}),
															fontWeight: Number.isFinite(weight)
																? weight
																: 400,
														},
													};
													if (next.autoSize !== false) requestAutoSize(next);
													return next;
												});
											}}
										/>
									</div>

									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											정렬
										</div>
										<div className="mt-2">
											<Select
												value={selectedComponent.style?.textAlign ?? "left"}
												onValueChange={(value) => {
													updateComponent(selectedComponent.id, (prev) => {
														if (!isTextSticker(prev)) return prev;
														const next: StickerBoardTextComponent = {
															...prev,
															style: {
																...(prev.style ?? {}),
																textAlign: value as typeof prev.style.textAlign,
															},
														};
														if (next.autoSize !== false) requestAutoSize(next);
														return next;
													});
												}}
												disabled={selectedComponent.isLocked === true}
											>
												<SelectTrigger>
													<SelectValue placeholder="정렬" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="left">왼쪽</SelectItem>
													<SelectItem value="center">가운데</SelectItem>
													<SelectItem value="right">오른쪽</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											회전(°)
										</div>
										<Input
											className="mt-2"
											type="number"
											step={1}
											value={selectedComponent.rotation ?? 0}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const rotation = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => ({
													...prev,
													rotation: Number.isFinite(rotation) ? rotation : 0,
												}));
											}}
										/>
									</div>
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											투명도(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											min={0}
											max={100}
											step={1}
											value={selectedComponent.opacity ?? 100}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const opacity = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => ({
													...prev,
													opacity: Number.isFinite(opacity)
														? Math.max(0, Math.min(100, opacity))
														: 100,
												}));
											}}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											X(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											step={0.5}
											value={selectedComponent.xPct}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const xPct = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => {
													const next = clampStickerToEditorBounds({
														xPct: Number.isFinite(xPct) ? xPct : prev.xPct,
														yPct: prev.yPct,
														widthPct: prev.widthPct,
														heightPct: prev.heightPct,
													});
													return { ...prev, ...next };
												});
											}}
										/>
									</div>
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											Y(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											step={0.5}
											value={selectedComponent.yPct}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const yPct = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => {
													const next = clampStickerToEditorBounds({
														xPct: prev.xPct,
														yPct: Number.isFinite(yPct) ? yPct : prev.yPct,
														widthPct: prev.widthPct,
														heightPct: prev.heightPct,
													});
													return { ...prev, ...next };
												});
											}}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											가로(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											min={2}
											max={100}
											step={0.5}
											value={selectedComponent.widthPct}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const widthPctRaw = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => {
													const MIN = 2;
													let widthPct = Number.isFinite(widthPctRaw)
														? widthPctRaw
														: prev.widthPct;
													widthPct = Math.max(MIN, widthPct);
													let heightPct = prev.heightPct;
													if (prev.lockAspectRatio === true) {
														const aspect =
															prev.heightPct / Math.max(0.0001, prev.widthPct);
														heightPct = Math.max(MIN, widthPct * aspect);
													}
													return {
														...prev,
														...clampStickerToEditorBounds({
															xPct: prev.xPct,
															yPct: prev.yPct,
															widthPct,
															heightPct,
														}),
													};
												});
											}}
										/>
									</div>
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											세로(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											min={2}
											max={100}
											step={0.5}
											value={selectedComponent.heightPct}
											disabled={selectedComponent.isLocked === true}
											onChange={(e) => {
												const heightPctRaw = Number(e.target.value || 0);
												updateComponent(selectedComponent.id, (prev) => {
													const MIN = 2;
													let heightPct = Number.isFinite(heightPctRaw)
														? heightPctRaw
														: prev.heightPct;
													heightPct = Math.max(MIN, heightPct);
													let widthPct = prev.widthPct;
													if (prev.lockAspectRatio === true) {
														const aspect =
															prev.heightPct / Math.max(0.0001, prev.widthPct);
														widthPct = Math.max(
															MIN,
															heightPct / Math.max(0.0001, aspect)
														);
													}
													return {
														...prev,
														...clampStickerToEditorBounds({
															xPct: prev.xPct,
															yPct: prev.yPct,
															widthPct,
															heightPct,
														}),
													};
												});
											}}
										/>
									</div>
								</div>
							</div>
						)}

						{selectedImageComponent && (
							<div className="mt-4 space-y-4">
								<div className="flex items-center justify-between gap-3 rounded-md border border-card bg-card-bg px-3 py-2">
									<div className="text-xs font-medium text-gray-700 dark:text-gray-200">
										비율 고정
									</div>
									<input
										type="checkbox"
										checked={selectedImageComponent.lockAspectRatio === true}
										disabled={selectedImageComponent.isLocked === true}
										onChange={(e) => {
											const next = e.target.checked;
											updateComponent(selectedImageComponent.id, (prev) => ({
												...prev,
												lockAspectRatio: next,
											}));
										}}
									/>
								</div>

								<div>
									<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
										이미지
									</div>
									<div className="mt-2 flex items-center gap-2">
										<Button
											type="button"
											variant="outline"
											className="flex-1 justify-start"
											disabled={selectedImageComponent.isLocked === true}
											onClick={() => {
												setImageReplaceTargetId(selectedImageComponent.id);
												setIsImageDialogOpen(true);
											}}
										>
											<ImagePlus className="h-4 w-4 mr-2" />
											이미지 교체
										</Button>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											맞춤
										</div>
										<div className="mt-2">
											<Select
												value={selectedImageComponent.imageFit ?? "contain"}
												onValueChange={(value) => {
													updateComponent(selectedImageComponent.id, (prev) => {
														if (!isImageSticker(prev)) return prev;
														return {
															...prev,
															imageFit: value as "contain" | "cover",
														};
													});
												}}
												disabled={selectedImageComponent.isLocked === true}
											>
												<SelectTrigger>
													<SelectValue placeholder="contain/cover" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="contain">contain</SelectItem>
													<SelectItem value="cover">cover</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											뒤집기
										</div>
										<div className="mt-2 flex items-center gap-2">
											<Button
												type="button"
												variant="outline"
												className="flex-1"
												disabled={selectedImageComponent.isLocked === true}
												onClick={() => {
													updateComponent(
														selectedImageComponent.id,
														(prev) => ({
															...prev,
															flipX: !(prev.flipX === true),
														})
													);
												}}
											>
												X
											</Button>
											<Button
												type="button"
												variant="outline"
												className="flex-1"
												disabled={selectedImageComponent.isLocked === true}
												onClick={() => {
													updateComponent(
														selectedImageComponent.id,
														(prev) => ({
															...prev,
															flipY: !(prev.flipY === true),
														})
													);
												}}
											>
												Y
											</Button>
										</div>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											X(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											step={0.5}
											value={selectedImageComponent.xPct}
											disabled={selectedImageComponent.isLocked === true}
											onChange={(e) => {
												const xPct = Number(e.target.value || 0);
												updateComponent(selectedImageComponent.id, (prev) => {
													const next = clampStickerToEditorBounds({
														xPct: Number.isFinite(xPct) ? xPct : prev.xPct,
														yPct: prev.yPct,
														widthPct: prev.widthPct,
														heightPct: prev.heightPct,
													});
													return { ...prev, ...next };
												});
											}}
										/>
									</div>
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											Y(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											step={0.5}
											value={selectedImageComponent.yPct}
											disabled={selectedImageComponent.isLocked === true}
											onChange={(e) => {
												const yPct = Number(e.target.value || 0);
												updateComponent(selectedImageComponent.id, (prev) => {
													const next = clampStickerToEditorBounds({
														xPct: prev.xPct,
														yPct: Number.isFinite(yPct) ? yPct : prev.yPct,
														widthPct: prev.widthPct,
														heightPct: prev.heightPct,
													});
													return { ...prev, ...next };
												});
											}}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											가로(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											min={2}
											max={100}
											step={0.5}
											value={selectedImageComponent.widthPct}
											disabled={selectedImageComponent.isLocked === true}
											onChange={(e) => {
												const widthPctRaw = Number(e.target.value || 0);
												updateComponent(selectedImageComponent.id, (prev) => {
													const MIN = 2;
													let widthPct = Number.isFinite(widthPctRaw)
														? widthPctRaw
														: prev.widthPct;
													widthPct = Math.max(MIN, widthPct);
													let heightPct = prev.heightPct;
													if (prev.lockAspectRatio === true) {
														const aspect =
															prev.heightPct / Math.max(0.0001, prev.widthPct);
														heightPct = Math.max(MIN, widthPct * aspect);
													}
													return {
														...prev,
														...clampStickerToEditorBounds({
															xPct: prev.xPct,
															yPct: prev.yPct,
															widthPct,
															heightPct,
														}),
													};
												});
											}}
										/>
									</div>
									<div>
										<div className="text-xs font-medium text-gray-600 dark:text-gray-300">
											세로(%)
										</div>
										<Input
											className="mt-2"
											type="number"
											min={2}
											max={100}
											step={0.5}
											value={selectedImageComponent.heightPct}
											disabled={selectedImageComponent.isLocked === true}
											onChange={(e) => {
												const heightPctRaw = Number(e.target.value || 0);
												updateComponent(selectedImageComponent.id, (prev) => {
													const MIN = 2;
													let heightPct = Number.isFinite(heightPctRaw)
														? heightPctRaw
														: prev.heightPct;
													heightPct = Math.max(MIN, heightPct);
													let widthPct = prev.widthPct;
													if (prev.lockAspectRatio === true) {
														const aspect =
															prev.heightPct / Math.max(0.0001, prev.widthPct);
														widthPct = Math.max(
															MIN,
															heightPct / Math.max(0.0001, aspect)
														);
													}
													return {
														...prev,
														...clampStickerToEditorBounds({
															xPct: prev.xPct,
															yPct: prev.yPct,
															widthPct,
															heightPct,
														}),
													};
												});
											}}
										/>
									</div>
								</div>
							</div>
						)}
					</aside>
				</section>
			</div>
		</main>
	);
}
