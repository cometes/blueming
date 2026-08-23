import "server-only";
import admin from "firebase-admin";
import { getDb } from "./admin";
import type { AuthContext } from "./auth";

export type NotificationType =
	| "comment"
	| "guestbook"
	| "memo"
	| "memoReply"
	| "photoboard"
	| "gallery"
	| "libraryPost"
	| "mention";

/** 알림 패널 탭 매핑: 전체 = 모두, 댓글 = comment, 멘션 = mention */
export type NotificationCategory = "comment" | "mention" | "activity";

export interface NotificationActor {
	uid: string | null;
	name: string;
	avatarUrl: string;
	anon: boolean;
}

/** 수신자당 보관 상한 — 초과분은 오래된 것부터 삭제 */
const MAX_NOTIFICATIONS_PER_USER = 100;
const EXCERPT_MAX_LENGTH = 80;

const notificationCollection = (db: FirebaseFirestore.Firestore, uid: string) =>
	db.collection("users").doc(uid).collection("notifications");

/** 로그인 작성자 → actor */
export const actorFromAuth = (auth: AuthContext): NotificationActor => ({
	uid: auth.uid,
	name: auth.displayName || "사용자",
	avatarUrl: auth.photoURL || "",
	anon: false,
});

/** 익명 작성자(댓글/방명록 PIN 작성) → actor. 수신자는 될 수 없다. */
export const anonActor = (name: string): NotificationActor => ({
	uid: null,
	name: name || "익명",
	avatarUrl: "",
	anon: true,
});

// 관리자 uid 목록은 거의 변하지 않으므로 웜 인스턴스에서 잠깐 캐시
const ADMIN_CACHE_TTL_MS = 60 * 1000;
let adminUidsCache: { uids: string[]; expiresAt: number } | null = null;

/** 운영자 수신자: users(role=="admin") + FIREBASE_OWNER_UID 합집합 */
export const getAdminRecipientUids = async (): Promise<string[]> => {
	if (adminUidsCache && adminUidsCache.expiresAt > Date.now()) {
		return adminUidsCache.uids;
	}
	const uids = new Set<string>();
	const owner = process.env.FIREBASE_OWNER_UID?.trim();
	if (owner) uids.add(owner);
	try {
		const snapshot = await getDb()
			.collection("users")
			.where("role", "==", "admin")
			.limit(10)
			.get();
		for (const doc of snapshot.docs) uids.add(doc.id);
	} catch (error) {
		console.warn("[notifications] admin uid lookup failed:", error);
	}
	const result = Array.from(uids);
	adminUidsCache = { uids: result, expiresAt: Date.now() + ADMIN_CACHE_TTL_MS };
	return result;
};

const trimNotifications = async (
	db: FirebaseFirestore.Firestore,
	uid: string,
) => {
	const col = notificationCollection(db, uid);
	const countSnapshot = await col.count().get();
	const excess = countSnapshot.data().count - MAX_NOTIFICATIONS_PER_USER;
	if (excess <= 0) return;
	const oldest = await col.orderBy("createdAt", "asc").limit(excess).get();
	const batch = db.batch();
	oldest.docs.forEach((doc) => batch.delete(doc.ref));
	await batch.commit();
};

/**
 * 수신자들의 알림함(users/{uid}/notifications)에 알림을 기록한다.
 * - 자기 자신(actor.uid)은 자동 제외, 수신자 중복 제거.
 * - 호출부는 반드시 `try { await emitNotification(...) } catch { console.error }`
 *   형태로 감쌀 것 — Vercel 서버리스는 응답 반환 즉시 freeze되므로
 *   await 없는 fire-and-forget은 유실된다. 알림 실패는 본 요청을 실패시키지
 *   않는다. (지연이 문제가 되면 @vercel/functions의 waitUntil로 업그레이드)
 */
export const emitNotification = async ({
	actor,
	recipients,
	type,
	category,
	message,
	excerpt,
	link,
}: {
	actor: NotificationActor;
	recipients: Array<string | null | undefined>;
	type: NotificationType;
	category: NotificationCategory;
	message: string;
	excerpt: string;
	link: string;
}): Promise<void> => {
	const targets = Array.from(
		new Set(
			recipients.filter(
				(uid): uid is string =>
					typeof uid === "string" && uid.length > 0 && uid !== actor.uid,
			),
		),
	);
	if (targets.length === 0) return;

	const db = getDb();
	const payload = {
		type,
		category,
		message,
		excerpt: excerpt.slice(0, EXCERPT_MAX_LENGTH),
		link,
		actor: {
			uid: actor.uid ?? null,
			name: actor.name || "익명",
			avatarUrl: actor.avatarUrl || "",
			anon: actor.anon === true,
		},
		read: false,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
	};

	const batch = db.batch();
	for (const uid of targets) {
		batch.set(notificationCollection(db, uid).doc(), payload);
	}
	await batch.commit();

	// 상한 트림 실패는 비치명
	await Promise.all(
		targets.map((uid) =>
			trimNotifications(db, uid).catch((error) =>
				console.warn(`[notifications] trim failed for ${uid}:`, error),
			),
		),
	);
};
