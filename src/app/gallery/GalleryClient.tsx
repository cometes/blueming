"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import GalleryGrid from "./components/GalleryGrid";
import GalleryImageModal from "@/components/modal/GalleryImageModal";
import GallerySettingsDialog from "@/components/modal/GallerySettingsDialog";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import { dummyGalleryImages } from "./dummyData";
import type { GalleryImage, GallerySettings } from "@/types/gallery";
import { DEFAULT_GALLERY_SETTINGS } from "@/types/gallery";
import { apiClient } from "@/queries/apiClient";

export default function GalleryClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { gallery, updateGallery, refreshSettings } = useSettings();
	const { isManagerOrAdmin } = useAdmin();

	// 설정 상태
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// 모달 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);

	// 현재 설정 (Context에서 가져오거나 기본값 사용)
	const currentSettings: GallerySettings = useMemo(() => {
		if (gallery && Object.keys(gallery).length > 0) {
			return gallery as GallerySettings;
		}
		return DEFAULT_GALLERY_SETTINGS;
	}, [gallery]);

	// 이미지 데이터 (추후 API에서 가져올 수 있음)
	const images: GalleryImage[] = dummyGalleryImages;

	// 딥링크 처리 - URL에서 이미지 ID 확인
	useEffect(() => {
		const imgId = searchParams.get("imgId");
		if (imgId && currentSettings.behavior.enableDeepLink) {
			const index = images.findIndex((img) => img.id === imgId);
			if (index !== -1) {
				setSelectedIndex(index);
				setIsModalOpen(true);
			}
		}
	}, [searchParams, images, currentSettings.behavior.enableDeepLink]);

	// 이미지 클릭 핸들러
	const handleImageClick = useCallback(
		(image: GalleryImage, index: number) => {
			setSelectedIndex(index);
			setIsModalOpen(true);

			// 딥링크 URL 업데이트
			if (currentSettings.behavior.enableDeepLink) {
				const url = new URL(window.location.href);
				url.searchParams.set("imgId", image.id);
				router.replace(url.pathname + url.search, { scroll: false });
			}
		},
		[currentSettings.behavior.enableDeepLink, router]
	);

	// 모달 닫기 핸들러
	const handleModalClose = useCallback(
		(open: boolean) => {
			setIsModalOpen(open);
			if (!open && currentSettings.behavior.enableDeepLink) {
				// URL에서 imgId 제거
				const url = new URL(window.location.href);
				url.searchParams.delete("imgId");
				router.replace(url.pathname + url.search, { scroll: false });
			}
		},
		[currentSettings.behavior.enableDeepLink, router]
	);

	// 모달 인덱스 변경 핸들러
	const handleIndexChange = useCallback(
		(index: number) => {
			setSelectedIndex(index);
			if (currentSettings.behavior.enableDeepLink && images[index]) {
				const url = new URL(window.location.href);
				url.searchParams.set("imgId", images[index].id);
				router.replace(url.pathname + url.search, { scroll: false });
			}
		},
		[currentSettings.behavior.enableDeepLink, images, router]
	);

	// 설정 저장 핸들러
	const handleSaveSettings = async (newSettings: GallerySettings) => {
		try {
			setIsSaving(true);

			// API 호출하여 설정 저장
			await apiClient.patch("/settings", {
				gallery: newSettings,
			});

			// Context 업데이트
			if (updateGallery) {
				updateGallery(newSettings);
			}

			// 설정 새로고침
			if (refreshSettings) {
				await refreshSettings({ broadcast: true });
			}

			toast.success("설정이 저장되었습니다");
		} catch (error) {
			console.error("설정 저장 실패:", error);
			toast.error("설정 저장에 실패했습니다");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="w-full min-h-screen bg-background">
			{/* 헤더 */}
			<header className="text-center py-10 relative">
				<h1 className="text-4xl font-bold tracking-wider text-main-text font-title">
					갤러리
				</h1>
				<p className="text-sub-text mt-2">다양한 이미지를 감상해보세요</p>

				{/* 관리자 설정 버튼 */}
				{isManagerOrAdmin && (
					<div className="absolute right-5 top-10">
						<GallerySettingsDialog
							isOpen={isSettingsOpen}
							onOpenChange={setIsSettingsOpen}
							settings={currentSettings}
							onSave={handleSaveSettings}
							trigger={
								<Button
									variant="ghost"
									size="icon"
									disabled={isSaving}
									className="text-sub-text hover:text-main-text"
								>
									<Settings className="h-5 w-5" />
								</Button>
							}
						/>
					</div>
				)}
			</header>

			{/* 갤러리 그리드 */}
			<GalleryGrid
				images={images}
				settings={currentSettings}
				onImageClick={handleImageClick}
			/>

			{/* 이미지 모달 */}
			<GalleryImageModal
				isOpen={isModalOpen}
				onOpenChange={handleModalClose}
				images={images}
				initialIndex={selectedIndex}
				onIndexChange={handleIndexChange}
			/>
		</div>
	);
}
