"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Settings, X } from "lucide-react";
import { toast } from "sonner";
import GalleryGrid from "./components/GalleryGrid";
import GalleryImageModal from "@/features/gallery/components/GalleryImageModal";
import GallerySettingsDialog from "@/features/gallery/components/GallerySettingsDialog";
import GalleryCreateModal, {
	type GalleryCreatePayload,
} from "@/features/gallery/components/GalleryCreateModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/SettingsContext";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import type { GalleryImage, GallerySettings } from "@/features/gallery/types";
import { DEFAULT_GALLERY_SETTINGS } from "@/features/gallery/types";
import { createGalleryImage, deleteGalleryImage, fetchGalleryImages, updateGalleryImage } from "@/features/gallery/api/client";
import { useAuthStore } from "@/store/auth/store";
import { setSettingsGallery } from "@/features/settings/api/main";

export default function GalleryClient() {
	const searchParams = useSearchParams();
	const { gallery, updateGallery, refreshSettings } = useSettings();
	const { isAdmin, isManagerOrAdmin, isAuthenticated } = useAdmin();
	const user = useAuthStore((state) => state.user);

	// 설정 상태
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [isSaving, setIsSaving] = useState(false);

	// 모달 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

	// 딥링크 초기화 완료 플래그 - 최초 마운트 시 한 번만 처리
	const deepLinkInitialized = useRef(false);

	// 현재 설정 (Context에서 가져오거나 기본값 사용)
	const currentSettings: GallerySettings = useMemo(
		() => ({
			...DEFAULT_GALLERY_SETTINGS,
			...(gallery ?? {}),
			options: {
				...DEFAULT_GALLERY_SETTINGS.options,
				...(gallery?.options ?? {}),
				columns: Math.min(
					Math.max(Number(gallery?.options?.columns ?? DEFAULT_GALLERY_SETTINGS.options.columns), 1),
					5,
				),
			},
			behavior: {
				...DEFAULT_GALLERY_SETTINGS.behavior,
				...(gallery?.behavior ?? {}),
			},
		}),
		[gallery],
	);

	// 이미지 데이터 (추후 API에서 가져올 수 있음)
	const [images, setImages] = useState<GalleryImage[]>([]);
	const [searchInput, setSearchInput] = useState("");
	const [appliedQuery, setAppliedQuery] = useState("");
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const tagOptions = useMemo(() => {
		const tags = images.flatMap((image) =>
			Array.isArray(image.tags) ? image.tags : [],
		);
		return Array.from(
			new Set(tags.map((tag) => tag.trim()).filter((tag) => Boolean(tag))),
		);
	}, [images]);

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
		[currentSettings.behavior.enableDeepLink],
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
		[updateUrlWithImageId],
	);

	// 모달 닫기 핸들러
	const handleModalClose = useCallback(
		(open: boolean) => {
			setIsModalOpen(open);
			if (!open) {
				updateUrlWithImageId(null);
			}
		},
		[updateUrlWithImageId],
	);

	// 모달 인덱스 변경 핸들러 (모달 내부 네비게이션용)
	const handleIndexChange = useCallback(
		(index: number) => {
			setSelectedIndex(index);
			if (images[index]) {
				updateUrlWithImageId(images[index].id);
			}
		},
		[images, updateUrlWithImageId],
	);

	// 설정 저장 핸들러
	const handleSaveSettings = async (newSettings: GallerySettings) => {
		try {
			setIsSaving(true);

			// API 호출하여 설정 저장
			await setSettingsGallery(newSettings);

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

	const loadGalleryImages = useCallback(
		(query: string) => {
			let isActive = true;
			fetchGalleryImages({
				query,
				sort: currentSettings.behavior?.sortOrder ?? "latest",
				page: 1,
				limit: 24,
			})
				.then((data) => {
					if (!isActive) return;
					setImages(Array.isArray(data.items) ? data.items : []);
				})
				.catch(() => {
					if (!isActive) return;
					toast.error("갤러리 데이터를 불러오지 못했습니다.");
					setImages([]);
				});
			return () => {
				isActive = false;
			};
		},
		[currentSettings.behavior?.sortOrder],
	);

	useEffect(() => {
		const cleanup = loadGalleryImages(appliedQuery.trim());
		return () => cleanup?.();
	}, [appliedQuery, loadGalleryImages]);

	const filteredImages = useMemo(() => images, [images]);

	const handleCreateSubmit = useCallback(
		async (payload: GalleryCreatePayload) => {
			try {
				const created = await createGalleryImage({
					title: payload.title,
					imageUrl: payload.imageUrl,
					tags: payload.tags,
				});
				setImages((prev) => [created, ...prev]);
				toast.success("갤러리 이미지가 추가되었습니다.");
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "갤러리 이미지 등록에 실패했습니다.";
				toast.error(message);
			}
		},
		[],
	);
	const handleEditSubmit = useCallback(
		async (payload: GalleryCreatePayload) => {
			if (!editingImage) return;
			try {
				const updated = await updateGalleryImage(editingImage.id, {
					title: payload.title,
					imageUrl: payload.imageUrl,
					tags: payload.tags,
				});
				setImages((prev) => prev.map((img) => (img.id === editingImage.id ? { ...img, ...updated } : img)));
				setEditingImage(null);
				toast.success("이미지가 수정되었습니다.");
			} catch (error) {
				const message = error instanceof Error ? error.message : "수정에 실패했습니다.";
				toast.error(message);
			}
		},
		[editingImage],
	);

	const handleDeleteImage = useCallback(
		async (image: GalleryImage) => {
			if (!window.confirm("이미지를 삭제하시겠습니까?")) return;
			try {
				await deleteGalleryImage(image.id);
				setImages((prev) => prev.filter((img) => img.id !== image.id));
				setIsModalOpen(false);
				toast.success("이미지가 삭제되었습니다.");
			} catch (error) {
				const message = error instanceof Error ? error.message : "삭제에 실패했습니다.";
				toast.error(message);
			}
		},
		[],
	);

	const canManageImage = useCallback(
		(image: GalleryImage) => isAdmin || (user?.uid != null && user.uid === image.authorId),
		[isAdmin, user?.uid],
	);

	const canWrite =
		currentSettings.writePermission === "admin"
			? isAdmin
			: currentSettings.writePermission === "manager"
				? isManagerOrAdmin
				: isAuthenticated;

	return (
		<div className="w-full max-w-full md:max-w-2xl mt-[90px] mb-[40px] mx-auto md:px-0">
			<header className="mb-15 flex items-center justify-center">
				<div className="flex justify-center items-center gap-2 w-full sm:w-auto">
					{currentSettings.writePermission === "admin" && isAdmin ? (
						<div className="w-[150px]"></div>
					) : null}
					<div className="w-[200px]">
						<Input
							className="border-card bg-card backdrop-blur-card rounded-card text-main-text"
							endIcon={searchInput ? X : Search}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="태그로 검색"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									setAppliedQuery(searchInput.trim());
								}
							}}
							onEndIconClick={
								searchInput
									? () => {
											setSearchInput("");
											setAppliedQuery("");
										}
									: undefined
							}
							endIconAriaLabel="검색어 지우기"
						/>
					</div>
					{isManagerOrAdmin && (
						<GallerySettingsDialog
							isOpen={isSettingsOpen}
							onOpenChange={setIsSettingsOpen}
							settings={currentSettings}
							onSave={handleSaveSettings}
							trigger={
								<Button className="bg-card border-card text-main-text rounded-full w-10 h-10 hover:border-transparent">
									<Settings />
								</Button>
							}
						/>
					)}
					{canWrite ? (
						<Button
							type="button"
							onClick={() => setIsCreateOpen(true)}
							className="gap-2 bg-theme-primary text-white hover:bg-theme-primary/90"
						>
							<Plus size={16} />새 글쓰기
						</Button>
					) : null}
				</div>
			</header>

			<section>
				<GalleryGrid
					images={filteredImages}
					settings={currentSettings}
					onImageClick={handleImageClick}
				/>
			</section>

			{/* 이미지 모달 */}
			<GalleryImageModal
				isOpen={isModalOpen}
				onOpenChange={handleModalClose}
				images={filteredImages}
				initialIndex={selectedIndex}
				onIndexChange={handleIndexChange}
				canManage={canManageImage}
				onEdit={(image) => { setEditingImage(image); setIsCreateOpen(true); }}
				onDelete={handleDeleteImage}
			/>

			<GalleryCreateModal
				isOpen={isCreateOpen}
				onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setEditingImage(null); }}
				onSubmit={editingImage ? handleEditSubmit : handleCreateSubmit}
				tagsOptions={tagOptions}
				editingId={editingImage?.id}
				initialValues={editingImage ? { title: editingImage.title, imageUrl: editingImage.src, tags: editingImage.tags ?? [] } : undefined}
			/>
		</div>
	);
}
