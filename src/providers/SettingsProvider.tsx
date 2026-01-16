// providers/SettingsProvider.jsx
"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { SettingsContext } from "@/contexts/SettingsContext";

export function SettingsProvider({ children, initialSettings }) {
	const [general, setGeneral] = useState(initialSettings?.general || {});
	const [main, setMain] = useState(initialSettings?.main || {});
	const [library, setLibrary] = useState(initialSettings?.library || {});
	const [loading] = useState(!initialSettings);
	const channelRef = useRef<BroadcastChannel | null>(null);
	const clientIdRef = useRef(
		typeof crypto !== "undefined" && "randomUUID" in crypto ?
			crypto.randomUUID() :
			`client-${Math.random().toString(36).slice(2, 10)}`
	);

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

	const updateLibrary = (newSettings) => {
		setLibrary((prev) => ({
			...prev,
			...newSettings,
		}));
	};

	const refreshSettings = useCallback(
		async (options?: { broadcast?: boolean; noCache?: boolean }) => {
			try {
				const noCache = options?.noCache !== false;
				const url = new URL(
					"https://api-w5buphcleq-du.a.run.app/settings"
				);
				if (noCache) {
					url.searchParams.set("ts", Date.now().toString());
				}
				const res = await fetch(url.toString(), {
					cache: noCache ? "no-store" : "force-cache",
					headers: noCache ? { "Cache-Control": "no-cache" } : undefined,
				});

				if (!res.ok) {
					return;
				}

				const data = await res.json();
				setGeneral(data?.general || {});
				setMain(data?.main || {});
				setLibrary(data?.library || {});

				if (options?.broadcast && channelRef.current) {
					channelRef.current.postMessage({
						timestamp: Date.now(),
						source: clientIdRef.current,
					});
				}
			} catch {
		}
	},
		[]
	);

	useEffect(() => {
		const channel = new BroadcastChannel("settingsRefetch");
		channelRef.current = channel;
		channel.onmessage = (event) => {
			if (event?.data?.source === clientIdRef.current) {
				return;
			}
			refreshSettings({ broadcast: false });
		};
		return () => {
			channelRef.current = null;
			channel.close();
		};
	}, [refreshSettings]);

	const value = useMemo(
		() => ({
			general,
			main,
			library,
			updateGeneral,
			updateMain,
			updateLibrary,
			refreshSettings,
			loading,
		}),
		[general, main, library, loading, refreshSettings]
	);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}
