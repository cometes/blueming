import { useState, useCallback, useMemo } from "react";
import { useSlate, ReactEditor, useSelected, useFocused } from "slate-react";
import { Transforms } from "slate";
import ReactPlayer from "react-player";
import { X, Link as LinkIcon, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

const Element = ({ attributes, children, element }) => {
	const editor = useSlate();

	const style = {
		textAlign: element.align || "left",
		fontSize:
			element.type !== "heading-one" && element.type !== "heading-two"
				? element.fontSize
				: undefined,
	};

	const ImageNode = () => {
		const path = ReactEditor.findPath(editor, element);
		const selected = useSelected();
		const focused = useFocused();
		const [isResizing, setIsResizing] = useState(false);

		// 이미지 클릭 핸들러
		const handleImageClick = (event) => {
			event.preventDefault();
			event.stopPropagation();
			Transforms.select(editor, path);
		};

		// CSS 리사이징 핸들러
		const handleMouseDown = useCallback(
			(e) => {
				e.preventDefault();
				e.stopPropagation();

				const container = e.currentTarget.parentElement;
				if (!container) return;

				const startX = e.clientX;
				const startY = e.clientY;
				const startWidth =
					parseInt(container.style.width) || element.width || 400;
				const startHeight =
					parseInt(container.style.height) || element.height || 300;

				setIsResizing(true);

				const handleMouseMove = (moveEvent) => {
					const deltaX = moveEvent.clientX - startX;
					const deltaY = moveEvent.clientY - startY;

					const newWidth = Math.max(100, startWidth + deltaX);
					const newHeight = Math.max(75, startHeight + deltaY);

					container.style.width = `${newWidth}px`;
					container.style.height = `${newHeight}px`;
				};

				const handleMouseUp = () => {
					setIsResizing(false);
					const finalWidth = parseInt(container.style.width);
					const finalHeight = parseInt(container.style.height);

					// Slate 노드에 새 크기 저장
					Transforms.setNodes(
						editor,
						{ width: finalWidth, height: finalHeight },
						{ at: path }
					);

					document.removeEventListener("mousemove", handleMouseMove);
					document.removeEventListener("mouseup", handleMouseUp);
				};

				document.addEventListener("mousemove", handleMouseMove);
				document.addEventListener("mouseup", handleMouseUp);
			},
			[editor, path, element.width, element.height]
		);

		// 공통 클릭 방지 핸들러
		const preventClick = (event) => {
			event.preventDefault();
			event.stopPropagation();
			ReactEditor.focus(editor);
			if (selected) {
				Transforms.deselect(editor);
			}
		};

		return (
			<>
				<div
					className="ImageWrap flex items-center my-1.5"
					{...attributes}
					style={{
						justifyContent: element.align,
					}}
					onMouseDown={preventClick}
					onClick={preventClick}
				>
					<div className="ImageBox relative" contentEditable={false}>
						<div
							className={cn(
								"relative",
								isResizing ? "cursor-se-resize" : "cursor-default",
								`w-[${element.width || 400}px] h-[${element.height || 300}px]`
							)}
						>
							<img
								alt="이미지"
								src={element.url}
								onClick={handleImageClick}
								className={cn(
									"Image w-full h-full object-cover",
									selected && focused
										? "shadow-[0_0_0_3px] shadow-theme-primary"
										: ""
								)}
							/>

							{/* 리사이즈 핸들 */}
							{selected && focused && (
								<div
									style={{
										position: "absolute",
										bottom: "-2px",
										right: "-2px",
										width: "12px",
										height: "12px",
										backgroundColor: "#B4D5FF",
										cursor: "se-resize",
										borderRadius: "2px",
										border: "1px solid #fff",
										zIndex: 10,
									}}
									onMouseDown={handleMouseDown}
								/>
							)}
						</div>

						{selected && focused && (
							<button
								className="DeleteButton m-auto bg-gray-500 text-gray-200 border-0 p-2 w-8 h-8 cursor-pointer rounded-full absolute t-2 r-2 z-30"
								onMouseDown={(event) => {
									event.preventDefault();
									Transforms.removeNodes(editor, { at: path });
									ReactEditor.focus(editor);
								}}
							>
								<X size={16} />
							</button>
						)}
					</div>
				</div>
				{children}
			</>
		);
	};

	const Link = () => {
		const [isEditActive, setIsEditActive] = useState(false);
		const [newUrl, setNewUrl] = useState(element.url); // URL 상태 관리
		const selected = useSelected();
		const focused = useFocused();
		const path = ReactEditor.findPath(editor, element); // 현재 노드의 경로 찾기

		const preventBlur = (event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();

			// 에디터 포커스를 유지
			ReactEditor.focus(editor);
		};

		const content = (
			<div className="LinkBox bg-gray-900 flex items-center">
				<LinkIcon size={14} className="text-gray-300" />
				<p className="LinkUrl text-gray-300 pl-1">{element.url}</p>
				<button
					className="LinkEdit border-0 bg-none cursor-pointer ml-2.5"
					onClick={() => {
						setIsEditActive(true); // URL 편집 활성화
					}}
				>
					편집
				</button>
			</div>
		);

		const edit = (
			<div className="ImageInsertWrap w-[300px] min-h-[180px] p-2.5 bg-white flex flex-col justify-between">
				<div>
					<div className="ImageInsertBox last-of-type:mt-2.5">
						<p className="ImageInsertText font-semibold">URL</p>
						<Input
							className="ImageUrlInput"
							placeholder="Enter URL"
							value={newUrl}
							onChange={(e) => setNewUrl(e.target.value)} // URL 상태 업데이트
						/>
					</div>
				</div>
				<div className="ImageInsertButtonWrap flex justify-end mt-3.5">
					<Button
						className="ml-1.5"
						onClick={() => {
							setNewUrl(element.url); // 변경 취소 시 원래 URL 복원
							setIsEditActive(false);
						}}
					>
						취소하기
					</Button>
					<Button
						content="수정하기"
						className="bg-primary text-white"
						onClick={() => {
							preventBlur;
							Transforms.setNodes(
								editor,
								{ url: newUrl }, // 새로운 URL로 노드 업데이트
								{ at: path }
							);
							setIsEditActive(false); // 편집 모드 비활성화
						}}
					/>
				</div>
			</div>
		);

		return (
			<Popover
				content={isEditActive ? edit : content}
				overlayInnerStyle={{
					background: isEditActive ? "#fff" : "#252525",
					padding: "4px 6px",
					width: "fit-content",
				}}
			>
				<PopoverTrigger>Open</PopoverTrigger>
				<PopoverContent></PopoverContent>
				<a
					className={cn(
						"Link cursor-pointer bg-[rgba(135, 131, 120, 0.15)] py-0.5 px-1.5 rounded-md text-sub-text select-none underline",
						selected && focused ? "shadow-[0_0_0_3px] shadow-theme-primary" : ""
					)}
					{...attributes}
					href={element.url}
					target="_blank"
					rel="noopener noreferrer"
					contentEditable={false}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						window.open(element.url, "_blank"); // 새 창으로 열기
					}}
				>
					{children}
				</a>
			</Popover>
		);
	};

	switch (element.type) {
		case "heading-one":
			return (
				<h1 {...attributes} style={style}>
					{children}
				</h1>
			);
		case "heading-two":
			return (
				<h2 {...attributes} style={style}>
					{children}
				</h2>
			);
		case "bulleted-list":
			return (
				<ul {...attributes} style={style}>
					{children}
				</ul>
			);
		case "list-item":
			return (
				<li {...attributes} style={style}>
					{children}
				</li>
			);
		case "quote": // 인용구 케이스
			return (
				<blockquote
					{...attributes}
					data-quote-style={element.quoteStyle || "classic"}
					style={{
						...style,
					}}
				>
					{children}
				</blockquote>
			);
		case "code": // 코드 케이스
			return (
				<pre {...attributes}>
					<code>{children}</code>
				</pre>
			);
		case "button":
			return <Link />;
		case "image":
			return <ImageNode />;
		case "video":
			const [isHovered, setIsHovered] = useState(false);
			const [isResizing, setIsResizing] = useState(false);

			const path = ReactEditor.findPath(editor, element);
			const selected = useSelected();
			const focused = useFocused();

			// YouTube URL에서 비디오 ID 추출
			const getYouTubeVideoId = useCallback((url) => {
				const match = url.match(
					/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
				);
				return match ? match[1] : null;
			}, []);

			// YouTube 썸네일 URL 생성
			const thumbnailUrl = useMemo(() => {
				const videoId = getYouTubeVideoId(element.url);
				return videoId
					? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
					: null;
			}, [element.url, getYouTubeVideoId]);

			// CSS 리사이징 핸들러
			const handleMouseDown = useCallback(
				(e) => {
					e.preventDefault();
					e.stopPropagation();

					const container = e.currentTarget.parentElement;
					if (!container) return;

					const startX = e.clientX;
					const startWidth =
						parseInt(container.style.width) || element.width || 480;

					setIsResizing(true);

					const handleMouseMove = (moveEvent) => {
						const deltaX = moveEvent.clientX - startX;
						const newWidth = Math.max(200, startWidth + deltaX);
						const newHeight = (newWidth * 9) / 16; // 16:9 비율 유지

						container.style.width = `${newWidth}px`;
						container.style.height = `${newHeight}px`;
					};

					const handleMouseUp = () => {
						setIsResizing(false);
						const finalWidth = parseInt(container.style.width);
						const finalHeight = parseInt(container.style.height);

						// Slate 노드에 새 크기 저장
						Transforms.setNodes(
							editor,
							{ width: finalWidth, height: finalHeight },
							{ at: path }
						);

						document.removeEventListener("mousemove", handleMouseMove);
						document.removeEventListener("mouseup", handleMouseUp);
					};

					document.addEventListener("mousemove", handleMouseMove);
					document.addEventListener("mouseup", handleMouseUp);
				},
				[editor, path, element.width]
			);

			// 비디오 클릭 핸들러
			const handleVideoClick = useCallback(
				(event) => {
					event.preventDefault();
					event.stopPropagation();
					Transforms.select(editor, path);
				},
				[editor, path]
			);

			return (
				<div
					{...attributes}
					style={{
						display: "flex",
						justifyContent: element.align || "left",
					}}
					onMouseDown={(event) => {
						event.preventDefault();
					}}
					onClick={(event) => {
						event.preventDefault();
					}}
				>
					<div contentEditable={false}>
						<div
							style={{
								position: "relative",
								width: element.width || 480,
								height: element.height || 270,
								cursor: isResizing ? "se-resize" : "pointer",
								borderRadius: "4px",
								overflow: "hidden",
							}}
							onClick={handleVideoClick}
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
						>
							<div
								className={cn(
									"VideoBox aspect-video relative w-full h-full",
									selected && focused
										? "shadow-[0_0_0_3px] shadow-theme-primary"
										: ""
								)}
							>
								{/* 에디터에서는 썸네일만 표시 */}
								{thumbnailUrl ? (
									<>
										<img
											src={thumbnailUrl}
											alt="Video thumbnail"
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
												display: "block",
											}}
											draggable={false}
										/>
										{/* 재생 버튼 아이콘 */}
										<div
											style={{
												position: "absolute",
												top: "50%",
												left: "50%",
												transform: "translate(-50%, -50%)",
												backgroundColor: "rgba(0, 0, 0, 0.7)",
												borderRadius: "50%",
												width: "60px",
												height: "60px",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												opacity: isHovered ? 1 : 0.8,
												transition: "opacity 0.2s ease",
												pointerEvents: "none",
											}}
										>
											<Play size={24} color="white" fill="white" />
										</div>
									</>
								) : (
									/* YouTube 썸네일을 가져올 수 없는 경우 ReactPlayer 사용 */
									<ReactPlayer
										url={element.url}
										light={true}
										playing={false}
										controls={false}
										width="100%"
										height="100%"
									/>
								)}
							</div>

							{/* 리사이즈 핸들 */}
							{selected && focused && (
								<>
									<div
										style={{
											position: "absolute",
											bottom: "-2px",
											right: "-2px",
											width: "12px",
											height: "12px",
											backgroundColor: "#B4D5FF",
											cursor: "se-resize",
											borderRadius: "2px",
											border: "1px solid #fff",
											zIndex: 10,
										}}
										onMouseDown={handleMouseDown}
									/>
									<div
										style={{
											position: "absolute",
											top: "5px",
											right: "5px",
											backgroundColor: "rgba(255, 255, 255, 0.8)",
											borderRadius: "50%",
											width: "24px",
											height: "24px",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											cursor: "pointer",
											zIndex: 10,
										}}
										onMouseDown={(event) => {
											event.preventDefault();
											Transforms.removeNodes(editor, { at: path });
											ReactEditor.focus(editor);
										}}
									>
										<X size={14} color="#666" />
									</div>
								</>
							)}
						</div>
					</div>
					{children}
				</div>
			);
		case "paragraph":
		default:
			return (
				<p {...attributes} style={style}>
					{children}
				</p>
			);
	}
};

export default Element;
