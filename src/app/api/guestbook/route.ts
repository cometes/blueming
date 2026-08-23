import type { NextRequest } from "next/server";
import admin from "firebase-admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext } from "@/app/api/_lib/auth";
import {
	PIN_REGEX,
	checkGuestbookRateLimit,
	getRateLimitKey,
	normalizeBoolean,
	normalizeImageUrls,
	normalizeMessage,
	normalizeName,
	parsePositiveInt,
	hashPin,
} from "@/app/api/_lib/guestbook";

import {
	actorFromAuth,
	anonActor,
	emitNotification,
	getAdminRecipientUids,
	type NotificationActor,
} from "@/app/api/_lib/notifications";
import {
	emitMentionNotifications,
	validateMentions,
} from "@/app/api/_lib/mentions";

export const runtime = "nodejs";

// 새 방명록 알림: 관리자 수신 (작성자 본인은 emit에서 자동 제외)
const notifyNewGuestbookEntry = async (
	actor: NotificationActor,
	message: string,
	isSecret: boolean,
	excludeUids: string[] = []
) => {
	const admins = await getAdminRecipientUids();
	await emitNotification({
		actor,
		recipients: admins.filter((uid) => !excludeUids.includes(uid)),
		type: "guestbook",
		category: "comment",
		message: `${actor.name}님이 방명록을 남겼습니다`,
		excerpt: isSecret ? "비밀글입니다." : message,
		link: "/guestbook",
	});
};


export async function GET(req: NextRequest) {
	try {
		const db = getDb();
		const authContext = await getAuthContext();
		const limit = parsePositiveInt(req.nextUrl.searchParams.get("limit"), 20);
		const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1);
		const offset = (page - 1) * limit;

		const baseQuery = db.collection("guestbook").orderBy("createdAt", "desc");
		const countSnapshot = await baseQuery.count().get();
		const total = countSnapshot.data().count || 0;

		if (total === 0) {
			return jsonOk({ items: [], total: 0, page, limit });
		}

		const snapshot = await baseQuery.offset(offset).limit(limit).get();
		const items = snapshot.docs.map((doc) => {
			const data = doc.data();
			const isSecret = data.isSecret === true;
			const isAnon = data.authorType === "anon";
			const isAuthor =
				authContext?.uid &&
				data.authorType === "user" &&
				data.uid === authContext.uid;
			const isOwn = Boolean(isAuthor);
			const canViewDirectly = !isSecret || authContext?.isAdmin || isAuthor;
			const canViewSecret = isSecret ? isAnon || canViewDirectly : false;
			const canEdit = isAnon
				? true
				: authContext?.isAdmin
					? data.isAdmin === true
					: Boolean(authContext?.uid && data.uid === authContext.uid);
			const canDelete = isAnon
				? true
				: Boolean(authContext?.isAdmin || authContext?.uid === data.uid);
			const masked = isSecret && !canViewDirectly;
			const displayMessage = canViewDirectly ? data.message : "비밀글입니다.";
			const displayImageUrls =
				canViewDirectly && Array.isArray(data.imageUrls)
					? data.imageUrls
					: [];
			const authorLabel = data.isAdmin === true ? "관리자" : isAnon ? "익명" : "";
			return {
				id: doc.id,
				authorType: data.authorType,
				displayName: data.displayName,
				uid: data.uid || null,
				photoURL: data.photoURL || null,
				message: displayMessage,
				mentions:
					canViewDirectly && Array.isArray(data.mentions) ? data.mentions : [],
				imageUrls: displayImageUrls,
				isSecret,
				isAdmin: data.isAdmin === true,
				canEdit,
				canDelete,
				canViewSecret,
				masked,
				isOwn,
				displayMessage,
				displayImageUrls,
				authorLabel,
				createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
				updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
			};
		});

		return jsonOk({ items, total, page, limit });
	} catch (error) {
		console.error("Error fetching guestbook:", error);
		return jsonError(500, "Failed to fetch guestbook.");
	}
}

export async function POST(req: NextRequest) {
	try {
		const db = getDb();
		const authContext = await getAuthContext();
		if (!authContext?.isAdmin) {
			const key = getRateLimitKey(authContext, req);
			const rateLimit = await checkGuestbookRateLimit(key);
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
		const message = normalizeMessage(body?.message);
		const displayName = normalizeName(body?.displayName);
		const pin = typeof body?.pin === "string" ? body.pin : "";
		const isSecret = normalizeBoolean(body?.isSecret);
		const imageUrls = normalizeImageUrls(body?.imageUrls);

		if (!message) {
			return jsonError(400, "Message is required.");
		}

		const mentions = await validateMentions(body?.mentions, message);

		if (authContext?.uid) {
			const entry = {
				authorType: "user",
				uid: authContext.uid,
				displayName: authContext.displayName || displayName || "사용자",
				photoURL: authContext.photoURL || "",
				isAdmin: authContext.isAdmin === true,
				isSecret,
				imageUrls,
				message,
				mentions,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: null,
			};

			const docRef = await db.collection("guestbook").add(entry);
			try {
				const actor = actorFromAuth(authContext);
				const excerpt = isSecret ? "비밀글입니다." : message;
				const mentioned = await emitMentionNotifications({
					actor,
					mentions,
					excerpt,
					link: "/guestbook",
				});
				await notifyNewGuestbookEntry(actor, message, isSecret, mentioned);
			} catch (notifyError) {
				console.error("Error emitting guestbook notification:", notifyError);
			}
			return jsonOk({ id: docRef.id }, { status: 201 });
		}

		if (!displayName) {
			return jsonError(400, "Display name is required.");
		}
		if (!PIN_REGEX.test(pin)) {
			return jsonError(400, "PIN must be 4 digits.");
		}

		const { salt, hash } = hashPin(pin);
		const entry = {
			authorType: "anon",
			displayName,
			isSecret,
			imageUrls,
			message,
			mentions,
			pinSalt: salt,
			pinHash: hash,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
			updatedAt: null,
		};

		const docRef = await db.collection("guestbook").add(entry);
		try {
			const actor = anonActor(displayName);
			const excerpt = isSecret ? "비밀글입니다." : message;
			const mentioned = await emitMentionNotifications({
				actor,
				mentions,
				excerpt,
				link: "/guestbook",
			});
			await notifyNewGuestbookEntry(actor, message, isSecret, mentioned);
		} catch (notifyError) {
			console.error("Error emitting guestbook notification:", notifyError);
		}
		return jsonOk({ id: docRef.id }, { status: 201 });
	} catch (error) {
		console.error("Error creating guestbook entry:", error);
		return jsonError(500, "Failed to create guestbook entry.");
	}
}
