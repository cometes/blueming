jest.mock("server-only", () => ({}));
jest.mock("@/app/api/_lib/admin", () => ({ getDb: jest.fn() }));

import {
	hashPin,
	verifyPin,
	parsePositiveInt,
	normalizeMessage,
	normalizeName,
	normalizeBoolean,
	normalizeImageUrls,
	MAX_MESSAGE_LENGTH,
	MAX_NAME_LENGTH,
	MAX_IMAGE_COUNT,
} from "@/app/api/_lib/libraryComments";

describe("hashPin", () => {
	it("salt와 hash를 반환", () => {
		const result = hashPin("1234");
		expect(result).toHaveProperty("salt");
		expect(result).toHaveProperty("hash");
		expect(typeof result.salt).toBe("string");
		expect(typeof result.hash).toBe("string");
	});

	it("같은 PIN + 같은 salt → 동일한 hash", () => {
		const { salt, hash } = hashPin("1234");
		const second = hashPin("1234", salt);
		expect(second.hash).toBe(hash);
	});

	it("다른 PIN → 다른 hash", () => {
		const { salt } = hashPin("1234");
		const other = hashPin("5678", salt);
		const original = hashPin("1234", salt);
		expect(other.hash).not.toBe(original.hash);
	});

	it("salt를 제공하면 그 salt 그대로 사용", () => {
		const salt = "mysalt";
		const result = hashPin("1234", salt);
		expect(result.salt).toBe(salt);
	});
});

describe("verifyPin", () => {
	it("올바른 PIN → true", () => {
		const { salt, hash } = hashPin("9876");
		expect(verifyPin("9876", salt, hash)).toBe(true);
	});

	it("틀린 PIN → false", () => {
		const { salt, hash } = hashPin("9876");
		expect(verifyPin("0000", salt, hash)).toBe(false);
	});
});

describe("parsePositiveInt", () => {
	it("유효한 양의 정수 반환", () => {
		expect(parsePositiveInt("3", 1)).toBe(3);
		expect(parsePositiveInt(10, 1)).toBe(10);
	});

	it("0 이하 → fallback", () => {
		expect(parsePositiveInt("0", 5)).toBe(5);
		expect(parsePositiveInt(-2, 5)).toBe(5);
	});

	it("NaN → fallback", () => {
		expect(parsePositiveInt("abc", 5)).toBe(5);
		expect(parsePositiveInt(null, 5)).toBe(5);
	});
});

describe("normalizeMessage", () => {
	it("문자열 트리밍", () => {
		expect(normalizeMessage("  hello  ")).toBe("hello");
	});

	it(`${MAX_MESSAGE_LENGTH}자 초과 시 자름`, () => {
		const long = "x".repeat(MAX_MESSAGE_LENGTH + 10);
		expect(normalizeMessage(long)).toHaveLength(MAX_MESSAGE_LENGTH);
	});

	it("비문자열 → 빈 문자열", () => {
		expect(normalizeMessage(null)).toBe("");
		expect(normalizeMessage(undefined)).toBe("");
		expect(normalizeMessage(42)).toBe("");
	});
});

describe("normalizeName", () => {
	it("문자열 트리밍", () => {
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

describe("normalizeBoolean", () => {
	it("true → true", () => {
		expect(normalizeBoolean(true)).toBe(true);
	});

	it("그 외 → false", () => {
		expect(normalizeBoolean(false)).toBe(false);
		expect(normalizeBoolean(1)).toBe(false);
		expect(normalizeBoolean("true")).toBe(false);
		expect(normalizeBoolean(null)).toBe(false);
	});
});

describe("normalizeImageUrls", () => {
	it("유효한 http/https URL만 허용", () => {
		const result = normalizeImageUrls([
			"https://example.com/a.png",
			"http://other.com/b.jpg",
		]);
		expect(result).toEqual([
			"https://example.com/a.png",
			"http://other.com/b.jpg",
		]);
	});

	it("비 http 프로토콜 필터링", () => {
		expect(normalizeImageUrls(["ftp://bad.com/img.png"])).toEqual([]);
		expect(normalizeImageUrls(["javascript:alert(1)"])).toEqual([]);
	});

	it("잘못된 URL 필터링", () => {
		expect(normalizeImageUrls(["not-a-url"])).toEqual([]);
	});

	it("중복 URL 제거", () => {
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
