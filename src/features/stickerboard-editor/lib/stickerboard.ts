import type { StickerBoardComponentBase } from "@/features/stickerboard-editor/model";

export const STICKERBOARD_GRID_BASE = 12;

export const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

/**
 * Fit a saved (w,h) into a 12x12 grid while preserving aspect ratio,
 * maximizing size: scale = min(12/w, 12/h).
 *
 * Example: 3x2 -> 12x8, 2x3 -> 8x12
 */
export const fitToGrid12 = (w: number, h: number) => {
	const safeW = Math.max(1, w);
	const safeH = Math.max(1, h);
	const scale = Math.min(STICKERBOARD_GRID_BASE / safeW, STICKERBOARD_GRID_BASE / safeH);
	return {
		w: clamp(Math.round(safeW * scale), 1, STICKERBOARD_GRID_BASE),
		h: clamp(Math.round(safeH * scale), 1, STICKERBOARD_GRID_BASE),
	};
};

export const pctToPx = (pct: number, sizePx: number) => (sizePx * pct) / 100;

export const clampPct = (pct: number) => clamp(pct, 0, 100);

export const clampStickerPctBounds = (
	sticker: Pick<StickerBoardComponentBase, "xPct" | "yPct" | "widthPct" | "heightPct">
) => {
	const widthPct = clampPct(sticker.widthPct);
	const heightPct = clampPct(sticker.heightPct);
	return {
		xPct: clamp(sticker.xPct, 0, Math.max(0, 100 - widthPct)),
		yPct: clamp(sticker.yPct, 0, Math.max(0, 100 - heightPct)),
		widthPct,
		heightPct,
	};
};
