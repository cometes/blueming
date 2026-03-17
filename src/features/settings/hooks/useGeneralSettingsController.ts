"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSettingGeneral } from "@/hooks/useSettingGeneral";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSettingsImagePicker } from "@/features/settings/hooks/useSettingsImagePicker";
import { usePendingImageUpload } from "@/features/settings/hooks/usePendingImageUpload";

type ImageField = "favicon" | "shareImage" | "logoImage";

export function useGeneralSettingsController() {
	const general = useSettingGeneral();
	const [showResetDialog, setShowResetDialog] = useState(false);
	const { uploadFile, state: uploadState } = useFileUpload();
	const uploadPendingImages = usePendingImageUpload<ImageField>(uploadFile);
	const imagePicker = useSettingsImagePicker<ImageField>({
		fields: ["favicon", "shareImage", "logoImage"] as const,
	});

	const handleImageClear = useCallback(
		(field: ImageField) => {
			imagePicker.actions.clearPendingImage(field);
			general.handleClearImage(field);
		},
		[general, imagePicker.actions],
	);

	const handleOpenImageDialog = useCallback(
		(field: ImageField) => {
			imagePicker.actions.openImageDialog(field, general.generalSetting[field] || "");
		},
		[general.generalSetting, imagePicker.actions],
	);

	const handleImageDialogConfirm = useCallback(
		(selectedUrl: string) => {
			const activeField = imagePicker.state.activeField;
			if (!activeField) return;
			if (imagePicker.state.imageSource === "asset" && selectedUrl) {
				imagePicker.actions.clearPendingImage(activeField);
				general.handleImageUpload(activeField, selectedUrl);
			}
			imagePicker.actions.closeImageDialog();
		},
		[general, imagePicker.actions, imagePicker.state.activeField, imagePicker.state.imageSource],
	);

	const handleSave = useCallback(async () => {
		try {
			const uploadedUrls = await uploadPendingImages(imagePicker.state.pendingImages);
			for (const field of Object.keys(uploadedUrls) as ImageField[]) {
				const url = uploadedUrls[field];
				if (!url) continue;
				general.handleImageUpload(field, url);
			}
			imagePicker.actions.clearAllPendingImages();
			await general.handleSave({
				...general.generalSetting,
				...uploadedUrls,
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "저장에 실패했습니다.";
			toast.error(message);
		}
	}, [general, imagePicker.actions, imagePicker.state.pendingImages, uploadPendingImages]);

	const handleResetConfirm = useCallback(() => {
		imagePicker.actions.clearAllPendingImages();
		general.handleReset();
		setShowResetDialog(false);
	}, [general, imagePicker.actions]);

	return {
		general,
		uploadState,
		imagePicker,
		showResetDialog,
		setShowResetDialog,
		handleImageClear,
		handleOpenImageDialog,
		handleImageDialogConfirm,
		handleSave,
		handleResetConfirm,
	};
}
