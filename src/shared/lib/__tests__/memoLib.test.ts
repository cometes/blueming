jest.mock("server-only", () => ({}));
jest.mock("@/app/api/_lib/admin", () => ({ getDb: jest.fn() }));

import {
	parsePositiveInt,
	normalizeTitle,
	normalizeContent,
	normalizeTags,
	normalizeVisibility,
	normalizeImageUrls,
	matchesQuery,
	MAX_TITLE_LENGTH,
	MAX_CONTENT_LENGTH,
	MAX_TAGS,
	MAX_IMAGE_COUNT,
} from "@/app/api/_lib/memo";

describe("parsePositiveInt", () => {
	it("유효한 양의 정수 반환", () => {
		expect(parsePositiveInt("5", 1)).toBe(5);
		expect(parsePositiveInt(10, 1)).toBe(10);
	});

	it("0 이하는 fallback 반환", () => {
		expect(parsePositiveInt("0", 3)).toBe(3);
		expect(parsePositiveInt("-1", 3)).toBe(3);
	});

	it("NaN, 비문자열은 fallback 반환", () => {
		expect(parsePositiveInt("abc", 7)).toBe(7);
		expect(parsePositiveInt(null, 7)).toBe(7);
		expect(parsePositiveInt(undefined, 7)).toBe(7);
	});
});

describe("normalizeTitle", () => {
	it("문자열 트리밍", () => {
		expect(normalizeTitle("  제목  ")).toBe("제목");
	});

	it(`${MAX_TITLE_LENGTH}자 초과 시 자름`, () => {
		const long = "a".repeat(MAX_TITLE_LENGTH + 10);
		expect(normalizeTitle(long)).toHaveLength(MAX_TITLE_LENGTH);
	});

	it("비문자열 → 빈 문자열", () => {
		expect(normalizeTitle(123)).toBe("");
		expect(normalizeTitle(null)).toBe("");
		expect(normalizeTitle(undefined)).toBe("");
	});
});

describe("normalizeContent", () => {
	it("문자열 트리밍", () => {
		expect(normalizeContent("  내용  ")).toBe("내용");
	});

	it(`${MAX_CONTENT_LENGTH}자 초과 시 자름`, () => {
		const long = "b".repeat(MAX_CONTENT_LENGTH + 10);
		expect(normalizeContent(long)).toHaveLength(MAX_CONTENT_LENGTH);
	});

	it("비문자열 → 빈 문자열", () => {
		expect(normalizeContent(null)).toBe("");
	});
});

describe("normalizeTags", () => {
	it("배열의 태그 정규화 및 중복 제거", () => {
		const result = normalizeTags(["태그1", "태그2", "태그1"]);
		expect(result).toEqual(["태그1", "태그2"]);
	});

	it("# 접두사 제거", () => {
		expect(normalizeTags(["#hello", "#world"])).toEqual(["hello", "world"]);
	});

	it("빈 문자열, 공백 필터링", () => {
		expect(normalizeTags(["", "  ", "유효"])).toEqual(["유효"]);
	});

	it(`${MAX_TAGS}개 초과 시 자름`, () => {
		const tags = Array.from({ length: MAX_TAGS + 5 }, (_, i) => `tag${i}`);
		expect(normalizeTags(tags)).toHaveLength(MAX_TAGS);
	});

	it("배열이 아닌 값 → 빈 배열", () => {
		expect(normalizeTags(null)).toEqual([]);
		expect(normalizeTags("string")).toEqual([]);
	});
});

describe("normalizeVisibility", () => {
	it("'secret' 허용", () => {
		expect(normalizeVisibility("secret")).toBe("secret");
	});

	it("'protected' 허용", () => {
		expect(normalizeVisibility("protected")).toBe("protected");
	});

	it("그 외 → 'public'", () => {
		expect(normalizeVisibility("private")).toBe("public");
		expect(normalizeVisibility(null)).toBe("public");
		expect(normalizeVisibility(undefined)).toBe("public");
	});
});

describe("normalizeImageUrls", () => {
	it("유효한 http/https URL만 허용", () => {
		const result = normalizeImageUrls([
			"https://example.com/img.png",
			"http://other.com/photo.jpg",
		]);
		expect(result).toEqual([
			"https://example.com/img.png",
			"http://other.com/photo.jpg",
		]);
	});

	it("잘못된 URL 필터링", () => {
		expect(normalizeImageUrls(["not-a-url", "ftp://bad.com"])).toEqual([]);
	});

	it("중복 URL 제거", () => {
		const url = "https://example.com/img.png";
		expect(normalizeImageUrls([url, url])).toEqual([url]);
	});

	it(`${MAX_IMAGE_COUNT}개 초과 시 자름`, () => {
		const urls = Array.from(
			{ length: MAX_IMAGE_COUNT + 3 },
			(_, i) => `https://example.com/img${i}.png`
		);
		expect(normalizeImageUrls(urls)).toHaveLength(MAX_IMAGE_COUNT);
	});

	it("배열이 아닌 값 → 빈 배열", () => {
		expect(normalizeImageUrls(null)).toEqual([]);
		expect(normalizeImageUrls("string")).toEqual([]);
	});
});

describe("matchesQuery", () => {
	const makeMemo = (overrides: Partial<{
		title: string;
		content: string | null;
		author: { name?: string } | null;
		tags: string[];
	}> = {}) => ({
		id: "1",
		title: overrides.title ?? "기본 제목",
		content: overrides.content !== undefined ? overrides.content : "기본 내용",
		visibility: "public",
		author: overrides.author !== undefined ? overrides.author : null,
		authorId: null,
		tags: overrides.tags ?? [],
		imageUrls: [],
		replyCount: 0,
		createdAt: null,
		updatedAt: null,
	});

	it("빈 query → 항상 true", () => {
		expect(matchesQuery(makeMemo(), "")).toBe(true);
	});

	it("제목으로 검색", () => {
		const memo = makeMemo({ title: "리액트 튜토리얼" });
		expect(matchesQuery(memo, "리액트")).toBe(true);
		expect(matchesQuery(memo, "뷰")).toBe(false);
	});

	it("내용으로 검색", () => {
		const memo = makeMemo({ content: "Next.js App Router 설명" });
		expect(matchesQuery(memo, "app router")).toBe(true);
	});

	it("태그로 검색", () => {
		const memo = makeMemo({ tags: ["typescript", "react"] });
		expect(matchesQuery(memo, "typescript")).toBe(true);
	});

	it("작성자 이름으로 검색", () => {
		const memo = makeMemo({ author: { name: "홍길동" } });
		expect(matchesQuery(memo, "홍길동")).toBe(true);
	});

	it("대소문자 무시", () => {
		const memo = makeMemo({ title: "Hello World" });
		expect(matchesQuery(memo, "hello world")).toBe(true);
	});
});
