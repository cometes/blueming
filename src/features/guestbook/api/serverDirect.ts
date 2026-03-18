import "server-only";
import { getDb } from "@/app/api/_lib/admin";
import { parsePositiveInt } from "@/app/api/_lib/guestbook";
import type { AuthContext } from "@/app/api/_lib/auth";
import type { GuestbookListParams, GuestbookListResponse } from "@/features/guestbook/types";

export async function fetchGuestbookListDirect(
	params: GuestbookListParams = {},
	authContext?: AuthContext | null
): Promise<GuestbookListResponse> {
	try {
		const db = getDb();
		const limit = parsePositiveInt(params.limit, 20);
		const page = parsePositiveInt(params.page, 1);
		const offset = (page - 1) * limit;

		const baseQuery = db.collection("guestbook").orderBy("createdAt", "desc");
		const countSnapshot = await baseQuery.count().get();
		const total = countSnapshot.data().count || 0;

		if (total === 0) {
			return { items: [], total: 0, page, limit };
		}

		const snapshot = await baseQuery.offset(offset).limit(limit).get();
		const items = snapshot.docs.map((doc) => {
			const data = doc.data();
			const isSecret = data.isSecret === true;
			const isAnon = data.authorType === "anon";
			const isAuthor =
				authContext?.uid != null &&
				data.authorType === "user" &&
				data.uid === authContext.uid;
			const isOwn = Boolean(isAuthor);
			const canViewDirectly =
				!isSecret || authContext?.isAdmin === true || isAuthor;
			const canViewSecret = isSecret ? isAnon || canViewDirectly : false;
			const canEdit = isAnon
				? true
				: authContext?.isAdmin === true
					? data.isAdmin === true
					: Boolean(authContext?.uid && data.uid === authContext.uid);
			const canDelete = isAnon
				? true
				: Boolean(
						authContext?.isAdmin === true || authContext?.uid === data.uid
					);
			const masked = isSecret && !canViewDirectly;
			const displayMessage = canViewDirectly ? data.message : "비밀글입니다.";
			const displayImageUrls =
				canViewDirectly && Array.isArray(data.imageUrls)
					? data.imageUrls
					: [];
			const authorLabel =
				data.isAdmin === true ? "관리자" : isAnon ? "익명" : "";

			return {
				id: doc.id,
				authorType: data.authorType,
				displayName: data.displayName,
				uid: data.uid || null,
				photoURL: data.photoURL || null,
				message: displayMessage,
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

		return { items, total, page, limit };
	} catch {
		return {
			items: [],
			total: 0,
			page: params.page ?? 1,
			limit: params.limit ?? 20,
		};
	}
}
