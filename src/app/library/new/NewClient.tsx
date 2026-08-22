"use client";

import * as React from "react";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { EditorContent, EditorContext, type Editor } from "@tiptap/react";
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";
import { MobileToolbarContainer } from "@/components/tiptap/MobileToolbarContainer";
import CreateModal from "@/features/library/components/CreateModal";
import {
	useLibraryComposer,
	type LibraryComposerInitialData,
} from "@/features/library/hooks/useLibraryComposer";
import { useLibraryEditor } from "@/features/library/hooks/useLibraryEditor";
import NewTitleFields from "./NewTitleFields";
import ProtectedContentGate from "./ProtectedContentGate";
import EditorImageDropZone from "@/components/editor/EditorImageDropZone";
import DragDebugHud from "./DragDebugHud";
import UrlPasteMenu from "@/components/editor/UrlPasteMenu";
import BlockDropIndicator from "@/components/editor/BlockDropIndicator";
import { toast } from "sonner";
import { useAdmin } from "@/features/admin/hooks/useAdmin";
import { useAuthStore } from "@/store/auth/store";

interface SeriesItem {
	id: string;
	name: string;
}

interface TagItem {
	id: string;
	name: string;
}

interface LibraryNewClientProps {
	seriesData: SeriesItem[];
	tagsData: TagItem[];
	initialData?: LibraryComposerInitialData;
	mode?: "create" | "edit";
}

export default function LibararyNewClient({
	seriesData = [],
	tagsData = [],
	initialData,
	mode = "create",
}: LibraryNewClientProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const router = useRouter();
	const { isAdmin } = useAdmin();
	const isAuthLoading = useAuthStore((state) => state.isLoading);

	const editorRef = React.useRef<Editor | null>(null);
	const composer = useLibraryComposer({ editorRef, mode, initialData });
	// URL 붙여넣기 시 링크/임베드 전환 메뉴 상태는 useRichEditor가 관리
	const { editor, urlPaste, closeUrlPaste, dropIndicatorY } = useLibraryEditor(
		composer.initialContent,
	);
	editorRef.current = editor;

	// 수정 모드는 관리자만 접근 가능
	React.useEffect(() => {
		if (mode !== "edit" || isAuthLoading) return;
		if (!isAdmin) {
			toast.error("권한이 없습니다.");
			router.push("/library");
			router.refresh();
		}
	}, [mode, isAdmin, isAuthLoading, router]);

	if (mode === "edit" && !isAuthLoading && !isAdmin) {
		return null;
	}

	return (
		<EditorContext.Provider value={{ editor }}>
			<div className="w-full min-h-dvh">
				{/* Header */}
				<header className="Header w-full h-[60px] border-b border-card-bg backdrop-blur-card fixed top-0 left-0 z-50">
					<div
						className={cn(
							"HeaderContainer h-full flex justify-between items-center",
							"px-4 sm:px-6",
						)}
					>
						<Button variant="ghost" onClick={onClickMoveToPage("/library/")}>
							뒤로가기
						</Button>
						{/* Tiptap Toolbar - 데스크톱에서만 헤더에 표시 */}
						<div className="flex-1 mx-4 overflow-hidden hidden sm:flex">
							<TiptapToolbar editor={editor} />
						</div>
						<Button onClick={composer.handleOpenMeta}>
							{mode === "edit" ? "수정하기" : "글쓰기"}
						</Button>
					</div>
				</header>
				{/* Mobile Toolbar - 모바일에서 키보드 상단 고정 */}
				<MobileToolbarContainer>
					<TiptapToolbar editor={editor} />
				</MobileToolbarContainer>
				{/* Body */}
				<div
					className={cn(
						"Container pt-[100px] md:pt-[120px] px-6 md:px-12 bg-card backdrop-blur-card max-w-3xl min-h-dvh border-card flex flex-col m-auto",
						"pb-[120px] sm:pb-[100px]",
					)}
				>
					<NewTitleFields
						title={composer.title}
						onTitleChange={composer.setTitle}
						subtitle={composer.subtitle}
						onSubtitleChange={composer.setSubtitle}
					/>

					<hr className="mt-7 border-gray-600" />
					<div className="EditorBox pt-8 relative flex flex-col grow min-h-[400px]">
						{composer.needsPasswordForEdit && (
							<ProtectedContentGate
								passwordInput={composer.passwordInput}
								onPasswordInputChange={composer.setPasswordInput}
								passwordError={composer.passwordError}
								isVerifying={composer.isVerifyingPassword}
								onVerify={composer.handleVerifyPassword}
							/>
						)}
							{/* Editor Content */}
						<EditorImageDropZone editor={editor}>
							<div className="flex-1">
								<EditorContent
									editor={editor}
									className="prose max-w-none focus:outline-none w-full h-full"
								/>
							</div>
						</EditorImageDropZone>
					</div>
				</div>
			</div>
			{urlPaste && (
				<UrlPasteMenu editor={editor} info={urlPaste} onClose={closeUrlPaste} />
			)}
			{dropIndicatorY != null && (
				<BlockDropIndicator editor={editor} y={dropIndicatorY} />
			)}
			{/* 임시 진단 도구 — 드래그 문제 원인 파악용, dev 전용 */}
			{process.env.NODE_ENV === "development" && <DragDebugHud />}
			<CreateModal
				open={composer.metaOpen}
				onOpenChange={composer.setMetaOpen}
				tagsOptions={tagsData}
				seriesOptions={seriesData}
				value={composer.metaValue}
				onChange={composer.setMetaValue}
				onConfirm={composer.handleConfirmSubmit}
				isSubmitting={composer.isSubmitting}
			/>
		</EditorContext.Provider>
	);
}
