/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { ImageBubbleMenu } from "@/components/tiptap-ui/image-bubble-menu/image-bubble-menu";
import {
	IMAGE_MOVE_MIME,
	clearImageDragSource,
	setImageDragSource,
} from "@/shared/lib/tiptapImage";

export const ImageNodeView: React.FC<NodeViewProps> = ({
	node,
	editor,
	selected,
	getPos,
	updateAttributes,
}) => {
	const align = node.attrs["data-align"] || "left";
	const src = node.attrs.src;
	const alt = node.attrs.alt || "";
	const title = node.attrs.title || "";
	const initialWidth = node.attrs.width;

	const [isResizing, setIsResizing] = React.useState(false);
	// 플로팅/핸들은 노드 선택(selected) 기반으로 표시.
	// 에디터가 블러되면 useLibraryEditor의 onBlur가 노드 선택을 해제하므로 함께 사라진다.
	const showControls = selected && editor.isEditable;
	const [currentWidth, setCurrentWidth] = React.useState<number | null>(
		typeof initialWidth === "number" ? initialWidth : null
	);
	const imgRef = React.useRef<HTMLImageElement>(null);
	const wrapperRef = React.useRef<HTMLDivElement>(null);
	const startXRef = React.useRef<number>(0);
	const startWidthRef = React.useRef<number>(0);

	// Initialize width from image natural size if not set
	React.useEffect(() => {
		const img = imgRef.current;
		if (!img) return;

		const handleImageLoad = () => {
			// Only set initial width if not already set
			if (node.attrs.width === null && updateAttributes) {
				const naturalWidth = img.naturalWidth;
				const containerWidth =
					wrapperRef.current?.parentElement?.clientWidth ||
					wrapperRef.current?.clientWidth ||
					naturalWidth;
				const initialWidth = Math.min(naturalWidth, containerWidth);
				const percent = Math.max(
					10,
					Math.min(100, Math.round((initialWidth / containerWidth) * 100))
				);
				updateAttributes({ width: `${percent}%` });
			}
		};

		if (img.complete && img.naturalWidth > 0) {
			handleImageLoad();
		} else {
			img.addEventListener("load", handleImageLoad);
			return () => img.removeEventListener("load", handleImageLoad);
		}
	}, [node.attrs.width, updateAttributes]);

	// Sync currentWidth with node.attrs.width when it changes externally
	React.useEffect(() => {
		if (
			node.attrs.width !== undefined &&
			node.attrs.width !== null &&
			!isResizing
		) {
			if (typeof node.attrs.width === "number") {
				setCurrentWidth(node.attrs.width);
			} else {
				setCurrentWidth(null);
			}
		}
	}, [node.attrs.width, isResizing]);

	React.useEffect(() => {
		if (!editor?.isEditable) return;
		if (typeof node.attrs.width !== "number" || !updateAttributes) return;
		const containerWidth =
			wrapperRef.current?.parentElement?.clientWidth ||
			wrapperRef.current?.clientWidth ||
			0;
		if (containerWidth > 0) {
			const percent = Math.max(
				10,
				Math.min(100, Math.round((node.attrs.width / containerWidth) * 100))
			);
			updateAttributes({ width: `${percent}%` });
		}
	}, [editor?.isEditable, node.attrs.width, updateAttributes]);

	const handleWrapperClick = React.useCallback(
		(e: React.MouseEvent) => {
			// wrapper 자체를 클릭했을 때만 (box를 클릭한 게 아닐 때)
			if (e.target === e.currentTarget) {
				// 선택 해제
				editor.commands.setTextSelection(getPos() + node.nodeSize);
			}
		},
		[editor, getPos, node.nodeSize]
	);

	const handleResizeStart = React.useCallback(
		(e: React.MouseEvent, direction: "left" | "right") => {
			e.preventDefault();
			e.stopPropagation();

			setIsResizing(true);
			startXRef.current = e.clientX;

			const currentWidth = imgRef.current?.offsetWidth || 0;
			startWidthRef.current = currentWidth;
			setCurrentWidth(currentWidth);

			let lastWidth = currentWidth;

			const handleMouseMove = (moveEvent: MouseEvent) => {
				const deltaX =
					direction === "right"
						? moveEvent.clientX - startXRef.current
						: startXRef.current - moveEvent.clientX;

				const newWidth = Math.max(
					100,
					Math.min(1000, startWidthRef.current + deltaX)
				);
				setCurrentWidth(newWidth);
				lastWidth = newWidth;
			};

			const handleMouseUp = () => {
				setIsResizing(false);
				if (updateAttributes && lastWidth !== startWidthRef.current) {
					const containerWidth =
						wrapperRef.current?.parentElement?.clientWidth ||
						wrapperRef.current?.clientWidth ||
						0;
					if (containerWidth > 0) {
						const percent = Math.max(
							10,
							Math.min(100, Math.round((lastWidth / containerWidth) * 100))
						);
						updateAttributes({ width: `${percent}%` });
					} else {
						updateAttributes({ width: lastWidth });
					}
				}
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[updateAttributes]
	);

	const boxStyle: React.CSSProperties = React.useMemo(() => {
		if (isResizing && currentWidth !== null) {
			return { width: `${currentWidth}px`, maxWidth: "100%" };
		}
		const widthAttr = node.attrs.width;
		if (widthAttr !== null && widthAttr !== undefined) {
			if (typeof widthAttr === "number") {
				return { width: `${widthAttr}px`, maxWidth: "100%" };
			}
			const raw = String(widthAttr).trim();
			const widthValue = /^\d+(\.\d+)?$/.test(raw) ? `${raw}px` : raw;
			return { width: widthValue, maxWidth: "100%" };
		}
		return { width: "100%", maxWidth: "100%" };
	}, [currentWidth, node.attrs.width, isResizing]);

	const imgStyle: React.CSSProperties = React.useMemo(() => {
		return { width: "100%", maxWidth: "100%", height: "auto" };
	}, []);

	return (
		<NodeViewWrapper
			as="div"
			className={`image-wrapper image-align-${align}`}
			data-align={align}
			contentEditable={false}
			onClick={handleWrapperClick}
			ref={wrapperRef}
		>
			<div
				className={`image-box ${selected ? "ProseMirror-selectednode" : ""} ${
					isResizing ? "is-resizing" : ""
				}`}
				style={boxStyle}
			>
				{showControls && (
					<ImageBubbleMenu editor={editor} currentAlign={align} />
				)}
				{showControls && (
					<>
						<div
							className="resize-handle resize-handle-left"
							onMouseDown={(e) => handleResizeStart(e, "left")}
						/>
						<div
							className="resize-handle resize-handle-right"
							onMouseDown={(e) => handleResizeStart(e, "right")}
						/>
					</>
				)}
				{/* 드래그 시 커스텀 MIME으로 원본 위치를 기록해 에디터 handleDrop이
				    "이동"으로 처리하게 한다. (네이티브 이미지 드래그로 빠지면 복제됨) */}
				<img
					ref={imgRef}
					src={src}
					alt={alt}
					title={title}
					style={imgStyle}
					draggable
					data-drag-handle=""
					onDragStart={(e) => {
						// 실제 드래그(mousedown→dragstart)에서는 tiptap stopEvent가 dragstart를
						// PM에 통과시키고, PM 네이티브가 직렬화·이동·경계 스냅·빈 문단 처리까지
						// 전부 수행한다. 여기서 selection/view.dragging을 건드리면 PM이 만든
						// 올바른 Dragging을 망가뜨리므로 절대 개입하지 않는다.
						// 에디터 밖 드롭 지원을 위한 식별 정보만 기록한다.
						const pos = getPos();
						setImageDragSource(editor, pos);
						e.dataTransfer.setData(IMAGE_MOVE_MIME, String(pos));
					}}
					onDragEnd={() => {
						clearImageDragSource();
					}}
				/>
			</div>
		</NodeViewWrapper>
	);
};

export default ImageNodeView;
