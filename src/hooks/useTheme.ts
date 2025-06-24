import { useContext } from 'react';
import { ThemeContext } from '@/providers/ThemeProvider';

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 테마 클래스를 생성하는 유틸리티 함수들
export const getThemeClasses = {
  // 배경 관련
  background: () => 'bg-theme-bg bg-theme bg-cover bg-center bg-no-repeat',
  
  // 위젯 관련
  widget: () => 'bg-widget border-widget border-widget rounded-widget backdrop-blur-widget',
  
  // 카드 관련  
  card: () => 'bg-card border-card-border hover:border-card-border-active rounded-card shadow-card transform hover:-translate-card-y transition-all duration-200',
  
  // 텍스트 관련
  mainText: () => 'text-main-text font-body',
  subText: () => 'text-sub-text font-body',
  title: () => 'text-main-text font-title',
  
  // 색상 관련
  primary: () => 'text-primary',
  secondary: () => 'text-secondary',
  primaryBg: () => 'bg-primary',
  secondaryBg: () => 'bg-secondary',
};

// 개별 CSS 변수에 접근하는 함수
export const getThemeValue = (property: string): string => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(property)
      .trim();
  }
  return '';
};

// 자주 사용되는 테마 값들을 쉽게 가져오는 함수들
export const getThemeValues = () => ({
  primaryColor: getThemeValue('--primary-color'),
  secondaryColor: getThemeValue('--secondary-color'),
  mainTextColor: getThemeValue('--color-main'),
  subTextColor: getThemeValue('--color-sub'),
  backgroundColor: getThemeValue('--bg-color'),
  backgroundImage: getThemeValue('--bg-image'),
  bodyFont: getThemeValue('--font-body'),
  titleFont: getThemeValue('--font-title'),
});