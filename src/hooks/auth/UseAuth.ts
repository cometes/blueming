import { useCallback } from "react";
import {
	signInWithPopup,
	signOut,
	onAuthStateChanged,
	setPersistence,
	browserLocalPersistence,
} from "firebase/auth";
import { auth, provider } from "@/lib/Firebase";
import { useAuthStore, AuthUser } from "@/store/auth/store";
import { checkAdminClaims } from "@/lib/isAdmin";
import axios from "axios";

export const useAuth = () => {
	const { isAuthenticated, user, isLoading, setAuthData, clearAuth } =
		useAuthStore();

	// 로그인 함수
	const handleLogin = useCallback(async () => {
		try {
			setAuthData({ isLoading: true });

			// Firebase 세션 지속성 설정
			await setPersistence(auth, browserLocalPersistence);

			// Firebase에서 Google 로그인
			const result = await signInWithPopup(auth, provider);

			// Firebase ID 토큰 가져오기
			const idToken = await result.user.getIdToken();

			// 백엔드 인증 (선택사항 - 필요시에만)
			try {
				await axios.post(
					"https://api-w5buphcleq-du.a.run.app/user/login",
					{},
					{
						headers: {
							Authorization: `Bearer ${idToken}`,
						},
						withCredentials: true,
					}
				);
			} catch {
				// 백엔드 실패해도 Firebase 인증은 유지
			}

			// onAuthStateChanged에서 상태 업데이트가 되므로 로딩만 해제
			// 사용자 상태는 onAuthStateChanged 콜백에서 설정됨
			setAuthData({ isLoading: false });

			return { success: true, message: "로그인 성공!" };
		} catch {
			// Firebase 세션 정리
			await signOut(auth);
			clearAuth();

			return {
				success: false,
				message: "로그인에 실패했습니다. 다시 시도해주세요.",
			};
		}
	}, [setAuthData, clearAuth]);

	// 로그아웃 함수
	const handleLogout = useCallback(async () => {
		try {
			// Firebase 로그아웃 - onAuthStateChanged가 자동으로 상태 업데이트
			await signOut(auth);

			return { success: true, message: "로그아웃되었습니다." };
		} catch {
			return { success: false, message: "로그아웃 중 오류가 발생했습니다." };
		}
	}, []);

	// Firebase 인증 상태 변화 감지 및 초기화
	const initializeAuth = useCallback(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			try {
				if (firebaseUser) {
					// 사용자가 로그인된 상태
					let isAdmin = false;
					
					try {
						// Custom Claims에서 관리자 권한 확인
						isAdmin = await checkAdminClaims();
					} catch {
						// Claims 확인에 실패해도 로그인은 유지
					}

					const user: AuthUser = {
						uid: firebaseUser.uid,
						email: firebaseUser.email || "",
						displayName: firebaseUser.displayName,
						photoURL: firebaseUser.photoURL,
						isAdmin,
					};

					setAuthData({
						isAuthenticated: true,
						user,
						isLoading: false,
					});
				} else {
					// 사용자가 로그아웃된 상태
					setAuthData({
						isAuthenticated: false,
						user: null,
						isLoading: false,
					});
				}
			} catch {
				clearAuth();
			}
		});

		return unsubscribe;
	}, [setAuthData, clearAuth]);

	return {
		isAuthenticated,
		user,
		isLoading,
		handleLogin,
		handleLogout,
		initializeAuth,
	};
};
