"use client";

import { useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type {
	MenuItem as MenuItemType,
	SubMenu,
} from "@/features/settings/types";
import { useSettingsImagePicker } from "@/features/settings/hooks/useSettingsImagePicker";
import { uploadSingleFile } from "@/shared/lib/http/uploads";
import MenuAssetPicker from "./MenuAssetPicker";
import MenuNameVisibilityFields from "./MenuNameVisibilityFields";
import MenuImageUploadField from "./MenuImageUploadField";
import MenuEditFolderSection from "./MenuEditFolderSection";
import MenuPostingTab from "./MenuPostingTab";
import MenuCustomTab from "./MenuCustomTab";

interface MenuEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	menu: MenuItemType;
	boardArr: { label: string; value: string }[];
	onUpdateMenu: (updatedMenu: Partial<MenuItemType>) => void;
	handleDeleteMenu: (uniqueId: string) => void;
}

export default function MenuEditModal({
	isOpen,
	onClose,
	menu,
	boardArr,
	onUpdateMenu,
	handleDeleteMenu,
}: MenuEditModalProps) {
	const imagePicker = useSettingsImagePicker<"image" | "iconImage">({
		fields: ["image", "iconImage"] as const,
	});
	const {
		state: { activeField, pendingImages, imageSource },
		actions: {
			closeImageDialog,
			clearPendingImage,
			clearAllPendingImages,
			openImageDialog,
		},
	} = imagePicker;

	const handleChange = (
		field: keyof MenuItemType,
		value: MenuItemType[keyof MenuItemType]
	) => {
		onUpdateMenu({ [field]: value });
	};

	const currentSubMenus = (menu.subMenus || []) as (string | SubMenu)[];

	const handleAddSubMenu = (boardName: string) => {
		const normalizedSubMenus = currentSubMenus.map((item) =>
			typeof item === "string" ? { name: item, image: "" } : item
		);
		if (normalizedSubMenus.some((m) => m.name === boardName)) {
			return;
		}
		handleChange("subMenus", [
			...normalizedSubMenus,
			{ name: boardName, image: "" },
		]);
	};

	const handleRemoveSubMenu = (idx: number) => {
		handleChange(
			"subMenus",
			currentSubMenus.filter((_, i) => i !== idx)
		);
	};

	const handleSubMenuImageUpload = async (file: File, idx: number) => {
		try {
			const url = await uploadSingleFile(file);
			const updatedSubMenus = currentSubMenus.map((subMenu, i) => {
				if (i === idx) {
					const name = typeof subMenu === "string" ? subMenu : subMenu.name;
					return { name, image: url };
				}
				return subMenu;
			});
			handleChange("subMenus", updatedSubMenus);
			toast.success("이미지가 업로드되었습니다.");
		} catch {
			toast.error("이미지 업로드에 실패했습니다.");
		}
	};

	const handleClearSubMenuImage = (idx: number) => {
		const updatedSubMenus = currentSubMenus.map((subMenu, i) => {
			if (i === idx) {
				const name = typeof subMenu === "string" ? subMenu : subMenu.name;
				return { name, image: "" };
			}
			return subMenu;
		});
		handleChange("subMenus", updatedSubMenus);
	};

	const handleDialogConfirm = async (selectedUrl: string) => {
		if (!activeField) return;
		try {
			if (imageSource === "asset" && selectedUrl) {
				clearPendingImage(activeField);
				handleChange(activeField, selectedUrl);
			} else if (imageSource === "file") {
				const pending = pendingImages[activeField];
				if (!pending) return;
				const uploadedUrl = await uploadSingleFile(pending.file);
				handleChange(activeField, uploadedUrl);
				clearPendingImage(activeField);
				toast.success("이미지가 업로드되었습니다.");
			}
		} catch {
			toast.error("이미지 업로드에 실패했습니다.");
		} finally {
			closeImageDialog();
		}
	};

	useEffect(() => {
		if (!isOpen) {
			clearAllPendingImages();
		}
	}, [clearAllPendingImages, isOpen]);

	const menuTypeLabel = {
		posting: "포스팅",
		folder: "폴더",
		custom: "커스텀",
	}[menu.type || "custom"];

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<MenuAssetPicker
				picker={imagePicker}
				onUpload={(url) => {
					void handleDialogConfirm(url);
				}}
			/>
			<DialogContent
				className="max-w-md bg-card-bg border-card rounded-card"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-xl font-bold flex items-center gap-2 font-title">
							메뉴 설정
							<Badge variant="secondary" className="px-2 py-0 text-[10px] h-5">
								{menuTypeLabel}
							</Badge>
						</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-sub-text">
						메뉴 정보를 수정하고 저장하세요.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="space-y-3">
						<MenuNameVisibilityFields
							name={menu.name}
							onNameChange={(v) => handleChange("name", v)}
							isPublic={!!menu.isPublic}
							onPublicChange={(isPub) =>
								onUpdateMenu({
									isPublic: isPub,
									allow: isPub ? "all" : "private",
								})
							}
						/>
					</div>

					{/* Type Specific Fields */}
					<div className="space-y-3 pt-2 border-t border-card/40">
						{menu.type === "posting" && (
							<MenuPostingTab
								category={menu.category ?? ""}
								boardArr={boardArr}
								onCategoryChange={(v) => handleChange("category", v)}
							/>
						)}

						{menu.type === "custom" && (
							<MenuCustomTab
								url={menu.url ?? ""}
								openInNewTab={!!menu.openInNewTab}
								onUrlChange={(v) => handleChange("url", v)}
								onOpenInNewTabChange={(v) =>
									onUpdateMenu({ openInNewTab: v, target: v })
								}
							/>
						)}

						{menu.type === "folder" && (
							<MenuEditFolderSection
								boardArr={boardArr}
								subMenus={currentSubMenus}
								onAddSubMenu={handleAddSubMenu}
								onRemoveSubMenu={handleRemoveSubMenu}
								onUploadImage={handleSubMenuImageUpload}
								onClearImage={handleClearSubMenuImage}
							/>
						)}
					</div>

					{/* Image Settings */}
					<div className="space-y-3 pt-2 border-t border-card/40">
						<MenuImageUploadField
							label="메뉴 이미지"
							hint="권장 사이즈: 220 * 80"
							uploadLabel="이미지 업로드"
							variant="banner"
							previewUrl={pendingImages.image?.previewUrl || menu.image}
							onOpenPicker={() => openImageDialog("image", menu.image || "")}
							onClear={() => {
								clearPendingImage("image");
								handleChange("image", "");
							}}
						/>
					</div>

					<div className="space-y-3 pt-2 border-t border-card/40">
						<MenuImageUploadField
							label="아이콘바 아이콘 이미지"
							hint="권장 사이즈: 64 * 64"
							uploadLabel="아이콘 업로드"
							variant="icon"
							previewUrl={pendingImages.iconImage?.previewUrl || menu.iconImage}
							onOpenPicker={() =>
								openImageDialog("iconImage", menu.iconImage || "")
							}
							onClear={() => {
								clearPendingImage("iconImage");
								handleChange("iconImage", "");
							}}
						/>
					</div>
				</div>

				<div className="flex items-center justify-between pt-4 border-t border-card/40">
					<Button
						variant="ghost"
						onClick={() => {
							if (confirm("정말 이 메뉴를 삭제하시겠습니까?")) {
								handleDeleteMenu(menu.uniqueId);
								onClose();
							}
						}}
						className="text-destructive/70 hover:text-destructive hover:bg-destructive/5"
					>
						<Trash2 size={16} className="mr-2" />
						메뉴 삭제
					</Button>
					<Button onClick={onClose} className="px-8">
						확인
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
