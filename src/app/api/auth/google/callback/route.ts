import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb, getFireAuth } from "@/app/api/_lib/admin";
import { buildAuthContextFromDecoded } from "@/app/api/_lib/auth";
import { ensureUserDoc } from "@/app/api/_lib/userLogin";

export const runtime = "nodejs";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const FIREBASE_WEB_API_KEY = process.env.GOOGLE_WEB_API_KEY || "";
const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 7;

const getBaseUrl = (req: NextRequest) => {
	const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
	const proto =
		req.headers.get("x-forwarded-proto") ??
		new URL(req.url).protocol.replace(":", "");
	return `${proto}://${host}`;
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

export async function GET(req: NextRequest) {
	const code = req.nextUrl.searchParams.get("code") ?? "";
	const state = req.nextUrl.searchParams.get("state") ?? "";
	if (!code) {
		return NextResponse.json({ error: "Missing code." }, { status: 400 });
	}
	if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !FIREBASE_WEB_API_KEY) {
		return NextResponse.json({ error: "Missing Google OAuth config." }, { status: 500 });
	}

	let returnTo = "/";
	if (state) {
		try {
			const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
			if (decoded?.returnTo) returnTo = decoded.returnTo;
		} catch {
			// ignore invalid state
		}
	}

	const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;

	const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: GOOGLE_CLIENT_ID,
			client_secret: GOOGLE_CLIENT_SECRET,
			redirect_uri: redirectUri,
			grant_type: "authorization_code",
		}),
	});

	if (!tokenResponse.ok) {
		const errorText = await tokenResponse.text();
		console.error("Google token exchange failed:", errorText);
		return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
	}

	const tokenData = (await tokenResponse.json()) as { id_token?: string };
	if (!tokenData.id_token) {
		return NextResponse.json({ error: "Missing id_token." }, { status: 401 });
	}

	const firebaseTokenResponse = await fetch(
		`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_WEB_API_KEY}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				postBody: `id_token=${tokenData.id_token}&providerId=google.com`,
				requestUri: redirectUri,
				returnIdpCredential: true,
				returnSecureToken: true,
			}),
		}
	);

	if (!firebaseTokenResponse.ok) {
		const errorText = await firebaseTokenResponse.text();
		console.error("Firebase token exchange failed:", errorText);
		return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
	}

	const firebaseTokenData = (await firebaseTokenResponse.json()) as { idToken?: string };
	if (!firebaseTokenData.idToken) {
		return NextResponse.json({ error: "Missing Firebase idToken." }, { status: 401 });
	}

	try {
		const decoded = await getFireAuth().verifyIdToken(firebaseTokenData.idToken);
		const sessionCookie = await getFireAuth().createSessionCookie(
			firebaseTokenData.idToken,
			{ expiresIn: SESSION_EXPIRES_IN_MS }
		);
		const authContext = buildAuthContextFromDecoded(decoded);
		await ensureUserDoc(getDb(), authContext);
		const { sameSite, secure } = getCookieOptions();
		const res =
			returnTo === "__popup__"
				? new NextResponse(
						`<!doctype html><html><head><meta charset="utf-8" /></head><body><script>
try { if (window.opener) { window.opener.postMessage({ type: "AUTH_SUCCESS" }, "*"); } } finally { window.close(); }
</script></body></html>`,
						{ headers: { "Content-Type": "text/html; charset=utf-8" } }
					)
				: NextResponse.redirect(returnTo);

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
		return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
	}
}
