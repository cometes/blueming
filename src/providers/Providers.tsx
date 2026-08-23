"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "sonner";
import { SettingsProvider } from "./SettingsProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ThemesProvider } from "@/contexts/ThemesContext";
import type { SettingsSnapshot } from "@/features/settings/types";
import { useAuth } from "@/features/account/hooks/useAuth";

// 미읽음 알림 폴링 — 앱 전역 1개 (메뉴 변형들이 각자 폴링하지 않도록)
const NotificationPoller = dynamic(
	() => import("@/features/notification/components/NotificationPoller"),
	{ ssr: false },
);

interface ProvidersProps {
	children: React.ReactNode;
	initialSettings: SettingsSnapshot | null;
}

// 인증 초기화 컴포넌트
function AuthInitializer({ children }: { children: React.ReactNode }) {
	const { initializeAuth } = useAuth();

	useEffect(() => {
		const unsubscribe = initializeAuth();
		return () => {
			unsubscribe();
		};
	}, [initializeAuth]);

	return <>{children}</>;
}

export default function Providers({
	children,
	initialSettings,
}: ProvidersProps) {
	return (
		<SettingsProvider initialSettings={initialSettings}>
			<ThemesProvider>
					<ThemeProvider>
						<AuthInitializer>
							{children}
						</AuthInitializer>
						<Toaster position="top-center" richColors />
						<NotificationPoller />
					</ThemeProvider>
			</ThemesProvider>
		</SettingsProvider>
	);
}
