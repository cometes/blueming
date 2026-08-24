import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { FieldPath } from "firebase-admin/firestore";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext, requireAuth } from "@/app/api/_lib/auth";
import { buildRateLimitKey, checkRateLimit } from "@/app/api/_lib/rateLimit";
import {
	COLLECTION_NAME,
	DEFAULT_LIMIT,
	MAX_LIMIT,
	attachPreviewReplies,
	decodeThreadCursor,
	encodeThreadCursor,
	getThreadsWritePermission,
	normalizeContent,
	normalizeImageUrls,
	normalizeTags,
	normalizeVisibility,
	parsePositiveInt,
	toThreadItem,
} from "@/app/api/_lib/thread";
import { extractFirstYouTubeVideoIdFromContent } from "@/shared/lib/youtube";
import {
	actorFromAuth,
	emitNotification,
	getAdminRecipientUids,
} from "@/app/api/_lib/notifications";
import {
	emitMentionNotifications,
	validateMentions,
} from "@/app/api/_lib/mentions";

export const runtime = "nodejs";

type ThreadTab = "all" | "roots" | "mine" | "tag";

const parseTab = (value: string | null): ThreadTab => {
	if (value === "roots" || value === "mine" || value === "tag") return value;
	return "all";
};

/**
 * GET /api/thread?tab=all|roots|mine|tag&tag=&cursor=&limit=
 * 커서 페이징: createdAt desc + __name__ desc 보조 정렬 (동률 타임스탬프 대비).
 * member 글은 서버에서 스트리핑(toThreadItem) — 비회원에겐 잠금 카드용 골격만.
 */
export async function GET(req: NextRequest) {
	try {
		const params = req.nextUrl.searchParams;
		const tab = parseTab(params.get("tab"));
		const tag = (params.get("tag") || "").trim();
		const limit = Math.min(
			parsePositiveInt(params.get("limit"), DEFAULT_LIMIT),
			MAX_LIMIT,
		);
		const cursor = decodeThreadCursor(params.get("cursor"));

		const auth = await getAuthContext();
		if (tab === "mine" && !auth) {
			return jsonError(401, "로그인이 필요합니다.");
		}
		const viewerIsMember = Boolean(auth);

		const db = getDb();
		let query: FirebaseFirestore.Query = db.collection(COLLECTION_NAME);
		if (tab === "roots") {
			query = query.where("parentId", "==", null);
		} else if (tab === "mine" && auth) {
			query = query.where("authorId", "==", auth.uid);
		} else if (tab === "tag") {
			if (!tag) return jsonOk({ items: [], nextCursor: null });
			query = query.where("tags", "array-contains", tag);
		}

		query = query
			.orderBy("createdAt", "desc")
			.orderBy(FieldPath.documentId(), "desc");
		if (cursor) {
			query = query.startAfter(
				admin.firestore.Timestamp.fromMillis(cursor.c),
				cursor.id,
			);
		}

		const snapshot = await query.limit(limit + 1).get();
		const docs = snapshot.docs.slice(0, limit);
		let items = docs.map((doc) => toThreadItem(doc, { viewerIsMember }));
		if (tab === "roots") {
			// 홈 탭은 트위터식 타래 미리보기 부착
			items = await attachPreviewReplies(db, items, { viewerIsMember });
		}
		const last = docs[docs.length - 1];
		const nextCursor =
			snapshot.docs.length > limit && last
				? encodeThreadCursor({
						c:
							(last.get("createdAt") as { toMillis?: () => number } | undefined)
								?.toMillis?.() ?? 0,
						id: last.id,
					})
				: null;

		return jsonOk({ items, nextCursor });
	} catch (error) {
		// 복합 인덱스 미배포 시 명확한 안내
		if ((error as { code?: number })?.code === 9) {
			console.error("Thread list index missing:", error);
			return jsonError(
				500,
				"Firestore 인덱스가 아직 준비되지 않았습니다. firestore.indexes.json을 배포해주세요.",
			);
		}
		console.error("Error fetching thread list:", error);
		return jsonError(500, "스레드를 불러오지 못했습니다.");
	}
}

