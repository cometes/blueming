import type { AuthUser } from "@/store/auth/store";

import { API_BASE } from "@/shared/lib/http/client";

/**
 * 백엔드 API를 통해 관리자 여부를 확인하는 함수
 * @returns 관리자 여부 (Promise)
 */
export const checkAdminClaims = async (): Promise<boolean> => {
	try {
		const response = await fetch(`${API_BASE}/auth/me`, {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) return false;

		const data = await response.json();
		return data.user?.isAdmin === true || data.user?.role === "admin";
	} catch {
		return false;
	}
};

export const getRoleClaims = async (): Promise<"user" | "manager" | "admin"> => {
	try {
		const response = await fetch(`${API_BASE}/auth/me`, {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) return "user";

		const data = await response.json();
		const user = data.user;
		if (!user) return "user";

		if (user.role === "admin" || user.isAdmin) return "admin";
		if (user.role === "manager" || user.isManager) return "manager";
		return "user";
	} catch {
		return "user";
	}
};

/**
 * AuthUser 객체의 isAdmin 속성으로 관리자 여부를 확인하는 함수
 * @param user AuthUser 객체
 * @returns 관리자 여부
 */
export const isUserAdmin = (
	user: { isAdmin?: boolean } | null
): boolean => {
	if (!user) return false;
	return !!user.isAdmin;
};

export const isUserManager = (user: AuthUser | null): boolean => {
	if (!user) return false;
	return user.role === "manager" || user.role === "admin";
};

/**
 * 백엔드에서 최신 권한 정보를 가져오는 함수
 * @returns 새로운 관리자 상태
 */
export const refreshAdminClaims = async (): Promise<boolean> => {
	// 세션 쿠키 기반이므로 checkAdminClaims와 동일
	return checkAdminClaims();
};
