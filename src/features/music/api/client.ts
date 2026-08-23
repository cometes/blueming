import { httpClient, getApiErrorMessage } from "@/shared/lib/http/client";

export interface ResolvedTrack {
	videoId: string;
	title: string;
	thumbnail: string;
	artist: string;
}

export type ResolveResult =
	| { kind: "video"; track: ResolvedTrack }
	| { kind: "playlist"; playlistId: string; tracks: ResolvedTrack[] };

/** 유튜브 URL → 곡 정보 (영상: 키 불필요 / 재생목록: Data API 키 필요) */
export const resolveMusicUrl = async (url: string): Promise<ResolveResult> => {
	try {
		const response = await httpClient.post<ResolveResult>("/music/resolve", {
			url,
		});
		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "곡 정보를 가져오지 못했습니다."));
	}
};

export const fetchYouTubeKeyStatus = async (): Promise<{
	hasKey: boolean;
	keyHint?: string | null;
}> => {
	const response = await httpClient.get<{ hasKey: boolean; keyHint?: string | null }>(
		"/settings/youtube-key",
	);
	return response.data;
};

export const saveYouTubeKey = async (
	apiKey: string,
): Promise<{ keyHint: string }> => {
	try {
		const response = await httpClient.post<{ keyHint: string }>(
			"/settings/youtube-key",
			{ apiKey },
		);
		return response.data;
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "API 키 저장에 실패했습니다."));
	}
};

export const deleteYouTubeKey = async (): Promise<void> => {
	await httpClient.delete("/settings/youtube-key");
};
