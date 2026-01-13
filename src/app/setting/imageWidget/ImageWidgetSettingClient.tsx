/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/SettingsContext";
import { useSettingStatus } from "@/hooks/useSettingStatus";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import { setSettingsMainImageWidget } from "@/queries/set/setSettingsMainImageWidget";

const MAX_SLOTS = 4;
const DEFAULT_FIT: "cover" | "contain" = "cover";

const normalizeImages = (images?: string[]) => {
	const next = Array.isArray(images) ? [...images] : [];
	if (next.length >= MAX_SLOTS) return next.slice(0, MAX_SLOTS);
	return [...next, ...Array.from({ length: MAX_SLOTS - next.length }, () => "")];
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
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [activeSlot, setActiveSlot] = useState<number | null>(null);
	const [thumbnail, setThumbnail] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const filledCount = images.filter((image) => Boolean(image)).length;
	const isDirty = useMemo(
		() =>
			JSON.stringify(images) !== JSON.stringify(initialImages) ||
			JSON.stringify(fits) !== JSON.stringify(initialFits),
		[fits, images, initialFits, initialImages]
	);

	useEffect(() => {
		setImages(initialImages);
		setFits(initialFits);
	}, [initialImages, initialFits]);

	useSettingStatus("imageWidget", isDirty ? "dirty" : "saved");

	const handleOpenDialog = useCallback(
		(index: number) => {
			setActiveSlot(index);
			setThumbnail(images[index] || "");
			setIsDialogOpen(true);
		},
		[images]
	);

	const handleUpload = useCallback(
		(url: string) => {
			if (activeSlot === null) return;
			setImages((prev) => {
				const next = normalizeImages(prev);
				next[activeSlot] = url;
				return next;
			});
			setActiveSlot(null);
		},
		[activeSlot]
	);

	const handleRemove = useCallback(
		(index: number) => {
			setImages((prev) => {
				const next = normalizeImages(prev);
				next[index] = "";
				return next;
			});
		},
		[]
	);

	const handleSave = useCallback(async () => {
		try {
			setIsSaving(true);
			const payload = {
				images: normalizeImages(images),
				fits: normalizeFits(fits),
			};
			await setSettingsMainImageWidget(payload);
			updateMain?.({ imageWidget: payload });
			await refreshSettings?.({ broadcast: true });
			toast.success("이미지 위젯이 저장되었습니다.");
		} catch {
			toast.error("이미지 위젯 저장에 실패했습니다.");
		} finally {
			setIsSaving(false);
		}
	}, [fits, images, refreshSettings, updateMain]);

	return (
		<section className="space-y-6">
			<ImageUploadDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				thumbnail={thumbnail}
				setThumbnail={setThumbnail}
				onUpload={handleUpload}
			/>
			<div className="flex items-start justify-between gap-4">
				<div>
					<h2 className="text-[20px] font-semibold">이미지 위젯 설정</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
						최대 4개의 이미지 위젯을 관리합니다. 그리드 박스를 클릭하면
						이미지를 업로드할 수 있습니다.
					</p>
					<div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
						<span className="inline-flex items-center rounded-full border border-card bg-background/60 px-2 py-0.5 text-gray-600 dark:text-gray-300">
							등록 {filledCount}/{MAX_SLOTS}
						</span>
					</div>
				</div>
				<Button onClick={handleSave} disabled={!isDirty || isSaving}>
					저장
				</Button>
			</div>

			<div className="section-wrap">
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					{images.map((image, index) => (
						<div
							key={`image-widget-preview-${index}`}
							className="rounded-card border border-card bg-card-bg overflow-hidden"
						>
							<button
								type="button"
								className="w-full aspect-[4/3] flex items-center justify-center text-xs text-muted-foreground"
								onClick={() => handleOpenDialog(index)}
							>
								{image ? (
									<img
										src={image}
										alt={`이미지 위젯 ${index + 1}`}
										className="w-full h-full object-cover"
									/>
								) : (
									<span>클릭해서 업로드</span>
								)}
							</button>
							<div className="border-t border-card px-2 py-2 flex items-center justify-between gap-2">
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
								{image ? (
									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={() => handleRemove(index)}
										disabled={isSaving}
										aria-label={`이미지 위젯 ${index + 1} 삭제`}
									>
										<Trash2 size={14} />
									</Button>
								) : null}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
