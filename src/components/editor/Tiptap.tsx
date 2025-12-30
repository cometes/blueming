"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Youtube } from "@tiptap/extension-youtube";
import { Link } from "@tiptap/extension-link";
import { FontSize } from "@/components/tiptap-extension/font-size";

interface TiptapProps {
	onEditorReady?: (editor: any) => void;
}

const Tiptap = ({ onEditorReady }: TiptapProps) => {
	const editor = useEditor({
		extensions: [
			StarterKit,
			TextStyle,
			FontSize,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "tiptap-link",
				},
			}),
			Color.configure({
				types: ["textStyle"],
			}),
			FontFamily.configure({
				types: ["textStyle"],
			}),
			Highlight.configure({ multicolor: true }),
			Underline,
			Superscript,
			Subscript,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Youtube.configure({
				inline: false,
				width: 640,
				height: 480,
			}),
		],
		content: "<p>내용을 입력해주세요</p>",
		editorProps: {
			attributes: {
				class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4",
			},
		},
		onCreate: ({ editor }) => {
			onEditorReady?.(editor);
		},
	});

	return <EditorContent editor={editor} />;
};

export default Tiptap;
