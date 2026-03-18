jest.mock("next/server", () => ({
	NextResponse: {
		json: jest.fn((data: unknown, init?: { status?: number }) => ({
			_body: data,
			_status: init?.status ?? 200,
		})),
	},
}));

import { jsonOk, jsonError } from "@/app/api/_lib/response";
import { NextResponse } from "next/server";

const mockedJson = NextResponse.json as jest.MockedFunction<typeof NextResponse.json>;

beforeEach(() => {
	mockedJson.mockClear();
});

describe("jsonOk", () => {
	it("NextResponse.json을 data와 함께 호출", () => {
		const data = { id: 1, name: "test" };
		jsonOk(data);
		expect(mockedJson).toHaveBeenCalledWith(data, undefined);
	});

	it("init 옵션 전달", () => {
		jsonOk({ ok: true }, { status: 201 });
		expect(mockedJson).toHaveBeenCalledWith({ ok: true }, { status: 201 });
	});

	it("배열 데이터", () => {
		const arr = [1, 2, 3];
		jsonOk(arr);
		expect(mockedJson).toHaveBeenCalledWith(arr, undefined);
	});

	it("null 데이터", () => {
		jsonOk(null);
		expect(mockedJson).toHaveBeenCalledWith(null, undefined);
	});
});

describe("jsonError", () => {
	it("error 메시지와 status 포함", () => {
		jsonError(400, "잘못된 요청");
		expect(mockedJson).toHaveBeenCalledWith(
			{ error: "잘못된 요청" },
			{ status: 400 }
		);
	});

	it("404 상태 코드", () => {
		jsonError(404, "찾을 수 없습니다");
		expect(mockedJson).toHaveBeenCalledWith(
			{ error: "찾을 수 없습니다" },
			{ status: 404 }
		);
	});

	it("500 서버 오류", () => {
		jsonError(500, "서버 오류");
		expect(mockedJson).toHaveBeenCalledWith(
			{ error: "서버 오류" },
			{ status: 500 }
		);
	});

	it("extra 필드 병합", () => {
		jsonError(429, "요청 초과", { retryAfter: 30 });
		expect(mockedJson).toHaveBeenCalledWith(
			{ error: "요청 초과", retryAfter: 30 },
			{ status: 429 }
		);
	});

	it("extra 없으면 error만", () => {
		jsonError(401, "인증 필요");
		const call = mockedJson.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(Object.keys(call)).toEqual(["error"]);
	});

	it("extra 여러 필드", () => {
		jsonError(422, "유효성 오류", { field: "email", code: "INVALID" });
		expect(mockedJson).toHaveBeenCalledWith(
			{ error: "유효성 오류", field: "email", code: "INVALID" },
			{ status: 422 }
		);
	});
});
