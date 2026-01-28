"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
	DEFAULT_GALLERY_SETTINGS,
	getResponsiveColumns,
} from "@/types/gallery";
import { cn } from "@/lib/utils";

function GallerySkeleton() {
	const { gallery } = useSettings();
	const settings = useMemo(() => {
		if (gallery && Object.keys(gallery).length > 0) {
			return gallery;
		}
		return DEFAULT_GALLERY_SETTINGS;
	}, [gallery]);

	const responsiveColumns = useMemo(
		() => getResponsiveColumns(settings.options.columns),
		[settings.options.columns],
	);

	const gridColumnsClass =
		{
			1: "grid-cols-1 sm:grid-cols-1 lg:grid-cols-1",
			2: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-2",
			3: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3",
			4: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-4",
			5: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5",
			6: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6",
		}[responsiveColumns.desktop] ?? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

	const masonryColumnsClass =
		{
			1: "columns-1 sm:columns-1 lg:columns-1",
			2: "columns-1 sm:columns-2 lg:columns-2",
			3: "columns-1 sm:columns-2 lg:columns-3",
			4: "columns-1 sm:columns-2 lg:columns-4",
			5: "columns-1 sm:columns-3 lg:columns-5",
			6: "columns-1 sm:columns-3 lg:columns-6",
		}[responsiveColumns.desktop] ?? "columns-1 sm:columns-2 lg:columns-4";

	const itemCount = 12;
	return (
		<div className="w-full max-w-[900px] mt-[90px] mb-[90px]">
			<header className="mb-10 flex items-center justify-center">
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<div className="w-[150px]" />
					<div className="w-full sm:w-[200px]">
						<div className="h-10 bg-card animate-pulse rounded-card" />
					</div>
					<div className="h-10 w-10 bg-card animate-pulse rounded-full" />
					<div className="h-10 w-24 bg-card animate-pulse rounded-card" />
				</div>
			</header>

			<section>
				{settings.layout === "masonry" ? (
					<div
						className={cn("w-full", masonryColumnsClass)}
						style={{ columnGap: `${settings.options.gap}px` }}
					>
						{Array.from({ length: itemCount }).map((_, index) => (
							<div
								key={index}
								className="break-inside-avoid"
								style={{ marginBottom: `${settings.options.gap}px` }}
							>
								<div className="aspect-square bg-card animate-pulse rounded-card" />
							</div>
						))}
					</div>
				) : (
					<div
						className={cn("grid w-full", gridColumnsClass)}
						style={{ gap: `${settings.options.gap}px` }}
					>
						{Array.from({ length: itemCount }).map((_, index) => (
							<div
								key={index}
								className="aspect-square bg-card animate-pulse rounded-card"
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
}

const GalleryClient = dynamic(() => import("./GalleryClient"), {
	ssr: false,
	loading: () => <GallerySkeleton />,
});

export default function GalleryPageClient() {
	return <GalleryClient />;
}
