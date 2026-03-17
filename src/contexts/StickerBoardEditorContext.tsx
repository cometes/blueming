"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { StickerBoardComponent } from "@/features/stickerboard-editor/model";
import { useStickerBoardEditor } from "@/features/stickerboard-editor/hooks/useStickerBoardEditor";

type StickerBoardEditorContextValue = ReturnType<typeof useStickerBoardEditor>;

const StickerBoardEditorContext =
	createContext<StickerBoardEditorContextValue | null>(null);

export function StickerBoardEditorProvider({
	initialComponents,
	children,
}: {
	initialComponents: StickerBoardComponent[];
	children: ReactNode;
}) {
	const value = useStickerBoardEditor(initialComponents);
	return (
		<StickerBoardEditorContext.Provider value={value}>
			{children}
		</StickerBoardEditorContext.Provider>
	);
}

export function useStickerBoardEditorContext() {
	const ctx = useContext(StickerBoardEditorContext);
	if (!ctx) {
		throw new Error(
			"useStickerBoardEditorContext must be used within StickerBoardEditorProvider"
		);
	}
	return ctx;
}
