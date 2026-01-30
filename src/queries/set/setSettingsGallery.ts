import { apiClient, getApiErrorMessage } from "@/queries/apiClient";
import { getAuthHeader } from "@/queries/getAuthHeader";
import { revalidateSettingsCache } from "@/queries/revalidateSettings";
import type { GallerySettings } from "@/types/gallery";

export const setSettingsGallery = async (
	payload: GallerySettings,
): Promise<void> => {
	try {
		const headers = await getAuthHeader();
		await apiClient.patch(
			"/settings",
			{ gallery: payload },
			{ headers },
		);
		await revalidateSettingsCache();
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "갤러리 설정 업데이트에 실패했습니다."),
		);
	}
};
