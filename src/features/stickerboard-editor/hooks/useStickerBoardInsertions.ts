"use client";

import { useCallback } from "react";
import { DEFAULT_TEXT_PADDING } from "@/lib/stickerboard-utils";
import type { StickerBoardComponent, StickerBoardTextComponent } from "@/types/stickerBoard";

interface UseStickerBoardInsertionsArgs {
	getNextZIndex: number;
	canvasRef: React.MutableRefObject<HTMLDivElement | null>;
	setComponentsDraft: React.Dispatch<React.SetStateAction<StickerBoardComponent[]>>;
	setSelectedId: React.Dispatch<React.SetStateAction<number | null>>;
	clampStickerToEditorBounds: (
		sticker: Pick<StickerBoardComponent, "xPct" | "yPct" | "widthPct" | "heightPct">,
	) => { xPct: number; yPct: number; widthPct: number; heightPct: number };
	computeAutoSizePct: (component: StickerBoardTextComponent) =>
		| { widthPct: number; heightPct: number }
		| null
		| undefined;
	commitHistoryBase: (base: StickerBoardComponent[] | null) => void;
	markAssetUsed: (assetId: string) => Promise<void>;
}

export function useStickerBoardInsertions({
	getNextZIndex,
	canvasRef,
	setComponentsDraft,
	setSelectedId,
	clampStickerToEditorBounds,
	computeAutoSizePct,
	commitHistoryBase,
	markAssetUsed,
}: UseStickerBoardInsertionsArgs) {
	const addTextStickerAt = useCallback(
		(opts?: {
			text?: string;
			xPct?: number;
			yPct?: number;
			centerXPct?: number;
			centerYPct?: number;
			historyBase?: StickerBoardComponent[] | null;
		}) => {
			const id = Date.now();
			const text = opts?.text?.trim() ? opts.text : "새 스티커";
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
				maxWidthPx: 420,
				paddingPx: DEFAULT_TEXT_PADDING,
				style: {
					textColor: "#1f2937",
					fontSize: 14,
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
					fontSize: 14,
					textAlign: "center",
				},
				autoSize: true,
				maxWidthPx: 420,
				paddingPx: DEFAULT_TEXT_PADDING,
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
		},
		[
			clampStickerToEditorBounds,
			commitHistoryBase,
			computeAutoSizePct,
			getNextZIndex,
			setComponentsDraft,
			setSelectedId,
		],
	);

	const addTextSticker = useCallback(() => {
		addTextStickerAt();
	}, [addTextStickerAt]);

	const addImageStickerAt = useCallback(
		async (opts: {
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
			let widthPct = 30;
			let heightPct = 30;
			const applyAspect = (w?: number, h?: number) => {
				if (!w || !h || w <= 0 || h <= 0) return;
				const rect = canvasRef.current?.getBoundingClientRect();
				const canvasRatio =
					rect && rect.width > 0 && rect.height > 0 ? rect.width / rect.height : 1;
				const aspect = h / w;
				heightPct = widthPct * aspect * canvasRatio;
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
				try {
					const image = new Image();
					image.crossOrigin = "anonymous";
					image.src = opts.url;
					try {
						await image.decode();
					} catch {
						await new Promise<void>((resolve, reject) => {
							image.onload = () => resolve();
							image.onerror = () => reject(new Error("failed to load image"));
						});
					}
					applyAspect(image.naturalWidth, image.naturalHeight);
				} catch {
					// fallback square
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
				void markAssetUsed(opts.assetId);
			}
		},
		[
			canvasRef,
			clampStickerToEditorBounds,
			commitHistoryBase,
			getNextZIndex,
			markAssetUsed,
			setComponentsDraft,
			setSelectedId,
		],
	);

	const addImageSticker = useCallback(
		async (url: string) => {
			await addImageStickerAt({ url, centerXPct: 50, centerYPct: 50 });
		},
		[addImageStickerAt],
	);

	return {
		addTextSticker,
		addTextStickerAt,
		addImageSticker,
		addImageStickerAt,
	};
}
