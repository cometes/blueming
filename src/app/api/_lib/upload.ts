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
	const bucket = getBucket();
	const results: UploadedFileInfo[] = [];

	for (const entry of files) {
		if (!(entry instanceof File)) {
			continue;
		}
		if (allowedMimeTypes && !allowedMimeTypes.includes(entry.type)) {
			throw new Error("지원되지 않는 파일 형식입니다.");
		}

		const arrayBuffer = await entry.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const safeName = sanitizeFilename(entry.name || "file");
		const storagePath = `${prefix}/${Date.now()}_${safeName}`;
		const fileRef = bucket.file(storagePath);

		await fileRef.save(buffer, {
			metadata: {
				contentType: entry.type || "application/octet-stream",
				cacheControl: "public, max-age=31536000, immutable",
			},
		});
		await fileRef.makePublic();

		const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
			bucket.name
		}/o/${encodeURIComponent(storagePath)}?alt=media`;

		results.push({
			url: publicUrl,
			filename: safeName,
			mimeType: entry.type || "application/octet-stream",
			storagePath,
		});
	}

	return results;
};
