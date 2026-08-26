import type { Design, General } from "@/features/settings/types";

// 멀티 워드 폰트명은 따옴표로 감싸야 CSS font-family에서 올바르게 동작 (예: "Noto Sans KR")
export const formatFontFamily = (value: string) => {
	const v = value.trim();
	if (!v) return v;
	if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v;
	if (v.includes(" ")) return `"${v}"`;
	return v;
};

/**
 * 페이지 배경 전용 이미지 최적화 — 스토리지 원본은 그대로 두고, 배경으로 그릴 때만
 * Next 이미지 옵티마이저(/_next/image)를 거쳐 화면 해상도 WebP로 서빙한다.
 * (원본 PNG 수 MB → 수백 KB, Vercel CDN 캐시) 원격 http(s) URL만 감싼다.
 */
export const optimizeBackgroundImageUrl = (url: string): string => {
	if (!/^https?:\/\//.test(url)) return url;
	return `/_next/image?url=${encodeURIComponent(url)}&w=2048&q=75`;
};

export interface ThemeVariables {
	set: Array<[name: string, value: string]>;
	unset: string[];
}

/**
 * 설정 → CSS 변수 매핑의 단일 소스.
 * 서버(app/layout.tsx의 SSR 인라인 스타일)와 클라이언트(ThemeProvider)가 함께 사용한다.
 *
 * - undefined: 해당 설정이 없음 → 변수를 건드리지 않는다
 * - 빈 문자열: 기존 값 유지 → 스킵
 * - unset 목록: 명시적으로 제거해야 하는 변수 (배경 이미지 해제 등)
 */
export const collectThemeVariables = (
	design?: Partial<Design>,
	general?: Partial<General>
): ThemeVariables => {
	const set: Array<[string, string]> = [];
	const unset: string[] = [];

	const add = (
		name: string,
		value: string | undefined,
		format?: (v: string) => string
	) => {
		if (value === undefined || value.trim() === "") return;
		set.push([name, format ? format(value) : value]);
	};
	const addPx = (name: string, value: number | undefined) => {
		if (value === undefined) return;
		set.push([name, `${value}px`]);
	};

	const font = design?.font;
	const background = design?.background;
	const widget = design?.widget;
	const card = design?.card;

	// 색상
	add("--primary-color", general?.primaryColor);
	add("--secondary-color", general?.secondaryColor);

	// 폰트
	add("--font-body", font?.bodyFontFamily, formatFontFamily);
	add("--font-title", font?.titleFontFamily, formatFontFamily);
	add("--color-main", font?.mainFontColor);
	add("--color-sub", font?.subFontColor);

	// 배경
	add("--bg-color", background?.color);
	if (background?.type !== undefined) {
		if (background.type === "이미지" && background.image) {
			set.push([
				"--bg-image",
				`url("${optimizeBackgroundImageUrl(background.image)}")`,
			]);
		} else {
			unset.push("--bg-image");
		}
	}

	// 위젯
	add("--widget-bg", widget?.background);
	add("--widget-border-color", widget?.borderColor);
	addPx("--widget-border-radius", widget?.borderRadius);
	addPx("--widget-border-width", widget?.borderWidth);
	add("--widget-border-style", widget?.borderStyle);
	addPx("--widget-blur", widget?.blur);
	if (widget && "borderImage" in widget) {
		if (widget.borderImage) {
			set.push(["--widget-border-image", `url("${widget.borderImage}")`]);
			set.push(["--widget-border-image-type", widget.borderImageType || "full"]);
		} else {
			unset.push("--widget-border-image", "--widget-border-image-type");
		}
	}

	// 카드
	add("--card-bg", card?.background);
	add("--card-border-color", card?.borderColor);
	add("--card-border-active", card?.borderActiveColor);
	addPx("--card-border-radius", card?.borderRadius);
	add("--card-border-style", card?.borderStyle);
	add("--card-shadow", card?.boxShadow);
	addPx("--card-translate-y", card?.translateY);
	addPx("--card-blur", card?.blur);

	return { set, unset };
};

/** SSR용: <style> 태그에 넣을 :root 블록 문자열 (초기 렌더에는 unset 대상이 없으므로 set만 사용) */
export const buildThemeStyleCSS = (
	design?: Partial<Design>,
	general?: Partial<General>
) => {
	const { set } = collectThemeVariables(design, general);
	if (set.length === 0) return "";
	return `:root{${set.map(([name, value]) => `${name}:${value}`).join(";")}}`;
};

/** 클라이언트용: :root 인라인 스타일에 변수 적용/제거 */
export const applyThemeVariables = (
	root: HTMLElement,
	design?: Partial<Design>,
	general?: Partial<General>
) => {
	const { set, unset } = collectThemeVariables(design, general);
	set.forEach(([name, value]) => root.style.setProperty(name, value));
	unset.forEach((name) => root.style.removeProperty(name));
};
