// @tiptap/html은 ESM 의존성(zeed-dom) 때문에 jest에서 직접 로드할 수 없어
// richText.test.ts와 동일한 방식으로 모킹한다.
jest.mock("@tiptap/html", () => ({
	generateHTML: jest.fn(() => "<p>mocked tiptap html</p>"),
}));
jest.mock("@/components/editor/TiptapEditor", () => ({
	extensions: [],
}));

import { parseLibraryContent } from "@/features/library/lib/parseLibraryContent";

describe("parseLibraryContent", () => {
	it("빈 값은 null을 반환한다", () => {
		expect(parseLibraryContent(null)).toBeNull();
		expect(parseLibraryContent(undefined)).toBeNull();
		expect(parseLibraryContent("")).toBeNull();
	});

	it("공백뿐인 문자열은 빈 문자열을 반환한다", () => {
		expect(parseLibraryContent("   ")).toBe("");
	});

	it("Tiptap JSON 문자열은 문서 객체로 파싱한다", () => {
		const doc = { type: "doc", content: [{ type: "paragraph" }] };
		expect(parseLibraryContent(JSON.stringify(doc))).toEqual(doc);
	});

	it("Tiptap 문서 객체는 그대로 반환한다", () => {
		const doc = { type: "doc", content: [] };
		expect(parseLibraryContent(doc)).toBe(doc);
	});

	it("HTML 문자열은 그대로 반환한다", () => {
		expect(parseLibraryContent("<p>안녕</p>")).toBe("<p>안녕</p>");
	});

	it("일반 텍스트는 이스케이프 후 <p>로 감싼다", () => {
		expect(parseLibraryContent("hello & <world>")).toBe(
			"<p>hello &amp; &lt;world&gt;</p>",
		);
	});

	it("JSON이지만 Tiptap 문서가 아닌 숫자/불리언 문자열은 <p>로 감싼다", () => {
		expect(parseLibraryContent("123")).toBe("<p>123</p>");
	});
});
