import axios from "axios";

export const API_BASE = "/api";

// 전역 axios 기본값 설정 - 세션 쿠키 전송을 위해 필요
axios.defaults.withCredentials = true;

export const apiClient = axios.create({
	baseURL: API_BASE,
	withCredentials: true,
});

export const getApiErrorMessage = (error: unknown, fallback: string) => {
	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		const apiMessage =
			error.response?.data?.error || error.response?.data?.message;
		if (apiMessage) {
			return status ? `${status} ${apiMessage}` : apiMessage;
		}
	}
	return fallback;
};
