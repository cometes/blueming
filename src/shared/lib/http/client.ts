export const API_BASE = "/api";

export interface HttpRequestConfig {
	headers?: Record<string, string>;
	/** 쿼리 스트링으로 직렬화 (undefined/null 값은 스킵) */
	params?: Record<string, string | number | boolean | undefined | null>;
	/** DELETE 요청의 body (axios 호환) */
	data?: unknown;
	signal?: AbortSignal;
}

export interface HttpResponse<T = unknown> {
	data: T;
	status: number;
	headers: Headers;
}

interface HttpErrorResponse {
	status: number;
	// 서버 응답 body. 소비처가 error.response?.data?.message 형태로 접근하므로
	// axios와 동일하게 any로 둔다.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any;
}

export class HttpError extends Error {
	readonly response: HttpErrorResponse;

	constructor(message: string, response: HttpErrorResponse) {
		super(message);
		this.name = "HttpError";
		this.response = response;
	}
}

const buildUrl = (
	url: string,
	params?: HttpRequestConfig["params"]
) => {
	const base = /^https?:\/\//.test(url) ? url : `${API_BASE}${url}`;
	if (!params) return base;

	const searchParams = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value === undefined || value === null) return;
		searchParams.set(key, String(value));
	});
	const query = searchParams.toString();
	return query ? `${base}${base.includes("?") ? "&" : "?"}${query}` : base;
};

const parseBody = async (response: Response): Promise<unknown> => {
	if (response.status === 204) return undefined;
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		try {
			return await response.json();
		} catch {
			return undefined;
		}
	}
	return response.text();
};

const request = async <T>(
	method: string,
	url: string,
	body?: unknown,
	config: HttpRequestConfig = {}
): Promise<HttpResponse<T>> => {
	const headers: Record<string, string> = { ...(config.headers ?? {}) };
	let payload: BodyInit | undefined;

	if (body !== undefined && body !== null) {
		if (body instanceof FormData) {
			payload = body;
		} else {
			if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
			payload = JSON.stringify(body);
		}
	}

	const response = await fetch(buildUrl(url, config.params), {
		method,
		headers,
		body: payload,
		credentials: "include",
		signal: config.signal,
	});

	const data = await parseBody(response);

	if (!response.ok) {
		throw new HttpError(`Request failed with status ${response.status}`, {
			status: response.status,
			data,
		});
	}

	return { data: data as T, status: response.status, headers: response.headers };
};

export const httpClient = {
	get: <T = unknown>(url: string, config?: HttpRequestConfig) =>
		request<T>("GET", url, undefined, config),
	post: <T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig) =>
		request<T>("POST", url, body, config),
	put: <T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig) =>
		request<T>("PUT", url, body, config),
	patch: <T = unknown>(url: string, body?: unknown, config?: HttpRequestConfig) =>
		request<T>("PATCH", url, body, config),
	delete: <T = unknown>(url: string, config?: HttpRequestConfig) =>
		request<T>("DELETE", url, config?.data, config),
};

export const http = httpClient;

export const isHttpError = (error: unknown): error is HttpError =>
	error instanceof HttpError;

export const getApiErrorMessage = (error: unknown, fallback: string) => {
	if (isHttpError(error)) {
		const data = error.response.data as
			| { error?: unknown; message?: unknown }
			| undefined;
		const apiMessage =
			(typeof data?.error === "string" && data.error) ||
			(typeof data?.message === "string" && data.message);
		if (apiMessage) {
			return apiMessage;
		}
	}
	return fallback;
};
