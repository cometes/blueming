import type { NextRequest } from "next/server";
import { getFireAuth } from "@/app/api/_lib/admin";
import { jsonError, jsonOk } from "@/app/api/_lib/response";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 7;

const getIdToken = async (req: NextRequest) => {
	const authHeader = req.headers.get("authorization");
	if (authHeader?.startsWith("Bearer ")) {
		return authHeader.slice("Bearer ".length);
	}
	try {
		const body = await req.json();
		if (typeof body?.idToken === "string") return body.idToken;
	} catch {
	}
	return null;
};

const getCookieOptions = () => {
	const isProd = process.env.NODE_ENV === "production";
	const sameSiteEnv = process.env.COOKIE_SAMESITE;
	const secureEnv = process.env.COOKIE_SECURE;
	const sameSite: "lax" | "strict" | "none" =
		sameSiteEnv === "lax" || sameSiteEnv === "strict" || sameSiteEnv === "none"
			? sameSiteEnv
			: isProd
				? "none"
				: "lax";
	const secure =
		secureEnv === "true" ? true : secureEnv === "false" ? false : isProd;
	return { sameSite, secure };
};

export async function POST(req: NextRequest) {
	const idToken = await getIdToken(req);
	if (!idToken) {
		return jsonError(400, "Missing idToken.");
	}
	try {
		const sessionCookie = await getFireAuth().createSessionCookie(idToken, {
			expiresIn: SESSION_EXPIRES_IN_MS,
		});
		const { sameSite, secure } = getCookieOptions();
		const res = jsonOk({ ok: true });
		res.cookies.set({
			name: SESSION_COOKIE_NAME,
			value: sessionCookie,
			httpOnly: true,
			secure,
			sameSite,
			maxAge: SESSION_EXPIRES_IN_MS / 1000,
			path: "/",
		});
		return res;
	} catch (error) {
		console.error("Failed to create session cookie:", error);
		return jsonError(401, "Invalid credentials.");
	}
}
