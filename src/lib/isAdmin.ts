import { getAuth, getIdTokenResult } from 'firebase/auth';

/**
 * Firebase Custom Claims를 사용하여 관리자 여부를 확인하는 함수
 * @returns 관리자 여부 (Promise)
 */
export const checkAdminClaims = async (): Promise<boolean> => {
	try {
		const auth = getAuth();
		const currentUser = auth.currentUser;
		
		if (!currentUser) {
			return false;
		}

		// ID 토큰에서 Custom Claims 확인
		const tokenResult = await getIdTokenResult(currentUser);
		return !!tokenResult.claims.isAdmin;
	} catch (error) {
		return false;
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

/**
 * 토큰 새로고침을 통해 최신 Custom Claims를 가져오는 함수
 * @returns 새로운 관리자 상태
 */
export const refreshAdminClaims = async (): Promise<boolean> => {
	try {
		const auth = getAuth();
		const currentUser = auth.currentUser;
		
		if (!currentUser) {
			return false;
		}

		// 토큰 강제 새로고침하여 최신 claims 가져오기
		const tokenResult = await getIdTokenResult(currentUser, true);
		return !!tokenResult.claims.isAdmin;
	} catch (error) {
		return false;
	}
};
