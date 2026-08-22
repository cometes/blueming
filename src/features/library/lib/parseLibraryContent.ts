import { renderRichText } from "@/shared/lib/richText";

export type ParsedLibraryContent = string | Record<string, unknown> | null;

const isTiptapDoc = (value: unknown) => {
	if (!value || typeof value !== "object") return false;
	const doc = value as { type?: unknown; content?: unknown };
	return doc.type === "doc" && Array.isArray(doc.content);
};

const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const toParagraphHtml = (value: string) => `<p>${escapeHtml(value)}</p>`;

/**
 * 라이브러리 상세의 content 필드를 뷰어가 그릴 수 있는 형태로 정규화한다.
 * - Tiptap JSON 문서(객체 또는 JSON 문자열) → 문서 객체 그대로
 * - HTML 문자열 → 그대로
 * - 일반 텍스트 → 이스케이프 후 <p>로 감싼 HTML
 * - 레거시 리치텍스트 → renderRichText 폴백
 */
export const parseLibraryContent = (
	rawContent: unknown,
): ParsedLibraryContent => {
	if (!rawContent) return null;

	if (typeof rawContent === "string") {
		const trimmed = rawContent.trim();
		if (!trimmed) return "";

		try {
			const parsed = JSON.parse(trimmed);
			if (isTiptapDoc(parsed)) return parsed;

			const fallbackHtml = renderRichText(parsed);
			if (fallbackHtml) return fallbackHtml;
		} catch {
			if (trimmed.startsWith("<")) return trimmed;
			return toParagraphHtml(trimmed);
		}

		return trimmed.startsWith("<") ? trimmed : toParagraphHtml(trimmed);
	}

	if (isTiptapDoc(rawContent)) return rawContent as Record<string, unknown>;

	const fallbackHtml = renderRichText(rawContent);
	return fallbackHtml || null;
};
