"use client";

import { Button } from "@/components/ui/button";
import { useStickerBoardEditorContext } from "@/contexts/StickerBoardEditorContext";
import { Redo2, Undo2 } from "lucide-react";

export function StickerBoardToolbar({
	onSave,
	isSaving,
}: {
	onSave: () => void | Promise<void>;
	isSaving: boolean;
}) {
	const {
		state: { historyPast, historyFuture },
		actions: { undo, redo },
		computed: { editingGroup },
	} = useStickerBoardEditorContext();

	return (
		<header className="mb-6 flex items-end justify-between gap-6">
			<div>
				<h1 className="text-2xl font-semibold font-title">
					스티커보드 편집
				</h1>

				{editingGroup && (
					<div className="mt-3 inline-flex items-center gap-2 rounded-full border border-theme-primary/30 bg-theme-primary/10 px-3 py-1 text-xs text-theme-primary">
						<span className="font-medium">
							그룹 편집 중: {editingGroup.name ?? "그룹"}
						</span>
						<span className="text-theme-primary/80">Esc로 종료</span>
					</div>
				)}
			</div>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={undo}
					disabled={historyPast.length === 0}
					className="px-3"
					aria-label="Undo"
					title="Undo (⌘/Ctrl+Z)"
				>
					<Undo2 className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={redo}
					disabled={historyFuture.length === 0}
					className="px-3"
					aria-label="Redo"
					title="Redo (⌘/Ctrl+Shift+Z)"
				>
					<Redo2 className="h-4 w-4" />
				</Button>
				<Button onClick={onSave} disabled={isSaving}>
					{isSaving ? "저장 중..." : "저장"}
				</Button>
			</div>
		</header>
	);
}
