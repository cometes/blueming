import "server-only";

export const COLLECTION_NAME = "photoboardPosts";
export const MAX_CAPTION_LENGTH = 2200;
export const MAX_TAGS = 20;
export const MAX_LIMIT = 50;

export const parsePositiveInt = (value: unknown, fallback: number) => {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	if (Number.isNaN(parsed) || parsed <= 0) return fallback;
	return parsed;
};

export const normalizeCaption = (value: unknown) => {
	if (typeof value !== "string") return "";
	return value.trim().slice(0, MAX_CAPTION_LENGTH);
};

export const normalizeTags = (value: unknown) => {
	if (!Array.isArray(value)) return [];
	const tags = value
		.map((tag) => (typeof tag === "string" ? tag.trim() : ""))
		.filter(Boolean)
		.map((tag) => tag.replace(/^#/, ""));
	return Array.from(new Set(tags)).slice(0, MAX_TAGS);
};

export const extractTags = (caption: string) => {
	const matches = caption.match(/#[^\s#]+/g);
	if (!matches) return [];
	return Array.from(new Set(matches.map((tag) => tag.slice(1)))).slice(0, MAX_TAGS);
};

export const formatTimestamp = (value: unknown) => {
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

export type PhotoBoardAuthor = {
	id: string;
	name: string;
	avatarUrl: string;
};

export const toPhotoBoardAuthor = (data: Record<string, unknown>) => {
	const author = data.author as PhotoBoardAuthor | undefined;
	if (author && typeof author.id === "string") {
		return author;
	}
	return {
		id: (data.authorId as string) || "unknown",
		name: (data.authorName as string) || "게스트",
		avatarUrl: (data.authorAvatar as string) || "",
	} satisfies PhotoBoardAuthor;
};
