import "server-only";
import { cookies } from "next/headers";
import { getFireAuth } from "@/app/api/_lib/admin";
import { jsonError } from "@/app/api/_lib/response";

export type AuthContext = {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	isAdmin: boolean;
	role: "user" | "manager" | "admin";
};

const OWNER_UID = process.env.FIREBASE_OWNER_UID?.trim() ?? "";

export const getAuthContext = async (): Promise<AuthContext | null> => {
	try {
		const store = await cookies();
		const session =
			store.get("__session")?.value ?? store.get("session")?.value ?? null;
		if (!session) return null;

		const decoded = await getFireAuth().verifySessionCookie(session, true);
		const roleClaim = typeof decoded.role === "string" ? decoded.role : null;
		const isOwner = OWNER_UID !== "" && decoded.uid === OWNER_UID;
		const isAdmin =
			decoded.admin === true || decoded.isAdmin === true || isOwner;
		const isManager = decoded.manager === true || decoded.isManager === true;
		let role: "user" | "manager" | "admin" = "user";
		if (roleClaim === "admin" || isAdmin) {
			role = "admin";
		} else if (roleClaim === "manager" || isManager) {
			role = "manager";
		}

		return {
			uid: decoded.uid,
			email: decoded.email ?? null,
			displayName: decoded.name ?? null,
			photoURL: decoded.picture ?? null,
			isAdmin,
			role,
		};
	} catch {
		return null;
	}
};

export const requireAuth = async () => {
	const auth = await getAuthContext();
	if (!auth) {
		return { ok: false as const, status: 401, error: "Authentication required." };
	}
	return { ok: true as const, auth };
};

export const requireAdmin = async () => {
	const auth = await getAuthContext();
	if (!auth?.isAdmin) {
		return { ok: false as const, status: 403, error: "Admin permission required." };
	}
	return { ok: true as const, auth };
};

export const requireManager = async () => {
	const auth = await getAuthContext();
	if (!auth) {
		return { ok: false as const, status: 401, error: "Authentication required." };
	}
	if (auth.role !== "manager" && auth.role !== "admin") {
		return { ok: false as const, status: 403, error: "Manager permission required." };
	}
	return { ok: true as const, auth };
};

export const guard = async (
	check: () => Promise<
		| { ok: true; auth: AuthContext }
		| { ok: false; status: number; error: string }
	>
) => {
	const result = await check();
	if (result.ok === false) {
		return jsonError(result.status, result.error);
	}
	return result;
};
