// 에디터 이미지 삽입 공통 헬퍼
// - 업로드 노드, 에디터 레벨 드롭/붙여넣기가 함께 사용한다.

const MAX_INSERT_WIDTH = 800;

/** 에디터 내 블록 이동 드래그를 식별하는 커스텀 MIME (dragstart 위치 기록) */
export const BLOCK_MOVE_MIME = "application/x-blueming-block-move";
/** @deprecated BLOCK_MOVE_MIME 사용 (이미지 전용이던 시절의 이름) */
export const IMAGE_MOVE_MIME = BLOCK_MOVE_MIME;

/**
 * 진행 중인 블록 이동 드래그(이미지 본체 드래그·블록 핸들 드래그)의 소스 정보.
 * PM의 view.dragging은 실제 드래그 파이프라인에서 소실될 수 있어(브라우저/확장
 * 개입, NodeView stopEvent 등) 신뢰하지 않고 자체적으로 추적한다.
 * editor는 순환 의존을 피하기 위해 unknown으로 보관.
 *
 * 주의: Chrome은 <img> 드래그 시 dataTransfer.types에 Files를 포함시키므로,
 * "내부 이동인지"의 판별은 types가 아니라 이 싱글턴으로만 해야 한다.
 */
export const blockDragSource: { editor: unknown | null; from: number } = {
	editor: null,
	from: -1,
};

export const setBlockDragSource = (editor: unknown, from: number) => {
	blockDragSource.editor = editor;
	blockDragSource.from = from;
};

export const clearBlockDragSource = () => {
	blockDragSource.editor = null;
	blockDragSource.from = -1;
};

export const IMAGE_URL_PATTERN =
	/^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif|svg)(\?\S*)?$/i;

/** 단독 한 줄 텍스트가 이미지 URL인지 */
export const isImageUrl = (text: string) => IMAGE_URL_PATTERN.test(text.trim());

/** 단독 한 줄 텍스트가 http(s) URL인지 (공백 없는 단일 토큰) */
export const isHttpUrl = (text: string) => /^https?:\/\/\S+$/i.test(text.trim());

/** 유튜브 동영상 URL인지 */
export const isYoutubeUrl = (text: string) =>
	/^https?:\/\/(www\.)?(youtube\.com\/watch\?|youtube\.com\/shorts\/|youtu\.be\/)/i.test(
		text.trim(),
	);

/** 이미지를 실제로 로드해 성공 여부와 natural width를 반환 (5초 타임아웃) */
export const loadImageSize = (
	url: string,
): Promise<{ ok: boolean; width?: number }> =>
	new Promise((resolve) => {
		const img = new Image();
		const timer = setTimeout(() => resolve({ ok: false }), 5000);
		img.onload = () => {
			clearTimeout(timer);
			resolve({ ok: true, width: img.naturalWidth || undefined });
		};
		img.onerror = () => {
			clearTimeout(timer);
			resolve({ ok: false });
		};
		img.src = url;
	});

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
export const resolveImageAttrs = async (
	url: string,
	filename: string,
): Promise<EditorImageAttrs> => {
	const base: EditorImageAttrs = {
		src: url,
		alt: filename,
		title: filename,
		"data-align": "left",
	};
	const size = await loadImageSize(url);
	if (!size.ok) return base;
	return {
		...base,
		width: Math.min(size.width ?? MAX_INSERT_WIDTH, MAX_INSERT_WIDTH),
	};
};
