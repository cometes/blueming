"use client";

import { useEffect } from "react";
import { SettingsProvider } from "./SettingsProvider";
import { ThemeProvider } from "./ThemeProvider";
import { useAuth } from "@/hooks/auth/UseAuth";
import ThemeLoader from "@/components/ThemeLoader";

interface ProvidersProps {
	children: React.ReactNode;
	initialSettings: any;
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

export default function Providers({ children, initialSettings }: ProvidersProps) {
	return (
		<SettingsProvider initialSettings={initialSettings}>
			<ThemeProvider>
				<AuthInitializer>
					<ThemeLoader>
						{children}
					</ThemeLoader>
				</AuthInitializer>
			</ThemeProvider>
		</SettingsProvider>
	);
}
