import { useAuthStore } from "@/store/auth/store";
import { isUserAdmin, checkAdminClaims, refreshAdminClaims } from "@/lib/isAdmin";
import { useCallback } from "react";

/**
 * 관리자 권한 관련 유틸리티 훅
 */
export const useAdmin = () => {
	const { isAuthenticated, user, setUser } = useAuthStore();

	/**
	 * 현재 사용자가 관리자인지 확인 (저장된 상태 기반)
	 */
	const isCurrentUserAdmin = (): boolean => {
		if (!isAuthenticated || !user) {
			return false;
		}
		return isUserAdmin(user);
	};

	/**
	 * Firebase Custom Claims를 통해 실시간으로 관리자 권한 확인
	 */
	const checkCurrentAdminClaims = useCallback(async (): Promise<boolean> => {
		try {
			const isAdmin = await checkAdminClaims();
			
			// 현재 사용자 정보와 차이가 있다면 업데이트
			if (user && user.isAdmin !== isAdmin) {
				setUser({
					...user,
					isAdmin,
				});
			}
			
			return isAdmin;
		} catch (error) {
			console.error("관리자 권한 확인 실패:", error);
			return false;
		}
	}, [user, setUser]);

	/**
	 * 관리자 권한 새로고침 (토큰 강제 갱신)
	 */
	const refreshAdminStatus = useCallback(async (): Promise<boolean> => {
		try {
			const isAdmin = await refreshAdminClaims();
			
			if (user) {
				setUser({
					...user,
					isAdmin,
				});
			}
			
			return isAdmin;
		} catch (error) {
			console.error("관리자 권한 새로고침 실패:", error);
			return false;
		}
	}, [user, setUser]);

	/**
	 * 관리자 권한이 필요한 액션을 실행하기 전에 권한을 확인
	 */
	const requireAdmin = useCallback(async (
		callback: () => void | Promise<void>, 
		onDenied?: () => void
	): Promise<void> => {
		try {
			const hasAdminRights = await checkCurrentAdminClaims();
			
			if (hasAdminRights) {
				await callback();
			} else {
				if (onDenied) {
					onDenied();
				} else {
					console.warn("관리자 권한이 필요한 작업입니다.");
				}
			}
		} catch (error) {
			console.error("관리자 권한 확인 중 오류:", error);
			if (onDenied) {
				onDenied();
			}
		}
	}, [checkCurrentAdminClaims]);

	return {
		isAdmin: isCurrentUserAdmin(),
		isCurrentUserAdmin,
		checkCurrentAdminClaims,
		refreshAdminStatus,
		requireAdmin,
		user,
		isAuthenticated,
	};
};
