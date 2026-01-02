"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import {
	Toolbar,
	ToolbarGroup,
	ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar/toolbar";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu";
import { TextColorButton } from "@/components/tiptap-ui/text-color-button";
import { TextBackgroundColorButton } from "@/components/tiptap-ui/text-background-color-button";

interface SimpleTiptapToolbarProps {
	editor: Editor | null;
}

export default function SimpleTiptapToolbar({ editor }: SimpleTiptapToolbarProps) {
	if (!editor) return null;

	return (
		<Toolbar variant="fixed" className="justify-start">
			{/* Text Formatting */}
			<ToolbarGroup>
				<MarkButton editor={editor} type="bold" />
				<MarkButton editor={editor} type="italic" />
				<MarkButton editor={editor} type="underline" />
			</ToolbarGroup>

			<ToolbarSeparator />

			{/* Text Alignment */}
			<ToolbarGroup>
				<TextAlignDropdownMenu editor={editor} />
			</ToolbarGroup>

			<ToolbarSeparator />

			{/* Text Color */}
			<ToolbarGroup>
				<TextColorButton editor={editor} />
			</ToolbarGroup>

			<ToolbarSeparator />

			{/* Background Color */}
			<ToolbarGroup>
				<TextBackgroundColorButton editor={editor} />
			</ToolbarGroup>
		</Toolbar>
	);
}

