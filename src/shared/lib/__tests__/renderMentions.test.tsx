import { isValidElement } from "react";
import { renderContentWithMentions } from "@/features/mention/lib/renderMentions";

const spans = (nodes: unknown) =>
	(Array.isArray(nodes) ? nodes : [nodes]).filter((n) => isValidElement(n));

describe("renderContentWithMentions", () => {
	it("멘션이 없으면 원문 그대로", () => {
		expect(renderContentWithMentions("hello", [])).toBe("hello");
		expect(renderContentWithMentions("hello @누군가", undefined)).toBe(
			"hello @누군가",
		);
	});

	it("멘션된 이름만 span으로 하이라이트", () => {
		const nodes = renderContentWithMentions("안녕 @철수 반가워 @영희!", [
			{ uid: "u1", name: "철수" },
			{ uid: "u2", name: "영희" },
		]);
		expect(Array.isArray(nodes)).toBe(true);
		const arr = nodes as unknown[];
		expect(spans(arr)).toHaveLength(2);
		expect(arr[0]).toBe("안녕 ");
		expect(arr[2]).toBe(" 반가워 ");
		expect(arr[4]).toBe("!");
	});

	it("긴 이름 우선 매칭 (@김철수2가 @김철수로 잘리지 않음)", () => {
		const nodes = renderContentWithMentions("@김철수2 안녕", [
			{ uid: "u1", name: "김철수" },
			{ uid: "u2", name: "김철수2" },
		]) as unknown[];
		const first = nodes[0] as { props: { children: unknown[] } };
		expect(isValidElement(first)).toBe(true);
		// span 내용: ["@", "김철수2"]
		expect(JSON.stringify(first.props.children)).toContain("김철수2");
	});

	it("목록에 없는 @텍스트는 하이라이트하지 않음", () => {
		const nodes = renderContentWithMentions("@아무개 안녕", [
			{ uid: "u1", name: "철수" },
		]);
		expect(Array.isArray(nodes)).toBe(true);
		expect(spans(nodes)).toHaveLength(0);
	});
});
