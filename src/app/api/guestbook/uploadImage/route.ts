import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { uploadFormDataFiles } from "@/app/api/_lib/upload";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
];

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const files = await uploadFormDataFiles(formData, {
		prefix: "guestbook/images",
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
		})),
	});
}
