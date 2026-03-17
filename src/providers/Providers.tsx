"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { SettingsProvider } from "./SettingsProvider";
import { ThemeProvider } from "./ThemeProvider";
import { ThemesProvider } from "@/contexts/ThemesContext";
import type { SettingsSnapshot } from "@/features/settings/types";
import { useAuth } from "@/hooks/auth/UseAuth";

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
					</ThemeProvider>
			</ThemesProvider>
		</SettingsProvider>
	);
}
