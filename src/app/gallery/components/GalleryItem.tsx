"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import type { GalleryImage, GalleryImageRatio } from "@/types/gallery";
import { IMAGE_RATIO_VALUES } from "@/types/gallery";
import { cn } from "@/lib/utils";

interface GalleryItemProps {
	image: GalleryImage;
	imageRatio?: GalleryImageRatio;
	showCaption?: boolean;
	onClick?: () => void;
}

export default function GalleryItem({
	image,
	imageRatio = "square",
	showCaption = true,
	onClick,
}: GalleryItemProps) {
	const [isError, setIsError] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	const aspectClass =
		imageRatio === "original"
			? ""
			: IMAGE_RATIO_VALUES[imageRatio] || "aspect-square";

	return (
		<div
			className={cn(
				"relative w-full overflow-hidden bg-card-bg group cursor-pointer rounded-lg",
				aspectClass
			)}
			onClick={onClick}
		>
			{/* 로딩 스켈레톤 */}
			{!isLoaded && !isError && (
				<div className="absolute inset-0 bg-card-bg animate-pulse" />
			)}

			{/* 이미지 에러 플레이스홀더 */}
			{isError ? (
				<div className="absolute inset-0 flex flex-col items-center justify-center bg-card-bg text-sub-text">
					<ImageOff size={32} className="mb-2 opacity-50" />
					<span className="text-xs">이미지를 불러올 수 없습니다</span>
				</div>
			) : (
				<>
					{/* 이미지 */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={image.src}
						alt={image.title}
						className={cn(
							"w-full h-full object-cover transform transition-transform duration-[400ms] ease-out group-hover:scale-110",
							!isLoaded && "opacity-0",
							isLoaded && "opacity-100"
						)}
						onLoad={() => setIsLoaded(true)}
						onError={() => setIsError(true)}
					/>

					{/* 오버레이 */}
					{showCaption && (
						<div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300">
							{/* 캡션 */}
							<div className="absolute bottom-5 left-5 opacity-0 group-hover:opacity-100 transform translate-y-0 group-hover:-translate-y-2 transition-all duration-300">
								<p className="text-white font-semibold text-lg tracking-wide line-clamp-1">
									{image.title}
								</p>
								<p className="text-white/70 text-sm mt-1 line-clamp-1">
									{image.category}
								</p>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
