import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { getAuthContext } from "@/app/api/_lib/auth";
import { ensureUserDoc } from "@/app/api/_lib/userLogin";

export const runtime = "nodejs";

export async function POST() {
	try {
		const authContext = await getAuthContext();
		if (!authContext) {
			return jsonError(401, "Authentication required.");
		}

		const db = getDb();
		const result = await ensureUserDoc(db, authContext);
		return jsonOk(result);
	} catch (error) {
		console.error("Error processing user login:", error);
		return jsonError(500, "Failed to process login.");
	}
}
