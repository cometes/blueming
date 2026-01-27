/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
import { useSettingDesign } from "@/hooks/useSettingDesign";
import WidgetSetting from "@/components/setting/widget";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { useSettings } from "@/contexts/SettingsContext";
import { setSettingsGeneralFontRegistry } from "@/queries/set/setSettingsGeneralFontRegistry";
import FontRegisterDialog from "@/components/modal/FontRegisterDialog";
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
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import AssetGrid from "@/components/asset/AssetGrid";
import { listStickerAssets } from "@/queries/stickerAssets";
import type { StickerAsset } from "@/types/stickerBoard";

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

// 로컬 이미지 미리보기를 위한 타입
interface PendingImage {
	file: File;
	previewUrl: string;
}

export default function DesignSettingClient() {
	const {
		BGTypes,
		fontTitle,
		fontBody,
		background,
		font,
		widget,
		card,
		currentDesignSetting,
		onClickSubmit,
		onClickReset,
		updateDesignSetting,
		isDirty,
	} = useSettingDesign();

	const { general, updateGeneral, refreshSettings } = useSettings();
	const { uploadFile, state: uploadState } = useFileUpload();
	const [showResetDialog, setShowResetDialog] = useState(false);
	const [isFontDialogOpen, setIsFontDialogOpen] = useState(false);

	// pending 배경 이미지 저장
	const [pendingBgImage, setPendingBgImage] = useState<PendingImage | null>(null);
	// pending 위젯 보더 이미지 저장
	const [pendingBorderImage, setPendingBorderImage] = useState<PendingImage | null>(null);

	// 이미지 업로드 다이얼로그 상태
	type ImageField = "background" | "borderImage";
	const [activeImageField, setActiveImageField] = useState<ImageField | null>(null);
	const [dialogThumbnail, setDialogThumbnail] = useState("");
	const [imageSource, setImageSource] = useState<"file" | "asset" | "existing" | null>(null);
	const [assets, setAssets] = useState<StickerAsset[]>([]);
	const [assetsLoading, setAssetsLoading] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);
	const [assetSearchQuery, setAssetSearchQuery] = useState("");

	const hasPendingImage = pendingBgImage !== null || pendingBorderImage !== null;

	useSettingStatus("design", isDirty || hasPendingImage ? "dirty" : "saved");
	const fontRegistry = useMemo(
		() => general?.fontRegistry ?? [],
		[general?.fontRegistry]
	);
	useSettingHeaderAction(
		<Button
			type="submit"
			form="setting-form-design"
			variant="ghost"
			size="icon"
			disabled={(!isDirty && !hasPendingImage) || uploadState.loading}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
		[isDirty, hasPendingImage, uploadState.loading]
	);

	// 배경 이미지 비우기
	const handleImageClear = () => {
		if (pendingBgImage) {
			URL.revokeObjectURL(pendingBgImage.previewUrl);
			setPendingBgImage(null);
		}
		updateDesignSetting("background.image", "");
	};

	// 에셋 목록 로드
	const refreshAssets = useCallback(async () => {
		try {
			setAssetsLoading(true);
			setAssetsError(null);
			const list = await listStickerAssets("all");
			setAssets(list);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "에셋을 불러오지 못했습니다.";
			setAssetsError(message);
		} finally {
			setAssetsLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!activeImageField) return;
		void refreshAssets();
	}, [activeImageField, refreshAssets]);

	// 이미지 다이얼로그 열기
	const handleOpenImageDialog = (field: ImageField) => {
		let currentValue = "";
		let pendingPreview = "";

		if (field === "background") {
			pendingPreview = pendingBgImage?.previewUrl || "";
			currentValue = background.image || "";
		} else if (field === "borderImage") {
			pendingPreview = pendingBorderImage?.previewUrl || "";
			currentValue = widget.borderImage || "";
		}

		const current = pendingPreview || currentValue || "";
		setDialogThumbnail(current);
		if (pendingPreview) {
			setImageSource("file");
		} else if (currentValue) {
			setImageSource("existing");
		} else {
			setImageSource(null);
		}
		setActiveImageField(field);
	};

	// 다이얼로그에서 파일 선택
	const handleImageFileSelect = (file: File, previewUrl: string) => {
		if (!activeImageField) return;

		if (activeImageField === "background") {
			if (pendingBgImage) {
				URL.revokeObjectURL(pendingBgImage.previewUrl);
			}
			setPendingBgImage({ file, previewUrl });
		} else if (activeImageField === "borderImage") {
			if (pendingBorderImage) {
				URL.revokeObjectURL(pendingBorderImage.previewUrl);
			}
			setPendingBorderImage({ file, previewUrl });
		}
		setDialogThumbnail(previewUrl);
		setImageSource("file");
	};

	// 에셋 선택
	const handleSelectAsset = (asset: StickerAsset) => {
		setDialogThumbnail(asset.url);
		setImageSource("asset");
	};

	// 다이얼로그 확인
	const handleImageDialogConfirm = (selectedUrl: string) => {
		if (!activeImageField) return;

		if (imageSource === "asset" && selectedUrl) {
			if (activeImageField === "background") {
				if (pendingBgImage) {
					URL.revokeObjectURL(pendingBgImage.previewUrl);
				}
				setPendingBgImage(null);
				updateDesignSetting("background.image", selectedUrl);
			} else if (activeImageField === "borderImage") {
				if (pendingBorderImage) {
					URL.revokeObjectURL(pendingBorderImage.previewUrl);
				}
				setPendingBorderImage(null);
				updateDesignSetting("widget.borderImage", selectedUrl);
			}
		}
		setActiveImageField(null);
	};

	// 저장 버튼 클릭 시 실행
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			let nextDesign = currentDesignSetting;

			// 1. pending 배경 이미지가 있으면 먼저 업로드
			if (pendingBgImage) {
				const url = await uploadFile(pendingBgImage.file);
				nextDesign = {
					...nextDesign,
					background: {
						...nextDesign.background,
						image: url,
					},
				};
				updateDesignSetting("background.image", url);
				URL.revokeObjectURL(pendingBgImage.previewUrl);
				setPendingBgImage(null);
			}

			// 2. pending 보더 이미지가 있으면 업로드
			if (pendingBorderImage) {
				const url = await uploadFile(pendingBorderImage.file);
				nextDesign = {
					...nextDesign,
					widget: {
						...nextDesign.widget,
						borderImage: url,
					},
				};
				updateDesignSetting("widget.borderImage", url);
				URL.revokeObjectURL(pendingBorderImage.previewUrl);
				setPendingBorderImage(null);
			}

			// 3. 업로드 결과를 포함한 스냅샷으로 저장
			onClickSubmit(nextDesign);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "저장에 실패했습니다.";
			toast.error(message);
		}
	};

	const handleReset = () => {
		// pending 이미지 URL 정리
		if (pendingBgImage) {
			URL.revokeObjectURL(pendingBgImage.previewUrl);
			setPendingBgImage(null);
		}
		if (pendingBorderImage) {
			URL.revokeObjectURL(pendingBorderImage.previewUrl);
			setPendingBorderImage(null);
		}
		onClickReset();
		setShowResetDialog(false);
	};

	// 컴포넌트 언마운트 시 blob URL 정리
	useEffect(() => {
		return () => {
			if (pendingBgImage) {
				URL.revokeObjectURL(pendingBgImage.previewUrl);
			}
			if (pendingBorderImage) {
				URL.revokeObjectURL(pendingBorderImage.previewUrl);
			}
		};
	}, [pendingBgImage, pendingBorderImage]);

	const handleUpdateFontRegistry = useCallback(
		async (nextRegistry) => {
			try {
				await setSettingsGeneralFontRegistry(nextRegistry);
				updateGeneral?.({ fontRegistry: nextRegistry });
				await refreshSettings?.({ broadcast: true });
				toast.success("폰트가 저장되었습니다.");
			} catch {
				toast.error("폰트 저장에 실패했습니다.");
			}
		},
		[refreshSettings, updateGeneral]
	);

	return (
		<form
			id="setting-form-design"
			onSubmit={handleSubmit}
			className="space-y-8"
		>
			<ImageUploadDialog
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
				uploadMode="deferred"
				onFileSelect={handleImageFileSelect}
				rightContent={
					<div>
						<div className="text-xs font-semibold text-main-text mb-2">
							에셋 목록
						</div>
						<AssetGrid
							assets={assets}
							loading={assetsLoading}
							error={assetsError}
							emptyMessage="에셋이 없습니다."
							emptySearchMessage="검색 결과가 없습니다."
							selectedUrl={dialogThumbnail}
							onSelect={handleSelectAsset}
							enableSearch
							searchQuery={assetSearchQuery}
							onSearchChange={setAssetSearchQuery}
							gridTemplateColumns="repeat(4, minmax(0, 1fr))"
							aspectClassName="aspect-square"
							imageClassName="w-full h-full object-contain"
						/>
					</div>
				}
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
									onClick={() => handleOpenImageDialog("background")}
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
										onClick={handleImageClear}
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
				onOpenBorderImagePicker={() => handleOpenImageDialog("borderImage")}
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
			<FontRegisterDialog
				open={isFontDialogOpen}
				onOpenChange={setIsFontDialogOpen}
				fontRegistry={fontRegistry}
				onUpdate={handleUpdateFontRegistry}
			/>
		</form>
	);
}
