export interface StickerBoardTextStyle {
	backgroundColor?: string; // e.g. "#FFE27A"
	textColor?: string; // e.g. "#1f2937"
	fontSize?: number; // px
	fontWeight?: number | "normal" | "bold";
	fontFamily?: string;
	textAlign?: "left" | "center" | "right";
}

/** Drag payload MIME for StickerBoard image asset -> canvas drop */
export const STICKER_ASSET_DND_MIME = "application/x-sticker-asset";

export type StickerAssetTab = "all" | "favorites" | "recent";

export interface StickerAsset {
	id: string;
	url: string;
	/** original filename or user-defined label */
	name?: string;
	width?: number;
	height?: number;
	favorite?: boolean;
	/** Storage object path (used for deletion) */
	storagePath?: string;
	/** epoch ms (converted from Firestore Timestamp) */
	createdAtMs?: number;
	/** epoch ms (converted from Firestore Timestamp) */
	lastUsedAtMs?: number;
}

export interface StickerBoardComponentBase {
	id: number;
	zIndex: number;
	/** percent-based coordinates relative to the canvas (0~100) */
	xPct: number;
	yPct: number;
	widthPct: number;
	heightPct: number;
	/** persistent group id (Cmd/Ctrl+G) */
	groupId?: string;
	/** persistent group rotation in degrees (shared across the same groupId) */
	groupRotationDeg?: number;
	/** persistent group pivot/center (shared across the same groupId) */
	groupCenterXPct?: number;
	groupCenterYPct?: number;
	isVisible?: boolean;
	isLocked?: boolean;
	rotation?: number;
	opacity?: number;
	/** CSS mix-blend-mode */
	blendMode?:
		| "normal"
		| "multiply"
		| "screen"
		| "overlay"
		| "darken"
		| "lighten"
		| "color-dodge"
		| "color-burn"
		| "hard-light"
		| "soft-light"
		| "difference"
		| "exclusion"
		| "hue"
		| "saturation"
		| "color"
		| "luminosity"
		| "plus-lighter";
	flipX?: boolean;
	flipY?: boolean;
	lockAspectRatio?: boolean;
}

/**
 * NOTE: group children are stored in the group's local coordinate space:
 * - xPct/yPct/widthPct/heightPct are 0~100 relative to the group box.
 * - Nested groups are intentionally not supported (per UX spec).
 */
export interface StickerBoardGroupComponent extends StickerBoardComponentBase {
	type: "group";
	/** group transform in world(canvas) space */
	rotation?: number;
	/** group children (no nested groups) */
	children: StickerBoardLeafComponent[];
	/** optional UI name */
	name?: string;
}

export interface StickerBoardImageComponent extends StickerBoardComponentBase {
	type: "image";
	imageUrl: string;
	imageFit?: "contain" | "cover";
}

export interface StickerBoardTextComponent extends StickerBoardComponentBase {
	type: "text";
	text: string; // plain text (supports line breaks)
	style?: StickerBoardTextStyle;
	/** if true (default), editor auto-resizes the sticker box to fit text */
	autoSize?: boolean;
	/** max width constraint used by editor for autosize calculation (px) */
	maxWidthPx?: number;
	/** padding used by editor + renderer to make box breathe (px) */
	paddingPx?: { x: number; y: number };
}

export type StickerBoardLeafComponent = StickerBoardImageComponent | StickerBoardTextComponent;

export type StickerBoardComponent = StickerBoardGroupComponent | StickerBoardLeafComponent;

export interface StickerBoardSettings {
	enabled?: boolean;
	title?: string;
	description?: string;
	maxStickers?: number;
	allowGuest?: boolean;
	content?: string;
	capture?: string;
	components?: StickerBoardComponent[];
}
