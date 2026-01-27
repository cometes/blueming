"use client";

import { memo, useState } from "react";
import { ImageOff } from "lucide-react";
import type { GalleryImage, GalleryImageRatio } from "@/types/gallery";
import { IMAGE_RATIO_VALUES } from "@/types/gallery";
import { cn } from "@/lib/utils";
import { dateConvert } from "@/lib/date";
import { Badge } from "@/components/ui/badge";

interface GalleryItemProps {
	image: GalleryImage;
	imageRatio?: GalleryImageRatio;
	showCaption?: boolean;
	onClick?: () => void;
}

function GalleryItem({
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
				"relative w-full overflow-hidden bg-card-bg group cursor-pointer rounded-card transform group-hover:scale-[1.01]",
				aspectClass,
			)}
			style={{ transition: "transform 250ms ease-out" }}
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
							"w-full h-full object-cover transform group-hover:scale-[1.04]",
							!isLoaded && "opacity-0",
							isLoaded && "opacity-100",
						)}
						style={{
							transition: "transform 400ms ease-out, opacity 300ms ease-out",
						}}
						onLoad={() => setIsLoaded(true)}
						onError={() => setIsError(true)}
					/>

					{/* 오버레이 */}
					{showCaption && (
						<div
							className="absolute inset-0 bg-black/0 group-hover:bg-black/50"
							style={{ transition: "background-color 300ms ease-out" }}
						>
							{/* 캡션 */}
							<div
								className="w-full h-full absolute bottom-0 left-0 opacity-0 group-hover:opacity-100 transform translate-y-0 p-2.5 flex flex-col-reverse justify-between"
								style={{
									transition:
										"opacity 300ms ease-out, transform 300ms ease-out",
								}}
							>
								{Array.isArray(image.tags) && image.tags.length > 0 && (
									<div>
										{image.title ? (
											<p className="text-sm font-semibold text-main-text font-title">
												{image.title}
											</p>
										) : null}
										<div className="flex flex-wrap gap-2 mt-1.5">
											{image.tags.slice(0, 2).map((tag, index) => (
												<Badge
													key={index}
													variant="secondary"
													className={cn(
														"text-xs font-medium rounded-full",
														"bg-theme-primary/10 text-theme-primary border-theme-primary/20",
														"hover:bg-theme-primary/20",
													)}
													style={{
														transition:
															"background-color 0.2s ease-in-out, color 0.2s ease-in-out, border-color 0.2s ease-in-out",
													}}
												>
													{tag}
												</Badge>
											))}
											{image.tags.length > 2 && (
												<Badge
													variant="outline"
													className="px-2.5 text-xs font-medium rounded-full text-sub-text border-sub-text"
												>
													+{image.tags.length - 2}
												</Badge>
											)}
										</div>
									</div>
								)}
								<div className="flex justify-end items-center relative z-20 mt-1.5">
									{image.createdAt ? (
										<span className="block whitespace-nowrap text-main-text text-sm">
											{dateConvert(image.createdAt)}
										</span>
									) : null}
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}

export default memo(GalleryItem);
