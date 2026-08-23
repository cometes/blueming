import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { getDb } from "@/app/api/_lib/admin";
import { requireManager } from "@/app/api/_lib/auth";
import {
	extractYouTubePlaylistId,
	extractYouTubeVideoId,
} from "@/app/api/_lib/settingsMain";

export const runtime = "nodejs";

const PLAYLIST_MAX_ITEMS = 200;
const FETCH_TIMEOUT_MS = 10_000;

interface ResolvedTrack {
	videoId: string;
	title: string;
	thumbnail: string;
	artist: string;
}

const videoThumbnail = (videoId: string) =>
	`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

const fetchWithTimeout = async (url: string) => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timeoutId);
	}
};

/** 개별 영상: oEmbed로 제목·채널명 조회 (API 키 불필요) */
const resolveVideo = async (videoId: string): Promise<ResolvedTrack> => {
	const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
		`https://www.youtube.com/watch?v=${videoId}`,
	)}&format=json`;
	const response = await fetchWithTimeout(oembedUrl);
	if (!response.ok) {
		throw new Error("영상 정보를 가져오지 못했습니다. (비공개/삭제된 영상일 수 있어요)");
	}
	const data = (await response.json()) as {
		title?: string;
		author_name?: string;
	};
	return {
		videoId,
		title: data.title || "제목 없음",
		thumbnail: videoThumbnail(videoId),
		artist: data.author_name || "",
	};
};

/** 관리자의 YouTube Data API 키 조회 (userSecrets) */
const getYouTubeApiKey = async (uid: string): Promise<string | null> => {
	const snapshot = await getDb()
		.collection("userSecrets")
		.doc(uid)
		.collection("youtube")
		.doc("dataApi")
		.get();
	const key = snapshot.exists ? snapshot.data()?.apiKey : null;
	return typeof key === "string" && key.trim() ? key.trim() : null;
};

/** 재생목록: Data API playlistItems로 곡 목록 전개 (API 키 필요) */
const resolvePlaylist = async (
	playlistId: string,
	apiKey: string,
): Promise<ResolvedTrack[]> => {
	const tracks: ResolvedTrack[] = [];
	let pageToken = "";

	while (tracks.length < PLAYLIST_MAX_ITEMS) {
		const params = new URLSearchParams({
			part: "snippet",
			playlistId,
			maxResults: "50",
			key: apiKey,
		});
		if (pageToken) params.set("pageToken", pageToken);

		const response = await fetchWithTimeout(
			`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
		);
		if (!response.ok) {
			if (response.status === 403) {
				throw new Error(
					"YouTube API 키가 거부되었습니다. 키와 YouTube Data API v3 활성화 여부를 확인해주세요.",
				);
			}
			if (response.status === 404) {
				throw new Error("재생목록을 찾을 수 없습니다. (비공개 재생목록일 수 있어요)");
			}
			throw new Error("재생목록을 가져오지 못했습니다.");
		}

		const data = (await response.json()) as {
			nextPageToken?: string;
			items?: Array<{
				snippet?: {
					title?: string;
					videoOwnerChannelTitle?: string;
					resourceId?: { videoId?: string };
					thumbnails?: { high?: { url?: string }; default?: { url?: string } };
				};
			}>;
		};

		for (const item of data.items ?? []) {
			const snippet = item.snippet;
			const videoId = snippet?.resourceId?.videoId;
			const title = snippet?.title || "";
			// 삭제/비공개 영상은 제목이 placeholder로 옴 — 스킵
			if (!videoId || title === "Private video" || title === "Deleted video") {
				continue;
			}
			tracks.push({
				videoId,
				title,
				thumbnail:
					snippet?.thumbnails?.high?.url ??
					snippet?.thumbnails?.default?.url ??
					videoThumbnail(videoId),
				artist: snippet?.videoOwnerChannelTitle || "",
			});
			if (tracks.length >= PLAYLIST_MAX_ITEMS) break;
		}

		pageToken = data.nextPageToken ?? "";
		if (!pageToken) break;
	}

	return tracks;
};

/**
 * 유튜브 URL을 곡 정보로 변환.
 * - 영상 URL → oEmbed(키 불필요)로 { kind: "video", track } 1건
 * - 재생목록 URL → Data API(관리자 키 필요)로 { kind: "playlist", playlistId, tracks[] }
 */
export async function POST(req: NextRequest) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const body = (await req.json().catch(() => ({}))) as { url?: unknown };
		const url = typeof body.url === "string" ? body.url.trim() : "";
		if (!url) {
			return jsonError(400, "URL이 필요합니다.");
		}

		const videoId = extractYouTubeVideoId(url);
		const playlistId = extractYouTubePlaylistId(url);

		// watch?v=...&list=... 형태는 재생목록 임포트를 우선
		if (playlistId) {
			const apiKey = await getYouTubeApiKey(auth.auth.uid);
			if (!apiKey) {
				return jsonError(
					400,
					"재생목록 임포트에는 YouTube Data API 키가 필요합니다. 음악 설정에서 키를 등록해주세요.",
				);
			}
			const tracks = await resolvePlaylist(playlistId, apiKey);
			if (tracks.length === 0) {
				return jsonError(400, "재생목록에서 가져올 수 있는 곡이 없습니다.");
			}
			return jsonOk({ kind: "playlist", playlistId, tracks });
		}

		if (videoId) {
			const track = await resolveVideo(videoId);
			return jsonOk({ kind: "video", track });
		}

		return jsonError(400, "유튜브 영상 또는 재생목록 URL이 아닙니다.");
	} catch (error) {
		if ((error as Error)?.name === "AbortError") {
			return jsonError(504, "유튜브 응답이 시간 초과되었습니다.");
		}
		const message =
			error instanceof Error ? error.message : "곡 정보를 가져오지 못했습니다.";
		console.error("music resolve error:", error);
		return jsonError(500, message);
	}
}
