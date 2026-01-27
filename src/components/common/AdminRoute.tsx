"use client";

import { useRouter } from "next/navigation";
import { useAdmin } from "@/hooks/auth/UseAdmin";
import { useEffect } from "react";

interface AdminRouteProps {
	children: React.ReactNode;
	redirectTo?: string;
}

/**
 * 관리자만 접근 가능한 페이지를 보호하는 라우트 가드
 * 관리자가 아닐 경우 자동으로 리다이렉트
 *
 * @param children 관리자에게만 보여줄 페이지 컴포넌트
 * @param redirectTo 비관리자를 리다이렉트할 경로 (기본값: "/")
 */
export default function AdminRoute({
	children,
	redirectTo = "/",
}: AdminRouteProps) {
	const {
		isManagerOrAdmin,
		isAuthenticated,
		isLoading,
		refreshAdminStatus,
	} = useAdmin();
	const router = useRouter();

	useEffect(() => {
		if (!isAuthenticated) return;
		refreshAdminStatus();
	}, [isAuthenticated, refreshAdminStatus]);

	useEffect(() => {
		if (isLoading) return;
		if (!isAuthenticated || !isManagerOrAdmin) {
			router.push(redirectTo);
		}
	}, [isAuthenticated, isLoading, isManagerOrAdmin, router, redirectTo]);

	// 관리자가 아닌 경우 아무것도 렌더링하지 않음
	if (isLoading || !isManagerOrAdmin) {
		return null;
	}

	// 관리자인 경우에만 children 렌더링
	return <>{children}</>;
}
