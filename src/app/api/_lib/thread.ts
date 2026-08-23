import "server-only";
import { getDb } from "@/app/api/_lib/admin";
import {
	formatTimestamp as _formatTimestamp,
	normalizeTags as _normalizeTags,
	normalizeImageUrls as _normalizeImageUrls,
	normalizeString,
	parsePositiveInt as _parsePositiveInt,
} from "@/app/api/_lib/normalizers";

export const COLLECTION_NAME = "threadPosts";
export const MAX_CONTENT_LENGTH = 500;
export const MAX_TAGS = 5;
export const MAX_IMAGE_COUNT = 4;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
/** 상세 타임라인 답글 로드 상한 */
export const TIMELINE_CAP = 300;

export const parsePositiveInt = _parsePositiveInt;
export const formatTimestamp = _formatTimestamp;

export const normalizeContent = (value: unknown) =>
	normalizeString(value, MAX_CONTENT_LENGTH);

export const normalizeTags = (value: unknown) => _normalizeTags(value, MAX_TAGS);

export const normalizeImageUrls = (value: unknown) =>
	_normalizeImageUrls(value, MAX_IMAGE_COUNT);

export type ThreadVisibility = "public" | "member";

export const normalizeVisibility = (value: unknown): ThreadVisibility =>
	value === "member" ? "member" : "public";

// ── 커서 페이징 (순수 함수 — 단위 테스트 대상) ──────────────────────────────

export interface ThreadCursor {
	/** createdAt epoch millis */
	c: number;
	/** 문서 id (동률 타임스탬프 보조 커서) */
	id: string;
}

export const encodeThreadCursor = (cursor: ThreadCursor): string =>
	Buffer.from(JSON.stringify(cursor), "utf-8").toString("base64url");

/** 잘못된/변조된 커서는 null (첫 페이지로 처리) */
export const decodeThreadCursor = (raw: unknown): ThreadCursor | null => {
	if (typeof raw !== "string" || !raw) return null;
	try {
		const parsed = JSON.parse(
			Buffer.from(raw, "base64url").toString("utf-8"),
		) as { c?: unknown; id?: unknown };
		if (
			typeof parsed.c !== "number" ||
			!Number.isFinite(parsed.c) ||
			typeof parsed.id !== "string" ||
			!parsed.id
		) {
			return null;
		}
		return { c: parsed.c, id: parsed.id };
	} catch {
		return null;
	}
};

// ── Firestore 변환 ───────────────────────────────────────────────────────────

export interface ThreadItemView {
	id: string;
	content: string | null;
	author: unknown;
	authorId: string | null;
	mentions: Array<{ uid: string; name: string }>;
	imageUrls: string[];
	youtubeVideoId: string | null;
	parentId: string | null;
	rootId: string | null;
	replyToAuthorName: string | null;
	quoteId: string | null;
	quote: {
		id: string;
		authorId: string | null;
		authorName: string;
		excerpt: string;
		imageUrl: string | null;
		visibility: ThreadVisibility;
	} | null;
	visibility: ThreadVisibility;
	tags: string[];
	replyCount: number;
	quoteCount: number;
	/** member 글을 비회원이 볼 때 true — 본문/이미지/임베드/인용이 null 처리됨 */
	locked: boolean;
	createdAt: string | null;
	updatedAt: string | null;
	/** 커서 계산용 (직렬화 응답에는 포함하되 UI 미사용) */
	createdAtMillis: number;
}

/**
 * 문서 → 응답 항목. member 글 + 비회원 조회면 내용을 서버에서 스트리핑한다
 * (locked 카드 — 작성자·시간만 노출). 클라이언트 필터에 의존하지 않는다.
 */
export const toThreadItem = (
	doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot,
	{ viewerIsMember }: { viewerIsMember: boolean },
): ThreadItemView => {
	const data = (doc.data() || {}) as Record<string, unknown>;
	const visibility = normalizeVisibility(data.visibility);
	const locked = visibility === "member" && !viewerIsMember;
	const createdAtRaw = data.createdAt as
		| { toMillis?: () => number }
		| undefined;
	const quote = (data.quote ?? null) as ThreadItemView["quote"];

	return {
		id: doc.id,
		content: locked ? null : (data.content as string) || "",
		author: data.author || null,
		authorId: (data.authorId as string) || null,
		mentions: locked
			? []
			: Array.isArray(data.mentions)
				? (data.mentions as Array<{ uid: string; name: string }>)
				: [],
		imageUrls: locked
			? []
			: Array.isArray(data.imageUrls)
				? (data.imageUrls as string[])
				: [],
		youtubeVideoId: locked ? null : ((data.youtubeVideoId as string) ?? null),
		parentId: (data.parentId as string) ?? null,
		rootId: (data.rootId as string) ?? null,
		replyToAuthorName: (data.replyToAuthorName as string) ?? null,
		quoteId: locked ? null : ((data.quoteId as string) ?? null),
		quote: locked ? null : quote,
		visibility,
		tags: locked ? [] : Array.isArray(data.tags) ? (data.tags as string[]) : [],
		replyCount: (data.replyCount as number) || 0,
		quoteCount: (data.quoteCount as number) || 0,
		locked,
		createdAt: formatTimestamp(data.createdAt),
		updatedAt: formatTimestamp(data.updatedAt),
		createdAtMillis: createdAtRaw?.toMillis?.() ?? 0,
	};
};

// ── 설정 ────────────────────────────────────────────────────────────────────

export const getThreadsWritePermission = async (
	db: FirebaseFirestore.Firestore,
): Promise<"admin" | "manager" | "member"> => {
	const snapshot = await db.collection("settings").doc("main").get();
	const permission = (
		snapshot.data()?.threads as { writePermission?: string } | undefined
	)?.writePermission;
	if (permission === "admin" || permission === "manager") return permission;
	return "member";
};

export const deleteQueryInBatches = async (
	query: FirebaseFirestore.Query,
) => {
	const db = getDb();
	let snapshot = await query.limit(500).get();
	while (!snapshot.empty) {
		const batch = db.batch();
		snapshot.docs.forEach((doc) => batch.delete(doc.ref));
		await batch.commit();
		snapshot = await query.limit(500).get();
	}
};
