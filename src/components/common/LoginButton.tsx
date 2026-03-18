import React from "react";
import { useAuth } from "@/features/account/hooks/useAuth";

export default function LoginButton() {
	const { isAuthenticated, user, isLoading, handleLogin, handleLogout } =
		useAuth();

	const onLoginClick = async () => {
		const result = await handleLogin(
			() => alert("로그인되었습니다."),
			() => alert("로그인에 실패했습니다.")
		);
		// 팝업이 차단된 경우에만 즉시 에러 표시
		if (result.success === false) {
			alert(result.message);
		}
	};

	const onLogoutClick = async () => {
		const result = await handleLogout();
		if (result.success) {
			alert(result.message);
		} else {
			alert(result.message);
		}
	};

	if (isLoading) {
		return (
			<div style={{ position: "fixed", top: 0, left: 0, padding: "10px" }}>
				로딩 중...
			</div>
		);
	}

	return (
		<div
			style={{
				position: "fixed",
				bottom: 0,
				left: 0,
				padding: "10px",
				zIndex: 9999,
			}}
		>
			{isAuthenticated ? (
				<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
					<span>안녕하세요, {user?.displayName || user?.email}님!</span>
					<button onClick={onLogoutClick}>로그아웃</button>
				</div>
			) : (
				<button onClick={onLoginClick}>로그인하기</button>
			)}
		</div>
	);
}
