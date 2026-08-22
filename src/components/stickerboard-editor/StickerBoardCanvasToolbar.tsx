"use client";

import { StickerBoardAssetsPanel } from "@/components/stickerboard-editor/StickerBoardAssetsPanel";
import { ButtonGroup } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import { ImagePlus, Type } from "lucide-react";

interface StickerBoardCanvasToolbarProps {
	isImageDialogOpen: boolean;
	isTextInsertMode: boolean;
	onToggleImageDialog: () => void;
	onToggleTextInsertMode: () => void;
}

export function StickerBoardCanvasToolbar({
	isImageDialogOpen,
	isTextInsertMode,
	onToggleImageDialog,
	onToggleTextInsertMode,
}: StickerBoardCanvasToolbarProps) {
	return (
		<div className="flex items-center justify-between">
			<div>
				<div className="text-sm font-semibold text-main-text">캔버스</div>
				<p className="mt-1 text-xs text-sub-text">
					메인 페이지 위젯과 동일한 비율로 표시됩니다
				</p>
			</div>
			<ButtonGroup className="items-center rounded-md border border-card-color bg-card-bg overflow-hidden divide-x divide-[color:var(--color-card-border)]">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={[
						"h-8 w-8 rounded-none hover:bg-theme-primary/10 hover:text-theme-primary",
						isImageDialogOpen ? "bg-theme-primary text-white" : "",
					].join(" ")}
					onClick={onToggleImageDialog}
					aria-label="이미지 스티커 추가"
					title="이미지 스티커 추가"
				>
					<ImagePlus className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={[
						"h-8 w-8 rounded-none hover:bg-theme-primary/10 hover:text-theme-primary",
						isTextInsertMode ? "bg-theme-primary text-white" : "",
					].join(" ")}
					onClick={onToggleTextInsertMode}
					aria-label="텍스트 스티커 추가"
					title="텍스트 스티커 추가"
				>
					<Type className="h-4 w-4" />
				</Button>
				<StickerBoardAssetsPanel
					containerClassName=""
					compactTrigger
					triggerVariant="ghost"
					triggerClassName="h-8 w-8 rounded-none hover:bg-theme-primary/10 hover:text-theme-primary"
				/>
			</ButtonGroup>
		</div>
	);
}
