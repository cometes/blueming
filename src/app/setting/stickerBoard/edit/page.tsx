"use client";

import { useEffect, useMemo, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
	StickerBoardEditorProvider,
	useStickerBoardEditorContext,
} from "@/contexts/StickerBoardEditorContext";
import { StickerBoardCanvas } from "@/components/stickerboard-editor/StickerBoardCanvas";
import { StickerBoardLayersPanel } from "@/components/stickerboard-editor/StickerBoardLayersPanel";
import { StickerBoardPropertiesPanel } from "@/components/stickerboard-editor/StickerBoardPropertiesPanel";
import { StickerBoardToolbar } from "@/components/stickerboard-editor/StickerBoardToolbar";
import { fitToGrid12 } from "@/features/stickerboard-editor/lib/stickerboard";
import { isImageSticker } from "@/features/stickerboard-editor/lib/stickerboard-utils";
import { setSettingsMainStickerBoard } from "@/features/settings/api/main";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import type { StickerBoardSettings } from "@/features/stickerboard-editor/model";
import { toast } from "sonner";

const LAYOUT_ITEM_ID = "스티커보드";

export default function StickerBoardEditPage() {
	const { main, refreshSettings } = useSettings();
	const stickerBoard = main?.stickerBoard;
	return (
		<StickerBoardEditorProvider
			initialComponents={stickerBoard?.components ?? []}
		>
			<StickerBoardEditContent
				stickerBoard={stickerBoard}
				customLayout={
					main?.customLayout?.layout as
						| Array<{ i: string; w: number; h: number }>
						| undefined
				}
				refreshSettings={refreshSettings}
			/>
		</StickerBoardEditorProvider>
	);
}

function StickerBoardEditContent({
	stickerBoard,
	customLayout,
	refreshSettings,
}: {
	stickerBoard: StickerBoardSettings | undefined;
	customLayout: Array<{ i: string; w: number; h: number }> | undefined;
	refreshSettings?: (opts?: { broadcast?: boolean }) => void | Promise<void>;
}) {
	const [ratio, setRatio] = useState<{ w: number; h: number } | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const {
		state: {
			componentsDraft,
			isImageDialogOpen,
			uploadThumbnail,
			imageReplaceTargetId,
		},
		actions: {
			setIsImageDialogOpen,
			setUploadThumbnail,
			setImageReplaceTargetId,
			updateComponent,
			addImageSticker,
		},
	} = useStickerBoardEditorContext();

	useEffect(() => {
		const stickerWidget = customLayout?.find((el) => el.i === LAYOUT_ITEM_ID);
		if (!stickerWidget) {
			setRatio(null);
			return;
		}

		setRatio(fitToGrid12(stickerWidget.w, stickerWidget.h));
	}, [customLayout]);

	const stickerBoardToSave: StickerBoardSettings = useMemo(
		() => ({
			// NOTE: do not force default title/description into DB.
			// Save only what exists + components.
			...(stickerBoard || {}),
			components: componentsDraft,
		}),
		[componentsDraft, stickerBoard],
	);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// NOTE: percent-based `components` is the single source of truth.
			await setSettingsMainStickerBoard(stickerBoardToSave);
			await refreshSettings?.({ broadcast: true });
			toast.success("스티커보드를 저장했어요.");
		} catch {
			toast.error("스티커보드 저장에 실패했어요.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<main className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 mt-10">
			<ImageUploadDialog
				isOpen={isImageDialogOpen}
				onOpenChange={setIsImageDialogOpen}
				thumbnail={uploadThumbnail}
				setThumbnail={setUploadThumbnail}
				onUpload={(url) => {
					const targetId = imageReplaceTargetId;
					setImageReplaceTargetId(null);
					if (targetId) {
						updateComponent(targetId, (prev) => {
							if (!isImageSticker(prev)) return prev;
							return { ...prev, imageUrl: url };
						});
						return;
					}
					void addImageSticker(url);
				}}
			/>

			<StickerBoardToolbar onSave={handleSave} isSaving={isSaving} />

			{/* lg 이상: 좌(레이어) / 중(캔버스) / 우(속성) 3열.
			    미만: 캔버스를 맨 위로 올리고 패널들은 아래로 스택(md에서는 2열). */}
			<section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[240px_minmax(0,1fr)_240px]">
				<div className="order-2 min-w-0 md:order-2 lg:order-1">
					<StickerBoardLayersPanel />
				</div>
				<div className="order-1 min-w-0 md:order-1 md:col-span-2 lg:order-2 lg:col-span-1">
					<StickerBoardCanvas ratio={ratio} />
				</div>
				<aside className="order-3 min-w-0 rounded-card border-card bg-card p-4 blur-proxy">
					<div className="text-sm font-semibold text-main-text">편집 패널</div>
					<p className="mt-2 text-xs text-sub-text">
						선택한 스티커의 속성을 편집할 수 있어요.
					</p>

					<StickerBoardPropertiesPanel />
				</aside>
			</section>
		</main>
	);
}
