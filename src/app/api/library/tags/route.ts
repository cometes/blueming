import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";

export const runtime = "nodejs";

export async function GET() {
	try {
		const db = getDb();
		const tagsCollectionRef = db.collection("tags");
		const snapshot = await tagsCollectionRef.get();

		if (snapshot.empty) {
			return jsonOk([]);
		}

		const tags = snapshot.docs.map((doc) => doc.id);
		return jsonOk(tags);
	} catch (error) {
		console.error("Error fetching tags:", error);
		return jsonError(500, "Failed to fetch tags.");
	}
}
