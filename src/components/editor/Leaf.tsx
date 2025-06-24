export default function Leaf(props) {
	return (
		<span
			{...props.attributes}
			style={{
				fontStyle: props.leaf.italic ? "italic" : "normal", // Italic 적용
				fontWeight: props.leaf.bold ? "bold" : "normal", // Bold 적용
				textDecoration: props.leaf.underline ? "underline" : "none", // Underline 적용
				color: props.leaf.color || "inherit", // Text color 적용 (기본값: 부모 스타일 상속)
				backgroundColor: props.leaf.backgroundColor || "transparent", // 배경색 적용 (기본값: 투명)
				fontSize: props.leaf.fontSize || undefined,
			}}
		>
			{props.children}
		</span>
	);
}
