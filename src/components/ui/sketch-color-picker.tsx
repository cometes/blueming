"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";

// react-color SketchPicker 대체 자체 구현.
// 소비처 호환을 위해 onChange 결과 형태({ hex, rgb })와 props 이름을 동일하게 유지한다.

export interface ColorResult {
	hex: string;
	rgb: { r: number; g: number; b: number; a: number };
}

interface SketchColorPickerProps {
	color: string;
	onChange?: (color: ColorResult) => void;
	onChangeComplete?: (color: ColorResult) => void;
	width?: string;
	presetColors?: string[];
	className?: string;
}

// react-color SketchPicker의 기본 프리셋과 동일
const DEFAULT_PRESETS = [
	"#D0021B", "#F5A623", "#F8E71C", "#8B572A", "#7ED321",
	"#417505", "#BD10E0", "#9013FE", "#4A90E2", "#50E3C2",
	"#B8E986", "#000000", "#4A4A4A", "#9B9B9B", "#FFFFFF",
];

type Hsv = { h: number; s: number; v: number };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const rgbToHex = (r: number, g: number, b: number) =>
	`#${[r, g, b]
		.map((v) => Math.round(v).toString(16).padStart(2, "0"))
		.join("")}`;

const hsvToRgb = ({ h, s, v }: Hsv) => {
	const i = Math.floor(h / 60) % 6;
	const f = h / 60 - Math.floor(h / 60);
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);
	const pick = [
		[v, t, p],
		[q, v, p],
		[p, v, t],
		[p, q, v],
		[t, p, v],
		[v, p, q],
	][i];
	return { r: pick[0] * 255, g: pick[1] * 255, b: pick[2] * 255 };
};

const rgbToHsv = (r: number, g: number, b: number): Hsv => {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const d = max - min;
	let h = 0;
	if (d !== 0) {
		if (max === rn) h = 60 * (((gn - bn) / d) % 6);
		else if (max === gn) h = 60 * ((bn - rn) / d + 2);
		else h = 60 * ((rn - gn) / d + 4);
	}
	if (h < 0) h += 360;
	return { h, s: max === 0 ? 0 : d / max, v: max };
};

/** hex(#rgb/#rrggbb/#rrggbbaa) 또는 rgba() 문자열 파싱. 실패 시 null */
const parseColor = (
	value: string,
): { r: number; g: number; b: number; a: number } | null => {
	const v = value.trim();
	const hexMatch = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
	if (hexMatch) {
		let hex = hexMatch[1];
		if (hex.length === 3) {
			hex = hex
				.split("")
				.map((c) => c + c)
				.join("");
		}
		const num = parseInt(hex.slice(0, 6), 16);
		const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
		return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255, a };
	}
	const rgbaMatch = v.match(
		/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i,
	);
	if (rgbaMatch) {
		return {
			r: Number(rgbaMatch[1]),
			g: Number(rgbaMatch[2]),
			b: Number(rgbaMatch[3]),
			a: rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1,
		};
	}
	return null;
};

/** 드래그 가능한 영역: pointer 위치를 0~1 비율로 콜백 */
const useDragArea = (
	onMove: (x: number, y: number) => void,
	onEnd?: () => void,
) => {
	const ref = useRef<HTMLDivElement>(null);
	const onEndRef = useRef(onEnd);
	onEndRef.current = onEnd;
	const onMoveRef = useRef(onMove);
	onMoveRef.current = onMove;

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		const el = ref.current;
		if (!el) return;
		e.preventDefault();
		const update = (clientX: number, clientY: number) => {
			const rect = el.getBoundingClientRect();
			onMoveRef.current(
				clamp01((clientX - rect.left) / rect.width),
				clamp01((clientY - rect.top) / rect.height),
			);
		};
		update(e.clientX, e.clientY);
		const move = (ev: PointerEvent) => update(ev.clientX, ev.clientY);
		const up = () => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			onEndRef.current?.();
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	}, []);

	return { ref, handlePointerDown };
};

const CHECKERBOARD =
	"repeating-conic-gradient(#cccccc 0% 25%, #ffffff 0% 50%) 0 0 / 12px 12px";

