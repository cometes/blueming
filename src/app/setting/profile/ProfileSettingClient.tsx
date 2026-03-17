"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { extensions } from "@/components/editor/TiptapEditor";
import SimpleTiptapToolbar from "@/components/tiptap/SimpleTiptapToolbar";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { Save } from "lucide-react";
import { ImageUploadSection } from "@/features/settings/components/menu/ImageUploadSection";
import { AssetPickerDialog } from "@/features/settings/components/AssetPickerDialog";
import { useProfileSettingsController } from "@/features/settings/hooks/useProfileSettingsController";

const PLACEHOLDERS = {
	NICKNAME: "닉네임을 입력해주세요",
	INTRODUCTION: "자기소개를 입력해주세요...",
	ETC: "기타 내용을 입력해주세요 (옵션)",
} as const;

export default function ProfileSettingClient() {
	// Initialize Tiptap editor
	const editor = useEditor({
		extensions: [
			...extensions.filter((ext) => ext.name !== "placeholder"),
			// Override placeholder
			extensions.find((ext) => ext.name === "placeholder")?.configure({
				placeholder: PLACEHOLDERS.INTRODUCTION,
			}) || extensions.find((ext) => ext.name === "placeholder"),
		].filter(Boolean),
		content: "<p></p>",
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "tiptap ProseMirror focus:outline-none min-h-[88px]",
			},
		},
	});
	const controller = useProfileSettingsController(editor);
	const {
		profileData,
		uploadState,
		showResetDialog,
		setShowResetDialog,
		isDirty,
		handleInputChange,
		handleClearImage,
		handleOpenImageDialog,
		handleDialogConfirm,
		handleSave,
		handleReset,
		imagePicker,
	} = controller;
	const {
		state: {
			activeField: currentImageField,
			dialogThumbnail: imageThumbnail,
			assets,
			assetsLoading,
			assetsError,
			assetSearchQuery,
			pendingImages,
			hasPendingImages,
		},
		actions: {
			setDialogThumbnail: setImageThumbnail,
			setAssetSearchQuery,
			closeImageDialog,
			handleImageFileSelect: handleDialogFileSelect,
			handleSelectAsset,
		},
	} = imagePicker;

	useSettingStatus("profile", isDirty || hasPendingImages ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-profile"
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
		<>
			<AssetPickerDialog
				isOpen={currentImageField !== null}
				onOpenChange={(open) => {
					if (!open) closeImageDialog();
				}}
				thumbnail={imageThumbnail}
				setThumbnail={setImageThumbnail}
				onUpload={handleDialogConfirm}
				onFileSelect={handleDialogFileSelect}
				assets={assets}
				assetsLoading={assetsLoading}
				assetsError={assetsError}
				assetSearchQuery={assetSearchQuery}
				onAssetSearchChange={setAssetSearchQuery}
				onSelectAsset={handleSelectAsset}
				className="gap-1.5"
			/>
			<form
				id="setting-form-profile"
				onSubmit={(e) => {
					e.preventDefault();
					void handleSave();
				}}
				className="space-y-8"
			>
				{/* Profile Settings Section */}
				<section>
					<h2 className="text-[20px] font-semibold font-title">프로필 설정</h2>
					<div className="section-wrap mt-6">
						{/* Header Image */}
						<ImageUploadSection
							title="헤더 이미지"
							imageSrc={
								pendingImages.headerImage?.previewUrl ||
								profileData.headerImage
							}
							onFileSelect={() => undefined}
							onOpenPicker={() => handleOpenImageDialog("headerImage")}
							onClearClick={() => handleClearImage("headerImage")}
							isUploading={uploadState.loading}
						/>

						{/* Profile Image */}
						<ImageUploadSection
							title="프로필 이미지"
							imageSrc={
								pendingImages.profileImage?.previewUrl ||
								profileData.profileImage
							}
							onFileSelect={() => undefined}
							onOpenPicker={() => handleOpenImageDialog("profileImage")}
							onClearClick={() => handleClearImage("profileImage")}
							isUploading={uploadState.loading}
						/>

						{/* Nickname */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5 shrink-0">
								<h3 className="font-medium text-sub-text">닉네임</h3>
							</div>
							<div className="flex-1 min-w-0">
								<Input
									placeholder={PLACEHOLDERS.NICKNAME}
									value={profileData.nickname}
									onChange={(e) => handleInputChange("nickname", e.target.value)}
									className="rounded-card border-card bg-card-bg"
								/>
							</div>
						</div>

						{/* Introduction (Tiptap Editor) */}
						<div className="section-box flex items-start mt-4">
							<div className="text-box w-[220px] pr-5 pt-2 shrink-0">
								<h3 className="font-medium text-sub-text">자기소개</h3>
							</div>
							<div className="flex-1 min-w-0">
								{editor && (
									<div className="space-y-2">
										{/* Toolbar */}
										<div className="border-card rounded-card bg-card-bg p-2">
											<SimpleTiptapToolbar editor={editor} />
										</div>

										{/* Editor */}
										<div className="border-card rounded-card bg-card-bg p-3.5 min-h-[120px]">
											<EditorContent
												editor={editor}
												className="h-full w-full"
											/>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Etc */}
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px] pr-5 shrink-0">
								<h3 className="font-medium text-sub-text">etc</h3>
							</div>
							<div className="flex-1 min-w-0">
								<Input
									placeholder={PLACEHOLDERS.ETC}
									value={profileData.etc}
									onChange={(e) => handleInputChange("etc", e.target.value)}
									className="rounded-card border-card bg-card-bg"
								/>
							</div>
						</div>
					</div>
				</section>

				<Separator className="my-12" />

				{/* Action Buttons */}
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

				{/* Reset Confirmation Dialog */}
				<Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
					<DialogContent className="rounded-card border-card bg-card-bg backdrop-blur-sm">
						<DialogHeader>
							<DialogTitle>프로필 초기화</DialogTitle>
							<DialogDescription>
								정말 프로필 설정을 초기화할까요? 모든 내용이 삭제됩니다.
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
								onClick={handleReset}
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
		</>
	);
}
