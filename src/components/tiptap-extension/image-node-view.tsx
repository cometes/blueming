"use client";

import * as React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { ImageBubbleMenu } from "@/components/tiptap-ui/image-bubble-menu/image-bubble-menu";

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
	const [currentWidth, setCurrentWidth] = React.useState<number | null>(
		initialWidth
	);
	const imgRef = React.useRef<HTMLImageElement>(null);
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
				const containerWidth = img.parentElement?.clientWidth || naturalWidth;
				const initialWidth = Math.min(naturalWidth, containerWidth);
				updateAttributes({ width: initialWidth });
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
			setCurrentWidth(node.attrs.width);
		}
	}, [node.attrs.width, isResizing]);

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
					updateAttributes({ width: lastWidth });
				}
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[updateAttributes]
	);

	// Use node.attrs.width for the actual width, currentWidth only for preview during resize
	const imgStyle: React.CSSProperties = React.useMemo(() => {
		const width = isResizing ? currentWidth : node.attrs.width || currentWidth;
		if (width !== null) {
			return { width: `${width}px`, maxWidth: "100%" };
		}
		return {};
	}, [currentWidth, node.attrs.width, isResizing]);

	return (
		<NodeViewWrapper
			as="div"
			className={`image-wrapper image-align-${align}`}
			data-align={align}
			contentEditable={false}
			onClick={handleWrapperClick}
		>
			<div
				className={`image-box ${selected ? "ProseMirror-selectednode" : ""} ${
					isResizing ? "is-resizing" : ""
				}`}
				data-drag-handle
				draggable={false}
			>
				{selected && <ImageBubbleMenu editor={editor} currentAlign={align} />}
				{selected && (
					<>
						<div
							className="resize-handle resize-handle-left"
							onMouseDown={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleResizeStart(e, "left");
							}}
							draggable={false}
							onDragStart={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						/>
						<div
							className="resize-handle resize-handle-right"
							onMouseDown={(e) => {
								e.preventDefault();
								e.stopPropagation();
								handleResizeStart(e, "right");
							}}
							draggable={false}
							onDragStart={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						/>
					</>
				)}
				<img
					ref={imgRef}
					src={src}
					alt={alt}
					title={title}
					style={imgStyle}
					draggable={false}
					onDragStart={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
				/>
			</div>
		</NodeViewWrapper>
	);
};

export default ImageNodeView;
