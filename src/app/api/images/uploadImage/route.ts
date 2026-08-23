import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { uploadFormDataFiles } from "@/app/api/_lib/upload";
import { requireManager } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
];

export async function POST(req: NextRequest) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	const formData = await req.formData();
	const files = await uploadFormDataFiles(formData, {
		prefix: "library/create/images",
		allowedMimeTypes: ALLOWED_MIME_TYPES,
	});
	if (files.length === 0) {
		return jsonError(400, "업로드할 파일이 없습니다.");
	}

	return jsonOk({
		message: "파일 업로드 성공!",
		files: files.map((file) => ({
			fieldname: "file",
			filename: file.filename,
			mimeType: file.mimeType,
			url: file.url,
			// 삭제/정리 시 URL 역파싱 없이 쓸 수 있도록 노출
			storagePath: file.storagePath,
		})),
	});
}
