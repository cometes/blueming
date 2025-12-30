"use client";

import * as React from "react";
import { isNodeSelection, type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { CornerDownLeftIcon } from "@/components/tiptap-icons/corner-down-left-icon";
import { ExternalLinkIcon } from "@/components/tiptap-icons/external-link-icon";
import { LinkIcon } from "@/components/tiptap-icons/link-icon";
import { TrashIcon } from "@/components/tiptap-icons/trash-icon";

// --- Lib ---
import { isMarkInSchema, sanitizeUrl } from "@/lib/tiptap-utils";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover";
import { Separator } from "@/components/tiptap-ui-primitive/separator";

// --- Styles ---
import "@/components/tiptap-ui/link-popover/link-popover.scss";

export interface LinkHandlerProps {
	editor: Editor | null;
	onSetLink?: () => void;
	onLinkActive?: () => void;
}

export interface LinkMainProps {
	url: string;
	setUrl: (url: string) => void;
	setLink: () => void;
	removeLink: () => void;
	isActive: boolean;
	onStartEditing?: () => void;
	onStopEditing?: () => void;
}

export const useLinkHandler = (props: LinkHandlerProps) => {
	const { editor, onSetLink, onLinkActive } = props;
	const [url, setUrl] = React.useState<string | null>(null);
	const previousLinkStateRef = React.useRef<boolean>(false);
	const justSetLinkRef = React.useRef<boolean>(false);
	const isEditingRef = React.useRef<boolean>(false);

	React.useEffect(() => {
		if (!editor) return;

		const updateLinkState = () => {
			const isLinkActive = editor.isActive("link");
			const { href } = editor.getAttributes("link");

			// 사용자가 팝오버에서 입력 중이 아닐 때만 URL 상태 업데이트
			if (!isEditingRef.current) {
				setUrl(href || "");
			}

			// 링크가 새로 활성화되었고, 방금 설정한 게 아닌 경우에만 팝오버 열기
			if (
				isLinkActive &&
				!previousLinkStateRef.current &&
				!justSetLinkRef.current
			) {
				onLinkActive?.();
			}

			previousLinkStateRef.current = isLinkActive;

			// justSetLink 플래그 리셋
			if (justSetLinkRef.current) {
				justSetLinkRef.current = false;
			}
		};

		// 초기 상태 설정
		updateLinkState();

		editor.on("selectionUpdate", updateLinkState);
		return () => {
			editor.off("selectionUpdate", updateLinkState);
		};
	}, [editor, onLinkActive]);

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

	const setLink = React.useCallback(() => {
		if (!url || !editor) return;

		const { to } = editor.state.selection;
		const docSize = editor.state.doc.content.size;

		// 선택된 영역이 있으면 그 영역에만 링크 적용
		// 링크 설정 후 커서를 링크 범위 밖으로 이동하여 다음 입력이 일반 텍스트가 되도록 함
		editor.chain().focus().setLink({ href: url }).run();

		// 링크 설정 후 커서를 링크 끝 다음 위치로 이동
		// 문서 끝이 아니면 한 칸 더 이동하여 링크 범위를 완전히 벗어나도록 함
		const nextPosition = to < docSize ? to : docSize;

		editor.chain().setTextSelection(nextPosition).unsetMark("link").run();

		// 링크 설정 직후 플래그 설정
		justSetLinkRef.current = true;
		isEditingRef.current = false;
		setUrl(null);

		onSetLink?.();
	}, [editor, onSetLink, url]);

	const removeLink = React.useCallback(() => {
		if (!editor) return;

		const isLinkActive = editor.isActive("link");

		// 링크가 활성화되어 있으면 링크 범위 전체를 제거
		if (isLinkActive) {
			editor
				.chain()
				.focus()
				.extendMarkRange("link")
				.unsetLink()
				.setMeta("preventAutolink", true)
				.run();
		} else {
			// 선택된 영역의 링크만 제거
			editor.chain().focus().unsetLink().setMeta("preventAutolink", true).run();
		}

		setUrl("");
		isEditingRef.current = false;
		previousLinkStateRef.current = false;
	}, [editor]);

	return {
		url: url || "",
		setUrl: handleSetUrl,
		setLink,
		removeLink,
		isActive: editor?.isActive("link") || false,
		onStartEditing: handleStartEditing,
		onStopEditing: handleStopEditing,
	};
};

export const LinkButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, children, ...props }, ref) => {
		return (
			<Button
				type="button"
				className={className}
				data-style="ghost"
				role="button"
				tabIndex={-1}
				aria-label="Link"
				tooltip="Link"
				ref={ref}
				{...props}
			>
				{children || <LinkIcon className="tiptap-button-icon" />}
			</Button>
		);
	}
);

export const LinkContent: React.FC<{
	editor?: Editor | null;
}> = ({ editor: providedEditor }) => {
	const editor = useTiptapEditor(providedEditor);

	const linkHandler = useLinkHandler({
		editor: editor,
	});

	return <LinkMain {...linkHandler} />;
};

