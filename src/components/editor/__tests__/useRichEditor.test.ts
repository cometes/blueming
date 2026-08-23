/**
 * useRichEditor의 순수 로직(getBlockDrop / resolveInsertPos / insertBlockAt /
 * editorHasContent) 단위 테스트.
 *
 * - 문서는 진짜 ProseMirror 노드로 만든다 (nodeSize/resolve 등 실제 동작 보장).
 * - jsdom의 getBoundingClientRect는 항상 0을 반환하므로, 기하 정보는
 *   view.dom / view.nodeDOM 스텁으로 직접 주입한다.
 */
jest.mock("@/components/editor/TiptapEditor", () => ({ extensions: [] }));
jest.mock("sonner", () => ({
	toast: { info: jest.fn(), error: jest.fn() },
}));
jest.mock("@/shared/lib/tiptap-utils", () => ({
	handleImageUpload: jest.fn(),
}));

import { Schema, type Node as PMNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import {
	editorHasContent,
	getBlockDrop,
	insertBlockAt,
	resolveInsertPos,
} from "@/components/editor/useRichEditor";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: { group: "block", content: "inline*" },
		text: { group: "inline" },
		image: { group: "block", atom: true },
		youtube: { group: "block", atom: true },
	},
});

const p = (text?: string) =>
	schema.node("paragraph", null, text ? [schema.text(text)] : []);
const image = () => schema.node("image");

interface Rect {
	top: number;
	bottom: number;
	height: number;
}
const rect = (top: number, height: number): Rect => ({
	top,
	height,
	bottom: top + height,
});

/**
 * getBlockDrop용 가짜 에디터: 최상위 블록 i번째의 화면 rect를 rects[i]로 주입.
 */
const makeGeoEditor = (doc: PMNode, editorRect: Rect, rects: Rect[]) => {
	const offsets: number[] = [];
	doc.forEach((_node, offset) => offsets.push(offset));
	return {
		view: {
			dom: { getBoundingClientRect: () => editorRect },
			state: { doc },
			nodeDOM: (offset: number) => {
				const index = offsets.indexOf(offset);
				if (index === -1 || !rects[index]) return null;
				return { getBoundingClientRect: () => rects[index] };
			},
		},
		state: { doc },
	} as unknown as Editor;
};

describe("getBlockDrop (노션식 블록 드롭 위치)", () => {
	// [p("hello")(7), image(1), 트레일링 빈 p(2)] — content.size = 10
	const doc = schema.node("doc", null, [p("hello"), image(), p()]);
	const editor = makeGeoEditor(doc, rect(0, 300), [
		rect(0, 40), // p("hello"): mid 20
		rect(40, 100), // image: mid 90
		rect(140, 20), // 트레일링 빈 문단 (후보 제외 대상)
	]);

	it("블록 상반부 → 그 블록 앞", () => {
		expect(getBlockDrop(editor, 10)).toEqual({ pos: 0, lineY: 0 });
	});

	it("블록 하반부 → 다음 블록 앞", () => {
		expect(getBlockDrop(editor, 35)).toEqual({ pos: 7, lineY: 40 });
	});

	it("트레일링 빈 문단은 후보에서 제외되고 문서 끝 영역으로 취급", () => {
		// 트레일링 문단 위(145)든 그 아래(200)든 → 트레일링 문단 앞(=8)
		expect(getBlockDrop(editor, 145)).toEqual({ pos: 8, lineY: 140 });
		expect(getBlockDrop(editor, 200)).toEqual({ pos: 8, lineY: 140 });
	});

	it("트레일링 빈 문단이 없으면 문서 끝은 마지막 블록 뒤", () => {
		const doc2 = schema.node("doc", null, [p("a"), image()]);
		const editor2 = makeGeoEditor(doc2, rect(0, 300), [
			rect(0, 40),
			rect(40, 100),
		]);
		expect(getBlockDrop(editor2, 250)).toEqual({
			pos: doc2.content.size,
			lineY: 140,
		});
	});
});

