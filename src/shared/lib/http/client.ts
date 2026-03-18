import axios from "axios";

export const API_BASE = "/api";

axios.defaults.withCredentials = true;

export const httpClient = axios.create({
	baseURL: API_BASE,
	withCredentials: true,
});

export const http = {
	get: httpClient.get.bind(httpClient),
	post: httpClient.post.bind(httpClient),
	put: httpClient.put.bind(httpClient),
	patch: httpClient.patch.bind(httpClient),
	delete: httpClient.delete.bind(httpClient),
};

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

export const isHttpError = axios.isAxiosError;

