import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 색상을 RGB 값으로 파싱
 */
function parseColor(color: string): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0;

  // RGB/RGBA 형식: rgb(124, 149, 231) 또는 rgba(124, 149, 231, 1)
  if (color.startsWith('rgb')) {
    const matches = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (matches) {
      r = parseInt(matches[1]);
      g = parseInt(matches[2]);
      b = parseInt(matches[3]);
    }
  }
  // HEX 형식: #RGB 또는 #RRGGBB
  else if (color.startsWith('#')) {
    if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else if (color.length === 7) {
      r = parseInt(color[1] + color[2], 16);
      g = parseInt(color[3] + color[4], 16);
      b = parseInt(color[5] + color[6], 16);
    }
  }

  return { r, g, b };
}

/**
 * HEX 또는 RGB 색상을 HSL로 변환
 */
function colorToHSL(color: string): { h: number; s: number; l: number } {
  // 색상 파싱
  let { r, g, b } = parseColor(color);

  // RGB를 0-1 범위로 정규화
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  // 반올림하지 않고 정확한 값을 유지
  return {
    h: h * 360,
    s: s * 100,
    l: l * 100
  };
}

/**
 * HSL을 HEX 색상으로 변환
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 기본 색상을 기반으로 밝은 색상 생성
 * @param color - 기본 색상 (HEX 또는 RGB 형식)
 * @param amount - 밝기 증가량 (0-100, 기본값: 30)
 */
export function getLighterColor(color: string, amount: number = 30): string {
  const hsl = colorToHSL(color);
  const newL = Math.min(100, hsl.l + amount);
  return hslToHex(hsl.h, hsl.s, newL);
}

/**
 * 기본 색상을 기반으로 어두운 색상 생성
 * @param color - 기본 색상 (HEX 또는 RGB 형식)
 * @param amount - 어둡기 증가량 (0-100, 기본값: 30)
 */
export function getDarkerColor(color: string, amount: number = 30): string {
  const hsl = colorToHSL(color);
  const newL = Math.max(0, hsl.l - amount);
  return hslToHex(hsl.h, hsl.s, newL);
}

/**
 * 기본 색상을 기반으로 색상 팔레트 생성 (밝은색, 원본, 어두운색)
 * @param color - 기본 색상 (HEX 또는 RGB 형식)
 * @returns light, base, dark 3가지 색상
 */
export function generateColorPalette(color: string) {
  const hsl = colorToHSL(color);

  // 명도를 15% 조정 (채도는 유지)
  const lighterL = Math.min(hsl.l + 15, 95);
  const darkerL = Math.max(hsl.l - 15, 10);

  return {
    light: hslToHex(hsl.h, hsl.s, lighterL),
    base: hslToHex(hsl.h, hsl.s, hsl.l),
    dark: hslToHex(hsl.h, hsl.s, darkerL),
  };
}
