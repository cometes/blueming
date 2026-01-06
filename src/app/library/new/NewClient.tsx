"use client";

import * as React from "react";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { extensions } from "@/components/editor/TiptapEditor";
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";
import CreateModal, { CreateMetaValue } from "@/components/modal/createModal";
import { createLibraryPost } from "@/queries/set/createLibrary";
import { updateLibraryPost } from "@/queries/set/updateLibrary";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/auth/UseAdmin";
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
	initialData?: {
		id: string;
		title: string;
		subtitle?: string;
		content: string;
		slug?: string | null;
		summary?: string;
		tags?: string[];
		series?: string;
		allow?: "all" | "password" | "secret";
		password?: string | null;
		thumbnail?: string;
	};
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
	const [subOpen, setSubOpen] = React.useState(false);
	const [title, setTitle] = React.useState("");
	const [subtitle, setSubtitle] = React.useState("");
	const [metaOpen, setMetaOpen] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [metaValue, setMetaValue] = React.useState<CreateMetaValue>({
		tags: [],
		series: "",
		slug: "",
		summary: "",
		visibility: "all",
		password: "",
		thumbnail: "",
	});

	const initialContent = React.useMemo(() => {
		if (!initialData?.content) return "";
		try {
			return JSON.parse(initialData.content);
		} catch {
			return "";
		}
	}, [initialData?.content]);

	const editor = useEditor({
		extensions: extensions,
		content: initialContent,
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "prose max-w-none focus:outline-none min-h-[400px] p-4",
			},
		},
	});

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

	React.useEffect(() => {
		if (!initialData) return;

		setTitle(initialData.title || "");
		setSubtitle(initialData.subtitle || "");
		setMetaValue({
			tags: initialData.tags ?? [],
			series: initialData.series ?? "",
			slug: initialData.slug ?? "",
			summary: initialData.summary ?? "",
			visibility: initialData.allow ?? "all",
			password: initialData.allow === "password" ? initialData.password ?? "" : "",
			thumbnail: initialData.thumbnail ?? "",
		});
	}, [initialData]);

	const handleOpenMeta = () => {
		const plainText = editor?.getText().trim() ?? "";

		if (!title.trim()) {
			alert("제목을 입력해 주세요.");
			return;
		}

		if (!plainText) {
			alert("내용을 입력해 주세요.");
			return;
		}

		setMetaValue((prev) => ({ ...prev, title }));
		setMetaOpen(true);
	};

	const handleConfirmSubmit = async () => {
		if (!editor) {
			toast.error("에디터를 불러오지 못했습니다.");
			return;
		}

		const contentJson = editor.getJSON();
		const contentText = editor.getText().trim();

		if (!title.trim() || !contentText) {
			toast.error("제목과 내용을 입력해주세요.");
			return;
		}

		setIsSubmitting(true);
		try {
			const payload = {
				title: title.trim(),
				subtitle: subtitle.trim() || undefined,
				content: JSON.stringify(contentJson),
				slug: metaValue.slug,
				summary: metaValue.summary,
				tags: metaValue.tags,
				series: metaValue.series,
				visibility: metaValue.visibility,
				password: metaValue.password,
				thumbnail: metaValue.thumbnail,
			};

			if (mode === "edit") {
				if (!initialData?.id) {
					toast.error("수정할 게시글을 찾지 못했습니다.");
					return;
				}
				await updateLibraryPost(initialData.id, payload);
				toast.success("게시글이 수정되었습니다.");
				setMetaOpen(false);
				router.push(`/library/${initialData.id}`);
				router.refresh();
				return;
			}

			const response = await createLibraryPost(payload);
			toast.success("게시글이 저장되었습니다.");
			setMetaOpen(false);
			router.push(`/library/${response.postId}`);
			router.refresh();
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "게시글 저장에 실패했습니다.";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<EditorContext.Provider value={{ editor }}>
			<div className="w-full min-h-dvh">
				{/* Header */}
				<header className="Header w-full h-[60px] border-b border-card-bg backdrop-blur-card fixed top-0 left-0 z-50">
					<div className="HeaderContainer px-20 h-full flex justify-between items-center">
						<Button onClick={onClickMoveToPage("/library/")}>뒤로가기</Button>
						{/* Tiptap Toolbar */}
						<TiptapToolbar editor={editor} />
						<Button onClick={handleOpenMeta}>
							{mode === "edit" ? "수정하기" : "글쓰기"}
						</Button>
					</div>
				</header>
				{/* Body */}
				<div className="Container pt-[150px] pb-[100px] px-[60px] bg-card backdrop-blur-card w-[900px] min-h-dvh border-card flex flex-col m-auto">
					<div className="TitleWrap relative">
						<Input
							placeholder="제목을 입력해주세요."
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="text-5xl border-0 text-main-text bg-background-none placeholder:text-sub-text focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:outline-0 p-0"
						/>
						<span
							className={cn(
								"SubTitleIconBox flex items-center justify-center absolute w-6 h-6 -left-10 bg-gray-300 border border-gray-400 text-gray-400 rounded-[3px] transition-all duration-300 ease cursor-pointer",
								subOpen ? "-bottom-[56px]" : "-bottom-6"
							)}
							onClick={() => {
								setSubOpen((prev) => !prev);
							}}
						>
							{subOpen ? <X size={16} /> : <Plus size={16} />}
						</span>
					</div>
					<div
						className={cn(
							"SubTitleWrap relative transition-all duration-500 ease overflow-hidden",
							subOpen ? "max-h-20 mt-6 opacity-100" : "max-h-0 mt-0 opacity-0"
						)}
					>
						<Input
							placeholder="소제목을 입력해주세요."
							value={subtitle}
							onChange={(e) => setSubtitle(e.target.value)}
							className="text-lg border-0 text-sub-text bg-background-none placeholder:text-sub-text focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:outline-0 transition-all duration-300 ease p-0"
						/>
					</div>
					<Separator className="mt-7" />
					<div className="EditorBox pt-12 relative flex flex-col grow min-h-[400px]">
						{/* Editor Content */}
						<div className="mt-4 flex-1">
							<EditorContent
								editor={editor}
								className="prose max-w-none focus:outline-none w-full"
							/>
						</div>
					</div>
				</div>
			</div>
			<CreateModal
				open={metaOpen}
				onOpenChange={setMetaOpen}
				tagsOptions={tagsData}
				seriesOptions={seriesData}
				value={metaValue}
				onChange={setMetaValue}
				onConfirm={handleConfirmSubmit}
				isSubmitting={isSubmitting}
			/>
		</EditorContext.Provider>
	);
}
