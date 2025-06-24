import ReactPlayer from "react-player";
import dynamic from "next/dynamic";

const DynamicVideoNode = dynamic(() => import("react-player"), { ssr: false });

const Viewer = ({ attributes, children, element }) => {
	const style = {
		textAlign: element.align || "left",
		fontSize:
			element.type !== "heading-one" && element.type !== "heading-two"
				? element.fontSize
				: undefined,
	};

	const ImageNode = () => {
		return (
			<>
				<div
					className="flex items-center my-1.5"
					{...attributes}
					style={{
						justifyContent: element.align,
					}}
				>
					<div
						className="relative"
						contentEditable={false}
						style={{
							width: element.width || "fit-content", // 기본 너비 설정
							height: element.height || "fit-content", // 기본 높이 설정
						}}
					>
						<img
							className="block w-full h-full object-cover"
							src={element.url}
						/>
					</div>
				</div>
				{children}
			</>
		);
	};

	const Link = () => {
		return (
			<a
				className="cursor-pointer bg-stone-500/15 px-1.5 py-0.5 rounded text-gray-400 select-none underline"
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
					style={{
						...style,
						borderLeft: `4px solid #333`,
						margin: "1.5em 10px",
						padding: "0.5em 10px",
						color: "#9BA2A8",
						fontStyle: "italic",
						background: "#ededed",
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
			return <ImageNode {...attributes} />;
		case "video":
			return (
				<div
					{...attributes}
					style={{
						display: "flex",
						justifyContent: element.align || "left",
					}}
				>
					<div
						className="aspect-video relative"
						style={{
							width: element.width ? `${element.width}px` : "480px",
							height: element.height ? `${element.height}px` : "270px",
							maxWidth: "100%",
						}}
					>
						<DynamicVideoNode
							url={element.url}
							controls
							width="100%"
							height="100%"
						/>
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

export default Viewer;
