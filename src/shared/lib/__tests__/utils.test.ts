import { cn, getLighterColor, getDarkerColor, generateColorPalette } from "../utils";

describe("cn (className 병합)", () => {
	it("기본 클래스 병합", () => {
		expect(cn("foo", "bar")).toBe("foo bar");
	});

	it("undefined/null 무시", () => {
		expect(cn("foo", undefined, "bar")).toBe("foo bar");
		expect(cn("foo", null as never, "bar")).toBe("foo bar");
	});

	it("Tailwind 충돌 클래스 마지막 것으로 덮어씀", () => {
		expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
	});

	it("조건부 클래스", () => {
		expect(cn("base", false && "hidden", "visible")).toBe("base visible");
	});

	it("빈 문자열 처리", () => {
		expect(cn("", "foo")).toBe("foo");
	});
});

describe("getLighterColor", () => {
	it("HEX 색상에서 밝은 색상 생성", () => {
		const result = getLighterColor("#000000", 30);
		expect(result).toMatch(/^#[0-9a-f]{6}$/i);
		// 검정에서 밝아지면 밝은 회색이어야 함
		expect(result).not.toBe("#000000");
	});

	it("RGB 색상 지원", () => {
		const result = getLighterColor("rgb(0, 0, 0)", 30);
		expect(result).toMatch(/^#[0-9a-f]{6}$/i);
	});

	it("이미 밝은 색상은 최대 100% 밝기 제한", () => {
		const result = getLighterColor("#ffffff", 30);
		expect(result).toBe("#ffffff");
	});

	it("기본 amount는 30", () => {
		const withDefault = getLighterColor("#808080");
		const withExplicit = getLighterColor("#808080", 30);
		expect(withDefault).toBe(withExplicit);
	});
});

describe("getDarkerColor", () => {
	it("HEX 색상에서 어두운 색상 생성", () => {
		const result = getDarkerColor("#ffffff", 30);
		expect(result).toMatch(/^#[0-9a-f]{6}$/i);
		expect(result).not.toBe("#ffffff");
	});

	it("최소 밝기 0% 제한 (검정 이하 불가)", () => {
		const result = getDarkerColor("#000000", 30);
		expect(result).toBe("#000000");
	});

	it("기본 amount는 30", () => {
		const withDefault = getDarkerColor("#808080");
		const withExplicit = getDarkerColor("#808080", 30);
		expect(withDefault).toBe(withExplicit);
	});
});

describe("generateColorPalette", () => {
	it("light, base, dark 세 가지 색상 반환", () => {
		const palette = generateColorPalette("#4a90e2");
		expect(palette).toHaveProperty("light");
		expect(palette).toHaveProperty("base");
		expect(palette).toHaveProperty("dark");
	});

	it("모두 유효한 HEX 형식", () => {
		const palette = generateColorPalette("#4a90e2");
		const hexPattern = /^#[0-9a-f]{6}$/i;
		expect(palette.light).toMatch(hexPattern);
		expect(palette.base).toMatch(hexPattern);
		expect(palette.dark).toMatch(hexPattern);
	});

	it("light > dark 밝기 순서", () => {
		// 밝은 색의 RGB 합계가 어두운 색보다 크거나 같음
		const palette = generateColorPalette("#4a90e2");
		const hexToSum = (hex: string) => {
			const r = parseInt(hex.slice(1, 3), 16);
			const g = parseInt(hex.slice(3, 5), 16);
			const b = parseInt(hex.slice(5, 7), 16);
			return r + g + b;
		};
		expect(hexToSum(palette.light)).toBeGreaterThanOrEqual(hexToSum(palette.dark));
	});

	it("흰색 입력", () => {
		const palette = generateColorPalette("#ffffff");
		expect(palette).toHaveProperty("light");
		expect(palette).toHaveProperty("base");
		expect(palette).toHaveProperty("dark");
	});

	it("검정색 입력", () => {
		const palette = generateColorPalette("#000000");
		expect(palette).toHaveProperty("light");
		expect(palette).toHaveProperty("base");
		expect(palette).toHaveProperty("dark");
	});
});
