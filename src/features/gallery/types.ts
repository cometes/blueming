export type GalleryLayoutType = "grid" | "masonry";

export type GalleryImageRatio =
	| "square"
	| "original"
	| "landscape"
	| "portrait";

export type GallerySortOrder = "latest" | "oldest";

export interface GallerySettings {
	layout: GalleryLayoutType;
	writePermission: "admin" | "manager" | "member";
	options: {
		columns: number;
		gap: number;
		imageRatio: GalleryImageRatio;
		showCaption: boolean;
	};
	behavior: {
		sortOrder: GallerySortOrder;
		enableDeepLink: boolean;
	};
}

export interface GalleryImage {
	id: string;
	src: string;
	title: string;
	category: string;
	description?: string;
	tags?: string[];
	width?: number;
	height?: number;
	createdAt?: string;
}

export function getResponsiveColumns(desktopColumns: number): {
	desktop: number;
	tablet: number;
	mobile: number;
} {
	const clampedDesktop = Math.min(Math.max(Math.floor(desktopColumns), 1), 5);
	const columnMap: Record<number, { tablet: number; mobile: number }> = {
		5: { tablet: 3, mobile: 2 },
		4: { tablet: 3, mobile: 2 },
		3: { tablet: 2, mobile: 1 },
		2: { tablet: 2, mobile: 1 },
		1: { tablet: 1, mobile: 1 },
	};

	const responsive = columnMap[clampedDesktop] || { tablet: 2, mobile: 1 };

	return {
		desktop: clampedDesktop,
		tablet: responsive.tablet,
		mobile: responsive.mobile,
	};
}

export const DEFAULT_GALLERY_SETTINGS: GallerySettings = {
	layout: "grid",
	writePermission: "member",
	options: {
		columns: 4,
		gap: 16,
		imageRatio: "square",
		showCaption: true,
	},
	behavior: {
		sortOrder: "latest",
		enableDeepLink: true,
	},
};

export const IMAGE_RATIO_VALUES: Record<GalleryImageRatio, string> = {
	square: "aspect-square",
	original: "aspect-auto",
	landscape: "aspect-video",
	portrait: "aspect-[3/4]",
};
