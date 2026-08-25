import {
	applyThemeVariables,
	buildThemeStyleCSS,
	collectThemeVariables,
	formatFontFamily,
} from "@/shared/lib/theme";
import type { Design, General } from "@/features/settings/types";

describe("formatFontFamily", () => {
	it("멀티 워드 폰트명은 따옴표로 감싼다", () => {
		expect(formatFontFamily("Noto Sans KR")).toBe('"Noto Sans KR"');
	});

	it("단일 워드 폰트명은 그대로 둔다", () => {
		expect(formatFontFamily("Pretendard")).toBe("Pretendard");
	});

	it("이미 따옴표로 감싼 폰트명은 그대로 둔다", () => {
		expect(formatFontFamily('"Noto Sans KR"')).toBe('"Noto Sans KR"');
		expect(formatFontFamily("'Noto Sans KR'")).toBe("'Noto Sans KR'");
	});

	it("앞뒤 공백을 제거한다", () => {
		expect(formatFontFamily("  Pretendard  ")).toBe("Pretendard");
	});
});

describe("collectThemeVariables", () => {
	it("설정이 없으면 빈 결과를 반환한다", () => {
		expect(collectThemeVariables(undefined, undefined)).toEqual({
			set: [],
			unset: [],
		});
	});

	it("색상/폰트/배경 변수를 매핑한다", () => {
		const design: Partial<Design> = {
			font: {
				bodyFontFamily: "Noto Sans KR",
				titleFontFamily: "Pretendard",
				mainFontColor: "#111111",
				subFontColor: "#666666",
			},
			background: { type: "이미지", image: "https://example.com/bg.png", color: "#ffffff" },
		};
		const general: Partial<General> = {
			primaryColor: "#007bff",
			secondaryColor: "#6c757d",
		};

		const { set, unset } = collectThemeVariables(design, general);
		const map = Object.fromEntries(set);

		expect(map["--primary-color"]).toBe("#007bff");
		expect(map["--secondary-color"]).toBe("#6c757d");
		expect(map["--font-body"]).toBe('"Noto Sans KR"');
		expect(map["--font-title"]).toBe("Pretendard");
		expect(map["--color-main"]).toBe("#111111");
		expect(map["--color-sub"]).toBe("#666666");
		expect(map["--bg-color"]).toBe("#ffffff");
		// 원격 배경 이미지는 Next 이미지 옵티마이저 URL로 감싸 서빙한다
		expect(map["--bg-image"]).toBe(
			'url("/_next/image?url=https%3A%2F%2Fexample.com%2Fbg.png&w=2048&q=75")',
		);
		expect(unset).toEqual([]);
	});

	it("숫자 값에는 px 단위를 붙인다", () => {
		const design: Partial<Design> = {
			widget: { borderRadius: 12, borderWidth: 2, blur: 4 },
			card: { borderRadius: 8, translateY: -2, blur: 6 },
		} as Partial<Design>;

		const map = Object.fromEntries(collectThemeVariables(design).set);

		expect(map["--widget-border-radius"]).toBe("12px");
		expect(map["--widget-border-width"]).toBe("2px");
		expect(map["--widget-blur"]).toBe("4px");
		expect(map["--card-border-radius"]).toBe("8px");
		expect(map["--card-translate-y"]).toBe("-2px");
		expect(map["--card-blur"]).toBe("6px");
	});

	it("배경 타입이 이미지가 아니면 --bg-image를 unset 목록에 넣는다", () => {
		const design: Partial<Design> = {
			background: { type: "색상", color: "#000000" },
		};

		const { unset } = collectThemeVariables(design);
		expect(unset).toContain("--bg-image");
	});

	it("보더 이미지가 비어 있으면 관련 변수를 unset 목록에 넣는다", () => {
		const design = {
			widget: { borderImage: "" },
		} as Partial<Design>;

		const { unset } = collectThemeVariables(design);
		expect(unset).toEqual(
			expect.arrayContaining(["--widget-border-image", "--widget-border-image-type"])
		);
	});

	it("보더 이미지가 있으면 url과 타입을 설정한다 (타입 기본값 full)", () => {
		const design = {
			widget: { borderImage: "https://example.com/border.png" },
		} as Partial<Design>;

		const map = Object.fromEntries(collectThemeVariables(design).set);
		expect(map["--widget-border-image"]).toBe('url("https://example.com/border.png")');
		expect(map["--widget-border-image-type"]).toBe("full");
	});

	it("빈 문자열 값은 스킵한다 (기존 값 유지)", () => {
		const general: Partial<General> = { primaryColor: "", secondaryColor: "#aaa" };

		const map = Object.fromEntries(collectThemeVariables(undefined, general).set);
		expect(map["--primary-color"]).toBeUndefined();
		expect(map["--secondary-color"]).toBe("#aaa");
	});
});

describe("buildThemeStyleCSS", () => {
	it("설정이 없으면 빈 문자열을 반환한다", () => {
		expect(buildThemeStyleCSS()).toBe("");
	});

	it(":root 블록 문자열을 만든다", () => {
		const css = buildThemeStyleCSS(undefined, { primaryColor: "#123456" });
		expect(css).toBe(":root{--primary-color:#123456}");
	});
});

describe("applyThemeVariables", () => {
	it("set은 setProperty로, unset은 removeProperty로 적용한다", () => {
		const root = document.createElement("div");
		root.style.setProperty("--bg-image", "url(old.png)");

		applyThemeVariables(
			root,
			{ background: { type: "색상", color: "#fff" } },
			{ primaryColor: "#000" }
		);

		expect(root.style.getPropertyValue("--primary-color")).toBe("#000");
		expect(root.style.getPropertyValue("--bg-color")).toBe("#fff");
		expect(root.style.getPropertyValue("--bg-image")).toBe("");
	});
});
