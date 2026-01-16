"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { YoutubeIcon } from "@/components/tiptap-icons/youtube-icon";
import { CornerDownLeftIcon } from "@/components/tiptap-icons/corner-down-left-icon";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover";

export interface YoutubeHandlerProps {
	editor: Editor | null;
	onSetYoutube?: () => void;
}

export interface YoutubeMainProps {
	url: string;
	setUrl: (url: string) => void;
	setYoutube: () => void;
	isActive: boolean;
	onStartEditing?: () => void;
	onStopEditing?: () => void;
}

export function checkYoutubeExtension(editor: Editor | null): boolean {
	if (!editor) return false;

	const hasExtension = editor.extensionManager.extensions.some(
		(extension) => extension.name === "youtube"
	);

	return hasExtension;
}

export function extractYoutubeVideoId(url: string): string | null {
	// YouTube URL 패턴들을 처리
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
		/^([a-zA-Z0-9_-]{11})$/, // 직접 비디오 ID인 경우
	];

	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match) {
			return match[1];
		}
	}

	return null;
}

export function formatYoutubeUrl(input: string): string | null {
	const videoId = extractYoutubeVideoId(input);
	if (!videoId) return null;

	return `https://www.youtube.com/watch?v=${videoId}`;
}

export function insertYoutubeVideo(
	editor: Editor | null,
	src: string,
	width?: number,
	height?: number
): boolean {
	if (!editor) return false;

	try {
		const baseChain = editor
			.chain()
			.focus()
			.command(({ state, tr }) => {
				const { $from } = state.selection;
				const parent = $from.parent;

				if (parent.type.name === "paragraph" && parent.content.size === 0) {
					tr.delete($from.before(), $from.after());
				}

				return true;
			});

		// If an image or youtube is selected, move cursor to the end of selection before inserting
		const { to } = editor.state.selection;
		const selectedNode = (
			"node" in editor.state.selection ? editor.state.selection.node : null
		) as PMNode | null;

		if (
			selectedNode &&
			(selectedNode.type.name === "image" ||
				selectedNode.type.name === "youtube")
		) {
			// Move cursor after the selected node
			return baseChain
				.setTextSelection(to)
				.setYoutubeVideo({
					src,
					width: width || 640,
					height: height || 480,
				})
				.run();
		}

		return baseChain
			.setYoutubeVideo({
				src,
				width: width || 640,
				height: height || 480,
			})
			.run();
	} catch {
		return false;
	}
}

export const useYoutubeHandler = (props: YoutubeHandlerProps) => {
	const { editor, onSetYoutube } = props;
	const [url, setUrl] = React.useState<string>("");
	const isEditingRef = React.useRef<boolean>(false);

	const handleSetUrl = React.useCallback((newUrl: string) => {
		isEditingRef.current = true;
		setUrl(newUrl);
	}, []);

	const handleStartEditing = React.useCallback(() => {
		isEditingRef.current = true;
	}, []);

	const handleStopEditing = React.useCallback(() => {
		isEditingRef.current = false;
	}, []);

	const setYoutube = React.useCallback(() => {
		if (!url || !editor) return;

		const formattedUrl = formatYoutubeUrl(url.trim());

		if (!formattedUrl) {
			return;
		}

		const result = insertYoutubeVideo(editor, formattedUrl);

		if (result) {
			isEditingRef.current = false;
			setUrl("");
			onSetYoutube?.();
		}
	}, [editor, onSetYoutube, url]);

	return {
		url: url || "",
		setUrl: handleSetUrl,
		setYoutube,
		isActive: editor?.isActive("youtube") || false,
		onStartEditing: handleStartEditing,
		onStopEditing: handleStopEditing,
	};
};

export const YoutubeButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, children, ...props }, ref) => {
		return (
			<Button
				type="button"
				className={className}
				data-style="ghost"
				role="button"
				tabIndex={-1}
				aria-label="유튜브 동영상 추가"
				tooltip="유튜브 동영상 추가"
				ref={ref}
				{...props}
			>
				{children || <YoutubeIcon className="tiptap-button-icon" />}
			</Button>
		);
	}
);

