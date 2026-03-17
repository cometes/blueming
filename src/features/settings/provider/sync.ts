"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { API_BASE } from "@/shared/lib/http/client";
import type {
	LibrarySettings,
	MainSettings,
	SettingsGeneralSection,
	SettingsRefreshOptions,
	SettingsSnapshot,
} from "@/features/settings/types";
import type { GallerySettings } from "@/types/gallery";

interface UseSettingsSyncArgs {
	initialSettings?: SettingsSnapshot | null;
	setGeneral: Dispatch<SetStateAction<SettingsGeneralSection | undefined>>;
	setMain: Dispatch<SetStateAction<MainSettings | undefined>>;
	setLibrary: Dispatch<SetStateAction<LibrarySettings | undefined>>;
	setGallery: Dispatch<SetStateAction<GallerySettings | undefined>>;
	setLoading: Dispatch<SetStateAction<boolean>>;
}

export const useSettingsSync = ({
	initialSettings,
	setGeneral,
	setMain,
	setLibrary,
	setGallery,
	setLoading,
}: UseSettingsSyncArgs) => {
	const channelRef = useRef<BroadcastChannel | null>(null);
	const clientIdRef = useRef(
		typeof crypto !== "undefined" && "randomUUID" in crypto
			? crypto.randomUUID()
			: `client-${Math.random().toString(36).slice(2, 10)}`
	);

	const refreshSettings = useCallback(
		async (options?: SettingsRefreshOptions) => {
			try {
				const settingsPath = `${API_BASE}/settings`;
				const url =
					typeof window === "undefined"
						? new URL(settingsPath, "http://localhost")
						: new URL(settingsPath, window.location.origin);

				if (options?.noCache ?? true) {
					url.searchParams.set("ts", Date.now().toString());
				}

				const res = await fetch(url.toString(), {
					cache: "no-store",
					headers: {
						"Cache-Control": "no-cache",
					},
				});

				if (!res.ok) {
					setLoading(false);
					return;
				}

				const data = (await res.json()) as SettingsSnapshot;
				if (data && typeof data === "object") {
					if (data.general !== undefined) setGeneral(data.general);
					if (data.main !== undefined) setMain(data.main);
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
			} catch {
				setLoading(false);
			}
		},
		[setGallery, setGeneral, setLibrary, setLoading, setMain]
	);

	useEffect(() => {
		if (initialSettings) {
			setLoading(false);
		} else {
			void refreshSettings({ broadcast: false, noCache: true });
		}

		const channel = new BroadcastChannel("settingsRefetch");
		channelRef.current = channel;
		channel.onmessage = (event) => {
			if (event?.data?.source === clientIdRef.current) {
				return;
			}
			void refreshSettings({ broadcast: false });
		};

		return () => {
			channelRef.current = null;
			channel.close();
		};
	}, [initialSettings, refreshSettings, setLoading]);

	return { refreshSettings };
};
