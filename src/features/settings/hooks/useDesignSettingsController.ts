"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSettingDesign } from "@/hooks/useSettingDesign";
import { useSettings } from "@/contexts/SettingsContext";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSettingsImagePicker } from "@/features/settings/hooks/useSettingsImagePicker";
import { usePendingImageUpload } from "@/features/settings/hooks/usePendingImageUpload";
import { setSettingsGeneralFontRegistry } from "@/features/settings/api/fontRegistry";
import type { FontRegistryItem } from "@/features/settings/types";

type ImageField = "background" | "borderImage";

export function useDesignSettingsController() {
	const design = useSettingDesign();
	const { general, updateGeneral, refreshSettings } = useSettings();
	const { uploadFile, state: uploadState } = useFileUpload();
	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isFontDialogOpen, setIsFontDialogOpen] = useState(false);
	const uploadPendingImages = usePendingImageUpload<ImageField>(uploadFile);
	const imagePicker = useSettingsImagePicker<ImageField>({
		fields: ["background", "borderImage"] as const,
	});

	const fontRegistry = useMemo(() => general?.fontRegistry ?? [], [general?.fontRegistry]);

	const handleImageClear = useCallback(() => {
		imagePicker.actions.clearPendingImage("background");
		design.updateDesignSetting("background.image", "");
	}, [design, imagePicker.actions]);

	const handleOpenImageDialog = useCallback(
		(field: ImageField) => {
			const currentValue =
				field === "background"
					? design.background.image || ""
					: design.widget.borderImage || "";
			imagePicker.actions.openImageDialog(field, currentValue);
		},
		[design.background.image, design.widget.borderImage, imagePicker.actions],
	);

	const handleImageDialogConfirm = useCallback(
		(selectedUrl: string) => {
			const activeField = imagePicker.state.activeField;
			if (!activeField) return;
			if (imagePicker.state.imageSource === "asset" && selectedUrl) {
				imagePicker.actions.clearPendingImage(activeField);
				if (activeField === "background") {
					design.updateDesignSetting("background.image", selectedUrl);
				} else {
					design.updateDesignSetting("widget.borderImage", selectedUrl);
				}
			}
			imagePicker.actions.closeImageDialog();
		},
		[design, imagePicker.actions, imagePicker.state.activeField, imagePicker.state.imageSource],
	);

	const handleSave = useCallback(async () => {
		try {
			const uploadedUrls = await uploadPendingImages(imagePicker.state.pendingImages);
			let nextDesign = design.currentDesignSetting;

			if (uploadedUrls.background) {
				nextDesign = {
					...nextDesign,
					background: { ...nextDesign.background, image: uploadedUrls.background },
				};
				design.updateDesignSetting("background.image", uploadedUrls.background);
			}

			if (uploadedUrls.borderImage) {
				nextDesign = {
					...nextDesign,
					widget: { ...nextDesign.widget, borderImage: uploadedUrls.borderImage },
				};
				design.updateDesignSetting("widget.borderImage", uploadedUrls.borderImage);
			}

			imagePicker.actions.clearAllPendingImages();
			design.handleSave(nextDesign);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "저장에 실패했습니다.";
			toast.error(message);
		}
	}, [design, imagePicker.actions, imagePicker.state.pendingImages, uploadPendingImages]);

	const handleReset = useCallback(() => {
		imagePicker.actions.clearAllPendingImages();
		design.handleReset();
		setShowResetDialog(false);
	}, [design, imagePicker.actions]);

	const handleUpdateFontRegistry = useCallback(
		async (nextRegistry: FontRegistryItem[]) => {
			try {
				await setSettingsGeneralFontRegistry(nextRegistry);
				updateGeneral?.({ fontRegistry: nextRegistry });
				await refreshSettings?.({ broadcast: true });
				toast.success("폰트가 저장되었습니다.");
			} catch {
				toast.error("폰트 저장에 실패했습니다.");
			}
		},
		[refreshSettings, updateGeneral],
	);

	return {
		design,
		uploadState,
		imagePicker,
		fontRegistry,
		showResetDialog,
		setShowResetDialog,
		isFontDialogOpen,
		setIsFontDialogOpen,
		handleImageClear,
		handleOpenImageDialog,
		handleImageDialogConfirm,
		handleSave,
		handleReset,
		handleUpdateFontRegistry,
	};
}
