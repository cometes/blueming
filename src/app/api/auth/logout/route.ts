import { jsonOk } from "@/app/api/_lib/response";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "__session";

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

export async function POST() {
	const { sameSite, secure } = getCookieOptions();
	const res = jsonOk({ ok: true });
	res.cookies.set({
		name: SESSION_COOKIE_NAME,
		value: "",
		httpOnly: true,
		secure,
		sameSite,
		maxAge: 0,
		path: "/",
	});
	return res;
}
