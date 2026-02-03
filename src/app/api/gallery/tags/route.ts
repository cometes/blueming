import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { COLLECTION_NAME } from "@/app/api/_lib/gallery";

export const runtime = "nodejs";

export async function GET() {
	try {
		const db = getDb();
		const snapshot = await db.collection(COLLECTION_NAME).get();
		if (snapshot.empty) {
			return jsonOk([]);
		}
		const tags = new Set<string>();
		snapshot.docs.forEach((doc) => {
			const data = doc.data();
			if (Array.isArray(data.tags)) {
				data.tags.forEach((tag: unknown) => {
					if (typeof tag === "string" && tag.trim()) {
						tags.add(tag.trim());
					}
				});
			}
		});
		return jsonOk(Array.from(tags));
	} catch (error) {
		console.error("Gallery tags error:", error);
		return jsonError(500, "태그를 불러오지 못했습니다.");
	}
}
