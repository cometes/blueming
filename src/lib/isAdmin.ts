// 관리자 이메일 목록
// 이 목록에 포함된 이메일 주소는 관리자 권한을 가집니다.
export const ADMIN_EMAILS = [
	// 예시: "admin@example.com",
	// 실제 관리자 이메일을 여기에 추가하세요
];

// 관리자 UID 목록 (선택사항)
// Firebase UID로 관리자를 식별하려는 경우 사용
export const ADMIN_UIDS = [
	// 예시: "firebase-uid-string",
	// 실제 관리자 UID를 여기에 추가하세요
	"PFkvrOsHOVRFZgShECX9KKvEQ2p2",
];

/**
 * 사용자가 관리자인지 확인하는 함수
 * @param email 사용자 이메일
 * @param uid 사용자 UID (선택사항)
 * @returns 관리자 여부
 */
export const isAdmin = (email: string, uid?: string): boolean => {
	// 이메일로 관리자 확인
	if (ADMIN_EMAILS.includes(email)) {
		return true;
	}

	// UID로 관리자 확인 (UID가 제공된 경우)
	if (uid && ADMIN_UIDS.includes(uid)) {
		return true;
	}

	return false;
};

/**
 * AuthUser 객체로부터 관리자 여부를 확인하는 함수
 * @param user AuthUser 객체
 * @returns 관리자 여부
 */
export const isUserAdmin = (
	user: { email: string; uid: string } | null
): boolean => {
	if (!user) return false;
	return isAdmin(user.email, user.uid);
};
