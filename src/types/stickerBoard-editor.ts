import type { StickerBoardComponent } from "@/types/stickerBoard";

export interface StickerBoardEditorState {
	componentsDraft: StickerBoardComponent[];
	selectedId: number | null;
	selectedIds: Set<number>;
	editingGroupId: number | null;
	expandedGroupIds: Set<number>;
	historyPast: StickerBoardComponent[][];
	historyFuture: StickerBoardComponent[][];
}

export interface StickerBoardEditorActions {
	updateComponent: (
		id: number,
		updater: (prev: StickerBoardComponent) => StickerBoardComponent
	) => void;
	deleteSticker: (id: number) => void;
	toggleVisibility: (id: number) => void;
	addTextSticker: () => void;
	addImageSticker: (url: string) => void;
	undo: () => void;
	redo: () => void;
	groupSelection: () => void;
	ungroupSelection: () => void;
	alignSelectedSticker: (action: string) => void;
}
