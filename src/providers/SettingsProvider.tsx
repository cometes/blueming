// providers/SettingsProvider.jsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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

	const refreshSettings = useCallback(
		async (options?: { broadcast?: boolean }) => {
			try {
				const res = await fetch(
					"https://api-w5buphcleq-du.a.run.app/settings",
					{
						cache: "no-store",
					}
				);

				if (!res.ok) {
					return;
				}

				const data = await res.json();
				setGeneral(data?.general || {});
				setMain(data?.main || {});

				if (options?.broadcast) {
					const channel = new BroadcastChannel("settingsRefetch");
					channel.postMessage({ timestamp: Date.now() });
					channel.close();
				}
			} catch (error) {
			}
		},
		[]
	);

	useEffect(() => {
		const channel = new BroadcastChannel("settingsRefetch");
		channel.onmessage = () => {
			refreshSettings({ broadcast: false });
		};
		return () => {
			channel.close();
		};
	}, [refreshSettings]);

	const value = useMemo(
		() => ({
			general,
			main,
			updateGeneral,
			updateMain,
			refreshSettings,
			loading,
		}),
		[general, main, loading, refreshSettings]
	);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}
