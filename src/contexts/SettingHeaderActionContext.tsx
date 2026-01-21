"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type HeaderAction = React.ReactNode | null;

interface SettingHeaderActionContextValue {
	action: HeaderAction;
	setAction: (action: HeaderAction) => void;
}

const SettingHeaderActionContext =
	createContext<SettingHeaderActionContextValue | null>(null);

export function SettingHeaderActionProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [action, setAction] = useState<HeaderAction>(null);

	const value = useMemo(
		() => ({
			action,
			setAction,
		}),
		[action]
	);

	return (
		<SettingHeaderActionContext.Provider value={value}>
			{children}
		</SettingHeaderActionContext.Provider>
	);
}

export function useSettingHeaderAction(
	action: HeaderAction,
	deps: React.DependencyList = []
) {
	const context = useContext(SettingHeaderActionContext);
	if (!context) {
		throw new Error(
			"useSettingHeaderAction must be used within SettingHeaderActionProvider"
		);
	}

	useEffect(() => {
		context.setAction(action);
		return () => context.setAction(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}

export function useSettingHeaderActionContext() {
	const context = useContext(SettingHeaderActionContext);
	if (!context) {
		throw new Error(
			"useSettingHeaderActionContext must be used within SettingHeaderActionProvider"
		);
	}
	return context;
}
