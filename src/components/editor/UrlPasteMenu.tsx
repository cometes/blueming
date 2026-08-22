"use client";

import * as React from "react";
import { ImagePlus, Link as LinkIcon, Youtube } from "lucide-react";
import { toast } from "sonner";
import type { Editor } from "@tiptap/react";
import type { UrlPasteInfo } from "@/components/editor/useRichEditor";
import {
	filenameFromUrl,
	isYoutubeUrl,
	loadImageSize,
} from "@/shared/lib/tiptapImage";

const MAX_INSERT_WIDTH = 800;

interface UrlPasteMenuProps {
	editor: Editor | null;
	info: UrlPasteInfo;
	onClose: () => void;
}

/**
 * URL 붙여넣기 직후 캐럿 근처에 뜨는 전환 메뉴 (노션 스타일).
 * 기본은 이미 삽입된 링크 유지 — "임베드" 선택 시 링크 범위를 이미지/동영상으로 교체.
 * 다른 곳 클릭, Esc, 추가 편집, 스크롤 시 자동으로 닫힌다.
 */
export default function UrlPasteMenu({ editor, info, onClose }: UrlPasteMenuProps) {
	const menuRef = React.useRef<HTMLDivElement>(null);
	const [coords, setCoords] = React.useState<{ left: number; top: number } | null>(
		null,
	);
	const [isEmbedding, setIsEmbedding] = React.useState(false);
	const youtube = isYoutubeUrl(info.url);

	// 링크 끝 위치의 화면 좌표에 메뉴 배치
	React.useEffect(() => {
		if (!editor) return;
		try {
			const pos = Math.min(info.to, editor.state.doc.content.size);
			const c = editor.view.coordsAtPos(pos);
			setCoords({ left: c.left, top: c.bottom + 6 });
		} catch {
			onClose();
		}
	}, [editor, info.to, onClose]);

	// 닫힘 조건: 바깥 클릭 / Esc / 추가 편집(문서 변경) / 스크롤
	React.useEffect(() => {
		if (!editor) return;
		const onMouseDown = (e: MouseEvent) => {
			if (menuRef.current?.contains(e.target as Node)) return;
			onClose();
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		const onDocChange = ({ transaction }: { transaction: { docChanged: boolean } }) => {
			if (transaction.docChanged) onClose();
		};
		const onScroll = () => onClose();
		document.addEventListener("mousedown", onMouseDown);
		document.addEventListener("keydown", onKeyDown);
		window.addEventListener("scroll", onScroll, true);
		editor.on("transaction", onDocChange);
		return () => {
			document.removeEventListener("mousedown", onMouseDown);
			document.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("scroll", onScroll, true);
			editor.off("transaction", onDocChange);
		};
	}, [editor, onClose]);

	const replaceRange = (content: Record<string, unknown>) => {
		if (!editor) return;
		const doc = editor.state.doc;
		let from = info.from;
		let to = Math.min(info.to, doc.content.size);
		// 링크 텍스트가 문단 내용 전체라면 문단째 교체해 빈 줄이 남지 않게 한다
		try {
			const $from = doc.resolve(from);
			if (
				$from.depth > 0 &&
				$from.parent.isTextblock &&
				from === $from.start() &&
				to === $from.end()
			) {
				from = $from.before();
				to = $from.after();
			}
		} catch {}
		editor
			.chain()
			.focus()
			.insertContentAt({ from, to }, content)
			.run();
		// 커서를 임베드된 노드 뒤로 이동 (TrailingNode가 마지막 문단을 보장)
		editor.commands.focus(Math.min(from + 1, editor.state.doc.content.size));
	};

	const handleEmbedImage = async () => {
		if (!editor || isEmbedding) return;
		setIsEmbedding(true);
		const size = await loadImageSize(info.url);
		if (!size.ok) {
			toast.error("이미지를 불러올 수 없는 URL이에요. 링크로 유지합니다.");
			onClose();
			return;
		}
		const filename = filenameFromUrl(info.url);
		replaceRange({
			type: "image",
			attrs: {
				src: info.url,
				alt: filename,
				title: filename,
				width: Math.min(size.width ?? MAX_INSERT_WIDTH, MAX_INSERT_WIDTH),
				"data-align": "left",
			},
		});
		onClose();
	};

	const handleEmbedYoutube = () => {
		if (!editor) return;
		const to = Math.min(info.to, editor.state.doc.content.size);
		editor.chain().focus().deleteRange({ from: info.from, to }).run();
		editor.chain().focus().setYoutubeVideo({ src: info.url }).run();
		onClose();
	};

	if (!coords) return null;

	return (
		<div
			ref={menuRef}
			className="fixed z-[70] flex items-center gap-1 rounded-card border border-card bg-card p-1 shadow-lg backdrop-blur-card"
			style={{ left: coords.left, top: coords.top }}
		>
			<button
				type="button"
				onClick={onClose}
				className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-main-text hover:bg-theme-primary/10 hover:text-theme-primary"
			>
				<LinkIcon size={13} />
				링크로 유지
			</button>
			{youtube ? (
				<button
					type="button"
					onClick={handleEmbedYoutube}
					className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-main-text hover:bg-theme-primary/10 hover:text-theme-primary"
				>
					<Youtube size={13} />
					동영상으로 임베드
				</button>
			) : (
				<button
					type="button"
					onClick={handleEmbedImage}
					disabled={isEmbedding}
					className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-main-text hover:bg-theme-primary/10 hover:text-theme-primary disabled:opacity-50"
				>
					<ImagePlus size={13} />
					{isEmbedding ? "확인 중..." : "이미지로 임베드"}
				</button>
			)}
		</div>
	);
}