describe("resolveInsertPos", () => {
	const makeEditor = (doc: PMNode, selectionTo = 1) =>
		({
			state: { doc, selection: { to: selectionTo } },
		}) as unknown as Editor;

	it('"end"는 트레일링 빈 문단 앞을 가리킨다', () => {
		const doc = schema.node("doc", null, [p("hi"), p()]);
		// content.size = 6, 트레일링 p nodeSize = 2 → 4
		expect(resolveInsertPos(makeEditor(doc), "end")).toBe(4);
	});

	it('"end"는 마지막 블록이 비어있지 않으면 문서 끝', () => {
		const doc = schema.node("doc", null, [p("hi"), p("yo")]);
		expect(resolveInsertPos(makeEditor(doc), "end")).toBe(doc.content.size);
	});

	it("숫자는 그대로, 생략 시 selection 끝", () => {
		const doc = schema.node("doc", null, [p("hi")]);
		expect(resolveInsertPos(makeEditor(doc), 2)).toBe(2);
		expect(resolveInsertPos(makeEditor(doc, 3))).toBe(3);
	});
});

describe("editorHasContent", () => {
	const makeEditor = (doc: PMNode, text: string) =>
		({
			getText: () => text,
			state: { doc },
		}) as unknown as Editor;

	it("텍스트가 있으면 true", () => {
		const doc = schema.node("doc", null, [p("hello")]);
		expect(editorHasContent(makeEditor(doc, "hello"))).toBe(true);
	});

	it("텍스트 없이 이미지만 있어도 true", () => {
		const doc = schema.node("doc", null, [p(), image(), p()]);
		expect(editorHasContent(makeEditor(doc, ""))).toBe(true);
	});

	it("텍스트 없이 유튜브 임베드만 있어도 true", () => {
		const doc = schema.node("doc", null, [schema.node("youtube"), p()]);
		expect(editorHasContent(makeEditor(doc, ""))).toBe(true);
	});

	it("빈 문단뿐이면 false", () => {
		const doc = schema.node("doc", null, [p(), p()]);
		expect(editorHasContent(makeEditor(doc, "  "))).toBe(false);
	});
});

describe("insertBlockAt", () => {
	interface InsertCall {
		target: number | { from: number; to: number };
		content: unknown;
	}

	const makeEditor = (doc: PMNode) => {
		const calls: InsertCall[] = [];
		const editor = {
			state: { doc },
			chain: () => ({
				focus: () => ({
					insertContentAt: (
						target: number | { from: number; to: number },
						content: unknown,
					) => {
						calls.push({ target, content });
						return { run: () => {} };
					},
				}),
			}),
		} as unknown as Editor;
		return { editor, calls };
	};

	it("빈 문단 내부 위치면 그 문단을 통째로 교체", () => {
		// [p("hi")(4), p()(2)] — 빈 문단 내부 pos 5
		const doc = schema.node("doc", null, [p("hi"), p()]);
		const { editor, calls } = makeEditor(doc);
		const insertedAt = insertBlockAt(editor, { type: "image" }, 5);
		expect(calls[0].target).toEqual({ from: 4, to: 6 });
		expect(insertedAt).toBe(4);
	});

	it("내용 있는 문단 내부면 해당 위치에 삽입", () => {
		const doc = schema.node("doc", null, [p("hi")]);
		const { editor, calls } = makeEditor(doc);
		const insertedAt = insertBlockAt(editor, { type: "image" }, 2);
		expect(calls[0].target).toBe(2);
		expect(insertedAt).toBe(2);
	});

	it("블록 경계(depth 0)면 해당 위치에 삽입", () => {
		const doc = schema.node("doc", null, [p("hi"), p()]);
		const { editor, calls } = makeEditor(doc);
		const insertedAt = insertBlockAt(editor, { type: "image" }, 4);
		expect(calls[0].target).toBe(4);
		expect(insertedAt).toBe(4);
	});

	it("범위를 벗어난 pos는 문서 크기로 클램프", () => {
		const doc = schema.node("doc", null, [p("hi")]);
		const { editor, calls } = makeEditor(doc);
		insertBlockAt(editor, { type: "image" }, 999);
		expect(calls[0].target).toBe(doc.content.size);
	});
});
