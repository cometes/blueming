import { convertToUnderscore } from "../replace";

describe("convertToUnderscore", () => {
	it("단일 공백을 _로 변환", () => {
		expect(convertToUnderscore("hello world")).toBe("hello_world");
	});

	it("연속 공백은 하나의 _로 변환 (\\s+ greedy)", () => {
		// \s+ 패턴이므로 연속 공백도 하나의 _로 대체됨
		expect(convertToUnderscore("hello  world")).toBe("hello_world");
	});

	it("탭 공백도 _로 변환", () => {
		expect(convertToUnderscore("hello\tworld")).toBe("hello_world");
	});

	it("공백 없으면 그대로", () => {
		expect(convertToUnderscore("helloworld")).toBe("helloworld");
	});

	it("빈 문자열 그대로", () => {
		expect(convertToUnderscore("")).toBe("");
	});

	it("앞뒤 공백도 _로 변환", () => {
		expect(convertToUnderscore(" hello ")).toBe("_hello_");
	});

	it("여러 단어", () => {
		expect(convertToUnderscore("a b c d")).toBe("a_b_c_d");
	});

	it("한글 포함", () => {
		expect(convertToUnderscore("안녕 세계")).toBe("안녕_세계");
	});
});
