import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireAuth } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

const LIST_LIMIT = 50;

const myNotifications = (uid: string) =>
	getDb().collection("users").doc(uid).collection("notifications");

/** GET: 내 알림 목록(최근 50) + 미읽음 수. ?countOnly=1 이면 카운트만. */
export async function GET(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const col = myNotifications(auth.auth.uid);
		const unreadSnapshot = await col.where("read", "==", false).count().get();
		const unreadCount = unreadSnapshot.data().count;

		if (req.nextUrl.searchParams.get("countOnly") === "1") {
			return jsonOk({ unreadCount });
		}

		const snapshot = await col
			.orderBy("createdAt", "desc")
			.limit(LIST_LIMIT)
			.get();
		const items = snapshot.docs.map((doc) => {
			const data = doc.data();
			return {
				id: doc.id,
				type: data.type,
				category: data.category,
				message: data.message,
				excerpt: data.excerpt || "",
				link: data.link || "/",
				actor: data.actor || null,
				read: data.read === true,
				createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
			};
		});

		return jsonOk({ items, unreadCount });
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return jsonError(500, "알림을 불러오지 못했습니다.");
	}
}

const parseTargetBody = (body: unknown) => {
	const value = (body ?? {}) as { ids?: unknown; all?: unknown };
	const all = value.all === true;
	const ids = Array.isArray(value.ids)
		? value.ids.filter((id): id is string => typeof id === "string").slice(0, 200)
		: [];
	return { all, ids };
};

/** PATCH: 읽음 처리 — { all: true } 또는 { ids: [...] } */
export async function PATCH(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { all, ids } = parseTargetBody(await req.json().catch(() => ({})));
		const col = myNotifications(auth.auth.uid);
		const db = getDb();
		const batch = db.batch();

		if (all) {
			const snapshot = await col.where("read", "==", false).limit(500).get();
			snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: true }));
		} else if (ids.length > 0) {
			ids.forEach((id) => batch.update(col.doc(id), { read: true }));
		} else {
			return jsonError(400, "ids 또는 all이 필요합니다.");
		}

		await batch.commit();
		return jsonOk({ ok: true });
	} catch (error) {
		console.error("Error marking notifications read:", error);
		return jsonError(500, "읽음 처리에 실패했습니다.");
	}
}

/** DELETE: 삭제 — { all: true } 또는 { ids: [...] } */
export async function DELETE(req: NextRequest) {
	const auth = await requireAuth();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const { all, ids } = parseTargetBody(await req.json().catch(() => ({})));
		const col = myNotifications(auth.auth.uid);
		const db = getDb();
		const batch = db.batch();

		if (all) {
			const snapshot = await col.limit(500).get();
			snapshot.docs.forEach((doc) => batch.delete(doc.ref));
		} else if (ids.length > 0) {
			ids.forEach((id) => batch.delete(col.doc(id)));
		} else {
			return jsonError(400, "ids 또는 all이 필요합니다.");
		}

		await batch.commit();
		return jsonOk({ ok: true });
	} catch (error) {
		console.error("Error deleting notifications:", error);
		return jsonError(500, "알림 삭제에 실패했습니다.");
	}
}
