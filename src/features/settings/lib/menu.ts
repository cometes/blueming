import type { StickerAsset } from "@/types/stickerBoard";

export const INPUT_HEIGHT = "h-9";
export const ICON_SIZE = 28;
export const ICON_COLOR = "#9BA2A8";
export const UPLOAD_TEXT = "Upload Image";
export const ICON_BAR_WIDTH = 88;

export type ImageFieldType =
	| "logo"
	| "background"
	| "iconBarLogo"
	| "iconBarBackground";

export interface PendingImage {
	file: File;
	previewUrl: string;
}

export interface MenuImageManagerState {
	pendingImages: Record<ImageFieldType, PendingImage | null>;
	activeImageField: ImageFieldType | null;
	dialogThumbnail: string;
	imageSource: "file" | "asset" | "existing" | null;
	assets: StickerAsset[];
	assetsLoading: boolean;
	assetsError: string | null;
	assetSearchQuery: string;
}

