// 세션 쿠키 기반 인증을 사용하므로 빈 헤더 반환
// fetch 호출 시 credentials: "include"를 사용하여 쿠키가 자동으로 전송됨
export const getAuthHeader = async (): Promise<Record<string, string>> => {
	return {};
};

// 인증 여부 확인을 위한 유틸리티
export const isAuthenticated = async (): Promise<boolean> => {
	try {
		const response = await fetch("https://api-w5buphcleq-du.a.run.app/auth/me", {
			method: "GET",
			credentials: "include",
		});
		if (response.ok) {
			const data = await response.json();
			return !!data.user;
		}
		return false;
	} catch {
		return false;
	}
};
