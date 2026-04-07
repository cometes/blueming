jest.mock("server-only", () => ({}));
jest.mock("@/app/api/_lib/admin", () => ({ getDb: jest.fn() }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "abcd1234efgh5678") }));

import {
	parsePositiveInt,
	buildQueryTokens,
	matchesQuery,
	sortItems,
	buildSearchTokens,
	normalizeSlug,
	normalizeStringArray,
} from "@/app/api/_lib/library";

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────
const makeItem = (overrides: Partial<{
	title: string;
	subtitle: string;
	slug: string | null;
	tags: string[];
	pinned: boolean;
	createdAt: string | null;
}> = {}) => ({
	id: "1",
	title: overrides.title ?? "제목",
	subtitle: overrides.subtitle ?? "",
	author: null,
	authorPhotoURL: null,
	slug: overrides.slug ?? null,
	createdAt: overrides.createdAt ?? null,
	allow: "public",
	thumbnail: null,
	series: null,
	tags: overrides.tags ?? [],
	pinned: overrides.pinned ?? false,
	commentCount: 0,
	viewCount: 0,
});

// ─── parsePositiveInt ────────────────────────────────────────────────────────
describe("parsePositiveInt", () => {
	it("유효한 양의 정수 반환", () => {
		expect(parsePositiveInt("10", 1)).toBe(10);
		expect(parsePositiveInt(3, 1)).toBe(3);
	});

	it("0 이하 → fallback", () => {
		expect(parsePositiveInt("0", 5)).toBe(5);
		expect(parsePositiveInt(-1, 5)).toBe(5);
	});

	it("NaN, 비정수 → fallback", () => {
		expect(parsePositiveInt("abc", 7)).toBe(7);
		expect(parsePositiveInt(null, 7)).toBe(7);
	});
});

// ─── buildQueryTokens ────────────────────────────────────────────────────────
describe("buildQueryTokens", () => {
	it("공백으로 분리", () => {
		expect(buildQueryTokens("hello world")).toEqual(["hello", "world"]);
	});

	it("특수문자 구분자로 분리", () => {
		expect(buildQueryTokens("next.js,react")).toEqual(["next", "js", "react"]);
		expect(buildQueryTokens("a-b_c")).toEqual(["a", "b", "c"]);
	});

	it("소문자로 변환", () => {
		expect(buildQueryTokens("Hello World")).toEqual(["hello", "world"]);
	});

	it("빈 토큰 필터링", () => {
		expect(buildQueryTokens("  a   b  ")).toEqual(["a", "b"]);
	});

	it("최대 10개 토큰", () => {
		const query = Array.from({ length: 15 }, (_, i) => `word${i}`).join(" ");
		expect(buildQueryTokens(query)).toHaveLength(10);
	});

	it("빈 문자열 → 빈 배열", () => {
		expect(buildQueryTokens("")).toEqual([]);
	});
});

// ─── matchesQuery ────────────────────────────────────────────────────────────
describe("matchesQuery", () => {
	it("빈 query → 항상 true", () => {
		expect(matchesQuery(makeItem(), "")).toBe(true);
	});

	it("제목으로 검색", () => {
		const item = makeItem({ title: "Next.js 튜토리얼" });
		expect(matchesQuery(item, "next.js")).toBe(true);
		expect(matchesQuery(item, "vue")).toBe(false);
	});

	it("subtitle로 검색", () => {
		const item = makeItem({ subtitle: "리액트 기초" });
		expect(matchesQuery(item, "리액트")).toBe(true);
	});

	it("slug로 검색", () => {
		const item = makeItem({ slug: "react-hooks-guide" });
		expect(matchesQuery(item, "hooks")).toBe(true);
	});

	it("태그로 검색", () => {
		const item = makeItem({ tags: ["typescript", "react"] });
		expect(matchesQuery(item, "typescript")).toBe(true);
	});

	it("토큰 기반 부분 검색 (점 구분)", () => {
		const item = makeItem({ title: "next js tutorial" });
		expect(matchesQuery(item, "next.js")).toBe(true);
	});
});

