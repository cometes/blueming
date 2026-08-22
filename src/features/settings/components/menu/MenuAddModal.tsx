"use client";

import { useEffect, useState, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import { useSettingsImagePicker } from "@/features/settings/hooks/useSettingsImagePicker";
import MenuAssetPicker from "./MenuAssetPicker";
import MenuNameVisibilityFields from "./MenuNameVisibilityFields";
import MenuImageUploadField from "./MenuImageUploadField";
import MenuPostingTab from "./MenuPostingTab";
import MenuFolderTab from "./MenuFolderTab";
import MenuCustomTab from "./MenuCustomTab";
import type { SubMenu, PendingImage } from "./MenuFolderTab";

type MenuTab = "posting" | "folder" | "custom";

type MenuFormData = {
	name: string;
	category: string;
	url: string;
	isPublic: boolean;
	openInNewTab: boolean;
	subMenus: (string | SubMenu)[];
	image: string;
	iconImage: string;
};

const EMPTY_FORM: MenuFormData = {
	name: "",
	category: "",
	url: "",
	isPublic: true,
	openInNewTab: false,
	subMenus: [],
	image: "",
	iconImage: "",
};

interface MenuAddModalProps {
	isModalOpen: boolean;
	setIsModalOpen: (open: boolean) => void;
	onAddMenu: (data: MenuFormData & { type: MenuTab }) => void;
	boardArr: { label: string; value: string }[];
	cancelModal: () => void;
}

export default function MenuAddModal({
	isModalOpen,
	setIsModalOpen,
	onAddMenu,
	boardArr,
	cancelModal,
}: MenuAddModalProps) {
	const { uploadFile, state: uploadState } = useFileUpload();
	const [activeTab, setActiveTab] = useState<MenuTab>("posting");
	const [formData, setFormData] = useState<MenuFormData>(EMPTY_FORM);
	const [pendingSubMenuImages, setPendingSubMenuImages] = useState<
		Record<string, PendingImage>
	>({});

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

	const clearPendingSubMenuImage = (name: string) => {
		const pending = pendingSubMenuImages[name];
		if (!pending) return;
		URL.revokeObjectURL(pending.previewUrl);
		setPendingSubMenuImages((prev) => {
			const next = { ...prev };
			delete next[name];
			return next;
		});
	};

	const revokePendingImages = useCallback(() => {
		Object.values(pendingSubMenuImages).forEach((pending) => {
			URL.revokeObjectURL(pending.previewUrl);
		});
	}, [pendingSubMenuImages]);

	const resetPendingImages = useCallback(() => {
		revokePendingImages();
		clearAllPendingImages();
		setPendingSubMenuImages({});
	}, [clearAllPendingImages, revokePendingImages]);

	const handleAdd = async () => {
		if (!formData.name) return;
		try {
			let nextFormData = { ...formData };

			if (pendingImages.image) {
				const url = await uploadFile(pendingImages.image.file);
				nextFormData = { ...nextFormData, image: url };
			}

			if (pendingImages.iconImage) {
				const url = await uploadFile(pendingImages.iconImage.file);
				nextFormData = { ...nextFormData, iconImage: url };
			}

			if (nextFormData.subMenus.length > 0) {
				const updatedSubMenus = [...nextFormData.subMenus];
				for (let i = 0; i < updatedSubMenus.length; i += 1) {
					const subMenu = updatedSubMenus[i];
					const name = typeof subMenu === "string" ? subMenu : subMenu.name;
					const pending = pendingSubMenuImages[name];
					if (pending) {
						const url = await uploadFile(pending.file);
						URL.revokeObjectURL(pending.previewUrl);
						updatedSubMenus[i] = { name, image: url };
					}
				}
				nextFormData = { ...nextFormData, subMenus: updatedSubMenus };
			}

			onAddMenu({ ...nextFormData, type: activeTab });
			setFormData(EMPTY_FORM);
			resetPendingImages();
			setIsModalOpen(false);
		} catch {
			toast.error("이미지 업로드에 실패했습니다.");
		}
	};

	const handleAddSubMenu = (boardName: string) => {
		const normalizedSubMenus = formData.subMenus.map((item) =>
			typeof item === "string" ? { name: item, image: "" } : item
		);
		if (normalizedSubMenus.some((m) => m.name === boardName)) return;
		setFormData({
			...formData,
			subMenus: [...normalizedSubMenus, { name: boardName, image: "" }],
		});
	};

	const handleRemoveSubMenu = (idx: number) => {
		const target = formData.subMenus[idx];
		const targetName = typeof target === "string" ? target : target.name;
		clearPendingSubMenuImage(targetName);
		setFormData({
			...formData,
			subMenus: formData.subMenus.filter((_, i) => i !== idx),
		});
	};

	const handleSubMenuImageSelect = (file: File, name: string) => {
		const previewUrl = URL.createObjectURL(file);
		setPendingSubMenuImages((prev) => ({
			...prev,
			[name]: { file, previewUrl },
		}));
	};

	const handleClearSubMenuImage = (smName: string, idx: number) => {
		if (pendingSubMenuImages[smName]) {
			clearPendingSubMenuImage(smName);
			return;
		}
		const updatedSubMenus = formData.subMenus.map((subMenu, i) => {
			if (i === idx) {
				const name = typeof subMenu === "string" ? subMenu : subMenu.name;
				return { name, image: "" };
			}
			return subMenu;
		});
		setFormData({ ...formData, subMenus: updatedSubMenus });
	};

	const handleImageDialogConfirm = async (selectedUrl: string) => {
		if (!activeField) return;
		if (imageSource === "asset" && selectedUrl) {
			clearPendingImage(activeField);
			setFormData((prev) => ({ ...prev, [activeField]: selectedUrl }));
		}
		closeImageDialog();
	};

	useEffect(() => {
		if (
			!isModalOpen &&
			(pendingImages.image ||
				pendingImages.iconImage ||
				Object.keys(pendingSubMenuImages).length > 0)
		) {
			resetPendingImages();
		}
	}, [isModalOpen, pendingImages, pendingSubMenuImages, resetPendingImages]);

	useEffect(() => {
		return () => {
			revokePendingImages();
		};
	}, [pendingImages, pendingSubMenuImages, revokePendingImages]);

	return (
		<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
			<MenuAssetPicker
				picker={imagePicker}
				onUpload={(url) => {
					void handleImageDialogConfirm(url);
				}}
			/>
			<DialogContent
				className="max-w-md max-h-[85vh] bg-card-bg border-card rounded-card backdrop-blur-card flex flex-col"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-xl font-bold flex items-center gap-2 font-title">
							메뉴 추가
							<Badge variant="secondary" className="px-2 py-0 text-[10px] h-5">
								{activeTab === "posting"
									? "포스팅"
									: activeTab === "folder"
									? "폴더"
									: "커스텀"}
							</Badge>
						</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-sub-text">
						메뉴 타입과 정보를 입력해 추가하세요.
					</DialogDescription>
				</DialogHeader>
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as MenuTab)}
					className="w-full flex-1 flex flex-col overflow-hidden"
				>
					<TabsList className="grid w-full grid-cols-3 mb-4">
						<TabsTrigger value="posting" className="text-xs">
							포스팅
						</TabsTrigger>
						<TabsTrigger value="folder" className="text-xs">
							폴더
						</TabsTrigger>
						<TabsTrigger value="custom" className="text-xs">
							커스텀
						</TabsTrigger>
					</TabsList>

					<div className="space-y-6 py-4 flex-1 overflow-y-auto menu-modal-scroll pr-1">
						<MenuNameVisibilityFields
							name={formData.name}
							onNameChange={(v) => setFormData({ ...formData, name: v })}
							isPublic={formData.isPublic}
							onPublicChange={(isPub) =>
								setFormData({ ...formData, isPublic: isPub })
							}
						/>

						<div className="space-y-3 pt-2 border-t border-card/40">
							<TabsContent value="posting" className="mt-0">
								<MenuPostingTab
									category={formData.category}
									boardArr={boardArr}
									onCategoryChange={(v) =>
										setFormData({ ...formData, category: v })
									}
								/>
							</TabsContent>

							<TabsContent value="folder" className="mt-0">
								<MenuFolderTab
									boardArr={boardArr}
									subMenus={formData.subMenus}
									pendingSubMenuImages={pendingSubMenuImages}
									onAddSubMenu={handleAddSubMenu}
									onRemoveSubMenu={handleRemoveSubMenu}
									onSubMenuImageSelect={handleSubMenuImageSelect}
									onClearSubMenuImage={handleClearSubMenuImage}
								/>
							</TabsContent>

							<TabsContent value="custom" className="mt-0">
								<MenuCustomTab
									url={formData.url}
									openInNewTab={formData.openInNewTab}
									onUrlChange={(v) => setFormData({ ...formData, url: v })}
									onOpenInNewTabChange={(v) =>
										setFormData({ ...formData, openInNewTab: v })
									}
								/>
							</TabsContent>
						</div>

						{/* Image Settings */}
						<div className="space-y-3 pt-2 border-t border-card/40">
							<div className="grid grid-cols-2 gap-4 items-stretch">
								<div className="space-y-3 flex flex-col">
									<MenuImageUploadField
										label="메뉴 이미지"
										hint="권장 사이즈: 220 * 80"
										uploadLabel="이미지 업로드"
										variant="banner"
										previewUrl={
											pendingImages.image?.previewUrl || formData.image
										}
										onOpenPicker={() =>
											openImageDialog("image", formData.image || "")
										}
										onClear={() => {
											if (pendingImages.image) {
												clearPendingImage("image");
											}
											setFormData((prev) => ({ ...prev, image: "" }));
										}}
									/>
								</div>

								<div className="space-y-3 flex flex-col">
									<MenuImageUploadField
										label="아이콘바 아이콘 이미지"
										hint="권장 사이즈: 64 * 64"
										uploadLabel="아이콘 업로드"
										variant="icon"
										previewUrl={
											pendingImages.iconImage?.previewUrl || formData.iconImage
										}
										onOpenPicker={() =>
											openImageDialog("iconImage", formData.iconImage || "")
										}
										onClear={() => {
											if (pendingImages.iconImage) {
												clearPendingImage("iconImage");
											}
											setFormData((prev) => ({ ...prev, iconImage: "" }));
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</Tabs>
				<div className="flex items-center justify-end gap-2 pt-4 border-t border-card/40">
					<Button variant="ghost" onClick={cancelModal}>
						취소
					</Button>
					<Button
						onClick={handleAdd}
						disabled={!formData.name || uploadState.loading}
					>
						추가하기
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
