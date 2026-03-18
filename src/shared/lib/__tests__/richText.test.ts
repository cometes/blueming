jest.mock("@tiptap/html", () => ({
	generateHTML: jest.fn(() => "<p>mocked tiptap html</p>"),
}));
jest.mock("@/components/editor/TiptapEditor", () => ({
	extensions: [],
}));

import { renderRichText, isRichTextEmpty } from "@/shared/lib/richText";
import { generateHTML } from "@tiptap/html";

const mockedGenerateHTML = generateHTML as jest.MockedFunction<typeof generateHTML>;

describe("isRichTextEmpty", () => {
	it("빈 문자열 → true", () => {
		expect(isRichTextEmpty("")).toBe(true);
	});

	it("공백만 있는 문자열 → true", () => {
		expect(isRichTextEmpty("   ")).toBe(true);
	});

	it("태그만 있는 문자열 → true", () => {
		expect(isRichTextEmpty("<p></p>")).toBe(true);
		expect(isRichTextEmpty("<p><br></p>")).toBe(true);
	});

	it("텍스트가 있는 문자열 → false", () => {
		expect(isRichTextEmpty("<p>hello</p>")).toBe(false);
		expect(isRichTextEmpty("hello")).toBe(false);
	});

	it("태그 사이에 공백만 있으면 → true", () => {
		expect(isRichTextEmpty("<p>  </p>")).toBe(true);
	});
});

describe("renderRichText", () => {
	it("falsy 값 → 빈 문자열", () => {
		expect(renderRichText(null)).toBe("");
		expect(renderRichText(undefined)).toBe("");
		expect(renderRichText("")).toBe("");
		expect(renderRichText("  ")).toBe("");
	});

	it("일반 HTML 문자열 (JSON 아님) → 그대로 반환", () => {
		const html = "<p>hello world</p>";
		expect(renderRichText(html)).toBe(html);
	});

	it("Array 형식 RichTextNode 직접 전달", () => {
		const nodes = [
			{ type: "paragraph", children: [{ text: "hello" }] },
		];
		const result = renderRichText(nodes);
		expect(result).toBe("<p>hello</p>");
	});

	it("JSON string → Array 형식 RichTextNode", () => {
		const nodes = [
			{ type: "paragraph", children: [{ text: "world" }] },
		];
		const result = renderRichText(JSON.stringify(nodes));
		expect(result).toBe("<p>world</p>");
	});

	it("heading-one, heading-two 렌더링", () => {
		const nodes = [
			{ type: "heading-one", children: [{ text: "제목1" }] },
			{ type: "heading-two", children: [{ text: "제목2" }] },
		];
		const result = renderRichText(nodes);
		expect(result).toContain("<h1>제목1</h1>");
		expect(result).toContain("<h2>제목2</h2>");
	});

	it("bulleted-list + list-item 렌더링", () => {
		const nodes = [
			{
				type: "bulleted-list",
				children: [
					{ type: "list-item", children: [{ text: "항목" }] },
				],
			},
		];
		const result = renderRichText(nodes);
		expect(result).toContain("<ul><li>항목</li></ul>");
	});

	it("quote 렌더링", () => {
		const nodes = [{ type: "quote", children: [{ text: "인용" }] }];
		expect(renderRichText(nodes)).toBe("<blockquote>인용</blockquote>");
	});

	it("code 블록 렌더링", () => {
		const nodes = [{ type: "code", children: [{ text: "const x = 1" }] }];
		expect(renderRichText(nodes)).toBe("<pre><code>const x = 1</code></pre>");
	});

	it("텍스트 인라인 스타일 — bold, italic, underline, code", () => {
		const nodes = [
			{
				type: "paragraph",
				children: [
					{ text: "굵게", bold: true },
					{ text: "기울임", italic: true },
					{ text: "밑줄", underline: true },
					{ text: "코드", code: true },
				],
			},
		];
		const result = renderRichText(nodes);
		expect(result).toContain("<strong>굵게</strong>");
		expect(result).toContain("<em>기울임</em>");
		expect(result).toContain("<u>밑줄</u>");
		expect(result).toContain("<code>코드</code>");
	});

	it("텍스트 color, backgroundColor, fontSize 스타일", () => {
		const nodes = [
			{
				type: "paragraph",
				children: [
					{ text: "색상", color: "red", backgroundColor: "blue", fontSize: 16 },
				],
			},
		];
		const result = renderRichText(nodes);
		expect(result).toContain("color:red");
		expect(result).toContain("background-color:blue");
		expect(result).toContain("font-size:16px");
	});

	it("XSS 이스케이프 — HTML 특수문자 처리", () => {
		const nodes = [
			{
				type: "paragraph",
				children: [{ text: '<script>alert("xss")</script>' }],
			},
		];
		const result = renderRichText(nodes);
		expect(result).not.toContain("<script>");
		expect(result).toContain("&lt;script&gt;");
	});

	it("image 노드 — 유효한 URL", () => {
		const nodes = [
			{
				type: "image",
				url: "https://example.com/img.png",
				width: 100,
				height: 80,
				children: [],
			},
		];
		const result = renderRichText(nodes);
		expect(result).toContain("<figure");
		expect(result).toContain('<img src="https://example.com/img.png"');
		expect(result).toContain("width:100px");
		expect(result).toContain("height:80px");
	});

	it("image 노드 — 잘못된 URL은 렌더링 skip", () => {
		const nodes = [
			{ type: "image", url: "javascript:alert(1)", children: [] },
		];
		const result = renderRichText(nodes);
		expect(result).not.toContain("<figure");
		expect(result).not.toContain("<img");
	});

	it("button 노드 — 유효한 URL", () => {
		const nodes = [
			{ type: "button", url: "https://link.com", children: [{ text: "클릭" }] },
		];
		const result = renderRichText(nodes);
		expect(result).toContain('<a href="https://link.com"');
		expect(result).toContain("클릭");
	});

	it("Tiptap doc 형식 → generateHTML 호출", () => {
		const doc = { type: "doc", content: [{ type: "paragraph" }] };
		mockedGenerateHTML.mockReturnValueOnce("<p>tiptap</p>");
		const result = renderRichText(doc);
		expect(mockedGenerateHTML).toHaveBeenCalled();
		expect(result).toBe("<p>tiptap</p>");
	});

	it("JSON string → Tiptap doc 형식", () => {
		const doc = { type: "doc", content: [] };
		mockedGenerateHTML.mockReturnValueOnce("<p>from json</p>");
		const result = renderRichText(JSON.stringify(doc));
		expect(mockedGenerateHTML).toHaveBeenCalled();
		expect(result).toBe("<p>from json</p>");
	});

	it("알 수 없는 타입은 paragraph로 폴백", () => {
		const nodes = [
			{ type: "unknown-type", children: [{ text: "폴백" }] },
		];
		expect(renderRichText(nodes)).toBe("<p>폴백</p>");
	});
});
