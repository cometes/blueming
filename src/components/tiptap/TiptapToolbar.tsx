"use client";

import * as React from "react";

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap-ui-primitive/spacer";
import {
	Toolbar,
	ToolbarGroup,
	ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar";

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button";
import { YoutubeUploadButton } from "@/components/tiptap-ui/youtube-upload-button";
import { FontSizeInput } from "@/components/tiptap-ui/font-size-input";
import { FontFamilyDropdownMenu } from "@/components/tiptap-ui/font-family-dropdown-menu";
import { TextColorButton } from "@/components/tiptap-ui/text-color-button";
import { TextBackgroundColorButton } from "@/components/tiptap-ui/text-background-color-button";
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu";
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button";
import {
	ColorHighlightPopover,
	ColorHighlightPopoverContent,
	ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover";
import {
	LinkPopover,
	LinkContent,
	LinkButton,
} from "@/components/tiptap-ui/link-popover";
import { MarkButton } from "@/components/tiptap-ui/mark-button";
import { TextAlignDropdownMenu } from "@/components/tiptap-ui/text-align-dropdown-menu";
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";

// --- Hooks ---
import { useMobile } from "@/hooks/use-mobile";
import type { Editor } from "@tiptap/react";

const MainToolbarContent = ({
	onHighlighterClick,
	onLinkClick,
	isMobile,
	editor,
}: {
	onHighlighterClick: () => void;
	onLinkClick: () => void;
	isMobile: boolean;
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
				<HeadingDropdownMenu levels={[1, 2, 3, 4]} editor={editor} />
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
				{!isMobile ? (
					<ColorHighlightPopover editor={editor} />
				) : (
					<ColorHighlightPopoverButton
						onClick={onHighlighterClick}
						editor={editor}
					/>
				)}
				{!isMobile ? (
					<LinkPopover editor={editor} />
				) : (
					<LinkButton onClick={onLinkClick} editor={editor} />
				)}
			</ToolbarGroup>

			<ToolbarGroup>
				<TextColorButton editor={editor} />
				<TextBackgroundColorButton editor={editor} />
			</ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup></ToolbarGroup>

			<ToolbarSeparator />

			<ToolbarGroup>
				<ImageUploadButton text="Image" editor={editor} />
				<YoutubeUploadButton text="YouTube" editor={editor} />
			</ToolbarGroup>

			<Spacer />
		</>
	);
};

const MobileToolbarContent = ({
	type,
	onBack,
	editor,
}: {
	type: "highlighter" | "link";
	onBack: () => void;
	editor: Editor | null;
}) => (
	<>
		<ToolbarGroup>
			<Button data-style="ghost" onClick={onBack}>
				<ArrowLeftIcon className="tiptap-button-icon" />
				{type === "highlighter" ? (
					<HighlighterIcon className="tiptap-button-icon" />
				) : (
					<LinkIcon className="tiptap-button-icon" />
				)}
			</Button>
		</ToolbarGroup>

		<ToolbarSeparator />

		{type === "highlighter" ? (
			<ColorHighlightPopoverContent editor={editor} />
		) : (
			<LinkContent editor={editor} />
		)}
	</>
);

export interface TiptapToolbarProps {
	editor: Editor | null;
}

export default function TiptapToolbar({ editor }: TiptapToolbarProps) {
	const isMobile = useMobile();
	const [mobileView, setMobileView] = React.useState<
		"main" | "highlighter" | "link"
	>("main");

	React.useEffect(() => {
		if (!isMobile && mobileView !== "main") {
			setMobileView("main");
		}
	}, [isMobile, mobileView]);

	return (
		<Toolbar>
			{mobileView === "main" ? (
				<MainToolbarContent
					onHighlighterClick={() => setMobileView("highlighter")}
					onLinkClick={() => setMobileView("link")}
					isMobile={isMobile}
					editor={editor}
				/>
			) : (
				<MobileToolbarContent
					type={mobileView === "highlighter" ? "highlighter" : "link"}
					onBack={() => setMobileView("main")}
					editor={editor}
				/>
			)}
		</Toolbar>
	);
}
