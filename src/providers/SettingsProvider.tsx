// providers/SettingsProvider.jsx
"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { SettingsContext } from "@/contexts/SettingsContext";
import { API_BASE } from "@/queries/apiClient";

export function SettingsProvider({ children, initialSettings }) {
	const [general, setGeneral] = useState(initialSettings?.general || {});
	const [main, setMain] = useState(initialSettings?.main || {});
	const [library, setLibrary] = useState(initialSettings?.library || {});
	const [gallery, setGallery] = useState(initialSettings?.gallery || {});
	const [loading, setLoading] = useState(!initialSettings);
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

	const updateDesign = (newDesign) => {
		setGeneral((prev) => ({
			...prev,
			design: newDesign,
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

	const updateGallery = (newSettings) => {
		setGallery((prev) => ({
			...prev,
			...newSettings,
		}));
	};

	const refreshSettings = useCallback(
		async (options?: { broadcast?: boolean; noCache?: boolean }) => {
			try {
				console.log("[settings] refresh start", {
					noCache: options?.noCache,
					broadcast: options?.broadcast,
				});
				const noCache = options?.noCache !== false;
				const settingsPath = `${API_BASE}/settings`;
				const url =
					typeof window === "undefined"
						? new URL(settingsPath, "http://localhost")
						: new URL(settingsPath, window.location.origin);
				if (noCache) {
					url.searchParams.set("ts", Date.now().toString());
				}
				const res = await fetch(url.toString(), {
					cache: noCache ? "no-store" : "force-cache",
					headers: noCache ? { "Cache-Control": "no-cache" } : undefined,
				});

				if (!res.ok) {
					console.warn("[settings] refresh failed", res.status);
					setLoading(false);
					return;
				}

				const data = await res.json();
				console.log("[settings] refresh success", {
					hasGeneral: !!data?.general,
					hasMain: !!data?.main,
					hasLibrary: !!data?.library,
					hasGallery: !!data?.gallery,
				});
				setGeneral(data?.general || {});
				setMain(data?.main || {});
				setLibrary(data?.library || {});
				setGallery(data?.gallery || {});
				setLoading(false);

				if (options?.broadcast && channelRef.current) {
					channelRef.current.postMessage({
						timestamp: Date.now(),
						source: clientIdRef.current,
					});
				}
			} catch {
				console.warn("[settings] refresh error");
				setLoading(false);
		}
	},
		[]
	);

	useEffect(() => {
		console.log("[settings] initial settings", {
			hasGeneral: !!initialSettings?.general,
			hasMain: !!initialSettings?.main,
			hasLibrary: !!initialSettings?.library,
			hasGallery: !!initialSettings?.gallery,
		});
		if (initialSettings) {
			setLoading(false);
		} else {
			refreshSettings({ broadcast: false, noCache: true });
		}
		const channel = new BroadcastChannel("settingsRefetch");
		channelRef.current = channel;
		channel.onmessage = (event) => {
			if (event?.data?.source === clientIdRef.current) {
				return;
			}
			console.log("[settings] broadcast refresh");
			refreshSettings({ broadcast: false });
		};
		return () => {
			channelRef.current = null;
			channel.close();
		};
	}, [refreshSettings, initialSettings]);

	const value = useMemo(
		() => ({
			general,
			main,
			library,
			gallery,
			updateGeneral,
			updateDesign,
			updateMain,
			updateLibrary,
			updateGallery,
			refreshSettings,
			loading,
		}),
		[general, main, library, gallery, loading, refreshSettings]
	);

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
}
