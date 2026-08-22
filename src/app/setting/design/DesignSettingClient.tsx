"use client";

import { Separator } from "@/components/ui/separator";
import WidgetSetting from "@/components/setting/widget";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import FontRegisterDialog from "@/features/settings/components/FontRegisterDialog";
import { AssetPickerDialog } from "@/features/settings/components/AssetPickerDialog";
import { SettingResetDialog } from "@/features/settings/components/SettingResetDialog";
import {
	SettingResetButton,
	SettingSaveButton,
} from "@/features/settings/components/SettingActionButtons";
import { BackgroundSettingSection } from "@/features/settings/components/design/BackgroundSettingSection";
import { FontSettingSection } from "@/features/settings/components/design/FontSettingSection";
import { useDesignSettingsController } from "@/features/settings/hooks/useDesignSettingsController";

export default function DesignSettingClient() {
	const controller = useDesignSettingsController();
	const {
		BGTypes,
		fontTitle,
		fontBody,
		background,
		font,
		widget,
		card,
		updateDesignSetting,
		isDirty,
	} = controller.design;
	const {
		state: {
			activeField: activeImageField,
			dialogThumbnail,
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
			closeImageDialog,
			handleImageFileSelect,
			handleSelectAsset,
		},
	} = controller.imagePicker;
	const {
		uploadState,
		showResetDialog,
		setShowResetDialog,
		isFontDialogOpen,
		setIsFontDialogOpen,
		fontRegistry,
	} = controller;

	useSettingStatus("design", isDirty || hasPendingImages ? "dirty" : "saved");
	useSettingHeaderAction(
		<SettingSaveButton
			formId="setting-form-design"
			disabled={(!isDirty && !hasPendingImages) || uploadState.loading}
		/>,
		[isDirty, hasPendingImages, uploadState.loading]
	);

	return (
		<form
			id="setting-form-design"
			onSubmit={(e) => {
				e.preventDefault();
				void controller.handleSave();
			}}
			className="space-y-8"
		>
			<AssetPickerDialog
				isOpen={activeImageField !== null}
				onOpenChange={(open) => {
					if (!open) closeImageDialog();
				}}
				thumbnail={dialogThumbnail}
				setThumbnail={setDialogThumbnail}
				onUpload={controller.handleImageDialogConfirm}
				onFileSelect={handleImageFileSelect}
				assets={assets}
				assetsLoading={assetsLoading}
				assetsError={assetsError}
				assetSearchQuery={assetSearchQuery}
				onAssetSearchChange={setAssetSearchQuery}
				onSelectAsset={handleSelectAsset}
			/>

			<BackgroundSettingSection
				BGTypes={BGTypes}
				background={background}
				pendingPreviewUrl={pendingImages.background?.previewUrl}
				isUploading={uploadState.loading}
				onUpdate={updateDesignSetting}
				onOpenImagePicker={() => controller.handleOpenImageDialog("background")}
				onClearImage={controller.handleImageClear}
			/>

			<Separator className="my-12" />

			{/* 위젯 & 카드 설정 */}
			<WidgetSetting
				widget={widget}
				card={card}
				updateDesignSetting={updateDesignSetting}
				onOpenBorderImagePicker={() =>
					controller.handleOpenImageDialog("borderImage")
				}
				isUploading={uploadState.loading}
			/>

			<Separator className="my-12" />

			<FontSettingSection
				font={font}
				fontTitle={fontTitle}
				fontBody={fontBody}
				onUpdate={updateDesignSetting}
				onOpenFontDialog={() => setIsFontDialogOpen(true)}
			/>

			<SettingResetButton onClick={() => setShowResetDialog(true)} />

			<SettingResetDialog
				open={showResetDialog}
				onOpenChange={setShowResetDialog}
				title="디자인 초기화"
				description="정말 디자인 설정을 초기화할까요? 모든 설정이 기본값으로 돌아갑니다."
				onConfirm={controller.handleReset}
			/>
			<FontRegisterDialog
				open={isFontDialogOpen}
				onOpenChange={setIsFontDialogOpen}
				fontRegistry={fontRegistry}
				onUpdate={controller.handleUpdateFontRegistry}
			/>
		</form>
	);
}
