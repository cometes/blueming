import { getAuthHeader } from "@/shared/lib/auth/client";
import {
	getApiErrorMessage,
	httpClient,
	isHttpError,
} from "@/shared/lib/http/client";
import { revalidateSettingsCache } from "@/shared/lib/http/revalidateSettings";
import type {
	CustomLayout,
	DdayData,
	DdayDisplayMode,
	MusicPlayerSettings,
	ImageWidgetSettings,
	MemoSettings,
	Notice,
	PhotoboardSettings,
	ProfileData,
	SlideData,
	WeatherClockSettings,
} from "@/features/settings/types";
import type { GallerySettings } from "@/features/gallery/types";
import type { StickerBoardSettings } from "@/features/stickerboard-editor/model";

const withSettingsRevalidation = async <T>(request: () => Promise<T>) => {
	const response = await request();
	await revalidateSettingsCache();
	return response;
};

export const setCustomLayout = async (value: CustomLayout) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post(
				"/settings/main/customLayout",
				{ value },
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "레이아웃 저장에 실패했습니다."),
		);
	}
};

export const setSettingsNotice = async (value: Notice) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post(
				"/settings/main/notice",
				{ value },
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "공지 설정 저장에 실패했습니다."));
	}
};

export const setSettingsGallery = async (gallery: GallerySettings) => {
	try {
		const headers = await getAuthHeader();
		await withSettingsRevalidation(async () => {
			await httpClient.patch("/settings", { gallery }, { headers });
		});
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "갤러리 설정 업데이트에 실패했습니다."),
		);
	}
};

export const setSettingsMainPhotoboard = async (
	value: PhotoboardSettings,
) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post(
				"/settings/main/photoboard",
				{ value },
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		if (isHttpError(error)) {
			throw new Error(
				error.response?.data?.error ||
					error.response?.data?.message ||
					"포토보드 설정 저장에 실패했습니다.",
			);
		}
		throw error;
	}
};

export const setSettingsProfile = async (value: ProfileData) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post("/settings/main/profile", { value }, { headers });
			return response.data;
		});
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "프로필 저장에 실패했습니다."));
	}
};

export const setSettingsMainWeatherClock = async (value: WeatherClockSettings) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post("/settings/main/weatherClock", { value }, { headers });
			return response.data;
		});
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "날씨/시계 설정 저장에 실패했습니다."));
	}
};

export const setSettingsMainMusicPlayer = async (value: MusicPlayerSettings) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post(
				"/settings/main/musicPlayer",
				{ value },
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "음악 설정 저장에 실패했습니다."));
	}
};

export const setSettingsMainDday = async (
	value: DdayData[],
	displayMode?: DdayDisplayMode,
) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post(
				"/settings/main/dday",
				{ value, ...(displayMode !== undefined && { displayMode }) },
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "디데이 설정 저장에 실패했습니다."));
	}
};

export const setSettingsMainSlide = async (value: SlideData[]) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post("/settings/main/slide", { value }, { headers });
			return response.data;
		});
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "슬라이드 설정 저장에 실패했습니다."));
	}
};

export const setSettingsMainMemo = async (value: MemoSettings) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post(
				"/settings/main/memo",
				{ value },
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		throw new Error(getApiErrorMessage(error, "메모 설정 저장에 실패했습니다."));
	}
};

export const setSettingsMainImageWidget = async (
	value: ImageWidgetSettings,
) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post(
				"/settings/main/imageWidget",
				{ value },
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "이미지 위젯 설정 저장에 실패했습니다."),
		);
	}
};

export const setSettingsMainStickerBoard = async (
	value: StickerBoardSettings,
) => {
	try {
		const headers = await getAuthHeader();
		return await withSettingsRevalidation(async () => {
			const response = await httpClient.post(
				"/settings/main/stickerBoard",
				{ value },
				{ headers },
			);
			return response.data;
		});
	} catch (error) {
		throw new Error(
			getApiErrorMessage(error, "스티커보드 저장에 실패했습니다."),
		);
	}
};
