"use client";

import Image from "next/image";
import type { GalleryImage } from "../dummyData";

interface GalleryItemProps {
	image: GalleryImage;
	onClick?: () => void;
}

export default function GalleryItem({ image, onClick }: GalleryItemProps) {
	return (
		<div
			className="relative w-full h-[250px] overflow-hidden bg-white group cursor-pointer"
			onClick={onClick}
		>
			{/* 이미지 */}
			<img
				src={image.src}
				alt={image.title}
				className="w-full h-full object-cover transform transition-transform duration-[400ms] ease-out group-hover:scale-110"
			/>

			{/* 오버레이 */}
			<div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300">
				{/* 캡션 */}
				<div className="absolute bottom-5 left-5 opacity-0 group-hover:opacity-100 transform translate-y-0 group-hover:-translate-y-5 transition-all duration-300">
					<p className="text-white font-semibold text-lg tracking-wide">
						{image.title}
					</p>
					<p className="text-white/70 text-sm mt-1">{image.category}</p>
				</div>
			</div>
		</div>
	);
}
