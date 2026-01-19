/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import {
	Plus,
	ImagePlus,
	Trash2,
	Bell,
	Square,
	Book,
	Archive,
	Image as ImageIcon,
	MessageCircle,
	Settings,
	Folder,
	Link,
	Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import RadioItem from "@/components/items/RadioItem";
import { useSettingMenu } from "@/hooks/useSettingMenu";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import MenuPreviewItem from "@/components/items/MenuPreviewItem";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import MenuAddModal from "@/components/modal/MenuAddModal";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

const INPUT_HEIGHT = "h-9";
const ICON_SIZE = 28;
const ICON_COLOR = "#9BA2A8";
const UPLOAD_TEXT = "Upload Image";
const ICON_BAR_WIDTH = 88;

// 로컬 이미지 미리보기를 위한 타입
interface PendingImage {
	file: File;
	previewUrl: string;
}

type ImageFieldType = "logo" | "background" | "iconBarLogo" | "iconBarBackground";

interface ImageUploadSectionProps {
	title: string;
	description?: string;
	imageSrc?: string;
	onFileSelect: (file: File) => void;
	onClearClick: () => void;
	isUploading?: boolean;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
	title,
	description,
	imageSrc,
	onFileSelect,
	onClearClick,
	isUploading = false,
}) => (
	<div className="section-box flex items-center mt-4">
		<div className="text-box w-[220px]">
			<h3 className="font-medium text-sub-text">{title}</h3>
			{description && (
				<p className="text-xs text-gray-500 dark:text-gray-400">
					{description}
				</p>
			)}
		</div>
		<div className="flex items-center gap-3">
			<label
				className={`relative w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors ${
					isUploading ? "opacity-60 pointer-events-none" : ""
				}`}
			>
				{imageSrc ? (
					<img
						src={imageSrc}
						alt={title}
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
							{UPLOAD_TEXT}
						</span>
					</>
				)}
				<input
					type="file"
					accept="image/*"
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) {
							onFileSelect(file);
						}
						event.target.value = "";
					}}
				/>
			</label>
			{imageSrc && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onClearClick}
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
);

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

	// pending 이미지들 저장
	const [pendingImages, setPendingImages] = useState<
		Record<ImageFieldType, PendingImage | null>
	>({
		logo: null,
		background: null,
		iconBarLogo: null,
		iconBarBackground: null,
	});

	const hasPendingImages = Object.values(pendingImages).some((img) => img !== null);

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

	const getMenuIcon = (category: string) => {
		switch (category) {
			case "라이브러리":
				return <Book size={16} className="text-sub-text" />;
			case "아카이브":
				return <Archive size={16} className="text-sub-text" />;
			case "갤러리":
				return <ImageIcon size={16} className="text-sub-text" />;
			case "메모":
				return <MessageCircle size={16} className="text-sub-text" />;
			case "포토보드":
				return <ImageIcon size={16} className="text-sub-text" />;
			case "설정":
				return <Settings size={16} className="text-sub-text" />;
			case "폴더":
				return <Folder size={16} className="text-sub-text" />;
			case "커스텀":
				return <Link size={16} className="text-sub-text" />;
			default:
				return <Square size={16} className="text-sub-text" />;
		}
	};

	// 파일 선택 핸들러
	const handleFileSelect = (field: ImageFieldType, file: File) => {
		const previewUrl = URL.createObjectURL(file);
		setPendingImages((prev) => ({
			...prev,
			[field]: { file, previewUrl },
		}));
	};

	// 이미지 클리어 핸들러
	const handleImageClear = (field: ImageFieldType) => {
		// pending 이미지가 있으면 blob URL 정리
		if (pendingImages[field]) {
			URL.revokeObjectURL(pendingImages[field]!.previewUrl);
			setPendingImages((prev) => ({
				...prev,
				[field]: null,
			}));
		}

		// 실제 설정값도 클리어
		switch (field) {
			case "logo":
				updateMenuSetting("logo.image", "");
				break;
			case "background":
				updateMenuSetting("background.image", "");
				break;
			case "iconBarLogo":
				updateMenuSetting("iconbar.logo.image", "");
				break;
			case "iconBarBackground":
				updateMenuSetting("iconbar.background.image", "");
				break;
		}
	};

	// cleanup: 컴포넌트 언마운트 시 blob URL 정리
	useEffect(() => {
		return () => {
			Object.values(pendingImages).forEach((img) => {
				if (img) URL.revokeObjectURL(img.previewUrl);
			});
		};
	}, [pendingImages]);

	return (
		<>
			<MenuAddModal
				isModalOpen={isAddModalOpen}
				setIsModalOpen={setIsAddModalOpen}
				onAddMenu={handleAddMenu}
				boardArr={boardArr}
				cancelModal={() => setIsAddModalOpen(false)}
			/>

			<form
				id="setting-form-menu"
				onSubmit={async (e) => {
					e.preventDefault();

					try {
						// pending 이미지들이 있으면 먼저 업로드
						const uploadedUrls: Partial<Record<ImageFieldType, string>> = {};

						for (const field of Object.keys(
							pendingImages
						) as ImageFieldType[]) {
							const pending = pendingImages[field];
							if (pending) {
								const url = await uploadFile(pending.file);
								uploadedUrls[field] = url;
								URL.revokeObjectURL(pending.previewUrl);
							}
						}

						// 업로드된 URL들을 menuSetting에 반영
						if (uploadedUrls.logo) {
							updateMenuSetting("logo.image", uploadedUrls.logo);
						}
						if (uploadedUrls.background) {
							updateMenuSetting("background.image", uploadedUrls.background);
						}
						if (uploadedUrls.iconBarLogo) {
							updateMenuSetting("iconbar.logo.image", uploadedUrls.iconBarLogo);
						}
						if (uploadedUrls.iconBarBackground) {
							updateMenuSetting(
								"iconbar.background.image",
								uploadedUrls.iconBarBackground
							);
						}

						// pending 이미지 초기화
						setPendingImages({
							logo: null,
							background: null,
							iconBarLogo: null,
							iconBarBackground: null,
						});

						// 약간의 딜레이 후 저장 (updateMenuSetting이 비동기적으로 상태를 업데이트할 수 있으므로)
						if (Object.keys(uploadedUrls).length > 0) {
							setTimeout(() => {
								handleSave();
							}, 100);
						} else {
							handleSave();
						}
					} catch {
						toast.error("이미지 업로드 중 오류가 발생했습니다.");
					}
				}}
				className="space-y-8"
			>
				{/* 메뉴 디자인 Section */}
				<section>
					<h2 className="text-[20px] font-semibold">메뉴 디자인</h2>
					<div className="section-wrap mt-6">
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px]">
								<h3 className="font-medium text-sub-text">디자인 모드</h3>
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
									데스크톱/아이콘바 설정을 전환합니다.
								</p>
							</div>
							<div className="flex flex-1 items-center">
								<div className="inline-flex rounded-card border-card bg-card-bg p-1">
									<button
										type="button"
										onClick={() => setDesignMode("desktop")}
										className={`px-3 py-2 rounded-card text-sm font-medium transition-colors ${
											designMode === "desktop"
												? "bg-theme-primary text-white"
												: "text-sub-text hover:bg-card-bg/70"
										}`}
									>
										데스크톱 메뉴
									</button>
									<button
										type="button"
										onClick={() => setDesignMode("iconbar")}
										className={`px-3 py-2 rounded-card text-sm font-medium transition-colors ${
											designMode === "iconbar"
												? "bg-theme-primary text-white"
												: "text-sub-text hover:bg-card-bg/70"
										}`}
									>
										아이콘바
									</button>
								</div>
							</div>
						</div>

						{designMode === "desktop" && (
							<>
								{/* 메뉴 레이아웃 배치 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px]">
										<h3 className="font-medium text-sub-text">
											메뉴 레이아웃 배치
										</h3>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{align.map((el) => (
											<RadioItem
												key={el}
												onClickRadio={() => updateMenuDesign("align", el)}
												checked={menuDesign.align === el}
												content={el}
											/>
										))}
									</div>
								</div>

								{/* 메뉴 폰트 컬러 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px]">
										<h3 className="font-medium text-sub-text">
											메뉴 폰트 컬러
										</h3>
									</div>
									<div className="flex items-center gap-3">
										<ColorPicker
											value={menuDesign.fontColor}
											onChange={(color) =>
												updateMenuSetting("font.color", color)
											}
										/>
										<span
											className="text-sm font-mono"
											style={{ color: menuDesign.fontColor }}
										>
											{menuDesign.fontColor}
										</span>
									</div>
								</div>

								{/* 메뉴 텍스트 정렬 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px]">
										<h3 className="font-medium text-sub-text">
											메뉴 텍스트 정렬
										</h3>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
										{textAlign.map((el) => (
											<RadioItem
												key={el}
												onClickRadio={() => updateMenuDesign("textAlign", el)}
												checked={menuDesign.textAlign === el}
												content={el}
											/>
										))}
									</div>
								</div>

								{/* 메뉴 로고 타입 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px]">
										<h3 className="font-medium text-sub-text">
											메뉴 로고 타입
										</h3>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
										{menuTypes.map((el) => (
											<RadioItem
												key={el}
												onClickRadio={() => updateMenuDesign("logoType", el)}
												checked={menuDesign.logoType === el}
												content={el}
											/>
										))}
									</div>
								</div>

								{/* 로고 타이틀 (텍스트 로고일 때) */}
								{menuDesign.logoType === "텍스트" && (
									<div className="section-box flex items-center mt-4">
										<div className="text-box w-[220px]">
											<h3 className="font-medium text-sub-text">로고 타이틀</h3>
										</div>
										<div className="input-box flex-1">
											<Input
												placeholder="로고 타이틀을 입력해주세요"
												value={menuDesign.logoText}
												onChange={(e) =>
													updateMenuSetting("logo.text", e.target.value)
												}
												className={
													INPUT_HEIGHT +
													" rounded-card border-card focus:border-card-active bg-card-bg"
												}
											/>
										</div>
									</div>
								)}

								{/* 로고 이미지 (이미지 로고일 때) */}
								{menuDesign.logoType === "이미지" && (
									<ImageUploadSection
										title="로고 이미지"
										description="메뉴에 표시될 로고 이미지를 업로드하세요"
										imageSrc={
											pendingImages.logo?.previewUrl || menuDesign.logoImage
										}
										onFileSelect={(file) => handleFileSelect("logo", file)}
										onClearClick={() => handleImageClear("logo")}
										isUploading={uploadState.loading}
									/>
								)}

								{/* 메뉴 배경 타입 */}
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px]">
										<h3 className="font-medium text-sub-text">
											메뉴 배경 타입
										</h3>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
										{bgType.map((el) => (
											<RadioItem
												key={el}
												onClickRadio={() => updateMenuDesign("bgType", el)}
												checked={menuDesign.bgType === el}
												content={el}
											/>
										))}
									</div>
								</div>

								{/* 메뉴 배경 컬러 (단색일 때) */}
								{menuDesign.bgType === "단색" && (
									<div className="section-box flex items-center mt-4">
										<div className="text-box w-[220px]">
											<h3 className="font-medium text-sub-text">
												메뉴 배경 컬러
											</h3>
										</div>
										<div className="flex items-center gap-3">
											<ColorPicker
												value={menuDesign.backgroundColor}
												onChange={(color) =>
													updateMenuSetting("background.color", color)
												}
											/>
											<span
												className="text-sm font-mono"
												style={{ color: menuDesign.backgroundColor }}
											>
												{menuDesign.backgroundColor}
											</span>
										</div>
									</div>
								)}

								{/* 배경 이미지 (이미지일 때) */}
								{menuDesign.bgType === "이미지" && (
									<ImageUploadSection
										title="배경 이미지"
										description="메뉴 영역의 배경 이미지를 설정합니다."
										imageSrc={
											pendingImages.background?.previewUrl ||
											menuDesign.backgroundImage
										}
										onFileSelect={(file) => handleFileSelect("background", file)}
										onClearClick={() => handleImageClear("background")}
										isUploading={uploadState.loading}
									/>
								)}
							</>
						)}

						{designMode === "iconbar" && (
							<>
								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px]">
										<h3 className="font-medium text-sub-text">
											아이콘바 로고 타입
										</h3>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										{iconBarLogoTypes.map((el) => (
											<RadioItem
												key={el}
												onClickRadio={() =>
													updateMenuSetting("iconbar.logo.type", el)
												}
												checked={menuDesign.iconBarLogoType === el}
												content={el}
											/>
										))}
									</div>
								</div>

								{menuDesign.iconBarLogoType === "이미지" && (
									<ImageUploadSection
										title="아이콘바 로고 이미지"
										description="아이콘바에 표시될 로고를 업로드하세요."
										imageSrc={
											pendingImages.iconBarLogo?.previewUrl ||
											menuDesign.iconBarLogoImage
										}
										onFileSelect={(file) =>
											handleFileSelect("iconBarLogo", file)
										}
										onClearClick={() => handleImageClear("iconBarLogo")}
										isUploading={uploadState.loading}
									/>
								)}

								<div className="section-box flex items-center mt-4">
									<div className="text-box w-[220px]">
										<h3 className="font-medium text-sub-text">
											아이콘바 배경 타입
										</h3>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
										{iconBarBgTypes.map((el) => (
											<RadioItem
												key={el}
												onClickRadio={() =>
													updateMenuSetting("iconbar.bg.type", el)
												}
												checked={menuDesign.iconBarBgType === el}
												content={el}
											/>
										))}
									</div>
								</div>

								{menuDesign.iconBarBgType === "단색" && (
									<div className="section-box flex items-center mt-4">
										<div className="text-box w-[220px]">
											<h3 className="font-medium text-sub-text">
												아이콘바 배경 컬러
											</h3>
										</div>
										<div className="flex items-center gap-3">
											<ColorPicker
												value={menuDesign.iconBarBackgroundColor || "#ffffff"}
												onChange={(color) =>
													updateMenuSetting("iconbar.background.color", color)
												}
											/>
											<span
												className="text-sm font-mono"
												style={{ color: menuDesign.iconBarBackgroundColor }}
											>
												{menuDesign.iconBarBackgroundColor}
											</span>
										</div>
									</div>
								)}

								{menuDesign.iconBarBgType === "이미지" && (
									<ImageUploadSection
										title="아이콘바 배경 이미지"
										description="아이콘바의 배경 이미지를 설정합니다."
										imageSrc={
											pendingImages.iconBarBackground?.previewUrl ||
											menuDesign.iconBarBackgroundImage
										}
										onFileSelect={(file) =>
											handleFileSelect("iconBarBackground", file)
										}
										onClearClick={() => handleImageClear("iconBarBackground")}
										isUploading={uploadState.loading}
									/>
								)}
							</>
						)}
					</div>
				</section>

				<Separator className="my-12" />

				{/* 메뉴 설정 Section */}
				<section>
					<div className="flex items-center justify-between mb-2">
						<h2 className="text-[20px] font-semibold">메뉴 설정</h2>
						<Button
							type="button"
							onClick={() => setIsAddModalOpen(true)}
							className="gap-2"
						>
							<Plus size={16} />
							메뉴 추가하기
						</Button>
					</div>
					<p className="text-sm text-sub-text mb-6">
						메뉴 텍스트 및 이미지를 설정합니다. 드래그 앤 드롭으로 순서를 변경할
						수 있습니다. 최대 8개까지 추가 가능합니다.
					</p>

					{/* Menu Preview Container */}
					<div className="section-wrap flex justify-center gap-6 py-10 rounded-card border-card bg-card-bg">
						<aside
							className={cn(
								"w-[160px] h-[600px] rounded-xl shadow-2xl overflow-auto flex flex-col items-center justify-center",
								menuDesign.bgType === "없음" && "bg-transparent",
								"bg-center"
							)}
							style={{
								backgroundColor:
									menuDesign.bgType === "단색"
										? menuDesign.backgroundColor
										: "transparent",
								backgroundImage:
									menuDesign.bgType === "이미지" && menuDesign.backgroundImage
										? `url('${menuDesign.backgroundImage}')`
										: "none",
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						>
							<nav
								className="w-full h-full flex flex-col justify-center py-6"
								style={{ fontFamily: "var(--font-title)" }}
							>
								{/* Logo */}
								{menuDesign.logoType === "이미지" && menuDesign.logoImage && (
									<div className="max-w-[160px] aspect-square px-4 mb-4">
										<Image
											className="w-full h-full block object-cover object-center rounded-lg"
											src={menuDesign.logoImage}
											alt="Logo"
											width={160}
											height={160}
										/>
									</div>
								)}
								{menuDesign.logoType === "텍스트" && menuDesign.logoText && (
									<div
										className="text-center mb-4 font-bold text-lg px-4 h-14 flex items-center justify-center break-keep"
										style={{ color: menuDesign.fontColor }}
									>
										{menuDesign.logoText}
									</div>
								)}

								{/* Menu Items with Drag & Drop */}
								<DragDropContext onDragEnd={handleDragEnd}>
									<Droppable droppableId="menus">
										{(provided) => (
											<ul
												{...provided.droppableProps}
												ref={provided.innerRef}
												className="flex flex-col gap-2.5 list-none"
											>
												{menus.map((menu, index) => (
													<MenuPreviewItem
														key={menu.uniqueId}
														menu={menu}
														index={index}
														design={menuDesign}
														openFolders={openFolders}
														onToggleFolder={handleToggleFolder}
														onUpdateMenu={(updated) =>
															handleUpdateMenu(index, updated)
														}
														handleDeleteMenu={handleDeleteMenu}
														boardArr={boardArr}
													/>
												))}
												{provided.placeholder}
											</ul>
										)}
									</Droppable>
								</DragDropContext>

								{/* Action Buttons */}
								<div className="flex gap-2 flex-col items-center my-4">
									<button
										type="button"
										className={cn(
											"w-9 h-9 rounded-full flex items-center justify-center",
											"transition-all duration-300 ease-in-out opacity-40 pointer-events-none"
										)}
										aria-label="알림"
									>
										<Bell size={18} color={menuDesign.fontColor || "#333"} />
									</button>
									<button
										type="button"
										className={cn(
											"w-9 h-9 rounded-full flex items-center justify-center opacity-40 pointer-events-none"
										)}
										aria-label="음악"
									>
										<div className="flex items-end justify-center w-4 h-4">
											{[0, 0.1, 0.2, 0.3, 0.4].map((delay, index) => (
												<span
													key={index}
													style={{
														display: "block",
														width: "1px",
														background: menuDesign.fontColor || "#333333",
														margin: "0 1px",
														height: ["6px", "8px", "10px", "13px", "15px"][
															index
														],
													}}
												/>
											))}
										</div>
									</button>
								</div>

								{/* Login Button */}
								<div className="flex justify-center opacity-40 pointer-events-none px-4">
									<Button
										size="sm"
										style={{
											color: menuDesign.fontColor,
											borderColor: `${menuDesign.fontColor}33`,
										}}
									>
										로그인
									</Button>
								</div>
							</nav>
						</aside>

						{/* Icon Bar Preview */}
						<aside
							className="h-[600px] rounded-xl shadow-2xl overflow-visible flex flex-col items-center"
							style={{
								width: `${ICON_BAR_WIDTH}px`,
								backgroundColor:
									menuDesign.iconBarBgType === "단색"
										? menuDesign.iconBarBackgroundColor || "#ffffff"
										: "transparent",
								backgroundImage:
									menuDesign.iconBarBgType === "이미지" &&
									menuDesign.iconBarBackgroundImage
										? `url('${menuDesign.iconBarBackgroundImage}')`
										: "none",
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						>
							<nav
								className="w-full h-full flex flex-col items-center justify-center py-6 overflow-visible gap-3"
								style={{ fontFamily: "var(--font-title)" }}
							>
								<div className="w-full flex items-center justify-center mb-6">
									{menuDesign.iconBarLogoType === "이미지" &&
									menuDesign.iconBarLogoImage ? (
										<img
											src={menuDesign.iconBarLogoImage}
											alt="Icon Bar Logo"
											className="w-10 h-10 rounded-full object-contain"
										/>
									) : menuDesign.iconBarLogoType === "이미지" ? (
										<div className="w-10 h-10 rounded-full bg-card-bg/70 flex items-center justify-center text-xs text-sub-text">
											LOGO
										</div>
									) : null}
								</div>

								<ul className="flex flex-col items-center gap-3">
									{menus.map((menu) => (
										<li key={menu.uniqueId} className="relative">
											<div className="relative group">
												{menu.iconImage ? (
													<div className="w-10 h-10 flex items-center justify-center leading-none">
														<img
															src={menu.iconImage}
															alt={menu.name}
															className="block w-10 h-10 object-contain"
														/>
													</div>
												) : (
													<button
														type="button"
														className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center leading-none"
														onClick={() => {
															if (menu.category === "폴더") {
																handleToggleFolder(menu.uniqueId);
															}
														}}
													>
														{getMenuIcon(menu.category)}
													</button>
												)}
												<span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-card bg-card-bg px-2 py-1 text-xs text-sub-text opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">
													{menu.name}
												</span>
											</div>
											{menu.category === "폴더" && menu.subMenus?.length ? (
												<ul
													className="flex flex-col items-center gap-2 overflow-hidden"
													style={{
														marginTop: openFolders[menu.uniqueId]
															? "8px"
															: "0px",
														maxHeight: openFolders[menu.uniqueId]
															? "160px"
															: "0px",
														opacity: openFolders[menu.uniqueId] ? 1 : 0,
														transition:
															"max-height 300ms ease, opacity 300ms ease",
													}}
												>
													{menu.subMenus.map((subMenu, idx) => {
														const name =
															typeof subMenu === "string"
																? subMenu
																: subMenu.name;
														return (
															<li key={`${menu.uniqueId}-sub-${idx}`}>
																<div className="relative group">
																	<button
																		type="button"
																		className="w-8 h-8 rounded-full bg-card-bg/60 border border-card flex items-center justify-center"
																	>
																		{getMenuIcon(name)}
																	</button>
																	<span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-card bg-card-bg px-2 py-1 text-xs text-sub-text opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">
																		{name}
																	</span>
																</div>
															</li>
														);
													})}
												</ul>
											) : null}
										</li>
									))}
								</ul>

								<div className="flex flex-col items-center gap-3 mb-6">
									<button
										type="button"
										className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center opacity-80"
										aria-label="알림"
									>
										<Bell size={18} className="text-sub-text" />
									</button>
									<button
										type="button"
										className="w-10 h-10 rounded-full bg-card-bg/60 border border-card flex items-center justify-center opacity-80"
										aria-label="음악"
									>
										<div className="flex items-end justify-center w-4 h-4">
											{[0, 0.1, 0.2, 0.3, 0.4].map((delay, index) => (
												<span
													key={index}
													style={{
														display: "block",
														width: "1px",
														background: menuDesign.fontColor || "#333333",
														margin: "0 1px",
														height: ["6px", "8px", "10px", "13px", "15px"][
															index
														],
													}}
												/>
											))}
										</div>
									</button>
								</div>

								<div className="flex justify-center">
									<Button size="sm" className="opacity-80">
										로그인
									</Button>
								</div>
							</nav>
						</aside>
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
							<DialogTitle>메뉴 초기화</DialogTitle>
							<DialogDescription>
								정말 메뉴 설정을 초기화할까요? 모든 메뉴가 삭제됩니다.
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
								onClick={() => {
									handleReset();
									setShowResetDialog(false);
								}}
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
