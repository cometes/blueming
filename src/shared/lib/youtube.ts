// 유튜브 URL 파싱 공용 유틸 (서버·클라이언트 겸용 순수 함수)
// 원본: app/api/_lib/settingsMain.ts — 스레드 게시판 컴포저 미리보기 공용을 위해 승격.

const YT_VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

/** 유튜브 영상 URL(watch/youtu.be/shorts/embed) 또는 11자 ID에서 videoId 추출 */
export const extractYouTubeVideoId = (input: unknown): string | null => {
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

/** 본문 텍스트에서 첫 번째 유튜브 영상 URL의 videoId 추출 (스레드 자동 임베드용) */
export const extractFirstYouTubeVideoIdFromContent = (
	content: string,
): string | null => {
	const urlPattern = /https?:\/\/[^\s<>"']+/g;
	for (const match of content.matchAll(urlPattern)) {
		const videoId = extractYouTubeVideoId(match[0]);
		if (videoId) return videoId;
	}
	return null;
};
