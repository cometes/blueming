import { generateSlug, isValidSlug, normalizeSlug } from "../slug";

describe("generateSlug", () => {
	it("영문 공백을 하이픈으로 변환", () => {
		expect(generateSlug("Hello World")).toBe("hello-world");
	});

	it("한글 지원", () => {
		expect(generateSlug("안녕 세계")).toBe("안녕-세계");
	});

	it("한글 + 영문 혼합", () => {
		expect(generateSlug("Hello 한글 World")).toBe("hello-한글-world");
	});

	it("특수문자 제거", () => {
		expect(generateSlug("Hello! @World#")).toBe("hello-world");
	});

	it("연속 공백 하나의 하이픈으로", () => {
		expect(generateSlug("Hello   World")).toBe("hello-world");
	});

	it("연속 하이픈 하나로", () => {
		expect(generateSlug("Hello--World")).toBe("hello-world");
	});

	it("앞뒤 하이픈 제거", () => {
		expect(generateSlug("-Hello World-")).toBe("hello-world");
	});

	it("앞뒤 공백 제거", () => {
		expect(generateSlug("  Hello World  ")).toBe("hello-world");
	});

	it("50자 초과 시 잘라냄", () => {
		const longTitle = "a".repeat(60);
		expect(generateSlug(longTitle).length).toBeLessThanOrEqual(50);
	});

	it("빈 문자열 반환 (빈 입력)", () => {
		expect(generateSlug("")).toBe("");
	});

	it("특수문자만 있으면 빈 문자열", () => {
		expect(generateSlug("!!!@@@###")).toBe("");
	});
});

describe("isValidSlug", () => {
	it("유효한 영문 slug", () => {
		expect(isValidSlug("hello-world")).toBe(true);
	});

	it("유효한 숫자 포함 slug", () => {
		expect(isValidSlug("post-123")).toBe(true);
	});

	it("유효한 한글 slug", () => {
		expect(isValidSlug("안녕-세계")).toBe(true);
	});

	it("빈 문자열은 허용 (UUID 사용)", () => {
		expect(isValidSlug("")).toBe(true);
	});

	it("50자 초과 시 유효하지 않음", () => {
		expect(isValidSlug("a".repeat(51))).toBe(false);
	});

	it("공백 포함 시 유효하지 않음", () => {
		expect(isValidSlug("hello world")).toBe(false);
	});

	it("특수문자 포함 시 유효하지 않음", () => {
		expect(isValidSlug("hello@world")).toBe(false);
	});
});

describe("normalizeSlug", () => {
	it("대문자 소문자로 변환", () => {
		expect(normalizeSlug("Hello-World")).toBe("hello-world");
	});

	it("앞뒤 공백 제거", () => {
		expect(normalizeSlug("  hello  ")).toBe("hello");
	});

	it("특수문자 제거 (하이픈 제외)", () => {
		expect(normalizeSlug("hello!world")).toBe("helloworld");
	});

	it("연속 하이픈 단일화", () => {
		expect(normalizeSlug("hello--world")).toBe("hello-world");
	});

	it("앞뒤 하이픈 제거", () => {
		expect(normalizeSlug("-hello-")).toBe("hello");
	});

	it("빈 입력 빈 문자열 반환", () => {
		expect(normalizeSlug("")).toBe("");
	});

	it("50자 이하로 잘라냄", () => {
		expect(normalizeSlug("a".repeat(60)).length).toBeLessThanOrEqual(50);
	});
});
