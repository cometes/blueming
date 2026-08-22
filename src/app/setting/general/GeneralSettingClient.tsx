"use client";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import RadioItem from "@/components/items/RadioItem";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { ImageUploadSection } from "@/features/settings/components/menu/ImageUploadSection";
import { AssetPickerDialog } from "@/features/settings/components/AssetPickerDialog";
import { SettingColorRow } from "@/features/settings/components/SettingColorRow";
import { SettingResetDialog } from "@/features/settings/components/SettingResetDialog";
import {
	SettingResetButton,
	SettingSaveButton,
} from "@/features/settings/components/SettingActionButtons";
import { LogoTextSettings } from "@/features/settings/components/general/LogoTextSettings";
import { useGeneralSettingsController } from "@/features/settings/hooks/useGeneralSettingsController";

const INPUT_HEIGHT = "h-9";

const PLACEHOLDERS = {
	TITLE: "홈페이지 타이틀을 입력해주세요",
	DESC: "홈페이지 설명을 입력해주세요",
} as const;

export default function GeneralSettingClient() {
	const controller = useGeneralSettingsController();
	const {
		handleSubmit,
		formState,
		getValues,
		setValue,
		logoTypes,
		currentLogo,
		setCurrentLogo,
		generalSetting,
		updateGeneralSetting,
		updateColorSetting,
		isDirty,
		fontTitle,
	} = controller.general;
	const { uploadState, showResetDialog, setShowResetDialog } = controller;
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
			handleFileSelect,
			handleImageFileSelect,
			closeImageDialog,
			handleSelectAsset,
		},
	} = controller.imagePicker;

	useSettingStatus("general", isDirty || hasPendingImages ? "dirty" : "saved");
	useSettingHeaderAction(
		<SettingSaveButton
			formId="setting-form-general"
			disabled={(!isDirty && !hasPendingImages) || uploadState.loading}
		/>,
		[isDirty, hasPendingImages, uploadState.loading]
	);

	return (
		<form
			id="setting-form-general"
			onSubmit={handleSubmit(async () => controller.handleSave())}
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
				className="gap-1.5"
			/>

			{/* 홈페이지 설정 Section */}
			<section>
				<h2 className="text-[20px] font-semibold font-title">홈페이지 설정</h2>
				<div className="section-wrap mt-6">
					{/* 홈페이지 타이틀 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5 relative">
							<h3 className="font-medium text-sub-text">홈페이지 타이틀</h3>
							{formState.errors.title?.message && (
								<p className="text-sm absolute left-1 top-full text-red-500 mt-1">
									{formState.errors.title.message}
								</p>
							)}
						</div>
						<div className="input-box relative w-calc(100% - 220px) flex-1">
							<Input
								placeholder={PLACEHOLDERS.TITLE}
								value={getValues("title") || generalSetting.title || ""}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									setValue("title", e.target.value);
									updateGeneralSetting("title", e.target.value);
								}}
								className={
									INPUT_HEIGHT +
									"rounded-card border-card focus:border-card-active bg-card-bg"
								}
							/>
						</div>
					</div>

					{/* 홈페이지 설명 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5 relative">
							<h3 className="font-medium text-sub-text">홈페이지 설명</h3>
							{formState.errors.desc?.message && (
								<p className="text-sm absolute left-1 top-full text-red-500 mt-1">
									{formState.errors.desc.message}
								</p>
							)}
						</div>
						<div className="input-box relative w-calc(100% - 220px) flex-1">
							<Input
								placeholder={PLACEHOLDERS.DESC}
								value={getValues("desc") || generalSetting.desc || ""}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									setValue("desc", e.target.value);
									updateGeneralSetting("desc", e.target.value);
								}}
								className={
									INPUT_HEIGHT +
									"rounded-card border-card focus:border-card-active bg-card-bg"
								}
							/>
						</div>
					</div>

					{/* 파비콘 */}
					<ImageUploadSection
						title="파비콘 (32x32)"
						description="브라우저 옆에 띄우는 작은 아이콘"
						imageSrc={
							pendingImages.favicon?.previewUrl || generalSetting.favicon
						}
						onFileSelect={(file) => handleFileSelect("favicon", file)}
						onClearClick={() => controller.handleImageClear("favicon")}
						onOpenPicker={() => controller.handleOpenImageDialog("favicon")}
						isUploading={uploadState.loading}
					/>

					{/* URL 공유 이미지 */}
					<ImageUploadSection
						title="URL 공유 이미지"
						description="1200 * 630 권장"
						imageSrc={
							pendingImages.shareImage?.previewUrl || generalSetting.shareImage
						}
						onFileSelect={(file) => handleFileSelect("shareImage", file)}
						onClearClick={() => controller.handleImageClear("shareImage")}
						onOpenPicker={() => controller.handleOpenImageDialog("shareImage")}
						isUploading={uploadState.loading}
					/>

					<SettingColorRow
						label="메인 컬러"
						value={generalSetting.primaryColor}
						onChange={(color) => updateColorSetting("primaryColor", color)}
						showPalette
					/>

					<SettingColorRow
						label="서브 컬러"
						value={generalSetting.secondaryColor}
						onChange={(color) => updateColorSetting("secondaryColor", color)}
						showPalette
					/>
				</div>
			</section>

			<Separator className="my-12" />

			{/* 로고 Section */}
			<section>
				<h2 className="text-[20px] font-semibold font-title">로고</h2>
				<div className="section-wrap mt-6">
					{/* 로고 타입 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5 relative">
							<h3 className="font-medium text-sub-text">로고 타입</h3>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{logoTypes.map((el) => (
								<RadioItem
									key={el}
									onClickRadio={() => setCurrentLogo(el)}
									checked={currentLogo === el}
									content={el}
								/>
							))}
						</div>
					</div>

					{/* 이미지 로고 업로드 */}
					{currentLogo === "이미지" && (
						<ImageUploadSection
							title="홈페이지 로고"
							description="홈페이지의 대표 로고를 커스텀 할 수 있습니다."
							imageSrc={
								pendingImages.logoImage?.previewUrl || generalSetting.logoImage
							}
							onFileSelect={(file) => handleFileSelect("logoImage", file)}
							onClearClick={() => controller.handleImageClear("logoImage")}
							onOpenPicker={() => controller.handleOpenImageDialog("logoImage")}
							isUploading={uploadState.loading}
						/>
					)}

					{/* 텍스트 로고 */}
					{currentLogo === "텍스트" && (
						<LogoTextSettings
							logoText={generalSetting.logoText}
							logoTextValue={
								getValues("logoText") || generalSetting.logoText || ""
							}
							logoTextError={formState.errors.logoText?.message}
							logoFontFamily={generalSetting.logoFontFamily}
							logoFontWeight={generalSetting.logoFontWeight}
							logoColor={generalSetting.logoColor}
							fontTitle={fontTitle}
							onLogoTextChange={(value) => {
								setValue("logoText", value);
								updateGeneralSetting("logoText", value);
							}}
							onFontFamilyChange={(value) =>
								updateGeneralSetting("logoFontFamily", value)
							}
							onFontWeightChange={(value) =>
								updateGeneralSetting("logoFontWeight", value)
							}
							onColorChange={(color) => updateColorSetting("logoColor", color)}
						/>
					)}
				</div>
			</section>

			<SettingResetButton onClick={() => setShowResetDialog(true)} />

			<SettingResetDialog
				open={showResetDialog}
				onOpenChange={setShowResetDialog}
				title="일반 설정 초기화"
				description="정말 일반 설정을 초기화할까요? 모든 설정이 기본값으로 돌아갑니다."
				onConfirm={controller.handleResetConfirm}
			/>
		</form>
	);
}
