import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { listStickerAssets } from "@/features/stickerboard-editor/api/assets";
import type { StickerAsset } from "@/types/stickerBoard";
import type { MenuDesign } from "@/features/settings/types";
import type { ImageFieldType, PendingImage } from "@/features/settings/lib/menu";

const EMPTY_PENDING_IMAGES: Record<ImageFieldType, PendingImage | null> = {
	logo: null,
	background: null,
	iconBarLogo: null,
	iconBarBackground: null,
};

interface UseMenuImageManagerArgs {
	menuDesign: MenuDesign;
	uploadFile: (file: File) => Promise<string>;
	updateMenuSetting: (path: string, value: string) => void;
}

export const useMenuImageManager = ({
	menuDesign,
	uploadFile,
	updateMenuSetting,
}: UseMenuImageManagerArgs) => {
	const [pendingImages, setPendingImages] = useState<
		Record<ImageFieldType, PendingImage | null>
	>(EMPTY_PENDING_IMAGES);
	const [activeImageField, setActiveImageField] =
		useState<ImageFieldType | null>(null);
	const [dialogThumbnail, setDialogThumbnail] = useState("");
	const [imageSource, setImageSource] = useState<
		"file" | "asset" | "existing" | null
	>(null);
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [assetsLoading, setAssetsLoading] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);
	const [assetSearchQuery, setAssetSearchQuery] = useState("");

	const hasPendingImages = useMemo(
		() => Object.values(pendingImages).some((img) => img !== null),
		[pendingImages],
	);

	const refreshAssets = useCallback(async () => {
		try {
			setAssetsLoading(true);
			setAssetsError(null);
			const list = await listStickerAssets("all");
			setAssets(list);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "에셋을 불러오지 못했습니다.";
			setAssetsError(message);
		} finally {
			setAssetsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!activeImageField) return;
		void refreshAssets();
	}, [activeImageField, refreshAssets]);

	useEffect(() => {
		return () => {
			Object.values(pendingImages).forEach((img) => {
				if (img) URL.revokeObjectURL(img.previewUrl);
			});
		};
	}, [pendingImages]);

	const handleFileSelect = useCallback((field: ImageFieldType, file: File) => {
		const previewUrl = URL.createObjectURL(file);
		setPendingImages((prev) => ({
			...prev,
			[field]: { file, previewUrl },
		}));
	}, []);

	const handleImageClear = useCallback(
		(field: ImageFieldType) => {
			if (pendingImages[field]) {
				URL.revokeObjectURL(pendingImages[field]!.previewUrl);
				setPendingImages((prev) => ({
					...prev,
					[field]: null,
				}));
			}

			switch (field) {
				case "logo":
					updateMenuSetting("logo.image", "");
					break;
				case "background":
					updateMenuSetting("background.image", "");
					break;
				case "iconBarLogo":
					updateMenuSetting("iconbar.logo.image", "");
					break;
				case "iconBarBackground":
					updateMenuSetting("iconbar.background.image", "");
					break;
			}
		},
		[pendingImages, updateMenuSetting],
	);

	const handleOpenImageDialog = useCallback(
		(field: ImageFieldType) => {
			const pendingPreview = pendingImages[field]?.previewUrl || "";
			let currentValue = "";

			switch (field) {
				case "logo":
					currentValue = menuDesign.logoImage || "";
					break;
				case "background":
					currentValue = menuDesign.backgroundImage || "";
					break;
				case "iconBarLogo":
					currentValue = menuDesign.iconBarLogoImage || "";
					break;
				case "iconBarBackground":
					currentValue = menuDesign.iconBarBackgroundImage || "";
					break;
			}

			const current = pendingPreview || currentValue || "";
			setDialogThumbnail(current);
			if (pendingPreview) setImageSource("file");
			else if (currentValue) setImageSource("existing");
			else setImageSource(null);
			setActiveImageField(field);
		},
		[menuDesign, pendingImages],
	);

	const handleImageFileSelect = useCallback(
		(file: File, previewUrl: string) => {
			if (!activeImageField) return;
			if (pendingImages[activeImageField]) {
				URL.revokeObjectURL(pendingImages[activeImageField]!.previewUrl);
			}
			setPendingImages((prev) => ({
				...prev,
				[activeImageField]: { file, previewUrl },
			}));
			setDialogThumbnail(previewUrl);
			setImageSource("file");
		},
		[activeImageField, pendingImages],
	);

	const handleSelectAsset = useCallback((asset: StickerAsset) => {
		setDialogThumbnail(asset.url);
		setImageSource("asset");
	}, []);

	const handleImageDialogConfirm = useCallback(
		(selectedUrl: string) => {
			if (!activeImageField) return;

			if (imageSource === "asset" && selectedUrl) {
				if (pendingImages[activeImageField]) {
					URL.revokeObjectURL(pendingImages[activeImageField]!.previewUrl);
				}
				setPendingImages((prev) => ({ ...prev, [activeImageField]: null }));

				switch (activeImageField) {
					case "logo":
						updateMenuSetting("logo.image", selectedUrl);
						break;
					case "background":
						updateMenuSetting("background.image", selectedUrl);
						break;
					case "iconBarLogo":
						updateMenuSetting("iconbar.logo.image", selectedUrl);
						break;
					case "iconBarBackground":
						updateMenuSetting("iconbar.background.image", selectedUrl);
						break;
				}
			}
			setActiveImageField(null);
		},
		[activeImageField, imageSource, pendingImages, updateMenuSetting],
	);

	const uploadPendingImages = useCallback(
		async (currentMenuDesign: MenuDesign) => {
			try {
				const uploadedUrls: Partial<Record<ImageFieldType, string>> = {};
				let nextMenuDesign = currentMenuDesign;

				for (const field of Object.keys(pendingImages) as ImageFieldType[]) {
					const pending = pendingImages[field];
					if (!pending) continue;
					const url = await uploadFile(pending.file);
					uploadedUrls[field] = url;
					URL.revokeObjectURL(pending.previewUrl);
				}

				if (uploadedUrls.logo) {
					nextMenuDesign = { ...nextMenuDesign, logoImage: uploadedUrls.logo };
					updateMenuSetting("logo.image", uploadedUrls.logo);
				}
				if (uploadedUrls.background) {
					nextMenuDesign = {
						...nextMenuDesign,
						backgroundImage: uploadedUrls.background,
					};
					updateMenuSetting("background.image", uploadedUrls.background);
				}
				if (uploadedUrls.iconBarLogo) {
					nextMenuDesign = {
						...nextMenuDesign,
						iconBarLogoImage: uploadedUrls.iconBarLogo,
					};
					updateMenuSetting("iconbar.logo.image", uploadedUrls.iconBarLogo);
				}
				if (uploadedUrls.iconBarBackground) {
					nextMenuDesign = {
						...nextMenuDesign,
						iconBarBackgroundImage: uploadedUrls.iconBarBackground,
					};
					updateMenuSetting(
						"iconbar.background.image",
						uploadedUrls.iconBarBackground,
					);
				}

				setPendingImages(EMPTY_PENDING_IMAGES);
				return nextMenuDesign;
			} catch {
				toast.error("이미지 업로드 중 오류가 발생했습니다.");
				throw new Error("이미지 업로드 중 오류가 발생했습니다.");
			}
		},
		[pendingImages, updateMenuSetting, uploadFile],
	);

	return {
		pendingImages,
		activeImageField,
		setActiveImageField,
		dialogThumbnail,
		setDialogThumbnail,
		assets,
		assetsLoading,
		assetsError,
		assetSearchQuery,
		setAssetSearchQuery,
		hasPendingImages,
		handleFileSelect,
		handleImageClear,
		handleOpenImageDialog,
		handleImageFileSelect,
		handleSelectAsset,
		handleImageDialogConfirm,
		uploadPendingImages,
	};
};
