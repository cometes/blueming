"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type SettingStatus = "saved" | "dirty";

interface SettingStatusContextValue {
	statusBySection: Record<string, SettingStatus>;
	overallStatus: SettingStatus;
	dirtyCount: number;
	setStatus: (sectionId: string, status: SettingStatus) => void;
}

export const SettingStatusContext = createContext<SettingStatusContextValue | null>(
	null
);

export function SettingStatusProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [statusBySection, setStatusBySection] = useState<
		Record<string, SettingStatus>
	>({});

	const setStatus = (sectionId: string, status: SettingStatus) => {
		setStatusBySection((prev) => {
			if (prev[sectionId] === status) return prev;
			return { ...prev, [sectionId]: status };
		});
	};

	const { overallStatus, dirtyCount } = useMemo<{ overallStatus: SettingStatus; dirtyCount: number }>(() => {
		const statuses = Object.values(statusBySection);
		const dirtyCount = statuses.filter((status) => status === "dirty").length;
		return {
			overallStatus: dirtyCount > 0 ? "dirty" : "saved",
			dirtyCount,
		};
	}, [statusBySection]);

	const value = useMemo(
		() => ({
			statusBySection,
			overallStatus,
			dirtyCount,
			setStatus,
		}),
		[statusBySection, overallStatus, dirtyCount]
	);

	return (
		<SettingStatusContext.Provider value={value}>
			{children}
		</SettingStatusContext.Provider>
	);
}

export function useSettingStatusContext() {
	const context = useContext(SettingStatusContext);
	if (!context) {
		throw new Error("useSettingStatusContext must be used within provider");
	}
	return context;
}
