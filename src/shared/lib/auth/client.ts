import { API_BASE } from "@/shared/lib/http/client";
import type { AuthUser } from "@/store/auth/store";

export interface AuthStatusResponse {
	user?: {
		uid: string;
		email?: string | null;
		displayName?: string | null;
		photoURL?: string | null;
		isAdmin?: boolean;
		role?: "user" | "manager" | "admin";
	} | null;
}

export const getAuthHeader = async (): Promise<Record<string, string>> => ({});

export const fetchAuthStatus = async (): Promise<AuthStatusResponse> => {
	const response = await fetch(`${API_BASE}/auth/me`, {
		method: "GET",
		credentials: "include",
	});

	if (!response.ok) {
		return {};
	}

	return (await response.json()) as AuthStatusResponse;
};

export const isAuthenticated = async (): Promise<boolean> => {
	try {
		const response = await fetch(`${API_BASE}/auth/me`, {
			method: "GET",
			credentials: "include",
		});
		if (!response.ok) return false;
		const data = (await response.json()) as AuthStatusResponse;
		return Boolean(data.user);
	} catch {
		return false;
	}
};

export const toAuthUser = (
	user?: AuthStatusResponse["user"],
): AuthUser | null => {
	if (!user) return null;
	return {
		uid: user.uid,
		email: user.email || "",
		displayName: user.displayName ?? null,
		photoURL: user.photoURL ?? null,
		isAdmin: user.isAdmin || false,
		role: user.role || "user",
	};
};

export const buildGooglePopupLoginUrl = () =>
	`${API_BASE}/auth/google/start?returnTo=__popup__`;

export const logoutWithSession = async () => {
	return fetch(`${API_BASE}/auth/logout`, {
		method: "POST",
		credentials: "include",
	});
};
