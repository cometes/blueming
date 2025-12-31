import { ImageOff } from "lucide-react";

/**
 * 이미지가 없을 때 표시하는 Fallback 컴포넌트
 */
export default function Fallback() {
	return (
		<div className="w-full h-full flex items-center justify-center bg-card border-card">
			<ImageOff className="w-8 h-8 text-sub-text" />
		</div>
	);
}
