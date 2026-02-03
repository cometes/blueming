import { useCallback, useEffect, useRef } from "react";
import { useAuthStore, AuthUser } from "@/store/auth/store";

const API_BASE = "https://api-w5buphcleq-du.a.run.app";

// 로그인 성공 콜백을 위한 전역 변수
let onLoginSuccessCallback: (() => void) | null = null;
let onLoginFailCallback: (() => void) | null = null;

export const useAuth = () => {
	const { isAuthenticated, user, isLoading, setAuthData, clearAuth } =
		useAuthStore();
	const popupRef = useRef<Window | null>(null);
	const popupCheckIntervalRef = useRef<number | null>(null);

	// 사용자 정보 가져오기
	const fetchUser = useCallback(async () => {
		try {
			const response = await fetch(`${API_BASE}/auth/me`, {
				method: "GET",
				credentials: "include",
			});

			if (response.ok) {
				const data = await response.json();

				if (data.user) {
					const user: AuthUser = {
						uid: data.user.uid,
						email: data.user.email || "",
						displayName: data.user.displayName,
						photoURL: data.user.photoURL,
						isAdmin: data.user.isAdmin || false,
						role: data.user.role || "user",
					};

					setAuthData({
						isAuthenticated: true,
						user,
						isLoading: false,
					});
					return true;
				}
			}

			setAuthData({
				isAuthenticated: false,
				user: null,
				isLoading: false,
			});
			return false;
		} catch {
			setAuthData({
				isAuthenticated: false,
				user: null,
				isLoading: false,
			});
			return false;
		}
	}, [setAuthData]);

	// 팝업 닫힘 감지
	const startPopupCheck = useCallback(() => {
		if (popupCheckIntervalRef.current) {
			clearInterval(popupCheckIntervalRef.current);
		}

		popupCheckIntervalRef.current = window.setInterval(() => {
			if (popupRef.current?.closed) {
				// 팝업이 닫혔는데 로그인 성공 메시지를 못 받은 경우
				if (popupCheckIntervalRef.current) {
					clearInterval(popupCheckIntervalRef.current);
					popupCheckIntervalRef.current = null;
				}
				popupRef.current = null;
				setAuthData({ isLoading: false });
			}
		}, 500);
	}, [setAuthData]);

	// 로그인 함수 - 팝업 방식
	const handleLogin = useCallback(
		async (onSuccess?: () => void, onFail?: () => void) => {
			try {
				setAuthData({ isLoading: true });

				// 콜백 저장
				onLoginSuccessCallback = onSuccess || null;
				onLoginFailCallback = onFail || null;

				// 팝업 모드로 OAuth 시작
				const loginUrl = `${API_BASE}/auth/google/start?returnTo=__popup__`;

				// 팝업 창 열기
				const width = 500;
				const height = 600;
				const left = window.screenX + (window.outerWidth - width) / 2;
				const top = window.screenY + (window.outerHeight - height) / 2;

				popupRef.current = window.open(
					loginUrl,
					"GoogleLogin",
					`width=${width},height=${height},left=${left},top=${top},popup=yes`
				);

				if (!popupRef.current) {
					setAuthData({ isLoading: false });
					onFail?.();
					return {
						success: false,
						message: "팝업이 차단되었습니다. 팝업 차단을 해제해주세요.",
					};
				}

				// 팝업 닫힘 감지 시작
				startPopupCheck();

				// 팝업 방식에서는 결과를 기다리지 않음
				return { success: null, message: "" };
			} catch {
				clearAuth();
				onFail?.();
				return {
					success: false,
					message: "로그인에 실패했습니다. 다시 시도해주세요.",
				};
			}
		},
		[setAuthData, clearAuth, startPopupCheck]
	);

	// 팝업에서 오는 메시지 수신
	useEffect(() => {
		const handleMessage = async (event: MessageEvent) => {
			if (event.data?.type === "AUTH_SUCCESS") {
				// 인터벌 정리
				if (popupCheckIntervalRef.current) {
					clearInterval(popupCheckIntervalRef.current);
					popupCheckIntervalRef.current = null;
				}

				// 팝업 닫기
				if (popupRef.current) {
					popupRef.current.close();
					popupRef.current = null;
				}

				// 사용자 정보 가져오기
				const success = await fetchUser();

				// 콜백 호출
				if (success && onLoginSuccessCallback) {
					onLoginSuccessCallback();
				} else if (!success && onLoginFailCallback) {
					onLoginFailCallback();
				}

				// 콜백 초기화
				onLoginSuccessCallback = null;
				onLoginFailCallback = null;
			}
		};

		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [fetchUser]);

	// 로그아웃 함수
	const handleLogout = useCallback(async () => {
		try {
			await fetch(`${API_BASE}/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			clearAuth();
			return { success: true, message: "로그아웃되었습니다." };
		} catch {
			clearAuth();
			return { success: false, message: "로그아웃 중 오류가 발생했습니다." };
		}
	}, [clearAuth]);

	// 초기화 함수
	const initializeAuth = useCallback(() => {
		void fetchUser();
		return () => {};
	}, [fetchUser]);

	return {
		isAuthenticated,
		user,
		isLoading,
		handleLogin,
		handleLogout,
		initializeAuth,
	};
};
