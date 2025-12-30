import React, { useState, useCallback } from "react";
import { ReactEditor, useSlate } from "slate-react";
import { Editor, Transforms, Element } from "slate";
import { SquarePlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type {
	CustomElement,
	CustomText,
	AlignType,
} from "../../../types/slate";

interface VideoButtonProps {}

const VideoButton: React.FC<VideoButtonProps> = () => {
	const editor = useSlate();
	const [isOpen, setIsOpen] = useState(false);
	const [videoUrl, setVideoUrl] = useState("");
	const [loading, setLoading] = useState(false);

	// 현재 커서 위치의 정렬 속성 가져오기
	const getCurrentAlign = useCallback((): AlignType => {
		const { selection } = editor;
		if (!selection) return "left";

		const [match] = Editor.nodes(editor, {
			match: (n) => !Editor.isEditor(n) && Element.isElement(n),
			mode: "lowest",
		});

		if (match && match[0]) {
			const element = match[0] as CustomElement;
			return element.align || "left";
		}

		return "left";
	}, [editor]);

	// 캔버스 가로 길이 가져오기
	const getCanvasWidth = useCallback(() => {
		try {
			// 에디터의 루트 노드 찾기
			const [root] = Editor.nodes(editor, {
				match: (n) => Editor.isEditor(n),
				mode: "lowest",
			});

			if (root) {
				const editorElement = ReactEditor.toDOMNode(editor, root[0]);
				if (editorElement) {
					// 패딩을 제외한 실제 컨텐츠 영역 너비
					const computedStyle = window.getComputedStyle(editorElement);
					const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
					const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
					return editorElement.clientWidth - paddingLeft - paddingRight;
				}
			}
		} catch (error) {
			console.warn("Could not get canvas width:", error);
		}
		// 기본값: 대부분의 에디터 기본 너비
		return 800;
	}, [editor]);

	// 비디오 크기 계산 (16:9 비율, 캔버스 너비 제한)
	const calculateVideoSize = useCallback(() => {
		const maxWidth = getCanvasWidth();
		const aspectRatio = 16 / 9; // YouTube 기본 비율

		// 기본 비디오 크기 (480x270)
		const defaultWidth = 480;
		const defaultHeight = Math.round(defaultWidth / aspectRatio);

		// 캔버스 너비보다 작으면 기본 크기 사용
		if (defaultWidth <= maxWidth) {
			return { width: defaultWidth, height: defaultHeight };
		}

		// 캔버스 너비에 맞춤
		return {
			width: maxWidth,
			height: Math.round(maxWidth / aspectRatio),
		};
	}, [getCanvasWidth]);

	// YouTube URL에서 비디오 ID 추출
	const extractVideoId = useCallback((url: string): string | null => {
		const match = url.match(
			/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
		);
		return match ? match[1] : null;
	}, []);

	// 비디오 노드 삽입 (Slate 권장 방식)
	const insertVideo = useCallback(
		async (url: string) => {
			const currentAlign = getCurrentAlign();
			const { width, height } = calculateVideoSize();

			// YouTube URL 검증 및 embed URL 생성
			const videoId = extractVideoId(url);
			if (!videoId) {
				throw new Error("올바른 YouTube URL을 입력해주세요.");
			}

			const embedUrl = `https://www.youtube.com/embed/${videoId}`;

			// Editor.withoutNormalizing으로 모든 변환을 한 번에 처리
			Editor.withoutNormalizing(editor, () => {
				// 현재 선택 영역 확인
				const { selection } = editor;
				if (!selection) {
					// 선택 영역이 없으면 에디터 끝에 커서 설정
					Transforms.select(editor, Editor.end(editor, []));
				}

				// 비디오 노드 생성
				const videoNode: CustomElement = {
					type: "video",
					url: embedUrl,
					align: currentAlign,
					width,
					height,
					children: [{ text: "" } as CustomText],
				};

				// 빈 문단 노드 생성
				const paragraphNode: CustomElement = {
					type: "paragraph",
					align: currentAlign,
					children: [{ text: "" } as CustomText],
				};

				// 현재 노드가 빈 문단인지 확인
				const [currentNode, currentPath] = Editor.node(
					editor,
					editor.selection!
				);
				const currentText = Editor.string(editor, currentPath);

				if (
					currentNode &&
					"type" in currentNode &&
					currentNode.type === "paragraph" &&
					currentText.trim() === ""
				) {
					// 빈 문단이면 비디오로 교체하고 새 문단 추가
					Transforms.setNodes(editor, videoNode, { at: currentPath });
					Transforms.insertNodes(editor, paragraphNode);
				} else {
					// 내용이 있거나 다른 타입이면 비디오와 문단을 연속 삽입
					Transforms.insertNodes(editor, [videoNode, paragraphNode]);
				}

				// 새 문단으로 커서 이동
				const nextPath = Editor.after(editor, editor.selection!);
				if (nextPath) {
					Transforms.select(editor, nextPath);
				}
			});

			// 에디터에 포커스
			ReactEditor.focus(editor);
		},
		[editor, getCurrentAlign, calculateVideoSize, extractVideoId]
	);

	// URL 삽입 실행
	const handleUrlInsert = useCallback(async () => {
		if (!videoUrl.trim()) {
			alert("YouTube URL을 입력해주세요.");
			return;
		}

		setLoading(true);
		try {
			await insertVideo(videoUrl);
			setVideoUrl("");
			setIsOpen(false);
		} catch (error) {
			alert(error instanceof Error ? error.message : "비디오 삽입 실패");
		} finally {
			setLoading(false);
		}
	}, [videoUrl, insertVideo]);

	// 팝오버 닫기
	const closePopover = useCallback(() => {
		setIsOpen(false);
		setVideoUrl("");
	}, []);

	// Enter 키 처리
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" && !loading) {
				e.preventDefault();
				handleUrlInsert();
			}
		},
		[handleUrlInsert, loading]
	);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="w-8 h-8 p-0 hover:bg-muted"
					onMouseDown={(event) => {
						event.preventDefault();
						ReactEditor.focus(editor);
					}}
				>
					<SquarePlay size={16} className="text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="max-w-[280px]" align="center">
				<div className="flex flex-col gap-2">
					<div>
						<Label htmlFor="video-url">YouTube URL</Label>
						<Input
							id="video-url"
							placeholder="https://www.youtube.com/watch?v=..."
							value={videoUrl}
							onChange={(e) => setVideoUrl(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={loading}
							className="h-8 rounded-[4px] mt-1"
						/>
					</div>

					<div className="flex justify-end">
						<Button
							onClick={handleUrlInsert}
							disabled={!videoUrl.trim() || loading}
							className="h-8"
						>
							{loading ? "삽입 중..." : "삽입"}
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default VideoButton;
