import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { uploadBuffer } from "@/app/api/_lib/upload";
import { requireManager } from "@/app/api/_lib/auth";
import { isBlockedImportHost } from "@/app/api/_lib/urlGuard";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT_MS = 10_000;

const EXT_BY_TYPE: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/gif": ".gif",
	"image/webp": ".webp",
	"image/avif": ".avif",
	"image/svg+xml": ".svg",
};

const filenameFromUrl = (url: string, ext: string) => {
	try {
		const last = new URL(url).pathname.split("/").pop() ?? "";
		const base = decodeURIComponent(last).replace(/\.[^/.]+$/, "").trim();
		return (base || "imported") + ext;
	} catch {
		return `imported${ext}`;
	}
};

/**
 * 외부 이미지 URL을 받아 자체 Storage로 복사한다 (핫링크 깨짐 방지).
 * SSRF 방어: http(s)만 허용, 사설/루프백/링크로컬 호스트 차단,
 * 리다이렉트 최종 URL도 재검증. 실패 시 클라이언트는 원본 URL로 폴백한다.
 */
export async function POST(req: NextRequest) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	try {
		const body = (await req.json().catch(() => ({}))) as { url?: unknown };
		const rawUrl = typeof body.url === "string" ? body.url.trim() : "";
		if (!rawUrl) {
			return jsonError(400, "url이 필요합니다.");
		}

		let parsed: URL;
		try {
			parsed = new URL(rawUrl);
		} catch {
			return jsonError(400, "올바른 URL이 아닙니다.");
		}
		if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
			return jsonError(400, "http(s) URL만 지원합니다.");
		}
		if (isBlockedImportHost(parsed.hostname)) {
			return jsonError(400, "허용되지 않는 호스트입니다.");
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		let response: Response;
		try {
			response = await fetch(parsed.toString(), {
				signal: controller.signal,
				headers: { Accept: "image/*" },
			});
		} finally {
			clearTimeout(timeoutId);
		}
		if (!response.ok) {
			return jsonError(400, "이미지를 가져오지 못했습니다.");
		}
		// 리다이렉트를 따라갔다면 최종 URL의 호스트도 재검증
		try {
			const finalUrl = new URL(response.url || parsed.toString());
			if (isBlockedImportHost(finalUrl.hostname)) {
				return jsonError(400, "허용되지 않는 호스트입니다.");
			}
		} catch {
			return jsonError(400, "이미지를 가져오지 못했습니다.");
		}

		const contentType = (response.headers.get("content-type") ?? "")
			.split(";")[0]
			.trim()
			.toLowerCase();
		if (!contentType.startsWith("image/")) {
			return jsonError(400, "이미지 콘텐츠가 아닙니다.");
		}
		const declaredLength = Number(response.headers.get("content-length") ?? 0);
		if (declaredLength > MAX_BYTES) {
			return jsonError(400, "이미지가 너무 큽니다. (최대 10MB)");
		}

		// 스트림을 상한까지만 읽는다 (Content-Length가 없거나 거짓일 수 있음)
		const reader = response.body?.getReader();
		if (!reader) {
			return jsonError(400, "이미지를 가져오지 못했습니다.");
		}
		const chunks: Uint8Array[] = [];
		let received = 0;
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			received += value.byteLength;
			if (received > MAX_BYTES) {
				await reader.cancel();
				return jsonError(400, "이미지가 너무 큽니다. (최대 10MB)");
			}
			chunks.push(value);
		}
		const buffer = Buffer.concat(chunks);
		if (buffer.length === 0) {
			return jsonError(400, "이미지를 가져오지 못했습니다.");
		}

		const ext = EXT_BY_TYPE[contentType] ?? "";
		const uploaded = await uploadBuffer(buffer, {
			prefix: "library/create/images",
			filename: filenameFromUrl(parsed.toString(), ext),
			contentType,
		});

		return jsonOk({ url: uploaded.url, storagePath: uploaded.storagePath });
	} catch (error) {
		if ((error as Error)?.name === "AbortError") {
			return jsonError(504, "이미지 가져오기가 시간 초과되었습니다.");
		}
		console.error("importFromUrl error:", error);
		return jsonError(500, "이미지 가져오기에 실패했습니다.");
	}
}
