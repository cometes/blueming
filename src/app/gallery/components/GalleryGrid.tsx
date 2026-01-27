"use client";

import { memo, useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import GalleryItem from "./GalleryItem";
import type { GalleryImage } from "@/types/gallery";
import {
	type GallerySettings,
	DEFAULT_GALLERY_SETTINGS,
	getResponsiveColumns,
} from "@/types/gallery";
import { cn } from "@/lib/utils";

interface GalleryGridProps {
	images: GalleryImage[];
	settings?: GallerySettings;
	onImageClick?: (image: GalleryImage, index: number) => void;
	isLoading?: boolean;
}

function GalleryGrid({
	images,
	settings = DEFAULT_GALLERY_SETTINGS,
	onImageClick,
	isLoading = false,
}: GalleryGridProps) {
	const { layout, options } = settings;
	const { columns, gap, imageRatio, showCaption } = options;

	// 반응형 컬럼 계산
	const responsiveColumns = useMemo(
		() => getResponsiveColumns(columns),
		[columns],
	);

	// 정렬된 이미지
	const sortedImages = useMemo(() => {
		const sorted = [...images];
		if (settings.behavior.sortOrder === "oldest") {
			sorted.reverse();
		}
		return sorted;
	}, [images, settings.behavior.sortOrder]);

	// 아이템 클릭 핸들러 - 훅은 항상 최상위에서 호출
	const handleItemClick = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			const indexAttr = event.currentTarget.dataset.index;
			if (!indexAttr) return;
			const index = Number(indexAttr);
			const image = sortedImages[index];
			if (!image || !onImageClick) return;
			onImageClick(image, index);
		},
		[onImageClick, sortedImages],
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

	// 로딩 시 빈 상태 반환
	if (isLoading) {
		return null;
	}

	// 메이슨리 레이아웃
	if (layout === "masonry") {
		return (
			<div
				className={cn("w-full", masonryColumnsClass)}
				style={{ columnGap: `${gap}px` }}
			>
				{sortedImages.map((image, index) => (
					<div
						key={image.id}
						className="break-inside-avoid mb-4"
						style={{ marginBottom: `${gap}px` }}
						data-index={index}
						onClick={handleItemClick}
					>
						<GalleryItem
							image={image}
							imageRatio="original"
							showCaption={showCaption}
						/>
					</div>
				))}
			</div>
		);
	}

	// 그리드 레이아웃 (기본)
	return (
		<div
			className={cn("grid w-full", gridColumnsClass)}
			style={{ gap: `${gap}px` }}
		>
			{sortedImages.map((image, index) => (
				<div key={image.id} data-index={index} onClick={handleItemClick}>
					<GalleryItem
						image={image}
						imageRatio={imageRatio}
						showCaption={showCaption}
					/>
				</div>
			))}
		</div>
	);
}

export default memo(GalleryGrid);
