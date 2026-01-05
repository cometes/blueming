"use client";

import { useState } from "react";
import { Plus, ImagePlus, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import RadioItem from "@/components/items/RadioItem";
import { useSettingMenu } from "@/hooks/useSettingMenu";
import MenuPreviewItem from "@/components/items/MenuPreviewItem";
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

interface ImageUploadSectionProps {
	title: string;
	description?: string;
	imageSrc?: string;
	onImageClick: () => void;
	onClearClick: () => void;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
	title,
	description,
	imageSrc,
	onImageClick,
	onClearClick,
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
			{imageSrc ? (
				<>
					<div className="w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden">
						<img
							src={imageSrc}
							alt={title}
							className="w-full h-full object-contain"
						/>
					</div>
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
				</>
			) : (
				<div
					onClick={onImageClick}
					className="w-3xs max-h-32 aspect-video rounded-card border-card bg-card-bg overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-card-active transition-colors"
				>
					<ImagePlus
						size={ICON_SIZE}
						color={ICON_COLOR}
						absoluteStrokeWidth={true}
					/>
					<span className="text-xs text-gray-500 dark:text-gray-400">
						{UPLOAD_TEXT}
					</span>
				</div>
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
	} = useSettingMenu();

	const { uploadFile } = useFileUpload();
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [showResetConfirm, setShowResetConfirm] = useState(false);
	const [openFolders, setOpenFolders] = useState<{ [key: string]: boolean }>(
		{}
	);

	const handleToggleFolder = (uniqueId: string) => {
		setOpenFolders((prev) => ({
			...prev,
			[uniqueId]: !prev[uniqueId],
		}));
	};

	const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const url = await uploadFile(file);
			updateMenuSetting("logo.image", url);
			toast.success("로고 이미지가 업로드되었습니다.");
		} catch (error) {
			toast.error("로고 이미지 업로드에 실패했습니다.");
		}
	};

	const triggerLogoUpload = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = (e: any) => handleLogoUpload(e);
		input.click();
	};

	const handleBackgroundUpload = async (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = e.target.files?.[0];
		if (!file) return;
		try {
			const url = await uploadFile(file);
			updateMenuSetting("background.image", url);
			toast.success("배경 이미지가 업로드되었습니다.");
		} catch (error) {
			toast.error("배경 이미지 업로드에 실패했습니다.");
		}
	};

	const triggerBackgroundUpload = () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = (e: any) => handleBackgroundUpload(e);
		input.click();
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

			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSave();
				}}
				className="space-y-8"
			>
				{/* 메뉴 디자인 Section */}
				<section>
					<h2 className="text-[20px] font-semibold">메뉴 디자인</h2>
					<div className="section-wrap mt-6">
					{/* 메뉴 레이아웃 배치 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">메뉴 레이아웃 배치</h3>
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
							<h3 className="font-medium text-sub-text">메뉴 폰트 컬러</h3>
						</div>
						<div className="flex items-center gap-3">
							<ColorPicker
								value={menuDesign.fontColor}
								onChange={(color) => updateMenuSetting("font.color", color)}
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
							<h3 className="font-medium text-sub-text">메뉴 텍스트 정렬</h3>
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
							<h3 className="font-medium text-sub-text">메뉴 로고 타입</h3>
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
							imageSrc={menuDesign.logoImage}
							onImageClick={triggerLogoUpload}
							onClearClick={() => updateMenuSetting("logo.image", "")}
						/>
					)}

					{/* 메뉴 배경 타입 */}
					<div className="section-box flex items-center mt-4">
						<div className="text-box w-[220px]">
							<h3 className="font-medium text-sub-text">메뉴 배경 타입</h3>
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
								<h3 className="font-medium text-sub-text">메뉴 배경 컬러</h3>
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
							imageSrc={menuDesign.backgroundImage}
							onImageClick={triggerBackgroundUpload}
							onClearClick={() => updateMenuSetting("background.image", "")}
						/>
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
					<div className="section-wrap flex justify-center py-10 rounded-card border-card bg-card-bg">
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
						<nav className="w-full h-full flex flex-col justify-center py-6">
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
									className="text-center mb-4 font-bold text-lg px-4"
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
													height: ["6px", "8px", "10px", "13px", "15px"][index],
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
					</div>
				</section>

				{/* Submit Buttons */}
				<div className="flex justify-end gap-3 pt-6">
					{showResetConfirm ? (
						<div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
							<span className="text-sm text-red-700 dark:text-red-300">
								정말 초기화할까요?
							</span>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								onClick={() => {
									handleReset();
									setShowResetConfirm(false);
								}}
							>
								O
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setShowResetConfirm(false)}
							>
								X
							</Button>
						</div>
					) : (
						<Button
							type="button"
							variant="destructive"
							onClick={() => setShowResetConfirm(true)}
						>
							초기화하기
						</Button>
					)}

					<Button type="submit">저장하기</Button>
				</div>
			</form>
		</>
	);
}
