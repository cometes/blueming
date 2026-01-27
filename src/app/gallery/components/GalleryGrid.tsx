"use client";

import { useMemo } from "react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { motion } from "framer-motion";
import GalleryItem from "./GalleryItem";
import type { GalleryImage } from "@/types/gallery";
import {
	type GallerySettings,
	DEFAULT_GALLERY_SETTINGS,
	getResponsiveColumns,
} from "@/types/gallery";

interface GalleryGridProps {
	images: GalleryImage[];
	settings?: GallerySettings;
	onImageClick?: (image: GalleryImage, index: number) => void;
	isLoading?: boolean;
}

export default function GalleryGrid({
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
		[columns]
	);

	// 정렬된 이미지
	const sortedImages = useMemo(() => {
		const sorted = [...images];
		if (settings.behavior.sortOrder === "oldest") {
			sorted.reverse();
		}
		return sorted;
	}, [images, settings.behavior.sortOrder]);

	// 로딩 스켈레톤
	if (isLoading) {
		return (
			<div
				className="grid w-full p-5"
				style={{
					gridTemplateColumns: `repeat(${columns}, 1fr)`,
					gap: `${gap}px`,
				}}
			>
				{Array.from({ length: 12 }).map((_, index) => (
					<div
						key={index}
						className="aspect-square bg-card-bg animate-pulse rounded-lg"
					/>
				))}
			</div>
		);
	}

	// 메이슨리 레이아웃
	if (layout === "masonry") {
		return (
			<div className="w-full p-5">
				<ResponsiveMasonry
					columnsCountBreakPoints={{
						350: responsiveColumns.mobile,
						750: responsiveColumns.tablet,
						1024: responsiveColumns.desktop,
					}}
				>
					<Masonry gutter={`${gap}px`}>
						{sortedImages.map((image, index) => (
							<motion.div
								key={image.id}
								layout
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.3, delay: index * 0.05 }}
							>
								<GalleryItem
									image={image}
									imageRatio="original"
									showCaption={showCaption}
									onClick={() => onImageClick?.(image, index)}
								/>
							</motion.div>
						))}
					</Masonry>
				</ResponsiveMasonry>
			</div>
		);
	}

	// 그리드 레이아웃 (기본)
	return (
		<div className="w-full p-5">
			<div
				className="grid w-full"
				style={{
					gridTemplateColumns: `repeat(${responsiveColumns.desktop}, 1fr)`,
					gap: `${gap}px`,
				}}
			>
				{sortedImages.map((image, index) => (
					<motion.div
						key={image.id}
						layout
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: index * 0.05 }}
						className="sm:block hidden"
						style={{
							gridColumn:
								index < responsiveColumns.desktop ? "auto" : undefined,
						}}
					>
						<GalleryItem
							image={image}
							imageRatio={imageRatio}
							showCaption={showCaption}
							onClick={() => onImageClick?.(image, index)}
						/>
					</motion.div>
				))}
			</div>

			{/* 모바일/태블릿 반응형 그리드 */}
			<div
				className="grid sm:hidden"
				style={{
					gridTemplateColumns: `repeat(${responsiveColumns.mobile}, 1fr)`,
					gap: `${gap}px`,
				}}
			>
				{sortedImages.map((image, index) => (
					<motion.div
						key={image.id}
						layout
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.3, delay: index * 0.05 }}
					>
						<GalleryItem
							image={image}
							imageRatio={imageRatio}
							showCaption={showCaption}
							onClick={() => onImageClick?.(image, index)}
						/>
					</motion.div>
				))}
			</div>
		</div>
	);
}
