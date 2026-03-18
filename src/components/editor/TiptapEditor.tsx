"use client";

import { EditorContent, useCurrentEditor } from "@tiptap/react";
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
import { Placeholder } from "@tiptap/extension-placeholder";
import { CustomImage } from "@/components/tiptap-extension/custom-image";
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node";
import { CustomYoutubeNode } from "@/components/tiptap-node/youtube-node/youtube-node";
import { MAX_FILE_SIZE, handleImageUpload } from "@/shared/lib/tiptap-utils";

import "@/styles/tiptap-variables.css";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/image-upload-node/image-upload-node.scss";
import "@/components/tiptap-node/youtube-node/youtube-node.scss";

// Shared Tiptap extensions configuration
export const extensions = [
	StarterKit.configure({
		bulletList: false,
		orderedList: false,
		listItem: false,
		dropcursor: false,
	}),
	Link.configure({ openOnClick: false }),
	Placeholder.configure({
		placeholder: "내용을 입력해주세요",
	}),
	BulletList,
	OrderedList,
	ListItem,
	TextStyle,
	Color.configure({
		types: ["textStyle"],
	}),
	FontFamily.configure({
		types: ["textStyle"],
	}),
	FontSize.configure({
		types: ["textStyle"],
	}),
	Highlight.configure({ multicolor: true }),
	Underline,
	Superscript,
	Subscript,
	TextAlign.configure({ types: ["heading", "paragraph"] }),
	TaskList.configure({
		HTMLAttributes: {
			class: "task-list",
		},
	}),
	TaskItem.configure({
		nested: true,
		HTMLAttributes: {
			class: "task-item",
		},
	}),
	CustomYoutubeNode,
	CustomImage,
	ImageUploadNode.configure({
		accept: "image/*",
		maxSize: MAX_FILE_SIZE,
		limit: 3,
		upload: handleImageUpload,
	}),
];

const TiptapEditor = () => {
	const { editor } = useCurrentEditor();

	if (!editor) {
		return null;
	}

	return (
		<div className="relative flex flex-col grow w-full">
			<EditorContent
				editor={editor}
				className="tiptap w-full min-h-[400px] p-4"
			/>
		</div>
	);
};

export default TiptapEditor;
