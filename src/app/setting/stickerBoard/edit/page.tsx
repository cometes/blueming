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
		// 피그마식 풀페이지 워크스페이스: 사이트 헤더(3rem) 아래 뷰포트를 꽉 채우고
		// 페이지 스크롤 없이 3분할(레이어/캔버스/속성) 고정. PC 사용 권장,
		// 좁은 화면에서는 가로 스크롤로 대응.
		<main className="mt-12 h-[calc(100dvh-3rem)] w-full overflow-x-auto overflow-y-hidden px-4 py-4 lg:px-6">
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

			<div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] min-w-[960px] flex-col">
				<StickerBoardToolbar onSave={handleSave} isSaving={isSaving} />
				<section className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_260px] gap-4">
					<div className="min-h-0">
						<StickerBoardLayersPanel />
					</div>
					<div className="min-h-0">
						<StickerBoardCanvas ratio={ratio} />
					</div>
					<aside className="h-full min-h-0 overflow-y-auto rounded-card border-card bg-card p-4 blur-proxy">
						<div className="text-sm font-semibold text-main-text">편집 패널</div>
						<p className="mt-2 text-xs text-sub-text">
							선택한 스티커의 속성을 편집할 수 있어요.
						</p>

						<StickerBoardPropertiesPanel />
					</aside>
				</section>
			</div>
		</main>
	);
}