const YoutubeMain: React.FC<YoutubeMainProps> = ({
	url,
	setUrl,
	setYoutube,
	isActive,
	onStartEditing,
	onStopEditing,
}) => {
	const [error, setError] = React.useState("");

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault();
			const formattedUrl = formatYoutubeUrl(url.trim());
			if (!formattedUrl) {
				setError("올바른 유튜브 URL을 입력해주세요.");
				return;
			}
			setError("");
			setYoutube();
		} else if (event.key === "Escape") {
			setError("");
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
		setError("");
	};

	return (
		<>
			<input
				type="text"
				placeholder="유튜브 영상 URL을 입력하세요..."
				value={url}
				onChange={handleChange}
				onKeyDown={handleKeyDown}
				onFocus={onStartEditing}
				onBlur={onStopEditing}
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				className="tiptap-input tiptap-input-clamp"
				style={{ fontSize: "0.875rem" }}
			/>
			{error && <div className="text-xs text-red-500 mt-1">{error}</div>}

			<div className="tiptap-button-group" data-orientation="horizontal">
				<Button
					type="button"
					onClick={setYoutube}
					title="유튜브 영상 삽입"
					disabled={!url}
					data-style="ghost"
				>
					<CornerDownLeftIcon className="tiptap-button-icon" />
				</Button>
			</div>
		</>
	);
};

export interface YoutubeUploadButtonProps extends Omit<ButtonProps, "type"> {
	/**
	 * The TipTap editor instance.
	 */
	editor?: Editor | null;
	/**
	 * Whether to hide the youtube upload button.
	 * @default false
	 */
	hideWhenUnavailable?: boolean;
	/**
	 * Callback for when the popover opens or closes.
	 */
	onOpenChange?: (isOpen: boolean) => void;
}

export function YoutubeUploadButton({
	editor: providedEditor,
	hideWhenUnavailable = false,
	onOpenChange,
	...props
}: YoutubeUploadButtonProps) {
	const editor = useTiptapEditor(providedEditor);

	const [isOpen, setIsOpen] = React.useState(false);

	const onSetYoutube = () => {
		setIsOpen(false);
	};

	const youtubeHandler = useYoutubeHandler({
		editor: editor,
		onSetYoutube,
	});

	const isDisabled = React.useMemo(() => {
		if (!editor) return true;
		return !editor
			.can()
			.setYoutubeVideo({ src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" });
	}, [editor]);

	const canSetYoutube = React.useMemo(() => {
		if (!editor) return false;
		try {
			return editor
				.can()
				.setYoutubeVideo({
					src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
				});
		} catch {
			return false;
		}
	}, [editor]);

	const youtubeAvailable = React.useMemo(
		() => checkYoutubeExtension(editor),
		[editor]
	);

	const isActive = editor?.isActive("youtube") ?? false;

	const handleOnOpenChange = React.useCallback(
		(nextIsOpen: boolean) => {
			setIsOpen(nextIsOpen);
			onOpenChange?.(nextIsOpen);
		},
		[onOpenChange]
	);

	const show = React.useMemo(() => {
		if (!youtubeAvailable || !editor) {
			return false;
		}

		if (hideWhenUnavailable && !canSetYoutube) {
			return false;
		}

		return true;
	}, [youtubeAvailable, hideWhenUnavailable, editor, canSetYoutube]);

	if (!show || !editor || !editor.isEditable) {
		return null;
	}

	return (
		<Popover open={isOpen} onOpenChange={handleOnOpenChange}>
			<PopoverTrigger asChild>
				<YoutubeButton
					disabled={isDisabled}
					data-active-state={isActive ? "on" : "off"}
					data-disabled={isDisabled}
					{...props}
				/>
			</PopoverTrigger>

			<PopoverContent>
				<YoutubeMain {...youtubeHandler} />
			</PopoverContent>
		</Popover>
	);
}

YoutubeButton.displayName = "YoutubeButton";

export default YoutubeUploadButton;
