// providers/SettingsProvider.jsx
"use client";

import { useState, useMemo } from "react";
import { SettingsContext } from "@/contexts/SettingsContext";

export function SettingsProvider({ children, initialSettings }) {
	const [general, setGeneral] = useState(initialSettings?.general || {});
	const [main, setMain] = useState(initialSettings?.main || {});
	const [loading] = useState(!initialSettings);

	const updateGeneral = (newSettings) => {
		setGeneral((prev) => ({
			...prev,
			...newSettings,
		}));
	};

	const updateMain = (newSettings) => {
		setMain((prev) => ({
			...prev,
			...newSettings,
		}));
	};

	const value = useMemo(
		() => ({
			general,
			main,
			updateGeneral,
			updateMain,
			loading,
		}),
		[general, main, loading]
	);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}
