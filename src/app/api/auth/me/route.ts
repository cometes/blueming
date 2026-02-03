import { jsonOk } from "@/app/api/_lib/response";
import { getAuthContext } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

export async function GET() {
	const auth = await getAuthContext();
	if (!auth) {
		return jsonOk({ user: null });
	}
	return jsonOk({ user: auth });
}
