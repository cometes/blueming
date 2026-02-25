import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/app/api/_lib/response";
import { uploadFormDataFiles } from "@/app/api/_lib/upload";
import { requireManager } from "@/app/api/_lib/auth";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = [".woff", ".woff2", ".ttf", ".otf", ".eot"];

const hasAllowedExtension = (name: string) => {
	const lower = name.toLowerCase();
	return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

export async function POST(req: NextRequest) {
	const auth = await requireManager();
	if (!auth.ok) {
		return jsonError(auth.status, auth.error);
	}

	const formData = await req.formData();
	const entries = formData.getAll("file");
	if (entries.length === 0) {
		return jsonError(400, "업로드할 파일이 없습니다.");
	}
	for (const entry of entries) {
		if (entry instanceof File && !hasAllowedExtension(entry.name)) {
			return jsonError(400, "지원되지 않는 폰트 파일 확장자입니다.");
		}
	}

	const files = await uploadFormDataFiles(formData, {
		prefix: "settings/fonts",
	});

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
