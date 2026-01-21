// providers/ThemeProvider.tsx
"use client";

import { useSettings } from "@/contexts/SettingsContext";
import type { FontRegistryItem } from "@/contexts/SettingsContext";
import { createContext, useContext, useEffect } from "react";
import { Design, General } from "@/contexts/SettingsContext";

interface ThemeContextType {
	design?: Design;
	general?: General;
	setCSSVariables: (design: Design, general: General) => void;
}

interface ThemeProviderProps {
	children: React.ReactNode;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
	const settings = useSettings();
	const design = settings.general?.design;
	const general = settings.general?.general;
	const fontRegistry = settings.general?.fontRegistry ?? [];

	const getFontFormat = (url: string) => {
		const cleanUrl = url.split("?")[0];
		const ext = cleanUrl.split(".").pop()?.toLowerCase();
		switch (ext) {
			case "woff2":
				return "woff2";
			case "woff":
				return "woff";
			case "ttf":
				return "truetype";
			case "otf":
				return "opentype";
			case "eot":
				return "embedded-opentype";
			default:
				return undefined;
		}
	};

	const isFontFileUrl = (url: string) => {
		const cleanUrl = url.split("?")[0].toLowerCase();
		return /\.(woff2|woff|ttf|otf|eot)$/.test(cleanUrl);
	};

	const buildFontFace = (font: FontRegistryItem) => {
		const format = getFontFormat(font.url);
		const formatValue = format ? ` format("${format}")` : "";
		return `@font-face{font-family:"${font.family}";src:url("${font.url}")${formatValue};font-display:swap;}`;
	};

	const syncFontAssets = (fonts: FontRegistryItem[]) => {
		const head = document.head;
		if (!head) return;

		head
			.querySelectorAll("[data-font-registry]")
			.forEach((node) => node.remove());

		fonts.forEach((font) => {
			if (!font?.url || !font?.family) return;
			if (font.source === "url" && !isFontFileUrl(font.url)) {
				const link = document.createElement("link");
				link.rel = "stylesheet";
				link.href = font.url;
				link.setAttribute("data-font-registry", "true");
				link.setAttribute("data-font-id", font.id || font.family);
				head.appendChild(link);
				return;
			}

			const style = document.createElement("style");
			style.setAttribute("data-font-registry", "true");
			style.setAttribute("data-font-id", font.id || font.family);
			style.textContent = buildFontFace(font);
			head.appendChild(style);
		});
	};

	const setCSSVariables = (design: Design, general: General) => {
		const root = document.documentElement;

		// 색상 변수
		root.style.setProperty('--primary-color', general.primaryColor);
		root.style.setProperty('--secondary-color', general.secondaryColor);
		
		// 폰트 변수
		root.style.setProperty('--font-body', design.font.bodyFontFamily);
		root.style.setProperty('--font-title', design.font.titleFontFamily);
		root.style.setProperty('--color-main', design.font.mainFontColor);
		root.style.setProperty('--color-sub', design.font.subFontColor);
		
		// 배경 변수
		root.style.setProperty('--bg-color', design.background.color);
		if (design.background.type === '이미지' && design.background.image) {
			root.style.setProperty('--bg-image', `url(${design.background.image})`);
		}
		
		// 위젯 디자인 변수
		root.style.setProperty('--widget-bg', design.widget.background);
		root.style.setProperty('--widget-border-color', design.widget.borderColor);
		root.style.setProperty('--widget-border-radius', `${design.widget.borderRadius}px`);
		root.style.setProperty('--widget-border-width', `${design.widget.borderWidth}px`);
		root.style.setProperty('--widget-border-style', 'solid');
		root.style.setProperty('--widget-blur', `${design.widget.blur}px`);
		if (design.widget.borderImage) {
			root.style.setProperty('--widget-border-image', `url("${design.widget.borderImage}")`);
			root.style.setProperty('--widget-border-image-type', design.widget.borderImageType || 'full');
		} else {
			root.style.removeProperty('--widget-border-image');
			root.style.removeProperty('--widget-border-image-type');
		}
		
		// 카드 디자인 변수
		root.style.setProperty('--card-bg', design.card.background);
		root.style.setProperty('--card-border-color', design.card.borderColor);
		root.style.setProperty('--card-border-active', design.card.borderActiveColor);
		root.style.setProperty('--card-border-radius', `${design.card.borderRadius}px`);
		root.style.setProperty('--card-border-style', 'solid');
		root.style.setProperty('--card-shadow', design.card.boxShadow);
		root.style.setProperty('--card-translate-y', `${design.card.translateY}px`);
		root.style.setProperty('--card-blur', `${design.card.blur}px`);
	};

	useEffect(() => {
		if (design && general) {
			// DOM이 준비되면 즉시 CSS 변수 설정
			setCSSVariables(design, general);
			
			// 보더 이미지 적용
			if (design.widget.borderImage) {
				const widgetWrappers = document.querySelectorAll('.widget-wrapper');
				widgetWrappers.forEach((wrapper) => {
					const element = wrapper as HTMLElement;
					
					// 기존 코너 요소 제거
					const existingCorners = element.querySelectorAll('.widget-corner-image');
					existingCorners.forEach((corner) => corner.remove());
					
					if (design.widget.borderImageType === 'corner') {
						element.setAttribute('data-border-image-type', 'corner');
						// 코너 이미지 적용 (4개 코너 모두)
						element.style.setProperty('--widget-corner-image', `url("${design.widget.borderImage}")`);
						
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
						element.style.borderImage = `url("${design.widget.borderImage}") ${design.widget.borderWidth} fill`;
						element.style.borderImageSlice = `${design.widget.borderWidth}`;
					}
				});
			} else {
				// 보더 이미지 제거
				const widgetWrappers = document.querySelectorAll('.widget-wrapper');
				widgetWrappers.forEach((wrapper) => {
					const element = wrapper as HTMLElement;
					element.removeAttribute('data-border-image-type');
					element.style.borderImage = '';
					element.style.borderImageSlice = '';
					element.style.removeProperty('--widget-corner-image');
					
					// 코너 요소 제거
					const corners = element.querySelectorAll('.widget-corner-image');
					corners.forEach((corner) => corner.remove());
				});
			}
		}
	}, [design, general]);

	useEffect(() => {
		if (typeof window !== "undefined") {
			syncFontAssets(fontRegistry);
		}
	}, [fontRegistry]);

	// 초기 로딩 시 즉시 적용 (hydration 전에)
	useEffect(() => {
		if (typeof window !== 'undefined' && design && general) {
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

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// 테마 컨텍스트 사용을 위한 커스텀 훅
export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
