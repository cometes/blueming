import "server-only";
import { getBucket } from "@/app/api/_lib/admin";

export type UploadedFileInfo = {
	url: string;
	filename: string;
	mimeType: string;
	storagePath: string;
};

const sanitizeFilename = (name: string) =>
	name
		.replace(/[<>:"/\\|?*]/g, "")
		.replace(/\s+/g, "_")
		.trim();

/** 버퍼를 Storage에 저장하고 공개 URL을 반환 (업로드 라우트 공통 경로 규칙) */
export const uploadBuffer = async (
	buffer: Buffer,
	{
		prefix,
		filename,
		contentType,
	}: {
		prefix: string;
		filename: string;
		contentType: string;
	}
): Promise<UploadedFileInfo> => {
	const bucket = getBucket();
	const safeName = sanitizeFilename(filename || "file");
	const storagePath = `${prefix}/${Date.now()}_${safeName}`;
	const fileRef = bucket.file(storagePath);

	await fileRef.save(buffer, {
		metadata: {
			contentType: contentType || "application/octet-stream",
			cacheControl: "public, max-age=31536000, immutable",
		},
	});
	await fileRef.makePublic();

	const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
		bucket.name
	}/o/${encodeURIComponent(storagePath)}?alt=media`;

	return {
		url: publicUrl,
		filename: safeName,
		mimeType: contentType || "application/octet-stream",
		storagePath,
	};
};

export const uploadFormDataFiles = async (
	formData: FormData,
	{
		fieldName = "file",
		prefix,
		allowedMimeTypes,
	}: {
		fieldName?: string;
		prefix: string;
		allowedMimeTypes?: string[];
	}
): Promise<UploadedFileInfo[]> => {
	const files = formData.getAll(fieldName);
	const results: UploadedFileInfo[] = [];

	for (const entry of files) {
		if (!(entry instanceof File)) {
			continue;
		}
		if (allowedMimeTypes && !allowedMimeTypes.includes(entry.type)) {
			throw new Error("지원되지 않는 파일 형식입니다.");
		}

		const arrayBuffer = await entry.arrayBuffer();
		results.push(
			await uploadBuffer(Buffer.from(arrayBuffer), {
				prefix,
				filename: entry.name || "file",
				contentType: entry.type || "application/octet-stream",
			})
		);
	}

	return results;
};
