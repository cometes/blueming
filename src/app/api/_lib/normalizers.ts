import "server-only";

const ALLOWED_PROTOCOLS = ["http:", "https:"];

/**
 * 양의 정수 파싱. 실패 시 fallback 반환.
 */
export const parsePositiveInt = (value: unknown, fallback: number): number => {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	if (Number.isNaN(parsed) || parsed <= 0) return fallback;
	return parsed;
};

/**
 * Firebase Timestamp / Date → ISO 문자열.
 * 변환 불가 시 null 반환.
 */
export const formatTimestamp = (value: unknown): string | null => {
	if (!value) return null;
	if (typeof (value as { toDate?: () => Date }).toDate === "function") {
		const date = (value as { toDate: () => Date }).toDate();
		return Number.isNaN(date.getTime()) ? null : date.toISOString();
	}
	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value.toISOString();
	}
	return null;
};

/**
 * boolean 정규화. true 이외의 값은 전부 false.
 */
export const normalizeBoolean = (value: unknown): boolean => value === true;

/**
 * 문자열 정규화. 공백 제거 + 최대 길이 제한.
 */
export const normalizeString = (value: unknown, maxLength: number): string => {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, maxLength);
};

/**
 * 태그 배열 정규화.
 * - 공백 제거, 앞 '#' 제거, 중복 제거
 * - maxTags 개수 제한
 */
export const normalizeTags = (value: unknown, maxTags: number): string[] => {
	if (!Array.isArray(value)) return [];
	const tags = value
		.map((tag) => (typeof tag === "string" ? tag.trim() : ""))
		.filter(Boolean)
		.map((tag) => tag.replace(/^#/, ""));
	return Array.from(new Set(tags)).slice(0, maxTags);
};

/**
 * 이미지 URL 배열 정규화.
 * - http / https 프로토콜만 허용
 * - 중복 제거
 * - maxCount 개수 제한
 */
export const normalizeImageUrls = (value: unknown, maxCount: number): string[] => {
	if (!Array.isArray(value)) return [];
	const urls = value
		.map((item) => {
			if (typeof item !== "string") return "";
			try {
				const parsed = new URL(item);
				return ALLOWED_PROTOCOLS.includes(parsed.protocol) ? item : "";
			} catch {
				return "";
			}
		})
		.filter((url) => url.length > 0);
	return Array.from(new Set(urls)).slice(0, maxCount);
};
