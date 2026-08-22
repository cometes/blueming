import {
	API_BASE,
	HttpError,
	getApiErrorMessage,
	httpClient,
	isHttpError,
} from "@/shared/lib/http/client";

const mockFetch = (response: {
	ok: boolean;
	status?: number;
	contentType?: string;
	body?: unknown;
}) => {
	const fn = jest.fn().mockResolvedValue({
		ok: response.ok,
		status: response.status ?? (response.ok ? 200 : 500),
		headers: new Headers(
			response.contentType ? { "content-type": response.contentType } : {}
		),
		json: async () => response.body,
		text: async () => JSON.stringify(response.body ?? ""),
	});
	global.fetch = fn as unknown as typeof fetch;
	return fn;
};

describe("httpClient", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("상대 경로에 API_BASE를 붙이고 JSON을 파싱한다", async () => {
		const fn = mockFetch({
			ok: true,
			contentType: "application/json",
			body: { hello: "world" },
		});

		const response = await httpClient.get<{ hello: string }>("/gallery");

		expect(fn).toHaveBeenCalledWith(
			`${API_BASE}/gallery`,
			expect.objectContaining({ method: "GET", credentials: "include" })
		);
		expect(response.data).toEqual({ hello: "world" });
		expect(response.status).toBe(200);
	});

	it("절대 URL은 그대로 사용한다", async () => {
		const fn = mockFetch({ ok: true, contentType: "application/json", body: {} });

		await httpClient.get("https://example.com/x");

		expect(fn).toHaveBeenCalledWith(
			"https://example.com/x",
			expect.anything()
		);
	});

	it("params를 쿼리 스트링으로 직렬화하고 undefined/null은 스킵한다", async () => {
		const fn = mockFetch({ ok: true, contentType: "application/json", body: {} });

		await httpClient.get("/memo", {
			params: { page: 2, limit: 10, search: undefined, tag: null },
		});

		expect(fn).toHaveBeenCalledWith(`${API_BASE}/memo?page=2&limit=10`, expect.anything());
	});

	it("POST body를 JSON으로 직렬화하고 Content-Type을 설정한다", async () => {
		const fn = mockFetch({ ok: true, contentType: "application/json", body: {} });

		await httpClient.post("/guestbook", { message: "안녕" });

		const [, init] = fn.mock.calls[0];
		expect(init.body).toBe(JSON.stringify({ message: "안녕" }));
		expect(init.headers["Content-Type"]).toBe("application/json");
	});

	it("DELETE는 config.data를 body로 보낸다 (axios 호환)", async () => {
		const fn = mockFetch({ ok: true, contentType: "application/json", body: {} });

		await httpClient.delete("/guestbook/1", { data: { pin: "1234" } });

		const [, init] = fn.mock.calls[0];
		expect(init.method).toBe("DELETE");
		expect(init.body).toBe(JSON.stringify({ pin: "1234" }));
	});

	it("비 2xx 응답이면 HttpError를 던지고 body를 담는다", async () => {
		mockFetch({
			ok: false,
			status: 400,
			contentType: "application/json",
			body: { success: false, error: "잘못된 요청" },
		});

		const error = await httpClient.get("/x").catch((e) => e);

		expect(isHttpError(error)).toBe(true);
		expect((error as HttpError).response.status).toBe(400);
		expect((error as HttpError).response.data).toEqual({
			success: false,
			error: "잘못된 요청",
		});
	});
});

describe("getApiErrorMessage", () => {
	it("HttpError의 error 필드를 우선 반환한다", () => {
		const error = new HttpError("failed", {
			status: 400,
			data: { error: "서버 에러 메시지" },
		});
		expect(getApiErrorMessage(error, "폴백")).toBe("서버 에러 메시지");
	});

	it("error가 없으면 message 필드를 반환한다", () => {
		const error = new HttpError("failed", {
			status: 400,
			data: { message: "메시지 필드" },
		});
		expect(getApiErrorMessage(error, "폴백")).toBe("메시지 필드");
	});

	it("HttpError가 아니면 폴백을 반환한다", () => {
		expect(getApiErrorMessage(new Error("boom"), "폴백")).toBe("폴백");
		expect(getApiErrorMessage(undefined, "폴백")).toBe("폴백");
	});

	it("body에 메시지가 없으면 폴백을 반환한다", () => {
		const error = new HttpError("failed", { status: 500, data: {} });
		expect(getApiErrorMessage(error, "폴백")).toBe("폴백");
	});
});
