/* eslint-disable @next/next/no-img-element */
"use client";

import { ImagePlus, Trash2, Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import RadioItem from "@/components/items/RadioItem";
import WidgetSetting from "@/components/setting/widget";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import FontRegisterDialog from "@/components/modal/FontRegisterDialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { AssetPickerDialog } from "@/features/settings/components/AssetPickerDialog";
import { useDesignSettingsController } from "@/features/settings/hooks/useDesignSettingsController";

const BACKGROUND_TYPES = {
	IMAGE: "이미지",
	SOLID: "단색",
	GRADIENT: "그라데이션",
} as const;

const FONT_SAMPLE_TEXTS = {
	TITLE: "제목 또는 메뉴명 Title",
	CONTENT: "본문 서체 및 크기 미리보기 기본 문장 12345 Paragraph",
	DESCRIPTION: "서브 폰트 미리보기 12345 Description",
} as const;

const ICON_SIZE = 28;
const ICON_COLOR = "#9BA2A8";

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
	const { uploadState, showResetDialog, setShowResetDialog, isFontDialogOpen, setIsFontDialogOpen, fontRegistry } = controller;
	const pendingBgImage = pendingImages.background;

	useSettingStatus("design", isDirty || hasPendingImages ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-design"
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

			{/* 배경 디자인 설정 Section */}
			<section>
				<h2 className="text-[20px] font-semibold font-title">배경 디자인 설정</h2>
				<div className="section-wrap mt-6">
					{/* 배경 타입 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px] pr-5">
							<h3 className="font-medium text-sub-text">배경 타입</h3>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{BGTypes.map((el) => (
								<RadioItem
									key={el}
									onClickRadio={() => {
										updateDesignSetting("background.type", el);
									}}
									checked={background.type === el}
									content={el}
								/>
							))}
						</div>
					</div>

					{/* 배경 이미지 */}
					{background.type === BACKGROUND_TYPES.IMAGE && (
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5">
								<h3 className="font-medium text-sub-text">배경 이미지</h3>
							</div>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => controller.handleOpenImageDialog("background")}
									className={`relative w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors ${
										uploadState.loading ? "opacity-60 pointer-events-none" : ""
									}`}
								>
									{pendingBgImage?.previewUrl || background.image ? (
										<img
											src={pendingBgImage?.previewUrl || background.image}
											alt="배경 이미지"
											className="w-full h-full object-contain"
										/>
									) : (
										<>
											<ImagePlus
												size={ICON_SIZE}
												color={ICON_COLOR}
												absoluteStrokeWidth={true}
											/>
											<span className="text-xs text-gray-500 dark:text-gray-400">
												이미지 업로드
											</span>
										</>
									)}
								</button>
								{(pendingBgImage || background.image) && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={controller.handleImageClear}
										className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
										style={{
											transition: "all 0.3s ease-in-out",
										}}
									>
										<Trash2
											size={14}
											className="mr-2"
											style={{
												transition: "all 0.3s ease-in-out",
											}}
										/>
										비우기
									</Button>
								)}
							</div>
						</div>
					)}

					{/* 단색 배경 */}
					{background.type === BACKGROUND_TYPES.SOLID && (
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px]">
								<h3 className="font-medium text-sub-text">배경 컬러</h3>
							</div>
							<div className="flex items-center gap-3">
								<ColorPicker
									value={background.color}
									onChange={(color: string) => {
										updateDesignSetting("background.color", color);
									}}
								/>
								<span
									className="text-sm font-mono"
									style={{ color: background.color }}
								>
									{background.color}
								</span>
							</div>
						</div>
					)}
				</div>
			</section>

			<Separator className="my-12" />

			{/* 위젯 & 카드 설정 */}
			<WidgetSetting
				widget={widget}
				card={card}
				updateDesignSetting={updateDesignSetting}
				onOpenBorderImagePicker={() => controller.handleOpenImageDialog("borderImage")}
				isUploading={uploadState.loading}
			/>

			<Separator className="my-12" />

			{/* 폰트 설정 Section */}
			<section>
				<div className="flex items-center justify-between">
					<h2 className="text-[20px] font-semibold font-title">폰트 설정</h2>
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsFontDialogOpen(true)}
						className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
						style={{
							transition: "all 0.3s ease-in-out",
						}}
					>
						<Plus size={14} className="mr-2" />
						폰트 등록
					</Button>
				</div>
				<div className="section-wrap mt-6">
					{/* Font Preview */}
					<div className="font-sample-wrap flex flex-col items-center p-7 rounded-card border-card bg-card-bg filter-blur-card mt-4">
						<h3
							className="text-3xl font-bold"
							style={{
								fontFamily: font.titleFontFamily,
								color: font.mainFontColor,
							}}
						>
							{FONT_SAMPLE_TEXTS.TITLE}
						</h3>
						<p
							className="text-base"
							style={{
								fontFamily: font.bodyFontFamily,
								color: font.mainFontColor,
							}}
						>
							{FONT_SAMPLE_TEXTS.CONTENT}
						</p>
						<p
							className="text-sm"
							style={{
								fontFamily: font.bodyFontFamily,
								color: font.subFontColor,
							}}
						>
							{FONT_SAMPLE_TEXTS.DESCRIPTION}
						</p>
					</div>

					{/* 메인 폰트 컬러 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">메인 폰트 컬러</h3>
						</div>
						<div className="flex items-center gap-3">
							<ColorPicker
								value={font.mainFontColor}
								onChange={(color: string) => {
									updateDesignSetting("font.mainFontColor", color);
								}}
							/>
							<span
								className="text-sm font-mono"
								style={{ color: font.mainFontColor }}
							>
								{font.mainFontColor}
							</span>
						</div>
					</div>

					{/* 서브 폰트 컬러 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">서브 폰트 컬러</h3>
						</div>
						<div className="flex items-center gap-3">
							<ColorPicker
								value={font.subFontColor}
								onChange={(color: string) => {
									updateDesignSetting("font.subFontColor", color);
								}}
							/>
							<span
								className="text-sm font-mono"
								style={{ color: font.subFontColor }}
							>
								{font.subFontColor}
							</span>
						</div>
					</div>

					{/* 제목 서체 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">제목 서체</h3>
						</div>
						<Select
							value={font.titleFontFamily}
							onValueChange={(value: string) => {
								updateDesignSetting("font.titleFontFamily", value);
							}}
						>
							<SelectTrigger className="w-[200px] rounded-card border-card bg-card-bg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{fontTitle.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* 본문 서체 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">본문 서체</h3>
						</div>
						<Select
							value={font.bodyFontFamily}
							onValueChange={(value: string) => {
								updateDesignSetting("font.bodyFontFamily", value);
							}}
						>
							<SelectTrigger className="w-[200px] rounded-card border-card bg-card-bg">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{fontBody.map((item) => (
									<SelectItem key={item.value} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
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
						<DialogTitle>디자인 초기화</DialogTitle>
						<DialogDescription>
							정말 디자인 설정을 초기화할까요? 모든 설정이 기본값으로
							돌아갑니다.
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
							onClick={controller.handleReset}
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
			<FontRegisterDialog
				open={isFontDialogOpen}
				onOpenChange={setIsFontDialogOpen}
				fontRegistry={fontRegistry}
				onUpdate={controller.handleUpdateFontRegistry}
			/>
		</form>
	);
}
