"use client";

import { useEffect, useState } from 'react';

export default function ThemeLoader({ children }: { children: React.ReactNode }) {
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    // 테마가 로드되었는지 확인
    const checkThemeLoaded = () => {
      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color')
        .trim();

      // 기본값이 아닌 실제 API 데이터가 적용되었는지 확인
      if (primaryColor && primaryColor !== '#007bff') {
        setIsThemeLoaded(true);
      } else {
        // 100ms 후 다시 확인
        setTimeout(checkThemeLoaded, 100);
      }
    };

    // 초기 확인
    setTimeout(checkThemeLoaded, 50);
  }, []);

  // 테마가 로드되지 않았으면 기본 스타일로 표시
  if (!isThemeLoaded) {
    return (
      <div style={{
        opacity: 0,
        transition: 'opacity 0.3s ease',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-color, #ffffff)',
        color: 'var(--color-main, #333333)'
      }}>
        {children}
      </div>
    );
  }

  // 테마가 로드되면 부드럽게 표시
  return (
    <div style={{
      opacity: 1,
      transition: 'opacity 0.3s ease'
    }}>
      {children}
    </div>
  );
}