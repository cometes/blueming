import "server-only";

/**
 * Firebase Storage 공개 URL(`/v0/b/{bucket}/o/{encoded}?alt=media`)에서
 * storagePath를 복원한다. 다른 호스트/다른 버킷이면 null.
 */
export const storagePathFromUrl = (
	url: string,
	bucketName: string,
): string | null => {
	try {
		const parsed = new URL(url);
		if (parsed.hostname !== "firebasestorage.googleapis.com") return null;
		const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
		if (!match) return null;
		if (match[1] !== bucketName) return null;
		return decodeURIComponent(match[2]);
	} catch {
		return null;
	}
};

const STORAGE_URL_PATTERN =
	/https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"'<>\\)]+/g;

/**
 * 임의 텍스트(본문 JSON·HTML·문서 데이터 stringify 결과)에서 자기 버킷의
 * Storage 경로를 전부 추출한다. JSON/HTML 구조와 무관하게 URL 리터럴을
 * 정규식으로 찾으므로 저장 포맷이 바뀌어도 동작한다.
 */
export const extractStoragePaths = (
	text: string,
	bucketName: string,
): string[] => {
	const paths = new Set<string>();
	for (const match of text.matchAll(STORAGE_URL_PATTERN)) {
		const path = storagePathFromUrl(match[0], bucketName);
		if (path) paths.add(path);
	}
	return Array.from(paths);
};

/** 에디터 본문 이미지가 저장되는 prefix — 이 아래의 파일만 정리 대상 */
export const EDITOR_IMAGE_PREFIX = "library/create/images/";
