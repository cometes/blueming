"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { BulletList } from "@tiptap/extension-bullet-list";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { ListItem } from "@tiptap/extension-list-item";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { FontSize } from "@/components/tiptap-extension/font-size";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Link } from "@tiptap/extension-link";
import { CustomImage } from "@/components/tiptap-extension/custom-image";
import { CustomYoutubeNode } from "@/components/tiptap-node/youtube-node/youtube-node";

import "@/styles/tiptap-variables.css";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss";
import "@/components/tiptap-node/youtube-node/youtube-node.scss";

type Content = string | Record<string, unknown> | null;

export default function LibraryContentViewer({ content }: { content: Content }) {
	const extensions = useMemo(
		() => [
			StarterKit.configure({
				bulletList: false,
				orderedList: false,
				listItem: false,
				dropcursor: false,
			}),
			Link.configure({ openOnClick: false }),
			BulletList,
			OrderedList,
			ListItem,
			TextStyle,
			Color.configure({ types: ["textStyle"] }),
			FontFamily.configure({ types: ["textStyle"] }),
			FontSize.configure({ types: ["textStyle"] }),
			Highlight.configure({ multicolor: true }),
			Underline,
			Superscript,
			Subscript,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			TaskList.configure({ HTMLAttributes: { class: "task-list" } }),
			TaskItem.configure({ nested: true, HTMLAttributes: { class: "task-item" } }),
			CustomYoutubeNode,
			CustomImage,
		],
		[],
	);

	const editor = useEditor({
		extensions,
		content: content ?? "",
		immediatelyRender: false,
		editable: false,
		editorProps: {
			attributes: {
				class: "tiptap prose max-w-none text-main-text readonly",
			},
		},
	});

	const editorRef = useRef(editor);
	useEffect(() => {
		editorRef.current = editor;
	}, [editor]);

	useEffect(() => {
		if (!editor || content == null) return;
		editor.commands.setContent(content as Parameters<typeof editor.commands.setContent>[0]);
	}, [editor, content]);

	useEffect(() => {
		return () => {
			editorRef.current?.destroy();
		};
	}, []);

	if (!content || !editor || editor.isEmpty) {
		return <p className="text-sub-text">내용이 없습니다.</p>;
	}

	return <EditorContent editor={editor} />;
}
