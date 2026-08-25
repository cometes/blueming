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
export const LIKES_COLLECTION = "threadLikes";

/** 좋아요 문서 id — 글당 사용자 1개 보장 */
export const likeDocId = (postId: string, uid: string) => `${postId}_${uid}`;
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
	likeCount: number;
	/** 조회자가 마음에 들어요 했는지 — attachLikedByMe로 부착 */
	likedByMe?: boolean;
	/** member 글을 비회원이 볼 때 true — 본문/이미지/임베드/인용이 null 처리됨 */
	locked: boolean;
	createdAt: string | null;
	updatedAt: string | null;
	/** 커서 계산용 (직렬화 응답에는 포함하되 UI 미사용) */
	createdAtMillis: number;
	/** 피드 타래 미리보기 — 답글 ≤2개면 전부, ≥3개면 마지막 1개 (attachPreviewReplies) */
	previewReplies?: ThreadItemView[];
	/** 미리보기에서 생략된 답글 수 ("더 많은 답글 보기" 표시 조건) */
	hiddenReplyCount?: number;
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
		likeCount: (data.likeCount as number) || 0,
		locked,
		createdAt: formatTimestamp(data.createdAt),
		updatedAt: formatTimestamp(data.updatedAt),
		createdAtMillis: createdAtRaw?.toMillis?.() ?? 0,
	};
};

/**
 * 홈(루트) 피드용 타래 미리보기 부착 — 트위터 타임라인 방식.
 * 루트+답글 총 3개까지는 전부 연결 표시, 그 이상은 루트+마지막 답글만 남기고
 * 사이를 "더 많은 답글 보기"로 접는다. 페이지의 루트들을 rootId `in` 쿼리
 * (30개 청크)로 한 번에 조회 — rootId ASC + createdAt ASC 복합 인덱스 사용.
 */
export const attachPreviewReplies = async (
	db: FirebaseFirestore.Firestore,
	items: ThreadItemView[],
	{ viewerIsMember }: { viewerIsMember: boolean },
): Promise<ThreadItemView[]> => {
	const targetIds = items
		.filter((item) => !item.parentId && item.replyCount > 0)
		.map((item) => item.id);
	if (targetIds.length === 0) return items;

	const chunks: string[][] = [];
	for (let i = 0; i < targetIds.length; i += 30) {
		chunks.push(targetIds.slice(i, i + 30));
	}
	const snapshots = await Promise.all(
		chunks.map((ids) =>
			db
				.collection(COLLECTION_NAME)
				.where("rootId", "in", ids)
				.orderBy("createdAt", "asc")
				.get(),
		),
	);

	const repliesByRoot = new Map<string, ThreadItemView[]>();
	for (const snapshot of snapshots) {
		for (const doc of snapshot.docs) {
			const rootId = (doc.get("rootId") as string) || "";
			if (!rootId) continue;
			const list = repliesByRoot.get(rootId) ?? [];
			list.push(toThreadItem(doc, { viewerIsMember }));
			repliesByRoot.set(rootId, list);
		}
	}

	return items.map((item) => {
		const replies = repliesByRoot.get(item.id);
		if (!replies || replies.length === 0) return item;
		const preview =
			replies.length <= 2 ? replies : [replies[replies.length - 1]];
		return {
			...item,
			previewReplies: preview,
			hiddenReplyCount: replies.length - preview.length,
		};
	});
};

/**
 * 조회자의 마음에 들어요 여부 부착 — threadLikes/{postId_uid} 문서 존재 여부를
 * getAll(문서 직접 조회)로 일괄 확인. previewReplies 항목도 함께 처리한다.
 * uid가 없으면(비로그인) 그대로 반환.
 */
export const attachLikedByMe = async (
	db: FirebaseFirestore.Firestore,
	items: ThreadItemView[],
	uid: string | null,
): Promise<ThreadItemView[]> => {
	if (!uid || items.length === 0) return items;

	const postIds = new Set<string>();
	for (const item of items) {
		postIds.add(item.id);
		for (const reply of item.previewReplies ?? []) {
			postIds.add(reply.id);
		}
	}
	const ids = [...postIds];
	const refs = ids.map((id) =>
		db.collection(LIKES_COLLECTION).doc(likeDocId(id, uid)),
	);
	const snapshots = await db.getAll(...refs);
	const liked = new Set<string>();
	snapshots.forEach((snapshot, index) => {
		if (snapshot.exists) liked.add(ids[index]);
	});

	return items.map((item) => ({
		...item,
		likedByMe: liked.has(item.id),
		previewReplies: item.previewReplies?.map((reply) => ({
			...reply,
			likedByMe: liked.has(reply.id),
		})),
	}));
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
