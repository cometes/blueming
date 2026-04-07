import "server-only";
import {
	parsePositiveInt as _parsePositiveInt,
	formatTimestamp as _formatTimestamp,
	normalizeTags as _normalizeTags,
	normalizeString,
} from "@/app/api/_lib/normalizers";

export const COLLECTION_NAME = "gallery";
export const MAX_TITLE_LENGTH = 120;
export const MAX_TAGS = 20;
export const MAX_LIMIT = 50;

// ── 공통 유틸 re-export (기존 import 경로 호환 유지) ────────────────────────
export const parsePositiveInt = (value: unknown, fallback: number) =>
	_parsePositiveInt(value, fallback);

export const formatTimestamp = (value: unknown) => _formatTimestamp(value);

// ── feature 전용 정규화 ───────────────────────────────────────────────────────
export const normalizeTitle = (value: unknown) =>
	normalizeString(value, MAX_TITLE_LENGTH);

export const normalizeCategory = (value: unknown) => {
	if (typeof value !== "string") return "";
	return value.trim();
};

export const normalizeDescription = (value: unknown) => {
	if (typeof value !== "string") return "";
	return value.trim();
};

export const normalizeTags = (value: unknown) =>
	_normalizeTags(value, MAX_TAGS);

// ── 타입 및 Firestore 변환 ────────────────────────────────────────────────────
export type GalleryAuthor = {
	id: string;
	name: string;
	avatarUrl: string;
};

export const toGalleryAuthor = (data: Record<string, unknown>) => {
	const author = data.author as GalleryAuthor | undefined;
	if (author && typeof author.id === "string") {
		return author;
	}
	return {
		id: (data.authorId as string) || "unknown",
		name: (data.authorName as string) || "게스트",
		avatarUrl: (data.authorAvatar as string) || "",
	} satisfies GalleryAuthor;
};
