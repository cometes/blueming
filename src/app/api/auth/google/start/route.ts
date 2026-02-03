import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

const getBaseUrl = (req: NextRequest) => {
	const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
	const proto =
		req.headers.get("x-forwarded-proto") ??
		new URL(req.url).protocol.replace(":", "");
	return `${proto}://${host}`;
};

export async function GET(req: NextRequest) {
	if (!GOOGLE_CLIENT_ID) {
		return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID." }, { status: 500 });
	}
	const returnTo = req.nextUrl.searchParams.get("returnTo") ?? "/";
	const state = Buffer.from(
		JSON.stringify({ returnTo, ts: Date.now() })
	).toString("base64url");
	const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;
	const params = new URLSearchParams({
		client_id: GOOGLE_CLIENT_ID,
		redirect_uri: redirectUri,
		response_type: "code",
		scope: "openid email profile",
		access_type: "offline",
		prompt: "select_account",
		state,
	});
	return NextResponse.redirect(
		`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
	);
}
