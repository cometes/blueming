import "server-only";

type MusicPlayerItem = {
	id: string;
	title: string;
	videoId?: string;
	playlistId?: string;
};

type MusicPlayerSettings = {
	enabled: boolean;
	items: MusicPlayerItem[];
	defaultItemId?: string;
};

type PhotoboardSettings = {
	postsPerRow: number;
	writePermission: "admin" | "manager" | "member";
};

type MemoSettings = {
	postsPerRow: number;
	writePermission: "admin" | "manager" | "member";
};

const YT_VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const YT_PLAYLIST_ID_RE = /^[a-zA-Z0-9_-]{10,}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const validateUrl = (url: unknown): url is string => {
	if (typeof url !== "string" || !url) return false;
	try {
		const parsed = new URL(url);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
};

const extractYouTubeVideoId = (input: unknown): string | null => {
	if (typeof input !== "string") return null;
	const raw = input.trim();
	if (!raw) return null;
	if (YT_VIDEO_ID_RE.test(raw)) return raw;
	try {
		const u = new URL(raw);
		const host = u.hostname.replace(/^www\./, "");
		if (host === "youtu.be") {
			const id = u.pathname.split("/").filter(Boolean)[0] || "";
			return YT_VIDEO_ID_RE.test(id) ? id : null;
		}
		if (host === "youtube.com" || host === "m.youtube.com") {
			if (u.pathname === "/watch") {
				const id = u.searchParams.get("v") || "";
				return YT_VIDEO_ID_RE.test(id) ? id : null;
			}
			if (u.pathname.startsWith("/shorts/")) {
				const id = u.pathname.split("/").filter(Boolean)[1] || "";
				return YT_VIDEO_ID_RE.test(id) ? id : null;
			}
			if (u.pathname.startsWith("/embed/")) {
				const id = u.pathname.split("/").filter(Boolean)[1] || "";
				return YT_VIDEO_ID_RE.test(id) ? id : null;
			}
		}
		return null;
	} catch {
		return null;
	}
};

const extractYouTubePlaylistId = (input: unknown): string | null => {
	if (typeof input !== "string") return null;
	const raw = input.trim();
	if (!raw) return null;
	if (YT_PLAYLIST_ID_RE.test(raw)) return raw;
	try {
		const u = new URL(raw);
		const listId = u.searchParams.get("list") || "";
		return YT_PLAYLIST_ID_RE.test(listId) ? listId : null;
	} catch {
		return null;
	}
};

const clampNumber = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

export const validateMusicPlayerSettings = (
	value: unknown
): MusicPlayerSettings | null => {
	if (!isRecord(value)) return null;

	const enabled = value.enabled;
	const items = value.items;
	const defaultItemId = value.defaultItemId;

	if (typeof enabled !== "boolean") return null;
	if (!Array.isArray(items)) return null;
	if (defaultItemId !== undefined && typeof defaultItemId !== "string")
		return null;

	const normalizedItems: MusicPlayerItem[] = [];
	for (const raw of items) {
		if (!isRecord(raw)) return null;
		const id = raw.id;
		const title = raw.title;
		const videoId = raw.videoId;
		const playlistId = raw.playlistId;
		const url = raw.url;

		if (typeof id !== "string" || !id.trim()) return null;
		if (typeof title !== "string") return null;

		const normalizedVideoId =
			extractYouTubeVideoId(videoId) ??
			(validateUrl(url) ? extractYouTubeVideoId(url) : null);
		const normalizedPlaylistId =
			extractYouTubePlaylistId(playlistId) ??
			(validateUrl(url) ? extractYouTubePlaylistId(url) : null);
		if (!normalizedVideoId && !normalizedPlaylistId) return null;

		normalizedItems.push({
			id: id.trim(),
			title: title.trim(),
			videoId: normalizedVideoId ?? undefined,
			playlistId: normalizedPlaylistId ?? undefined,
		});
	}

	const normalizedDefaultItemId =
		typeof defaultItemId === "string"
			? defaultItemId.trim() || undefined
			: undefined;

	return {
		enabled,
		items: normalizedItems,
		defaultItemId: normalizedDefaultItemId,
	};
};

export const validatePhotoboardSettings = (
	value: unknown
): PhotoboardSettings | null => {
	if (!isRecord(value)) return null;
	const postsPerRow = Number(value.postsPerRow);
	const writePermission = value.writePermission;
	if (!Number.isFinite(postsPerRow)) return null;
	if (
		writePermission !== "admin" &&
		writePermission !== "manager" &&
		writePermission !== "member"
	)
		return null;

	return {
		postsPerRow: clampNumber(Math.floor(postsPerRow), 1, 5),
		writePermission,
	};
};

export const validateMemoSettings = (value: unknown): MemoSettings | null => {
	if (!isRecord(value)) return null;
	const postsPerRow = Number(value.postsPerRow);
	const writePermission = value.writePermission;
	if (!Number.isFinite(postsPerRow)) return null;
	if (
		writePermission !== "admin" &&
		writePermission !== "manager" &&
		writePermission !== "member"
	)
		return null;

	return {
		postsPerRow: clampNumber(Math.floor(postsPerRow), 1, 5),
		writePermission,
	};
};

export const validateWeatherClockSettings = (
	value: unknown
): {
	enabled: boolean;
	city: string;
	backgroundImage?: string;
	backgroundImageCity?: string;
} | null => {
	if (!isRecord(value)) return null;

	const enabled = value.enabled;
	const city = value.city;
	const backgroundImageRaw = value.backgroundImage;
	const backgroundImageCityRaw = value.backgroundImageCity;

	if (typeof enabled !== "boolean") return null;
	if (typeof city !== "string" || !city.trim()) return null;

	let backgroundImage: string | undefined;
	if (typeof backgroundImageRaw === "string") {
		const trimmed = backgroundImageRaw.trim();
		if (!trimmed) {
			backgroundImage = "";
		} else if (validateUrl(trimmed)) {
			backgroundImage = trimmed;
		} else {
			return null;
		}
	}

	let backgroundImageCity: string | undefined;
	if (typeof backgroundImageCityRaw === "string") {
		backgroundImageCity = backgroundImageCityRaw.trim();
	}

	return {
		enabled,
		city: city.trim(),
		...(backgroundImage !== undefined ? { backgroundImage } : {}),
		...(backgroundImageCity !== undefined ? { backgroundImageCity } : {}),
	};
};
