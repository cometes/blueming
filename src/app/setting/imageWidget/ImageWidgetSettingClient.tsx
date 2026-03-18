"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { setSettingsMainImageWidget } from "@/features/settings/api/main";
import { useFileUpload } from "@/hooks/useFileUpload";
import { AssetPickerDialog } from "@/features/settings/components/AssetPickerDialog";
import { useSettingsImagePicker } from "@/features/settings/hooks/useSettingsImagePicker";

const MAX_SLOTS = 4;
const DEFAULT_FIT: "cover" | "contain" = "cover";
type SlotField = "slot0" | "slot1" | "slot2" | "slot3";
const SLOT_FIELDS: readonly SlotField[] = ["slot0", "slot1", "slot2", "slot3"] as const;

const normalizeImages = (images?: string[]) => {
	const next = Array.isArray(images) ? [...images] : [];
	if (next.length >= MAX_SLOTS) return next.slice(0, MAX_SLOTS);
	return [
		...next,
		...Array.from({ length: MAX_SLOTS - next.length }, () => ""),
	];
};

const normalizeFits = (fits?: Array<"cover" | "contain">) => {
	const next = Array.isArray(fits) ? [...fits] : [];
	if (next.length >= MAX_SLOTS) return next.slice(0, MAX_SLOTS);
	return [
		...next,
		...Array.from({ length: MAX_SLOTS - next.length }, () => DEFAULT_FIT),
	];
};

