// providers/ThemeProvider.tsx
"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { createContext, useContext, useEffect, useMemo } from "react";
import type {
	Design,
	FontRegistryItem,
	General,
} from "@/features/settings/types";
import { getFontFormat, isFontFileUrl } from "@/shared/lib/fonts";

interface ThemeContextType {
	design?: Design;
	general?: General;
	setCSSVariables: (design: Design, general: General) => void;
}

interface ThemeProviderProps {
	children: React.ReactNode;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);


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
	const resolveGeneral = () => {
		return {
			general: settings.general?.general as General | undefined,
			design: settings.general?.design as Design | undefined,
		};
	};
	const { general, design } = resolveGeneral();
	const fontRegistry = useMemo(
		() => settings.general?.fontRegistry ?? [],
		[settings.general?.fontRegistry]
	);

	const setCSSVariables = (design?: Design, general?: General) => {
		const root = document.documentElement;
		const computed = getComputedStyle(root);
		const pick = (value: string | undefined, fallbackVar: string, fallback: string) => {
			if (value && value.trim().length > 0) return value;
			const existing = computed.getPropertyValue(fallbackVar).trim();
			return existing || fallback;
		};
		// 멀티 워드 폰트명은 따옴표로 감싸야 CSS font-family에서 올바르게 동작
		const formatFontFamily = (value: string) => {
			const v = value.trim();
			if (!v) return v;
			if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v;
			if (v.includes(" ")) return `"${v}"`;
			return v;
		};
		const font = design?.font;
		const background = design?.background;
		const widget = design?.widget;
		const card = design?.card;

		// 색상 변수
		if (general?.primaryColor !== undefined) {
			root.style.setProperty('--primary-color', pick(general.primaryColor, "--primary-color", "#007bff"));
		}
		if (general?.secondaryColor !== undefined) {
			root.style.setProperty('--secondary-color', pick(general.secondaryColor, "--secondary-color", "#6c757d"));
		}

		// 폰트 변수
		if (font?.bodyFontFamily !== undefined) {
			root.style.setProperty('--font-body', formatFontFamily(pick(font.bodyFontFamily, "--font-body", "sans-serif")));
		}
		if (font?.titleFontFamily !== undefined) {
			root.style.setProperty('--font-title', formatFontFamily(pick(font.titleFontFamily, "--font-title", "sans-serif")));
		}
		if (font?.mainFontColor !== undefined) {
			root.style.setProperty('--color-main', pick(font.mainFontColor, "--color-main", "#111111"));
		}
		if (font?.subFontColor !== undefined) {
			root.style.setProperty('--color-sub', pick(font.subFontColor, "--color-sub", "#666666"));
		}
		
		// 배경 변수
		if (background?.color !== undefined) {
			root.style.setProperty('--bg-color', pick(background.color, "--bg-color", "#ffffff"));
		}
		if (background?.type !== undefined) {
			if (background.type === '이미지' && background.image) {
				root.style.setProperty('--bg-image', `url(${background.image})`);
			} else {
				root.style.removeProperty('--bg-image');
			}
		}
		
		// 위젯 디자인 변수
		if (widget?.background !== undefined) {
			root.style.setProperty('--widget-bg', pick(widget.background, "--widget-bg", "rgba(255,255,255,0.8)"));
		}
		if (widget?.borderColor !== undefined) {
			root.style.setProperty('--widget-border-color', pick(widget.borderColor, "--widget-border-color", "rgba(0,0,0,0.1)"));
		}
		if (widget?.borderRadius !== undefined) {
			root.style.setProperty('--widget-border-radius', `${widget.borderRadius}px`);
		}
		if (widget?.borderWidth !== undefined) {
			root.style.setProperty('--widget-border-width', `${widget.borderWidth}px`);
		}
		if (widget?.borderStyle !== undefined) {
			root.style.setProperty('--widget-border-style', widget.borderStyle);
		}
		if (widget?.blur !== undefined) {
			root.style.setProperty('--widget-blur', `${widget.blur}px`);
		}
		if (widget && "borderImage" in widget) {
			if (widget.borderImage) {
				root.style.setProperty('--widget-border-image', `url("${widget.borderImage}")`);
				root.style.setProperty('--widget-border-image-type', widget.borderImageType || 'full');
			} else {
				root.style.removeProperty('--widget-border-image');
				root.style.removeProperty('--widget-border-image-type');
			}
		}
		
		// 카드 디자인 변수
		if (card?.background !== undefined) {
			root.style.setProperty('--card-bg', pick(card.background, "--card-bg", "rgba(255,255,255,0.9)"));
		}
		if (card?.borderColor !== undefined) {
			root.style.setProperty('--card-border-color', pick(card.borderColor, "--card-border-color", "rgba(0,0,0,0.08)"));
		}
		if (card?.borderActiveColor !== undefined) {
			root.style.setProperty('--card-border-active', pick(card.borderActiveColor, "--card-border-active", "rgba(0,0,0,0.2)"));
		}
		if (card?.borderRadius !== undefined) {
			root.style.setProperty('--card-border-radius', `${card.borderRadius}px`);
		}
		if (card?.borderStyle !== undefined) {
			root.style.setProperty('--card-border-style', card.borderStyle);
		}
		if (card?.boxShadow !== undefined) {
			root.style.setProperty('--card-shadow', pick(card.boxShadow, "--card-shadow", "none"));
		}
		if (card?.translateY !== undefined) {
			root.style.setProperty('--card-translate-y', `${card.translateY}px`);
		}
		if (card?.blur !== undefined) {
			root.style.setProperty('--card-blur', `${card.blur}px`);
		}
	};

	useEffect(() => {
		if (design || general) {
			// DOM이 준비되면 즉시 CSS 변수 설정
			setCSSVariables(design, general);
			
			// 보더 이미지 적용
			const widget = design?.widget;
			if (widget && "borderImage" in widget && widget.borderImage) {
				const widgetWrappers = document.querySelectorAll('.widget-wrapper');
				widgetWrappers.forEach((wrapper) => {
					const element = wrapper as HTMLElement;
					
					// 기존 코너 요소 제거
					const existingCorners = element.querySelectorAll('.widget-corner-image');
					existingCorners.forEach((corner) => corner.remove());
					
					if (widget.borderImageType === 'corner') {
						element.setAttribute('data-border-image-type', 'corner');
						// 코너 이미지 적용 (4개 코너 모두)
						element.style.setProperty('--widget-corner-image', `url("${widget.borderImage}")`);
						
						// 4개 코너에 이미지 요소 추가
						const corners = [
							{ position: 'top-left', top: '0', left: '0' },
							{ position: 'top-right', top: '0', right: '0' },
							{ position: 'bottom-left', bottom: '0', left: '0' },
							{ position: 'bottom-right', bottom: '0', right: '0' },
						];
						
						corners.forEach(({ position, ...styles }) => {
							const cornerEl = document.createElement('div');
							cornerEl.className = 'widget-corner-image';
							cornerEl.setAttribute('data-corner', position);
							Object.assign(cornerEl.style, {
								position: 'absolute',
								width: '30px',
								height: '30px',
								backgroundImage: `url("${design.widget.borderImage}")`,
								backgroundSize: 'contain',
								backgroundRepeat: 'no-repeat',
								backgroundPosition: position.replace('-', ' '),
								pointerEvents: 'none',
								zIndex: '10',
								...styles,
							});
							element.appendChild(cornerEl);
						});
					} else {
						element.setAttribute('data-border-image-type', 'full');
						// 전체 보더 이미지 적용
						element.style.borderImage = `url("${widget.borderImage}") ${widget.borderWidth ?? 1} fill`;
						element.style.borderImageSlice = `${widget.borderWidth ?? 1}`;
					}
				});
			}
		}
	}, [design, general]);

	// 초기 로딩 시 즉시 적용 (hydration 전에)
	useEffect(() => {
		if (typeof window !== 'undefined' && (design || general)) {
			// requestAnimationFrame을 사용해 렌더링 최적화
			requestAnimationFrame(() => {
				setCSSVariables(design, general);
			});
		}
	}, [design, general]);

	const value = {
		design,
		general,
		setCSSVariables,
	};

	return (
		<ThemeContext.Provider value={value}>
			<FontRegistryAssets fonts={fontRegistry} />
			{children}
		</ThemeContext.Provider>
	);
}

// 테마 컨텍스트 사용을 위한 커스텀 훅
export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
