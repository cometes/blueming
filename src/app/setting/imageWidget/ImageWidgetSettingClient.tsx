/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import { useSettingHeaderAction } from "@/contexts/SettingHeaderActionContext";
import { setSettingsMainImageWidget } from "@/queries/set/setSettingsMainImageWidget";
import { useFileUpload } from "@/hooks/useFileUpload";

const MAX_SLOTS = 4;
const DEFAULT_FIT: "cover" | "contain" = "cover";

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
	const [pendingImages, setPendingImages] = useState<
		Array<{ file: File; previewUrl: string } | null>
	>(() => Array.from({ length: MAX_SLOTS }, () => null));
	const filledCount = images.filter((image) => Boolean(image)).length;
	const hasPendingImages = pendingImages.some((item) => item !== null);
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
		setPendingImages((prev) => {
			prev.forEach((pending) => {
				if (pending) {
					URL.revokeObjectURL(pending.previewUrl);
				}
			});
			return Array.from({ length: MAX_SLOTS }, () => null);
		});
	}, [initialImages, initialFits]);

	useEffect(() => {
		return () => {
			pendingImages.forEach((pending) => {
				if (pending) {
					URL.revokeObjectURL(pending.previewUrl);
				}
			});
		};
	}, [pendingImages]);

	useSettingStatus("imageWidget", isDirty || hasPendingImages ? "dirty" : "saved");

	const handleRemove = useCallback((index: number) => {
		setPendingImages((prev) => {
			const next = [...prev];
			const pending = next[index];
			if (pending) {
				URL.revokeObjectURL(pending.previewUrl);
				next[index] = null;
			}
			return next;
		});
		setImages((prev) => {
			const next = normalizeImages(prev);
			next[index] = "";
			return next;
		});
	}, []);

	const handleFileSelect = useCallback((index: number, file: File) => {
		const previewUrl = URL.createObjectURL(file);
		setPendingImages((prev) => {
			const next = [...prev];
			const existing = next[index];
			if (existing) {
				URL.revokeObjectURL(existing.previewUrl);
			}
			next[index] = { file, previewUrl };
			return next;
		});
	}, []);

	const handleSave = useCallback(async () => {
		try {
			setIsSaving(true);
			const updatedImages = normalizeImages(images);
			for (let index = 0; index < pendingImages.length; index += 1) {
				const pending = pendingImages[index];
				if (pending) {
					const url = await uploadFile(pending.file);
					updatedImages[index] = url;
					URL.revokeObjectURL(pending.previewUrl);
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
			setPendingImages(Array.from({ length: MAX_SLOTS }, () => null));
			toast.success("이미지 위젯이 저장되었습니다.");
		} catch {
			toast.error("이미지 위젯 저장에 실패했습니다.");
		} finally {
			setIsSaving(false);
		}
	}, [fits, images, refreshSettings, updateMain, pendingImages, uploadFile]);

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
			<div>
				<h2 className="text-[20px] font-semibold">이미지 위젯 설정</h2>
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
								<label className="relative w-full aspect-[4/3] flex items-center justify-center text-xs text-muted-foreground cursor-pointer">
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
									<input
										type="file"
										accept="image/*"
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
										disabled={uploadState.loading || isSaving}
										onChange={(event) => {
											const file = event.target.files?.[0];
											if (file) {
												handleFileSelect(index, file);
											}
											event.target.value = "";
										}}
									/>
								</label>
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
