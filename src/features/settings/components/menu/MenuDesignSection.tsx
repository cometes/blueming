"use client";

import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import RadioItem from "@/components/items/RadioItem";
import { ImageUploadSection } from "@/features/settings/components/menu/ImageUploadSection";
import { INPUT_HEIGHT } from "@/features/settings/lib/menu";
import type { PendingImage } from "@/features/settings/hooks/useSettingsImagePicker";
import type { MenuDesign } from "@/features/settings/types";

type MenuImageField =
	| "logo"
	| "background"
	| "iconBarLogo"
	| "iconBarBackground";

interface MenuDesignSectionProps {
	designMode: "desktop" | "iconbar";
	setDesignMode: (mode: "desktop" | "iconbar") => void;
	align: string[];
	textAlign: string[];
	bgType: string[];
	menuTypes: string[];
	iconBarLogoTypes: string[];
	iconBarBgTypes: string[];
	menuDesign: Partial<MenuDesign>;
	pendingImages: Record<MenuImageField, PendingImage | null>;
	updateMenuDesign: (field: keyof MenuDesign, value: string) => void;
	updateMenuSetting: (field: string, value: string) => void;
	handleFileSelect: (field: MenuImageField, file: File) => void;
	handleImageClear: (field: MenuImageField) => void;
	handleOpenImageDialog: (field: MenuImageField) => void;
	isUploading: boolean;
}

export function MenuDesignSection({
	designMode,
	setDesignMode,
	align,
	textAlign,
	bgType,
	menuTypes,
	iconBarLogoTypes,
	iconBarBgTypes,
	menuDesign,
	pendingImages,
	updateMenuDesign,
	updateMenuSetting,
	handleFileSelect,
	handleImageClear,
	handleOpenImageDialog,
	isUploading,
}: MenuDesignSectionProps) {
	return (
		<section>
			<h2 className="text-[20px] font-semibold font-title">메뉴 디자인</h2>
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
										className={`${INPUT_HEIGHT} rounded-card border-card focus:border-card-active bg-card-bg`}
									/>
								</div>
							</div>
						)}

						{menuDesign.logoType === "이미지" && (
							<ImageUploadSection
								title="로고 이미지"
								description="메뉴에 표시될 로고 이미지를 업로드하세요"
								imageSrc={pendingImages.logo?.previewUrl || menuDesign.logoImage}
								onFileSelect={(file) => handleFileSelect("logo", file)}
								onClearClick={() => handleImageClear("logo")}
								onOpenPicker={() => handleOpenImageDialog("logo")}
								isUploading={isUploading}
							/>
						)}

						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px]">
								<h3 className="font-medium text-sub-text">메뉴 배경 타입</h3>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								{bgType.map((el) => (
									<RadioItem
										key={el}
										onClickRadio={() =>
											updateMenuSetting("background.type", el)
										}
										checked={menuDesign.bgType === el}
										content={el}
									/>
								))}
							</div>
						</div>

						{menuDesign.bgType === "단색" && (
							<div className="section-box flex items-center mt-4">
								<div className="text-box w-[220px]">
									<h3 className="font-medium text-sub-text">메뉴 배경 컬러</h3>
								</div>
								<div className="flex items-center gap-3">
									<ColorPicker
										value={menuDesign.backgroundColor || "#ffffff"}
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
								onOpenPicker={() => handleOpenImageDialog("background")}
								isUploading={isUploading}
							/>
						)}
					</>
				)}

				{designMode === "iconbar" && (
					<>
						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px]">
								<h3 className="font-medium text-sub-text">아이콘바 로고 타입</h3>
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
								onFileSelect={(file) => handleFileSelect("iconBarLogo", file)}
								onClearClick={() => handleImageClear("iconBarLogo")}
								onOpenPicker={() => handleOpenImageDialog("iconBarLogo")}
								isUploading={isUploading}
							/>
						)}

						<div className="section-box flex items-center mt-4">
							<div className="text-box w-[220px]">
								<h3 className="font-medium text-sub-text">아이콘바 배경 타입</h3>
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
								onOpenPicker={() => handleOpenImageDialog("iconBarBackground")}
								isUploading={isUploading}
							/>
						)}
					</>
				)}
			</div>
		</section>
	);
}
