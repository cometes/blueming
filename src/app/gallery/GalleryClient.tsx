"use client";

import GalleryGrid from "./components/GalleryGrid";
import { dummyGalleryImages, type GalleryImage } from "./dummyData";

export default function GalleryClient() {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleImageClick = (_image: GalleryImage) => {
		// 추후 모달이나 상세 페이지로 이동 가능
	};

	return (
		<div className="w-full min-h-screen bg-background">
			{/* 헤더 */}
			<header className="text-center py-10">
				<h1 className="text-4xl font-bold tracking-wider text-main-text">
					갤러리
				</h1>
				<p className="text-sub-text mt-2">다양한 이미지를 감상해보세요</p>
			</header>

			{/* 갤러리 그리드 */}
			<GalleryGrid images={dummyGalleryImages} onImageClick={handleImageClick} />
		</div>
	);
}
