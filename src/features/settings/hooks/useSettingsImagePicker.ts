"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listStickerAssets } from "@/features/stickerboard-editor/api/assets";
import type { StickerAsset } from "@/features/stickerboard-editor/model";

export interface PendingImage {
	file: File;
	previewUrl: string;
}

interface UseSettingsImagePickerArgs<Field extends string> {
	fields: readonly Field[];
}

export function useSettingsImagePicker<Field extends string>({
	fields,
}: UseSettingsImagePickerArgs<Field>) {
	const [activeField, setActiveField] = useState<Field | null>(null);
	const [dialogThumbnail, setDialogThumbnail] = useState("");
	const [imageSource, setImageSource] = useState<
		"file" | "asset" | "existing" | null
	>(null);
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [assetsLoading, setAssetsLoading] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);
	const [assetSearchQuery, setAssetSearchQuery] = useState("");
	const [pendingImages, setPendingImages] = useState<Record<Field, PendingImage | null>>(
		() =>
			fields.reduce(
				(acc, field) => ({ ...acc, [field]: null }),
				{} as Record<Field, PendingImage | null>,
			),
	);

	const hasPendingImages = useMemo(
		() => fields.some((field) => pendingImages[field] !== null),
		[fields, pendingImages],
	);

	const refreshAssets = useCallback(async () => {
		try {
			setAssetsLoading(true);
			setAssetsError(null);
			const list = await listStickerAssets("all");
			setAssets(list);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "에셋을 불러오지 못했습니다.";
			setAssetsError(message);
		} finally {
			setAssetsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!activeField) return;
		void refreshAssets();
	}, [activeField, refreshAssets]);

	const handleFileSelect = useCallback((field: Field, file: File) => {
		const previewUrl = URL.createObjectURL(file);
		setPendingImages((prev) => {
			const current = prev[field];
			if (current) {
				URL.revokeObjectURL(current.previewUrl);
			}
			return {
				...prev,
				[field]: { file, previewUrl },
			};
		});
	}, []);

	const handleImageFileSelect = useCallback(
		(file: File, previewUrl: string) => {
			if (!activeField) return;
			setPendingImages((prev) => {
				const current = prev[activeField];
				if (current) {
					URL.revokeObjectURL(current.previewUrl);
				}
				return {
					...prev,
					[activeField]: { file, previewUrl },
				};
			});
			setDialogThumbnail(previewUrl);
			setImageSource("file");
		},
		[activeField],
	);

	const clearPendingImage = useCallback((field: Field) => {
		setPendingImages((prev) => {
			const current = prev[field];
			if (current) {
				URL.revokeObjectURL(current.previewUrl);
			}
			return {
				...prev,
				[field]: null,
			};
		});
	}, []);

	const clearAllPendingImages = useCallback(() => {
		setPendingImages((prev) => {
			fields.forEach((field) => {
				const current = prev[field];
				if (current) {
					URL.revokeObjectURL(current.previewUrl);
				}
			});
			return fields.reduce(
				(acc, field) => ({ ...acc, [field]: null }),
				{} as Record<Field, PendingImage | null>,
			);
		});
	}, [fields]);

	const openImageDialog = useCallback(
		(field: Field, currentValue?: string) => {
			const pending = pendingImages[field]?.previewUrl;
			const current = pending || currentValue || "";
			setDialogThumbnail(current);
			if (pending) {
				setImageSource("file");
			} else if (currentValue) {
				setImageSource("existing");
			} else {
				setImageSource(null);
			}
			setActiveField(field);
		},
		[pendingImages],
	);

	const closeImageDialog = useCallback(() => {
		setActiveField(null);
		setAssetSearchQuery("");
	}, []);

	const handleSelectAsset = useCallback((asset: StickerAsset) => {
		setDialogThumbnail(asset.url);
		setImageSource("asset");
	}, []);

	useEffect(() => {
		return () => {
			(Object.values(pendingImages) as Array<PendingImage | null>).forEach((pending) => {
				if (pending) {
					URL.revokeObjectURL(pending.previewUrl);
				}
			});
		};
	}, [pendingImages]);

	return {
		state: {
			activeField,
			dialogThumbnail,
			imageSource,
			assets,
			assetsLoading,
			assetsError,
			assetSearchQuery,
			pendingImages,
			hasPendingImages,
		},
		actions: {
			setDialogThumbnail,
			setAssetSearchQuery,
			setActiveField,
			setPendingImages,
			handleFileSelect,
			handleImageFileSelect,
			clearPendingImage,
			clearAllPendingImages,
			openImageDialog,
			closeImageDialog,
			handleSelectAsset,
			refreshAssets,
		},
	};
}
