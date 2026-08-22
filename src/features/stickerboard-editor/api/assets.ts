import type { StickerAsset, StickerAssetTab } from "@/features/stickerboard-editor/types";
import { API_BASE } from "@/shared/lib/http/client";

/** 에셋이 추가/변경되면 발행되는 이벤트. useStickerBoardAssets가 듣고 목록을 갱신한다. */
export const STICKER_ASSETS_CHANGED_EVENT = "stickerboard:assets-changed";

const notifyAssetsChanged = () => {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(STICKER_ASSETS_CHANGED_EVENT));
	}
};

// 크기는 부가 메타데이터일 뿐이므로 어떤 경우에도 업로드를 막지 않는다.
// (기존 구현은 decode 실패 시 이미 발생한 onload를 기다리며 영원히 멈출 수 있었음)
const readImageSize = async (
	file: File,
): Promise<{ width?: number; height?: number }> => {
	try {
		const url = URL.createObjectURL(file);
		try {
			return await new Promise<{ width?: number; height?: number }>(
				(resolve) => {
					const img = new Image();
					const timer = setTimeout(() => resolve({}), 3000);
					img.onload = () => {
						clearTimeout(timer);
						resolve({
							width: img.naturalWidth || undefined,
							height: img.naturalHeight || undefined,
						});
					};
					img.onerror = () => {
						clearTimeout(timer);
						resolve({});
					};
					img.src = url;
				},
			);
		} finally {
			URL.revokeObjectURL(url);
		}
	} catch {
		return {};
	}
};

export async function listStickerAssets(
	tab: StickerAssetTab,
): Promise<StickerAsset[]> {
	const response = await fetch(`${API_BASE}/sticker-assets?tab=${tab}`, {
		method: "GET",
		credentials: "include",
	});

	if (response.status === 401) {
		throw new Error("로그인이 필요합니다.");
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "스티커 자산을 불러오지 못했습니다.");
	}

	const data = await response.json();
	return data.items || [];
}

export async function createStickerAssetFromFile(
	file: File,
): Promise<StickerAsset> {
	const size = await readImageSize(file);
	const formData = new FormData();
	formData.append("file", file);
	if (file.name) {
		formData.append("name", file.name);
	}
	if (size.width) {
		formData.append("width", String(size.width));
	}
	if (size.height) {
		formData.append("height", String(size.height));
	}

	const response = await fetch(`${API_BASE}/sticker-assets`, {
		method: "POST",
		credentials: "include",
		body: formData,
	});

	if (response.status === 401) {
		throw new Error("로그인이 필요합니다.");
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "스티커 자산 생성에 실패했습니다.");
	}

	const asset = (await response.json()) as StickerAsset;
	notifyAssetsChanged();
	return asset;
}

export async function setStickerAssetFavorite(assetId: string, favorite: boolean) {
	const response = await fetch(`${API_BASE}/sticker-assets/${assetId}/favorite`, {
		method: "PATCH",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ favorite }),
	});

	if (response.status === 401) {
		throw new Error("로그인이 필요합니다.");
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "즐겨찾기 업데이트에 실패했습니다.");
	}
}

export async function markStickerAssetUsed(assetId: string) {
	const response = await fetch(`${API_BASE}/sticker-assets/${assetId}/used`, {
		method: "PATCH",
		credentials: "include",
	});

	if (response.status === 401) {
		throw new Error("로그인이 필요합니다.");
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "사용 시간 업데이트에 실패했습니다.");
	}
}

export async function deleteStickerAsset(asset: Pick<StickerAsset, "id">) {
	const response = await fetch(`${API_BASE}/sticker-assets/${asset.id}`, {
		method: "DELETE",
		credentials: "include",
	});

	if (response.status === 401) {
		throw new Error("로그인이 필요합니다.");
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "스티커 자산 삭제에 실패했습니다.");
	}
	notifyAssetsChanged();
}
