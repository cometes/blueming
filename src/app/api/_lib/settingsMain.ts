import "server-only";
import { extractYouTubeVideoId } from "@/shared/lib/youtube";

export { extractYouTubeVideoId };

type MusicPlayerItem = {
	id: string;
	title: string;
	videoId?: string;
	playlistId?: string;
	thumbnail?: string;
	artist?: string;
};

type MusicPlayerSettings = {
	enabled: boolean;
	items: MusicPlayerItem[];
	defaultItemId?: string;
	/** 방문자 초기 볼륨(0~100). 방문자가 직접 조절하면 그 값이 우선 */
	defaultVolume?: number;
};

type PhotoboardSettings = {
	postsPerRow: number;
	writePermission: "admin" | "manager" | "member";
};

type MemoSettings = {
	postsPerRow: number;
	writePermission: "admin" | "manager" | "member";
	/** 답글 권한: author = 메모 작성자만(기본), member = 활성 회원 누구나 */
	replyPermission: "author" | "member";
};

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

// extractYouTubeVideoId는 shared/lib/youtube.ts로 승격 (아래 re-export)

export const extractYouTubePlaylistId = (input: unknown): string | null => {
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

		const thumbnail = raw.thumbnail;
		const artist = raw.artist;
		const normalizedArtist =
			typeof artist === "string" && artist.trim()
				? artist.trim().slice(0, 100)
				: null;

		// 주의: Firestore는 undefined 값을 거부하므로 없는 필드는 키 자체를 뺀다
		normalizedItems.push({
			id: id.trim(),
			title: title.trim(),
			...(normalizedVideoId ? { videoId: normalizedVideoId } : {}),
			...(normalizedPlaylistId ? { playlistId: normalizedPlaylistId } : {}),
			...(validateUrl(thumbnail) ? { thumbnail } : {}),
			...(normalizedArtist ? { artist: normalizedArtist } : {}),
		});
	}

	const normalizedDefaultItemId =
		typeof defaultItemId === "string"
			? defaultItemId.trim() || undefined
			: undefined;

	const defaultVolumeRaw = Number(value.defaultVolume);
	const defaultVolume = Number.isFinite(defaultVolumeRaw)
		? clampNumber(Math.round(defaultVolumeRaw), 0, 100)
		: null;

	return {
		enabled,
		items: normalizedItems,
		...(normalizedDefaultItemId ? { defaultItemId: normalizedDefaultItemId } : {}),
		...(defaultVolume !== null ? { defaultVolume } : {}),
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

	const replyPermission =
		value.replyPermission === "member" ? "member" : "author";

	return {
		postsPerRow: clampNumber(Math.floor(postsPerRow), 1, 5),
		writePermission,
		replyPermission,
	};
};

type ThreadsSettings = {
	writePermission: "admin" | "manager" | "member";
};

export const validateThreadsSettings = (
	value: unknown
): ThreadsSettings | null => {
	if (!isRecord(value)) return null;
	const writePermission = value.writePermission;
	if (
		writePermission !== "admin" &&
		writePermission !== "manager" &&
		writePermission !== "member"
	)
		return null;
	return { writePermission };
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
