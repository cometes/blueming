	/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import { ColorPalettePreview } from "@/components/ui/color-palette-preview";
import RadioItem from "@/components/items/RadioItem";
import { useSettingGeneral } from "@/hooks/useSettingGeneral";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { Save } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type ImageField = "favicon" | "shareImage" | "logoImage";

const INPUT_HEIGHT = "h-9";
const ICON_SIZE = 28;
const ICON_COLOR = "#9BA2A8";

const PLACEHOLDERS = {
	TITLE: "홈페이지 타이틀을 입력해주세요",
	DESC: "홈페이지 설명을 입력해주세요",
} as const;

const UPLOAD_TEXT = "Upload Image";

// 로컬 이미지 미리보기를 위한 타입
interface PendingImage {
	file: File;
	previewUrl: string;
}

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
			{imageSrc ? (
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
			) : null}
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
		isDirty,
	} = useSettingGeneral();

	const [showResetDialog, setShowResetDialog] = useState(false);
	const { uploadFile, state: uploadState } = useFileUpload();

	// 업로드 대기 중인 이미지들을 저장
	const [pendingImages, setPendingImages] = useState<
		Record<ImageField, PendingImage | null>
	>({
		favicon: null,
		shareImage: null,
		logoImage: null,
	});

	// pending 이미지가 있는지 체크
	const hasPendingImages =
		pendingImages.favicon !== null ||
		pendingImages.shareImage !== null ||
		pendingImages.logoImage !== null;

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

	// 파일 선택 시 로컬 미리보기만 표시
	const handleFileSelect = (field: ImageField, file: File) => {
		const previewUrl = URL.createObjectURL(file);
		setPendingImages((prev) => ({
			...prev,
			[field]: { file, previewUrl },
		}));
	};

	// 이미지 비우기 (로컬 미리보기 또는 서버 이미지)
	const handleImageClear = (field: ImageField) => {
		// pending 이미지가 있으면 URL 해제
		if (pendingImages[field]) {
			URL.revokeObjectURL(pendingImages[field]!.previewUrl);
			setPendingImages((prev) => ({
				...prev,
				[field]: null,
			}));
		}
		// 서버 이미지 제거
		handleClearImage(field);
	};

	// 저장 버튼 클릭 시 실행
	const onSubmit = async () => {
		try {
			// 1. pending 이미지들을 먼저 업로드
			const uploadedUrls: Partial<Record<ImageField, string>> = {};

			for (const field of Object.keys(pendingImages) as ImageField[]) {
				const pending = pendingImages[field];
				if (pending) {
					const url = await uploadFile(pending.file);
					uploadedUrls[field] = url;
					// 업로드된 URL을 즉시 반영
					handleImageUpload(field, url);
					// blob URL 해제
					URL.revokeObjectURL(pending.previewUrl);
				}
			}

			// pending 이미지 초기화
			setPendingImages({
				favicon: null,
				shareImage: null,
				logoImage: null,
			});

			// 2. 업로드된 이미지 URL을 포함하여 제네럴 세팅 저장
			const updatedSetting = {
				...generalSetting,
				...uploadedUrls,
			};

			await handleSave(updatedSetting);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "저장에 실패했습니다.";
			toast.error(message);
		}
	};

	const handleResetConfirm = () => {
		// pending 이미지 URL 정리
		Object.values(pendingImages).forEach((pending) => {
			if (pending) {
				URL.revokeObjectURL(pending.previewUrl);
			}
		});
		setPendingImages({
			favicon: null,
			shareImage: null,
			logoImage: null,
		});

		handleReset();
		setShowResetDialog(false);
	};

	// 컴포넌트 언마운트 시 blob URL 정리
	useEffect(() => {
		return () => {
			Object.values(pendingImages).forEach((pending) => {
				if (pending) {
					URL.revokeObjectURL(pending.previewUrl);
				}
			});
		};
	}, [pendingImages]);

	return (
		<form
			id="setting-form-general"
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-8"
		>
			{/* Temporary: ImageUploadModal will be created later */}

			{/* 홈페이지 설정 Section */}
			<section>
				<h2 className="text-[20px] font-semibold">홈페이지 설정</h2>
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
						onClearClick={() => handleImageClear("favicon")}
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
						onClearClick={() => handleImageClear("shareImage")}
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
				<h2 className="text-[20px] font-semibold">로고</h2>
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
							onClearClick={() => handleImageClear("logoImage")}
							isUploading={uploadState.loading}
						/>
					)}

					{/* 텍스트 로고 */}
					{currentLogo === "텍스트" && (
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
										"rounded-card border-card focus:border-card-active bg-card-bg"
									}
								/>
							</div>
						</div>
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
							onClick={handleResetConfirm}
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
