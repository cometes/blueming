import type {
	StickerBoardComponent,
	StickerBoardGroupComponent,
	StickerBoardImageComponent,
	StickerBoardTextComponent,
} from "@/types/stickerBoard";

export const isTextSticker = (
	component: StickerBoardComponent
): component is StickerBoardTextComponent =>
	(component as StickerBoardTextComponent).type === "text";

export const isImageSticker = (
	component: StickerBoardComponent
): component is StickerBoardImageComponent =>
	(component as StickerBoardImageComponent).type === "image";

export const isGroupSticker = (
	component: StickerBoardComponent
): component is StickerBoardGroupComponent =>
	(component as StickerBoardGroupComponent).type === "group";

type PctSticker = Extract<StickerBoardComponent, { xPct: number }>;

export const isPctSticker = (
	component: StickerBoardComponent
): component is PctSticker =>
	typeof (component as { xPct?: unknown }).xPct === "number";

export const clamp = (value: number, min: number, max: number) =>
	Math.max(min, Math.min(max, value));

// NOTE: 캔버스 밖으로 자유롭게 나갈 수 있도록 x/y는 clamp 하지 않습니다.
// size만 최소값을 보장하고 NaN/Infinity를 방지합니다.
export const normalizeStickerSize = (
	sticker: Pick<StickerBoardComponent, "xPct" | "yPct" | "widthPct" | "heightPct">
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

/**
 * Inner canvas 밖으로는 나갈 수 있지만, 바깥 bounds(1029 컨테이너) 밖으로는 못 나가게 제한
 * x/y는 canvasRef 기준 %로 저장되어 있으므로, boundsRect를 canvasRect로 환산해서 clamp합니다.
 */
export const clampStickerToEditorBounds = (
	sticker: Pick<StickerBoardComponent, "xPct" | "yPct" | "widthPct" | "heightPct">,
	opts: { canvas: HTMLDivElement | null; bounds: HTMLDivElement | null }
) => {
	const next = normalizeStickerSize(sticker);
	const canvas = opts.canvas;
	const bounds = opts.bounds;
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

export const cloneDraft = (draft: StickerBoardComponent[]) => {
	// safe enough for plain JSON-ish objects
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const g: any = globalThis as any;
	if (typeof g.structuredClone === "function") return g.structuredClone(draft);
	return JSON.parse(JSON.stringify(draft)) as StickerBoardComponent[];
};

export const DEFAULT_TEXT_PADDING = { x: 4, y: 4 };
export const DEFAULT_TEXT_MAX_WIDTH_PX = 280;

export const measureTextStickerPx = (opts: {
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

export const computeAutoSizePct = (
	component: StickerBoardTextComponent,
	opts: {
		canvas: HTMLDivElement | null;
		paddingPx?: { x: number; y: number };
		maxWidthPx?: number;
	}
) => {
	const canvas = opts.canvas;
	if (!canvas) return null;
	const rect = canvas.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) return null;

	const paddingPx = component.paddingPx ?? opts.paddingPx ?? DEFAULT_TEXT_PADDING;
	const maxWidthPx =
		component.maxWidthPx ?? opts.maxWidthPx ?? DEFAULT_TEXT_MAX_WIDTH_PX;
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