const LinkMain: React.FC<LinkMainProps> = ({
	url,
	setUrl,
	setLink,
	removeLink,
	isActive,
	onStartEditing,
	onStopEditing,
}) => {
	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault();
			setLink();
		}
	};

	const handleOpenLink = () => {
		if (!url) return;

		const safeUrl = sanitizeUrl(url, window.location.href);
		if (safeUrl !== "#") {
			window.open(safeUrl, "_blank", "noopener,noreferrer");
		}
	};

	return (
		<>
			<input
				type="url"
				placeholder="Paste a link..."
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				onKeyDown={handleKeyDown}
				onFocus={onStartEditing}
				onBlur={onStopEditing}
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				className="tiptap-input tiptap-input-clamp"
			/>

			<div className="tiptap-button-group" data-orientation="horizontal">
				<Button
					type="button"
					onClick={setLink}
					title="Apply link"
					disabled={!url && !isActive}
					data-style="ghost"
				>
					<CornerDownLeftIcon className="tiptap-button-icon" />
				</Button>
			</div>

			<Separator />

			<div className="tiptap-button-group" data-orientation="horizontal">
				<Button
					type="button"
					onClick={handleOpenLink}
					title="Open in new window"
					disabled={!url && !isActive}
					data-style="ghost"
				>
					<ExternalLinkIcon className="tiptap-button-icon" />
				</Button>

				<Button
					type="button"
					onClick={removeLink}
					title="Remove link"
					disabled={!url && !isActive}
					data-style="ghost"
				>
					<TrashIcon className="tiptap-button-icon" />
				</Button>
			</div>
		</>
	);
};

export interface LinkPopoverProps extends Omit<ButtonProps, "type"> {
	/**
	 * The TipTap editor instance.
	 */
	editor?: Editor | null;
	/**
	 * Whether to hide the link popover.
	 * @default false
	 */
	hideWhenUnavailable?: boolean;
	/**
	 * Callback for when the popover opens or closes.
	 */
	onOpenChange?: (isOpen: boolean) => void;
	/**
	 * Whether to automatically open the popover when a link is active.
	 * @default false
	 */
	autoOpenOnLinkActive?: boolean;
}

export function LinkPopover({
	editor: providedEditor,
	hideWhenUnavailable = false,
	onOpenChange,
	autoOpenOnLinkActive = false,
	...props
}: LinkPopoverProps) {
	const editor = useTiptapEditor(providedEditor);

	const linkInSchema = isMarkInSchema("link", editor);

	const [isOpen, setIsOpen] = React.useState(false);
	const userClosedRef = React.useRef(false);

	const onSetLink = () => {
		setIsOpen(false);
		userClosedRef.current = true;
	};

	const onLinkActive = () => {
		// 사용자가 명시적으로 닫았으면 자동으로 열지 않음
		if (!userClosedRef.current && autoOpenOnLinkActive) {
			setIsOpen(true);
		}
	};

	const linkHandler = useLinkHandler({
		editor: editor,
		onSetLink,
		onLinkActive,
	});

	const isDisabled = React.useMemo(() => {
		if (!editor) return true;
		if (editor.isActive("codeBlock")) return true;
		return !editor.can().setLink?.({ href: "" });
	}, [editor]);

	const canSetLink = React.useMemo(() => {
		if (!editor) return false;
		try {
			return editor.can().setMark("link");
		} catch {
			return false;
		}
	}, [editor]);

	const isActive = editor?.isActive("link") ?? false;

	const handleOnOpenChange = React.useCallback(
		(nextIsOpen: boolean) => {
			setIsOpen(nextIsOpen);

			// 사용자가 수동으로 팝오버를 열면 플래그 리셋
			if (nextIsOpen) {
				userClosedRef.current = false;
			}

			onOpenChange?.(nextIsOpen);
		},
		[onOpenChange]
	);

	const show = React.useMemo(() => {
		if (!linkInSchema || !editor) {
			return false;
		}

		if (hideWhenUnavailable) {
			if (isNodeSelection(editor.state.selection) || !canSetLink) {
				return false;
			}
		}

		return true;
	}, [linkInSchema, hideWhenUnavailable, editor, canSetLink]);

	if (!show || !editor || !editor.isEditable) {
		return null;
	}

	return (
		<Popover open={isOpen} onOpenChange={handleOnOpenChange}>
			<PopoverTrigger asChild>
				<LinkButton
					disabled={isDisabled}
					data-active-state={isActive ? "on" : "off"}
					data-disabled={isDisabled}
					{...props}
				/>
			</PopoverTrigger>

			<PopoverContent>
				<LinkMain {...linkHandler} />
			</PopoverContent>
		</Popover>
	);
}

LinkButton.displayName = "LinkButton";
