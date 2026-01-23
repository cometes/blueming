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
import { fitToGrid12 } from "@/lib/stickerboard";
import { isImageSticker } from "@/lib/stickerboard-utils";
import { setSettingsMainStickerBoard } from "@/queries/set/setSettingsMainStickerBoard";
import ImageUploadDialog from "@/components/modal/ImageUploadDialog";
import type {
	StickerBoardSettings,
} from "@/types/stickerBoard";

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
		state: { componentsDraft, isImageDialogOpen, uploadThumbnail, imageReplaceTargetId },
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
		[componentsDraft, stickerBoard]
	);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			// NOTE: percent-based `components` is the single source of truth.
			await setSettingsMainStickerBoard(stickerBoardToSave);
			await refreshSettings?.({ broadcast: true });
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<main className="w-full min-h-[calc(100vh)] flex items-center justify-center mt-5">
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

			<div className="mx-auto w-full max-w-[1400px] px-6 py-10">
				<StickerBoardToolbar onSave={handleSave} isSaving={isSaving} />

				<section
					className="grid gap-4"
					style={{
						gridTemplateColumns: "1fr 768px 1fr",
					}}
				>
					<StickerBoardLayersPanel />
					<StickerBoardCanvas ratio={ratio} />

					<aside className="rounded-card border border-card bg-card-bg/60 p-4 blur-proxy">
						<div className="text-sm font-semibold text-main-text">
							편집 패널
						</div>
						<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
							선택한 스티커 속성 편집(텍스트/스타일/회전/투명도 등)
						</p>

						<StickerBoardPropertiesPanel />
					</aside>
				</section>
			</div>
		</main>
	);
}