export function SketchColorPicker({
	color,
	onChange,
	onChangeComplete,
	width = "224px",
	presetColors = DEFAULT_PRESETS,
	className,
}: SketchColorPickerProps) {
	const [hsv, setHsv] = useState<Hsv>({ h: 0, s: 0, v: 0 });
	const [alpha, setAlpha] = useState(1);
	const [hexInput, setHexInput] = useState("");
	const lastEmittedRef = useRef<string>("");

	const toResult = useCallback((nextHsv: Hsv, nextAlpha: number): ColorResult => {
		const { r, g, b } = hsvToRgb(nextHsv);
		return {
			hex: rgbToHex(r, g, b),
			rgb: {
				r: Math.round(r),
				g: Math.round(g),
				b: Math.round(b),
				a: nextAlpha,
			},
		};
	}, []);

	// 외부 color prop 동기화 (자신이 방금 emit한 값은 무시해 드래그 중 되돌림 방지)
	useEffect(() => {
		if (color === lastEmittedRef.current) return;
		const parsed = parseColor(color);
		if (!parsed) return;
		setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b));
		setAlpha(parsed.a);
		setHexInput(rgbToHex(parsed.r, parsed.g, parsed.b).replace("#", ""));
	}, [color]);

	const emit = useCallback(
		(nextHsv: Hsv, nextAlpha: number, complete = false) => {
			const result = toResult(nextHsv, nextAlpha);
			lastEmittedRef.current = result.hex;
			setHexInput(result.hex.replace("#", ""));
			onChange?.(result);
			if (complete) onChangeComplete?.(result);
		},
		[onChange, onChangeComplete, toResult],
	);

	// 드래그 콜백에서 최신 상태를 읽기 위한 ref
	const hsvRef = useRef(hsv);
	hsvRef.current = hsv;
	const alphaRef = useRef(alpha);
	alphaRef.current = alpha;

	const emitComplete = useCallback(
		() => emit(hsvRef.current, alphaRef.current, true),
		[emit],
	);

	const saturation = useDragArea((x, y) => {
		const next = { ...hsvRef.current, s: x, v: 1 - y };
		setHsv(next);
		emit(next, alphaRef.current);
	}, emitComplete);

	const hue = useDragArea((x) => {
		const next = { ...hsvRef.current, h: Math.min(359.9, x * 360) };
		setHsv(next);
		emit(next, alphaRef.current);
	}, emitComplete);

	const alphaSlider = useDragArea((x) => {
		const next = Math.round(x * 100) / 100;
		setAlpha(next);
		emit(hsvRef.current, next);
	}, emitComplete);

	const applyHexInput = () => {
		const parsed = parseColor(`#${hexInput.replace(/^#/, "")}`);
		if (!parsed) {
			setHexInput(toResult(hsv, alpha).hex.replace("#", ""));
			return;
		}
		const nextHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
		setHsv(nextHsv);
		emit(nextHsv, alpha, true);
	};

	const applyPreset = (preset: string) => {
		const parsed = parseColor(preset);
		if (!parsed) return;
		const nextHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
		setHsv(nextHsv);
		setAlpha(parsed.a);
		emit(nextHsv, parsed.a, true);
	};

	const { r, g, b } = hsvToRgb(hsv);
	const currentHex = rgbToHex(r, g, b);
	const hueColor = `hsl(${hsv.h}, 100%, 50%)`;

	return (
		<div
			className={cn(
				"sketch-color-picker rounded-card border border-card bg-card p-3 space-y-3",
				className,
			)}
			style={{ width }}
		>
			{/* 채도/명도 영역 */}
			<div
				ref={saturation.ref}
				onPointerDown={saturation.handlePointerDown}
				className="relative h-36 w-full cursor-crosshair rounded-md touch-none"
				style={{
					background: `linear-gradient(0deg, #000, transparent), linear-gradient(90deg, #fff, transparent), ${hueColor}`,
				}}
			>
				<div
					className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_2px_rgba(0,0,0,0.6)]"
					style={{
						left: `${hsv.s * 100}%`,
						top: `${(1 - hsv.v) * 100}%`,
						backgroundColor: currentHex,
					}}
				/>
			</div>

			<div className="flex items-center gap-3">
				<div className="flex-1 space-y-2">
					{/* 색상(Hue) 슬라이더 */}
					<div
						ref={hue.ref}
						onPointerDown={hue.handlePointerDown}
						className="relative h-3 w-full cursor-pointer rounded-full touch-none"
						style={{
							background:
								"linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
						}}
					>
						<div
							className="absolute top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-gray-300 bg-white shadow"
							style={{ left: `${(hsv.h / 360) * 100}%` }}
						/>
					</div>
					{/* 투명도 슬라이더 */}
					<div
						ref={alphaSlider.ref}
						onPointerDown={alphaSlider.handlePointerDown}
						className="relative h-3 w-full cursor-pointer rounded-full touch-none overflow-hidden"
						style={{ background: CHECKERBOARD }}
					>
						<div
							className="absolute inset-0"
							style={{
								background: `linear-gradient(90deg, transparent, ${currentHex})`,
							}}
						/>
						<div
							className="absolute top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-gray-300 bg-white shadow"
							style={{ left: `${alpha * 100}%` }}
						/>
					</div>
				</div>
				{/* 현재 색 미리보기 */}
				<div
					className="h-8 w-8 flex-none rounded-md border border-card overflow-hidden"
					style={{ background: CHECKERBOARD }}
				>
					<div
						className="h-full w-full"
						style={{ backgroundColor: `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})` }}
					/>
				</div>
			</div>

			{/* HEX 입력 */}
			<div className="flex items-center gap-2">
				<span className="text-xs text-sub-text">HEX</span>
				<input
					type="text"
					value={hexInput}
					onChange={(e) => setHexInput(e.target.value)}
					onBlur={applyHexInput}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							applyHexInput();
						}
					}}
					spellCheck={false}
					className="h-7 w-full min-w-0 rounded-md border border-card bg-card-bg px-2 text-xs text-main-text focus:outline-none focus:border-theme-primary"
				/>
				<span className="text-xs text-sub-text">A</span>
				<input
					type="number"
					min={0}
					max={1}
					step={0.01}
					value={alpha}
					onChange={(e) => {
						const next = clamp01(Number(e.target.value));
						setAlpha(next);
						emit(hsv, next, true);
					}}
					className="h-7 w-14 rounded-md border border-card bg-card-bg px-1.5 text-xs text-main-text focus:outline-none focus:border-theme-primary"
				/>
			</div>

			{/* 프리셋 */}
			{presetColors.length > 0 && (
				<div className="flex flex-wrap gap-1.5 border-t border-card pt-2">
					{presetColors.map((preset) => (
						<button
							key={preset}
							type="button"
							onClick={() => applyPreset(preset)}
							className="rounded-sm border border-black/10"
							style={{ backgroundColor: preset, width: 18, height: 18 }}
							aria-label={preset}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default SketchColorPicker;
