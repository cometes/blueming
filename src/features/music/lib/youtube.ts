// 클라이언트용 유튜브 URL 파서 (서버 settingsMain.ts 파서의 경량판 —
// 구 형식으로 저장된 항목의 url 필드에서 재생 정보를 파생할 때 사용)

const YT_VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

export const videoIdFromUrl = (url: string | undefined): string | undefined => {
	if (!url) return undefined;
	try {
		const u = new URL(url);
		const host = u.hostname.replace(/^www\./, "");
		if (host === "youtu.be") {
			const id = u.pathname.split("/").filter(Boolean)[0] || "";
			return YT_VIDEO_ID_RE.test(id) ? id : undefined;
		}
		if (host === "youtube.com" || host === "m.youtube.com") {
			if (u.pathname === "/watch") {
				const id = u.searchParams.get("v") || "";
				return YT_VIDEO_ID_RE.test(id) ? id : undefined;
			}
			const seg = u.pathname.split("/").filter(Boolean);
			if ((seg[0] === "shorts" || seg[0] === "embed") && seg[1]) {
				return YT_VIDEO_ID_RE.test(seg[1]) ? seg[1] : undefined;
			}
		}
	} catch {
		// 무시
	}
	return undefined;
};

export const playlistIdFromUrl = (
	url: string | undefined,
): string | undefined => {
	if (!url) return undefined;
	try {
		const listId = new URL(url).searchParams.get("list") || "";
		// RD*(믹스/라디오) 목록은 IFrame API에서 재생 불가 — 제외
		if (!listId || listId.startsWith("RD")) return undefined;
		return /^[a-zA-Z0-9_-]{10,}$/.test(listId) ? listId : undefined;
	} catch {
		return undefined;
	}
};
