export interface StickerBoardTextStyle {
	backgroundColor?: string;
	textColor?: string;
	fontSize?: number;
	fontWeight?: number | "normal" | "bold";
	fontFamily?: string;
	textAlign?: "left" | "center" | "right";
}

export const STICKER_ASSET_DND_MIME = "application/x-sticker-asset";

export type StickerAssetTab = "all" | "favorites" | "recent";

export interface StickerAsset {
	id: string;
	url: string;
	name?: string;
	width?: number;
	height?: number;
	favorite?: boolean;
	storagePath?: string;
	createdAtMs?: number;
	lastUsedAtMs?: number;
}

export interface StickerBoardComponentBase {
	id: number;
	zIndex: number;
	xPct: number;
	yPct: number;
	widthPct: number;
	heightPct: number;
	groupId?: string;
	groupRotationDeg?: number;
	groupCenterXPct?: number;
	groupCenterYPct?: number;
	isVisible?: boolean;
	isLocked?: boolean;
	rotation?: number;
	opacity?: number;
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

export interface StickerBoardGroupComponent extends StickerBoardComponentBase {
	type: "group";
	rotation?: number;
	children: StickerBoardLeafComponent[];
	name?: string;
}

export interface StickerBoardImageComponent extends StickerBoardComponentBase {
	type: "image";
	imageUrl: string;
	name?: string;
	imageFit?: "contain" | "cover";
}

export interface StickerBoardTextComponent extends StickerBoardComponentBase {
	type: "text";
	text: string;
	style?: StickerBoardTextStyle;
	autoSize?: boolean;
	maxWidthPx?: number;
	paddingPx?: { x: number; y: number };
}

export type StickerBoardLeafComponent =
	| StickerBoardImageComponent
	| StickerBoardTextComponent;

export type StickerBoardComponent =
	| StickerBoardGroupComponent
	| StickerBoardLeafComponent;

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
