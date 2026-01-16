import axios from "axios";

export const API_BASE =
	process.env.NEXT_PUBLIC_API_BASE ??
	"https://api-w5buphcleq-du.a.run.app";

export const apiClient = axios.create({
	baseURL: API_BASE,
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
