"use client";

import * as React from "react";

// --- UI Primitives ---
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
	Toolbar,
	ToolbarGroup,
	ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap UI ---
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { YoutubeUploadButton } from "@/components/tiptap-ui/youtube-upload-button";
import { FontSizeInput } from "@/components/tiptap-ui/font-size-input";
import { FontFamilyDropdownMenu } from "@/components/tiptap-ui/font-family-dropdown-menu";
import { TextColorButton } from "@/components/tiptap-ui/text-color-button";
import { TextBackgroundColorButton } from "@/components/tiptap-ui/text-background-color-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import { LinkPopover } from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu";

// --- Icons ---
import type { Editor } from "@tiptap/react";

const MainToolbarContent = ({
	editor,
}: {
	editor: Editor | null;
}) => {
	return (
		<>
			<Spacer />
			<ToolbarGroup>
				<FontFamilyDropdownMenu editor={editor} />
				<FontSizeInput editor={editor} />
			</ToolbarGroup>
			<ToolbarSeparator />

			<ToolbarGroup>
				<TextAlignDropdownMenu editor={editor} />
				<ListDropdownMenu
					types={["bulletList", "orderedList", "taskList"]}
					editor={editor}
				/>
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<MarkButton type="bold" editor={editor} />
				<MarkButton type="italic" editor={editor} />
				<MarkButton type="strike" editor={editor} />
				<MarkButton type="underline" editor={editor} />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<BlockquoteButton editor={editor} />
				<MarkButton type="code" editor={editor} />
				<CodeBlockButton editor={editor} />
				<LinkPopover editor={editor} />
			</ToolbarGroup>

			<ToolbarGroup>
				<TextColorButton editor={editor} />
				<TextBackgroundColorButton editor={editor} />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup></ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<ImageUploadButton text="이미지" editor={editor} />
				<YoutubeUploadButton editor={editor} />
			</ToolbarGroup>

			<Spacer />
		</>
	);
};

export interface TiptapToolbarProps {
	editor: Editor | null;
}

export default function TiptapToolbar({ editor }: TiptapToolbarProps) {
	return (
		<Toolbar>
			<MainToolbarContent editor={editor} />
		</Toolbar>
	);
}
