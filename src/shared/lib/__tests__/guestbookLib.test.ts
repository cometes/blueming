jest.mock("server-only", () => ({}));
jest.mock("@/app/api/_lib/admin", () => ({ getDb: jest.fn() }));
jest.mock("firebase-admin", () => ({
	default: { firestore: { FieldValue: { serverTimestamp: jest.fn() } } },
	firestore: { FieldValue: { serverTimestamp: jest.fn() } },
}));

import {
	hashPin,
	verifyPin,
	parsePositiveInt,
	normalizeMessage,
	normalizeName,
	normalizeBoolean,
	normalizeImageUrls,
	getRequestIp,
	getRateLimitKey,
	MAX_MESSAGE_LENGTH,
	MAX_NAME_LENGTH,
	MAX_IMAGE_COUNT,
} from "@/app/api/_lib/guestbook";

// ─── hashPin / verifyPin ─────────────────────────────────────────────────────
describe("hashPin", () => {
	it("salt와 hash 반환", () => {
		const result = hashPin("1234");
		expect(result).toHaveProperty("salt");
		expect(result).toHaveProperty("hash");
		expect(typeof result.salt).toBe("string");
		expect(typeof result.hash).toBe("string");
	});

	it("같은 PIN + 같은 salt → 동일 hash", () => {
		const { salt, hash } = hashPin("1234");
		expect(hashPin("1234", salt).hash).toBe(hash);
	});

	it("다른 PIN → 다른 hash", () => {
		const { salt } = hashPin("1234");
		expect(hashPin("5678", salt).hash).not.toBe(hashPin("1234", salt).hash);
	});

	it("salt 지정 시 그 salt 사용", () => {
		expect(hashPin("1234", "mysalt").salt).toBe("mysalt");
	});
});

describe("verifyPin", () => {
	it("올바른 PIN → true", () => {
		const { salt, hash } = hashPin("9999");
		expect(verifyPin("9999", salt, hash)).toBe(true);
	});

	it("틀린 PIN → false", () => {
		const { salt, hash } = hashPin("9999");
		expect(verifyPin("0000", salt, hash)).toBe(false);
	});
});

// ─── parsePositiveInt ────────────────────────────────────────────────────────
describe("parsePositiveInt", () => {
	it("유효한 양의 정수", () => {
		expect(parsePositiveInt("5", 1)).toBe(5);
	});

	it("0 이하 → fallback", () => {
		expect(parsePositiveInt(0, 3)).toBe(3);
		expect(parsePositiveInt(-1, 3)).toBe(3);
	});

	it("NaN → fallback", () => {
		expect(parsePositiveInt("abc", 7)).toBe(7);
	});
});

// ─── normalizeMessage ────────────────────────────────────────────────────────
describe("normalizeMessage", () => {
	it("앞뒤 공백 제거", () => {
		expect(normalizeMessage("  안녕  ")).toBe("안녕");
	});

	it(`${MAX_MESSAGE_LENGTH}자 초과 시 자름`, () => {
		const long = "a".repeat(MAX_MESSAGE_LENGTH + 10);
		expect(normalizeMessage(long)).toHaveLength(MAX_MESSAGE_LENGTH);
	});

	it("비문자열 → 빈 문자열", () => {
		expect(normalizeMessage(null)).toBe("");
		expect(normalizeMessage(42)).toBe("");
	});
});

// ─── normalizeName ───────────────────────────────────────────────────────────
describe("normalizeName", () => {
	it("앞뒤 공백 제거", () => {
		expect(normalizeName("  홍길동  ")).toBe("홍길동");
	});

	it(`${MAX_NAME_LENGTH}자 초과 시 자름`, () => {
		const long = "이".repeat(MAX_NAME_LENGTH + 5);
		expect(normalizeName(long)).toHaveLength(MAX_NAME_LENGTH);
	});

	it("비문자열 → 빈 문자열", () => {
		expect(normalizeName(null)).toBe("");
	});
});

// ─── normalizeBoolean ────────────────────────────────────────────────────────
describe("normalizeBoolean", () => {
	it("true → true", () => {
		expect(normalizeBoolean(true)).toBe(true);
	});

	it("그 외 모두 → false", () => {
		expect(normalizeBoolean(false)).toBe(false);
		expect(normalizeBoolean(1)).toBe(false);
		expect(normalizeBoolean("true")).toBe(false);
		expect(normalizeBoolean(null)).toBe(false);
	});
});

// ─── normalizeImageUrls ──────────────────────────────────────────────────────
describe("normalizeImageUrls", () => {
	it("유효한 http/https URL만 허용", () => {
		const result = normalizeImageUrls([
			"https://example.com/img.png",
			"http://other.com/img.jpg",
		]);
		expect(result).toEqual([
			"https://example.com/img.png",
			"http://other.com/img.jpg",
		]);
	});

	it("비 http 프로토콜 필터링", () => {
		expect(normalizeImageUrls(["ftp://bad.com/img.png"])).toEqual([]);
	});

	it("잘못된 URL 필터링", () => {
		expect(normalizeImageUrls(["not-a-url"])).toEqual([]);
	});

	it("중복 제거", () => {
		const url = "https://example.com/img.png";
		expect(normalizeImageUrls([url, url])).toEqual([url]);
	});

	it(`${MAX_IMAGE_COUNT}개 초과 시 자름`, () => {
		const urls = Array.from(
			{ length: MAX_IMAGE_COUNT + 5 },
			(_, i) => `https://example.com/img${i}.png`
		);
		expect(normalizeImageUrls(urls)).toHaveLength(MAX_IMAGE_COUNT);
	});

	it("배열이 아닌 값 → 빈 배열", () => {
		expect(normalizeImageUrls(null)).toEqual([]);
		expect(normalizeImageUrls("string")).toEqual([]);
	});
});

// ─── getRequestIp ────────────────────────────────────────────────────────────
describe("getRequestIp", () => {
	const makeRequest = (forwardedFor?: string) =>
		({ headers: { get: (h: string) => h === "x-forwarded-for" ? (forwardedFor ?? null) : null } }) as unknown as Request;

	it("x-forwarded-for 헤더에서 첫 번째 IP 추출", () => {
		expect(getRequestIp(makeRequest("1.2.3.4, 5.6.7.8"))).toBe("1.2.3.4");
	});

	it("단일 IP", () => {
		expect(getRequestIp(makeRequest("9.9.9.9"))).toBe("9.9.9.9");
	});

	it("헤더 없으면 빈 문자열", () => {
		expect(getRequestIp(makeRequest())).toBe("");
	});
});

// ─── getRateLimitKey ─────────────────────────────────────────────────────────
describe("getRateLimitKey", () => {
	const makeRequest = (ip?: string) =>
		({ headers: { get: (h: string) => h === "x-forwarded-for" ? (ip ?? null) : null } }) as unknown as Request;

	it("uid 있으면 uid 기반 키", () => {
		expect(getRateLimitKey({ uid: "user123" }, makeRequest("1.2.3.4"))).toBe("uid:user123");
	});

	it("uid 없으면 IP 해시 기반 키", () => {
		const key = getRateLimitKey(null, makeRequest("1.2.3.4"));
		expect(key).toMatch(/^ip:[a-f0-9]{64}$/);
	});

	it("authContext null → IP 기반 키", () => {
		expect(getRateLimitKey(null, makeRequest("10.0.0.1")).startsWith("ip:")).toBe(true);
	});

	it("IP 없으면 'unknown' 해시 사용", () => {
		expect(getRateLimitKey({ uid: null }, makeRequest()).startsWith("ip:")).toBe(true);
	});
});