export default function ImageWidgetSettingClient() {
	const { main, updateMain, refreshSettings } = useSettings();
	const { uploadFile, state: uploadState } = useFileUpload();
	const initialImages = useMemo(
		() => normalizeImages(main?.imageWidget?.images),
		[main?.imageWidget?.images]
	);
	const initialFits = useMemo(
		() => normalizeFits(main?.imageWidget?.fits),
		[main?.imageWidget?.fits]
	);
	const [images, setImages] = useState<string[]>(initialImages);
	const [fits, setFits] = useState<Array<"cover" | "contain">>(initialFits);
	const [isSaving, setIsSaving] = useState(false);
	const {
		state: {
			activeField,
			dialogThumbnail: thumbnail,
			imageSource,
			assets,
			assetsLoading,
			assetsError,
			assetSearchQuery,
			pendingImages: pendingImageMap,
			hasPendingImages,
		},
		actions: {
			setDialogThumbnail: setThumbnail,
			setAssetSearchQuery,
			clearPendingImage,
			clearAllPendingImages,
			openImageDialog,
			closeImageDialog,
			handleImageFileSelect: handleDialogFileSelect,
			handleSelectAsset,
		},
	} = useSettingsImagePicker<SlotField>({ fields: SLOT_FIELDS });
	const activeSlot =
		activeField === null ? null : Number(activeField.replace("slot", ""));
	const pendingImages = useMemo(
		() => SLOT_FIELDS.map((field) => pendingImageMap[field]),
		[pendingImageMap],
	);
	const filledCount = images.filter((image) => Boolean(image)).length;
	const isDirty = useMemo(
		() =>
			JSON.stringify(images) !== JSON.stringify(initialImages) ||
			JSON.stringify(fits) !== JSON.stringify(initialFits),
		[fits, images, initialFits, initialImages]
	);

	const handleSaveRef = useRef<(() => Promise<void>) | undefined>(undefined);

	useEffect(() => {
		setImages(initialImages);
		setFits(initialFits);
		clearAllPendingImages();
	}, [clearAllPendingImages, initialImages, initialFits]);

	useSettingStatus("imageWidget", isDirty || hasPendingImages ? "dirty" : "saved");

	const handleOpenDialog = (index: number) => {
		openImageDialog(SLOT_FIELDS[index], images[index] || "");
	};

	const handleRemove = useCallback((index: number) => {
		clearPendingImage(SLOT_FIELDS[index]);
		setImages((prev) => {
			const next = normalizeImages(prev);
			next[index] = "";
			return next;
		});
	}, [clearPendingImage]);

	const handleDialogConfirm = (selectedUrl: string) => {
		if (activeSlot !== null && imageSource === "asset" && selectedUrl) {
			clearPendingImage(SLOT_FIELDS[activeSlot]);
			setImages((prev) => {
				const next = normalizeImages(prev);
				next[activeSlot] = selectedUrl;
				return next;
			});
		}
		closeImageDialog();
	};

	const handleSave = useCallback(async () => {
		try {
			setIsSaving(true);
			const updatedImages = normalizeImages(images);
			for (let index = 0; index < pendingImages.length; index += 1) {
				const pending = pendingImages[index];
				if (pending) {
					const url = await uploadFile(pending.file);
					updatedImages[index] = url;
				}
			}

			const payload = {
				images: updatedImages,
				fits: normalizeFits(fits),
			};
			await setSettingsMainImageWidget(payload);
			updateMain?.({ imageWidget: payload });
			await refreshSettings?.({ broadcast: true });
			setImages(updatedImages);
			clearAllPendingImages();
			toast.success("이미지 위젯이 저장되었습니다.");
		} catch {
			toast.error("이미지 위젯 저장에 실패했습니다.");
		} finally {
			setIsSaving(false);
		}
	}, [fits, images, refreshSettings, updateMain, pendingImages, uploadFile, clearAllPendingImages]);

	handleSaveRef.current = handleSave;

	useSettingHeaderAction(
		<Button
			type="button"
			variant="ghost"
			size="icon"
			onClick={() => handleSaveRef.current?.()}
			disabled={(!isDirty && !hasPendingImages) || isSaving || uploadState.loading}
			aria-label="저장하기"
			title="저장하기"
			className="rounded-card border-card bg-card-bg hover:border-theme-primary hover:text-theme-primary hover:bg-theme-primary/10"
			style={{
				transition: "all 0.3s ease-in-out",
			}}
		>
			<Save size={16} />
		</Button>,
		[isDirty, isSaving, hasPendingImages, uploadState.loading]
	);

	return (
		<section className="space-y-6">
			<AssetPickerDialog
				isOpen={activeField !== null}
				onOpenChange={(open) => {
					if (!open) closeImageDialog();
				}}
				thumbnail={thumbnail}
				setThumbnail={setThumbnail}
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
			<div>
				<h2 className="text-[20px] font-semibold font-title">이미지 위젯 설정</h2>
				<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
					최대 4개의 이미지 위젯을 관리합니다. 그리드 박스를 클릭하면 이미지를
					업로드할 수 있습니다.
				</p>
				<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
					<span className="inline-flex items-center rounded-full border border-card bg-background/60 px-2 py-0.5 text-gray-600 dark:text-gray-300">
						등록 {filledCount}/{MAX_SLOTS}
					</span>
				</div>
			</div>

			<div className="section-wrap">
				<div
					className="grid gap-4"
					style={{
						gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
					}}
				>
					{images.map((image, index) => (
						<div
							key={`image-widget-preview-${index}`}
							className="rounded-card border border-card bg-card-bg/60 backdrop-blur-card overflow-hidden self-start"
						>
							<div className="bg-card-bg">
								<button
									type="button"
									className="relative w-full aspect-[4/3] flex items-center justify-center text-xs text-muted-foreground cursor-pointer"
									onClick={() => handleOpenDialog(index)}
									disabled={uploadState.loading || isSaving}
								>
									{pendingImages[index]?.previewUrl || image ? (
										<img
											src={pendingImages[index]?.previewUrl || image}
											alt={`이미지 위젯 ${index + 1}`}
											className={`w-full h-full ${
												fits[index] === "contain"
													? "object-contain"
													: "object-cover"
											}`}
										/>
									) : (
										<span>클릭해서 업로드</span>
									)}
								</button>
							</div>
							{pendingImages[index]?.previewUrl || image ? (
								<div className="px-2 py-2 flex items-center justify-between gap-2">
									<div className="flex items-center gap-2 text-xs text-muted-foreground">
										<span>맞춤</span>
										<Switch
											checked={fits[index] === "contain"}
											onCheckedChange={(checked) => {
												setFits((prev) => {
													const next = normalizeFits(prev);
													next[index] = checked ? "contain" : "cover";
													return next;
												});
											}}
										/>
										<span>채움</span>
									</div>
									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={() => handleRemove(index)}
										disabled={isSaving}
										aria-label={`이미지 위젯 ${index + 1} 삭제`}
										className="rounded-card border border-card bg-card-bg/60 backdrop-blur-card hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
										style={{
											transition: "all 0.3s ease-in-out",
										}}
									>
										<Trash2 size={14} />
									</Button>
								</div>
							) : null}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
