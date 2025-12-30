import { useSettings } from "@/contexts/SettingsContext";
import React, { useState, useRef, useLayoutEffect, useMemo } from "react";
import { isRichTextEmpty, renderRichText } from "@/lib/richText";

// Custom hook: observes element size and returns content dimensions
function useContentDimensions(containerRef: React.RefObject<HTMLDivElement>) {
	const [dims, setDims] = useState({ width: 0, height: 0 });

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const calculate = () => {
			const { width, height } = el.getBoundingClientRect();
			// 총 오프셋 = 보더 양쪽 + 패딩 양쪽
			const totalOffset = 28; // 14px padding on each side
			setDims({
				width: Math.max(0, width - totalOffset),
				height: Math.max(0, height - totalOffset),
			});
		};

		const resizeObserver = new ResizeObserver(calculate);
		resizeObserver.observe(el);
		calculate();

		return () => resizeObserver.disconnect();
	}, [containerRef]);

	return dims;
}

// LayoutPreservingViewer: scales children to fit using CSS zoom
const LayoutPreservingViewer = React.memo<{
	children: React.ReactNode;
	editorWidth: number;
	editorHeight: number;
	viewerWidth: number;
	viewerHeight: number;
}>(({ children, editorWidth, editorHeight, viewerWidth, viewerHeight }) => {
	const contentRef = useRef<HTMLDivElement>(null);
	const { general } = useSettings();

	useLayoutEffect(() => {
		if (!contentRef.current || !editorWidth || !editorHeight) return;

		const scale = Math.min(
			viewerWidth / editorWidth,
			viewerHeight / editorHeight
		);

		Object.assign(contentRef.current.style, {
			zoom: scale,
			width: `${editorWidth}px`,
			height: `${editorHeight}px`,
			padding: "14px", // 에디터 내부 패딩 (총 28px의 절반)
		});
	}, [editorWidth, editorHeight, viewerWidth, viewerHeight]);

	return (
		<div
			className="overflow-y-scroll relative w-full h-full flex justify-center items-center"
			style={{
				scrollbarColor: `${
					general?.design?.widget?.borderColor || "#ccc"
				} transparent`,
				scrollbarWidth: "thin",
			}}
		>
			<div ref={contentRef}>{children}</div>
		</div>
	);
});

LayoutPreservingViewer.displayName = "LayoutPreservingViewer";

export default function WidgetNotice() {
	const { main } = useSettings();
	const noticeData = main?.notice;
	const containerRef = useRef<HTMLDivElement>(null);

	// Widget (viewer) dimensions via custom hook - must be called before any early returns
	const widgetDimensions = useContentDimensions(containerRef);

	// 실제 editorDimensions 데이터가 없으면 빈 컴포넌트 반환
	if (!noticeData?.editorDimensions) {
		return <div className="widget-wrapper" ref={containerRef} />;
	}

	const noticeHtml = useMemo(
		() => renderRichText(noticeData.noticeContent),
		[noticeData.noticeContent]
	);

	const editorDimensions = noticeData.editorDimensions;

	// 공지사항 내용이 비어있으면 빈 컴포넌트 반환
	if (!noticeHtml || isRichTextEmpty(noticeHtml)) {
		return <div className="widget-wrapper" ref={containerRef} />;
	}

	// Render
	return (
		<div className="widget-wrapper" ref={containerRef}>
			<div className="w-full h-full flex items-center justify-center">
				<LayoutPreservingViewer
					editorWidth={editorDimensions.width}
					editorHeight={editorDimensions.height}
					viewerWidth={widgetDimensions.width}
					viewerHeight={widgetDimensions.height}
				>
					<div
						className="rich-text-viewer w-full h-full"
						dangerouslySetInnerHTML={{ __html: noticeHtml }}
					/>
				</LayoutPreservingViewer>
			</div>
		</div>
	);
}