/**
 * POST /api/thread — 루트/답글 겸용 (인용은 PR3에서 quoteId 처리 확장 예정).
 * 답글: parentId → rootId 상속, visibility 루트 강제, 루트 replyCount 트랜잭션 증가.
 */
export async function POST(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const db = getDb();

		// 작성 권한 (기본 member = 활성 회원 누구나)
		const writePermission = await getThreadsWritePermission(db);
		const canWrite =
			writePermission === "member"
				? true
				: writePermission === "manager"
					? auth.auth.role === "manager" || auth.auth.role === "admin"
					: auth.auth.isAdmin === true;
		if (!canWrite) {
			return jsonError(403, "작성 권한이 없습니다.");
		}

		if (!auth.auth.isAdmin) {
			const key = buildRateLimitKey(auth.auth, req, "thread");
			const rateLimit = await checkRateLimit(key, {
				collection: "threadRateLimits",
				cooldownMs: 5_000,
				minuteLimit: 10,
				hourLimit: 50,
			});
			if (rateLimit.ok === false) {
				const retryAfter = Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000));
				const message =
					rateLimit.reason === "cooldown"
						? `잠시 후 다시 시도해주세요. (${retryAfter}초)`
						: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.";
				return jsonError(429, message, { retryAfter });
			}
		}

		const body = await req.json();
		const content = normalizeContent(body?.content);
		const imageUrls = normalizeImageUrls(body?.imageUrls);
		// 이미지만 있는 글 허용 — 내용과 이미지 둘 다 없을 때만 거부
		if (!content && imageUrls.length === 0) {
			return jsonError(400, "내용 또는 이미지를 입력해주세요.");
		}
		const tags = normalizeTags(body?.tags);
		let visibility = normalizeVisibility(body?.visibility);
		const parentId =
			typeof body?.parentId === "string" && body.parentId ? body.parentId : null;
		const quoteId =
			typeof body?.quoteId === "string" && body.quoteId ? body.quoteId : null;
		if (parentId && quoteId) {
			return jsonError(400, "답글과 인용은 동시에 지정할 수 없습니다.");
		}
		const mentions = await validateMentions(body?.mentions, content);
		const youtubeVideoId = extractFirstYouTubeVideoIdFromContent(content);

		// 답글: 부모 확인 + rootId/visibility 상속 + 라벨 스냅샷
		let rootId: string | null = null;
		let replyToAuthorName: string | null = null;
		let rootAuthorId: string | null = null;
		if (parentId) {
			const parentSnapshot = await db
				.collection(COLLECTION_NAME)
				.doc(parentId)
				.get();
			if (!parentSnapshot.exists) {
				return jsonError(404, "답글 대상 글을 찾을 수 없습니다.");
			}
			const parent = parentSnapshot.data() || {};
			const resolvedRootId = (parent.rootId as string) || parentId;
			rootId = resolvedRootId;
			replyToAuthorName =
				((parent.author as { name?: string } | undefined)?.name ?? null) || null;
			// 답글 공개범위는 루트를 강제 상속 (전체 탭 유출 방지)
			const rootSnapshot =
				resolvedRootId === parentId
					? parentSnapshot
					: await db.collection(COLLECTION_NAME).doc(resolvedRootId).get();
			const root = rootSnapshot.data() || {};
			visibility = normalizeVisibility(root.visibility);
			rootAuthorId = (parent.authorId as string) || null;
		}

		// 인용: 원본 스냅샷 생성 (원본 삭제 후에도 카드 표시용)
		let quote: {
			id: string;
			authorId: string | null;
			authorName: string;
			excerpt: string;
			imageUrl: string | null;
			visibility: "public" | "member";
		} | null = null;
		let quoteAuthorId: string | null = null;
		if (quoteId) {
			const quotedSnapshot = await db
				.collection(COLLECTION_NAME)
				.doc(quoteId)
				.get();
			if (!quotedSnapshot.exists) {
				return jsonError(404, "인용할 글을 찾을 수 없습니다.");
			}
			const quoted = quotedSnapshot.data() || {};
			const quotedVisibility = normalizeVisibility(quoted.visibility);
			quote = {
				id: quoteId,
				authorId: (quoted.authorId as string) ?? null,
				authorName:
					((quoted.author as { name?: string } | undefined)?.name ?? "") ||
					"사용자",
				excerpt: String(quoted.content ?? "").slice(0, 80),
				imageUrl: Array.isArray(quoted.imageUrls)
					? ((quoted.imageUrls as string[])[0] ?? null)
					: null,
				visibility: quotedVisibility,
			};
			quoteAuthorId = quote.authorId;
			// member 글 인용 시 새 글도 member 강제 (발췌 유출 방지)
			if (quotedVisibility === "member") {
				visibility = "member";
			}
		}

		const payload = {
			content,
			authorId: auth.auth.uid,
			author: {
				id: auth.auth.uid,
				name: auth.auth.displayName || "사용자",
				avatarUrl: auth.auth.photoURL || "",
			},
			mentions,
			imageUrls,
			youtubeVideoId: youtubeVideoId ?? null,
			parentId,
			rootId,
			replyToAuthorName,
			quoteId,
			quote,
			visibility,
			tags,
			replyCount: 0,
			quoteCount: 0,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		};

		const newRef = db.collection(COLLECTION_NAME).doc();
		if (quoteId) {
			// 생성 + 원본 quoteCount 증가를 한 트랜잭션으로
			const quotedRef = db.collection(COLLECTION_NAME).doc(quoteId);
			await db.runTransaction(async (tx) => {
				tx.set(newRef, payload);
				tx.update(quotedRef, {
					quoteCount: admin.firestore.FieldValue.increment(1),
				});
			});
		} else if (rootId) {
			// 생성 + 루트 replyCount 증가를 한 트랜잭션으로 (카운터 정합)
			const rootRef = db.collection(COLLECTION_NAME).doc(rootId);
			await db.runTransaction(async (tx) => {
				tx.set(newRef, payload);
				tx.update(rootRef, {
					replyCount: admin.firestore.FieldValue.increment(1),
				});
			});
		} else {
			await newRef.set(payload);
		}

		// 알림 — 멘션 우선 dedupe, awaited(서버리스 freeze), 실패 비치명
		try {
			const actor = actorFromAuth(auth.auth);
			const link = `/thread/${rootId ?? newRef.id}`;
			const mentioned = await emitMentionNotifications({
				actor,
				mentions,
				excerpt: content,
				link,
			});
			if (parentId) {
				await emitNotification({
					actor,
					recipients: [
						...(await getAdminRecipientUids()),
						rootAuthorId,
					].filter((uid) => !uid || !mentioned.includes(uid)),
					type: "threadReply",
					category: "comment",
					message: `${actor.name}님이 스레드에 답글을 남겼습니다`,
					excerpt: content,
					link,
				});
			} else if (quoteId) {
				await emitNotification({
					actor,
					recipients: [
						...(await getAdminRecipientUids()),
						quoteAuthorId,
					].filter((uid) => !uid || !mentioned.includes(uid)),
					type: "threadQuote",
					category: "activity",
					message: `${actor.name}님이 회원님의 글을 인용했습니다`,
					excerpt: visibility === "member" ? "멤버 공개 게시글입니다." : content,
					link: `/thread/${newRef.id}`,
				});
			} else {
				await emitNotification({
					actor,
					recipients: (await getAdminRecipientUids()).filter(
						(uid) => !mentioned.includes(uid),
					),
					type: "thread",
					category: "activity",
					message: `${actor.name}님이 스레드를 작성했습니다`,
					excerpt: visibility === "member" ? "멤버 공개 게시글입니다." : content,
					link,
				});
			}
		} catch (notifyError) {
			console.error("Error emitting thread notification:", notifyError);
		}

		const snapshot = await newRef.get();
		return jsonOk(toThreadItem(snapshot, { viewerIsMember: true }), {
			status: 201,
		});
	} catch (error) {
		console.error("Error creating thread post:", error);
		return jsonError(500, "글을 저장하지 못했습니다.");
	}
}
