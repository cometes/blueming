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
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: `client-${Math.random().toString(36).slice(2, 10)}`
	);

	const updateGeneral = (newSettings) => {
		console.log("[settings] updateGeneral called", { newSettings });
		setGeneral((prev) => ({
			...prev,
			...newSettings,
		}));
	};

	const updateDesign = (newDesign) => {
		console.log("[settings] updateDesign called", { newDesign });
		setGeneral((prev) => ({
			...prev,
			design: newDesign,
		}));
	};

	const updateMain = (newSettings) => {
		console.log("[settings] updateMain called", { newSettings });
		setMain((prev) => ({
			...prev,
			...newSettings,
		}));
	};

	const updateLibrary = (newSettings) => {
		console.log("[settings] updateLibrary called", { newSettings });
		setLibrary((prev) => ({
			...prev,
			...newSettings,
		}));
	};

	const updateGallery = (newSettings) => {
		console.log("[settings] updateGallery called", { newSettings });
		setGallery((prev) => ({
			...prev,
			...newSettings,
		}));
	};

	const refreshSettings = useCallback(
		async (options?: { broadcast?: boolean; noCache?: boolean }) => {
			try {
				const settingsPath = `${API_BASE}/settings`;
				const url =
					typeof window === "undefined"
						? new URL(settingsPath, "http://localhost")
						: new URL(settingsPath, window.location.origin);
				// 항상 캐시를 우회하여 원본 응답을 받음
				url.searchParams.set("ts", Date.now().toString());

				console.log("[settings] refreshSettings fetch 시작", { url: url.toString(), options });

				const res = await fetch(url.toString(), {
					cache: "no-store",
					headers: {
						"Cache-Control": "no-cache",
					},
				});

				console.log("[settings] refreshSettings 응답", {
					status: res.status,
					ok: res.ok,
					headers: {
						"cache-control": res.headers.get("cache-control"),
						etag: res.headers.get("etag"),
					},
				});

				if (!res.ok) {
					setLoading(false);
					return;
				}

				const data = await res.json();

				console.log("[settings] refreshSettings 응답 데이터", {
					keys: Object.keys(data || {}),
					hasGeneral: data?.general !== undefined,
					hasMain: data?.main !== undefined,
					hasLibrary: data?.library !== undefined,
					hasGallery: data?.gallery !== undefined,
					general: data?.general,
					main: data?.main,
				});

				// 응답 데이터가 실제로 존재하는 경우에만 state 업데이트
				// 빈 응답이나 캐시된 오래된 응답으로 덮어쓰지 않음
				if (data && typeof data === "object") {
					if (data.general !== undefined) {
						console.log("[settings] setGeneral 업데이트", data.general);
						setGeneral(data.general);
					} else {
						console.log("[settings] setGeneral 건너뜀 (undefined)");
					}
					if (data.main !== undefined) {
						console.log("[settings] setMain 업데이트", data.main);
						setMain(data.main);
					} else {
						console.log("[settings] setMain 건너뜀 (undefined)");
					}
					if (data.library !== undefined) setLibrary(data.library);
					if (data.gallery !== undefined) setGallery(data.gallery);
				}
				setLoading(false);

				if (options?.broadcast && channelRef.current) {
					channelRef.current.postMessage({
						timestamp: Date.now(),
						source: clientIdRef.current,
					});
				}
			} catch (err) {
				console.error("[settings] refreshSettings 에러", err);
				setLoading(false);
			}
		},
		[]
	);

	useEffect(() => {
		console.log("[settings] initialSettings 수신", {
			hasGeneral: !!initialSettings?.general,
			hasMain: !!initialSettings?.main,
			hasLibrary: !!initialSettings?.library,
			hasGallery: !!initialSettings?.gallery,
			general: initialSettings?.general,
			main: initialSettings?.main,
		});
		if (initialSettings) {
			setLoading(false);
		} else {
			console.log("[settings] initialSettings 없음 → refreshSettings 호출");
			refreshSettings({ broadcast: false, noCache: true });
		}
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
