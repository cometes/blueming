// providers/ThemeProvider.tsx
"use client";

import { useSettings } from "@/contexts/SettingsContext";
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
		root.style.setProperty('--widget-blur', `${design.widget.blur}px`);
		
		// 카드 디자인 변수
		root.style.setProperty('--card-bg', design.card.background);
		root.style.setProperty('--card-border-color', design.card.borderColor);
		root.style.setProperty('--card-border-active', design.card.borderActiveColor);
		root.style.setProperty('--card-border-radius', `${design.card.borderRadius}px`);
		root.style.setProperty('--card-shadow', design.card.boxShadow);
		root.style.setProperty('--card-translate-y', `${design.card.translateY}px`);
	};

	useEffect(() => {
		if (design && general) {
			// DOM이 준비되면 즉시 CSS 변수 설정
			setCSSVariables(design, general);
		}
	}, [design, general]);

	// 초기 로딩 시 즉시 적용 (hydration 전에)
	useEffect(() => {
		if (typeof window !== 'undefined' && design && general) {
			// requestAnimationFrame을 사용해 렌더링 최적화
			requestAnimationFrame(() => {
				setCSSVariables(design, general);
			});
		}
	}, []);

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
