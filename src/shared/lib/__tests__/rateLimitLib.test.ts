jest.mock("server-only", () => ({}));
jest.mock("@/app/api/_lib/admin", () => ({ getDb: jest.fn() }));
jest.mock("firebase-admin", () => ({
	default: { firestore: { FieldValue: { serverTimestamp: jest.fn() } } },
	firestore: { FieldValue: { serverTimestamp: jest.fn() } },
}));

import { buildRateLimitKey } from "@/app/api/_lib/rateLimit";

const makeRequest = (ip?: string) =>
	({
		headers: {
			get: (h: string) => h === "x-forwarded-for" ? (ip ?? null) : null,
		},
	}) as unknown as Request;

const makeRequestMultiIp = (forwardedFor: string) =>
	({
		headers: { get: (h: string) => h === "x-forwarded-for" ? forwardedFor : null },
	}) as unknown as Request;

describe("buildRateLimitKey", () => {
	it("uid 있으면 'prefix:uid:{uid}' 형식 반환", () => {
		const key = buildRateLimitKey({ uid: "user-abc" }, makeRequest("1.2.3.4"), "memo");
		expect(key).toBe("memo:uid:user-abc");
	});

	it("prefix가 키에 포함됨", () => {
		expect(buildRateLimitKey({ uid: "u1" }, makeRequest(), "gallery")).toBe("gallery:uid:u1");
		expect(buildRateLimitKey({ uid: "u1" }, makeRequest(), "library")).toBe("library:uid:u1");
	});

	it("uid 없으면 'prefix:ip:{sha256}' 형식 반환", () => {
		const key = buildRateLimitKey(null, makeRequest("192.168.1.1"), "memo");
		expect(key).toMatch(/^memo:ip:[a-f0-9]{64}$/);
	});

	it("authContext=null → IP 기반 키", () => {
		const key = buildRateLimitKey(null, makeRequest("10.0.0.1"), "photoboard");
		expect(key.startsWith("photoboard:ip:")).toBe(true);
	});

	it("uid=null → IP 기반 키", () => {
		const key = buildRateLimitKey({ uid: null }, makeRequest("10.0.0.1"), "test");
		expect(key.startsWith("test:ip:")).toBe(true);
	});

	it("IP 헤더 없으면 'unknown' 해시 사용", () => {
		const key = buildRateLimitKey({ uid: null }, makeRequest(), "test");
		expect(key).toMatch(/^test:ip:[a-f0-9]{64}$/);
	});

	it("같은 IP → 항상 같은 키", () => {
		expect(buildRateLimitKey(null, makeRequest("5.5.5.5"), "k")).toBe(
			buildRateLimitKey(null, makeRequest("5.5.5.5"), "k")
		);
	});

	it("다른 IP → 다른 키", () => {
		expect(buildRateLimitKey(null, makeRequest("1.1.1.1"), "k")).not.toBe(
			buildRateLimitKey(null, makeRequest("2.2.2.2"), "k")
		);
	});

	it("x-forwarded-for 다중 IP → 첫 번째만 사용", () => {
		const key = buildRateLimitKey(null, makeRequestMultiIp("3.3.3.3, 4.4.4.4"), "k");
		const refKey = buildRateLimitKey(null, makeRequest("3.3.3.3"), "k");
		expect(key).toBe(refKey);
	});
});
