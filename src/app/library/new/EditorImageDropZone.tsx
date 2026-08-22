"use client";

import * as React from "react";
import { ImagePlus } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { uploadAndInsertImages } from "@/features/library/hooks/useLibraryEditor";

interface EditorImageDropZoneProps {
	editor: Editor | null;
	children: React.ReactNode;
}

/**
 * 에디터 영역 위로 이미지 파일을 드래그하면 안내 오버레이를 띄우는 드롭존.
 * - 실제 삽입은 ProseMirror handleDrop이 드롭 좌표 기준으로 처리하고,
 *   본문 밖 여백에 떨어뜨린 경우만 여기서 문서 끝에 삽입한다.
 */
export default function EditorImageDropZone({
	editor,
	children,
}: EditorImageDropZoneProps) {
	const [isDragOver, setIsDragOver] = React.useState(false);
	// 자식 요소 경계를 지날 때마다 enter/leave가 반복 발생하므로 깊이 카운터로 판정
	const depthRef = React.useRef(0);

	const hasImageFiles = (e: React.DragEvent) =>
		Array.from(e.dataTransfer?.items ?? []).some(
			(item) => item.kind === "file" && item.type.startsWith("image/"),
		);

	const resetDragOver = () => {
		depthRef.current = 0;
		setIsDragOver(false);
	};

	return (
		<div
			className="relative flex flex-1 flex-col"
			onDragEnter={(e) => {
				if (!hasImageFiles(e)) return;
				e.preventDefault();
				depthRef.current += 1;
				setIsDragOver(true);
			}}
			onDragOver={(e) => {
				if (!hasImageFiles(e)) return;
				e.preventDefault();
			}}
			onDragLeave={(e) => {
				if (!hasImageFiles(e)) return;
				depthRef.current = Math.max(0, depthRef.current - 1);
				if (depthRef.current === 0) {
					setIsDragOver(false);
				}
			}}
			onDrop={(e) => {
				resetDragOver();
				// ProseMirror handleDrop이 이미 처리한 드롭(본문 위)은 건너뜀
				if (e.defaultPrevented) return;
				const files = Array.from(e.dataTransfer?.files ?? []).filter((file) =>
					file.type.startsWith("image/"),
				);
				if (files.length === 0) return;
				e.preventDefault();
				if (editor) {
					void uploadAndInsertImages(editor, files, "end");
				}
			}}
		>
			{children}
			{isDragOver && (
				<div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-card border-2 border-dashed border-theme-primary bg-theme-primary/10">
					<div className="flex flex-col items-center gap-2 rounded-card bg-card px-6 py-4 text-theme-primary border border-theme-primary/30">
						<ImagePlus size={28} />
						<span className="text-sm font-medium">
							이곳에 놓으면 이미지가 삽입됩니다
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
