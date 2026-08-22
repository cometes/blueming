// 에디터 이미지 삽입 공통 헬퍼
// - 업로드 노드, 에디터 레벨 드롭/붙여넣기가 함께 사용한다.

const MAX_INSERT_WIDTH = 800;

export const IMAGE_URL_PATTERN =
	/^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif|svg)(\?\S*)?$/i;

/** 단독 한 줄 텍스트가 이미지 URL인지 */
export const isImageUrl = (text: string) => IMAGE_URL_PATTERN.test(text.trim());

/** URL 마지막 세그먼트에서 확장자를 뗀 파일명 (실패 시 "이미지") */
export const filenameFromUrl = (url: string) => {
	try {
		const last = url.split("?")[0].split("#")[0].split("/").pop() ?? "";
		const name = decodeURIComponent(last).replace(/\.[^/.]+$/, "").trim();
		return name || "이미지";
	} catch {
		return "이미지";
	}
};

export interface EditorImageAttrs {
	src: string;
	alt: string;
	title: string;
	width?: number;
	"data-align": "left";
}

/**
 * 이미지를 미리 로드해 natural 크기 기반 width(최대 800px)를 계산한 attrs를 반환.
 * 로드 실패 시 width 없이 반환한다 (삽입 자체는 항상 성공).
 */
export const resolveImageAttrs = (
	url: string,
	filename: string,
): Promise<EditorImageAttrs> => {
	const base: EditorImageAttrs = {
		src: url,
		alt: filename,
		title: filename,
		"data-align": "left",
	};
	return new Promise((resolve) => {
		const img = new Image();
		const timer = setTimeout(() => resolve(base), 5000);
		img.onload = () => {
			clearTimeout(timer);
			resolve({
				...base,
				width: Math.min(img.naturalWidth || MAX_INSERT_WIDTH, MAX_INSERT_WIDTH),
			});
		};
		img.onerror = () => {
			clearTimeout(timer);
			resolve(base);
		};
		img.src = url;
	});
};
