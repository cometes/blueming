"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import { ColorPalettePreview } from "@/components/ui/color-palette-preview";
import RadioItem from "@/components/items/RadioItem";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { Save } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploadSection } from "@/features/settings/components/menu/ImageUploadSection";
import { AssetPickerDialog } from "@/features/settings/components/AssetPickerDialog";
import { useGeneralSettingsController } from "@/features/settings/hooks/useGeneralSettingsController";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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
		fontWeightOptions,
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
		<Button
			type="submit"
			form="setting-form-general"
			variant="ghost"
			size="icon"
			disabled={(!isDirty && !hasPendingImages) || uploadState.loading}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
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

					{/* 메인 컬러 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">메인 컬러</h3>
						</div>
						<div className="flex items-center gap-3">
							<ColorPicker
								value={generalSetting.primaryColor}
								onChange={(color: string) => {
									updateColorSetting("primaryColor", color);
								}}
							/>
							<span
								className="text-sm font-mono"
								style={{ color: generalSetting.primaryColor }}
							>
								{generalSetting.primaryColor}
							</span>
							<ColorPalettePreview color={generalSetting.primaryColor} />
						</div>
					</div>

					{/* 서브 컬러 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">서브 컬러</h3>
						</div>
						<div className="flex items-center gap-3">
							<ColorPicker
								value={generalSetting.secondaryColor}
								onChange={(color: string) => {
									updateColorSetting("secondaryColor", color);
								}}
							/>
							<span
								className="text-sm font-mono"
								style={{ color: generalSetting.secondaryColor }}
							>
								{generalSetting.secondaryColor}
							</span>
							<ColorPalettePreview color={generalSetting.secondaryColor} />
						</div>
					</div>
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
						<>
							{/* 미리보기 */}
							<div className="flex flex-col items-center p-8 rounded-card border-card bg-card-bg filter-blur-card mt-6 mb-2">
								<div className="flex items-center justify-center h-[80px] px-8">
									<span
										style={{
											fontFamily: generalSetting.logoFontFamily || undefined,
											fontWeight: generalSetting.logoFontWeight || "700",
											color: generalSetting.logoColor || undefined,
											fontSize: "1.5rem",
										}}
									>
										{generalSetting.logoText || "로고 타이틀"}
									</span>
								</div>
							</div>

							{/* 로고 타이틀 텍스트 */}
							<div className="section-box flex items-center mt-4">
								<div className="text-box w-[220px] pr-5 relative">
									<h3 className="font-medium text-sub-text">로고 타이틀</h3>
									{formState.errors.logoText?.message && (
										<p className="text-sm absolute left-1 top-full text-red-500 mt-1">
											{formState.errors.logoText.message}
										</p>
									)}
								</div>
								<div className="input-box relative w-calc(100% - 220px) flex-1">
									<Input
										placeholder="로고 타이틀을 입력해주세요"
										value={getValues("logoText") || generalSetting.logoText || ""}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											setValue("logoText", e.target.value);
											updateGeneralSetting("logoText", e.target.value);
										}}
										className={
											INPUT_HEIGHT +
											" rounded-card border-card focus:border-card-active bg-card-bg"
										}
									/>
								</div>
							</div>

							{/* 폰트 스타일 */}
							<div className="section-box flex items-center mt-4">
								<div className="text-box w-[220px] pr-5">
									<h3 className="font-medium text-sub-text">폰트 스타일</h3>
								</div>
								<div className="w-[200px]">
									<Select
										value={generalSetting.logoFontFamily || ""}
										onValueChange={(value) => updateGeneralSetting("logoFontFamily", value)}
									>
										<SelectTrigger className={INPUT_HEIGHT + " rounded-card border-card bg-card-bg"}>
											<SelectValue placeholder="기본 폰트" />
										</SelectTrigger>
										<SelectContent>
											{fontTitle.map((item) => (
												<SelectItem key={item.value} value={item.value}>
													<span style={{ fontFamily: item.value }}>{item.label}</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* 폰트 굵기 */}
							<div className="section-box flex items-center mt-4">
								<div className="text-box w-[220px] pr-5">
									<h3 className="font-medium text-sub-text">폰트 굵기</h3>
								</div>
								<div className="flex items-center gap-4 flex-1 max-w-md w-full">
									<Slider
										min={100}
										max={900}
										step={100}
										value={[Number(generalSetting.logoFontWeight) || 700]}
										onValueChange={(val) =>
											updateGeneralSetting("logoFontWeight", String(val[0]))
										}
										className="flex-1 min-w-[150px]"
									/>
									<Input
										type="number"
										min={100}
										max={900}
										step={100}
										value={Number(generalSetting.logoFontWeight) || 700}
										onChange={(e) =>
											updateGeneralSetting("logoFontWeight", e.target.value)
										}
										className="w-20 rounded-card border-card bg-card-bg"
									/>
								</div>
							</div>

							{/* 폰트 컬러 */}
							<div className="section-box flex items-center mt-4">
								<div className="text-box w-[220px] pr-5">
									<h3 className="font-medium text-sub-text">폰트 컬러</h3>
								</div>
								<div className="flex items-center gap-3">
									<ColorPicker
										value={generalSetting.logoColor || "#000000"}
										onChange={(color) => updateColorSetting("logoColor", color)}
									/>
									<span
										className="text-sm font-mono"
										style={{ color: generalSetting.logoColor || undefined }}
									>
										{generalSetting.logoColor || "#000000"}
									</span>
								</div>
							</div>
						</>
					)}
				</div>
			</section>

			{/* Submit Buttons */}
			<div className="flex justify-end gap-3 pt-6">
				<Button
					type="button"
					onClick={() => setShowResetDialog(true)}
					className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
					style={{
						transition: "all 0.3s ease-in-out",
					}}
				>
					초기화하기
				</Button>

				{/* 저장 버튼은 헤더로 이동 */}
			</div>

			<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
				<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
					<DialogHeader>
						<DialogTitle>일반 설정 초기화</DialogTitle>
						<DialogDescription>
							정말 일반 설정을 초기화할까요? 모든 설정이 기본값으로 돌아갑니다.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowResetDialog(false)}
							className="rounded-card border-card bg-card-bg"
						>
							취소
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={controller.handleResetConfirm}
							className="rounded-card border-card bg-card-bg hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
							style={{
								transition: "all 0.3s ease-in-out",
							}}
						>
							초기화
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</form>
	);
}
