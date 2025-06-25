import { useAdmin } from "@/hooks/auth/UseAdmin";

interface AdminOnlyProps {
	children: React.ReactNode;
	fallback?: React.ReactNode; // 관리자가 아닐 때 보여줄 컴포넌트
	hideWhenNotAdmin?: boolean; // 관리자가 아닐 때 아예 숨길지 여부
}

/**
 * 관리자에게만 특정 컴포넌트를 보여주는 래퍼 컴포넌트
 *
 * @param children 관리자에게만 보여줄 컴포넌트
 * @param fallback 관리자가 아닐 때 보여줄 컴포넌트
 * @param hideWhenNotAdmin 관리자가 아닐 때 아무것도 렌더링하지 않을지 여부
 */
export default function AdminOnly({
	children,
	fallback,
	hideWhenNotAdmin = false,
}: AdminOnlyProps) {
	const { isAdmin } = useAdmin();

	// 관리자인 경우 자식 컴포넌트 렌더링
	if (isAdmin) {
		return <>{children}</>;
	}

	// 관리자가 아닌 경우
	if (hideWhenNotAdmin) {
		return null;
	}

	// fallback이 있으면 fallback 렌더링, 없으면 null
	return fallback ? <>{fallback}</> : null;
}
