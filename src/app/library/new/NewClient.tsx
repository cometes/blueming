"use client";

import * as React from "react";
import { useMoveToPage } from "@/hooks/useMoveToPage";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { EditorContent, EditorContext, useEditor } from "@tiptap/react";
import { extensions } from "@/components/editor/TiptapEditor";
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";
import CreateModal, { CreateMetaValue } from "@/components/modal/createModal";

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
}

export default function LibararyNewClient({
	seriesData = [],
	tagsData = [],
}: LibraryNewClientProps) {
	const { onClickMoveToPage } = useMoveToPage();
	const [subOpen, setSubOpen] = React.useState(false);
	const [title, setTitle] = React.useState("");
	const [subtitle, setSubtitle] = React.useState("");
	const [content, setContent] = React.useState("");
	const [metaOpen, setMetaOpen] = React.useState(false);
	const [metaValue, setMetaValue] = React.useState<CreateMetaValue>({
		tags: [],
		series: "",
		slug: "",
		summary: "",
		visibility: "all",
		password: "",
		thumbnail: "",
	});

	const editor = useEditor({
		extensions: extensions,
		content: "",
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			setContent(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class: "prose max-w-none focus:outline-none min-h-[400px] p-4",
			},
		},
	});

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

	const handleConfirmSubmit = () => {
		const payload = {
			title,
			subtitle,
			content,
			slug: metaValue.slug,
			summary: metaValue.summary,
			tags: metaValue.tags,
			series: metaValue.series,
			visibility: metaValue.visibility,
			password:
				metaValue.visibility === "password" ? metaValue.password : undefined,
			thumbnail: metaValue.thumbnail,
		};

		console.log("📝 게시글 제출 데이터:", payload);
		console.log("📊 상세 정보:");
		console.log("  - 제목:", payload.title);
		console.log("  - 부제목:", payload.subtitle || "(없음)");
		console.log("  - 내용 길이:", payload.content.length, "자");
		console.log("  - 커스텀 Slug:", payload.slug || "(자동 생성)");
		console.log("  - 요약:", payload.summary || "(없음)");
		console.log(
			"  - 태그:",
			payload.tags.length > 0 ? payload.tags.join(", ") : "(없음)"
		);
		console.log("  - 시리즈:", payload.series || "(없음)");
		console.log("  - 공개 설정:", payload.visibility);
		console.log("  - 비밀번호:", payload.password ? "******" : "(없음)");
		console.log("  - 썸네일:", payload.thumbnail ? "있음" : "(없음)");

		setMetaOpen(false);
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
						<Button onClick={handleOpenMeta}>글쓰기</Button>
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
			/>
		</EditorContext.Provider>
	);
}
