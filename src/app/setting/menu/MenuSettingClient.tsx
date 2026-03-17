"use client";

import { useState } from "react";
import {
	Plus,
	Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSettingMenu } from "@/hooks/useSettingMenu";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import MenuAddModal from "@/components/modal/MenuAddModal";
import { useFileUpload } from "@/hooks/useFileUpload";
import { MenuPreviewSection } from "@/features/settings/components/menu/MenuPreviewSection";
import { MenuResetDialog } from "@/features/settings/components/menu/MenuResetDialog";
import { MenuDesignSection } from "@/features/settings/components/menu/MenuDesignSection";
import { useMenuImageManager } from "@/features/settings/hooks/menu/useMenuImageManager";
import { AssetPickerDialog } from "@/features/settings/components/AssetPickerDialog";

export default function MenuSettingClient() {
	const {
		handleAddMenu,
		menus,
		menuTypes,
		align,
		textAlign,
		bgType,
		updateMenuSetting,
		menuDesign,
		updateMenuDesign,
		handleReset,
		handleSave,
		boardArr,
		handleUpdateMenu,
		handleDeleteMenu,
		handleDragEnd,
		isDirty,
	} = useSettingMenu();

	const { uploadFile, state: uploadState } = useFileUpload();
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [showResetDialog, setShowResetDialog] = useState(false);
	const {
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
	} = useMenuImageManager({
		menuDesign,
		uploadFile,
		updateMenuSetting,
	});

	useSettingStatus("menu", isDirty || hasPendingImages ? "dirty" : "saved");
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-menu"
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
	const [openFolders, setOpenFolders] = useState<{ [key: string]: boolean }>(
		{}
	);
	const [designMode, setDesignMode] = useState<"desktop" | "iconbar">(
		"desktop"
	);

	const iconBarLogoTypes = ["없음", "이미지"];
	const iconBarBgTypes = ["없음", "단색", "이미지"];

	const handleToggleFolder = (uniqueId: string) => {
		setOpenFolders((prev) => ({
			...prev,
			[uniqueId]: !prev[uniqueId],
		}));
	};

	return (
		<>
			<MenuAddModal
				isModalOpen={isAddModalOpen}
				setIsModalOpen={setIsAddModalOpen}
				onAddMenu={handleAddMenu}
				boardArr={boardArr}
				cancelModal={() => setIsAddModalOpen(false)}
			/>

			<AssetPickerDialog
				isOpen={activeImageField !== null}
				onOpenChange={(open) => {
					if (!open) {
						setActiveImageField(null);
						setAssetSearchQuery("");
					}
				}}
				thumbnail={dialogThumbnail}
				setThumbnail={setDialogThumbnail}
				onUpload={handleImageDialogConfirm}
				onFileSelect={handleImageFileSelect}
				assets={assets}
				assetsLoading={assetsLoading}
				assetsError={assetsError}
				assetSearchQuery={assetSearchQuery}
				onAssetSearchChange={setAssetSearchQuery}
				onSelectAsset={handleSelectAsset}
			/>

			<form
				id="setting-form-menu"
				onSubmit={async (e) => {
					e.preventDefault();

					try {
						const nextMenuDesign = await uploadPendingImages(menuDesign);
						handleSave({ design: nextMenuDesign, menus });
					} catch {}
				}}
				className="space-y-8"
			>
				<MenuDesignSection
					designMode={designMode}
					setDesignMode={setDesignMode}
					align={align}
					textAlign={textAlign}
					bgType={bgType}
					menuTypes={menuTypes}
					iconBarLogoTypes={iconBarLogoTypes}
					iconBarBgTypes={iconBarBgTypes}
					menuDesign={menuDesign}
					pendingImages={pendingImages}
					updateMenuDesign={updateMenuDesign}
					updateMenuSetting={updateMenuSetting}
					handleFileSelect={handleFileSelect}
					handleImageClear={handleImageClear}
					handleOpenImageDialog={handleOpenImageDialog}
					isUploading={uploadState.loading}
				/>

				<Separator className="my-12" />

				<section>
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-[20px] font-semibold font-title">메뉴 설정</h2>
						<Button
							type="button"
							onClick={() => setIsAddModalOpen(true)}
							className="gap-2"
						>
							<Plus size={16} />
							메뉴 추가하기
						</Button>
					</div>
					<MenuPreviewSection
						menus={menus}
						menuDesign={menuDesign}
						openFolders={openFolders}
						onToggleFolder={handleToggleFolder}
						onUpdateMenu={handleUpdateMenu}
						onDeleteMenu={handleDeleteMenu}
						onDragEnd={handleDragEnd}
						boardArr={boardArr}
					/>
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

				<MenuResetDialog
					open={showResetDialog}
					onOpenChange={setShowResetDialog}
					onConfirm={() => {
						handleReset();
						setShowResetDialog(false);
					}}
				/>
			</form>
		</>
	);
}
