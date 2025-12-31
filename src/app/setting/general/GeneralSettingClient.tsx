"use client";

import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import RadioItem from "@/components/items/RadioItem";
import { useModal } from "@/hooks/useModal";
import { useSettingGeneral } from "@/hooks/useSettingGeneral";
import { toast } from "sonner";

type ImageField = "favicon" | "shareImage" | "logoImage";

const INPUT_HEIGHT = "h-9";
const ICON_SIZE = 28;
const ICON_COLOR = "#9BA2A8";

const PLACEHOLDERS = {
	TITLE: "홈페이지 타이틀을 입력해주세요",
	DESC: "홈페이지 설명을 입력해주세요",
} as const;

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
	<div className="flex flex-col gap-3">
		<div className="flex flex-col gap-1">
			<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
				{title}
			</h3>
			{description && (
				<p className="text-xs text-gray-500 dark:text-gray-400">
					{description}
				</p>
			)}
		</div>
		<div className="flex items-center gap-3">
			{imageSrc ? (
				<img
					src={imageSrc}
					alt={title}
					className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
				/>
			) : (
				<div
					onClick={onImageClick}
					className="w-24 h-24 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
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
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={onClearClick}
			>
				<Trash2 size={14} className="mr-2" />
				비우기
			</Button>
		</div>
	</div>
);

export default function GeneralSettingClient() {
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
		handleImageUpload,
		handleClearImage,
		handleReset,
		handleSave,
		bgThumbnail,
		setBgThumnail,
	} = useSettingGeneral();

	const { showModal, isModalOpen, setIsModalOpen, cancelModal } = useModal();
	const [showResetConfirm, setShowResetConfirm] = useState(false);

	const [currentImageField, setCurrentImageField] = useState<ImageField | "">(
		""
	);

	const openImageModal = (field: ImageField) => {
		setCurrentImageField(field);
		if (generalSetting[field]) {
			setBgThumnail(generalSetting[field]);
		} else {
			setBgThumnail("");
		}
		showModal();
	};

	const onSubmit = (data: any) => {
		handleSave();
	};

	const confirmReset = () => {
		handleReset();
		setShowResetConfirm(false);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
			{/* Temporary: ImageUploadModal will be created later */}

			{/* 홈페이지 설정 Section */}
			<section className="space-y-6">
				<h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
					홈페이지 설정
				</h2>
				<div className="space-y-6">
					{/* 홈페이지 타이틀 */}
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
								홈페이지 타이틀
							</h3>
							{formState.errors.title?.message && (
								<p className="text-xs text-red-500">
									{formState.errors.title.message}
								</p>
							)}
						</div>
						<Input
							placeholder={PLACEHOLDERS.TITLE}
							value={getValues("title") || generalSetting.title || ""}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								setValue("title", e.target.value);
								updateGeneralSetting("title", e.target.value);
							}}
							className={INPUT_HEIGHT}
						/>
					</div>

					{/* 홈페이지 설명 */}
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-1">
							<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
								홈페이지 설명
							</h3>
							{formState.errors.desc?.message && (
								<p className="text-xs text-red-500">
									{formState.errors.desc.message}
								</p>
							)}
						</div>
						<Input
							placeholder={PLACEHOLDERS.DESC}
							value={getValues("desc") || generalSetting.desc || ""}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								setValue("desc", e.target.value);
								updateGeneralSetting("desc", e.target.value);
							}}
							className={INPUT_HEIGHT}
						/>
					</div>

					{/* 파비콘 */}
					<ImageUploadSection
						title="파비콘 (32x32)"
						description="브라우저 옆에 띄우는 작은 아이콘"
						imageSrc={generalSetting.favicon}
						onImageClick={() => openImageModal("favicon")}
						onClearClick={() => handleClearImage("favicon")}
					/>

					{/* URL 공유 이미지 */}
					<ImageUploadSection
						title="URL 공유 이미지"
						description="1200 * 630 권장"
						imageSrc={generalSetting.shareImage}
						onImageClick={() => openImageModal("shareImage")}
						onClearClick={() => handleClearImage("shareImage")}
					/>

					{/* 메인 컬러 */}
					<div className="flex flex-col gap-3">
						<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
							메인 컬러
						</h3>
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
						</div>
					</div>

					{/* 서브 컬러 */}
					<div className="flex flex-col gap-3">
						<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
							서브 컬러
						</h3>
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
						</div>
					</div>
				</div>
			</section>

			<Separator className="my-12" />

			{/* 로고 Section */}
			<section className="space-y-6">
				<h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
					로고
				</h2>
				<div className="space-y-6">
					{/* 로고 타입 */}
					<div className="flex flex-col gap-3">
						<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
							로고 타입
						</h3>
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
							imageSrc={generalSetting.logoImage}
							onImageClick={() => openImageModal("logoImage")}
							onClearClick={() => handleClearImage("logoImage")}
						/>
					)}

					{/* 텍스트 로고 */}
					{currentLogo === "텍스트" && (
						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-1">
								<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
									로고 타이틀
								</h3>
								{formState.errors.logoText?.message && (
									<p className="text-xs text-red-500">
										{formState.errors.logoText.message}
									</p>
								)}
							</div>
							<Input
								placeholder="로고 타이틀을 입력해주세요"
								value={getValues("logoText") || generalSetting.logoText || ""}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
									setValue("logoText", e.target.value);
									updateGeneralSetting("logoText", e.target.value);
								}}
								className={INPUT_HEIGHT}
							/>
						</div>
					)}
				</div>
			</section>

			{/* Submit Buttons */}
			<div className="flex justify-end gap-3 pt-6">
				{/* Simple Reset Confirmation */}
				{showResetConfirm ? (
					<div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
						<span className="text-sm text-red-700 dark:text-red-300">
							정말 초기화할까요?
						</span>
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onClick={confirmReset}
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
	);
}
