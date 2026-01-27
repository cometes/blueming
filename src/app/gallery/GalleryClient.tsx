"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
	const searchParams = useSearchParams();
	const { gallery, updateGallery, refreshSettings } = useSettings();
	const { isManagerOrAdmin } = useAdmin();

	// 설정 상태
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// 모달 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);

	// 딥링크 초기화 완료 플래그 - 최초 마운트 시 한 번만 처리
	const deepLinkInitialized = useRef(false);

	// 현재 설정 (Context에서 가져오거나 기본값 사용)
	const currentSettings: GallerySettings = useMemo(() => {
		if (gallery && Object.keys(gallery).length > 0) {
			return gallery as GallerySettings;
		}
		return DEFAULT_GALLERY_SETTINGS;
	}, [gallery]);

	// 이미지 데이터 (추후 API에서 가져올 수 있음)
	const images: GalleryImage[] = useMemo(() => dummyGalleryImages, []);

	// URL 업데이트 함수 (history API 사용, searchParams 트리거 방지)
	const updateUrlWithImageId = useCallback(
		(imageId: string | null) => {
			if (!currentSettings.behavior.enableDeepLink) return;

			const url = new URL(window.location.href);
			if (imageId) {
				url.searchParams.set("imgId", imageId);
			} else {
				url.searchParams.delete("imgId");
			}
			window.history.replaceState(null, "", url.pathname + url.search);
		},
		[currentSettings.behavior.enableDeepLink]
	);

	// 딥링크 처리 - 최초 마운트 시 한 번만 실행
	useEffect(() => {
		if (deepLinkInitialized.current) return;

		const imgId = searchParams.get("imgId");
		if (imgId && currentSettings.behavior.enableDeepLink) {
			const index = images.findIndex((img) => img.id === imgId);
			if (index !== -1) {
				setSelectedIndex(index);
				setIsModalOpen(true);
			}
		}
		deepLinkInitialized.current = true;
	}, [searchParams, images, currentSettings.behavior.enableDeepLink]);

	// 이미지 클릭 핸들러
	const handleImageClick = useCallback(
		(image: GalleryImage, index: number) => {
			setSelectedIndex(index);
			setIsModalOpen(true);
			updateUrlWithImageId(image.id);
		},
		[updateUrlWithImageId]
	);

	// 모달 닫기 핸들러
	const handleModalClose = useCallback(
		(open: boolean) => {
			setIsModalOpen(open);
			if (!open) {
				updateUrlWithImageId(null);
			}
		},
		[updateUrlWithImageId]
	);

	// 모달 인덱스 변경 핸들러 (모달 내부 네비게이션용)
	const handleIndexChange = useCallback(
		(index: number) => {
			setSelectedIndex(index);
			if (images[index]) {
				updateUrlWithImageId(images[index].id);
			}
		},
		[images, updateUrlWithImageId]
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
			<div className="mx-auto w-full max-w-[1400px] p-6 mt-10">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-sub-text">
							Gallery
						</p>
						<h1 className="text-3xl sm:text-4xl font-semibold text-main-text font-title mt-2">
							갤러리
						</h1>
						<p className="text-sub-text mt-2">
							좋아하는 순간들을 한눈에 감상해보세요.
						</p>
					</div>

					{/* 관리자 설정 버튼 */}
					{isManagerOrAdmin && (
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
									className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
								>
									<Settings className="h-5 w-5" />
								</Button>
							}
						/>
					)}
				</header>

				<section className="mt-8 rounded-card border-card bg-card p-4 sm:p-6">
					<GalleryGrid
						images={images}
						settings={currentSettings}
						onImageClick={handleImageClick}
					/>
				</section>
			</div>

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
