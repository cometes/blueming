import { useSettings } from "@/contexts/SettingsContext";
import React, { useState, useRef, useLayoutEffect, useMemo } from "react";
import withVideo from "@/hooks/editor/UseWithVideo";
import { withInlines } from "@/hooks/editor/UseWithInline";
import { withImages } from "@/hooks/editor/UseWithImage";
import { withHistory } from "slate-history";
import { Slate, Editable, withReact } from "slate-react";
import { createEditor } from "slate";
import Leaf from "../editor/Leaf";
import Viewer from "../editor/Viewer";

// Custom hook: observes element size and returns content dimensions
function useContentDimensions(
	containerRef: React.RefObject<HTMLElement>,
	padding = 28,
	borderWidth = 0
) {
	const [dims, setDims] = useState({ width: 0, height: 0 });

	useLayoutEffect(() => {
		const el = containerRef.current;
		if (!el) return;

		const calculate = () => {
			const { width, height } = el.getBoundingClientRect();
			// 총 오프셋 = 보더 양쪽 + 패딩 양쪽
			const totalOffset = 14;
			setDims({
				width: Math.max(0, width - totalOffset),
				height: Math.max(0, height - totalOffset),
			});
		};

		const resizeObserver = new ResizeObserver(calculate);
		resizeObserver.observe(el);
		calculate();

		return () => resizeObserver.disconnect();
	}, [containerRef, padding, borderWidth]);

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
	const contentRef = useRef(null);
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
				scrollbarColor: `${general.design.widget.borderColor} transparent`,
				scrollbarWidth: "thin",
			}}
		>
			<div ref={contentRef}>{children}</div>
		</div>
	);
});

LayoutPreservingViewer.displayName = "LayoutPreservingViewer";

export default function WidgetNotice() {
	const { main, general } = useSettings();
	const noticeData = main?.notice;
	const containerRef = useRef(null);

	// Slate editor setup memoized
	const editor = useMemo(
		() =>
			withVideo(
				withInlines(withImages(withHistory(withReact(createEditor()))))
			),
		[]
	);

	// 기본값 설정
	const defaultValue = [
		{
			type: "paragraph",
			children: [{ text: "" }],
		},
	];

	// 실제 editorDimensions 데이터가 없으면 렌더링하지 않음
	if (!noticeData?.editorDimensions) {
		return null;
	}

	// 공지사항 내용 파싱
	let noticeContent = defaultValue;
	if (noticeData.noticeContent) {
		try {
			noticeContent =
				typeof noticeData.noticeContent === "string"
					? JSON.parse(noticeData.noticeContent)
					: noticeData.noticeContent;
		} catch (error) {
			console.error("공지사항 내용 파싱 오류:", error);
			noticeContent = defaultValue;
		}
	}

	const editorDimensions = noticeData.editorDimensions;

	// Widget (viewer) dimensions via custom hook
	const widgetDimensions = useContentDimensions(
		containerRef,
		28, // 총 패딩 (좌우 각 14px)
		general?.design.widget.borderWidth
	);

	// 공지사항 내용이 비어있으면 렌더링하지 않음
	const isEmpty = noticeContent.every((block: any) =>
		block.children.every((child: any) => !child.text.trim())
	);
	if (isEmpty) return null;

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
					<Slate
						editor={editor}
						initialValue={noticeContent}
						key={`${JSON.stringify(noticeContent)}-${editorDimensions.width}-${
							editorDimensions.height
						}`}
					>
						<Editable
							readOnly
							renderElement={(props) => <Viewer {...props} />}
							renderLeaf={(props) => <Leaf {...props} />}
							style={{ outline: "none", height: "100%" }}
						/>
					</Slate>
				</LayoutPreservingViewer>
			</div>
		</div>
	);
}
