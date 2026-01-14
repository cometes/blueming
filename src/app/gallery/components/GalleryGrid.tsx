"use client";

import GalleryItem from "./GalleryItem";
import type { GalleryImage } from "../dummyData";

interface GalleryGridProps {
	images: GalleryImage[];
	onImageClick?: (image: GalleryImage) => void;
}

export default function GalleryGrid({
	images,
	onImageClick,
}: GalleryGridProps) {
	return (
		<div className="flex flex-wrap justify-center gap-3 p-5">
			{images.map((image) => (
				<div
					key={image.id}
					className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[350px]"
				>
					<GalleryItem
						image={image}
						onClick={() => onImageClick?.(image)}
					/>
				</div>
			))}
		</div>
	);
}