// ─── sortItems ───────────────────────────────────────────────────────────────
describe("sortItems", () => {
	const pinned = makeItem({ pinned: true, title: "B", createdAt: "2024-01-01T00:00:00Z" });
	const unpinnedA = makeItem({ pinned: false, title: "A", createdAt: "2024-03-01T00:00:00Z" });
	const unpinnedB = makeItem({ pinned: false, title: "C", createdAt: "2024-01-15T00:00:00Z" });

	it("pinned 항목이 항상 상단", () => {
		const result = sortItems([unpinnedA, pinned], "newest");
		expect(result[0].pinned).toBe(true);
	});

	it("sort='newest' → 최신순 정렬", () => {
		const result = sortItems([unpinnedB, unpinnedA], "newest");
		expect(result[0].title).toBe("A"); // 2024-03-01 더 최신
	});

	it("sort='oldest' → 오래된순 정렬", () => {
		const result = sortItems([unpinnedA, unpinnedB], "oldest");
		expect(result[0].title).toBe("C"); // 2024-01-15
	});

	it("sort='title' → 제목 알파벳순, pinned 우선", () => {
		const result = sortItems([unpinnedB, pinned, unpinnedA], "title");
		expect(result[0].pinned).toBe(true); // pinned 먼저
		expect(result[1].title).toBe("A");
		expect(result[2].title).toBe("C");
	});

	it("원본 배열을 변경하지 않음", () => {
		const items = [unpinnedA, unpinnedB];
		const copy = [...items];
		sortItems(items, "newest");
		expect(items).toEqual(copy);
	});
});

// ─── buildSearchTokens ───────────────────────────────────────────────────────
describe("buildSearchTokens", () => {
	it("title, subtitle, slug, tags 합산 토큰화", () => {
		const tokens = buildSearchTokens({
			title: "Next.js Guide",
			subtitle: "React",
			slug: "nextjs-guide",
			tags: ["frontend"],
		});
		expect(tokens).toContain("next");
		expect(tokens).toContain("js");
		expect(tokens).toContain("guide");
		expect(tokens).toContain("react");
		expect(tokens).toContain("frontend");
		expect(tokens).toContain("nextjs");
	});

	it("중복 토큰 제거", () => {
		const tokens = buildSearchTokens({
			title: "react",
			subtitle: "react",
			slug: null,
			tags: ["react"],
		});
		expect(tokens.filter((t) => t === "react")).toHaveLength(1);
	});

	it("최대 30개 토큰", () => {
		const tags = Array.from({ length: 20 }, (_, i) => `unique${i}`);
		const tokens = buildSearchTokens({ title: "a b c d e f g h i j k l m n o", subtitle: "", slug: null, tags });
		expect(tokens.length).toBeLessThanOrEqual(30);
	});
});

// ─── normalizeSlug ───────────────────────────────────────────────────────────
describe("normalizeSlug", () => {
	it("공백을 하이픈으로", () => {
		expect(normalizeSlug("hello world")).toBe("hello-world");
	});

	it("소문자 변환", () => {
		expect(normalizeSlug("Hello-World")).toBe("hello-world");
	});

	it("한글 허용", () => {
		expect(normalizeSlug("나의 블로그")).toBe("나의-블로그");
	});

	it("특수문자 제거", () => {
		expect(normalizeSlug("hello!@#world")).toBe("helloworld");
	});

	it("앞뒤 하이픈 제거", () => {
		expect(normalizeSlug("-hello-")).toBe("hello");
	});

	it("연속 하이픈 단일화", () => {
		expect(normalizeSlug("hello---world")).toBe("hello-world");
	});

	it("비문자열 → null", () => {
		expect(normalizeSlug(null)).toBeNull();
		expect(normalizeSlug(123)).toBeNull();
	});

	it("빈 문자열 / 공백만 → null", () => {
		expect(normalizeSlug("")).toBeNull();
		expect(normalizeSlug("   ")).toBeNull();
	});

	it("특수문자만 → null", () => {
		expect(normalizeSlug("!!!")).toBeNull();
	});
});

// ─── normalizeStringArray ────────────────────────────────────────────────────
describe("normalizeStringArray", () => {
	it("문자열 배열 그대로 반환", () => {
		expect(normalizeStringArray(["a", "b", "c"])).toEqual(["a", "b", "c"]);
	});

	it("비문자열 요소 필터링", () => {
		expect(normalizeStringArray(["a", 1, null, "b"])).toEqual(["a", "b"]);
	});

	it("공백만인 문자열 필터링", () => {
		expect(normalizeStringArray(["  ", "valid"])).toEqual(["valid"]);
	});

	it("배열이 아닌 값 → 빈 배열", () => {
		expect(normalizeStringArray(null)).toEqual([]);
		expect(normalizeStringArray("string")).toEqual([]);
	});
});
