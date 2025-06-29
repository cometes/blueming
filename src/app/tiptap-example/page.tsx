"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { Superscript } from "@tiptap/extension-superscript";
import { Subscript } from "@tiptap/extension-subscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Youtube } from "@tiptap/extension-youtube";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import TiptapToolbar from "@/components/tiptap/TiptapToolbar";

export default function Sample() {
	const editor = useEditor({
		extensions: [
			StarterKit,
			TextStyle,
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
		content: "<p>안녕하세요! 이것은 Tiptap 에디터입니다.</p>",
		editorProps: {
			attributes: {
				class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
			},
		},
	});

	return (
		<div className="max-w-4xl mx-auto p-4">
			<TiptapToolbar editor={editor} />
			<div className="mt-4 border border-gray-300 rounded-lg p-4">
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
