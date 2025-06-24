import { useAuthStore } from "@/store/auth/store";
import { isUserAdmin } from "@/lib/isAdmin";

/**
 * 관리자 권한 관련 유틸리티 훅
 */
export const useAdmin = () => {
	const { isAuthenticated, user } = useAuthStore();

	/**
	 * 현재 사용자가 관리자인지 확인
	 */
	const isCurrentUserAdmin = (): boolean => {
		if (!isAuthenticated || !user) {
			return false;
		}
		return user.isAdmin || false;
	};

	/**
	 * 특정 사용자가 관리자인지 확인
	 */
	const checkUserAdmin = (email: string, uid?: string): boolean => {
		return isUserAdmin({ email, uid: uid || "" });
	};

	/**
	 * 관리자 권한이 필요한 액션을 실행하기 전에 권한을 확인
	 */
	const requireAdmin = (callback: () => void, onDenied?: () => void): void => {
		if (isCurrentUserAdmin()) {
			callback();
		} else {
			if (onDenied) {
				onDenied();
			} else {
				console.warn("관리자 권한이 필요한 작업입니다.");
			}
		}
	};

	return {
		isAdmin: isCurrentUserAdmin(),
		isCurrentUserAdmin,
		checkUserAdmin,
		requireAdmin,
		user,
		isAuthenticated,
	};
};
