import "server-only";
import {
	parsePositiveInt as _parsePositiveInt,
	formatTimestamp as _formatTimestamp,
	normalizeTags as _normalizeTags,
	normalizeString,
} from "@/app/api/_lib/normalizers";

export const COLLECTION_NAME = "photoboardPosts";
export const MAX_CAPTION_LENGTH = 2200;
export const MAX_TAGS = 20;
export const MAX_LIMIT = 50;

// ── 공통 유틸 re-export (기존 import 경로 호환 유지) ────────────────────────
export const parsePositiveInt = (value: unknown, fallback: number) =>
	_parsePositiveInt(value, fallback);

export const formatTimestamp = (value: unknown) => _formatTimestamp(value);

// ── feature 전용 정규화 ───────────────────────────────────────────────────────
export const normalizeCaption = (value: unknown) =>
	normalizeString(value, MAX_CAPTION_LENGTH);

export const normalizeTags = (value: unknown) =>
	_normalizeTags(value, MAX_TAGS);

export const extractTags = (caption: string) => {
	const matches = caption.match(/#[^\s#]+/g);
	if (!matches) return [];
	return Array.from(new Set(matches.map((tag) => tag.slice(1)))).slice(0, MAX_TAGS);
};

// ── 타입 및 Firestore 변환 ────────────────────────────────────────────────────
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
