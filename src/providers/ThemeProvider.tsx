// providers/ThemeProvider.tsx
"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useEffect, useMemo } from "react";
import type {
	Design,
	FontRegistryItem,
	General,
} from "@/features/settings/types";
import { getFontFormat, isFontFileUrl } from "@/shared/lib/fonts";
import { applyThemeVariables } from "@/shared/lib/theme";

interface ThemeProviderProps {
	children: React.ReactNode;
}

const buildFontFace = (font: FontRegistryItem) => {
	const format = getFontFormat(font.url ?? "");
	const formatValue = format ? ` format("${format}")` : "";
	return `@font-face{font-family:"${font.family}";src:url("${font.url}")${formatValue};font-display:swap;}`;
};

// 폰트 레지스트리를 JSX로 렌더링한다. React 19가 <link>/<style precedence>를
// document.head로 호이스팅하고 href 기준으로 중복 제거해주므로,
// head를 querySelector로 뒤져서 노드를 지우는 방식(React 소유 노드 파괴 → removeChild 크래시)을 쓰면 안 된다.
const FontRegistryAssets = ({ fonts }: { fonts: FontRegistryItem[] }) => {
	return (
		<>
			{fonts.map((font) => {
				if (!font?.url || !font?.family) return null;
				const key = font.id || font.family;
				if (font.source === "url" && !isFontFileUrl(font.url)) {
					return (
						<link
							key={key}
							rel="stylesheet"
							href={font.url}
							precedence="font-registry"
						/>
					);
				}
				return (
					<style key={key} href={`font-registry-${key}`} precedence="font-registry">
						{buildFontFace(font)}
					</style>
				);
			})}
		</>
	);
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	const settings = useSettings();
	const general = settings.general?.general as General | undefined;
	const design = settings.general?.design as Design | undefined;
	const fontRegistry = useMemo(
		() => settings.general?.fontRegistry ?? [],
		[settings.general?.fontRegistry]
	);

	useEffect(() => {
		if (!design && !general) return;

		// 설정 → CSS 변수 적용 (매핑은 shared/lib/theme.ts가 단일 소스)
		const root = document.documentElement;
		applyThemeVariables(root, design, general);

		// 보더 이미지 적용: React가 렌더링한 .widget-wrapper 내부에 노드를 주입하지 않고,
		// :root의 데이터 속성 + CSS 변수만 바꿔 components.css 규칙이 그리게 한다.
		const widget = design?.widget;
		if (widget && "borderImage" in widget && widget.borderImage) {
			if (widget.borderImageType === "corner") {
				root.setAttribute("data-widget-border-image-type", "corner");
				root.style.setProperty(
					"--widget-corner-image",
					`url("${widget.borderImage}")`
				);
			} else {
				root.setAttribute("data-widget-border-image-type", "full");
				root.style.setProperty(
					"--widget-border-image-slice",
					`${widget.borderWidth ?? 1}`
				);
			}
		} else {
			root.removeAttribute("data-widget-border-image-type");
			root.style.removeProperty("--widget-corner-image");
			root.style.removeProperty("--widget-border-image-slice");
		}
	}, [design, general]);

	return (
		<>
			<FontRegistryAssets fonts={fontRegistry} />
			{children}
		</>
	);
}
