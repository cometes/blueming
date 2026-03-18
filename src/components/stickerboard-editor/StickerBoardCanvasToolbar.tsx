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
				<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
					고정 폭 768px 캔버스 영역
				</p>
			</div>
			<ButtonGroup className="items-center rounded-md border border-stone-700 bg-stone-800 overflow-hidden divide-x divide-stone-700">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className={[
						"h-8 w-8 rounded-none hover:bg-stone-700",
						isImageDialogOpen ? "bg-stone-700 text-white" : "",
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
						"h-8 w-8 rounded-none hover:bg-stone-700",
						isTextInsertMode ? "bg-stone-700 text-white" : "",
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
					triggerClassName="h-8 w-8 rounded-none hover:bg-stone-700"
				/>
			</ButtonGroup>
		</div>
	);
}
