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
export default function LibararyNewClient() {
	const { onClickMoveToPage } = useMoveToPage();
	const [subOpen, setSubOpen] = React.useState(false);
	const [title, setTitle] = React.useState("");
	const [subtitle, setSubtitle] = React.useState("");
	const [content, setContent] = React.useState("");

	const editor = useEditor({
		extensions: extensions,
		content: "",
		onUpdate: ({ editor }) => {
			setContent(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class: "prose max-w-none focus:outline-none min-h-[400px] p-4",
			},
		},
	});

	const handleSubmit = () => {
		console.log({
			title,
			subtitle,
			content,
		});
		// TODO: 실제 제출 로직 구현
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
						<Button onClick={handleSubmit}>글쓰기</Button>
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
		</EditorContext.Provider>
	);
}
