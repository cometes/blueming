import { getAuthHeader } from "@/shared/lib/auth/client";
import { API_BASE } from "@/shared/lib/http/client";

export interface UploadRequestOptions {
	endpoint?: string;
	files: File[];
	includeAuth?: boolean;
}

const sanitizeUploadFile = (file: File) =>
	new File([file], encodeURIComponent(file.name), {
		type: file.type,
	});

export const buildUploadEndpoint = (path: string) =>
	path.startsWith("http") ? path : `${API_BASE}${path}`;

export const uploadFiles = async ({
	endpoint = buildUploadEndpoint("/images/uploadImage"),
	files,
	includeAuth = true,
}: UploadRequestOptions): Promise<string[]> => {
	if (files.length === 0) return [];

	const formData = new FormData();
	files.forEach((file) => {
		formData.append("file", sanitizeUploadFile(file));
	});

	const headers = includeAuth ? await getAuthHeader() : {};
	const response = await fetch(endpoint, {
		method: "POST",
		headers,
		body: formData,
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const data = await response.json();
	const urls = Array.isArray(data.files)
		? data.files.map((file: { url?: string }) => file?.url).filter(Boolean)
		: [];

	if (urls.length === 0) {
		throw new Error("서버에서 올바른 응답을 받지 못했습니다.");
	}

	return urls as string[];
};

export const uploadSingleFile = async (
	file: File,
	options?: Omit<UploadRequestOptions, "files">,
) => {
	const [url] = await uploadFiles({
		...options,
		files: [file],
	});
	return url;
};

export const resolveUploadedImageUrls = <T extends { file?: File; url: string }>(
	images: T[],
	uploadedUrls: string[],
) => {
	let uploadIndex = 0;
	return images.reduce<string[]>((acc, image) => {
		if (image.file) {
			const nextUrl = uploadedUrls[uploadIndex];
			uploadIndex += 1;
			if (nextUrl) acc.push(nextUrl);
		} else if (image.url && !image.url.startsWith("blob:")) {
			acc.push(image.url);
		}
		return acc;
	}, []);
};
